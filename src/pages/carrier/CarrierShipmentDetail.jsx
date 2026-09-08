import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriceBlock } from '../../components/common/PriceBlock';
import { Input } from '../../components/common/Input';
import { shipmentService, offerService, isCarrierBusy } from '../../services/api';
import { OfferStatus, ShipmentStatus } from '../../constants/enums';
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

    const handleSubmitOffer = async (e) => {
        e.preventDefault();
        setSubmitError('');
        setIsSubmitting(true);
        try {
            const newOffer = await offerService.submitOffer({
                shipmentId,
                carrierId: user.id,
                offeredPrice: Number(offerPrice),
                carrierName: user.name || user.companyName,
                truckType: 'شاحنة نقل' // demo default
            });
            setMyOffer(newOffer);
        } catch (err) {
            setSubmitError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Directly accepts the shipper's currently-posted price without the
    // detour of typing a matching counter-value: creates the initial offer
    // at that exact price and finalizes it in one step, same end state as
    // "submit a matching offer, then accept it in the negotiation thread"
    // but as the single click a real Accept action should be.
    const handleAcceptPostedPrice = async () => {
        // Funds are reserved (not deducted) from the shipper's available
        // balance the moment this finalizes — surface that plainly before
        // committing, same as the negotiation-thread Accept action.
        if (!window.confirm(`سيتم حجز ${shipment.proposedPrice} ر.س من رصيد صاحب الشحنة المتاح عند تأكيد هذا السعر. هل تريد المتابعة؟`)) return;
        setSubmitError('');
        setIsAccepting(true);
        try {
            const newOffer = await offerService.submitOffer({
                shipmentId,
                carrierId: user.id,
                offeredPrice: shipment.proposedPrice,
                carrierName: user.name || user.companyName,
                truckType: 'شاحنة نقل' // demo default
            });
            await offerService.acceptOffer(newOffer.id, shipment.proposedPrice);
            alert(`تم قبول السعر المطروح — ${shipment.proposedPrice} ر.س\nتم تأكيد وإسناد الشحنة إليك`);
            navigate('/app');
        } catch (err) {
            setSubmitError(err.message);
        } finally {
            setIsAccepting(false);
        }
    };

    if (isLoading) return <div>جاري التحميل...</div>;
    if (error || !shipment) return <div>{error || 'الشحنة غير موجودة'}</div>;

    const busy = user && isCarrierBusy(user.id);

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
                                <div className="text-helper">موقع التحميل</div>
                                <div style={{ fontWeight: 700 }}>{shipment.pickupCity} - {shipment.pickupLocation}</div>
                            </div>
                            <div>
                                <div className="text-helper">موقع التسليم</div>
                                <div style={{ fontWeight: 700 }}>{shipment.deliveryCity} - {shipment.deliveryLocation}</div>
                            </div>
                            <div>
                                <div className="text-helper">نوع البضاعة</div>
                                <div style={{ fontWeight: 700 }}>{shipment.cargoType}</div>
                            </div>
                            <div>
                                <div className="text-helper">الوزن / الحجم</div>
                                <div style={{ fontWeight: 700 }}>{shipment.weight} طن / {shipment.volume} م³</div>
                            </div>
                            <div>
                                <div className="text-helper">نوع الشاحنة المطلوبة</div>
                                <div style={{ fontWeight: 700 }}>{shipment.requiredTruckType}</div>
                            </div>
                            <div>
                                <div className="text-helper">تاريخ ووقت التحميل</div>
                                <div style={{ fontWeight: 700 }}>{shipment.loadingDate} - {shipment.loadingTime}</div>
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
                                            myOffer.status === OfferStatus.ACCEPTED ? 'مقبول — بانتظار تأكيد صاحب الشحنة' :
                                            myOffer.status === OfferStatus.REJECTED ? 'مرفوض' :
                                            myOffer.status === OfferStatus.COUNTERED ? 'تم الرد بعرض مضاد' : myOffer.status
                                        }
                                    </span>
                                </div>
                                {shipment.status === ShipmentStatus.ACTIVE && shipment.assignedCarrierId === user.id ? (
                                    <div style={{ padding: 12, backgroundColor: 'rgba(39, 174, 96, 0.1)', color: 'var(--color-success)', borderRadius: 8, fontWeight: 'bold', textAlign: 'center' }}>
                                        ✓ تم إسناد الشحنة إليك — راجع صفحة الرحلات لمتابعتها
                                    </div>
                                ) : myOffer.status !== OfferStatus.REJECTED && (
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
                                <Button
                                    variant="secondary"
                                    onClick={handleAcceptPostedPrice}
                                    isLoading={isAccepting}
                                    disabled={busy || isSubmitting}
                                    style={{ width: '100%', marginBottom: 16 }}
                                >
                                    قبول السعر المطروح ({shipment.proposedPrice} ر.س)
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
                                            disabled={busy}
                                        />
                                        <p className="text-helper" style={{ fontSize: 12, marginTop: 8 }}>
                                            بتقديمك لهذا العرض، أنت توافق على شروط النقل في حال القبول.
                                        </p>
                                    </div>
                                    <Button type="submit" isLoading={isSubmitting} disabled={busy || isAccepting} style={{ width: '100%' }}>
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
