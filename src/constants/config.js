/** Fired on window after the account page saves profile edits, so the Topbar (which loads the user once) shows the new name without a reload. */
export const PROFILE_UPDATED_EVENT = 'hemooltak:profile-updated';

/**
 * Where Firebase's auth emails send the user back to. After a password reset
 * or an email verification, Firebase's own page shows a «متابعة» (Continue)
 * button that opens this address. The domain must stay in Firebase Console ›
 * Authentication › Settings › Authorized domains.
 */
export const AUTH_EMAIL_CONTINUE_URL = 'https://hemooltak-sa.com/login';
