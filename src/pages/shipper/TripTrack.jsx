import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { tripService, shipmentService } from '../../services/api';
import { TripStage as TripStageEnum, TripStageAr } from '../../constants/enums';

const stageOrder = [
    TripStageEnum.ASSIGNED,
    TripStageEnum.PICKUP_ROUTE_EN,
    TripStageEnum.PICKUP_ARRIVED,
    TripStageEnum.LOADED,
    TripStageEnum.DELIVERY_ROUTE_EN,
    TripStageEnum.DELIVERED
];

export const TripTrack = () => {
    const { tripId } = useParams();
    const navigate = useNavigate();
    const [trip, setTrip] = useState(null);
    const [shipment, setShipment] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (tripId) {
            tripService.getTripById(tripId)
                .then(t => {
                    setTrip(t);
                    return shipmentService.getShipmentById(t.shipmentId).catch(() => null);
                })
                .then(s => setShipment(s))
                .finally(() => setIsLoading(false));
        }
    }, [tripId]);

    if (isLoading)
        return <div>جاري التحميل...</div>;
    if (!trip)
        return <div>الرحلة غير موجودة</div>;

    const currentStageIndex = stageOrder.indexOf(trip.currentStage);
    const isDelivered = trip.currentStage === TripStageEnum.DELIVERED;
    
    // Safely generate stages if they don't exist in mock data
    const stagesList = trip.stages || stageOrder.map((stage) => ({
        stage,
        timestamp: stageOrder.indexOf(stage) <= currentStageIndex ? trip.startedAt : null
    }));

    const [pickupCity, deliveryCity] = trip.route.split(' -> ');

    return (<div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 600, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>{trip.shipmentId}</h2>
        <Button variant="outline" size="sm" onClick={() => navigate('/app/trips')}>عودة</Button>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, fontSize: 24 }}>
          {pickupCity}
          <span style={{ color: 'var(--color-accent)' }}>→</span>
          {deliveryCity}
        </h2>
        <span className="text-helper" style={{ fontSize: 14, marginTop: 8, display: 'inline-block' }}>
          {shipment?.cargoType || 'غير محدد'} • {shipment?.loadingDate || new Date().toLocaleDateString('ar-SA')}
        </span>
      </div>

      <Card style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
            <span style={{ fontSize: 18, fontWeight: 'bold' }}>4.5 <span style={{ color: 'var(--color-accent)' }}>⭐</span></span>
          </div>
        </div>
        <div style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div>
            <div className="text-helper" style={{ fontSize: 12 }}>الناقل المكلّف</div>
            <div style={{ fontWeight: 'bold', fontSize: 16 }}>{trip.carrierName}</div>
          </div>
          <div style={{ width: 40, height: 40, backgroundColor: 'var(--color-background)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
            🏢
          </div>
        </div>
      </Card>

      <div style={{ backgroundColor: 'rgba(255,122,41,0.1)', padding: '20px 24px', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--color-accent)' }} dir="ltr">{trip.finalPrice} ر.س</div>
        <div style={{ fontWeight: 'bold', fontSize: 16 }}>السعر النهائي المتفق عليه</div>
      </div>

      <h3 style={{ margin: '8px 0 0' }}>الموقع الحالي</h3>
      <div style={{ height: 200, backgroundColor: 'var(--color-primary)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        <span style={{ color: 'white', zIndex: 1, backgroundColor: 'rgba(0,0,0,0.5)', padding: '4px 12px', borderRadius: 16, fontSize: 12, position: 'absolute', bottom: 16, left: 16 }}>موقع تجريبي</span>
      </div>

      <h3 style={{ margin: '8px 0 0' }}>حالة الرحلة</h3>
      <p className="text-helper" style={{ margin: '-16px 0 16px', fontSize: 12 }}>يقوم الناقل بتحديث حالة الرحلة أولاً بأول</p>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, paddingRight: 16 }}>
        {stagesList.map((stage, idx) => {
          const stageIdx = stageOrder.indexOf(stage.stage);
          const isCompleted = stageIdx <= currentStageIndex;
          const isCurrent = stageIdx === currentStageIndex;
          return (<div key={stage.stage} style={{ display: 'flex', gap: 16, opacity: isCompleted ? 1 : 0.4 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%',
                backgroundColor: isCurrent ? 'var(--color-surface)' : isCompleted ? 'var(--color-border)' : 'var(--color-surface)',
                border: isCurrent ? '4px solid var(--color-accent)' : isCompleted ? '2px solid var(--color-border)' : '2px solid var(--color-border)',
                marginTop: 2
              }}></div>
              {idx < stagesList.length - 1 && (<div style={{ width: 2, height: 40, backgroundColor: isCompleted ? 'var(--color-border)' : 'var(--color-border)', margin: '4px 0' }}></div>)}
            </div>
            <div style={{ paddingBottom: idx < stagesList.length - 1 ? 24 : 0 }}>
              <div style={{ fontWeight: 'bold', fontSize: 16 }}>{TripStageAr[stage.stage] || stage.stage}</div>
            </div>
          </div>);
        })}
      </div>

      <h3 style={{ marginTop: 16, marginBottom: 8 }}>مستندات الإثبات</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 32 }}>
        <Card style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: 16 }}>إثبات التحميل</div>
            <div className="text-helper" style={{ fontSize: 12, marginTop: 4 }}>بانتظار رفع الناقل</div>
          </div>
          <div style={{ width: 40, height: 40, backgroundColor: 'var(--color-background)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ⏳
          </div>
        </Card>
        <Card style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: 16 }}>إثبات التسليم</div>
            <div className="text-helper" style={{ fontSize: 12, marginTop: 4 }}>بانتظار رفع الناقل</div>
          </div>
          <div style={{ width: 40, height: 40, backgroundColor: 'var(--color-background)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            ⏳
          </div>
        </Card>
      </div>

      {isDelivered && !trip.isRated && (<Card variant="dark">
        <h3 style={{ marginBottom: 16, color: 'white' }}>الرحلة مكتملة</h3>
        <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 16 }}>الرجاء تقييم الناقل لإتمام العملية بالكامل.</p>
        <Button style={{ width: '100%' }} onClick={() => navigate(`/app/trips/${trip.id}/rating`)}>تقييم الرحلة</Button>
      </Card>)}

    </div>);
};
