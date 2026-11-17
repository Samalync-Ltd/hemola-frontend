import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { tripService, shipmentService, authService } from '../../services/api';
import { TripStage as TripStageEnum, UserRole } from '../../constants/enums';
import { ProofPhotoCapture, ProofPhotoView } from '../../components/trip/ProofPhotoCapture';
import { QuickMessagePanel } from '../../components/trip/QuickMessagePanel';
import { CancelTripModal } from '../../components/trip/CancelTripModal';
import { openDirections } from '../../components/map/TripMap';
import { MapThumbnail } from '../../components/map/MapThumbnail';
import { CallButton } from '../../components/trip/CallButton';
import { toUserMessage } from '../../utils/errors';
import { formatDateTime, formatMoney, formatRoute, formatWeight } from '../../utils/format';
import { useT } from '../../i18n';
import { useNames } from '../../i18n/catalog';
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

// Stages requiring a captured proof photo before they can be marked complete.
const PROOF_REQUIRED_STAGES = [TripStageEnum.LOADED, TripStageEnum.DELIVERED];

export const CarrierTripTrack = () => {
    const { tripId } = useParams();
    const navigate = useNavigate();
    const { t } = useT();
    const { cargoName } = useNames();
    const { hash } = useLocation();
    const messagesRef = useRef(null);
    const [trip, setTrip] = useState(undefined); // undefined = loading, null = not found
    const [shipment, setShipment] = useState(null);
    const [user, setUser] = useState(null);
    const [error, setError] = useState('');
    const [stageError, setStageError] = useState('');
    const [settlement, setSettlement] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isCancelOpen, setIsCancelOpen] = useState(false);
    const [isSendingMessage, setIsSendingMessage] = useState(false);

    // Live: stage, proofs and messages update without a refresh.
    useEffect(() => {
        if (!tripId) return undefined;
        return tripService.subscribe(tripId, setTrip, (err) => { setError(toUserMessage(err)); setTrip(null); });
    }, [tripId]);

    useEffect(() => { authService.getCurrentUser().then(setUser).catch(() => {}); }, []);

    // The shipment (with its private site details) once — it doesn't change mid-trip.
    const shipmentId = trip?.shipmentId;
    useEffect(() => {
        if (!shipmentId) return;
        shipmentService.getShipmentById(shipmentId).then(setShipment).catch(() => setShipment(null));
    }, [shipmentId]);

    const { newMessageIds, unreadCount } = useUnreadTripMessages(trip, trip?.carrierId, messagesRef);

    // Opened from a message notification: go straight to the messages.
    const hasTrip = !!trip;
    useEffect(() => {
        if (hasTrip && hash === '#messages') {
            setTimeout(() => messagesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
        }
    }, [hasTrip, hash]);

    if (trip === undefined) return <Loader label={t('trips.loadingOne')} />;
    if (!trip) return <div>{error || t('errors.app.tripNotFound')}</div>;

    const isCancelled = trip.overallStatus === 'CANCELLED';
    const currentStageIndex = stageOrder.indexOf(trip.currentStage);
    const isDelivered = trip.currentStage === TripStageEnum.DELIVERED;
    const nextStage = !isDelivered && !isCancelled && currentStageIndex + 1 < stageOrder.length ? stageOrder[currentStageIndex + 1] : null;
    const nextStageNeedsProof = nextStage && PROOF_REQUIRED_STAGES.includes(nextStage);
    // Cancelling is only possible before the cargo is loaded (INTEGRATION.md
    // cancelShipment matrix) — from «تم التحميل» on, only support can.
    const canCancel = !isCancelled && !isDelivered && tripService.cancellableStages.includes(trip.currentStage);
    // Where the carrier is heading now: the pickup point until «تم التحميل»,
    // then the delivery point. Nothing once the trip is over.
    const focus = isDelivered || isCancelled ? null
        : currentStageIndex < stageOrder.indexOf(TripStageEnum.LOADED) ? 'pickup' : 'delivery';
    const cargoType = cargoName(shipment || trip);
    const loadingDate = shipment?.loadingDate || trip.loadingDate;

    const stagesList = stageOrder.map((stage) => ({
        stage,
        timestamp: (trip.stages || []).find((s) => s.stage === stage)?.timestamp ?? null,
    }));

    /** Uploads the proof (if any) and advances; throws so the photo step can show the error. */
    const advanceStage = async (stage, proof, onUploadProgress) => {
        setStageError('');
        const updated = await tripService.updateTripStage(trip.id, stage, proof, onUploadProgress);
        if (updated.settlement) setSettlement(updated.settlement);
    };

    const handleUpdateStatus = async () => {
        if (!nextStage || nextStageNeedsProof) return; // Proof-required stages advance via ProofPhotoCapture instead.
        setIsUpdating(true);
        try {
            await advanceStage(nextStage);
        } catch (err) {
            setStageError(toUserMessage(err, t('trips.stageUpdateFailed')));
        } finally {
            setIsUpdating(false);
        }
    };

    const handleSendMessage = async (key) => {
        setIsSendingMessage(true);
        try {
            await tripService.sendQuickMessage(trip.id, UserRole.CARRIER, key);
        } catch (err) {
            setStageError(toUserMessage(err));
        } finally {
            setIsSendingMessage(false);
        }
    };

    const loadProof = trip.proofOfLoad;
    const deliveryProof = trip.proofOfDelivery;

    return (<div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 600, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <h2 style={{ margin: 0 }}>{formatRoute(trip.pickupCity, trip.deliveryCity, 'arrowLeft')}</h2>
        <Button variant="outline" size="sm" onClick={() => navigate('/app/trips')}>{t('trips.back')}</Button>
      </div>

      <Card style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div className="text-helper" style={{ fontSize: 12 }}>{t('shipments.cargoType')}</div>
          <div style={{ fontWeight: 'bold', fontSize: 16 }}>{cargoType || '—'}</div>
          {(shipment?.weight ?? trip.weight) != null && (
            <div className="text-helper" style={{ fontSize: 12 }}>{formatWeight(shipment?.weight ?? trip.weight)}</div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <div className="text-helper" style={{ fontSize: 12 }}>{t('shipments.loadingDate')}</div>
          <div style={{ fontWeight: 'bold', fontSize: 14 }}>
            {formatDateTime(loadingDate)}
          </div>
        </div>
      </Card>

      {!isCancelled && !isDelivered && <CallButton phoneNumber={trip.shipperPhone} label={t('trips.callShipper')} />}

      <div style={{ backgroundColor: 'rgba(255,122,41,0.1)', padding: '20px 24px', borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 24, fontWeight: 'bold', color: 'var(--color-accent)' }} dir="ltr">{formatMoney(trip.finalPrice)}</div>
        <div style={{ fontWeight: 'bold', fontSize: 16 }}>{t('shipments.finalPrice')}</div>
      </div>

      {settlement && (
        <div role="status" style={{ padding: 16, borderRadius: 12, backgroundColor: 'rgba(16,185,129,0.08)', border: '1px solid var(--color-success)' }}>
          <div style={{ fontWeight: 700, color: 'var(--color-success)', marginBottom: 8 }}>{t('trips.settlement.title')}</div>
          <div>{t('trips.settlement.price', { amount: formatMoney(settlement.price) })}</div>
          <div>{t('trips.settlement.commission', { amount: formatMoney(settlement.commission) })}</div>
          {settlement.debtDeducted > 0 && <div>{t('trips.settlement.debt', { amount: formatMoney(settlement.debtDeducted) })}</div>}
          <div style={{ fontWeight: 700 }}>{t('trips.settlement.net', { amount: formatMoney(settlement.netToCarrier) })}</div>
        </div>
      )}

      {isCancelled ? (
        <div style={{ padding: 16, backgroundColor: 'rgba(229,62,62,0.1)', color: 'var(--color-error)', borderRadius: 8, fontWeight: 'bold', textAlign: 'center' }}>
          {t('trips.cancelled')}
        </div>
      ) : (<>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
        <h3 style={{ margin: 0 }}>{t('trips.status')}</h3>
        {!isDelivered && nextStage && !nextStageNeedsProof && (
          <Button size="sm" onClick={handleUpdateStatus} isLoading={isUpdating}>
            {t('trips.updateTo', { stage: t(`enums.tripStage.${nextStage}`) })}
          </Button>
        )}
      </div>
      <p className="text-helper" style={{ margin: '8px 0 0', fontSize: 12 }}>{t('trips.statusHintCarrier')}</p>
      {stageError && <div role="alert" style={{ color: 'var(--color-error)', fontSize: 13 }}>{stageError}</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, paddingInlineStart: 16 }}>
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
              <div style={{ fontWeight: 'bold', fontSize: 16 }}>{t(`enums.tripStage.${stage.stage}`)}</div>
              {stage.timestamp && <div className="text-helper" style={{ fontSize: 12 }}>{formatDateTime(stage.timestamp)}</div>}
            </div>
          </div>);
        })}
      </div>

      {shipment && (shipment.onSiteContact || shipment.pickupNotes || shipment.deliveryNotes || shipment.pickupLat || shipment.deliveryLat) && (
        <>
          <h3 style={{ marginTop: 8, marginBottom: 8 }}>{t('trips.locationTitle')}</h3>
          {focus && (
            <div role="status" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, backgroundColor: 'rgba(255,122,41,0.1)', border: '1px solid rgba(255,122,41,0.4)', fontWeight: 700 }}>
              <span aria-hidden="true">{focus === 'pickup' ? '📦' : '🏁'}</span>
              {t('trips.heading', { place: focus === 'pickup' ? t('trips.pickupPoint') : t('trips.deliveryPoint') })}
            </div>
          )}
          {(shipment.pickupLat || shipment.deliveryLat) && (
            <MapThumbnail
              pickup={shipment.pickupLat ? [shipment.pickupLat, shipment.pickupLng] : null}
              delivery={shipment.deliveryLat ? [shipment.deliveryLat, shipment.deliveryLng] : null}
              title={t('trips.mapTitle')}
              focus={focus}
            />
          )}
          <Card>
            {shipment.onSiteContact && (
              <div style={{ marginBottom: 16 }}>
                <div className="text-helper">{t('shipments.onSiteContact')}</div>
                <div dir="ltr">☎ {shipment.onSiteContact}</div>
              </div>
            )}
            <div className="responsive-two-col-even">
              {[
                { key: 'pickup', icon: '📦', name: t('trips.pickupPoint'), notes: shipment.pickupNotes, lat: shipment.pickupLat, lng: shipment.pickupLng },
                { key: 'delivery', icon: '🏁', name: t('trips.deliveryPoint'), notes: shipment.deliveryNotes, lat: shipment.deliveryLat, lng: shipment.deliveryLng },
              ].filter(p => p.notes || p.lat).map(p => {
                const isNext = focus === p.key;
                return (
                  <div key={p.key} style={{ opacity: focus && !isNext ? 0.6 : 1, ...(isNext ? { padding: 12, margin: -12, borderRadius: 10, backgroundColor: 'rgba(255,122,41,0.06)' } : {}) }}>
                    <div className="text-helper" style={isNext ? { color: 'var(--color-accent)', fontWeight: 700 } : undefined}>
                      {p.icon} {p.name}{isNext && t('trips.currentDestinationSuffix')}
                    </div>
                    {p.notes && <div>{p.notes}</div>}
                    {p.lat && (
                      <Button variant={isNext ? 'primary' : 'outline'} size="sm" style={{ marginTop: 8 }} onClick={() => openDirections(p.lat, p.lng)}>
                        {isNext ? t('trips.goTo', { place: p.name }) : t('trips.openInGoogleMaps')}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </>
      )}

      <h3 style={{ marginTop: 16, marginBottom: 8 }}>{t('trips.proofTitle')}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 8 }}>
        <Card>
          <div style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>{t('trips.proofOfLoad')}</div>
          {loadProof ? (
            <ProofPhotoView label={t('trips.proofOfLoad')} photo={loadProof} />
          ) : nextStage === TripStageEnum.LOADED ? (
            <ProofPhotoCapture
              label={t('trips.captureLoadProof')}
              onConfirm={(proof, onProgress) => advanceStage(TripStageEnum.LOADED, proof, onProgress)}
            />
          ) : (
            <div className="text-helper" style={{ fontSize: 12 }}>{t('trips.photoLater')}</div>
          )}
        </Card>
        <Card>
          <div style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8 }}>{t('trips.proofOfDelivery')}</div>
          {deliveryProof ? (
            <ProofPhotoView label={t('trips.proofOfDelivery')} photo={deliveryProof} />
          ) : nextStage === TripStageEnum.DELIVERED ? (
            <ProofPhotoCapture
              label={t('trips.captureDeliveryProof')}
              onConfirm={(proof, onProgress) => advanceStage(TripStageEnum.DELIVERED, proof, onProgress)}
            />
          ) : (
            <div className="text-helper" style={{ fontSize: 12 }}>{t('trips.photoLater')}</div>
          )}
        </Card>
      </div>
      </>)}

      <div ref={messagesRef} id="messages" style={{ scrollMarginTop: 80 }}>
        <h3 style={{ marginTop: 8, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          {t('trips.messages.title')}
          {unreadCount > 0 && <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 999, backgroundColor: 'var(--color-accent)', color: 'white' }}>{t('trips.messages.newCount', { count: unreadCount })}</span>}
        </h3>
        <Card>
          <QuickMessagePanel role={UserRole.CARRIER} currentUserId={trip.carrierId} messages={trip.messages} onSend={handleSendMessage} isSending={isSendingMessage || isCancelled || isDelivered} newMessageIds={newMessageIds} />
        </Card>
      </div>

      {!isCancelled && !isDelivered && (
        <div style={{ marginTop: 8 }}>
          {canCancel ? (
            <Button variant="danger" style={{ width: '100%' }} onClick={() => setIsCancelOpen(true)}>
              {t('trips.cancel')}
            </Button>
          ) : (
            <p className="text-helper" style={{ fontSize: 12, textAlign: 'center' }}>
              {t('trips.cannotCancel')}
            </p>
          )}
        </div>
      )}

      {isDelivered && (
        <div style={{ padding: 16, backgroundColor: 'rgba(39, 174, 96, 0.1)', color: 'var(--color-success)', borderRadius: 8, fontWeight: 'bold', textAlign: 'center' }}>
          {t('trips.completedThanks')}
        </div>
      )}

      <CancelTripModal isOpen={isCancelOpen} onClose={() => setIsCancelOpen(false)} trip={trip} role="CARRIER" user={user} />
    </div>);
};
