import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { PriceBlock } from '../../components/common/PriceBlock';
import { shipmentService, offerService } from '../../services/api';
import { UserRole } from '../../constants/enums';
import { formatTime, formatDate } from '../../utils/format';
export const Negotiation = () => {
    const { shipmentId, offerId } = useParams();
    const navigate = useNavigate();
    const [shipment, setShipment] = useState(null);
    const [offer, setOffer] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [counterAmount, setCounterAmount] = useState('');
    // Mock negotiation history
    const [history, setHistory] = useState([]);
    useEffect(() => {
        if (shipmentId && offerId) {
            Promise.all([
                shipmentService.getShipmentById(shipmentId),
                offerService.getOffersForShipment(shipmentId).then(offers => offers.find(o => o.id === offerId))
            ])
                .then(([s, o]) => {
                setShipment(s);
                if (o) {
                    setOffer(o);
                    // Seed mock history
                    setHistory([
                        { id: '1', offerId, amount: s.proposedPrice, senderRole: UserRole.SHIPPER, timestamp: s.createdAt },
                        { id: '2', offerId, amount: o.offeredPrice, senderRole: UserRole.CARRIER, timestamp: o.submittedAt }
                    ]);
                }
            })
                .finally(() => setIsLoading(false));
        }
    }, [shipmentId, offerId]);
    const handleCounter = () => {
        if (!counterAmount)
            return;
        const newEntry = {
            id: Date.now().toString(),
            offerId: offer.id,
            amount: Number(counterAmount),
            senderRole: UserRole.SHIPPER,
            timestamp: new Date().toISOString()
        };
        setHistory([...history, newEntry]);
        setCounterAmount('');
        // Simulate carrier responding after 2 seconds
        setTimeout(() => {
            const carrierCounter = Number(counterAmount) - 50; // Just mock logic
            setHistory(prev => [...prev, {
                    id: Date.now().toString(),
                    offerId: offer.id,
                    amount: carrierCounter,
                    senderRole: UserRole.CARRIER,
                    timestamp: new Date().toISOString()
                }]);
        }, 2000);
    };
    const handleAccept = async () => {
        setIsLoading(true);
        const lastOffer = history[history.length - 1];
        try {
            await offerService.acceptOffer(offer.id, lastOffer.amount);
            alert(`تم الاتفاق على السعر النهائي — ${lastOffer.amount} ر.س\nتأكيد وإسناد الشحنة للناقل`);
            navigate(`/app`); // Redirect to dashboard
        } catch (error) {
            console.error('Failed to accept offer:', error);
            setIsLoading(false);
        }
    };
    if (isLoading)
        return <div>جاري التحميل...</div>;
    if (!shipment || !offer)
        return <div>البيانات غير موجودة</div>;
    const currentPrice = history[history.length - 1].amount;
    return (<div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0 }}>التفاوض مع {offer.carrierName}</h2>
          <span className="text-helper">شحنة رقم {shipment.id}</span>
        </div>
        <Button variant="outline" onClick={() => navigate(`/app/shipments/${shipment.id}/offers`)}>عودة للعروض</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <Card style={{ display: 'flex', flexDirection: 'column', height: '600px' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {history.map((entry, idx) => {
            const isShipper = entry.senderRole === UserRole.SHIPPER;
            return (<div key={entry.id} style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isShipper ? 'flex-start' : 'flex-end'
                }}>
                  <div style={{
                    backgroundColor: isShipper ? 'var(--color-background)' : 'var(--color-primary)',
                    color: isShipper ? 'var(--color-text-primary)' : 'white',
                    padding: '12px 24px',
                    borderRadius: isShipper ? '16px 16px 16px 4px' : '16px 16px 4px 16px',
                    border: isShipper ? '1px solid var(--color-border)' : 'none'
                }}>
                    <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 4 }}>
                      {isShipper ? 'أنت (صاحب الشحنة)' : offer.carrierName}
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
          </div>

          <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--color-border)', display: 'flex', gap: 12, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <Input type="number" placeholder="أدخل السعر المضاد..." value={counterAmount} onChange={e => setCounterAmount(e.target.value)} style={{ marginBottom: 0 }}/>
            </div>
            <Button variant="secondary" onClick={handleCounter}>إرسال العرض</Button>
          </div>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Card>
            <h3 style={{ marginBottom: 16 }}>تفاصيل الناقل</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><strong>الاسم:</strong> {offer.carrierName}</div>
              <div><strong>التقييم:</strong> ⭐ {offer.carrierRating}</div>
              <div><strong>الشاحنة:</strong> {offer.carrierTruckType}</div>
            </div>
          </Card>
          
          <Card>
            <h3 style={{ marginBottom: 16 }}>اتخاذ قرار</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <PriceBlock label="السعر الحالي المطروح" amount={currentPrice} size="lg"/>
              <Button style={{ marginTop: 16 }} onClick={handleAccept}>قبول العرض وإسناد الشحنة</Button>
              <Button variant="danger" onClick={() => navigate(`/app/shipments/${shipment.id}/offers`)}>رفض وإنهاء التفاوض</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>);
};
