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

const SORT_OPTIONS = [
    { value: 'newest', label: 'الأحدث' },
    { value: 'priceHighToLow', label: 'السعر: الأعلى أولاً' },
    { value: 'nearest', label: 'الأقرب أولاً' },
];

export const CarrierShipments = () => {
    const navigate = useNavigate();
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
        { key: 'route', header: 'المسار', render: (s) => `${s.pickupCity} -> ${s.deliveryCity}` },
        { key: 'cargo', header: 'البضاعة', render: (s) => s.cargoType },
        { key: 'weight', header: 'الوزن', render: (s) => `${s.weight} طن` },
        { key: 'date', header: 'تاريخ التحميل', render: (s) => s.loadingDate },
        { key: 'price', header: 'السعر المقترح', render: (s) => <PriceBlock amount={s.proposedPrice}/> },
        {
            key: 'actions',
            header: 'الإجراء',
            render: (s) => {
                const existingOffer = myOffersByShipment[s.id];
                if (existingOffer && existingOffer.status !== 'REJECTED') {
                    return (
                        <Button size="sm" variant="outline" onClick={() => navigate(`/app/shipments/${s.id}/negotiation/${existingOffer.id}`)}>
                            متابعة عرضي
                        </Button>
                    );
                }
                const reason = accountBlock || offerBlockReason(carrier, s);
                if (reason) {
                    return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', maxWidth: 220 }}>
                            <Button size="sm" variant="outline" onClick={() => navigate(`/app/shipments/${s.id}`)}>عرض التفاصيل</Button>
                            {/* Account-level reasons are in the banner above; only truck-specific ones repeat per row. */}
                            {!accountBlock && (
                                <span style={{ fontSize: 11, color: 'var(--color-text-muted)', textAlign: 'end' }}>{reason}</span>
                            )}
                        </div>
                    );
                }
                return (
                    <Button size="sm" onClick={() => navigate(`/app/shipments/${s.id}`)}>
                        تقديم عرض
                    </Button>
                );
            }
        },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0 }}>تصفح الشحنات المتاحة</h2>
                <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--color-border)' }}
                >
                    {SORT_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>

            {!isLoading && <CarrierBlockNotice reason={accountBlock} />}

            <Card>
                {isLoading ? (
                    <SkeletonRows rows={4} columns={3} label="جاري تحميل الشحنات المتاحة" />
                ) : (
                    <DataTable
                        data={sortedShipments}
                        columns={columns}
                        keyExtractor={(s) => s.id}
                        emptyMessage="لا توجد حالياً شحنات تناسب نوع شاحنتك وحمولتها"
                    />
                )}
            </Card>
        </div>
    );
};
