import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Loader } from '../common/Loader';
import { tripService, walletService } from '../../services/api';
import { formatAmount } from '../../utils/format';
import { toArabicError } from '../../utils/errors';

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
                if (config.commissionPercent == null) {
                    setError('لا يمكن إلغاء الرحلة حالياً — إعدادات رسوم المنصة غير مكتملة. تواصل مع الدعم.');
                    return;
                }
                setPreview({
                    ...previewCancellation({ role, price: trip.finalPrice, commissionPercent: config.commissionPercent, available: wallet.available }),
                    warningThreshold: config.warningThreshold,
                });
            })
            .catch((err) => setError(toArabicError(err)));
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
            setError(toArabicError(err));
        } finally {
            setIsCancelling(false);
        }
    };

    const nextWarnings = (user?.warnings ?? 0) + 1;

    /** The same lines before and after, so the user can check one against the other. */
    const moneyLines = (m, done) => (
        <ul style={{ margin: 0, paddingInlineStart: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {isShipper ? (
                <li>
                    {done ? 'تم خصم' : 'سيتم خصم'} <strong>{formatAmount(m.commission)} ر.س</strong> رسوم إلغاء،
                    {' وإرجاع '}<strong>{formatAmount(m.returned)} ر.س</strong> إلى رصيدك المتاح.
                </li>
            ) : (
                <li>{done ? 'تم خصم' : 'سيتم خصم'} <strong>{formatAmount(m.commission)} ر.س</strong> رسوم إلغاء من رصيدك.</li>
            )}
            {m.addedToDebt > 0 && (
                <li>
                    رصيدك يغطي <strong>{formatAmount(m.paid)} ر.س</strong> فقط —
                    {done ? ' سُجّل' : ' سيُسجّل'} الباقي (<strong>{formatAmount(m.addedToDebt)} ر.س</strong>) كمبلغ مستحق عليك، ولن تتمكن من العمل حتى تسدده.
                </li>
            )}
            {!isShipper && (
                <li>
                    {done ? 'سُجّل' : 'سيُسجّل'} إنذار على حسابك ({done && m.warnings != null ? m.warnings : nextWarnings} من {m.warningThreshold ?? preview?.warningThreshold})
                    {(done ? m.suspended : nextWarnings >= (preview?.warningThreshold ?? Infinity)) && ' — وسيتم إيقاف حسابك عند هذا الإلغاء.'}
                </li>
            )}
            {!isShipper && <li>{done ? 'عادت' : 'ستعود'} الشحنة متاحة لناقلين آخرين، ولن يدفع صاحب الشحنة شيئاً.</li>}
            {isShipper && <li>{done ? 'تم إلغاء' : 'سيتم إلغاء'} الشحنة نهائياً، ولن يحصل الناقل على أي مبلغ.</li>}
        </ul>
    );

    return createPortal(
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
            <div style={{ width: 480, maxWidth: '100%' }}>
                <Card>
                    <h3 style={{ marginBottom: 12 }}>{result ? 'تم إلغاء الرحلة' : 'إلغاء الرحلة'}</h3>

                    {result ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {moneyLines({ ...result, warningThreshold: preview?.warningThreshold }, true)}
                            <Button onClick={onClose}>تم</Button>
                        </div>
                    ) : error && !preview ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div role="alert" style={{ color: 'var(--color-error)' }}>{error}</div>
                            <Button variant="outline" onClick={onClose}>إغلاق</Button>
                        </div>
                    ) : !preview ? (
                        <Loader variant="section" label="جاري حساب رسوم الإلغاء" />
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {moneyLines(preview, false)}
                            <p className="text-helper" style={{ margin: 0, fontSize: 12 }}>
                                تُحتسب رسوم الإلغاء على من يلغي بعد الإسناد، حتى لا يكون الإلغاء أرخص من إتمام الرحلة.
                            </p>
                            {error && <div role="alert" style={{ color: 'var(--color-error)', fontSize: 13 }}>{error}</div>}
                            <div style={{ display: 'flex', gap: 12 }}>
                                <Button variant="danger" style={{ flex: 1 }} onClick={handleConfirm} isLoading={isCancelling}>تأكيد الإلغاء</Button>
                                <Button variant="outline" style={{ flex: 1 }} onClick={onClose} disabled={isCancelling}>تراجع</Button>
                            </div>
                        </div>
                    )}
                </Card>
            </div>
        </div>,
        document.body
    );
};
