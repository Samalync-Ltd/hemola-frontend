// Errors from Firebase (Auth, Firestore, Storage) and from the backend's
// Cloud Functions arrive as technical English — e.g. "Firebase: Error
// (auth/invalid-credential)." — and must never reach the user as-is. This
// turns any of them into a sentence the user can act on, in the current
// language (texts: src/i18n/strings/errors.js).
//
// The services throw their own explanations with `userError(key)`; those
// are shown as they are, in whichever language is current when shown.
import { t, hasText } from '../i18n';

const ARABIC = /[\u0600-\u06FF]/;

const AUTH_CODES = new Set([
    'auth/invalid-credential', 'auth/invalid-login-credentials', 'auth/wrong-password', 'auth/user-not-found',
    'auth/invalid-email', 'auth/user-disabled', 'auth/too-many-requests', 'auth/network-request-failed',
    'auth/email-already-in-use', 'auth/weak-password', 'auth/requires-recent-login', 'auth/user-token-expired',
    'auth/popup-closed-by-user',
]);

// Cloud Functions ("functions/<code>"), Firestore and Storage share these
// canonical codes once the prefix is stripped.
const CODES = new Set([
    'unauthenticated', 'permission-denied', 'unauthorized', 'not-found', 'object-not-found', 'already-exists',
    'invalid-argument', 'failed-precondition', 'resource-exhausted', 'quota-exceeded', 'unavailable',
    'deadline-exceeded', 'retry-limit-exceeded', 'canceled', 'cancelled',
]);

const amount = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

/** An error a service throws on purpose, with a message key (and values for it). */
export const userError = (key, params) => Object.assign(new Error(t(key, params)), { userMessageKey: key, userMessageParams: params });

/** Shown for a reason code the backend sends that isn't in the table (new ones may be added). */
export const unknownReasonMessage = () => t('errors.unknownReason');

/**
 * The message for a backend `details.reason` (INTEGRATION.md §18), with the
 * values in {braces} filled from `details`. The error text itself is never
 * parsed. A few reasons read differently depending on which values came.
 */
const reasonMessage = (reason, details = {}) => {
    switch (reason) {
        case 'CARRIER_IN_DEBT':
            return details.debt != null
                ? t('errors.reason.CARRIER_IN_DEBT_amount', { debt: amount(details.debt) })
                : t('errors.reason.CARRIER_IN_DEBT');
        case 'TRUCK_CAPACITY_TOO_LOW': {
            const { capacityTons, weight } = details;
            if (capacityTons != null && weight != null) return t('errors.reason.TRUCK_CAPACITY_TOO_LOW_both', { capacityTons, weight });
            if (weight != null) return t('errors.reason.TRUCK_CAPACITY_TOO_LOW_weight', { weight });
            return t('errors.reason.TRUCK_CAPACITY_TOO_LOW');
        }
        case 'INSUFFICIENT_BALANCE': {
            const needed = details.required ?? details.requested;
            return details.availableBalance != null && needed != null
                ? t('errors.reason.INSUFFICIENT_BALANCE_amounts', { availableBalance: amount(details.availableBalance), required: amount(needed) })
                : t('errors.reason.INSUFFICIENT_BALANCE');
        }
        // Platform setup — should never reach a user (§18).
        case 'PLATFORM_NOT_CONFIGURED':
        case 'PHONE_LOGIN_UNAVAILABLE':
            return t('errors.platform');
        default:
            return hasText(`errors.reason.${reason}`) ? t(`errors.reason.${reason}`) : unknownReasonMessage();
    }
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
export const toUserMessage = (err, fallback) => {
    const otherwise = fallback ?? t('errors.default');
    if (!err) return otherwise;

    if (typeof err === 'object' && err.userMessageKey) return t(err.userMessageKey, err.userMessageParams);

    // A machine-readable reason, when the backend gives one, decides the
    // message — never the English error text (INTEGRATION.md §12).
    const details = (typeof err === 'object' && err !== null) ? (err.details || err.customData?.details) : null;
    const reason = errorReason(err) || (typeof err === 'object' && err?.reason);
    if (reason) {
        if (reason === 'PLATFORM_NOT_CONFIGURED' || reason === 'PHONE_LOGIN_UNAVAILABLE') console.error('Platform misconfigured:', reason);
        return reasonMessage(reason, details || err || {});
    }

    const message = typeof err === 'string' ? err : (err.message || '');
    if (ARABIC.test(message)) return message;

    const code = typeof err === 'object' ? (err.code || '') : '';
    if (AUTH_CODES.has(code)) return t(`errors.auth.${code.slice('auth/'.length)}`);

    const bare = code.replace(/^(functions|firestore|storage)\//, '');
    // signUp's already-exists names which field collided (INTEGRATION.md §3).
    if (bare === 'already-exists' && /phone/i.test(message)) return t('errors.phoneTaken');
    if (bare === 'already-exists' && /email/i.test(message)) return t('errors.emailTaken');
    if (CODES.has(bare)) return t(`errors.code.${bare}`);

    if (err instanceof TypeError && /fetch|network/i.test(message)) return t('errors.code.unavailable');
    return otherwise;
};

/** The old name, kept so nothing that still imports it breaks. */
export const toArabicError = toUserMessage;
