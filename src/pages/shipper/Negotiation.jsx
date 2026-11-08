import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { PriceBlock } from '../../components/common/PriceBlock';
import { shipmentService, offerService, walletService } from '../../services/api';
import { UserRole, OfferStatus } from '../../constants/enums';
import { formatTime, formatDate, formatAmount, formatRating, truckTypeLabel } from '../../utils/format';
import { toArabicError, errorReason } from '../../utils/errors';
import { Loader } from '../../components/common/Loader';
import { InsufficientBalanceNotice } from '../../components/wallet/InsufficientBalanceNotice';

/**
 * One shipper↔carrier negotiation thread — shared by both roles (see
 * NegotiationWrapper) so there's a single source of truth for the offer
 * history instead of two divergent screens. `role` says which side the
 * current viewer is on; everything else (who can counter, who the "you"
 * bubble is) follows from that.
 *
 * The `offerId` route param anchors the thread rather than naming "the"
 * current offer — countering creates a brand-new offer id in the real
 * backend's chain model, so the thread is resolved from whichever historical
 * offer id is in the URL and actions always target the thread's live offer
 * (`offer.id` in state), never the URL param directly.
 *
 * Everything here is live (Firestore listeners): the other side's counter,
 * acceptance or rejection, the shipment's tripId once assigned, and the
 * shipper's balance — no refresh, no polling.
 */
