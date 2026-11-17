import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Loader } from '../common/Loader';
import { tripService, walletService } from '../../services/api';
import { formatMoney } from '../../utils/format';
import { toUserMessage } from '../../utils/errors';
import { useT } from '../../i18n';

const round2 = (n) => Math.round(n * 100) / 100;

/**
 * The money a cancellation will move, worked out exactly the way the backend
 * does it (hemooltak-backend/functions/src/cancellation.ts):
 *  - the fee is agreedPrice × commissionPercent / 100, rounded to 2 places;
 *  - shipper: the whole hold is released, then the fee is charged — so the
 *    available balance rises by price − fee;
 *  - carrier: the fee comes out of their available balance, any shortfall
 *    becomes debt, and a warning is added.
 */
const previewCancellation = ({ role, price, commissionPercent, available }) => {
    const commission = round2((price * commissionPercent) / 100);
    // A shipper pays from their balance with this trip's hold already released.
    const payerAvailable = role === 'SHIPPER' ? available + price : available;
    const paid = round2(Math.max(0, Math.min(payerAvailable, commission)));
    return { commission, paid, addedToDebt: round2(commission - paid), returned: round2(price - paid) };
};

/**
 * Confirm-before / explain-after for cancelling an assigned trip. Shows the
 * exact amounts first, then the backend's actual result with the same lines.
 */
export const CancelTripModal = ({ isOpen, onClose, trip, role, user }) => {
    const [preview, setPreview] = useState(null);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [isCancelling, setIsCancelling] = useState(false);
    const isShipper = role === 'SHIPPER';
    const { t, rich } = useT();

    // Keyed on the trip's id and price, not the object: the trip is live, and
    // the cancellation itself updates it — that must not reset this dialog.
    const tripKey = trip ? `${trip.id}|${trip.finalPrice}` : '';
    useEffect(() => {
        if (!isOpen) return;
        setPreview(null);
        setResult(null);
        setError('');
        Promise.all([walletService.getPlatformConfig(), walletService.getWallet()])
            .then(([config, wallet]) => {
                // The fee uses the rate fixed on the trip when the offer was
                // accepted; trips from before that have none and use the
                // current rate, exactly as the backend does.
                const commissionPercent = trip.commissionPercent ?? config.commissionPercent;
                if (commissionPercent == null) {
                    setError(t('trips.cancelModal.notConfigured'));
                    return;
                }
                setPreview({
                    ...previewCancellation({ role, price: trip.finalPrice, commissionPercent, available: wallet.available }),
                    warningThreshold: config.warningThreshold,
                });
            })
            .catch((err) => setError(toUserMessage(err)));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, tripKey, role]);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        setError('');
        setIsCancelling(true);
        try {
            const updated = await tripService.cancelTrip(trip.id);
            const r = updated.cancellationResult || {};
            setResult({
                commission: r.commission ?? 0,
                paid: r.commissionPaid ?? 0,
                addedToDebt: r.addedToDebt ?? 0,
                returned: round2((r.releasedReservation ?? 0) - (r.commissionPaid ?? 0)),
                warnings: r.warnings,
                suspended: !!r.suspended,
            });
        } catch (err) {
            setError(toUserMessage(err));
        } finally {
            setIsCancelling(false);
        }
    };

    const nextWarnings = (user?.warnings ?? 0) + 1;

    /** The same lines before and after, so the user can check one against the other. */
    const moneyLines = (m, done) => {
        const when = done ? 'done' : 'preview';
        const money = (amount) => <strong>{formatMoney(amount)}</strong>;
        const warningCount = done && m.warnings != null ? m.warnings : nextWarnings;
        const willSuspend = done ? m.suspended : nextWarnings >= (preview?.warningThreshold ?? Infinity);
        return (
            <ul style={{ margin: 0, paddingInlineStart: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {isShipper ? (
                    <li>{rich(`trips.cancelModal.${when}.shipperFee`, { fee: money(m.commission), returned: money(m.returned) })}</li>
                ) : (
                    <li>{rich(`trips.cancelModal.${when}.carrierFee`, { fee: money(m.commission) })}</li>
                )}
                {m.addedToDebt > 0 && (
                    <li>{rich(`trips.cancelModal.${when}.debt`, { paid: money(m.paid), debt: money(m.addedToDebt) })}</li>
                )}
                {!isShipper && (
                    <li>
                        {t(`trips.cancelModal.${when}.warning`, { count: warningCount, threshold: m.warningThreshold ?? preview?.warningThreshold })}
                        {willSuspend && t('trips.cancelModal.suspendSuffix')}
                    </li>
                )}
                {!isShipper && <li>{t(`trips.cancelModal.${when}.carrierReopen`)}</li>}
                {isShipper && <li>{t(`trips.cancelModal.${when}.shipperEnd`)}</li>}
            </ul>
        );
    };

    return createPortal(
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
            <div style={{ width: 480, maxWidth: '100%' }}>
                <Card>
                    <h3 style={{ marginBottom: 12 }}>{result ? t('trips.cancelModal.doneTitle') : t('trips.cancel')}</h3>

                    {result ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {moneyLines({ ...result, warningThreshold: preview?.warningThreshold }, true)}
                            <Button onClick={onClose}>{t('trips.cancelModal.ok')}</Button>
                        </div>
                    ) : error && !preview ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div role="alert" style={{ color: 'var(--color-error)' }}>{error}</div>
                            <Button variant="outline" onClick={onClose}>{t('common.close')}</Button>
                        </div>
                    ) : !preview ? (
                        <Loader variant="section" label={t('trips.cancelModal.calculating')} />
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {moneyLines(preview, false)}
                            <p className="text-helper" style={{ margin: 0, fontSize: 12 }}>
                                {t('trips.cancelModal.feeExplanation')}
                            </p>
                            {error && <div role="alert" style={{ color: 'var(--color-error)', fontSize: 13 }}>{error}</div>}
                            <div style={{ display: 'flex', gap: 12 }}>
                                <Button variant="danger" style={{ flex: 1 }} onClick={handleConfirm} isLoading={isCancelling}>{t('trips.cancelModal.confirm')}</Button>
                                <Button variant="outline" style={{ flex: 1 }} onClick={onClose} disabled={isCancelling}>{t('trips.cancelModal.goBack')}</Button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </div>,
        document.body
    );
};
