import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Building2, Clock } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { tripService, shipmentService } from '../../services/api';
import { TripStage as TripStageEnum, TripStageAr, UserRole } from '../../constants/enums';
import { ProofPhotoView } from '../../components/trip/ProofPhotoCapture';
import { QuickMessagePanel } from '../../components/trip/QuickMessagePanel';
import { CancelTripModal } from '../../components/trip/CancelTripModal';
import { openInMaps } from '../../components/map/TripMap';
import { MapThumbnail } from '../../components/map/MapThumbnail';
import { CallButton } from '../../components/trip/CallButton';
import { toArabicError } from '../../utils/errors';
import { formatAmount } from '../../utils/format';
import { Loader } from '../../components/common/Loader';
import { useUnreadTripMessages } from '../../hooks/useUnreadTripMessages';

const stageOrder = [
    TripStageEnum.ASSIGNED,
    TripStageEnum.EN_ROUTE_PICKUP,
    TripStageEnum.ARRIVED_PICKUP,
    TripStageEnum.LOADED,
    TripStageEnum.EN_ROUTE_DELIVERY,
    TripStageEnum.DELIVERED
];

const AwaitingProof = () => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="text-helper" style={{ fontSize: 12 }}>بانتظار رفع الناقل</div>
        <Clock size={20} color="var(--color-text-muted)" />
    </div>
);

