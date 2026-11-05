import {
    firebaseAuthService,
    firebaseShipmentService,
    firebaseOfferService,
    firebaseTripService,
    firebaseWalletService,
    firebaseNotificationService,
    firebaseUserService,
    firebaseCatalogService
} from './firebase-services';

// Every screen talks to the real hemooltak-backend (Firebase) — there is no
// mock or demo fallback. The services themselves live in firebase-services.js;
// this module is the single import point the screens use.
export const authService = firebaseAuthService;
export const shipmentService = firebaseShipmentService;
export const offerService = firebaseOfferService;
export const tripService = firebaseTripService;
export const walletService = firebaseWalletService;
export const notificationService = firebaseNotificationService;
export const userService = firebaseUserService;
export const catalogService = firebaseCatalogService;
