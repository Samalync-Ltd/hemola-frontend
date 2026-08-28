// Content used only by the DEMO_MODE simulated-activity trickle (see
// src/constants/config.js) — realistic-looking shipments and carrier offers
// representing *other* users' activity, matching the same quality bar as
// mocks/data.js (real Saudi routes, plausible company/carrier names, varied
// cargo and pricing). Mirrors hemola/lib/data/mock/demo_pool.dart on mobile
// so the demo feels the same on both platforms.

/** Extra marketplace shipments simulating other shippers posting. */
export const demoCarrierFeedShipments = [
    {
        id: 'demo-shp-1',
        pickupCity: 'جدة',
        deliveryCity: 'الرياض',
        cargoType: 'أجهزة كهربائية',
        weight: 8.5,
        loadingDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
        proposedPrice: 4200,
        requiredTruckType: 'دينا مغلقة',
        status: 'OFFERS_PENDING',
    },
    {
        id: 'demo-shp-2',
        pickupCity: 'الدمام',
        deliveryCity: 'مكة المكرمة',
        cargoType: 'مواد بناء',
        weight: 18,
        loadingDate: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
        proposedPrice: 6800,
        requiredTruckType: 'تريلا جوانب',
        status: 'OFFERS_PENDING',
    },
    {
        id: 'demo-shp-3',
        pickupCity: 'الرياض',
        deliveryCity: 'الخبر',
        cargoType: 'مواد غذائية',
        weight: 12,
        loadingDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
        proposedPrice: 3900,
        requiredTruckType: 'شاحنة نقل ثقيل (تريلا)',
        status: 'OFFERS_PENDING',
    },
    {
        id: 'demo-shp-4',
        pickupCity: 'المدينة المنورة',
        deliveryCity: 'جدة',
        cargoType: 'أثاث',
        weight: 6,
        loadingDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
        proposedPrice: 3100,
        requiredTruckType: 'دينا',
        status: 'OFFERS_PENDING',
    },
];

/** Plausible carriers used to simulate an incoming offer on a shipper's first shipment. */
export const demoCarriers = [
    { name: 'مؤسسة الوصل السريع للنقل', rating: 4.7, truckType: 'تريلا جوانب' },
    { name: 'فهد العتيبي', rating: 4.5, truckType: 'دينا مغلقة' },
    { name: 'شركة الدرب الأمين للشحن', rating: 4.8, truckType: 'شاحنة نقل ثقيل (تريلا)' },
];

export const pickRandomDemoCarrier = () => demoCarriers[Math.floor(Math.random() * demoCarriers.length)];
