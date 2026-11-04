import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { tripService, shipmentService, userService } from '../../services/api';
import { TripStage as TripStageEnum, TripStageAr, UserRole } from '../../constants/enums';
import { ProofPhotoCapture } from '../../components/trip/ProofPhotoCapture';
import { QuickMessagePanel } from '../../components/trip/QuickMessagePanel';
import { openInMaps } from '../../components/map/TripMap';
import { MapThumbnail } from '../../components/map/MapThumbnail';
import { CallButton } from '../../components/trip/CallButton';
import { toArabicError } from '../../utils/errors';

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
    const [shipper, setShipper] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isCancelling, setIsCancelling] = useState(false);
    const [isSendingMessage, setIsSendingMessage] = useState(false);

    const fetchTrip = () => {
        if (tripId) {
            tripService.getTripById(tripId)
                .then(t => {
                    setTrip(t);
                    return Promise.all([
                        shipmentService.getShipmentById(t.shipmentId).catch(() => null),
                        t.shipperId ? userService.getUserById(t.shipperId) : Promise.resolve(null)
                    ]);
                })
                .then(([s, sh]) => {
                    setShipment(s);
                    setShipper(sh);
                })
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

    // Every stage in order, stamped with when it actually happened
    // (trip.stages comes from the backend's stageHistory).
    const stagesList = stageOrder.map((stage) => ({
        stage,
        timestamp: (trip.stages || []).find((s) => s.stage === stage)?.timestamp ?? null,
    }));

    const advanceStage = async (stage, proof) => {
        setIsUpdating(true);
        try {
            const updated = await tripService.updateTripStage(trip.id, stage, proof);
            if (updated.settlement) {
                // The number the carrier will actually ask about — surface it
                // plainly the moment settlement happens (INTEGRATION.md §15).
                alert(`تم تسليم الشحنة وتسوية الرحلة:\nالسعر: ${updated.settlement.price} ر.س\nعمولة المنصة: ${updated.settlement.commission} ر.س\n${updated.settlement.debtDeducted ? `دين مستحق مخصوم: ${updated.settlement.debtDeducted} ر.س\n` : ''}المبلغ الصافي المستلم: ${updated.settlement.netToCarrier} ر.س`);
            }
            fetchTrip();
        } catch (error) {
            console.error('Failed to update trip stage', error);
            alert(toArabicError(error, 'حدث خطأ أثناء تحديث حالة الرحلة'));
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
            const updated = await tripService.cancelTrip(trip.id, 'CARRIER');
            if (updated.cancellationResult?.commission) {
                alert(`تم إلغاء الرحلة — تم خصم عمولة إلغاء قدرها ${updated.cancellationResult.commission} ر.س${updated.cancellationResult.addedToDebt ? ` (منها ${updated.cancellationResult.addedToDebt} ر.س أضيفت كدين مستحق)` : ''}`);
            }
            fetchTrip();
        } catch (error) {
            alert(toArabicError(error));
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

   const loadProof = trip.proofOfLoad;
    const deliveryProof = trip.proofOfDelivery;

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
          {shipment?.cargoType || 'غير محدد'} • {shipment?.loadingDate ? new Date(shipment.loadingDate).toLocaleDateString('ar-SA') : new Date().toLocaleDateString('ar-SA')}
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
            {shipment?.loadingDate ? new Date(shipment.loadingDate).toLocaleString('ar-SA') : new Date().toLocaleDateString('ar-SA')}
          </div>
        </div>
      </Card>

      <div style={{ backgroundColor: 'rgba(255,122,41,0.1)', padding: '20px 24px', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--color-accent)' }} dir="ltr">{trip.finalPrice} ر.س</div>
        <div style={{ fontWeight: 'bold', fontSize: 16 }}>السعر النهائي المتفق عليه</div>
      </div>

      {isCancelled ? (
        <div style={{ padding: 16, backgroundColor: 'rgba(229,62,62,0.1)', color: 'var(--color-error)', borderRadius: 8, fontWeight: 'bold', textAlign: 'center' }}>
          تم إلغاء هذه الرحلة
        </div>
      ) : (<>
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

      {shipment && (shipment.onSiteContact || shipment.pickupNotes || shipment.deliveryNotes || shipment.pickupLat || shipment.deliveryLat) && (
        <>
          <h3 style={{ marginTop: 8, marginBottom: 8 }}>بيانات الموقع</h3>
          {(shipment.pickupLat || shipment.deliveryLat) && (
            <MapThumbnail
              pickup={shipment.pickupLat ? [shipment.pickupLat, shipment.pickupLng] : null}
              delivery={shipment.deliveryLat ? [shipment.deliveryLat, shipment.deliveryLng] : null}
              title="موقع الرحلة"
            />
          )}
          <Card>
            {shipment.onSiteContact && (
              <div style={{ marginBottom: 16 }}>
                <div className="text-helper">جوال المسؤول في الموقع</div>
                <div dir="ltr">☎ {shipment.onSiteContact}</div>
              </div>
            )}
            <div className="responsive-two-col-even">
              {(shipment.pickupNotes || shipment.pickupLat) && (
                <div>
                  <div className="text-helper">📦 موقع التحميل</div>
                  {shipment.pickupNotes && <div>{shipment.pickupNotes}</div>}
                  {shipment.pickupLat && (
                    <Button variant="outline" size="sm" style={{ marginTop: 8 }} onClick={() => openInMaps(shipment.pickupLat, shipment.pickupLng)}>
                      فتح في خرائط جوجل
                    </Button>
                  )}
                </div>
              )}
              {(shipment.deliveryNotes || shipment.deliveryLat) && (
                <div>
                  <div className="text-helper">🏁 موقع التسليم</div>
                  {shipment.deliveryNotes && <div>{shipment.deliveryNotes}</div>}
                  {shipment.deliveryLat && (
                    <Button variant="outline" size="sm" style={{ marginTop: 8 }} onClick={() => openInMaps(shipment.deliveryLat, shipment.deliveryLng)}>
                      فتح في خرائط جوجل
                    </Button>
                  )}
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

      {!isDelivered && <CallButton phoneNumber={shipper?.phone} label="الاتصال بصاحب الشحنة" />}

      <h3 style={{ marginTop: 8, marginBottom: 8 }}>رسائل سريعة</h3>
      <Card>
        <QuickMessagePanel role={UserRole.CARRIER} currentUserId={trip.carrierId} messages={trip.messages} onSend={handleSendMessage} isSending={isSendingMessage} />
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
