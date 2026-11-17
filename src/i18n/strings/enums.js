// Fixed values, translated by their code. Arabic is exactly what the
// platform has always shown for each code.
export default {
    shipmentStatus: {
        PENDING_OFFERS: { ar: 'بانتظار العروض', en: 'Awaiting offers' },
        NEGOTIATING: { ar: 'قيد التفاوض', en: 'Negotiating' },
        ACTIVE: { ar: 'قيد التنفيذ', en: 'In progress' },
        COMPLETED: { ar: 'مكتملة', en: 'Completed' },
        CANCELLED: { ar: 'ملغاة', en: 'Cancelled' },
    },
    offerStatus: {
        PENDING: { ar: 'بانتظار الرد', en: 'Awaiting reply' },
        COUNTERED: { ar: 'عرض مضاد', en: 'Counter-offer' },
        ACCEPTED: { ar: 'مقبول', en: 'Accepted' },
        REJECTED: { ar: 'مرفوض', en: 'Rejected' },
    },
    tripStage: {
        ASSIGNED: { ar: 'تم إسناد الشحنة', en: 'Shipment assigned' },
        EN_ROUTE_PICKUP: { ar: 'في الطريق لموقع التحميل', en: 'En route to pickup' },
        ARRIVED_PICKUP: { ar: 'تم الوصول للتحميل', en: 'Arrived at pickup' },
        LOADED: { ar: 'تم التحميل', en: 'Loaded' },
        EN_ROUTE_DELIVERY: { ar: 'في الطريق للتسليم', en: 'En route to delivery' },
        DELIVERED: { ar: 'تم التسليم', en: 'Delivered' },
    },
    // Account and document review.
    review: {
        UNDER_REVIEW: { ar: 'قيد المراجعة', en: 'Under review' },
        VERIFIED: { ar: 'موثق', en: 'Verified' },
        REJECTED: { ar: 'مرفوض', en: 'Rejected' },
    },
    // Built-in names. What users see is the admin's name when set
    // (src/i18n/catalog.js); English falls back to these only while the
    // admin has not renamed the type.
    truckType: {
        FLATBED: { ar: 'مسطحة', en: 'Flatbed' },
        HEAVY_CARGO: { ar: 'شحن ثقيل', en: 'Heavy cargo' },
        REFRIGERATED: { ar: 'مبردة', en: 'Refrigerated' },
        BOX_TRUCK: { ar: 'صندوق مغلق', en: 'Box truck' },
        TANKER: { ar: 'صهريج', en: 'Tanker' },
        LOW_LOADER: { ar: 'لودر منخفض', en: 'Low loader' },
        OTHER: { ar: 'أخرى', en: 'Other' },
    },
    accountType: {
        INDIVIDUAL: { ar: 'فرد', en: 'Individual' },
        COMPANY: { ar: 'شركة / منشأة', en: 'Company / establishment' },
    },
    role: {
        SHIPPER: { ar: 'صاحب شحنة', en: 'Shipper' },
        CARRIER: { ar: 'ناقل', en: 'Carrier' },
    },
};
