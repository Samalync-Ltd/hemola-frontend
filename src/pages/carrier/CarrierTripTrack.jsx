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
    TripStageEnum.DELIVERY_ARRIVED,
    TripStageEnum.DELIVERED
];

export const CarrierTripTrack = () => {
    const { tripId } = useParams();
    const navigate = useNavigate();
    const [trip, setTrip] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    const fetchTrip = () => {
        if (tripId) {
            tripService.getTripById(tripId)
                .then(setTrip)
                .finally(() => setIsLoading(false));
        }
    };

    useEffect(() => {
        fetchTrip();
    }, [tripId]);

    if (isLoading) return <div>جاري التحميل...</div>;
    if (!trip) return <div>الرحلة غير موجودة</div>;

    const currentStageIndex = stageOrder.indexOf(trip.currentStage);
    const isDelivered = trip.currentStage === TripStageEnum.DELIVERED;
    const nextStage = !isDelivered && currentStageIndex + 1 < stageOrder.length ? stageOrder[currentStageIndex + 1] : null;

    // Safely generate stages if they don't exist in mock data
    const stagesList = trip.stages || stageOrder.map((stage) => ({
        stage,
        timestamp: stageOrder.indexOf(stage) <= currentStageIndex ? trip.startedAt : null
    }));

    const handleUpdateStatus = async () => {
        if (!nextStage) return;
        setIsUpdating(true);
        try {
            await tripService.updateTripStage(trip.id, nextStage);
            fetchTrip();
        } catch (error) {
            console.error('Failed to update trip stage', error);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ margin: 0 }}>إدارة الرحلة {trip.shipmentId}</h2>
                    <span className="text-helper">المسار: {trip.route}</span>
                </div>
                <Button variant="outline" onClick={() => navigate('/app/dashboard')}>العودة</Button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
                <Card>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                        <h3 style={{ margin: 0 }}>مراحل الرحلة وتحديث الحالة</h3>
                        {!isDelivered && nextStage && (
                            <Button onClick={handleUpdateStatus} isLoading={isUpdating}>
                                تحديث إلى: {TripStageAr[nextStage]}
                            </Button>
                        )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        {stagesList.map((stage, idx) => {
                            const stageIdx = stageOrder.indexOf(stage.stage);
                            const isCompleted = stageIdx <= currentStageIndex;
                            const isCurrent = stageIdx === currentStageIndex;

                            return (
                                <div key={stage.stage} style={{ display: 'flex', gap: 16, opacity: isCompleted ? 1 : 0.4 }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                        <div style={{
                                            width: 16, height: 16, borderRadius: '50%',
                                            backgroundColor: isCurrent ? 'var(--color-accent)' : isCompleted ? 'var(--color-success)' : 'var(--color-border)',
                                            border: isCurrent ? '4px solid rgba(255,122,41,0.2)' : 'none',
                                            marginTop: 4
                                        }}></div>
                                        {idx < stagesList.length - 1 && (
                                            <div style={{ width: 2, flex: 1, backgroundColor: isCompleted ? 'var(--color-success)' : 'var(--color-border)', margin: '4px 0' }}></div>
                                        )}
                                    </div>
                                    <div style={{ paddingBottom: 24 }}>
                                        <div style={{ fontWeight: 'bold' }}>{TripStageAr[stage.stage] || stage.stage}</div>
                                        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4 }}>
                                            {stage.timestamp ? new Date(stage.timestamp).toLocaleString('ar-SA') : 'لم تتم بعد'}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <Card>
                        <h3 style={{ marginBottom: 16 }}>تعليمات هامة</h3>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>
                            يرجى التأكد من تحديث الحالة فور وصولك لكل مرحلة، حيث يساهم ذلك في زيادة تقييمك وثقة العملاء بك.
                        </p>
                        {isDelivered && (
                            <div style={{ marginTop: 16, padding: 12, backgroundColor: 'rgba(39, 174, 96, 0.1)', color: 'var(--color-success)', borderRadius: 8, fontWeight: 'bold' }}>
                                تم إكمال هذه الرحلة بنجاح! شكراً لك.
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};
