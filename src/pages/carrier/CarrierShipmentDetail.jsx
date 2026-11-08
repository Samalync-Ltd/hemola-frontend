import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriceBlock } from '../../components/common/PriceBlock';
import { Input } from '../../components/common/Input';
import { shipmentService, offerService } from '../../services/api';
import { offerBlockReason, usableTrucksFor, truckCanCarry, isTruckApproved } from '../../utils/carrierEligibility';
import { OfferStatus, ShipmentStatus, TruckTypeAr } from '../../constants/enums';
import { lookupCityCoordinates } from '../../utils/geo';
import { MapThumbnail } from '../../components/map/MapThumbnail';
import { toArabicError } from '../../utils/errors';
import { Loader } from '../../components/common/Loader';

export const CarrierShipmentDetail = ({ user }) => {
    const { shipmentId } = useParams();
    const navigate = useNavigate();
    const [shipment, setShipment] = useState(null);
    const [myOffer, setMyOffer] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [submitError, setSubmitError] = useState('');

    // Offer form state
    const [offerPrice, setOfferPrice] = useState('');
    const [selectedTruckId, setSelectedTruckId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAccepting, setIsAccepting] = useState(false);

    useEffect(() => {
        if (shipmentId && user) {
            // Only this carrier's own thread on this one shipment — a read the
            // rules allow. Listing offers across all shipments here is what
            // used to fail with permission-denied before anything was shown.
            Promise.all([
                shipmentService.getShipmentById(shipmentId),
                offerService.getMyThreadOnShipment(shipmentId, user.id)
            ])
            .then(([s, thread]) => {
                setShipment(s);
                if (thread) setMyOffer(thread);
            })
            .catch(err => setError(toArabicError(err)))
            .finally(() => setIsLoading(false));
        }
    }, [shipmentId, user]);

    // Live from then on: the shipper's counter/acceptance and the shipment's
    // status/tripId update here without a refresh. The live shipment is
    // merged over the first read so its private site details are kept.
    useEffect(() => {
        if (!shipmentId || !user) return undefined;
        const unsubscribers = [
            offerService.subscribeMyThreadOnShipment(shipmentId, user.id, (thread) => { if (thread) setMyOffer(thread); }, () => {}),
            shipmentService.subscribe(shipmentId, (live) => { if (live) setShipment(prev => (prev ? { ...prev, ...live } : prev)); }, () => {}),
        ];
        return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
    }, [shipmentId, user]);

    // Only a truck of the required type, big enough for the load, with both
    // papers APPROVED may be offered (see utils/carrierEligibility). Trucks
    // too small for the shipment's weight are hidden from the picker.
    const eligibleTrucks = shipment ? usableTrucksFor(user, shipment) : [];
    // Approved trucks of the right type left out only because they're too small.
    const tooSmallTrucks = shipment
        ? (user?.trucks || []).filter(t => t.type === shipment.requiredTruckType && isTruckApproved(t) && !truckCanCarry(t, shipment)).length
        : 0;

    useEffect(() => {
        if (eligibleTrucks.length > 0) {
            if (!selectedTruckId || !eligibleTrucks.some(t => t.id === selectedTruckId)) {
                setSelectedTruckId(eligibleTrucks[0].id);
            }
        } else {
            setSelectedTruckId('');
        }
    }, [eligibleTrucks, selectedTruckId]);

    const handleSubmitOffer = async (e) => {
        e.preventDefault();
        setSubmitError('');
        setIsSubmitting(true);
        try {
            const truckIdToSubmit = selectedTruckId || (eligibleTrucks[0]?.id ?? '');
            const newOffer = await offerService.submitOffer({
                shipmentId,
                truckId: truckIdToSubmit,
                offeredPrice: Number(offerPrice),
            });
            setMyOffer(newOffer);
        } catch (err) {
            setSubmitError(toArabicError(err));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Offers exactly the shipper's posted price. The posted price is not an
    // offer the carrier can accept — acceptOffer only lets the side that did
    // NOT make an offer accept it (INTEGRATION.md §12) — so this sends an
    // offer at that price and the shipper confirms it with one click.
    const handleAcceptPostedPrice = async () => {
        if (!window.confirm(`سيتم إرسال عرض بالسعر المطروح (${shipment.proposedPrice} ر.س) إلى صاحب الشحنة، وتُسند إليك الشحنة عند موافقته. متابعة؟`)) return;
        setSubmitError('');
        setIsAccepting(true);
        try {
            const truckIdToSubmit = selectedTruckId || (eligibleTrucks[0]?.id ?? '');
            const newOffer = await offerService.submitOffer({
                shipmentId,
                truckId: truckIdToSubmit,
                offeredPrice: shipment.proposedPrice,
            });
            setMyOffer(newOffer);
        } catch (err) {
            setSubmitError(toArabicError(err));
        } finally {
            setIsAccepting(false);
        }
    };

    if (isLoading) return <Loader label="جاري تحميل الشحنة" />;
    if (error || !shipment) return <div>{error || 'الشحنة غير موجودة'}</div>;

    // The same reason the home page and the shipments list show.
    const blockReason = offerBlockReason(user, shipment);
    const blocked = !!blockReason;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ margin: 0, marginBottom: 8 }}>تفاصيل الشحنة {shipment.id}</h2>
                    <StatusBadge status={shipment.status} />
                </div>
                <Button variant="outline" onClick={() => navigate('/app/shipments')}>عودة للقائمة</Button>
            </div>

            <div className="responsive-two-col">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <Card>
                        <h3 style={{ marginBottom: 16 }}>تفاصيل المسار والبضاعة</h3>
                        {(() => {
                            // City-level route preview only — built from the public
                            // origin/destination city names, never the shipment's
                            // precise SiteDetails pin, which stays hidden until this
                            // carrier is actually assigned.
                            const pickup = lookupCityCoordinates(shipment.pickupCity);
                            const delivery = lookupCityCoordinates(shipment.deliveryCity);
                            if (!pickup || !delivery) return null;
                            return (
                                <div style={{ marginBottom: 16 }}>
                                    <MapThumbnail pickup={pickup} delivery={delivery} height={160} title="معاينة المسار" />
                                </div>
                            );
                        })()}
                        <div className="responsive-two-col-even">
                            <div>
                                <div className="text-helper">مدينة التحميل</div>
                                <div style={{ fontWeight: 700 }}>{shipment.pickupCity}</div>
                            </div>
                            <div>
                                <div className="text-helper">مدينة التسليم</div>
                                <div style={{ fontWeight: 700 }}>{shipment.deliveryCity}</div>
                            </div>
                            <div>
                                <div className="text-helper">نوع البضاعة</div>
                                <div style={{ fontWeight: 700 }}>{shipment.cargoType}</div>
                            </div>
                            <div>
                                <div className="text-helper">الوزن</div>
                                <div style={{ fontWeight: 700 }}>{shipment.weight} طن</div>
                            </div>
                            <div>
                                <div className="text-helper">نوع الشاحنة المطلوبة</div>
                                <div style={{ fontWeight: 700 }}>{TruckTypeAr[shipment.requiredTruckType] || shipment.requiredTruckType}</div>
                            </div>
                            <div>
                                <div className="text-helper">تاريخ ووقت التحميل</div>
                                <div style={{ fontWeight: 700 }}>{shipment.loadingDate ? new Date(shipment.loadingDate).toLocaleString('ar-SA') : '—'}</div>
                            </div>
                        </div>
                        {shipment.description && (
                            <div style={{ marginTop: 16 }}>
                                <div className="text-helper">ملاحظات إضافية</div>
                                <div>{shipment.description}</div>
                            </div>
                        )}
                    </Card>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <Card>
                        <h3 style={{ marginBottom: 16 }}>السعر والمزايدة</h3>
                        <div style={{ marginBottom: 24 }}>
                            <div className="text-helper">السعر المقترح من صاحب الشحنة</div>
                            <PriceBlock amount={shipment.proposedPrice} size="lg" />
                        </div>

                        {myOffer ? (
                            <div style={{ padding: 16, backgroundColor: 'rgba(255, 122, 41, 0.05)', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                                <h4 style={{ margin: '0 0 12px 0' }}>عرضك الحالي</h4>
                                <PriceBlock amount={myOffer.offeredPrice} />
                                <div style={{ marginTop: 12, marginBottom: 16 }}>
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: 4,
                                        fontSize: 12,
                                        backgroundColor: myOffer.status === OfferStatus.ACCEPTED ? 'var(--color-success)' : myOffer.status === OfferStatus.REJECTED ? 'var(--color-error)' : 'var(--color-background)',
                                        color: myOffer.status === OfferStatus.ACCEPTED || myOffer.status === OfferStatus.REJECTED ? 'white' : 'var(--color-text-primary)'
                                    }}>
                                        حالة العرض: {
                                            myOffer.status === OfferStatus.PENDING && myOffer.proposedBy === 'CARRIER' ? 'بانتظار رد صاحب الشحنة' :
                                            myOffer.status === OfferStatus.PENDING ? 'عرض مضاد من صاحب الشحنة — دورك للرد' :
                                            myOffer.status === OfferStatus.ACCEPTED ? 'مقبول' :
                                            myOffer.status === OfferStatus.REJECTED ? `مرفوض${myOffer.rejectReason ? ` — ${myOffer.rejectReason}` : ''}` :
                                            myOffer.status === OfferStatus.COUNTERED ? 'تم الرد بعرض مضاد' : myOffer.status
                                        }
                                    </span>
                                </div>
                                {shipment.status === ShipmentStatus.ACTIVE && shipment.assignedCarrierId === user.id ? (
                                    <div style={{ padding: 12, backgroundColor: 'rgba(39, 174, 96, 0.1)', color: 'var(--color-success)', borderRadius: 8, fontWeight: 'bold', textAlign: 'center' }}>
                                        ✓ تم إسناد الشحنة إليك
                                        {shipment.tripId && (
                                            <Button style={{ width: '100%', marginTop: 12 }} onClick={() => navigate(`/app/trips/${shipment.tripId}/track`)}>عرض الرحلة</Button>
                                        )}
                                    </div>
                                ) : myOffer.status === OfferStatus.REJECTED ? (
                                    // A rejection closes the offer, not the door (INTEGRATION.md §12).
                                    (shipment.status === ShipmentStatus.PENDING_OFFERS || shipment.status === ShipmentStatus.NEGOTIATING) && (
                                        <Button style={{ width: '100%' }} variant="outline" onClick={() => { setMyOffer(null); setOfferPrice(''); }}>
                                            تقديم عرض جديد
                                        </Button>
                                    )
                                ) : (
                                    <Button style={{ width: '100%' }} onClick={() => navigate(`/app/shipments/${shipment.id}/negotiation/${myOffer.id}`)}>
                                        فتح التفاوض
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <>
                                {submitError && (
                                    <div style={{ padding: 12, marginBottom: 16, borderRadius: 8, backgroundColor: 'rgba(229,62,62,0.08)', color: 'var(--color-error)', fontSize: 13 }}>
                                        {submitError}
                                    </div>
                                )}
                                {blockReason && (
                                    <div role="status" style={{ padding: 12, marginBottom: 16, borderRadius: 8, backgroundColor: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.4)', color: '#B45309', fontSize: 13 }}>
                                        {blockReason}
                                    </div>
                                )}
                                {!blocked && eligibleTrucks.length > 0 && (
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>الشاحنة المستخدمة لهذا العرض</label>
                                        {eligibleTrucks.length > 1 ? (
                                            <select
                                                value={selectedTruckId}
                                                onChange={e => setSelectedTruckId(e.target.value)}
                                                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)' }}
                                            >
                                                {eligibleTrucks.map(t => (
                                                    <option key={t.id} value={t.id}>
                                                        {t.brand} {t.model} — {t.plateNumber}{t.capacityTons ? ` (${t.capacityTons} طن)` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <div style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-background-subtle, #f9fafb)' }}>
                                                {eligibleTrucks[0].brand} {eligibleTrucks[0].model} — {eligibleTrucks[0].plateNumber}{eligibleTrucks[0].capacityTons ? ` (${eligibleTrucks[0].capacityTons} طن)` : ''}
                                            </div>
                                        )}
                                        {tooSmallTrucks > 0 && (
                                            <div className="text-helper" style={{ fontSize: 12, marginTop: 6 }}>
                                                {tooSmallTrucks === 1 ? 'شاحنة أخرى من نفس النوع لا تظهر' : `${tooSmallTrucks} شاحنات أخرى من نفس النوع لا تظهر`} لأن حمولتها أقل من وزن الشحنة ({shipment.weight} طن).
                                            </div>
                                        )}
                                    </div>
                                )}
                                <Button
                                    variant="secondary"
                                    onClick={handleAcceptPostedPrice}
                                    isLoading={isAccepting}
                                    disabled={blocked || isSubmitting}
                                    style={{ width: '100%', marginBottom: 16 }}
                                >
                                    عرض بالسعر المطروح ({shipment.proposedPrice} ر.س)
                                </Button>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0', color: 'var(--color-text-muted)', fontSize: 13 }}>
                                    <div style={{ flex: 1, height: 1, backgroundColor: 'var(--color-border)' }} />
                                    أو قدّم سعراً مختلفاً
                                    <div style={{ flex: 1, height: 1, backgroundColor: 'var(--color-border)' }} />
                                </div>

                                <form onSubmit={handleSubmitOffer}>
                                    <div style={{ marginBottom: 16 }}>
                                        <Input
                                            numeric="integer"
                                            label="سعر عرضك (ر.س)"
                                            value={offerPrice}
                                            onChange={(e) => setOfferPrice(e.target.value)}
                                            required
                                            disabled={blocked}
                                        />
                                        <p className="text-helper" style={{ fontSize: 12, marginTop: 8 }}>
                                            بتقديمك لهذا العرض، أنت توافق على شروط النقل في حال القبول.
                                        </p>
                                    </div>
                                    <Button type="submit" isLoading={isSubmitting} disabled={blocked || isAccepting} style={{ width: '100%' }}>
                                        تقديم العرض
                                    </Button>
                                </form>
                            </>
                        )}
                    </Card>
                </div>
            </div>
        </div>
    );
};
