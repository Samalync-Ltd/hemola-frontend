// Arabic text for the backend's inbox notifications, by type.
//
// The backend renders title/body into each users/{uid}/notifications record,
// but its templates (hemooltak-backend/functions/src/notificationText.ts) are
// stored garbled — every word's letters reversed and the spaces dropped, e.g.
// "متقيثوتكباسح" for "تم توثيق حسابك". Until that file is fixed, the inbox
// shows these instead. The values that vary (amount, reason, counts) are
// still recoverable from the stored body: digits and the admin's own reason
// text are written correctly, only the template words are broken.
//
// Once the backend templates are fixed this file can be deleted and the
// stored title/body used as-is.

const NOTIFICATION_TEXT = {
    OFFER_RECEIVED: { title: 'عرض جديد', body: 'وصلك عرض بقيمة {amount} ر.س' },
    OFFER_COUNTERED: { title: 'عرض مضاد', body: 'تم تقديم عرض مضاد بقيمة {amount} ر.س' },
    OFFER_REJECTED: { title: 'تم رفض العرض', body: 'تم رفض عرضك' },
    OFFER_ACCEPTED: { title: 'تم الاتفاق', body: 'تم تأكيد الشحنة بقيمة {amount} ر.س' },
    TRIP_DELIVERED: { title: 'تم التسليم', body: 'اكتملت الرحلة. قيّم تجربتك' },
    SETTLEMENT_CREDITED: { title: 'تمت إضافة رصيد', body: 'أُضيف {amount} ر.س إلى محفظتك' },
    CANCELLED_BY_SHIPPER: { title: 'تم إلغاء الشحنة', body: 'ألغى الطرف الآخر الشحنة' },
    CANCELLED_BY_CARRIER: { title: 'تم إلغاء الشحنة', body: 'ألغى الطرف الآخر الشحنة' },
    WARNING_ISSUED: { title: 'تنبيه', body: 'تم تسجيل إنذار على حسابك ({count} من {threshold})' },
    ACCOUNT_SUSPENDED: { title: 'تم إيقاف الحساب', body: 'تم إيقاف حسابك مؤقتاً بسبب تكرار الإلغاء' },
    SUSPENSION_LIFTED: { title: 'تم رفع الإيقاف', body: 'يمكنك استخدام المنصة مرة أخرى' },
    DEBT_FORGIVEN: { title: 'تم تحديث الرصيد', body: 'تم إعفاؤك من مبلغ {amount} ر.س' },
    ACCOUNT_APPROVED: { title: 'تم توثيق حسابك', body: 'يمكنك الآن استخدام المنصة' },
    ACCOUNT_REJECTED: { title: 'إجراء مطلوب', body: 'مرفوض: {reason}' },
    DOCUMENT_REJECTED: { title: 'إجراء مطلوب', body: 'مرفوض: {reason}' },
    TRUCK_DOC_REJECTED: { title: 'إجراء مطلوب', body: 'مرفوض: {reason}' },
    TRUCK_DOC_APPROVED: { title: 'تم اعتماد المستند', body: 'تم اعتماد مستند الشاحنة' },
    WITHDRAWAL_PAID: { title: 'تم التحويل', body: 'تم تحويل {amount} ر.س' },
    WITHDRAWAL_REJECTED: { title: 'تم رفض السحب', body: 'تم رفض طلب السحب: {reason}' },
    // TRIP_STAGE_CHANGED and QUICK_MESSAGE have bodies that are entirely a
    // parameter (stage label / message text); only their titles are broken.
    TRIP_STAGE_CHANGED: { title: 'تحديث الرحلة' },
    QUICK_MESSAGE: { title: 'رسالة جديدة' },
};

/** Pulls the variable parts back out of a stored (garbled-template) body. */
const extractParams = (rawBody = '') => {
    const numbers = rawBody.match(/\d+(?:[.,]\d+)*/g) || [];
    const colon = rawBody.indexOf(':');
    return {
        amount: numbers[0] ?? '',
        count: numbers[0] ?? '',
        threshold: numbers[1] ?? '',
        reason: colon >= 0 ? rawBody.slice(colon + 1).trim() : '',
    };
};

const fill = (template, params) => template.replace(/\{(\w+)\}/g, (_, key) => params[key] ?? '');

/** { title, body } to show for one inbox record. */
export const notificationDisplayText = (type, storedTitle = '', storedBody = '') => {
    const text = NOTIFICATION_TEXT[type];
    if (!text) return { title: storedTitle, body: storedBody };
    const params = extractParams(storedBody);
    return {
        title: text.title,
        body: text.body ? fill(text.body, params).replace(/[\s:]+$/, '').trim() : storedBody,
    };
};
