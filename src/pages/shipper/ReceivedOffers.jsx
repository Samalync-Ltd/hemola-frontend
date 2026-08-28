import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriceBlock } from '../../components/common/PriceBlock';
import { shipmentService, offerService } from '../../services/api';
import { OfferStatus } from '../../constants/enums';
import { DEMO_MODE } from '../../constants/config';
import { hasSeededDemoOffer, markDemoOfferSeeded } from '../../utils/freshAccount';
import { pickRandomDemoCarrier } from '../../mocks/demoPool';

export const ReceivedOffers = () => {
    const { shipmentId } = useParams();
    const navigate = useNavigate();
    const [shipment, setShipment] = useState(null);
    const [offers, setOffers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        if (shipmentId) {
            Promise.all([
                shipmentService.getShipmentById(shipmentId),
                offerService.getOffersForShipment(shipmentId)
            ])
                .then(([s, o]) => {
                setShipment(s);
                setOffers(o);
            })
                .finally(() => setIsLoading(false));
        }
    }, [shipmentId]);

    // Simulates a carrier discovering and bidding on a shipper's shipment,
    // so this screen isn't just empty forever. Fires at most once per
    // account (see markDemoOfferSeeded) and only while there are genuinely
    // no real offers yet — gated purely on that emptiness (not on how the
    // account got here) so it works whether the account just registered or
    // is a stale/partial session. Gated behind DEMO_MODE; never touches the
    // shipper's own data.
    useEffect(() => {
        if (!DEMO_MODE || hasSeededDemoOffer()) return;
        if (isLoading || !shipment || offers.length > 0) return;

        const timer = setTimeout(async () => {
            const carrier = pickRandomDemoCarrier();
            const variance = 0.92 + Math.random() * 0.16; // ±8% of the suggested price
            const amount = Math.round((shipment.proposedPrice ?? 0) * variance);
            // A real offer record in the mock store (not just local state) —
            // so opening its negotiation thread, or reloading this page,
            // still finds it. See offerService.injectDemoOffer.
            const newOffer = await offerService.injectDemoOffer(shipment.id, {
                carrierName: carrier.name,
                carrierRating: carrier.rating,
                carrierTruckType: carrier.truckType,
                offeredPrice: amount,
            });
            setOffers(prev => prev.length > 0 ? prev : [newOffer]);
            markDemoOfferSeeded();
        }, 8000 + Math.random() * 4000); // 8-12s

        return () => clearTimeout(timer);
    }, [isLoading, shipment, offers.length]);
    if (isLoading)
        return <div>جاري التحميل...</div>;
    if (!shipment)
        return <div>الشحنة غير موجودة</div>;
    const columns = [
        { key: 'carrier', header: 'الناقل', render: (o) => (<div>
        <div style={{ fontWeight: 700 }}>{o.carrierName}</div>
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>⭐ {o.carrierRating} | {o.carrierTruckType}</div>
      </div>) },
        { key: 'price', header: 'السعر المعروض', render: (o) => <PriceBlock amount={o.offeredPrice}/> },
        { key: 'status', header: 'الحالة', render: (o) => <StatusBadge status={o.status}/> },
        { key: 'time', header: 'وقت التقديم', render: (o) => <span dir="ltr">{new Date(o.submittedAt).toLocaleString('ar-SA')}</span> },
        {
            key: 'actions',
            header: 'الإجراء',
            render: (o) => (<div style={{ display: 'flex', gap: 8 }}>
          <Button size="sm" onClick={() => navigate(`/app/shipments/${shipment.id}/negotiation/${o.id}`)}>
            {o.status === OfferStatus.COUNTERED ? 'متابعة التفاوض' : 'فتح التفاوض'}
          </Button>
        </div>)
        },
    ];
    return (<div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>العروض المستلمة: الشحنة {shipment.id}</h2>
        <Button variant="outline" onClick={() => navigate(`/app/shipments/${shipment.id}`)}>تفاصيل الشحنة</Button>
      </div>

      <Card variant="dark">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 24 }}>
            <div>
              <div className="text-helper" style={{ color: 'rgba(255,255,255,0.7)' }}>المسار</div>
              <strong>{shipment.pickupCity} إلى {shipment.deliveryCity}</strong>
            </div>
            <div>
              <div className="text-helper" style={{ color: 'rgba(255,255,255,0.7)' }}>البضاعة</div>
              <strong>{shipment.cargoType} ({shipment.weight} طن)</strong>
            </div>
            <div>
              <div className="text-helper" style={{ color: 'rgba(255,255,255,0.7)' }}>الشاحنة المطلوبة</div>
              <strong>{shipment.requiredTruckType}</strong>
            </div>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div className="text-helper" style={{ color: 'rgba(255,255,255,0.7)' }}>السعر المقترح</div>
            <strong style={{ fontSize: 20 }}>{shipment.proposedPrice} ر.س</strong>
          </div>
        </div>
      </Card>

      <Card>
        <DataTable data={offers} columns={columns} keyExtractor={(o) => o.id} emptyMessage="لا توجد عروض حتى الآن"/>
      </Card>
    </div>);
};
