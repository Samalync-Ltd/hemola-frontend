import { auth, db, storage } from '../firebase/config';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { 
    collection, doc, getDoc, getDocs, setDoc, addDoc, updateDoc, 
    query, where, orderBy, serverTimestamp 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { AccountStatus, ShipmentStatus, OfferStatus, TripStage, TransactionType } from '../constants/enums';
import { COMMISSION_RATE, CANCELLATION_WARNING_THRESHOLD } from '../constants/config';

// --- AUTH SERVICE ---
export const firebaseAuthService = {
    login: async (identifier, password, role = 'SHIPPER') => {
        const userCredential = await signInWithEmailAndPassword(auth, identifier, password);
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        if (!userDoc.exists()) throw new Error('User data not found');
        const userData = { id: userCredential.user.uid, ...userDoc.data() };
        if (userData.role !== role) throw new Error('Invalid role for this user');
        return userData;
    },
    registerNewUser: async (payload) => {
        const userCredential = await createUserWithEmailAndPassword(auth, payload.email, payload.password);
        const uid = userCredential.user.uid;
        
        const isCompany = payload.accountType === 'COMPANY';
        const userData = {
            role: payload.role,
            name: payload.name,
            email: payload.email,
            phone: payload.phone,
            accountType: payload.accountType,
            accountStatus: AccountStatus.UNDER_REVIEW,
            isSuspended: false,
            notificationsEnabled: true,
            createdAt: serverTimestamp(),
            ...(isCompany ? { companyName: payload.companyName } : {}),
            ...(payload.role === 'CARRIER'
                ? {
                    truckType: payload.truckType || '',
                    plateNumber: payload.plateNumber || '',
                    rating: 0,
                    completedTrips: 0,
                    warningCount: 0,
                    isBlacklisted: false
                }
                : {}),
        };
        
        await setDoc(doc(db, 'users', uid), userData);
        
        await setDoc(doc(db, 'wallets', uid), {
            userId: uid,
            balance: 0,
            reservedBalance: 0
        });

        return { id: uid, ...userData };
    },
    changePassword: async () => {
        return { success: true }; 
    },
    setNotificationsEnabled: async (userId, value) => {
        await updateDoc(doc(db, 'users', userId), { notificationsEnabled: value });
        return { notificationsEnabled: value };
    },
    updateTruckInfo: async (userId, { truckType, plateNumber }) => {
        await updateDoc(doc(db, 'users', userId), { truckType, plateNumber });
        const userDoc = await getDoc(doc(db, 'users', userId));
        return { id: userId, ...userDoc.data() };
    },
    getCurrentUser: () => {
        return new Promise((resolve, reject) => {
            const unsubscribe = onAuthStateChanged(auth, async (user) => {
                unsubscribe();
                if (user) {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    resolve(userDoc.exists() ? { id: user.uid, ...userDoc.data() } : null);
                } else {
                    resolve(null);
                }
            }, reject);
        });
    },
    logout: async () => {
        await signOut(auth);
    }
};

// --- USER SERVICE ---
export const firebaseUserService = {
    getUserById: async (id) => {
        const docSnap = await getDoc(doc(db, 'users', id));
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    }
};

// --- SHIPMENT SERVICE ---
export const firebaseShipmentService = {
    getShipments: async () => {
        const q = query(collection(db, 'shipments'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    getShipmentById: async (id) => {
        const docSnap = await getDoc(doc(db, 'shipments', id));
        if (!docSnap.exists()) throw new Error('Shipment not found');
        return { id: docSnap.id, ...docSnap.data() };
    },
    createShipment: async (data) => {
        const currentUser = await firebaseAuthService.getCurrentUser();
        if (!currentUser) throw new Error('Unauthorized');
        
        const newShipment = {
            ...data,
            shipperId: currentUser.id,
            status: ShipmentStatus.OFFERS_PENDING,
            createdAt: new Date().toISOString(), 
            offerCount: 0
        };
        const docRef = await addDoc(collection(db, 'shipments'), newShipment);
        return { id: docRef.id, ...newShipment };
    },
    cancelShipment: async (id) => {
        const docRef = doc(db, 'shipments', id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) throw new Error('Shipment not found');
        const shipment = docSnap.data();
        if (shipment.status === ShipmentStatus.ACTIVE || shipment.status === ShipmentStatus.COMPLETED) {
            throw new Error('Cannot cancel active shipment');
        }
        await updateDoc(docRef, { status: ShipmentStatus.CANCELLED });
        return { id, ...shipment, status: ShipmentStatus.CANCELLED };
    },
    updateSiteDetails: async (id, details) => {
        const docRef = doc(db, 'shipments', id);
        await updateDoc(docRef, details);
        const docSnap = await getDoc(docRef);
        return { id, ...docSnap.data() };
    }
};

// --- OFFER SERVICE ---
export const firebaseOfferService = {
    getOffersForShipment: async (shipmentId) => {
        const q = query(collection(db, 'offers'), where('shipmentId', '==', shipmentId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    getOffersByCarrier: async (carrierId) => {
        const q = query(collection(db, 'offers'), where('carrierId', '==', carrierId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    submitOffer: async (data) => {
        const newOffer = {
            shipmentId: data.shipmentId,
            carrierId: data.carrierId,
            offeredPrice: data.offeredPrice,
            status: OfferStatus.PENDING,
            submittedAt: new Date().toISOString(),
            carrierRating: 5.0,
            carrierName: data.carrierName,
            carrierTruckType: data.truckType,
            history: [{ amount: data.offeredPrice, senderRole: 'CARRIER', timestamp: new Date().toISOString() }]
        };
        const docRef = await addDoc(collection(db, 'offers'), newOffer);
        await updateDoc(doc(db, 'shipments', data.shipmentId), { status: ShipmentStatus.NEGOTIATING });
        return { id: docRef.id, ...newOffer };
    },
    counterOffer: async (offerId, amount, senderRole) => {
        const offerRef = doc(db, 'offers', offerId);
        const offerSnap = await getDoc(offerRef);
        if (!offerSnap.exists()) throw new Error('Offer not found');
        const offer = offerSnap.data();
        
        const history = [...(offer.history || []), { amount, senderRole, timestamp: new Date().toISOString() }];
        await updateDoc(offerRef, { offeredPrice: amount, status: OfferStatus.PENDING, history });
        return { id: offerId, ...offer, offeredPrice: amount, status: OfferStatus.PENDING, history };
    },
    rejectOffer: async (offerId) => {
        await updateDoc(doc(db, 'offers', offerId), { status: OfferStatus.REJECTED });
        const offerSnap = await getDoc(doc(db, 'offers', offerId));
        return { id: offerId, ...offerSnap.data() };
    },
    acceptOffer: async (offerId, finalPrice) => {
        const offerRef = doc(db, 'offers', offerId);
        const offerSnap = await getDoc(offerRef);
        if (!offerSnap.exists()) throw new Error('Offer not found');
        const offer = offerSnap.data();

        const shipmentRef = doc(db, 'shipments', offer.shipmentId);
        const shipmentSnap = await getDoc(shipmentRef);
        const shipment = shipmentSnap.data();

        const shipperWalletRef = doc(db, 'wallets', shipment.shipperId);
        const shipperWalletSnap = await getDoc(shipperWalletRef);
        const shipperWallet = shipperWalletSnap.data();
        const available = shipperWallet.balance - shipperWallet.reservedBalance;
        
        if (available < finalPrice) {
            throw new Error('الرصيد المتاح غير كافٍ');
        }

        await updateDoc(shipperWalletRef, {
            reservedBalance: shipperWallet.reservedBalance + finalPrice
        });

        await updateDoc(offerRef, { status: OfferStatus.ACCEPTED });

        await updateDoc(shipmentRef, {
            status: ShipmentStatus.ACTIVE,
            finalPrice,
            assignedCarrierId: offer.carrierId
        });

        const newTrip = {
            shipmentId: offer.shipmentId,
            carrierId: offer.carrierId,
            shipperId: shipment.shipperId,
            currentStage: TripStage.ASSIGNED,
            finalPrice,
            startedAt: new Date().toISOString(),
            route: `${shipment.pickupCity} -> ${shipment.deliveryCity}`,
            carrierName: offer.carrierName,
            messages: []
        };
        const tripRef = await addDoc(collection(db, 'trips'), newTrip);

        const offersQ = query(collection(db, 'offers'), where('shipmentId', '==', offer.shipmentId));
        const offersSnap = await getDocs(offersQ);
        for (const oDoc of offersSnap.docs) {
            if (oDoc.id !== offerId) {
                await updateDoc(doc(db, 'offers', oDoc.id), { status: OfferStatus.REJECTED });
            }
        }

        return { id: tripRef.id, ...newTrip };
    }
};

// --- TRIP SERVICE ---
export const firebaseTripService = {
    getTrips: async () => {
        const q = query(collection(db, 'trips'));
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    getTripById: async (id) => {
        const snap = await getDoc(doc(db, 'trips', id));
        if (!snap.exists()) throw new Error('Trip not found');
        return { id: snap.id, ...snap.data() };
    },
    updateTripStage: async (id, stage, proof) => {
        const tripRef = doc(db, 'trips', id);
        const tripSnap = await getDoc(tripRef);
        const trip = tripSnap.data();
        
        const stages = trip.stages || [];
        stages.push({
            stage,
            timestamp: new Date().toISOString(),
            proof: proof || null
        });

        await updateDoc(tripRef, { currentStage: stage, stages });
        
        if (stage === TripStage.DELIVERED) {
            await firebaseTripService.settleDelivery(id);
        }
        
        const updatedSnap = await getDoc(tripRef);
        return { id, ...updatedSnap.data() };
    },
    settleDelivery: async (tripId) => {
        const tripRef = doc(db, 'trips', tripId);
        const tripSnap = await getDoc(tripRef);
        const trip = tripSnap.data();
        
        if (trip.settled) return;
        
        const commission = Math.round(trip.finalPrice * COMMISSION_RATE);
        const carrierNet = trip.finalPrice - commission;

        const shipperWalletRef = doc(db, 'wallets', trip.shipperId);
        const sWalletSnap = await getDoc(shipperWalletRef);
        const sWallet = sWalletSnap.data();
        await updateDoc(shipperWalletRef, {
            reservedBalance: Math.max(0, sWallet.reservedBalance - trip.finalPrice),
            balance: sWallet.balance - trip.finalPrice
        });

        const carrierWalletRef = doc(db, 'wallets', trip.carrierId);
        const cWalletSnap = await getDoc(carrierWalletRef);
        let cWallet = cWalletSnap.data();
        if (!cWalletSnap.exists()) {
            await setDoc(carrierWalletRef, { userId: trip.carrierId, balance: 0, reservedBalance: 0 });
            cWallet = { balance: 0, reservedBalance: 0 };
        }
        await updateDoc(carrierWalletRef, {
            balance: cWallet.balance + carrierNet
        });

        await updateDoc(tripRef, { settled: true });
    },
    cancellableStages: [TripStage.ASSIGNED, TripStage.EN_ROUTE_PICKUP, TripStage.ARRIVED_PICKUP],
    cancelTrip: async (tripId, cancelledBy) => {
        const tripRef = doc(db, 'trips', tripId);
        const tripSnap = await getDoc(tripRef);
        const trip = tripSnap.data();
        
        const commission = Math.round(trip.finalPrice * COMMISSION_RATE);

        const shipperWalletRef = doc(db, 'wallets', trip.shipperId);
        const sWalletSnap = await getDoc(shipperWalletRef);
        const sWallet = sWalletSnap.data();
        await updateDoc(shipperWalletRef, {
            reservedBalance: Math.max(0, sWallet.reservedBalance - trip.finalPrice)
        });

        if (cancelledBy === 'SHIPPER') {
            await updateDoc(shipperWalletRef, { balance: sWallet.balance - commission });
            await updateDoc(doc(db, 'shipments', trip.shipmentId), { status: ShipmentStatus.CANCELLED });
        } else {
            const carrierWalletRef = doc(db, 'wallets', trip.carrierId);
            const cWalletSnap = await getDoc(carrierWalletRef);
            if (cWalletSnap.exists()) {
                await updateDoc(carrierWalletRef, { balance: cWalletSnap.data().balance - commission });
            }
            await updateDoc(doc(db, 'shipments', trip.shipmentId), {
                status: ShipmentStatus.OFFERS_PENDING,
                assignedCarrierId: null,
                finalPrice: null
            });
            const carrierRef = doc(db, 'users', trip.carrierId);
            const carrierSnap = await getDoc(carrierRef);
            const wc = (carrierSnap.data().warningCount || 0) + 1;
            await updateDoc(carrierRef, { warningCount: wc, isBlacklisted: wc >= CANCELLATION_WARNING_THRESHOLD });
        }

        await updateDoc(tripRef, {
            overallStatus: 'CANCELLED',
            cancellation: { cancelledBy, commission, at: new Date().toISOString() }
        });
        
        const updatedSnap = await getDoc(tripRef);
        return { id: tripId, ...updatedSnap.data() };
    },
    sendQuickMessage: async (tripId, senderRole, messageKey, label) => {
        const tripRef = doc(db, 'trips', tripId);
        const tripSnap = await getDoc(tripRef);
        const messages = tripSnap.data().messages || [];
        const message = { id: `msg-${Date.now()}`, senderRole, messageKey, label, timestamp: new Date().toISOString() };
        messages.push(message);
        await updateDoc(tripRef, { messages });
        return message;
    }
};

// --- WALLET SERVICE ---
export const firebaseWalletService = {
    getWallet: async () => {
        const currentUser = await firebaseAuthService.getCurrentUser();
        if (!currentUser) throw new Error('Unauthorized');
        const walletSnap = await getDoc(doc(db, 'wallets', currentUser.id));
        if (!walletSnap.exists()) {
            await setDoc(doc(db, 'wallets', currentUser.id), { userId: currentUser.id, balance: 0, reservedBalance: 0 });
            return { userId: currentUser.id, balance: 0, reservedBalance: 0, available: 0 };
        }
        const w = walletSnap.data();
        return { ...w, available: w.balance - w.reservedBalance };
    },
    getTransactions: async () => {
        const currentUser = await firebaseAuthService.getCurrentUser();
        const q = query(collection(db, 'transactions'), where('walletId', '==', currentUser.id), orderBy('timestamp', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    topUp: async (amount) => {
        const currentUser = await firebaseAuthService.getCurrentUser();
        const walletRef = doc(db, 'wallets', currentUser.id);
        const walletSnap = await getDoc(walletRef);
        const w = walletSnap.data();
        await updateDoc(walletRef, { balance: w.balance + Number(amount) });
        
        const txn = {
            walletId: currentUser.id,
            type: TransactionType.TOP_UP,
            amount: Number(amount),
            description: 'شحن رصيد إضافي',
            timestamp: new Date().toISOString(),
            balanceAfter: w.balance + Number(amount)
        };
        await addDoc(collection(db, 'transactions'), txn);
        return txn;
    },
    withdraw: async (amount) => {
        const currentUser = await firebaseAuthService.getCurrentUser();
        const walletRef = doc(db, 'wallets', currentUser.id);
        const walletSnap = await getDoc(walletRef);
        const w = walletSnap.data();
        
        const withdrawAmount = Number(amount);
        const available = w.balance - w.reservedBalance;
        if (withdrawAmount > available) throw new Error('الرصيد المتاح غير كافٍ');

        await updateDoc(walletRef, { reservedBalance: w.reservedBalance + withdrawAmount });
        
        const txn = {
            walletId: currentUser.id,
            type: TransactionType.WITHDRAWAL,
            amount: -withdrawAmount,
            description: 'طلب سحب رصيد (قيد المعالجة)',
            timestamp: new Date().toISOString(),
            balanceAfter: w.balance
        };
        const txnRef = await addDoc(collection(db, 'transactions'), txn);

        setTimeout(async () => {
            const freshWalletSnap = await getDoc(walletRef);
            const fw = freshWalletSnap.data();
            await updateDoc(walletRef, {
                reservedBalance: Math.max(0, fw.reservedBalance - withdrawAmount),
                balance: fw.balance - withdrawAmount
            });
            await updateDoc(doc(db, 'transactions', txnRef.id), {
                description: 'سحب رصيد',
                balanceAfter: fw.balance - withdrawAmount
            });
        }, 3000);

        return { id: txnRef.id, ...txn };
    }
};

// --- NOTIFICATION SERVICE ---
export const firebaseNotificationService = {
    getNotifications: async () => {
        const currentUser = await firebaseAuthService.getCurrentUser();
        if(!currentUser) return [];
        const q = query(collection(db, 'notifications'), where('userId', '==', currentUser.id), orderBy('timestamp', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    markAsRead: async (id) => {
        await updateDoc(doc(db, 'notifications', id), { isRead: true });
    },
    markAllAsRead: async () => {
        const currentUser = await firebaseAuthService.getCurrentUser();
        if(!currentUser) return;
        const q = query(collection(db, 'notifications'), where('userId', '==', currentUser.id), where('isRead', '==', false));
        const snap = await getDocs(q);
        for(const document of snap.docs) {
            await updateDoc(doc(db, 'notifications', document.id), { isRead: true });
        }
    }
};

// --- STORAGE SERVICE ---
export const firebaseStorageService = {
    uploadFile: async (path, file) => {
        const storageRef = ref(storage, path);
        await uploadBytes(storageRef, file);
        return await getDownloadURL(storageRef);
    }
};
