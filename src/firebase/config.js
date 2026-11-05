import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDGp022Eznp6C5KJweMfaaDsc4s10zxm0w",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "hemooltak.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "hemooltak",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "hemooltak.firebasestorage.app",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "230557526746",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:230557526746:web:e46df5ab47f8928b8593e3"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
// Firebase's built-in emails (verification, password reset) go out in Arabic.
auth.languageCode = 'ar';
export const db = getFirestore(app);

// Every Cloud Function in hemooltak-backend runs in me-central1 (Doha) —
// see hemooltak-backend/functions/src/constants.ts. Calling httpsCallable
// against any other region 404s every single time.
export const functions = getFunctions(app, import.meta.env.VITE_FUNCTIONS_REGION || 'me-central1');
export const storage = getStorage(app);

const USE_EMULATORS = import.meta.env.VITE_USE_EMULATORS === 'true';

if (USE_EMULATORS) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    connectFunctionsEmulator(functions, '127.0.0.1', 5001);
    connectStorageEmulator(storage, '127.0.0.1', 9199);
}
