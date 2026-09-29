// Shared field validators, mirrored from the mobile app's
// `lib/core/utils/validators.dart` (AppValidators) so both platforms accept
// and store phone numbers identically.

const SAUDI_PHONE = /^(?:\+9665|9665|05)\d{8}$/;

/** Accepts local (`05XXXXXXXX`) or international (`+9665XXXXXXXX` / `9665XXXXXXXX`) format. */
export const isValidSaudiPhone = (value) => SAUDI_PHONE.test((value || '').trim().replace(/\s+/g, ''));

/**
 * Normalizes any accepted Saudi phone format to E.164 (`+9665XXXXXXXX`) for storage.
 * Callers should validate with `isValidSaudiPhone` first — on an unrecognized format this
 * returns the trimmed input unchanged rather than guessing.
 */
export const normalizeSaudiPhone = (value) => {
    const stripped = (value || '').trim().replace(/\s+/g, '');
    if (!SAUDI_PHONE.test(stripped)) return stripped;
    const digits = stripped.startsWith('+') ? stripped.slice(1) : stripped;
    // digits is now either "9665XXXXXXXX" or "05XXXXXXXX".
    const national = digits.startsWith('05') ? digits.slice(1) : digits.slice(3);
    return `+966${national}`;
};

// Saudi IBAN — same rule as the backend's normalizeSaudiIban
// (hemooltak-backend/functions/src/validation.ts): SA + 2 check digits +
// 2-digit bank code + 18 account characters, check digits verified
// (ISO 13616 mod-97) so a mistyped digit is caught before it's submitted.
const SAUDI_IBAN = /^SA\d{2}[0-9]{2}[0-9A-Z]{18}$/;
export const BANK_ACCOUNT_NAME_MAX = 100;

/** Electronic form: no spaces, upper case. */
export const normalizeIban = (value) => (value || '').replace(/\s+/g, '').toUpperCase();

export const isValidSaudiIban = (value) => {
    const iban = normalizeIban(value);
    if (!SAUDI_IBAN.test(iban)) return false;
    const rearranged = iban.slice(4) + iban.slice(0, 4);
    let remainder = 0;
    for (const ch of rearranged) {
        const digits = /[A-Z]/.test(ch) ? String(ch.charCodeAt(0) - 55) : ch;
        for (const d of digits) remainder = (remainder * 10 + Number(d)) % 97;
    }
    return remainder === 1;
};

/** Display form: groups of four, e.g. "SA03 8000 0000 6080 1016 7519". */
export const formatIban = (value) => normalizeIban(value).replace(/(.{4})/g, '$1 ').trim();
