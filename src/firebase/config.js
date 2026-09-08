import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// TODO: Replace with real Firebase configuration once available
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
export const db = getFirestore(app);
export const storage = getStorage(app);
