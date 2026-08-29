import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { DataTable } from '../../components/common/DataTable';
import { PriceBlock } from '../../components/common/PriceBlock';
import { shipmentService, authService, walletService, offerService, isCarrierBusy } from '../../services/api';
import { ShipmentStatus } from '../../constants/enums';
import { getCurrentPositionSafe, haversineKm, lookupCityCoordinates } from '../../utils/geo';
import { DEMO_MODE } from '../../constants/config';
import { useDemoShipmentTrickle } from '../../hooks/useDemoShipmentTrickle';

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
    const [wallet, setWallet] = useState(null);
    // Which of these shipments the carrier already has an offer thread on
    // (shipmentId -> offer), so the list can send them straight back into
    // that negotiation instead of only ever offering "submit a new offer".
    const [myOffersByShipment, setMyOffersByShipment] = useState({});
    // Gates the demo-trickle effect below — only known once the real fetch
    // resolves, so it's state rather than derived inline.
    const [shouldTrickle, setShouldTrickle] = useState(false);

    useEffect(() => {
        Promise.all([
            authService.getCurrentUser(),
            walletService.getWallet(),
            shipmentService.getShipments(),
        ]).then(([user, w, data]) => {
            setCarrier(user);
            setWallet(w);

            // Carriers can only browse shipments that are looking for offers
            // and match the truck type registered on their account.
            const available = data.filter(s =>
                (s.status === ShipmentStatus.OFFERS_PENDING || s.status === ShipmentStatus.NEGOTIATING) &&
                (!user?.truckType || !s.requiredTruckType || s.requiredTruckType === user.truckType)
            );
            setShipments(available);
            setIsLoading(false);

            offerService.getOffersByCarrier(user.id).then(offers => {
                const map = {};
                offers.forEach(o => { map[o.shipmentId] = o; });
                setMyOffersByShipment(map);
            });

            // The demo trickle only ever matters when the real list is
            // genuinely empty — whether that's a brand-new account or just
            // no current matches for this truck type. Gating on that alone
            // (rather than requiring the account to have come through the
            // registration wizard specifically) means it works no matter how
            // the account got here, including a stale/partial session.
            if (DEMO_MODE && available.length === 0) setShouldTrickle(true);
        });
    }, []);

    useDemoShipmentTrickle(shouldTrickle, carrier?.truckType, (injected) => {
        setShipments(prev => [injected, ...prev]);
    });

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

    // A blacklisted carrier — or one owing cancellation commission — can't
    // browse or bid on shipments. Mirrors mobile's shipments_screen.dart gate.
    if (!isLoading && carrier?.isBlacklisted) {
        return (
            <Card>
                <h3 style={{ marginBottom: 8 }}>الحساب موقوف</h3>
                <p className="text-helper">
                    تم إيقاف حسابك بسبب تكرار الاعتذار عن الرحلات بعد إسنادها. لا يمكنك تصفّح الشحنات أو
                    تقديم عروض حالياً — يرجى التواصل مع دعم المنصة.
                </p>
            </Card>
        );
    }
    if (!isLoading && wallet && wallet.balance < -0.009) {
        return (
            <Card>
                <h3 style={{ marginBottom: 8 }}>عمولة إلغاء مستحقة</h3>
                <p className="text-helper">
                    عليك سداد {Math.abs(wallet.balance)} ر.س من عمولة إلغاء سابقة قبل قبول شحنات جديدة. يتم
                    خصم المبلغ تلقائياً من تسوية رحلتك القادمة، أو يمكنك التواصل مع دعم المنصة لتسويته.
                </p>
            </Card>
        );
    }
    // The busy rule itself is enforced hard, server-side, in isCarrierBusy /
    // offerService.submitOffer / offerService.acceptOffer regardless of what
    // this screen shows — so here it only changes what the carrier can DO
    // with each row, never what they can see. The full marketplace stays
    // visible; only the action is disabled with an explanatory notice.
    const busy = !!(carrier && isCarrierBusy(carrier.id));

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
                if (busy) {
                    return (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                            <Button size="sm" disabled>تقديم عرض</Button>
                            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', textAlign: 'end' }}>
                                لديك رحلة نشطة — أكملها أولاً
                            </span>
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

            <Card>
                {isLoading ? (
                    <div>جاري التحميل...</div>
                ) : (
                    <DataTable
                        data={sortedShipments}
                        columns={columns}
                        keyExtractor={(s) => s.id}
                        emptyMessage="لا توجد شحنات متاحة حالياً المطابقة لنوع مركبتك"
                    />
                )}
            </Card>
        </div>
    );
};
