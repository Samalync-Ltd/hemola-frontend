// Notifications. `types.*` mirror the backend's templates
// (hemooltak-backend functions/src/notificationText.ts): the Arabic must
// stay word for word the same, because English reads the values back out of
// the Arabic text (src/i18n/notifications.js). `bodyPlain` is the English
// shown when that isn't possible.
export default {
    title: { ar: 'الإشعارات', en: 'Notifications' },
    loading: { ar: 'جاري تحميل الإشعارات', en: 'Loading notifications' },
    markAllRead: { ar: 'تعليم الكل كمقروء', en: 'Mark all as read' },
    markRead: { ar: 'تعليم كمقروء', en: 'Mark as read' },
    markReadShort: { ar: 'تعليم', en: 'Mark read' },
    empty: { ar: 'لا توجد إشعارات', en: 'No notifications' },
    emptyPage: { ar: 'لا توجد إشعارات حالياً', en: 'No notifications yet' },
    viewAll: { ar: 'عرض كل الإشعارات', en: 'View all notifications' },
    bellLabel: { ar: 'الإشعارات', en: 'Notifications' },

    types: {
        OFFER_RECEIVED: {
            title: { ar: 'عرض جديد', en: 'New offer' },
            body: { ar: 'وصلك عرض بقيمة {amount} ر.س', en: 'You received an offer of {amount} SAR' },
            bodyPlain: { ar: 'وصلك عرض جديد', en: 'You received a new offer' },
        },
        OFFER_COUNTERED: {
            title: { ar: 'عرض مضاد', en: 'Counter-offer' },
            body: { ar: 'تم تقديم عرض مضاد بقيمة {amount} ر.س', en: 'A counter-offer of {amount} SAR was made' },
            bodyPlain: { ar: 'وصلك عرض مضاد', en: 'You received a counter-offer' },
        },
        OFFER_REJECTED: {
            title: { ar: 'تم رفض العرض', en: 'Offer rejected' },
            body: { ar: 'تم رفض عرضك', en: 'Your offer was rejected' },
        },
        OFFER_ACCEPTED: {
            title: { ar: 'تم الاتفاق', en: 'Deal agreed' },
            body: { ar: 'تم تأكيد الشحنة بقيمة {amount} ر.س', en: 'The shipment is confirmed at {amount} SAR' },
            bodyPlain: { ar: 'تم تأكيد الشحنة', en: 'The shipment is confirmed' },
        },
        TRIP_STAGE_CHANGED: {
            title: { ar: 'تحديث الرحلة', en: 'Trip update' },
            body: { ar: '{stageLabel}', en: '{stageLabel}' },
            bodyPlain: { ar: 'تم تحديث حالة الرحلة', en: 'The trip status was updated' },
        },
        QUICK_MESSAGE: {
            title: { ar: 'رسالة جديدة', en: 'New message' },
            body: { ar: '{messageText}', en: '{messageText}' },
            bodyPlain: { ar: 'وصلتك رسالة جديدة', en: 'You have a new message' },
        },
        TRIP_DELIVERED: {
            title: { ar: 'تم التسليم', en: 'Delivered' },
            body: { ar: 'اكتملت الرحلة. قيّم تجربتك', en: 'The trip is complete. Rate your experience' },
        },
        SETTLEMENT_CREDITED: {
            title: { ar: 'تمت إضافة رصيد', en: 'Balance added' },
            body: { ar: 'أُضيف {amount} ر.س إلى محفظتك', en: '{amount} SAR was added to your wallet' },
            bodyPlain: { ar: 'أُضيف مبلغ إلى محفظتك', en: 'An amount was added to your wallet' },
        },
        CANCELLED_BY_SHIPPER: {
            title: { ar: 'تم إلغاء الشحنة', en: 'Shipment cancelled' },
            body: { ar: 'ألغى الطرف الآخر الشحنة', en: 'The other party cancelled the shipment' },
        },
        CANCELLED_BY_CARRIER: {
            title: { ar: 'تم إلغاء الشحنة', en: 'Shipment cancelled' },
            body: { ar: 'ألغى الطرف الآخر الشحنة', en: 'The other party cancelled the shipment' },
        },
        WARNING_ISSUED: {
            title: { ar: 'تنبيه', en: 'Warning' },
            body: { ar: 'تم تسجيل إنذار على حسابك ({count} من {threshold})', en: 'A warning was recorded on your account ({count} of {threshold})' },
            bodyPlain: { ar: 'تم تسجيل إنذار على حسابك', en: 'A warning was recorded on your account' },
        },
        ACCOUNT_SUSPENDED: {
            title: { ar: 'تم إيقاف الحساب', en: 'Account suspended' },
            body: { ar: 'تم إيقاف حسابك مؤقتاً بسبب تكرار الإلغاء', en: 'Your account is temporarily suspended because of repeated cancellations' },
        },
        SUSPENSION_LIFTED: {
            title: { ar: 'تم رفع الإيقاف', en: 'Suspension lifted' },
            body: { ar: 'يمكنك استخدام المنصة مرة أخرى', en: 'You can use the platform again' },
        },
        DEBT_FORGIVEN: {
            title: { ar: 'تم تحديث الرصيد', en: 'Balance updated' },
            body: { ar: 'تم إعفاؤك من مبلغ {amount} ر.س', en: 'You no longer owe {amount} SAR' },
            bodyPlain: { ar: 'تم إعفاؤك من مبلغ مستحق', en: 'An amount you owed was written off' },
        },
        ACCOUNT_APPROVED: {
            title: { ar: 'تم توثيق حسابك', en: 'Your account is verified' },
            body: { ar: 'يمكنك الآن استخدام المنصة', en: 'You can now use the platform' },
        },
        ACCOUNT_REJECTED: {
            title: { ar: 'إجراء مطلوب', en: 'Action needed' },
            body: { ar: 'مرفوض: {reason}', en: 'Rejected: {reason}' },
            bodyPlain: { ar: 'مرفوض', en: 'Rejected' },
        },
        DOCUMENT_REJECTED: {
            title: { ar: 'إجراء مطلوب', en: 'Action needed' },
            body: { ar: 'مرفوض: {reason}', en: 'Rejected: {reason}' },
            bodyPlain: { ar: 'مرفوض', en: 'Rejected' },
        },
        TRUCK_DOC_REJECTED: {
            title: { ar: 'إجراء مطلوب', en: 'Action needed' },
            body: { ar: 'مرفوض: {reason}', en: 'Rejected: {reason}' },
            bodyPlain: { ar: 'مرفوض', en: 'Rejected' },
        },
        TRUCK_DOC_APPROVED: {
            title: { ar: 'تم اعتماد المستند', en: 'Document approved' },
            body: { ar: 'تم اعتماد مستند الشاحنة', en: 'The truck document was approved' },
        },
        WITHDRAWAL_PAID: {
            title: { ar: 'تم التحويل', en: 'Transfer complete' },
            body: { ar: 'تم تحويل {amount} ر.س', en: '{amount} SAR was transferred' },
            bodyPlain: { ar: 'تم تحويل طلب السحب', en: 'Your withdrawal was transferred' },
        },
        WITHDRAWAL_REJECTED: {
            title: { ar: 'تم رفض السحب', en: 'Withdrawal rejected' },
            body: { ar: 'تم رفض طلب السحب: {reason}', en: 'Your withdrawal request was rejected: {reason}' },
            bodyPlain: { ar: 'تم رفض طلب السحب', en: 'Your withdrawal request was rejected' },
        },
    },

    // The backend's stage sentences (TRIP_STAGE_LABEL_AR), not the trip page's labels.
    stage: {
        ASSIGNED: { ar: 'تم إسناد الرحلة', en: 'Trip assigned' },
        EN_ROUTE_PICKUP: { ar: 'الناقل في طريقه إلى موقع التحميل', en: 'The carrier is en route to pickup' },
        ARRIVED_PICKUP: { ar: 'وصل الناقل إلى موقع التحميل', en: 'The carrier arrived at the pickup site' },
        LOADED: { ar: 'تم تحميل الشحنة', en: 'The shipment is loaded' },
        EN_ROUTE_DELIVERY: { ar: 'الشحنة في الطريق إلى موقع التسليم', en: 'The shipment is en route to delivery' },
        DELIVERED: { ar: 'تم تسليم الشحنة', en: 'The shipment was delivered' },
    },
};
