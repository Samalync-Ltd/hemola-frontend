import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { StatusBadge } from '../../components/common/StatusBadge';
import { PriceBlock } from '../../components/common/PriceBlock';
import { Input } from '../../components/common/Input';
import { shipmentService, offerService } from '../../services/api';
import { offerBlockReason, usableTrucksFor, truckCanCarry, isTruckApproved } from '../../utils/carrierEligibility';
import { OfferStatus, ShipmentStatus } from '../../constants/enums';
import { lookupCityCoordinates } from '../../utils/geo';
import { MapThumbnail } from '../../components/map/MapThumbnail';
import { toUserMessage } from '../../utils/errors';
import { useT } from '../../i18n';
import { useNames } from '../../i18n/catalog';
import { formatDateTime, formatWeight, displayAmount } from '../../utils/format';
import { Loader } from '../../components/common/Loader';

export const CarrierShipmentDetail = ({ user }) => {
    const { shipmentId } = useParams();
    const navigate = useNavigate();
    const { t } = useT();
    const { cargoName, truckName } = useNames();
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
            .catch(err => setError(toUserMessage(err)))
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
            setSubmitError(toUserMessage(err));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Offers exactly the shipper's posted price. The posted price is not an
    // offer the carrier can accept — acceptOffer only lets the side that did
    // NOT make an offer accept it (INTEGRATION.md §12) — so this sends an
    // offer at that price and the shipper confirms it with one click.
    const handleAcceptPostedPrice = async () => {
        if (!window.confirm(t('shipments.carrier.confirmPostedPrice', { amount: displayAmount(shipment.proposedPrice) }))) return;
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
            setSubmitError(toUserMessage(err));
        } finally {
            setIsAccepting(false);
        }
    };

    if (isLoading) return <Loader label={t('shipments.loadingOne')} />;
    if (error || !shipment) return <div>{error || t('errors.app.shipmentNotFound')}</div>;

    // The same reason the home page and the shipments list show.
    const blockReason = offerBlockReason(user, shipment);
    const blocked = !!blockReason;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ margin: 0, marginBottom: 8 }}>{t('shipments.detail.title', { id: shipment.id })}</h2>
                    <StatusBadge status={shipment.status} />
                </div>
                <Button variant="outline" onClick={() => navigate('/app/shipments')}>{t('shipments.detail.backToList')}</Button>
            </div>

            <div className="responsive-two-col">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <Card>
                        <h3 style={{ marginBottom: 16 }}>{t('shipments.detail.routeAndCargo')}</h3>
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
                                    <MapThumbnail pickup={pickup} delivery={delivery} height={160} title={t('shipments.carrier.routePreview')} />
                                </div>
                            );
                        })()}
                        <div className="responsive-two-col-even">
                            <div>
                                <div className="text-helper">{t('shipments.pickupCity')}</div>
                                <div style={{ fontWeight: 700 }}>{shipment.pickupCity}</div>
                            </div>
                            <div>
                                <div className="text-helper">{t('shipments.deliveryCity')}</div>
                                <div style={{ fontWeight: 700 }}>{shipment.deliveryCity}</div>
                            </div>
                            <div>
                                <div className="text-helper">{t('shipments.cargoType')}</div>
                                <div style={{ fontWeight: 700 }}>{cargoName(shipment)}</div>
                            </div>
                            <div>
                                <div className="text-helper">{t('shipments.weight')}</div>
                                <div style={{ fontWeight: 700 }}>{formatWeight(shipment.weight)}</div>
                            </div>
                            <div>
                                <div className="text-helper">{t('shipments.requiredTruckType')}</div>
                                <div style={{ fontWeight: 700 }}>{truckName(shipment.requiredTruckType)}</div>
                            </div>
                            <div>
                                <div className="text-helper">{t('shipments.loadingDateTime')}</div>
                                <div style={{ fontWeight: 700 }}>{formatDateTime(shipment.loadingDate)}</div>
                            </div>
                        </div>
                        {shipment.description && (
                            <div style={{ marginTop: 16 }}>
                                <div className="text-helper">{t('shipments.extraNotes')}</div>
                                <div>{shipment.description}</div>
                            </div>
                        )}
                    </Card>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <Card>
                        <h3 style={{ marginBottom: 16 }}>{t('shipments.carrier.priceAndOffers')}</h3>
                        <div style={{ marginBottom: 24 }}>
                            <div className="text-helper">{t('shipments.carrier.shipperPrice')}</div>
                            <PriceBlock amount={shipment.proposedPrice} size="lg" />
                        </div>

                        {myOffer ? (
                            <div style={{ padding: 16, backgroundColor: 'rgba(255, 122, 41, 0.05)', borderRadius: 8, border: '1px solid var(--color-border)' }}>
                                <h4 style={{ margin: '0 0 12px 0' }}>{t('shipments.carrier.yourOffer')}</h4>
                                <PriceBlock amount={myOffer.offeredPrice} />
                                <div style={{ marginTop: 12, marginBottom: 16 }}>
                                    <span style={{
                                        padding: '4px 8px',
                                        borderRadius: 4,
                                        fontSize: 12,
                                        backgroundColor: myOffer.status === OfferStatus.ACCEPTED ? 'var(--color-success)' : myOffer.status === OfferStatus.REJECTED ? 'var(--color-error)' : 'var(--color-background)',
                                        color: myOffer.status === OfferStatus.ACCEPTED || myOffer.status === OfferStatus.REJECTED ? 'white' : 'var(--color-text-primary)'
                                    }}>
                                        {t('shipments.carrier.offerStatus')} {
                                            myOffer.status === OfferStatus.PENDING && myOffer.proposedBy === 'CARRIER' ? t('shipments.carrier.offerState.waitingShipper') :
                                            myOffer.status === OfferStatus.PENDING ? t('shipments.carrier.offerState.yourTurn') :
                                            myOffer.status === OfferStatus.ACCEPTED ? t('enums.offerStatus.ACCEPTED') :
                                            myOffer.status === OfferStatus.REJECTED ? `${t('enums.offerStatus.REJECTED')}${myOffer.rejectReason ? ` — ${myOffer.rejectReason}` : ''}` :
                                            myOffer.status === OfferStatus.COUNTERED ? t('shipments.carrier.offerState.countered') : myOffer.status
                                        }
                                    </span>
                                </div>
                                {shipment.status === ShipmentStatus.ACTIVE && shipment.assignedCarrierId === user.id ? (
                                    <div style={{ padding: 12, backgroundColor: 'rgba(39, 174, 96, 0.1)', color: 'var(--color-success)', borderRadius: 8, fontWeight: 'bold', textAlign: 'center' }}>
                                        ✓ {t('shipments.carrier.assignedToYou')}
                                        {shipment.tripId && (
                                            <Button style={{ width: '100%', marginTop: 12 }} onClick={() => navigate(`/app/trips/${shipment.tripId}/track`)}>{t('trips.view')}</Button>
                                        )}
                                    </div>
                                ) : myOffer.status === OfferStatus.REJECTED ? (
                                    // A rejection closes the offer, not the door (INTEGRATION.md §12).
                                    (shipment.status === ShipmentStatus.PENDING_OFFERS || shipment.status === ShipmentStatus.NEGOTIATING) && (
                                        <Button style={{ width: '100%' }} variant="outline" onClick={() => { setMyOffer(null); setOfferPrice(''); }}>
                                            {t('shipments.carrier.newOffer')}
                                        </Button>
                                    )
                                ) : (
                                    <Button style={{ width: '100%' }} onClick={() => navigate(`/app/shipments/${shipment.id}/negotiation/${myOffer.id}`)}>
                                        {t('offers.openNegotiation')}
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
                                        <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>{t('shipments.carrier.truckForOffer')}</label>
                                        {eligibleTrucks.length > 1 ? (
                                            <select
                                                value={selectedTruckId}
                                                onChange={e => setSelectedTruckId(e.target.value)}
                                                style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)' }}
                                            >
                                                {eligibleTrucks.map(truck => (
                                                    <option key={truck.id} value={truck.id}>
                                                        {truck.brand} {truck.model} — {truck.plateNumber}{truck.capacityTons ? ` (${formatWeight(truck.capacityTons)})` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <div style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-background-subtle, #f9fafb)' }}>
                                                {eligibleTrucks[0].brand} {eligibleTrucks[0].model} — {eligibleTrucks[0].plateNumber}{eligibleTrucks[0].capacityTons ? ` (${formatWeight(eligibleTrucks[0].capacityTons)})` : ''}
                                            </div>
                                        )}
                                        {tooSmallTrucks > 0 && (
                                            <div className="text-helper" style={{ fontSize: 12, marginTop: 6 }}>
                                                {tooSmallTrucks === 1 ? t('shipments.carrier.tooSmallOne', { weight: shipment.weight }) : t('shipments.carrier.tooSmallMany', { count: tooSmallTrucks, weight: shipment.weight })}
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
                                    {t('shipments.carrier.offerPostedPrice', { amount: displayAmount(shipment.proposedPrice) })}
                                </Button>

                                <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0', color: 'var(--color-text-muted)', fontSize: 13 }}>
                                    <div style={{ flex: 1, height: 1, backgroundColor: 'var(--color-border)' }} />
                                    {t('shipments.carrier.orDifferentPrice')}
                                    <div style={{ flex: 1, height: 1, backgroundColor: 'var(--color-border)' }} />
                                </div>

                                <form onSubmit={handleSubmitOffer}>
                                    <div style={{ marginBottom: 16 }}>
                                        <Input
                                            numeric="integer"
                                            label={t('shipments.carrier.yourPrice')}
                                            value={offerPrice}
                                            onChange={(e) => setOfferPrice(e.target.value)}
                                            required
                                            disabled={blocked}
                                        />
                                        <p className="text-helper" style={{ fontSize: 12, marginTop: 8 }}>
                                            {t('shipments.carrier.agreeTerms')}
                                        </p>
                                    </div>
                                    <Button type="submit" isLoading={isSubmitting} disabled={blocked || isAccepting} style={{ width: '100%' }}>
                                        {t('shipments.carrier.submitOffer')}
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