export const TripTrack = () => {
    const { tripId } = useParams();
    const navigate = useNavigate();
    const { hash } = useLocation();
    const messagesRef = useRef(null);
    const [trip, setTrip] = useState(undefined); // undefined = loading, null = not found
    const [shipment, setShipment] = useState(null);
    const [error, setError] = useState('');
    const [messageError, setMessageError] = useState('');
    const [isCancelOpen, setIsCancelOpen] = useState(false);
    const [isSendingMessage, setIsSendingMessage] = useState(false);

    // Live: the carrier's stage updates, proof photos and messages appear
    // without a refresh.
    useEffect(() => {
        if (!tripId) return undefined;
        return tripService.subscribe(tripId, setTrip, (err) => { setError(toArabicError(err)); setTrip(null); });
    }, [tripId]);

    const shipmentId = trip?.shipmentId;
    useEffect(() => {
        if (!shipmentId) return;
        shipmentService.getShipmentById(shipmentId).then(setShipment).catch(() => setShipment(null));
    }, [shipmentId]);

    const { newMessageIds, unreadCount } = useUnreadTripMessages(trip, trip?.shipperId, messagesRef);

    const hasTrip = !!trip;
    useEffect(() => {
        if (hasTrip && hash === '#messages') {
            setTimeout(() => messagesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
        }
    }, [hasTrip, hash]);

    if (trip === undefined)
        return <Loader label="جاري تحميل الرحلة" />;
    if (!trip)
        return <div>{error || 'الرحلة غير موجودة'}</div>;

    const isCancelled = trip.overallStatus === 'CANCELLED';
    const currentStageIndex = stageOrder.indexOf(trip.currentStage);
    const isDelivered = trip.currentStage === TripStageEnum.DELIVERED;
    // Cancelling is only possible before the cargo is loaded — from «تم
    // التحميل» on, only support can end the trip.
    const canCancel = !isCancelled && !isDelivered && tripService.cancellableStages.includes(trip.currentStage);
    const cargoType = shipment?.cargoType || trip.cargoType;
    const loadingDate = shipment?.loadingDate || trip.loadingDate;

    const handleSendMessage = async (key) => {
        setMessageError('');
        setIsSendingMessage(true);
        try {
            await tripService.sendQuickMessage(trip.id, UserRole.SHIPPER, key);
        } catch (err) {
            setMessageError(toArabicError(err));
        } finally {
            setIsSendingMessage(false);
        }
    };

    const stagesList = stageOrder.map((stage) => ({
        stage,
        timestamp: (trip.stages || []).find((s) => s.stage === stage)?.timestamp ?? null,
    }));

    return (<div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 600, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <h2 style={{ margin: 0 }}>{trip.route}</h2>
        <Button variant="outline" size="sm" onClick={() => navigate('/app/trips')}>عودة</Button>
      </div>

      <Card style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div className="text-helper" style={{ fontSize: 12 }}>نوع البضاعة</div>
          <div style={{ fontWeight: 'bold', fontSize: 16 }}>{cargoType || '—'}</div>
          {(shipment?.weight ?? trip.weight) != null && (
            <div className="text-helper" style={{ fontSize: 12 }}>{shipment?.weight ?? trip.weight} طن</div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <div className="text-helper" style={{ fontSize: 12 }}>تاريخ التحميل</div>
          <div style={{ fontWeight: 'bold', fontSize: 14 }}>
            {loadingDate ? new Date(loadingDate).toLocaleString('ar-SA') : '—'}
          </div>
        </div>
      </Card>

      <Card style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, backgroundColor: 'var(--color-background)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={20} />
          </div>
          <div>
            <div className="text-helper" style={{ fontSize: 12 }}>الناقل المكلّف</div>
            <div style={{ fontWeight: 'bold', fontSize: 16 }}>{trip.carrierName || 'بيانات الناقل غير متاحة'}</div>
          </div>
        </div>
      </Card>

      {!isCancelled && !isDelivered && <CallButton phoneNumber={trip.carrierPhone} label="الاتصال بالناقل" />}

      <div style={{ backgroundColor: 'rgba(255,122,41,0.1)', padding: '20px 24px', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--color-accent)' }} dir="ltr">{formatAmount(trip.finalPrice)} ر.س</div>
        <div style={{ fontWeight: 'bold', fontSize: 16 }}>السعر النهائي المتفق عليه</div>
      </div>

      <h3 style={{ margin: '8px 0 0' }}>حالة الرحلة</h3>
      <p className="text-helper" style={{ margin: '-16px 0 0', fontSize: 12 }}>يقوم الناقل بتحديث حالة الرحلة — تتحدث هنا تلقائياً</p>

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
                border: isCurrent ? '4px solid var(--color-accent)' : '2px solid var(--color-border)',
                marginTop: 2
              }}></div>
              {idx < stagesList.length - 1 && (<div style={{ width: 2, height: 40, backgroundColor: 'var(--color-border)', margin: '4px 0' }}></div>)}
            </div>
            <div style={{ paddingBottom: idx < stagesList.length - 1 ? 24 : 0 }}>
              <div style={{ fontWeight: 'bold', fontSize: 16 }}>{TripStageAr[stage.stage] || stage.stage}</div>
              {stage.timestamp && <div className="text-helper" style={{ fontSize: 12 }}>{new Date(stage.timestamp).toLocaleString('ar-SA')}</div>}
            </div>
          </div>);
        })}
      </div>

      {shipment && (shipment.pickupLat || shipment.deliveryLat) && (
        <>
          <h3 style={{ marginTop: 8, marginBottom: 8 }}>بيانات الموقع</h3>
          <MapThumbnail
            pickup={shipment.pickupLat ? [shipment.pickupLat, shipment.pickupLng] : null}
            delivery={shipment.deliveryLat ? [shipment.deliveryLat, shipment.deliveryLng] : null}
            title="موقع الرحلة"
          />
          <Card>
            <div className="responsive-two-col-even">
              {shipment.pickupLat && (
                <div>
                  <div className="text-helper">📦 موقع التحميل</div>
                  <Button variant="outline" size="sm" style={{ marginTop: 8 }} onClick={() => openInMaps(shipment.pickupLat, shipment.pickupLng)}>
                    فتح في خرائط جوجل
                  </Button>
                </div>
              )}
              {shipment.deliveryLat && (
                <div>
                  <div className="text-helper">🏁 موقع التسليم</div>
                  <Button variant="outline" size="sm" style={{ marginTop: 8 }} onClick={() => openInMaps(shipment.deliveryLat, shipment.deliveryLng)}>
                    فتح في خرائط جوجل
                  </Button>
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
          {trip.proofOfLoad ? <ProofPhotoView label="إثبات التحميل" photo={trip.proofOfLoad} /> : <AwaitingProof />}
        </Card>
        <Card>
          <div style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>إثبات التسليم</div>
          {trip.proofOfDelivery ? <ProofPhotoView label="إثبات التسليم" photo={trip.proofOfDelivery} /> : <AwaitingProof />}
        </Card>
      </div>

      <div ref={messagesRef} id="messages" style={{ scrollMarginTop: 80 }}>
        <h3 style={{ marginTop: 8, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          رسائل سريعة
          {unreadCount > 0 && <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 999, backgroundColor: 'var(--color-accent)', color: 'white' }}>{unreadCount} جديدة</span>}
        </h3>
        {messageError && <div role="alert" style={{ color: 'var(--color-error)', fontSize: 13, marginBottom: 8 }}>{messageError}</div>}
        <Card>
          <QuickMessagePanel role={UserRole.SHIPPER} currentUserId={trip.shipperId} messages={trip.messages} onSend={handleSendMessage} isSending={isSendingMessage || isCancelled || isDelivered} newMessageIds={newMessageIds} />
        </Card>
      </div>

      {isCancelled ? (
        <div style={{ padding: 16, backgroundColor: 'rgba(229,62,62,0.1)', color: 'var(--color-error)', borderRadius: 8, fontWeight: 'bold', textAlign: 'center' }}>
          تم إلغاء هذه الرحلة
        </div>
      ) : !isDelivered && (
        canCancel ? (
          <Button variant="danger" style={{ width: '100%' }} onClick={() => setIsCancelOpen(true)}>
            إلغاء الرحلة
          </Button>
        ) : (
          <p className="text-helper" style={{ fontSize: 12, textAlign: 'center' }}>
            لا يمكن إلغاء الرحلة بعد التحميل — يرجى التواصل مع دعم المنصة عند وجود مشكلة.
          </p>
        )
      )}

      {isDelivered && !trip.isRated && (<Card variant="dark">
        <h3 style={{ marginBottom: 16, color: 'white' }}>الرحلة مكتملة</h3>
        <p style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 16 }}>الرجاء تقييم الناقل لإتمام العملية بالكامل.</p>
        <Button style={{ width: '100%' }} onClick={() => navigate(`/app/trips/${trip.id}/rating`)}>تقييم الرحلة</Button>
      </Card>)}

      <CancelTripModal isOpen={isCancelOpen} onClose={() => setIsCancelOpen(false)} trip={trip} role="SHIPPER" />
    </div>);
};
