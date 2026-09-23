import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { PriceBlock } from '../../components/common/PriceBlock';
import { shipmentService, offerService } from '../../services/api';
import { UserRole, OfferStatus, TruckTypeAr } from '../../constants/enums';
import { formatTime, formatDate } from '../../utils/format';

/**
 * One shipper↔carrier negotiation thread — shared by both roles (see
 * NegotiationWrapper) so there's a single source of truth for the offer
 * history instead of two divergent screens. `role` says which side the
 * current viewer is on; everything else (who can counter, who the "you"
 * bubble is) follows from that.
 *
 * The `offerId` route param anchors the thread rather than naming "the"
 * current offer — countering creates a brand-new offer id in the real
 * backend's chain model, so every reload resolves the WHOLE thread from
 * whichever historical offer id is in the URL (see
 * offerService.getThreadContainingOffer) and always acts on the thread's
 * current live offer (`offer.id` in state), never the URL param directly.
 */
export const Negotiation = ({ role = UserRole.SHIPPER }) => {
    const { shipmentId, offerId } = useParams();
    const navigate = useNavigate();
    const [shipment, setShipment] = useState(null);
    const [offer, setOffer] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [counterAmount, setCounterAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const backPath = role === UserRole.CARRIER
        ? `/app/shipments/${shipmentId}`
        : `/app/shipments/${shipmentId}/offers`;

    const load = () => {
        if (shipmentId && offerId) {
            Promise.all([
                shipmentService.getShipmentById(shipmentId),
                offerService.getThreadContainingOffer(shipmentId, offerId)
            ])
                .then(([s, o]) => {
                    setShipment(s);
                    setOffer(o || null);
                })
                .finally(() => setIsLoading(false));
        }
    };

    useEffect(() => { load(); }, [shipmentId, offerId]);

    // While the thread is still open, poll so the other side's response
    // shows up without a manual refresh.
    useEffect(() => {
        if (!offer || offer.status !== OfferStatus.PENDING) return;
        const poll = setInterval(load, 5000);
        return () => clearInterval(poll);
    }, [offer?.status, offer?.id]);

    const handleCounter = async () => {
        if (!counterAmount || !offer) return;
        setError('');
        setIsSubmitting(true);
        try {
            const updated = await offerService.counterOffer(shipmentId, offer.id, Number(counterAmount));
            setOffer(updated);
            setCounterAmount('');
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAccept = async () => {
        // Funds are reserved (not deducted) from the shipper's available
        // balance the moment this finalizes — surface that plainly before
        // committing, so the user isn't surprised by it after the fact.
        if (!window.confirm(`سيتم حجز ${currentPrice} ر.س من رصيد صاحب الشحنة المتاح عند تأكيد هذا السعر. هل تريد المتابعة؟`)) return;
        setError('');
        setIsSubmitting(true);
        try {
            // Whichever side currently holds the latest offer/counter-offer
            // (i.e. it's their turn) can accept it — one atomic function
            // both locks the price and creates the trip in the same step.
            await offerService.acceptOffer(shipmentId, offer.id);
            alert(`تم الاتفاق على السعر النهائي — ${offer.offeredPrice} ر.س\nتم تأكيد وإسناد الشحنة`);
            navigate('/app');
        } catch (err) {
            // Insufficient available balance — mirrors mobile's
            // AcceptOfferOutcome.insufficientBalance: nothing changes.
            setError(err.message);
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
            setError(err.message);
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div>جاري التحميل...</div>;
    if (!shipment || !offer) return <div>البيانات غير موجودة</div>;

    const history = offer.history && offer.history.length > 0
        ? offer.history
        : [{ amount: offer.offeredPrice, senderRole: 'CARRIER', timestamp: offer.submittedAt }];
    const currentPrice = offer.offeredPrice;
    const counterpartName = role === UserRole.CARRIER ? 'صاحب الشحنة' : offer.carrierName;
    // It's this viewer's turn only when the live offer was proposed by the
    // OTHER side and it's still open (INTEGRATION.md §9 — the single most
    // important field in the whole negotiation flow).
    const canRespond = offer.status === OfferStatus.PENDING && offer.proposedBy !== role;
    // acceptOffer is one atomic Cloud Function — the instant status becomes
    // ACCEPTED the shipment is already ACTIVE and the trip already exists,
    // so there is no intermediate "accepted but not yet finalized" state to
    // account for here.
    const isClosed = offer.status !== OfferStatus.PENDING;

    return (<div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0 }}>التفاوض مع {counterpartName}</h2>
          <span className="text-helper">شحنة رقم {shipment.id}</span>
        </div>
        <Button variant="outline" onClick={() => navigate(backPath)}>عودة</Button>
      </div>

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
                      {entry.amount} ر.س
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
                <Input type="number" placeholder="أدخل السعر المضاد..." value={counterAmount} onChange={e => setCounterAmount(e.target.value)} style={{ marginBottom: 0 }} disabled={!canRespond}/>
              </div>
              <Button variant="secondary" onClick={handleCounter} isLoading={isSubmitting} disabled={!canRespond}>إرسال العرض</Button>
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
                <div><strong>المسار:</strong> {shipment.pickupCity} → {shipment.deliveryCity}</div>
                <div><strong>البضاعة:</strong> {shipment.cargoType}</div>
              </>) : (<>
                <div><strong>الاسم:</strong> {offer.carrierName}</div>
                <div><strong>التقييم:</strong> ⭐ {offer.carrierRating ?? '—'}</div>
                <div><strong>الرحلات المكتملة:</strong> {offer.carrierCompletedTrips ?? 0}</div>
                <div><strong>الشاحنة:</strong> {TruckTypeAr[offer.carrierTruckType] || offer.carrierTruckType || '—'}</div>
              </>)}
            </div>
          </Card>

          {error && (
            <div style={{ padding: 12, borderRadius: 8, backgroundColor: 'rgba(229,62,62,0.08)', color: 'var(--color-error)', fontSize: 13 }}>
              {error}
            </div>
          )}

          {!isClosed && (
            <Card>
              <h3 style={{ marginBottom: 16 }}>اتخاذ قرار</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <PriceBlock label="السعر الحالي المطروح" amount={currentPrice} size="lg"/>
                <Button style={{ marginTop: 16 }} onClick={handleAccept} isLoading={isSubmitting} disabled={!canRespond}>
                  {role === UserRole.SHIPPER ? 'قبول العرض وإسناد الشحنة' : 'قبول سعر صاحب الشحنة'}
                </Button>
                <Button variant="danger" onClick={handleReject} isLoading={isSubmitting} disabled={!canRespond}>رفض وإنهاء التفاوض</Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>);
};
