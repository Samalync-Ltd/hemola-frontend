// Mirrors mobile's `isFreshAccountProvider` (lib/providers/account_session_provider.dart):
// a genuinely new registration starts with empty lists everywhere, distinct
// from the pre-seeded demo-login accounts. Persisted in localStorage the
// same way `demo_role`/`demo_user_id` already are, so it survives navigation
// within the session.

const FRESH_KEY = 'demo_is_fresh_account';
const OFFER_SEEDED_KEY = 'demo_offer_seeded';

/** Called once, right after a real registration completes. */
export const markFreshAccount = () => localStorage.setItem(FRESH_KEY, '1');

/** True only for an account that just registered — false for demo-credential logins. */
export const isFreshAccount = () => localStorage.getItem(FRESH_KEY) === '1';

/** The one-time shipper demo-offer trickle fires at most once per account. */
export const hasSeededDemoOffer = () => localStorage.getItem(OFFER_SEEDED_KEY) === '1';
export const markDemoOfferSeeded = () => localStorage.setItem(OFFER_SEEDED_KEY, '1');
