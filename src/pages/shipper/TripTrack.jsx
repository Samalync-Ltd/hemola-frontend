import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Star, Building2, Clock, MapPin, Flag, Truck } from 'lucide-react';
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

    // Mock Map Position logic
    const getTruckPos = (stage) => {
        switch (stage) {
            case TripStageEnum.ASSIGNED: return { right: '15%', top: '20%' };
            case TripStageEnum.PICKUP_ROUTE_EN: return { right: '25%', top: '28%' };
            case TripStageEnum.PICKUP_ARRIVED: return { right: '35%', top: '37%' };
            case TripStageEnum.LOADED: return { right: '35%', top: '37%' };
            case TripStageEnum.DELIVERY_ROUTE_EN: return { right: '60%', top: '60%' };
            case TripStageEnum.DELIVERED: return { right: '85%', top: '80%' };
            default: return { right: '15%', top: '20%' };
        }
    };
    const truckPos = getTruckPos(trip.currentStage);

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
            <span style={{ fontSize: 18, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 4 }}>
              4.5 <Star fill="var(--color-accent)" color="var(--color-accent)" size={16} />
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div>
            <div className="text-helper" style={{ fontSize: 12 }}>الناقل</div>
            <div style={{ fontWeight: 'bold', fontSize: 16 }}>{trip.carrierName || 'غير محدد'}</div>
          </div>
          <div style={{ width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text)' }}>
            <Building2 size={20} />
          </div>
        </div>
      </Card>

      <div style={{ backgroundColor: 'rgba(255,122,41,0.1)', padding: '20px 24px', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--color-accent)' }} dir="ltr">{trip.finalPrice} ر.س</div>
        <div style={{ fontWeight: 'bold', fontSize: 16 }}>السعر النهائي المتفق عليه</div>
      </div>

      <h3 style={{ margin: '8px 0 0' }}>الموقع الحالي</h3>
      <div style={{ height: 250, backgroundColor: 'var(--color-primary)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--color-border)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
        
        {/* SVG Route Line (RTL approximation) */}
        <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: 'scaleX(-1)' }}>
          <line x1="15%" y1="20%" x2="85%" y2="80%" stroke="var(--color-border)" strokeWidth="3" strokeDasharray="6,6" />
        </svg>

        {/* Pickup Marker */}
        <div style={{ position: 'absolute', right: '15%', top: '20%', transform: 'translate(50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: 24, height: 24, backgroundColor: 'var(--color-surface)', border: '2px solid var(--color-text)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
            <MapPin size={14} color="var(--color-text)" />
          </div>
          <span style={{ color: 'white', fontSize: 12, marginTop: 4, fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>التحميل</span>
        </div>

        {/* Truck Marker */}
        <div style={{ position: 'absolute', right: truckPos.right, top: truckPos.top, transform: 'translate(50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', transition: 'all 1s ease' }}>
          <div style={{ width: 32, height: 32, backgroundColor: 'var(--color-accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3, boxShadow: '0 4px 12px rgba(255,122,41,0.4)' }}>
            <Truck size={16} color="white" />
          </div>
          <span style={{ color: 'var(--color-accent)', fontSize: 12, marginTop: 4, fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>الشاحنة الآن</span>
        </div>

        {/* Delivery Marker */}
        <div style={{ position: 'absolute', right: '85%', top: '80%', transform: 'translate(50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: 24, height: 24, backgroundColor: 'var(--color-surface)', border: '2px solid var(--color-text)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}>
            <Flag size={14} color="var(--color-text)" />
          </div>
          <span style={{ color: 'white', fontSize: 12, marginTop: 4, fontWeight: 'bold', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>التسليم</span>
        </div>

        <span style={{ color: 'rgba(255,255,255,0.7)', zIndex: 1, backgroundColor: 'rgba(0,0,0,0.5)', padding: '4px 12px', borderRadius: 16, fontSize: 12, position: 'absolute', bottom: 16, left: 16 }}>موقع تجريبي</span>
      </div>

      <h3 style={{ margin: '8px 0 0' }}>حالة الرحلة</h3>
      <p className="text-helper" style={{ margin: '-16px 0 16px', fontSize: 12 }}>يقوم الناقل بتحديث حالة الرحلة — العرض هنا للمتابعة فقط</p>
      
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
          <div style={{ width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={20} color="var(--color-text-muted)" />
          </div>
        </Card>
        <Card style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: 16 }}>إثبات التسليم</div>
            <div className="text-helper" style={{ fontSize: 12, marginTop: 4 }}>بانتظار رفع الناقل</div>
          </div>
          <div style={{ width: 40, height: 40, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={20} color="var(--color-text-muted)" />
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
