import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { PriceBlock } from '../../components/common/PriceBlock';
import { shipmentService, offerService } from '../../services/api';
import { UserRole, OfferStatus, ShipmentStatus } from '../../constants/enums';
import { formatTime, formatDate } from '../../utils/format';

/**
 * One shipper↔carrier negotiation thread — shared by both roles (see
 * NegotiationWrapper) so there's a single source of truth for the offer
 * history instead of two divergent screens. `role` says which side the
 * current viewer is on; everything else (who can counter, who the "you"
 * bubble is) follows from that.
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
                offerService.getOffersForShipment(shipmentId).then(offers => offers.find(o => o.id === offerId))
            ])
                .then(([s, o]) => {
                    setShipment(s);
                    setOffer(o || null);
                })
                .finally(() => setIsLoading(false));
        }
    };

    useEffect(() => { load(); }, [shipmentId, offerId]);

    // While a counter is awaiting the simulated counterpart reply, poll
    // briefly so the reply shows up without a manual refresh.
    useEffect(() => {
        if (!offer || offer.status !== OfferStatus.PENDING) return;
        const poll = setInterval(load, 1200);
        return () => clearInterval(poll);
    }, [offer?.status, offer?.history?.length]);

    const handleCounter = async () => {
        if (!counterAmount || !offer) return;
        setError('');
        setIsSubmitting(true);
        try {
            const updated = await offerService.counterOffer(offer.id, Number(counterAmount), role);
            setOffer(updated);
            setCounterAmount('');
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleAccept = async () => {
        setError('');
        setIsSubmitting(true);
        try {
            // Whichever side currently holds the latest offer/counter-offer
            // (i.e. it's their turn) can accept it, and accepting always
            // finalizes the price and triggers assignment immediately — the
            // same action either party takes, no role-specific behavior and
            // no second "confirm" step waiting on the other side.
            await offerService.acceptOffer(offer.id, offer.offeredPrice);
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
        setIsSubmitting(true);
        try {
            await offerService.rejectOffer(offer.id);
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
    const currentPrice = history[history.length - 1].amount;
    const counterpartName = role === UserRole.CARRIER ? 'صاحب الشحنة' : offer.carrierName;
    // It's this viewer's turn to act on the CURRENT offer only when the
    // last move came from the other side and nothing has been decided yet.
    const lastMoveBy = history[history.length - 1].senderRole;
    const canRespond = offer.status === OfferStatus.PENDING && lastMoveBy !== role;
    // The simulated counterpart (see offerService.counterOffer) can mark an
    // offer ACCEPTED on its own without actually finalizing anything — that
    // represents "the other side agreed to your price," and a real user
    // still has to press Accept themselves to reserve funds and create the
    // trip. So ACCEPTED is only really "done" once the shipment has actually
    // moved to ACTIVE (see offerService.acceptOffer) — until then, whoever's
    // turn it is can still finalize with one click.
    const isFinalized = shipment.status === ShipmentStatus.ACTIVE;
    const canFinalize = canRespond || (offer.status === OfferStatus.ACCEPTED && !isFinalized);
    const isClosed = offer.status === OfferStatus.REJECTED || isFinalized;

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
                تم قبول السعر — بانتظار تأكيد الإسناد
              </div>
            )}
            {offer.status === OfferStatus.REJECTED && (
              <div style={{ textAlign: 'center', color: 'var(--color-error)', fontWeight: 'bold', padding: 8 }}>
                تم رفض العرض وإنهاء التفاوض
              </div>
            )}
          </div>

          {!isClosed && (
            <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--color-border)', display: 'flex', gap: 12, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <Input type="number" placeholder="أدخل السعر المضاد..." value={counterAmount} onChange={e => setCounterAmount(e.target.value)} style={{ marginBottom: 0 }}/>
              </div>
              <Button variant="secondary" onClick={handleCounter} isLoading={isSubmitting}>إرسال العرض</Button>
            </div>
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
                <div><strong>التقييم:</strong> ⭐ {offer.carrierRating}</div>
                <div><strong>الشاحنة:</strong> {offer.carrierTruckType}</div>
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
                <Button style={{ marginTop: 16 }} onClick={handleAccept} isLoading={isSubmitting} disabled={!canFinalize}>
                  {role === UserRole.SHIPPER ? 'قبول العرض وإسناد الشحنة' : 'قبول سعر صاحب الشحنة'}
                </Button>
                <Button variant="danger" onClick={handleReject} isLoading={isSubmitting} disabled={!canFinalize}>رفض وإنهاء التفاوض</Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>);
};
