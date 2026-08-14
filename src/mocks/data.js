import { ShipmentStatus, OfferStatus, TripStage, UserRole, AccountType, AccountStatus, TransactionType } from '../constants/enums';
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
        completedTrips: 120
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
        completedTrips: 340
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
        loadingDate: '2023-11-15',
        loadingTime: '08:00 AM',
        proposedPrice: 4200,
        status: ShipmentStatus.OFFERS_PENDING,
        createdAt: '2023-11-10T10:00:00Z',
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
        loadingDate: '2023-11-16',
        loadingTime: '09:00 AM',
        proposedPrice: 1500,
        status: ShipmentStatus.NEGOTIATING,
        createdAt: '2023-11-11T12:00:00Z',
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
        requiredTruckType: 'تريلا جوانب',
        loadingDate: '2023-11-12',
        loadingTime: '06:00 AM',
        proposedPrice: 3500,
        finalPrice: 3750,
        status: ShipmentStatus.ACTIVE,
        createdAt: '2023-11-09T08:00:00Z',
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
        loadingDate: '2023-10-25',
        loadingTime: '02:00 PM',
        proposedPrice: 800,
        finalPrice: 800,
        status: ShipmentStatus.COMPLETED,
        createdAt: '2023-10-20T14:00:00Z',
        assignedCarrierId: 'user-carrier-2',
        offerCount: 1
    }
];
export const mockOffers = [
    {
        id: 'offer-1',
        shipmentId: 'HM-1001',
        carrierId: 'user-carrier-1',
        offeredPrice: 4000,
        status: OfferStatus.PENDING,
        submittedAt: '2023-11-11T09:00:00Z',
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
        submittedAt: '2023-11-11T10:00:00Z',
        carrierRating: 4.5,
        carrierName: 'مؤسسة السرعة للنقل',
        carrierTruckType: 'تريلا'
    }
];
export const mockTrips = [
    {
        id: 'TR-2001',
        shipmentId: 'HM-2001',
        carrierId: 'user-carrier-1',
        shipperId: 'user-shipper-1',
        currentStage: TripStage.DELIVERY_ROUTE_EN,
        finalPrice: 3750,
        startedAt: '2023-11-12T07:00:00Z',
        route: 'جدة -> المدينة المنورة'
    },
    {
        id: 'TR-0987',
        shipmentId: 'HM-0987',
        carrierId: 'user-carrier-2',
        shipperId: 'user-shipper-1',
        currentStage: TripStage.DELIVERED,
        finalPrice: 800,
        startedAt: '2023-10-25T15:00:00Z',
        completedAt: '2023-10-26T10:00:00Z',
        route: 'الرياض -> الدمام',
        rating: {
            id: 'rating-1',
            tripId: 'TR-0987',
            reviewerId: 'user-shipper-1',
            reviewedId: 'user-carrier-2',
            stars: 5,
            comment: 'توصيل سريع وممتاز',
            timestamp: '2023-10-27T08:00:00Z'
        }
    }
];
export const mockWallet = {
    userId: 'user-shipper-1',
    balance: 12450,
    reservedBalance: 3750
};
export const mockTransactions = [
    {
        id: 'txn-1',
        walletId: 'wallet-1',
        type: TransactionType.TOP_UP,
        amount: 15000,
        description: 'شحن رصيد بواسطة البطاقة الائتمانية',
        timestamp: '2023-10-01T10:00:00Z',
        balanceAfter: 15000
    },
    {
        id: 'txn-2',
        walletId: 'wallet-1',
        type: TransactionType.TRIP_SETTLEMENT,
        amount: -800,
        description: 'تسوية الرحلة TR-0987',
        timestamp: '2023-10-26T10:00:00Z',
        tripId: 'TR-0987',
        balanceAfter: 14200
    },
    {
        id: 'txn-3',
        walletId: 'wallet-1',
        type: TransactionType.COMMISSION_DEDUCTION,
        amount: -40,
        description: 'عمولة منصة حمولة (5%) - TR-0987',
        timestamp: '2023-10-26T10:00:00Z',
        tripId: 'TR-0987',
        balanceAfter: 14160
    }
];
export const mockNotifications = [
    {
        id: 'notif-1',
        userId: 'user-shipper-1',
        title: 'عرض جديد',
        message: 'تم استلام عرض جديد على شحنتك HM-1001',
        isRead: false,
        timestamp: '2023-11-11T09:05:00Z',
        linkTo: '/app/shipments/HM-1001/offers'
    },
    {
        id: 'notif-2',
        userId: 'user-shipper-1',
        title: 'تحديث حالة الرحلة',
        message: 'الرحلة TR-2001 في الطريق للتسليم',
        isRead: true,
        timestamp: '2023-11-12T14:00:00Z',
        linkTo: '/app/trips/TR-2001/track'
    }
];
