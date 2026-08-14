import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriceBlock } from '../../components/common/PriceBlock';
import { shipmentService, offerService } from '../../services/api';
import { OfferStatus } from '../../constants/enums';
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
