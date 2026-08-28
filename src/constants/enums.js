export var ShipmentStatus;
(function (ShipmentStatus) {
    ShipmentStatus["OFFERS_PENDING"] = "OFFERS_PENDING";
    ShipmentStatus["NEGOTIATING"] = "NEGOTIATING";
    ShipmentStatus["SELECTION_AWAITING"] = "SELECTION_AWAITING";
    ShipmentStatus["ACTIVE"] = "ACTIVE";
    ShipmentStatus["COMPLETED"] = "COMPLETED";
    ShipmentStatus["CANCELLED"] = "CANCELLED";
})(ShipmentStatus || (ShipmentStatus = {}));
export const ShipmentStatusAr = {
    [ShipmentStatus.OFFERS_PENDING]: 'بانتظار العروض',
    [ShipmentStatus.NEGOTIATING]: 'قيد التفاوض',
    [ShipmentStatus.SELECTION_AWAITING]: 'بانتظار اختيار ناقل',
    [ShipmentStatus.ACTIVE]: 'قيد التنفيذ',
    [ShipmentStatus.COMPLETED]: 'مكتملة',
    [ShipmentStatus.CANCELLED]: 'ملغاة'
};
export var OfferStatus;
(function (OfferStatus) {
    OfferStatus["PENDING"] = "PENDING";
    OfferStatus["COUNTERED"] = "COUNTERED";
    OfferStatus["ACCEPTED"] = "ACCEPTED";
    OfferStatus["REJECTED"] = "REJECTED";
})(OfferStatus || (OfferStatus = {}));
export const OfferStatusAr = {
    [OfferStatus.PENDING]: 'بانتظار الرد',
    [OfferStatus.COUNTERED]: 'عرض مضاد',
    [OfferStatus.ACCEPTED]: 'مقبول',
    [OfferStatus.REJECTED]: 'مرفوض'
};
export var TripStage;
(function (TripStage) {
    TripStage["ASSIGNED"] = "ASSIGNED";
    TripStage["EN_ROUTE_PICKUP"] = "EN_ROUTE_PICKUP";
    TripStage["ARRIVED_PICKUP"] = "ARRIVED_PICKUP";
    TripStage["LOADED"] = "LOADED";
    TripStage["EN_ROUTE_DELIVERY"] = "EN_ROUTE_DELIVERY";
    TripStage["DELIVERED"] = "DELIVERED";
})(TripStage || (TripStage = {}));
export const TripStageAr = {
    [TripStage.ASSIGNED]: 'تم إسناد الشحنة',
    [TripStage.EN_ROUTE_PICKUP]: 'في الطريق لموقع التحميل',
    [TripStage.ARRIVED_PICKUP]: 'تم الوصول للتحميل',
    [TripStage.LOADED]: 'تم التحميل',
    [TripStage.EN_ROUTE_DELIVERY]: 'في الطريق للتسليم',
    [TripStage.DELIVERED]: 'تم التسليم'
};
export var UserRole;
(function (UserRole) {
    UserRole["SHIPPER"] = "SHIPPER";
    UserRole["CARRIER"] = "CARRIER";
    UserRole["ADMIN"] = "ADMIN";
})(UserRole || (UserRole = {}));
export var AccountType;
(function (AccountType) {
    AccountType["INDIVIDUAL"] = "INDIVIDUAL";
    AccountType["COMPANY"] = "COMPANY";
})(AccountType || (AccountType = {}));
export var AccountStatus;
(function (AccountStatus) {
    AccountStatus["UNDER_REVIEW"] = "UNDER_REVIEW";
    AccountStatus["VERIFIED"] = "VERIFIED";
    AccountStatus["REJECTED"] = "REJECTED";
})(AccountStatus || (AccountStatus = {}));
export var DocumentStatus;
(function (DocumentStatus) {
    DocumentStatus["PENDING"] = "PENDING";
    DocumentStatus["APPROVED"] = "APPROVED";
    DocumentStatus["REJECTED"] = "REJECTED";
})(DocumentStatus || (DocumentStatus = {}));
export var TransactionType;
(function (TransactionType) {
    TransactionType["COMMISSION_DEDUCTION"] = "COMMISSION_DEDUCTION";
    TransactionType["TOP_UP"] = "TOP_UP";
    TransactionType["FEE_DEDUCTION"] = "FEE_DEDUCTION";
    TransactionType["TRIP_SETTLEMENT"] = "TRIP_SETTLEMENT";
    // Matches mobile's WalletTransactionType.withdrawal — previously a raw
    // 'WITHDRAWAL' string literal in services/api.js instead of a real enum
    // member; kept as one canonical value here now.
    TransactionType["WITHDRAWAL"] = "WITHDRAWAL";
})(TransactionType || (TransactionType = {}));
