import { ShipmentStatus, OfferStatus, TripStage, UserRole, AccountType, AccountStatus, TransactionType } from '../constants/enums';
import { hydrateMockStore } from './persistence';

export const mockUsers = [
    {
        id: 'user-shipper-1',
        role: UserRole.SHIPPER,
        name: 'خالد العتيبي',
        email: 'info@alnokhba.sa',
        phone: '0512345678',
        accountType: AccountType.COMPANY,
        accountStatus: AccountStatus.VERIFIED,
        companyName: 'شركة النخبة للتجارة',
        commercialRegister: '1010123456',
        city: 'الرياض'
    },
    {
        id: 'user-carrier-1',
        role: UserRole.CARRIER,
        name: 'أحمد محمد',
        email: 'ahmed@example.com',
        phone: '0500000001',
        accountType: AccountType.INDIVIDUAL,
        accountStatus: AccountStatus.VERIFIED,
        rating: 4.8,
        completedTrips: 120,
        truckType: 'شاحنة نقل ثقيل (تريلا)'
    },
    {
        id: 'user-carrier-2',
        role: UserRole.CARRIER,
        name: 'مؤسسة السرعة للنقل',
        email: 'speed@example.com',
        phone: '0500000002',
        accountType: AccountType.COMPANY,
        accountStatus: AccountStatus.VERIFIED,
        rating: 4.5,
        completedTrips: 340,
        truckType: 'تريلا مسطحة'
    },
    {
        id: 'user-admin-1',
        role: UserRole.ADMIN,
        name: 'مدير النظام',
        email: 'admin@hemola.sa',
        phone: '0500000000',
        accountStatus: AccountStatus.VERIFIED
    }
];

