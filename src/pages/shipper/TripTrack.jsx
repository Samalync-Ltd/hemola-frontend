import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { tripService } from '../../services/api';
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
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        if (tripId) {
            tripService.getTripById(tripId)
                .then(setTrip)
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

    return (<div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0 }}>متابعة الرحلة {trip.shipmentId}</h2>
          <span className="text-helper">المسار: {trip.route}</span>
        </div>
        <Button variant="outline" onClick={() => navigate('/app/trips')}>عودة للرحلات</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <Card>
          <h3 style={{ marginBottom: 24 }}>مسار الرحلة الحي</h3>
          {/* Map Placeholder */}
          <div style={{ height: 300, backgroundColor: 'var(--color-background)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24, border: '1px solid var(--color-border)' }}>
            <span style={{ color: 'var(--color-text-muted)' }}>خريطة تتبع الشاحنة (Google Maps / Mapbox)</span>
          </div>

          <h3 style={{ marginBottom: 16 }}>مراحل الرحلة</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {stagesList.map((stage, idx) => {
            const stageIdx = stageOrder.indexOf(stage.stage);
            const isCompleted = stageIdx <= currentStageIndex;
            const isCurrent = stageIdx === currentStageIndex;
            return (<div key={stage.stage} style={{ display: 'flex', gap: 16, opacity: isCompleted ? 1 : 0.4 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                    width: 16, height: 16, borderRadius: '50%',
                    backgroundColor: isCurrent ? 'var(--color-accent)' : isCompleted ? 'var(--color-success)' : 'var(--color-border)',
                    border: isCurrent ? '4px solid rgba(255,122,41,0.2)' : 'none',
                    marginTop: 4
                }}></div>
                    {idx < stagesList.length - 1 && (<div style={{ width: 2, flex: 1, backgroundColor: isCompleted ? 'var(--color-success)' : 'var(--color-border)', margin: '4px 0' }}></div>)}
                  </div>
                  <div style={{ paddingBottom: 24 }}>
                    <div style={{ fontWeight: 'bold' }}>{TripStageAr[stage.stage] || stage.stage}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
                      {stage.timestamp ? new Date(stage.timestamp).toLocaleString('ar-SA') : 'لم تتم بعد'}
                    </div>
                  </div>
                </div>);
        })}
          </div>
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <Card>
            <h3 style={{ marginBottom: 16 }}>معلومات الناقل</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div><strong>الاسم:</strong> {trip.carrierName}</div>
              {trip.driverName && <div><strong>السائق:</strong> {trip.driverName}</div>}
              {trip.truckPlate && <div dir="ltr" style={{ textAlign: 'right' }}><strong>اللوحة:</strong> {trip.truckPlate}</div>}
            </div>
            {/* Note: In real app, contact info is hidden, only in-app chat is available if needed */}
          </Card>

          {isDelivered && !trip.isRated && (<Card variant="dark">
              <h3 style={{ marginBottom: 16, color: 'white' }}>الرحلة مكتملة</h3>
              <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 16 }}>الرجاء تقييم الناقل لإتمام العملية بالكامل.</p>
              <Button style={{ width: '100%' }} onClick={() => navigate(`/app/trips/${trip.id}/rating`)}>تقييم الرحلة</Button>
            </Card>)}

          {trip.isRated && (<Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>التقييم</strong>
                <span style={{ color: 'var(--color-accent)', fontWeight: 'bold' }}>تم التقييم ⭐⭐⭐⭐⭐</span>
              </div>
            </Card>)}
        </div>
      </div>
    </div>);
};
