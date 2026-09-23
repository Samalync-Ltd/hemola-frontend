// Stable document-upload keys shared by every registration/document-upload
// flow (web + mobile). These are the actual keys stored against uploaded
// files — never rename an existing one (add a new key instead), and never
// spell PUBLIC_DRIVING_LICENCE as "LICENSE": mobile already uses "LICENCE"
// and the two platforms must agree on the same key.
export const DOCUMENT_KEYS = Object.freeze({
    NATIONAL_ID: 'NATIONAL_ID',
    PUBLIC_DRIVING_LICENCE: 'PUBLIC_DRIVING_LICENCE',
    COMMERCIAL_REGISTRATION: 'COMMERCIAL_REGISTRATION',
    MANAGER_ID: 'MANAGER_ID',
});