export const mockShipments = [
    // ─── Shipper existing shipments ───────────────────────────────────────
    {
        id: 'HM-1001',
        shipperId: 'user-shipper-1',
        pickupCity: 'الرياض',
        pickupLocation: 'مستودعات السلي',
        deliveryCity: 'جدة',
        deliveryLocation: 'الخمرة',
        cargoType: 'مواد غذائية',
        weight: 18.0,
        volume: 30,
        requiredTruckType: 'شاحنة نقل ثقيل (تريلا)',
        loadingDate: '2024-03-15',
        loadingTime: '08:00 AM',
        proposedPrice: 4200,
        status: ShipmentStatus.OFFERS_PENDING,
        createdAt: '2024-03-10T10:00:00Z',
        offerCount: 2
    },
    {
        id: 'HM-1002',
        shipperId: 'user-shipper-1',
        pickupCity: 'الدمام',
        pickupLocation: 'المدينة الصناعية',
        deliveryCity: 'الرياض',
        deliveryLocation: 'الملز',
        cargoType: 'أجهزة كهربائية',
        weight: 12.0,
        volume: 20,
        requiredTruckType: 'دينا مغلقة',
        loadingDate: '2024-03-16',
        loadingTime: '09:00 AM',
        proposedPrice: 1500,
        status: ShipmentStatus.NEGOTIATING,
        createdAt: '2024-03-11T12:00:00Z',
        offerCount: 3
    },
    {
        id: 'HM-2001',
        shipperId: 'user-shipper-1',
        pickupCity: 'جدة',
        pickupLocation: 'الميناء',
        deliveryCity: 'المدينة المنورة',
        deliveryLocation: 'المنطقة الصناعية',
        cargoType: 'مواد بناء',
        weight: 25.0,
        volume: 40,
        requiredTruckType: 'شاحنة نقل ثقيل (تريلا)',
        loadingDate: '2024-03-12',
        loadingTime: '06:00 AM',
        proposedPrice: 3500,
        finalPrice: 3750,
        status: ShipmentStatus.ACTIVE,
        createdAt: '2024-03-09T08:00:00Z',
        assignedCarrierId: 'user-carrier-1',
        offerCount: 4
    },
    {
        id: 'HM-0987',
        shipperId: 'user-shipper-1',
        pickupCity: 'الرياض',
        pickupLocation: 'الشفاء',
        deliveryCity: 'الدمام',
        deliveryLocation: 'الخالدية',
        cargoType: 'بضائع عامة',
        weight: 5.0,
        volume: 10,
        requiredTruckType: 'دينا',
        loadingDate: '2024-02-25',
        loadingTime: '02:00 PM',
        proposedPrice: 800,
        finalPrice: 800,
        status: ShipmentStatus.COMPLETED,
        createdAt: '2024-02-20T14:00:00Z',
        assignedCarrierId: 'user-carrier-2',
        offerCount: 1
    },

    // ─── HM-1003: Fresh video-flow shipment (carrier-1 hasn't offered yet) ─
    {
        id: 'HM-1003',
        shipperId: 'user-shipper-1',
        pickupCity: 'جدة',
        pickupLocation: 'الحمراء',
        deliveryCity: 'المدينة المنورة',
        deliveryLocation: 'قرب الحرم النبوي الشريف',
        cargoType: 'منتجات غذائية معلّبة',
        weight: 20.0,
        volume: 35,
        requiredTruckType: 'شاحنة نقل ثقيل (تريلا)',
        loadingDate: '2024-03-20',
        loadingTime: '07:00 AM',
        proposedPrice: 3900,
        status: ShipmentStatus.OFFERS_PENDING,
        createdAt: '2024-03-14T09:00:00Z',
        offerCount: 0
    },

    // ─── HM-3001: Available for carrier-1 (truck matches) ─────────────────
    {
        id: 'HM-3001',
        shipperId: 'user-shipper-1',
        pickupCity: 'الرياض',
        pickupLocation: 'مستودعات العليا',
        deliveryCity: 'جدة',
        deliveryLocation: 'المطار الجديد',
        cargoType: 'مواد غذائية مجمدة',
        weight: 16.0,
        volume: 28,
        requiredTruckType: 'شاحنة نقل ثقيل (تريلا)',
        loadingDate: '2024-03-21',
        loadingTime: '05:00 AM',
        proposedPrice: 4500,
        status: ShipmentStatus.OFFERS_PENDING,
        createdAt: '2024-03-15T08:00:00Z',
        offerCount: 1
    },

    // ─── HM-3002: Available (different truck type — tests filtering) ───────
    {
        id: 'HM-3002',
        shipperId: 'user-shipper-1',
        pickupCity: 'الدمام',
        pickupLocation: 'ميناء الملك عبدالعزيز',
        deliveryCity: 'الرياض',
        deliveryLocation: 'الدائري الشمالي',
        cargoType: 'أجهزة كهربائية ومنزلية',
        weight: 10.0,
        volume: 18,
        requiredTruckType: 'شاحنة صندوق مغلق',
        loadingDate: '2024-03-22',
        loadingTime: '09:00 AM',
        proposedPrice: 2700,
        status: ShipmentStatus.OFFERS_PENDING,
        createdAt: '2024-03-15T11:00:00Z',
        offerCount: 0
    },

    // ─── HM-3003: Negotiation in progress for carrier-1 ──────────────────
    {
        id: 'HM-3003',
        shipperId: 'user-shipper-1',
        pickupCity: 'جدة',
        pickupLocation: 'الكيلو 8',
        deliveryCity: 'مكة المكرمة',
        deliveryLocation: 'العزيزية',
        cargoType: 'مواد بناء',
        weight: 22.0,
        volume: 38,
        requiredTruckType: 'شاحنة نقل ثقيل (تريلا)',
        loadingDate: '2024-03-18',
        loadingTime: '06:30 AM',
        proposedPrice: 2800,
        status: ShipmentStatus.NEGOTIATING,
        createdAt: '2024-03-13T07:00:00Z',
        offerCount: 2
    },

    // ─── HM-3004: Awaiting Shipper selection (carrier-1 submitted offer) ──
    {
        id: 'HM-3004',
        shipperId: 'user-shipper-1',
        pickupCity: 'الرياض',
        pickupLocation: 'مستودعات الصناعية الثانية',
        deliveryCity: 'القصيم',
        deliveryLocation: 'بريدة الصناعية',
        cargoType: 'منتجات صناعية',
        weight: 14.0,
        volume: 22,
        requiredTruckType: 'شاحنة نقل ثقيل (تريلا)',
        loadingDate: '2024-03-19',
        loadingTime: '07:00 AM',
        proposedPrice: 2200,
        status: ShipmentStatus.SELECTION_AWAITING,
        createdAt: '2024-03-12T10:00:00Z',
        offerCount: 3
    },

    // ─── HM-0954: Cancelled shipment ─────────────────────────────────────
    {
        id: 'HM-0954',
        shipperId: 'user-shipper-1',
        pickupCity: 'مكة المكرمة',
        pickupLocation: 'أجياد',
        deliveryCity: 'جدة',
        deliveryLocation: 'البلد',
        cargoType: 'بضائع عامة',
        weight: 3.0,
        volume: 5,
        requiredTruckType: 'دينا',
        loadingDate: '2024-02-10',
        loadingTime: '10:00 AM',
        proposedPrice: 600,
        status: ShipmentStatus.CANCELLED,
        createdAt: '2024-02-05T09:00:00Z',
        offerCount: 0
    },
    // ─── HM-0800: Completed shipment for user-carrier-1 ───────────────────
    {
        id: 'HM-0800',
        shipperId: 'demo-shipper',
        pickupCity: 'الرياض',
        pickupLocation: 'الملز',
        deliveryCity: 'الدمام',
        deliveryLocation: 'الخبر',
        cargoType: 'أثاث مكتبي',
        weight: 12.0,
        volume: 25,
        requiredTruckType: 'شاحنة صندوق مغلق',
        loadingDate: '2024-01-15',
        loadingTime: '08:00 AM',
        proposedPrice: 1800,
        finalPrice: 1900,
        status: ShipmentStatus.COMPLETED,
        createdAt: '2024-01-10T09:00:00Z',
        assignedCarrierId: 'user-carrier-1',
        offerCount: 2
    },
    // ─── HM-0801: Cancelled shipment for user-carrier-1 ───────────────────
    {
        id: 'HM-0801',
        shipperId: 'demo-shipper',
        pickupCity: 'جدة',
        pickupLocation: 'الصفا',
        deliveryCity: 'ينبع',
        deliveryLocation: 'الصناعية',
        cargoType: 'معدات',
        weight: 8.0,
        volume: 15,
        requiredTruckType: 'دينا',
        loadingDate: '2024-02-20',
        loadingTime: '11:00 AM',
        proposedPrice: 1200,
        finalPrice: 1200,
        status: ShipmentStatus.CANCELLED,
        createdAt: '2024-02-15T14:00:00Z',
        assignedCarrierId: 'user-carrier-1',
        offerCount: 1
    }
];