export const Negotiation = ({ role = UserRole.SHIPPER }) => {
    const { shipmentId, offerId } = useParams();
    const navigate = useNavigate();
    const isShipper = role === UserRole.SHIPPER;
    const [shipment, setShipment] = useState(undefined); // undefined = loading, null = gone
    const [offer, setOffer] = useState(undefined);
    const [wallet, setWallet] = useState(null);
    const [counterAmount, setCounterAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    // { required } — the amount the shipper tried to commit to; the notice
    // shows only while the live available balance is still below it.
    const [balanceShortfall, setBalanceShortfall] = useState(null);
    const [acceptedTripId, setAcceptedTripId] = useState(null);

    const backPath = role === UserRole.CARRIER
        ? `/app/shipments/${shipmentId}`
        : `/app/shipments/${shipmentId}/offers`;

    useEffect(() => {
        if (!shipmentId || !offerId) return undefined;
        const onError = (err) => setError(toArabicError(err));
        const unsubscribers = [
            shipmentService.subscribe(shipmentId, setShipment, onError),
            offerService.subscribeThread(shipmentId, offerId, setOffer, onError),
        ];
        if (isShipper) unsubscribers.push(walletService.subscribe(setWallet, () => {}));
        return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
    }, [shipmentId, offerId, isShipper]);

    /** True (and shows the notice) when the shipper's available balance can't cover `amount`. */
    const isShortOfFunds = (amount) => {
        if (!isShipper || !wallet || wallet.available >= amount) return false;
        setBalanceShortfall({ required: amount });
        return true;
    };

    const handleActionError = (err, amount) => {
        if (errorReason(err) === 'INSUFFICIENT_BALANCE') {
            if (isShipper) {
                setBalanceShortfall({ required: err.details?.required ?? amount });
                return;
            }
            // The carrier accepted the shipper's price but the shipper can't
            // cover it right now — that's not the carrier's balance.
            setError('رصيد صاحب الشحنة المتاح لا يغطي هذا السعر حالياً — لم يتم الإسناد. حاول لاحقاً.');
            return;
        }
        setError(toArabicError(err));
    };

    const handleCounter = async () => {
        const amount = Number(counterAmount);
        if (!amount || !offer) return;
        setError('');
        // If the carrier accepts this counter, it's reserved from the
        // shipper's balance on the spot — so it has to be covered now.
        if (isShortOfFunds(amount)) return;
        setIsSubmitting(true);
        try {
            await offerService.counterOffer(shipmentId, offer.id, amount);
            setCounterAmount('');
        } catch (err) {
            handleActionError(err, amount);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAccept = async () => {
        const price = offer.offeredPrice;
        setError('');
        if (isShortOfFunds(price)) return;
        // Funds are reserved (not deducted) from the shipper's available
        // balance the moment this finalizes — say so before committing.
        const confirmText = isShipper
            ? `سيتم حجز ${formatAmount(price)} ر.س من رصيدك المتاح وإسناد الشحنة لهذا الناقل. هل تريد المتابعة؟`
            : `ستُسند إليك الشحنة بسعر ${formatAmount(price)} ر.س. هل تريد المتابعة؟`;
        if (!window.confirm(confirmText)) return;
        setIsSubmitting(true);
        try {
            const res = await offerService.acceptOffer(shipmentId, offer.id);
            setAcceptedTripId(res?.tripId || null);
        } catch (err) {
            handleActionError(err, price);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReject = async () => {
        // Closes only this thread — other carriers' offers stay open, and a
        // rejected carrier may offer again with a new price.
        const reason = window.prompt('رفض العرض وإنهاء هذا التفاوض.\nسبب الرفض (اختياري):', '');
        if (reason === null) return;
        setError('');
        setIsSubmitting(true);
        try {
            await offerService.rejectOffer(shipmentId, offer.id, reason.trim());
            navigate(backPath);
        } catch (err) {
            setError(toArabicError(err));
            setIsSubmitting(false);
        }
    };

    if (shipment === undefined || offer === undefined) return <Loader label="جاري تحميل التفاوض" />;
    if (!shipment || !offer) return <div>البيانات غير موجودة</div>;

    const history = offer.history && offer.history.length > 0
        ? offer.history
        : [{ amount: offer.offeredPrice, senderRole: 'CARRIER', timestamp: offer.submittedAt }];
    const currentPrice = offer.offeredPrice;
    const counterpartName = role === UserRole.CARRIER ? 'صاحب الشحنة' : offer.carrierName;
    // It's this viewer's turn only when the live offer was proposed by the
    // OTHER side and it's still open (INTEGRATION.md §9).
    const canRespond = offer.status === OfferStatus.PENDING && offer.proposedBy !== role;
    const isClosed = offer.status !== OfferStatus.PENDING;
    // acceptOffer creates the trip in the same step; the shipment carries its
    // id from then on, so both sides get the button — including the side
    // that didn't press accept, the moment the listener sees it.
    const tripId = offer.status === OfferStatus.ACCEPTED ? (acceptedTripId || shipment.tripId) : null;
    const showShortfall = balanceShortfall && wallet && wallet.available < balanceShortfall.required;

    return (<div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0 }}>التفاوض مع {counterpartName}</h2>
          <span className="text-helper">{shipment.pickupCity} ← {shipment.deliveryCity}</span>
        </div>
        <Button variant="outline" onClick={() => navigate(backPath)}>عودة</Button>
      </div>

      {tripId && (
        <div role="status" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap',
          padding: '16px 20px', borderRadius: 12, backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid var(--color-success)',
        }}>
          <div>
            <div style={{ fontWeight: 700, color: 'var(--color-success)' }}>تم الاتفاق وإسناد الشحنة — {formatAmount(currentPrice)} ر.س</div>
            <div className="text-helper" style={{ fontSize: 13 }}>
              {isShipper ? 'تابع الرحلة من صفحتها: حالة الناقل، صور الإثبات والرسائل.' : 'ابدأ الرحلة من صفحتها وحدّث حالتها في كل مرحلة.'}
            </div>
          </div>
          <Button onClick={() => navigate(`/app/trips/${tripId}/track`)}>عرض الرحلة</Button>
        </div>
      )}

      <div className="responsive-two-col">
        <Card style={{ display: 'flex', flexDirection: 'column', height: '600px' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {history.map((entry, idx) => {
              const isMe = entry.senderRole === role;
              return (<div key={idx} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMe ? 'flex-end' : 'flex-start'
                }}>
                  <div style={{
                    backgroundColor: isMe ? 'var(--color-primary)' : 'var(--color-background)',
                    color: isMe ? 'white' : 'var(--color-text-primary)',
                    padding: '12px 24px',
                    borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    border: isMe ? 'none' : '1px solid var(--color-border)'
                }}>
                    <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 4 }}>
                      {isMe ? 'أنت' : counterpartName}
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 'bold' }} dir="ltr">
                      {formatAmount(entry.amount)} ر.س
                    </div>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
                    {formatDate(entry.timestamp)} - {formatTime(entry.timestamp)}
                  </span>
                </div>);
            })}
            {offer.status === OfferStatus.ACCEPTED && (
              <div style={{ textAlign: 'center', color: 'var(--color-success)', fontWeight: 'bold', padding: 8 }}>
                تم قبول السعر وإسناد الشحنة
              </div>
            )}
            {offer.status === OfferStatus.REJECTED && (
              <div style={{ textAlign: 'center', color: 'var(--color-error)', fontWeight: 'bold', padding: 8 }}>
                تم إغلاق هذا العرض{offer.rejectReason ? ` — ${offer.rejectReason}` : ''}
              </div>
            )}
          </div>

          {!isClosed && (
            <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--color-border)', display: 'flex', gap: 12, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <Input numeric="integer" placeholder="أدخل السعر المضاد" value={counterAmount} onChange={e => { setCounterAmount(e.target.value); setBalanceShortfall(null); }} style={{ marginBottom: 0 }} disabled={!canRespond}/>
              </div>
              <Button variant="secondary" onClick={handleCounter} isLoading={isSubmitting} disabled={!canRespond || !counterAmount}>إرسال العرض</Button>
            </div>
          )}
          {!isClosed && !canRespond && (
            <p className="text-helper" style={{ marginTop: 8, fontSize: 12 }}>بانتظار رد {counterpartName}</p>
          )}
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Card>
            <h3 style={{ marginBottom: 16 }}>{role === UserRole.CARRIER ? 'تفاصيل الشحنة' : 'تفاصيل الناقل'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {role === UserRole.CARRIER ? (<>
                <div><strong>المسار:</strong> {shipment.pickupCity} ← {shipment.deliveryCity}</div>
                <div><strong>البضاعة:</strong> {shipment.cargoType} ({shipment.weight} طن)</div>
              </>) : (<>
                <div><strong>الاسم:</strong> {offer.carrierName}</div>
                <div><strong>التقييم:</strong> ⭐ {formatRating(offer.carrierRating, offer.carrierCompletedTrips)}</div>
                <div><strong>الرحلات المكتملة:</strong> {offer.carrierCompletedTrips ?? 0}</div>
                <div><strong>الشاحنة:</strong> {truckTypeLabel(offer.carrierTruckType)}</div>
              </>)}
            </div>
          </Card>

          {showShortfall && (
            <InsufficientBalanceNotice available={wallet.available} required={balanceShortfall.required} />
          )}

          {error && (
            <div role="alert" style={{ padding: 12, borderRadius: 8, backgroundColor: 'rgba(229,62,62,0.08)', color: 'var(--color-error)', fontSize: 13 }}>
              {error}
            </div>
          )}

          {!isClosed && (
            <Card>
              <h3 style={{ marginBottom: 16 }}>اتخاذ قرار</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <PriceBlock label="السعر الحالي المطروح" amount={currentPrice} size="lg"/>
                {isShipper && wallet && (
                  <div className="text-helper" style={{ fontSize: 13 }}>رصيدك المتاح: {formatAmount(wallet.available)} ر.س</div>
                )}
                <Button style={{ marginTop: 16 }} onClick={handleAccept} isLoading={isSubmitting} disabled={!canRespond}>
                  {isShipper ? 'قبول العرض وإسناد الشحنة' : 'قبول سعر صاحب الشحنة'}
                </Button>
                <Button variant="danger" onClick={handleReject} isLoading={isSubmitting} disabled={!canRespond}>رفض وإنهاء التفاوض</Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>);
};
