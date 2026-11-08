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

/**
 * Arabic text per backend `details.reason` code, built from the values the
 * backend sends alongside it. Add a line here for each reason INTEGRATION.md
 * documents — the error text itself is never parsed.
 */
const REASON_MESSAGES = {
    TRUCK_CAPACITY_TOO_LOW: ({ capacityTons, weight }) => {
        if (capacityTons != null && weight != null) return `حمولة الشاحنة (${capacityTons} طن) أقل من وزن الشحنة (${weight} طن)`;
        if (weight != null) return `حمولة الشاحنة أقل من وزن الشحنة (${weight} طن)`;
        return 'حمولة الشاحنة أقل من وزن الشحنة';
    },
    INSUFFICIENT_BALANCE: ({ availableBalance, required, amount: offered }) => {
        const needed = required ?? offered;
        return availableBalance != null && needed != null
        ? `رصيدك المتاح (${amount(availableBalance)} ر.س) أقل من قيمة العرض (${amount(needed)} ر.س)`
            : 'رصيدك المتاح غير كافٍ لهذه العملية — اشحن محفظتك ثم حاول مرة أخرى';
    },
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
    if (reason && REASON_MESSAGES[reason]) return REASON_MESSAGES[reason](details || err || {});

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