export const mockOffers = [
    // Existing offers on HM-1001
    {
        id: 'offer-1',
        shipmentId: 'HM-1001',
        carrierId: 'user-carrier-1',
        offeredPrice: 4000,
        status: OfferStatus.PENDING,
        submittedAt: '2024-03-11T09:00:00Z',
        carrierRating: 4.8,
        carrierName: 'أحمد محمد',
        carrierTruckType: 'شاحنة نقل ثقيل'
    },
    {
        id: 'offer-2',
        shipmentId: 'HM-1001',
        carrierId: 'user-carrier-2',
        offeredPrice: 3800,
        status: OfferStatus.COUNTERED,
        submittedAt: '2024-03-11T10:00:00Z',
        carrierRating: 4.5,
        carrierName: 'مؤسسة السرعة للنقل',
        carrierTruckType: 'تريلا'
    },

    // HM-3003: carrier-1 offer in negotiation (COUNTERED)
    {
        id: 'offer-3',
        shipmentId: 'HM-3003',
        carrierId: 'user-carrier-1',
        offeredPrice: 2600,
        status: OfferStatus.COUNTERED,
        submittedAt: '2024-03-14T08:00:00Z',
        carrierRating: 4.8,
        carrierName: 'أحمد محمد',
        carrierTruckType: 'شاحنة نقل ثقيل'
    },

    // HM-3004: carrier-1 offer awaiting shipper selection (PENDING)
    {
        id: 'offer-4',
        shipmentId: 'HM-3004',
        carrierId: 'user-carrier-1',
        offeredPrice: 2100,
        status: OfferStatus.PENDING,
        submittedAt: '2024-03-13T11:00:00Z',
        carrierRating: 4.8,
        carrierName: 'أحمد محمد',
        carrierTruckType: 'شاحنة نقل ثقيل'
    },

    // HM-3004: another carrier offer
    {
        id: 'offer-5',
        shipmentId: 'HM-3004',
        carrierId: 'user-carrier-2',
        offeredPrice: 2300,
        status: OfferStatus.PENDING,
        submittedAt: '2024-03-13T13:00:00Z',
        carrierRating: 4.5,
        carrierName: 'مؤسسة السرعة للنقل',
        carrierTruckType: 'تريلا مسطحة'
    }
];

