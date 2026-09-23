import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriceBlock } from '../../components/common/PriceBlock';
import { Input } from '../../components/common/Input';
import { shipmentService, offerService, isCarrierBusy } from '../../services/api';
import { OfferStatus, ShipmentStatus, TruckTypeAr } from '../../constants/enums';
import { lookupCityCoordinates } from '../../utils/geo';
import { MapThumbnail } from '../../components/map/MapThumbnail';

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
            Promise.all([
                shipmentService.getShipmentById(shipmentId),
                offerService.getOffersByCarrier(user.id)
            ])
            .then(([s, offers]) => {
                setShipment(s);
                const existingOffer = offers.find(o => o.shipmentId === shipmentId);
                if (existingOffer) {
                    setMyOffer(existingOffer);
                }
            })
            .catch(err => setError(err.message))
            .finally(() => setIsLoading(false));
        }
    }, [shipmentId, user]);

    // Only a truck of the required type with both papers already APPROVED
    // may be offered (INTEGRATION.md §14) — the backend rejects anything
    // else anyway, so this is filtered here rather than left for the
    // server to refuse.
    const eligibleTrucks = (user?.trucks || []).filter(t => t.isSelectable && t.type === shipment?.requiredTruckType);

    useEffect(() => {
        if (!selectedTruckId && eligibleTrucks.length > 0) setSelectedTruckId(eligibleTrucks[0].id);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eligibleTrucks.length]);

    const handleSubmitOffer = async (e) => {
        e.preventDefault();
        setSubmitError('');
        setIsSubmitting(true);
        try {
            const newOffer = await offerService.submitOffer({
                shipmentId,
                truckId: selectedTruckId,
                offeredPrice: Number(offerPrice),
            });
            setMyOffer(newOffer);
        } catch (err) {
            setSubmitError(err.message);
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
            const newOffer = await offerService.submitOffer({
                shipmentId,
                truckId: selectedTruckId,
                offeredPrice: shipment.proposedPrice,
            });
            setMyOffer(newOffer);
        } catch (err) {
            setSubmitError(err.message);
        } finally {
            setIsAccepting(false);
        }
    };

    if (isLoading) return <div>جاري التحميل...</div>;
    if (error || !shipment) return <div>{error || 'الشحنة غير موجودة'}</div>;

    const busy = user && isCarrierBusy(user);
    const hasEligibleTruck = eligibleTrucks.length > 0;

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
                                            myOffer.status === OfferStatus.PENDING ? 'قيد الانتظار' :
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
                                        ✓ تم إسناد الشحنة إليك — راجع صفحة الرحلات لمتابعتها
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
                                {busy && (
                                    <div style={{ padding: 12, marginBottom: 16, borderRadius: 8, backgroundColor: 'rgba(245,158,11,0.08)', color: 'var(--color-warning)', fontSize: 13 }}>
                                        لديك شحنة نشطة حالياً — أكملها أو ألغِها قبل تقديم عروض على شحنات أخرى.
                                    </div>
                                )}
                                {!hasEligibleTruck && (
                                    <div style={{ padding: 12, marginBottom: 16, borderRadius: 8, backgroundColor: 'rgba(245,158,11,0.08)', color: 'var(--color-warning)', fontSize: 13 }}>
                                        لا تملك شاحنة من النوع المطلوب ({TruckTypeAr[shipment.requiredTruckType] || shipment.requiredTruckType}) بأوراق موثّقة بالكامل — لا يمكنك تقديم عرض حتى تضيف واحدة وتتم الموافقة على بطاقة التشغيل والاستمارة.
                                    </div>
                                )}
                                {hasEligibleTruck && eligibleTrucks.length > 1 && (
                                    <div style={{ marginBottom: 16 }}>
                                        <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>الشاحنة المستخدمة لهذا العرض</label>
                                        <select
                                            value={selectedTruckId}
                                            onChange={e => setSelectedTruckId(e.target.value)}
                                            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)' }}
                                        >
                                            {eligibleTrucks.map(t => (
                                                <option key={t.id} value={t.id}>{t.brand} {t.model} — {t.plateNumber}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                <Button
                                    variant="secondary"
                                    onClick={handleAcceptPostedPrice}
                                    isLoading={isAccepting}
                                    disabled={busy || isSubmitting || !hasEligibleTruck}
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
                                            type="number"
                                            label="سعر عرضك (ر.س)"
                                            value={offerPrice}
                                            onChange={(e) => setOfferPrice(e.target.value)}
                                            required
                                            min="1"
                                            disabled={busy || !hasEligibleTruck}
                                        />
                                        <p className="text-helper" style={{ fontSize: 12, marginTop: 8 }}>
                                            بتقديمك لهذا العرض، أنت توافق على شروط النقل في حال القبول.
                                        </p>
                                    </div>
                                    <Button type="submit" isLoading={isSubmitting} disabled={busy || isAccepting || !hasEligibleTruck} style={{ width: '100%' }}>
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
