import { auth, db, storage } from '../firebase/config';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut 
} from 'firebase/auth';
import { 
    collection, 
    doc, 
    getDoc, 
    getDocs, 
    setDoc, 
    addDoc, 
    updateDoc, 
    query, 
    where 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export const firebaseAuthService = {
    login: async (email, password) => {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    },
    register: async (email, password) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    },
    logout: async () => {
        await signOut(auth);
    }
};

export const firebaseDbService = {
    getUser: async (userId) => {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    },
    createUserProfile: async (userId, data) => {
        await setDoc(doc(db, 'users', userId), data);
    },
    getShipments: async () => {
        const q = query(collection(db, 'shipments'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
};

export const firebaseStorageService = {
    uploadFile: async (path, file) => {
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, file);
        return await getDownloadURL(storageRef);
    }
};