export const mockTrips = [
    // Active trip — carrier-1, in EN_ROUTE_DELIVERY (good for demo testing)
    {
        id: 'TR-2001',
        shipmentId: 'HM-2001',
        carrierId: 'user-carrier-1',
        shipperId: 'user-shipper-1',
        currentStage: TripStage.EN_ROUTE_DELIVERY,
        finalPrice: 3750,
        startedAt: '2024-03-12T07:00:00Z',
        route: 'جدة -> المدينة المنورة',
        carrierName: 'أحمد محمد'
    },
    // Completed trip — carrier-2
    {
        id: 'TR-0987',
        shipmentId: 'HM-0987',
        carrierId: 'user-carrier-2',
        shipperId: 'user-shipper-1',
        currentStage: TripStage.DELIVERED,
        finalPrice: 800,
        startedAt: '2024-02-25T15:00:00Z',
        completedAt: '2024-02-26T10:00:00Z',
        route: 'الرياض -> الدمام',
        carrierName: 'مؤسسة السرعة للنقل',
        rating: {
            id: 'rating-1',
            tripId: 'TR-0987',
            reviewerId: 'user-shipper-1',
            reviewedId: 'user-carrier-2',
            stars: 5,
            comment: 'توصيل سريع وممتاز',
            timestamp: '2024-02-27T08:00:00Z'
        }
    },
    // Completed trip - carrier-1
    {
        id: 'TR-0800',
        shipmentId: 'HM-0800',
        carrierId: 'user-carrier-1',
        shipperId: 'demo-shipper',
        currentStage: TripStage.DELIVERED,
        finalPrice: 1900,
        startedAt: '2024-01-15T09:00:00Z',
        completedAt: '2024-01-16T14:00:00Z',
        route: 'الرياض -> الدمام',
        carrierName: 'أحمد محمد',
        rating: {
            id: 'rating-2',
            tripId: 'TR-0800',
            reviewerId: 'demo-shipper',
            reviewedId: 'user-carrier-1',
            stars: 4,
            comment: 'خدمة جيدة جداً',
            timestamp: '2024-01-17T10:00:00Z'
        }
    },
    // Cancelled trip - carrier-1
    {
        id: 'TR-0801',
        shipmentId: 'HM-0801',
        carrierId: 'user-carrier-1',
        shipperId: 'demo-shipper',
        currentStage: TripStage.ASSIGNED,
        overallStatus: 'CANCELLED',
        finalPrice: 1200,
        startedAt: '2024-02-20T11:00:00Z',
        route: 'جدة -> ينبع',
        carrierName: 'أحمد محمد',
        cancellation: { cancelledBy: 'SHIPPER', commission: 0, at: '2024-02-20T12:00:00Z' }
    }
];

