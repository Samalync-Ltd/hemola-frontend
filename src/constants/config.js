// ═══════════════════════════════════════════════════════════════════════
//  DEMO_MODE — simulated "other users" market activity for fresh accounts.
//
//  When `true`, a brand-new (freshly registered) account sees synthetic
//  shipments/offers from *other* simulated users trickle into its empty
//  lists over the first ~1-2 minutes, purely so a demo/tester isn't staring
//  at a permanently empty screen. It never pre-fills the user's OWN
//  shipments, offers, wallet, or trip history — see `src/utils/freshAccount.js`
//  for that rule, which this feature does not touch.
//
//  MUST be set to `false` before connecting this app to a real backend —
//  flip this one flag and every simulated-activity code path (see
//  `src/pages/carrier/CarrierShipments.jsx` and
//  `src/pages/shipper/ReceivedOffers.jsx`) turns off with no other changes
//  required. Grep for `DEMO_MODE` to see every call site.
// ═══════════════════════════════════════════════════════════════════════
export const DEMO_MODE = true;

/** Commission the platform keeps at trip settlement (5%, matches mobile). */
export const COMMISSION_RATE = 0.05;

/** Post-assignment cancellations before a carrier is auto-blacklisted (matches mobile). */
export const CANCELLATION_WARNING_THRESHOLD = 3;
