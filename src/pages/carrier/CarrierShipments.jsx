import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { DataTable } from '../../components/common/DataTable';
import { PriceBlock } from '../../components/common/PriceBlock';
import { shipmentService, authService, offerService } from '../../services/api';
import { isShipmentForCarrier, carrierBlockReason, offerBlockReason } from '../../utils/carrierEligibility';
import { CarrierBlockNotice } from '../../components/carrier/CarrierBlockNotice';
import { getCurrentPositionSafe, haversineKm, lookupCityCoordinates } from '../../utils/geo';
import { SkeletonRows } from '../../components/common/Loader';
import { useT } from '../../i18n';
import { useNames } from '../../i18n/catalog';
import { formatDateTime, formatRoute, formatWeight } from '../../utils/format';

const SORT_OPTIONS = ['newest', 'priceHighToLow', 'nearest'];

export const CarrierShipments = () => {
    const navigate = useNavigate();
    const { t } = useT();
    const { cargoName } = useNames();
    const [shipments, setShipments] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [sortOrder, setSortOrder] = useState('newest');
    const [position, setPosition] = useState(null);
    const [carrier, setCarrier] = useState(null);
    // Which of these shipments the carrier already has an offer thread on
    // (shipmentId -> offer), so the list can send them straight back into
    // that negotiation instead of only ever offering "submit a new offer".
    const [myOffersByShipment, setMyOffersByShipment] = useState({});

    useEffect(() => {
        Promise.all([
            authService.getCurrentUser(),
            shipmentService.getShipments(),
        ]).then(([user, data]) => {
            setCarrier(user);

            // Open shipments one of the carrier's trucks matches by type and
            // can carry by weight — the same rule as the home page.
            const available = data.filter(s => isShipmentForCarrier(s, user));
            setShipments(available);
            setIsLoading(false);

            offerService.getOffersByCarrier(user.id).then(offers => {
                const map = {};
                offers.forEach(o => { map[o.shipmentId] = o; });
                setMyOffersByShipment(map);
            });
        });
    }, []);

    // Fetched once; if denied/unavailable this stays null and "nearest" just
    // falls back to the incoming order — see sortedShipments below.
    useEffect(() => {
        getCurrentPositionSafe().then(setPosition);
    }, []);

    const sortedShipments = useMemo(() => {
        const list = [...shipments];
        if (sortOrder === 'priceHighToLow') {
            list.sort((a, b) => (b.proposedPrice ?? 0) - (a.proposedPrice ?? 0));
        } else if (sortOrder === 'nearest' && position) {
            const distanceOf = (s) => {
                const coords = lookupCityCoordinates(s.pickupCity);
                if (!coords) return null;
                return haversineKm(position.lat, position.lng, coords[0], coords[1]);
            };
            list.sort((a, b) => {
                const da = distanceOf(a);
                const db = distanceOf(b);
                if (da == null && db == null) return 0;
                if (da == null) return 1; // Unknown pickup city sinks to the end.
                if (db == null) return -1;
                return da - db;
            });
        }
        // 'newest' (default) and 'nearest' without a position keep the
        // incoming (already newest-first) order.
        return list;
    }, [shipments, sortOrder, position]);

    // Account-level reason (unverified, suspended, busy, debt) — shown once
    // above the list; the marketplace itself stays visible either way.
    const accountBlock = carrierBlockReason(carrier);

    const columns = [
        { key: 'route', header: t('shipments.columns.route'), render: (s) => formatRoute(s.pickupCity, s.deliveryCity) },
        { key: 'cargo', header: t('shipments.cargo'), render: (s) => cargoName(s) },
        { key: 'weight', header: t('shipments.weight'), render: (s) => formatWeight(s.weight) },
        { key: 'date', header: t('shipments.loadingDate'), render: (s) => formatDateTime(s.loadingDate) },
        { key: 'price', header: t('shipments.proposedPrice'), render: (s) => <PriceBlock amount={s.proposedPrice}/> },
        {
            key: 'actions',
            header: t('common.action'),
            render: (s) => {
                const existingOffer = myOffersByShipment[s.id];
                if (existingOffer && existingOffer.status !== 'REJECTED') {
                    return (
                        <Button size="sm" variant="outline" onClick={() => navigate(`/app/shipments/${s.id}/negotiation/${existingOffer.id}`)}>
                            {t('shipments.carrier.followMyOffer')}
                        </Button>
                    );
                }
                const reason = accountBlock || offerBlockReason(carrier, s);
                if (reason) {
                    return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', maxWidth: 220 }}>
                            <Button size="sm" variant="outline" onClick={() => navigate(`/app/shipments/${s.id}`)}>{t('shipments.carrier.viewDetails')}</Button>
                            {/* Account-level reasons are in the banner above; only truck-specific ones repeat per row. */}
                            {!accountBlock && (
                                <span style={{ fontSize: 11, color: 'var(--color-text-muted)', textAlign: 'end' }}>{reason}</span>
                            )}
                        </div>
                    );
                }
                return (
                    <Button size="sm" onClick={() => navigate(`/app/shipments/${s.id}`)}>
                        {t('shipments.carrier.makeOffer')}
                    </Button>
                );
            }
        },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0 }}>{t('shipments.carrier.browseTitle')}</h2>
                <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)' }}
                >
                    {SORT_OPTIONS.map(value => (
                        <option key={value} value={value}>{t(`shipments.carrier.sort.${value}`)}</option>
                    ))}
                </select>
            </div>

            {!isLoading && <CarrierBlockNotice reason={accountBlock} />}

            <Card>
                {isLoading ? (
                    <SkeletonRows rows={4} columns={3} label={t('shipments.carrier.loadingAvailable')} />
                ) : (
                    <DataTable
                        data={sortedShipments}
                        columns={columns}
                        keyExtractor={(s) => s.id}
                        emptyMessage={t('dashboard.noMatchingShipments')}
                    />
                )}
            </Card>
        </div>
    );
};
