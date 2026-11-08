// Errors from Firebase (Auth, Firestore, Storage) and from the backend's
// Cloud Functions arrive as technical English — e.g. "Firebase: Error
// (auth/invalid-credential)." — and must never reach the user as-is. This
// turns any of them into an Arabic sentence the user can act on.
//
// Messages that are already Arabic (thrown deliberately by the services
// with a specific explanation) pass through unchanged.

const ARABIC = /[؀-ۿ]/;

const AUTH_MESSAGES = {
    'auth/invalid-credential': 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    'auth/invalid-login-credentials': 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    'auth/wrong-password': 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    'auth/user-not-found': 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    'auth/invalid-email': 'صيغة البريد الإلكتروني غير صحيحة',
    'auth/user-disabled': 'هذا الحساب موقوف — تواصل مع الدعم',
    'auth/too-many-requests': 'محاولات كثيرة فاشلة — انتظر قليلاً ثم حاول مرة أخرى',
    'auth/network-request-failed': 'تعذّر الاتصال بالخادم. تحقق من اتصالك بالإنترنت وحاول مرة أخرى',
    'auth/email-already-in-use': 'هذا البريد الإلكتروني مسجل مسبقاً',
    'auth/weak-password': 'كلمة المرور ضعيفة — استخدم 8 أحرف على الأقل',
    'auth/requires-recent-login': 'لأمان حسابك، سجّل الدخول مرة أخرى ثم أعد المحاولة',
    'auth/user-token-expired': 'انتهت الجلسة — سجّل الدخول مرة أخرى',
    'auth/popup-closed-by-user': 'تم إلغاء العملية',
};

// Cloud Functions ("functions/<code>"), Firestore and Storage share these
// canonical codes once the prefix is stripped.
const CODE_MESSAGES = {
    'unauthenticated': 'انتهت الجلسة — سجّل الدخول مرة أخرى',
    'permission-denied': 'ليست لديك صلاحية لتنفيذ هذا الإجراء',
    'unauthorized': 'ليست لديك صلاحية لتنفيذ هذا الإجراء',
    'not-found': 'العنصر المطلوب غير موجود — ربما حُذف أو تغيّر. حدّث الصفحة وحاول مرة أخرى',
    'object-not-found': 'الملف المطلوب غير موجود',
    'already-exists': 'هذه البيانات مسجلة مسبقاً',
    'invalid-argument': 'البيانات المدخلة غير صحيحة — تأكد منها وحاول مرة أخرى',
    'failed-precondition': 'لا يمكن تنفيذ هذا الإجراء في الحالة الحالية. حدّث الصفحة وحاول مرة أخرى',
    'resource-exhausted': 'محاولات كثيرة — انتظر قليلاً ثم حاول مرة أخرى',
    'quota-exceeded': 'تم تجاوز الحد المسموح — حاول لاحقاً',
    'unavailable': 'تعذّر الاتصال بالخادم. تحقق من اتصالك بالإنترنت وحاول مرة أخرى',
    'deadline-exceeded': 'استغرق الطلب وقتاً طويلاً — حاول مرة أخرى',
    'retry-limit-exceeded': 'استغرق الرفع وقتاً طويلاً — تحقق من الاتصال وحاول مرة أخرى',
    'canceled': 'تم إلغاء العملية',
    'cancelled': 'تم إلغاء العملية',
};

const DEFAULT_MESSAGE = 'حدث خطأ غير متوقع، حاول مرة أخرى';

const amount = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

const PLATFORM_ERROR = 'حدث خطأ في المنصة، حاول لاحقاً';

/** Shown for a reason code the backend sends that isn't in the table below (new ones may be added). */
export const UNKNOWN_REASON_MESSAGE = 'تعذّر تنفيذ هذا الإجراء حالياً. حدّث الصفحة وحاول مرة أخرى.';

/**
 * Arabic per backend `details.reason` — all 29 in INTEGRATION.md §18, with
 * the values in {braces} filled from `details`. The error text itself is
 * never parsed.
 */
