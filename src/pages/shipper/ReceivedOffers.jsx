import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { DataTable } from '../../components/common/DataTable';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriceBlock } from '../../components/common/PriceBlock';
import { shipmentService, offerService } from '../../services/api';
import { OfferStatus } from '../../constants/enums';
import { Loader } from '../../components/common/Loader';
import { formatAmount, formatRating, truckTypeLabel } from '../../utils/format';
import { toArabicError } from '../../utils/errors';

/** Live: new offers, counters and the assignment appear without a refresh. */
export const ReceivedOffers = () => {
    const { shipmentId } = useParams();
    const navigate = useNavigate();
    const [shipment, setShipment] = useState(undefined); // undefined = loading
    const [offers, setOffers] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!shipmentId) return undefined;
        const onError = (err) => setError(toArabicError(err));
        const unsubscribers = [
            shipmentService.subscribe(shipmentId, setShipment, onError),
            offerService.subscribeOffersForShipment(shipmentId, setOffers, onError),
        ];
        return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
    }, [shipmentId]);

    if (shipment === undefined || offers === null)
        return error ? <div role="alert">{error}</div> : <Loader label="جاري تحميل العروض" />;
    if (!shipment)
        return <div>الشحنة غير موجودة</div>;

    const columns = [
        { key: 'carrier', header: 'الناقل', render: (o) => (<div>
        <div style={{ fontWeight: 700 }}>{o.carrierName}</div>
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
          ⭐ {formatRating(o.carrierRating, o.carrierCompletedTrips)} | {truckTypeLabel(o.carrierTruckType)}
        </div>
      </div>) },
        { key: 'price', header: 'السعر المعروض', render: (o) => <PriceBlock amount={o.offeredPrice}/> },
        { key: 'status', header: 'الحالة', render: (o) => <StatusBadge status={o.status}/> },
        { key: 'time', header: 'وقت التقديم', render: (o) => <span dir="ltr">{new Date(o.submittedAt).toLocaleString('ar-SA')}</span> },
        {
            key: 'actions',
            header: 'الإجراء',
            render: (o) => (<div style={{ display: 'flex', gap: 8 }}>
          {o.status === OfferStatus.ACCEPTED && shipment.tripId ? (
            <Button size="sm" onClick={() => navigate(`/app/trips/${shipment.tripId}/track`)}>عرض الرحلة</Button>
          ) : (
            <Button size="sm" variant={o.status === OfferStatus.PENDING ? 'primary' : 'outline'} onClick={() => navigate(`/app/shipments/${shipment.id}/negotiation/${o.id}`)}>
              {o.status === OfferStatus.PENDING && o.proposedBy === 'CARRIER' ? 'الرد على العرض' : 'فتح التفاوض'}
            </Button>
          )}
        </div>)
        },
    ];
    return (<div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>العروض المستلمة: {shipment.pickupCity} ← {shipment.deliveryCity}</h2>
        <Button variant="outline" onClick={() => navigate(`/app/shipments/${shipment.id}`)}>تفاصيل الشحنة</Button>
      </div>

      {shipment.tripId && (
        <div role="status" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', padding: '14px 18px', borderRadius: 12, backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid var(--color-success)' }}>
          <span style={{ fontWeight: 700, color: 'var(--color-success)' }}>
            تم إسناد الشحنة{shipment.finalPrice ? ` — ${formatAmount(shipment.finalPrice)} ر.س` : ''}
          </span>
          <Button onClick={() => navigate(`/app/trips/${shipment.tripId}/track`)}>عرض الرحلة</Button>
        </div>
      )}

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
              <strong>{truckTypeLabel(shipment.requiredTruckType)}</strong>
            </div>
          </div>
          <div style={{ textAlign: 'left' }}>
            <div className="text-helper" style={{ color: 'rgba(255,255,255,0.7)' }}>السعر المقترح</div>
            <strong style={{ fontSize: 20 }}>{formatAmount(shipment.proposedPrice)} ر.س</strong>
          </div>
        </div>
      </Card>

      {error && <div role="alert" style={{ color: 'var(--color-error)', fontSize: 13 }}>{error}</div>}

      <Card>
        <DataTable data={offers} columns={columns} keyExtractor={(o) => o.id} emptyMessage="لا توجد عروض حتى الآن"/>
      </Card>
    </div>);
};
