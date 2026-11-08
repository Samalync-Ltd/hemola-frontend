export var ShipmentStatus;
(function (ShipmentStatus) {
    ShipmentStatus["PENDING_OFFERS"] = "PENDING_OFFERS";
    ShipmentStatus["NEGOTIATING"] = "NEGOTIATING";
    ShipmentStatus["ACTIVE"] = "ACTIVE";
    ShipmentStatus["COMPLETED"] = "COMPLETED";
    ShipmentStatus["CANCELLED"] = "CANCELLED";
})(ShipmentStatus || (ShipmentStatus = {}));
export const ShipmentStatusAr = {
    [ShipmentStatus.PENDING_OFFERS]: 'بانتظار العروض',
    [ShipmentStatus.NEGOTIATING]: 'قيد التفاوض',
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
// Whoever proposed the current live (PENDING) offer in a negotiation
// thread — the OTHER side is the one who may accept or counter it. The
// single most important field in the negotiation flow (INTEGRATION.md §9).
export var ProposedBy;
(function (ProposedBy) {
    ProposedBy["SHIPPER"] = "SHIPPER";
    ProposedBy["CARRIER"] = "CARRIER";
})(ProposedBy || (ProposedBy = {}));
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
// A field separate from `stage` — TripStage has no cancelled member, so a
// cancelled trip keeps whatever stage it died at; ALWAYS read `status`
// before `stage` (INTEGRATION.md §8).
export var TripStatus;
(function (TripStatus) {
    TripStatus["ACTIVE"] = "ACTIVE";
    TripStatus["COMPLETED"] = "COMPLETED";
    TripStatus["CANCELLED"] = "CANCELLED";
})(TripStatus || (TripStatus = {}));
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
// Truck type enum — matches hemooltak-backend/INTEGRATION.md §1 exactly.
export var TruckType;
(function (TruckType) {
    TruckType["FLATBED"] = "FLATBED";
    TruckType["HEAVY_CARGO"] = "HEAVY_CARGO";
    TruckType["REFRIGERATED"] = "REFRIGERATED";
    TruckType["BOX_TRUCK"] = "BOX_TRUCK";
    TruckType["TANKER"] = "TANKER";
    TruckType["LOW_LOADER"] = "LOW_LOADER";
    TruckType["OTHER"] = "OTHER";
})(TruckType || (TruckType = {}));
export const TruckTypeAr = {
    [TruckType.FLATBED]: 'مسطحة',
    [TruckType.HEAVY_CARGO]: 'شحن ثقيل',
    [TruckType.REFRIGERATED]: 'مبردة',
    [TruckType.BOX_TRUCK]: 'صندوق مغلق',
    [TruckType.TANKER]: 'صهريج',
    [TruckType.LOW_LOADER]: 'لودر منخفض',
    [TruckType.OTHER]: 'أخرى',
};
export const TRUCK_TYPE_OPTIONS = Object.values(TruckType);
// Matches hemooltak-backend/INTEGRATION.md §8 exactly. FEE_DEDUCTION is
// only debt recovered; a payout is WITHDRAWAL and an admin write-off is
// DEBT_FORGIVENESS (amount 0 — nothing moves, only the debt shrinks).
export var TransactionType;
(function (TransactionType) {
    TransactionType["TOP_UP"] = "TOP_UP";
    TransactionType["COMMISSION_DEDUCTION"] = "COMMISSION_DEDUCTION";
    TransactionType["TRIP_SETTLEMENT"] = "TRIP_SETTLEMENT";
    TransactionType["WITHDRAWAL"] = "WITHDRAWAL";
    TransactionType["DEBT_FORGIVENESS"] = "DEBT_FORGIVENESS";
    TransactionType["FEE_DEDUCTION"] = "FEE_DEDUCTION";
})(TransactionType || (TransactionType = {}));

export var WithdrawalStatus;
(function (WithdrawalStatus) {
    WithdrawalStatus["PENDING"] = "PENDING";
    WithdrawalStatus["PAID"] = "PAID";
    WithdrawalStatus["REJECTED"] = "REJECTED";
})(WithdrawalStatus || (WithdrawalStatus = {}));

// adminCancelTrip's chargeTo — not used by this app directly (admin-only),
// kept here so the wire vocabulary is documented in one place.
export var ChargeTo;
(function (ChargeTo) {
    ChargeTo["SHIPPER"] = "SHIPPER";
    ChargeTo["CARRIER"] = "CARRIER";
    ChargeTo["NONE"] = "NONE";
})(ChargeTo || (ChargeTo = {}));

// Error reason codes sent in Cloud Functions failed-precondition details (INTEGRATION.md §12).
export const ErrorReason = {
    TRUCK_CAPACITY_TOO_LOW: 'TRUCK_CAPACITY_TOO_LOW'
};