export const mockWallets = [
    {
        userId: 'user-shipper-1',
        balance: 12450,
        reservedBalance: 3750
    },
    {
        userId: 'user-carrier-1',
        balance: 8500,
        reservedBalance: 0
    },
    // The synthetic poster behind every DEMO_MODE carrier-side trickled
    // shipment (see shipmentService.injectDemoShipment) — without a funded
    // wallet here, offerService.acceptOffer's balance check would refuse
    // every single demo shipment forever, since it always reserves funds
    // from the shipment's shipperId. Pre-funded generously so a carrier can
    // actually complete the full browse -> offer -> accept -> trip flow
    // against demo listings, not just view them.
    {
        userId: 'demo-shipper',
        balance: 1000000,
        reservedBalance: 0
    }
];

export const mockTransactions = [
    {
        id: 'txn-1',
        walletId: 'user-shipper-1',
        type: TransactionType.TOP_UP,
        amount: 15000,
        description: 'شحن رصيد بواسطة البطاقة الائتمانية',
        timestamp: '2024-01-01T10:00:00Z',
        balanceAfter: 15000
    },
    {
        id: 'txn-2',
        walletId: 'user-shipper-1',
        type: TransactionType.TRIP_SETTLEMENT,
        amount: -800,
        description: 'تسوية الرحلة TR-0987',
        timestamp: '2024-02-26T10:00:00Z',
        tripId: 'TR-0987',
        balanceAfter: 14200
    },
    {
        id: 'txn-3',
        walletId: 'user-shipper-1',
        type: TransactionType.COMMISSION_DEDUCTION,
        amount: -40,
        description: 'عمولة منصة حمولة (5%) - TR-0987',
        timestamp: '2024-02-26T10:00:00Z',
        tripId: 'TR-0987',
        balanceAfter: 14160
    },
    {
        id: 'txn-4',
        walletId: 'user-carrier-1',
        type: TransactionType.TRIP_SETTLEMENT,
        amount: 3750,
        description: 'تسوية رحلة TR-2001',
        timestamp: '2024-03-12T08:00:00Z',
        tripId: 'TR-2001',
        balanceAfter: 8500
    },
    {
        id: 'txn-5',
        walletId: 'user-carrier-1',
        type: TransactionType.TRIP_SETTLEMENT,
        amount: 1805, // 1900 - 5% commission
        description: 'تسوية رحلة TR-0800',
        timestamp: '2024-01-16T15:00:00Z',
        tripId: 'TR-0800',
        balanceAfter: 10305
    }
];

export const mockNotifications = [
    {
        id: 'notif-1',
        userId: 'user-shipper-1',
        title: 'عرض جديد',
        message: 'تم استلام عرض جديد على شحنتك HM-1001',
        isRead: false,
        timestamp: '2024-03-11T09:05:00Z',
        linkTo: '/app/shipments/HM-1001/offers'
    },
    {
        id: 'notif-2',
        userId: 'user-shipper-1',
        title: 'تحديث حالة الرحلة',
        message: 'الرحلة TR-2001 في الطريق للتسليم',
        isRead: true,
        timestamp: '2024-03-12T14:00:00Z',
        linkTo: '/app/trips/TR-2001/track'
    },
    {
        id: 'notif-3',
        userId: 'user-carrier-1',
        title: 'عرض مضاد',
        message: 'قدّم صاحب الشحنة عرضاً مضاداً على HM-3003',
        isRead: false,
        timestamp: '2024-03-14T09:00:00Z',
        linkTo: '/app/shipments/HM-3003'
    }
];

/** Bundle used to hydrate/persist the whole mock store as one unit — see persistence.js. */
export const MOCK_ARRAYS = {
    mockUsers,
    mockShipments,
    mockOffers,
    mockTrips,
    mockWallets,
    mockTransactions,
    mockNotifications,
};

// Restores anything created in a previous session (new registrations,
// posted shipments, offers, wallet activity) before the app reads any of
// the arrays above — a refresh should never quietly reset the demo.
hydrateMockStore(MOCK_ARRAYS);
