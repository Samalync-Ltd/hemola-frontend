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