const REASON_MESSAGES = {
    // Users
    ACCOUNT_NOT_VERIFIED: () => 'حسابك قيد المراجعة. ستتمكن من ذلك بعد توثيق الحساب.',
    CARRIER_SUSPENDED: () => 'حسابك موقوف مؤقتاً بسبب تكرار الإلغاء. تواصل مع الدعم.',
    CARRIER_BUSY: () => 'لديك رحلة نشطة. أكملها قبل قبول شحنة جديدة.',
    CARRIER_IN_DEBT: ({ debt }) => (debt != null
        ? `عليك مبلغ مستحق للمنصة (${amount(debt)} ر.س). اشحن محفظتك لتسديده أولاً.`
        : 'عليك مبلغ مستحق للمنصة. اشحن محفظتك لتسديده أولاً.'),
    PHONE_UNCHANGED: () => 'هذا هو رقم جوالك الحالي.',
    SHIPMENT_NOT_OPEN: () => 'هذه الشحنة لم تعد متاحة.',
    SITE_DETAILS_LOCKED: () => 'لا يمكن تعديل تفاصيل الموقع بعد إسناد الشحنة.',
    OWN_SHIPMENT: () => 'لا يمكنك تقديم عرض على شحنتك.',
    OFFER_ALREADY_OPEN: () => 'لديك عرض بانتظار الرد على هذه الشحنة.',
    OFFER_NOT_PENDING: () => 'هذا العرض لم يعد متاحاً. حدّث الصفحة.',
    NOT_YOUR_TURN: () => 'بانتظار رد الطرف الآخر على عرضك.',
    TRUCK_WRONG_TYPE: () => 'نوع الشاحنة لا يطابق النوع المطلوب لهذه الشحنة.',
    TRUCK_CAPACITY_TOO_LOW: ({ capacityTons, weight }) => {
        if (capacityTons != null && weight != null) return `حمولة الشاحنة (${capacityTons} طن) أقل من وزن الشحنة (${weight} طن).`;
        if (weight != null) return `حمولة الشاحنة أقل من وزن الشحنة (${weight} طن).`;
        return 'حمولة الشاحنة أقل من وزن الشحنة.';
    },
    TRUCK_NOT_APPROVED: () => 'مستندات الشاحنة لم تُعتمد بعد.',
    INSUFFICIENT_BALANCE: ({ availableBalance, required, requested }) => {
        const needed = required ?? requested;
        return availableBalance != null && needed != null
            ? `رصيدك المتاح (${amount(availableBalance)} ر.س) لا يكفي. المبلغ المطلوب ${amount(needed)} ر.س.`
            : 'رصيدك المتاح لا يكفي لهذه العملية. اشحن محفظتك ثم حاول مرة أخرى.';
    },
    BANK_DETAILS_MISSING: () => 'أضف بيانات حسابك البنكي قبل طلب السحب.',
    TRIP_NOT_ACTIVE: () => 'هذه الرحلة لم تعد نشطة.',
    STAGE_OUT_OF_ORDER: () => 'يجب تحديث مراحل الرحلة بالترتيب.',
    PROOF_MISSING: () => 'يرجى رفع صورة الإثبات أولاً.',
    TRIP_NOT_DELIVERED: () => 'يمكنك التقييم بعد تسليم الشحنة.',
    NOTHING_TO_CANCEL: () => 'لا يوجد إسناد لإلغائه في هذه الشحنة.',
    CANCEL_NOT_ALLOWED: () => 'لا يمكن الإلغاء بعد تحميل الشحنة. تواصل مع الدعم.',
    // Admin dashboard (listed for completeness — the website never calls these)
    DOCUMENTS_NOT_APPROVED: () => 'لا يمكن توثيق الحساب قبل اعتماد جميع المستندات المطلوبة.',
    TRUCK_DOCUMENT_MISSING: () => 'لم يُرفع هذا المستند بعد.',
    NOT_SUSPENDED: () => 'هذا الحساب غير موقوف.',
    WITHDRAWAL_ALREADY_PROCESSED: () => 'تمت معالجة طلب السحب هذا مسبقاً.',
    NO_DEBT: () => 'لا يوجد مبلغ مستحق على هذا الحساب.',
    // Platform setup — should never reach a user
    PLATFORM_NOT_CONFIGURED: () => PLATFORM_ERROR,
    PHONE_LOGIN_UNAVAILABLE: () => PLATFORM_ERROR,
};

/** The backend reason code on an error, if any — for screens that react to a specific one (e.g. offer a top-up). */
export const errorReason = (err) => {
    const details = err?.details || err?.customData?.details;
    if (details?.reason) return details.reason;
    // acceptOffer's balance refusal carries { availableBalance, required }
    // before it has a reason code of its own.
    if (details?.availableBalance != null && details?.required != null) return 'INSUFFICIENT_BALANCE';
    return null;
};

/**
 * @param {unknown} err  anything thrown — Error, FirebaseError, string
 * @param {string} [fallback]  shown when nothing more specific is known
 */
export const toArabicError = (err, fallback = DEFAULT_MESSAGE) => {
    if (!err) return fallback;

    // A machine-readable reason, when the backend gives one, decides the
    // message — never the English error text (INTEGRATION.md §12).
    const details = (typeof err === 'object' && err !== null) ? (err.details || err.customData?.details) : null;
    const reason = errorReason(err) || (typeof err === 'object' && err?.reason);
    if (reason) {
        // Report setup problems — they should never reach a user (§18).
        if (reason === 'PLATFORM_NOT_CONFIGURED' || reason === 'PHONE_LOGIN_UNAVAILABLE') console.error('Platform misconfigured:', reason);
        return REASON_MESSAGES[reason] ? REASON_MESSAGES[reason](details || err || {}) : UNKNOWN_REASON_MESSAGE;
    }

    const message = typeof err === 'string' ? err : (err.message || '');
    if (ARABIC.test(message)) return message;

    const code = typeof err === 'object' ? (err.code || '') : '';
    if (AUTH_MESSAGES[code]) return AUTH_MESSAGES[code];

    const bare = code.replace(/^(functions|firestore|storage)\//, '');
    // signUp's already-exists names which field collided (INTEGRATION.md §3).
    if (bare === 'already-exists' && /phone/i.test(message)) return 'رقم الجوال مسجل مسبقاً في حساب آخر';
    if (bare === 'already-exists' && /email/i.test(message)) return 'البريد الإلكتروني مسجل مسبقاً في حساب آخر';
    if (CODE_MESSAGES[bare]) return CODE_MESSAGES[bare];

    if (err instanceof TypeError && /fetch|network/i.test(message)) return CODE_MESSAGES.unavailable;
    return fallback;
};
