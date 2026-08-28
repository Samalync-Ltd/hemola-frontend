import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Flag, Truck } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { tripService, shipmentService } from '../../services/api';
import { TripStage as TripStageEnum, TripStageAr, UserRole } from '../../constants/enums';
import { ProofPhotoCapture } from '../../components/trip/ProofPhotoCapture';
import { QuickMessagePanel } from '../../components/trip/QuickMessagePanel';

const stageOrder = [
    TripStageEnum.ASSIGNED,
    TripStageEnum.EN_ROUTE_PICKUP,
    TripStageEnum.ARRIVED_PICKUP,
    TripStageEnum.LOADED,
    TripStageEnum.EN_ROUTE_DELIVERY,
    TripStageEnum.DELIVERED
];

// Stages requiring a captured proof photo before they can be marked complete.
const PROOF_REQUIRED_STAGES = [TripStageEnum.LOADED, TripStageEnum.DELIVERED];

export const CarrierTripTrack = () => {
    const { tripId } = useParams();
    const navigate = useNavigate();
    const [trip, setTrip] = useState(null);
    const [shipment, setShipment] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [isSendingMessage, setIsSendingMessage] = useState(false);

    const fetchTrip = () => {
        if (tripId) {
            tripService.getTripById(tripId)
                .then(t => {
                    setTrip(t);
                    return shipmentService.getShipmentById(t.shipmentId).catch(() => null);
                })
                .then(s => setShipment(s))
                .finally(() => setIsLoading(false));
        }
    };

    useEffect(() => {
        fetchTrip();
    }, [tripId]);

    if (isLoading) return <div>جاري التحميل...</div>;
    if (!trip) return <div>الرحلة غير موجودة</div>;

    const isCancelled = trip.overallStatus === 'CANCELLED';
    const currentStageIndex = stageOrder.indexOf(trip.currentStage);
    const isDelivered = trip.currentStage === TripStageEnum.DELIVERED;
    const nextStage = !isDelivered && !isCancelled && currentStageIndex + 1 < stageOrder.length ? stageOrder[currentStageIndex + 1] : null;
    const nextStageNeedsProof = nextStage && PROOF_REQUIRED_STAGES.includes(nextStage);

    // Safely generate stages if they don't exist in mock data
    const stagesList = trip.stages || stageOrder.map((stage) => ({
        stage,
        timestamp: stageOrder.indexOf(stage) <= currentStageIndex ? trip.startedAt : null
    }));

    const advanceStage = async (stage, proof) => {
        setIsUpdating(true);
        try {
            await tripService.updateTripStage(trip.id, stage, proof);
            fetchTrip();
        } catch (error) {
            console.error('Failed to update trip stage', error);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleUpdateStatus = () => {
        if (!nextStage || nextStageNeedsProof) return; // Proof-required stages advance via ProofPhotoCapture instead.
        advanceStage(nextStage);
    };

    const handleCancel = async () => {
        if (!window.confirm('سيتم خصم عمولة الإلغاء من محفظتك وتسجيل تحذير على حسابك. هل تريد المتابعة؟')) return;
        setIsCancelling(true);
        try {
            await tripService.cancelTrip(trip.id, 'CARRIER');
            fetchTrip();
        } catch (error) {
            alert(error.message);
        } finally {
            setIsCancelling(false);
        }
    };

    const handleSendMessage = async (key, label) => {
        setIsSendingMessage(true);
        try {
            await tripService.sendQuickMessage(trip.id, UserRole.CARRIER, key, label);
            fetchTrip();
        } finally {
            setIsSendingMessage(false);
        }
    };

    const [pickupCity, deliveryCity] = trip.route.split(' -> ');
    const canCancel = !isCancelled && !isDelivered && tripService.cancellableStages.includes(trip.currentStage);

    // Mock Map Position logic
    const getTruckPos = (stage) => {
        switch (stage) {
            case TripStageEnum.ASSIGNED: return { right: '15%', top: '20%' };
            case TripStageEnum.EN_ROUTE_PICKUP: return { right: '25%', top: '28%' };
            case TripStageEnum.ARRIVED_PICKUP: return { right: '35%', top: '37%' };
            case TripStageEnum.LOADED: return { right: '35%', top: '37%' };
            case TripStageEnum.EN_ROUTE_DELIVERY: return { right: '60%', top: '60%' };
            case TripStageEnum.DELIVERED: return { right: '85%', top: '80%' };
            default: return { right: '15%', top: '20%' };
        }
    };
    const truckPos = getTruckPos(trip.currentStage);
    const loadProof = stagesList.find(s => s.stage === TripStageEnum.LOADED)?.proof;
    const deliveryProof = stagesList.find(s => s.stage === TripStageEnum.DELIVERED)?.proof;

    return (<div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 600, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>{trip.shipmentId}</h2>
        <Button variant="outline" size="sm" onClick={() => navigate('/app/dashboard')}>العودة</Button>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div className="text-helper" style={{ fontSize: 12 }}>نوع البضاعة</div>
          <div style={{ fontWeight: 'bold', fontSize: 16 }}>
            {shipment?.cargoType || 'غير محدد'}
          </div>
          {shipment?.weight && (
            <div className="text-helper" style={{ fontSize: 12 }}>{shipment.weight} طن</div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <div className="text-helper" style={{ fontSize: 12 }}>تاريخ التحميل</div>
          <div style={{ fontWeight: 'bold', fontSize: 14 }}>
            {shipment?.loadingDate || new Date().toLocaleDateString('ar-SA')}
          </div>
          {shipment?.loadingTime && (
            <div className="text-helper" style={{ fontSize: 12 }}>{shipment.loadingTime}</div>
          )}
        </div>
      </Card>

      <div style={{ backgroundColor: 'rgba(255,122,41,0.1)', padding: '20px 24px', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--color-accent)' }} dir="ltr">{trip.finalPrice} ر.س</div>
        <div style={{ fontWeight: 'bold', fontSize: 16 }}>السعر النهائي المتفق عليه</div>
      </div>

      {isCancelled ? (
        <div style={{ padding: 16, backgroundColor: 'rgba(229,62,62,0.1)', color: 'var(--color-error)', borderRadius: 8, fontWeight: 'bold', textAlign: 'center' }}>
          تم إلغاء هذه الرحلة — تم خصم عمولة إلغاء قدرها {trip.cancellation?.commission} ر.س
        </div>
      ) : (<>
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <h3 style={{ margin: 0 }}>حالة الرحلة</h3>
        {!isDelivered && nextStage && !nextStageNeedsProof && (
          <Button size="sm" onClick={handleUpdateStatus} isLoading={isUpdating}>
            تحديث إلى: {TripStageAr[nextStage]}
          </Button>
        )}
      </div>
      <p className="text-helper" style={{ margin: '8px 0 16px', fontSize: 12 }}>يرجى التأكد من تحديث الحالة فور وصولك لكل مرحلة</p>

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

      {shipment && (shipment.pickupDirections || shipment.pickupContact || shipment.deliveryDirections || shipment.deliveryContact) && (
        <>
          <h3 style={{ marginTop: 8, marginBottom: 8 }}>بيانات الموقع</h3>
          <Card>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {(shipment.pickupDirections || shipment.pickupContact) && (
                <div>
                  <div className="text-helper">موقع التحميل</div>
                  {shipment.pickupDirections && <div>{shipment.pickupDirections}</div>}
                  {shipment.pickupContact && <div dir="ltr">☎ {shipment.pickupContact}</div>}
                </div>
              )}
              {(shipment.deliveryDirections || shipment.deliveryContact) && (
                <div>
                  <div className="text-helper">موقع التسليم</div>
                  {shipment.deliveryDirections && <div>{shipment.deliveryDirections}</div>}
                  {shipment.deliveryContact && <div dir="ltr">☎ {shipment.deliveryContact}</div>}
                </div>
              )}
            </div>
          </Card>
        </>
      )}

      <h3 style={{ marginTop: 16, marginBottom: 8 }}>مستندات الإثبات</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 8 }}>
        <Card>
          <div style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>إثبات التحميل</div>
          {loadProof ? (
            <ProofPhotoCapture label="إثبات التحميل" existingPhoto={loadProof} />
          ) : nextStage === TripStageEnum.LOADED ? (
            <ProofPhotoCapture
              label="التقط صورة إثبات التحميل لتأكيد هذه المرحلة"
              onCaptured={(proof) => advanceStage(TripStageEnum.LOADED, proof)}
            />
          ) : (
            <div className="text-helper" style={{ fontSize: 12 }}>سيُطلب منك التقاط الصورة عند الوصول لهذه المرحلة</div>
          )}
        </Card>
        <Card>
          <div style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>إثبات التسليم</div>
          {deliveryProof ? (
            <ProofPhotoCapture label="إثبات التسليم" existingPhoto={deliveryProof} />
          ) : nextStage === TripStageEnum.DELIVERED ? (
            <ProofPhotoCapture
              label="التقط صورة إثبات التسليم لتأكيد هذه المرحلة"
              onCaptured={(proof) => advanceStage(TripStageEnum.DELIVERED, proof)}
            />
          ) : (
            <div className="text-helper" style={{ fontSize: 12 }}>سيُطلب منك التقاط الصورة عند الوصول لهذه المرحلة</div>
          )}
        </Card>
      </div>

      <h3 style={{ marginTop: 8, marginBottom: 8 }}>رسائل سريعة</h3>
      <Card>
        <QuickMessagePanel role={UserRole.CARRIER} messages={trip.messages} onSend={handleSendMessage} isSending={isSendingMessage} />
      </Card>

      <div style={{ marginTop: 8 }}>
        {canCancel ? (
          <Button variant="danger" style={{ width: '100%' }} onClick={handleCancel} isLoading={isCancelling}>
            إلغاء الرحلة
          </Button>
        ) : !isDelivered && (
          <p className="text-helper" style={{ fontSize: 12, textAlign: 'center' }}>
            لا يمكن إلغاء الرحلة بعد بدء التحميل — يرجى التواصل مع دعم المنصة عند وجود مشكلة.
          </p>
        )}
      </div>
      </>)}

      {isDelivered && (
        <div style={{ padding: 16, backgroundColor: 'rgba(39, 174, 96, 0.1)', color: 'var(--color-success)', borderRadius: 8, fontWeight: 'bold', textAlign: 'center' }}>
          تم إكمال هذه الرحلة بنجاح! شكراً لك.
        </div>
      )}

    </div>);
};
