import { auth, db, storage, functions } from '../firebase/config';
import {
    signInWithEmailAndPassword,
    signInWithCustomToken,
    signOut,
    onAuthStateChanged,
    EmailAuthProvider,
    reauthenticateWithCredential,
    updatePassword,
    sendEmailVerification,
    sendPasswordResetEmail,
} from 'firebase/auth';
import {
    collection, collectionGroup, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
    query, where, orderBy, limit, serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { httpsCallable } from 'firebase/functions';
import { TripStage } from '../constants/enums';
import { normalizeSaudiPhone } from '../utils/validators';
import { notificationDisplayText } from '../utils/notificationText';
import { DOCUMENT_KEYS } from '../constants/documentKeys';

// Every Cloud Function below is documented in hemooltak-backend/INTEGRATION.md
// — request/response shapes, error codes, and the exact enum spellings all
// come from that file, not from guessing at what the backend probably does.
const call = (name) => httpsCallable(functions, name);

/** INTEGRATION.md §6 — a value matching this is a phone login, not an email. */
const PHONE_PATTERN = /^(?:\+9665|9665|05)\d{8}$/;

/** Uploads one file to Storage and resolves its public download URL. */
const uploadFile = async (path, file) => {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
};

const fileExtension = (file) => {
    const name = file?.name || '';
    const dot = name.lastIndexOf('.');
    return dot >= 0 ? name.slice(dot) : '.jpg';
};

/** Reads a carrier's independent truck records from their `trucks` subcollection. */
const fetchTrucks = async (uid) => {
    const snap = await getDocs(collection(db, 'users', uid, 'trucks'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

/** Reads a user's account-level verification documents. */
const fetchDocuments = async (uid) => {
    const snap = await getDocs(collection(db, 'users', uid, 'documents'));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
};

/** The full profile shape the rest of the app expects: the users/{uid} doc plus its documents and (for carriers) trucks. */
const loadFullProfile = async (uid) => {
    const userSnap = await getDoc(doc(db, 'users', uid));
    if (!userSnap.exists()) return null;
    const userData = { id: uid, ...userSnap.data() };
    userData.documents = await fetchDocuments(uid);
    if (userData.role === 'CARRIER') userData.trucks = await fetchTrucks(uid);
    return userData;
};

/**
 * Uploads a truck's operatingCard/registration papers to Storage
 * (trucks/{uid}/{truckId}/…, INTEGRATION.md §4) and creates
 * users/{uid}/trucks/{truckId} with both papers PENDING and
 * isSelectable: false — the only shape the security rules accept on
 * create (firestore.rules, match /trucks/{truckId}).
 */
const createTruckRecord = async (uid, truckInput) => {
    const truckRef = doc(collection(db, 'users', uid, 'trucks'));
    const [operatingCardUrl, registrationUrl] = await Promise.all([
        truckInput.operatingCardFile
            ? uploadFile(`trucks/${uid}/${truckRef.id}/operating_card_${Date.now()}${fileExtension(truckInput.operatingCardFile)}`, truckInput.operatingCardFile)
            : Promise.resolve(''),
        truckInput.registrationFile
            ? uploadFile(`trucks/${uid}/${truckRef.id}/registration_${Date.now()}${fileExtension(truckInput.registrationFile)}`, truckInput.registrationFile)
            : Promise.resolve(''),
    ]);

    const truckData = {
        brand: truckInput.brand,
        model: truckInput.model,
        type: truckInput.type, // one of TruckType (FLATBED | HEAVY_CARGO | REFRIGERATED | BOX_TRUCK | TANKER | LOW_LOADER | OTHER)
        ...(truckInput.type === 'OTHER' ? { customType: truckInput.customType || '' } : {}),
        capacityTons: Number(truckInput.capacityTons) || 0,
        plateNumber: truckInput.plateNumber,
        operatingCard: {
            fileUrl: operatingCardUrl,
            status: 'PENDING',
            ...(truckInput.operatingCardExpiryDate ? { expiryDate: truckInput.operatingCardExpiryDate } : {}),
        },
        registration: { fileUrl: registrationUrl, status: 'PENDING' },
        isSelectable: false,
    };
    await setDoc(truckRef, truckData);
    return { id: truckRef.id, ...truckData };
};

// --- AUTH SERVICE ---
export const firebaseAuthService = {
    /**
     * Email OR Saudi mobile (INTEGRATION.md §6): a value matching
     * ^(?:\+9665|9665|05)\d{8}$ goes through `signInWithPhone` + a custom
     * token, anything with an `@` through email/password. Both end in the
     * same session. A wrong number and a wrong password are deliberately
     * indistinguishable, so both show one message.
     */
    login: async (identifier, password, role = 'SHIPPER') => {
        const value = identifier.trim();
        let uid;
        if (PHONE_PATTERN.test(value.replace(/\s/g, ''))) {
            try {
                const res = await call('signInWithPhone')({ phone: value.replace(/\s/g, ''), password });
                uid = (await signInWithCustomToken(auth, res.data.token)).user.uid;
            } catch (err) {
                if (err.code === 'functions/unauthenticated') throw new Error('رقم الجوال أو كلمة المرور غير صحيحة');
                if (err.code === 'functions/resource-exhausted') throw new Error('محاولات كثيرة فاشلة — انتظر قليلاً أو سجّل الدخول بالبريد الإلكتروني');
                throw err;
            }
        } else if (value.includes('@')) {
            uid = (await signInWithEmailAndPassword(auth, value, password)).user.uid;
        } else {
            throw new Error('أدخل بريداً إلكترونياً أو رقم جوال سعودي صحيح (05xxxxxxxx)');
        }
        const profile = await loadFullProfile(uid);
        if (!profile) {
            await signOut(auth);
            throw new Error('لا يوجد ملف تعريف مرتبط بهذا الحساب');
        }
        if (profile.role !== role) {
            await signOut(auth);
            throw new Error('هذا الحساب غير مسجل بهذا النوع من الحسابات');
        }
        return profile;
    },
    /**
     * Follows the worked example in INTEGRATION.md §5 exactly:
     * 1) signUp (Cloud Function — creates the Auth user AND the profile in
     *    one transaction; a client may never create users/{uid} directly).
     * 2) sign the user in — signUp does not do this itself.
     * 3) upload + record every required account-level document.
     * 4) for a carrier, add each truck with its own two papers.
     */
    registerNewUser: async (payload) => {
        const isCompany = payload.accountType === 'COMPANY';

        const signUpRes = await call('signUp')({
            email: payload.email,
            password: payload.password,
            role: payload.role,
            accountType: payload.accountType,
            name: payload.name,
            phone: payload.phone, // backend accepts 05.../9665.../+9665... and normalizes server-side
            ...(payload.city ? { city: payload.city } : {}),
            ...(isCompany ? { companyName: payload.companyName } : {}),
            ...(payload.commercialRegister ? { commercialRegister: payload.commercialRegister } : {}),
        });
        const uid = signUpRes.data.uid;

        // signUp does not sign anyone in.
        const { user: authUser } = await signInWithEmailAndPassword(auth, payload.email, payload.password);

        // Firebase's built-in verification email. It never blocks sign-in —
        // admin document review is what gates the account — so a failure to
        // send is not a failure to register.
        sendEmailVerification(authUser).catch(() => {});

        // Every uploaded document (payload.files, keyed by the stable
        // DOCUMENT_KEYS constants — NATIONAL_ID, PUBLIC_DRIVING_LICENCE,
        // COMMERCIAL_REGISTRATION, MANAGER_ID, which double as the account
        // document `type` value the backend expects) actually gets
        // uploaded to Storage and recorded in Firestore here.
        // Only the four account-level types belong in users/{uid}/documents —
        // truck papers are uploaded with their truck below. Anything else in
        // payload.files is ignored rather than recorded under a type the
        // admin dashboard can't name.
        const accountDocumentTypes = Object.values(DOCUMENT_KEYS);
        for (const [type, file] of Object.entries(payload.files || {})) {
            if (!file || !accountDocumentTypes.includes(type)) continue;
            const fileUrl = await uploadFile(`documents/${uid}/${type}_${Date.now()}${fileExtension(file)}`, file);
            await setDoc(doc(collection(db, 'users', uid, 'documents')), {
                type, fileUrl, status: 'PENDING', uploadedAt: serverTimestamp(),
            });
        }

        // Each truck the carrier registered becomes its own document in the
        // `trucks` subcollection — independent data and independent
        // documents per truck, never collapsed onto the carrier record.
        if (payload.role === 'CARRIER') {
            for (const truckInput of payload.trucks || []) {
                await createTruckRecord(uid, truckInput);
            }
        }

        return loadFullProfile(uid);
    },
    /**
     * Saves the account owner's own profile edits. `name`/`companyName` are
     * the self-editable fields (firestore.rules onlySelfEditableFields) and
     * are written directly; `phone` is a login identifier with a uniqueness
     * reservation, so it only changes through `updatePhoneNumber`
     * (INTEGRATION.md §3). The phone goes first: if the number is taken,
     * nothing is saved and the user keeps a consistent profile.
     */
    updateProfile: async (userId, { name, companyName, phone }) => {
        const current = (await getDoc(doc(db, 'users', userId))).data() || {};

        if (phone !== undefined && normalizeSaudiPhone(phone) !== current.phone) {
            try {
                await call('updatePhoneNumber')({ phone: normalizeSaudiPhone(phone) });
            } catch (err) {
                if (err.code === 'functions/already-exists') throw new Error('رقم الجوال مستخدم في حساب آخر');
                if (err.code === 'functions/invalid-argument') throw new Error('رقم الجوال غير صحيح — أدخل رقم جوال سعودي (05xxxxxxxx)');
                throw new Error('تعذّر تحديث رقم الجوال، حاول مرة أخرى');
            }
        }

        const updates = {};
        if (name !== undefined && name.trim() !== current.name) updates.name = name.trim();
        if (companyName !== undefined && current.accountType === 'COMPANY' && companyName.trim() !== (current.companyName || '')) {
            updates.companyName = companyName.trim();
        }
        if (Object.keys(updates).length > 0) await updateDoc(doc(db, 'users', userId), updates);

        return loadFullProfile(userId);
    },
    /**
     * Firebase's built-in reset email. Resolves the same way whether or not
     * an account exists for the address, so the form can't be used to find
     * out who is registered.
     */
    sendPasswordReset: async (email) => {
        try {
            await sendPasswordResetEmail(auth, email.trim());
        } catch (err) {
            if (err.code === 'auth/user-not-found') return;
            throw err;
        }
    },
    /** Whether the signed-in user has confirmed their email (informational — never blocks anything). */
    isEmailVerified: async () => {
        await auth.authStateReady();
        await auth.currentUser?.reload().catch(() => {});
        return !!auth.currentUser?.emailVerified;
    },
    resendEmailVerification: async () => {
        await auth.authStateReady();
        if (!auth.currentUser) throw new Error('انتهت الجلسة — سجّل الدخول مرة أخرى');
        await sendEmailVerification(auth.currentUser);
    },
    /**
     * Firebase Auth owns the password. Changing it needs a recent sign-in,
     * so the current password re-authenticates first — which is also what
     * checks that the person typing it is the account owner. Phone logins
     * (custom token) have the same email/password credential underneath.
     */
    changePassword: async (currentPassword, newPassword) => {
        const user = auth.currentUser;
        if (!user || !user.email) throw new Error('انتهت الجلسة — سجّل الدخول مرة أخرى ثم أعد المحاولة');
        try {
            await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword));
        } catch (err) {
            if (['auth/wrong-password', 'auth/invalid-credential', 'auth/invalid-login-credentials'].includes(err.code)) {
                throw new Error('كلمة المرور الحالية غير صحيحة');
            }
            if (err.code === 'auth/too-many-requests') throw new Error('محاولات كثيرة فاشلة — انتظر قليلاً ثم حاول مرة أخرى');
            throw new Error('تعذّر التحقق من كلمة المرور الحالية، حاول مرة أخرى');
        }
        try {
            await updatePassword(user, newPassword);
        } catch (err) {
            if (err.code === 'auth/weak-password') throw new Error('كلمة المرور الجديدة ضعيفة — استخدم 8 أحرف على الأقل');
            throw new Error('تعذّر تغيير كلمة المرور، حاول مرة أخرى');
        }
        return { success: true };
    },
    /** Adds one new truck (with its own documents) to the carrier's `trucks` subcollection. */
    addTruck: async (userId, truckInput) => {
        await createTruckRecord(userId, truckInput);
        return loadFullProfile(userId);
    },
    /**
     * Edits one existing truck's own details — never operatingCard.status,
     * registration.status, or isSelectable, which the rules only let this
     * write through unchanged (they stay untouched here, so the rule's
     * equality check passes automatically).
     */
    updateTruck: async (userId, truckId, { brand, model, type, capacityTons, plateNumber }) => {
        const updates = {};
        if (brand !== undefined) updates.brand = brand;
        if (model !== undefined) updates.model = model;
        if (type !== undefined) updates.type = type;
        if (capacityTons !== undefined) updates.capacityTons = Number(capacityTons);
        if (plateNumber !== undefined) updates.plateNumber = plateNumber;
        await updateDoc(doc(db, 'users', userId, 'trucks', truckId), updates);
        return loadFullProfile(userId);
    },
    /** Removes a truck from the carrier's `trucks` subcollection. */
    removeTruck: async (userId, truckId) => {
        await deleteDoc(doc(db, 'users', userId, 'trucks', truckId));
        return loadFullProfile(userId);
    },
    getCurrentUser: () => {
        return new Promise((resolve, reject) => {
            const unsubscribe = onAuthStateChanged(auth, async (user) => {
                unsubscribe();
                if (!user) return resolve(null);
                resolve(await loadFullProfile(user.uid));
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

// =====================================================================
// Stage 2 — shipments, negotiation, trips, wallet. Nothing here is
// client-writable on the real backend except account-independent reads —
// every mutation below goes through the matching Cloud Function in
// hemooltak-backend/INTEGRATION.md §12. Adapters translate the real
// Firestore/response shapes into the shape this app's UI already expects
// (see the audit that drove this rewrite) wherever that mapping is
// lossless; where the model is genuinely different (negotiation threads,
// site-details editing, offer rejection) the UI itself changes instead of
// being lied to by a fake adapter.
// =====================================================================

/** Attaches the private siteDetails half when the caller is allowed to read it (shipper or assigned carrier); silently leaves it off otherwise, exactly like the rules intend. */
const attachSiteDetails = async (shipment) => {
    try {
        const siteSnap = await getDoc(doc(db, 'shipments', shipment.id, 'private', 'siteDetails'));
        if (siteSnap.exists()) {
            const site = siteSnap.data();
            shipment.pickupLat = site.pickupCoords?.latitude ?? null;
            shipment.pickupLng = site.pickupCoords?.longitude ?? null;
            shipment.deliveryLat = site.deliveryCoords?.latitude ?? null;
            shipment.deliveryLng = site.deliveryCoords?.longitude ?? null;
            shipment.onSiteContact = site.onSiteContact;
            shipment.pickupNotes = site.pickupNotes || '';
            shipment.deliveryNotes = site.deliveryNotes || '';
        }
    } catch {
        // Not the shipper or the assigned carrier — siteDetails stays hidden.
    }
    return shipment;
};

const toIso = (value) => value?.toDate?.().toISOString() ?? value ?? null;

/** Public shipment fields only — `proposedPrice` is kept as an alias of `suggestedPrice` so existing UI reads keep working; there is no `volume` or `pickupLocation`/`deliveryLocation` on the real schema. */
const toShipmentUiShape = (id, data) => ({
    id,
    ...data,
    proposedPrice: data.suggestedPrice,
    createdAt: toIso(data.createdAt),
    loadingDate: toIso(data.loadingDate),
    assignedAt: toIso(data.assignedAt),
    completedAt: toIso(data.completedAt),
    cancelledAt: toIso(data.cancelledAt),
});

// --- SHIPMENT SERVICE ---
export const firebaseShipmentService = {
    /**
     * Every verified user may read every shipment's public half (the
     * marketplace) — this returns them all and leaves the per-role
     * filtering (mine / matching my truck type) to the calling screens,
     * same as the mock always did.
     */
    getShipments: async () => {
        const q = query(collection(db, 'shipments'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(d => toShipmentUiShape(d.id, d.data()));
    },
    getShipmentById: async (id) => {
        const docSnap = await getDoc(doc(db, 'shipments', id));
        if (!docSnap.exists()) throw new Error('الشحنة غير موجودة');
        return attachSiteDetails(toShipmentUiShape(docSnap.id, docSnap.data()));
    },
    /** `data` matches createShipment's real payload (INTEGRATION.md §12) plus the UI's flat `proposedPrice`/`pickupLat`.../`onSiteContact` fields, assembled into the required nested `siteDetails` shape here. */
    createShipment: async (data) => {
        const res = await call('createShipment')({
            cargoType: data.cargoType,
            weight: Number(data.weight),
            ...(data.description?.trim() ? { description: data.description.trim() } : {}),
            requiredTruckType: data.requiredTruckType,
            loadingDate: data.loadingDate,
            suggestedPrice: Number(data.proposedPrice),
            pickupCity: data.pickupCity,
            deliveryCity: data.deliveryCity,
            siteDetails: {
                pickupCoords: { lat: data.pickupLat, lng: data.pickupLng },
                deliveryCoords: { lat: data.deliveryLat, lng: data.deliveryLng },
                ...(data.pickupNotes ? { pickupNotes: data.pickupNotes } : {}),
                ...(data.deliveryNotes ? { deliveryNotes: data.deliveryNotes } : {}),
                onSiteContact: data.onSiteContact,
            },
        });
        return firebaseShipmentService.getShipmentById(res.data.shipmentId);
    },
    /**
     * Free before assignment, commission-charging after — `cancelShipment`
     * is the ONE function for both cases (INTEGRATION.md §12); trip-level
     * cancellation (firebaseTripService.cancelTrip) calls this same
     * function too, just resolving the shipmentId from the trip first.
     */
    cancelShipment: async (id, reason) => {
        const res = await call('cancelShipment')({ shipmentId: id, ...(reason ? { reason } : {}) });
        const shipment = await firebaseShipmentService.getShipmentById(id);
        shipment.cancellationResult = res.data;
        return shipment;
    },
    /**
     * There is no real Cloud Function for editing site details after
     * creation — `shipments/{id}/private/siteDetails` is `allow write: if
     * false` even for the shipper (INTEGRATION.md §13). This is a genuine
     * gap versus the mock's editable behavior, not something to fake.
     */
    updateSiteDetails: async () => {
        throw new Error('لا يمكن تعديل بيانات الموقع بعد نشر الشحنة — هذه الميزة غير مدعومة حالياً من الخادم.');
    }
};

// --- CATALOG SERVICE (admin-managed lists) --------------------------------
// config/cargoTypes and config/truckTypes are written by the admin
// dashboard (config/* is admin-writable, readable by any signed-in user).
// Both fall back to the built-in lists when the admin hasn't saved any.
export const firebaseCatalogService = {
    /** [{ id, name, category }] */
    getCargoTypes: async () => {
        const snap = await getDoc(doc(db, 'config', 'cargoTypes'));
        return snap.exists() && Array.isArray(snap.data().items) ? snap.data().items : null;
    },
    /** { [TruckType]: { label, active } } — overrides only; the codes themselves are the fixed backend enum. */
    getTruckTypeOverrides: async () => {
        const snap = await getDoc(doc(db, 'config', 'truckTypes'));
        return (snap.exists() && snap.data().items) || {};
    },
};

// --- Shared negotiation-thread helpers -----------------------------------
/**
 * Another user's profile is readable only by that user and admins
 * (INTEGRATION.md §7) — a shipper reading its carrier's profile is
 * refused. Returns null instead of throwing so callers can fall back to
 * the public snapshots the backend puts on each offer.
 */
const userInfoCache = new Map();
const getUserInfo = async (uid) => {
    if (userInfoCache.has(uid)) return userInfoCache.get(uid);
    let info = null;
    try {
        const snap = await getDoc(doc(db, 'users', uid));
        if (snap.exists()) info = { name: snap.data().companyName || snap.data().name, rating: snap.data().rating ?? null };
    } catch { /* not ours to read */ }
    userInfoCache.set(uid, info);
    return info;
};

const createdMillis = (o) => o.createdAt?.toMillis?.() ?? 0;

/**
 * Rebuilds one carrier's thread on a shipment from the real offer-chain
 * (root -> counteredByOfferId -> ... -> live/terminal offer) into the shape
 * the UI expects: the live offer's own fields at the top level, plus a
 * `history` array for the negotiation view. `offers` is every offer doc for
 * ONE carrier on ONE shipment.
 *
 * A carrier whose offer was rejected may offer again (INTEGRATION.md §12
 * rejectOffer), which starts a NEW chain — so there can be several roots.
 * `anchorOfferId` picks the chain containing that offer; without it the
 * newest chain wins. Carrier name/rating/truck type come from the public
 * snapshots on the offer itself (§9), never from the carrier's profile.
 */
const buildOfferThread = (shipmentId, offers, anchorOfferId = null) => {
    const byId = new Map(offers.map(o => [o.id, o]));
    const chains = offers
        .filter(o => !o.previousOfferId || !byId.has(o.previousOfferId))
        .map(root => {
            const chain = [];
            let node = root;
            while (node) {
                chain.push(node);
                node = node.counteredByOfferId ? byId.get(node.counteredByOfferId) : null;
            }
            return chain;
        })
        .sort((a, b) => createdMillis(b[0]) - createdMillis(a[0]));
    const chain = (anchorOfferId && chains.find(c => c.some(o => o.id === anchorOfferId))) || chains[0];
    const live = chain[chain.length - 1];
    return {
        id: live.id,
        shipmentId,
        carrierId: live.carrierId,
        truckId: live.truckId,
        offeredPrice: live.amount,
        status: live.status,
        proposedBy: live.proposedBy,
        rejectReason: live.rejectReason || null,
        submittedAt: toIso(chain[0].createdAt),
        carrierName: live.carrierName || chain[0].carrierName || '—',
        carrierRating: live.carrierRating ?? chain[0].carrierRating ?? null,
        carrierCompletedTrips: live.carrierCompletedTrips ?? chain[0].carrierCompletedTrips ?? 0,
        carrierTruckType: live.truckType || chain[0].truckType || null,
        history: chain.map(o => ({ amount: o.amount, senderRole: o.proposedBy, timestamp: toIso(o.createdAt) })),
    };
};

// Set once the offers collection-group query is refused, so later calls go
// straight to the per-shipment reads instead of failing again first.
let offersCollectionGroupDenied = false;

const groupBy = (items, keyFn) => {
    const map = new Map();
    for (const item of items) {
        const key = keyFn(item);
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(item);
    }
    return map;
};

// --- OFFER SERVICE ---
export const firebaseOfferService = {
    /** One row per carrier thread — mirrors what ReceivedOffers.jsx already renders. */
    getOffersForShipment: async (shipmentId) => {
        const snap = await getDocs(collection(db, 'shipments', shipmentId, 'offers'));
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const byCarrier = groupBy(all, o => o.carrierId);
        return Promise.all([...byCarrier.values()].map(offers => buildOfferThread(shipmentId, offers)));
    },
    /** One row per shipment this carrier has ever offered on — a collection-group query constrained on carrierId, per the rules and the provisioned index. */
    /**
     * Every offer thread this carrier has, across all shipments.
     *
     * The direct way is one collection-group query (served by the
     * offers carrierId+createdAt COLLECTION_GROUP index), but firestore.rules
     * only matches offers under shipments/{id}, with no `{path=**}/offers`
     * rule, so that query is denied. Until the backend adds that rule, fall
     * back to the documented per-shipment read: each shipment's offers
     * constrained to this carrier (INTEGRATION.md "shipments/{id}/offers").
     */
    getOffersByCarrier: async (carrierId) => {
        let all;
        if (!offersCollectionGroupDenied) {
            try {
                const snap = await getDocs(query(
                    collectionGroup(db, 'offers'),
                    where('carrierId', '==', carrierId),
                    orderBy('createdAt', 'desc'),
                ));
                all = snap.docs.map(d => ({ id: d.id, shipmentId: d.ref.parent.parent.id, ...d.data() }));
            } catch (err) {
                if (err.code !== 'permission-denied' && err.code !== 'failed-precondition') throw err;
                offersCollectionGroupDenied = true;
            }
        }
        if (!all) {
            const shipmentsSnap = await getDocs(collection(db, 'shipments'));
            const perShipment = await Promise.all(shipmentsSnap.docs.map(async (s) => {
                const snap = await getDocs(query(collection(db, 'shipments', s.id, 'offers'), where('carrierId', '==', carrierId)));
                return snap.docs.map(d => ({ id: d.id, shipmentId: s.id, ...d.data() }));
            }));
            all = perShipment.flat();
        }
        const byShipment = groupBy(all, o => o.shipmentId);
        return Promise.all([...byShipment.entries()].map(([shipmentId, offers]) => buildOfferThread(shipmentId, offers)));
    },
    /** This carrier's thread on one shipment, or null — the read the rules allow a carrier (constrained to their own carrierId). */
    getMyThreadOnShipment: async (shipmentId, carrierId) => {
        const snap = await getDocs(query(collection(db, 'shipments', shipmentId, 'offers'), where('carrierId', '==', carrierId)));
        if (snap.empty) return null;
        return buildOfferThread(shipmentId, snap.docs.map(d => ({ id: d.id, ...d.data() })));
    },
    /**
     * Resolves the WHOLE thread from any historical offer id in its chain —
     * used by Negotiation.jsx, whose URL anchors on whatever offer id was
     * live at the time the user navigated in, which may have since been
     * superseded by a counter (a new offer id) further down the chain.
     */
    getThreadContainingOffer: async (shipmentId, offerId) => {
        const offerSnap = await getDoc(doc(db, 'shipments', shipmentId, 'offers', offerId));
        if (!offerSnap.exists()) return null;
        const carrierId = offerSnap.data().carrierId;
        const chainSnap = await getDocs(query(collection(db, 'shipments', shipmentId, 'offers'), where('carrierId', '==', carrierId)));
        return buildOfferThread(shipmentId, chainSnap.docs.map(d => ({ id: d.id, ...d.data() })), offerId);
    },
    /** `data`: { shipmentId, carrierId (ignored — inferred from the caller), truckId, offeredPrice }. */
    submitOffer: async (data) => {
        const res = await call('submitOffer')({ shipmentId: data.shipmentId, truckId: data.truckId, amount: data.offeredPrice });
        const offerSnap = await getDoc(doc(db, 'shipments', data.shipmentId, 'offers', res.data.offerId));
        return buildOfferThread(data.shipmentId, [{ id: offerSnap.id, ...offerSnap.data() }]);
    },
    /** `senderRole` param dropped — the backend infers whose turn it is from the caller's own identity, not a client-supplied label. */
    counterOffer: async (shipmentId, offerId, amount) => {
        const res = await call('counterOffer')({ shipmentId, offerId, amount });
        const newOfferSnap = await getDoc(doc(db, 'shipments', shipmentId, 'offers', res.data.offerId));
        const newOffer = { id: newOfferSnap.id, ...newOfferSnap.data() };
        const chainSnap = await getDocs(query(collection(db, 'shipments', shipmentId, 'offers'), where('carrierId', '==', newOffer.carrierId)));
        return buildOfferThread(shipmentId, chainSnap.docs.map(d => ({ id: d.id, ...d.data() })), newOffer.id);
    },
    acceptOffer: async (shipmentId, offerId) => (await call('acceptOffer')({ shipmentId, offerId })).data,
    /**
     * Closes ONE thread (INTEGRATION.md §12 rejectOffer) — only the side that
     * did NOT make the live offer may reject it. Other carriers' threads are
     * untouched, and a rejected carrier may offer again.
     */
    rejectOffer: async (shipmentId, offerId, reason) =>
        (await call('rejectOffer')({ shipmentId, offerId, ...(reason ? { reason } : {}) })).data,
};

/** Trip fields the UI already reads under mock-era names, mapped onto the real schema (INTEGRATION.md §9) — `currentStage`/`overallStatus`/`finalPrice`/`stages`, plus a derived `route` and `carrierName` the real trip doc doesn't itself carry. */
/** { url, coords, timestamp } (real schema) -> { photoDataUrl, lat, lng, capturedAt } (what ProofPhotoCapture's `existingPhoto` prop reads) — the "photoDataUrl" name is stale now that it's a real Storage URL rather than a base64 data URL, but any valid <img src> works the same way. */
const toProofUiShape = (proof) => proof ? {
    photoDataUrl: proof.url,
    lat: proof.coords?.latitude ?? null,
    lng: proof.coords?.longitude ?? null,
    capturedAt: toIso(proof.timestamp),
} : null;

const toTripUiShape = async (id, data) => {
    const trip = {
        id,
        ...data,
        currentStage: data.stage,
        overallStatus: data.status,
        finalPrice: data.agreedPrice,
        stages: (data.stageHistory || []).map(s => ({ stage: s.stage, timestamp: toIso(s.timestamp) })),
        proofOfLoad: toProofUiShape(data.proofOfLoad),
        proofOfDelivery: toProofUiShape(data.proofOfDelivery),
        startedAt: toIso(data.createdAt),
        completedAt: toIso(data.completedAt),
        messages: (data.quickMessages || []).map((m, i) => ({
            id: `${m.senderId}-${i}`,
            senderId: m.senderId,
            messageKey: m.messageKey,
            timestamp: toIso(m.timestamp),
        })),
    };
    if (data.status === 'CANCELLED') {
        trip.cancellation = { cancelledBy: data.cancelledBy, reason: data.cancelReason, at: toIso(data.cancelledAt) };
    }
    try {
        const shipmentSnap = await getDoc(doc(db, 'shipments', data.shipmentId));
        if (shipmentSnap.exists()) {
            const s = shipmentSnap.data();
            trip.route = `${s.pickupCity} -> ${s.deliveryCity}`;
        }
    } catch { /* leave route unset */ }
    // A shipper may not read the carrier's profile — fall back to the
    // public name snapshot on the carrier's offer for this shipment.
    const carrierInfo = await getUserInfo(data.carrierId);
    trip.carrierName = carrierInfo?.name ?? null;
    if (!trip.carrierName) {
        try {
            const offersSnap = await getDocs(query(collection(db, 'shipments', data.shipmentId, 'offers'), where('carrierId', '==', data.carrierId)));
            trip.carrierName = offersSnap.docs.map(d => d.data().carrierName).find(Boolean) || '—';
        } catch {
            trip.carrierName = '—';
        }
    }
    const me = auth.currentUser?.uid;
    if (me) {
        const ratingSnap = await getDoc(doc(db, 'trips', id, 'ratings', me));
        trip.isRated = ratingSnap.exists();
    }
    return trip;
};

/** dataURL (from ProofPhotoCapture's canvas capture) -> Blob, for uploading to Storage. */
const dataUrlToBlob = async (dataUrl) => (await fetch(dataUrl)).blob();

// --- TRIP SERVICE ---
export const firebaseTripService = {
    getTrips: async () => {
        const currentUser = await firebaseAuthService.getCurrentUser();
        if (!currentUser) return [];
        const field = currentUser.role === 'CARRIER' ? 'carrierId' : 'shipperId';
        const snap = await getDocs(query(collection(db, 'trips'), where(field, '==', currentUser.id)));
        return Promise.all(snap.docs.map(d => toTripUiShape(d.id, d.data())));
    },
    getTripById: async (id) => {
        const snap = await getDoc(doc(db, 'trips', id));
        if (!snap.exists()) throw new Error('الرحلة غير موجودة');
        return toTripUiShape(snap.id, snap.data());
    },
    /**
     * `proof`, when present (advancing to LOADED/DELIVERED), is
     * `{ photoDataUrl, lat, lng, capturedAt }` from ProofPhotoCapture — the
     * photo is uploaded to Storage and recorded via recordTripProof BEFORE
     * updateTripStage, exactly the order INTEGRATION.md §15 requires (the
     * reverse order fails with `failed-precondition`/`missingProof`).
     */
    updateTripStage: async (id, stage, proof) => {
        if (proof) {
            const kind = stage === TripStage.LOADED ? 'LOAD' : 'DELIVERY';
            const blob = await dataUrlToBlob(proof.photoDataUrl);
            const path = `trips/${id}/proof_of_${kind === 'LOAD' ? 'load' : 'delivery'}_${Date.now()}.jpg`;
            const url = await uploadFile(path, blob);
            await call('recordTripProof')({ tripId: id, kind, url, coords: { lat: proof.lat, lng: proof.lng } });
        }
        const res = await call('updateTripStage')({ tripId: id, stage });
        const trip = await firebaseTripService.getTripById(id);
        trip.settlement = res.data.settlement; // { price, commission, debtDeducted, netToCarrier } on DELIVERED, else null
        return trip;
    },
    cancellableStages: [TripStage.ASSIGNED, TripStage.EN_ROUTE_PICKUP, TripStage.ARRIVED_PICKUP],
    /** Resolves the trip's shipmentId and cancels through the same cancelShipment function the pre-assignment path uses — there is no separate trip-level cancel endpoint. */
    cancelTrip: async (tripId) => {
        const tripSnap = await getDoc(doc(db, 'trips', tripId));
        if (!tripSnap.exists()) throw new Error('الرحلة غير موجودة');
        const res = await call('cancelShipment')({ shipmentId: tripSnap.data().shipmentId });
        const trip = await firebaseTripService.getTripById(tripId);
        trip.cancellationResult = res.data; // { chargedTo, commission, ... } for an immediate confirmation message
        return trip;
    },
    /** `label` is dropped over the wire — only `messageKey` is stored (INTEGRATION.md §12); the label is a client-side phrase-table lookup (see QuickMessagePanel). */
    sendQuickMessage: async (tripId, senderRole, messageKey) => {
        await call('sendQuickMessage')({ tripId, messageKey });
        return { id: `local-${Date.now()}`, senderId: auth.currentUser?.uid, messageKey, timestamp: new Date().toISOString() };
    },
    submitRating: async (tripId, score, comment) => (await call('submitRating')({ tripId, score, ...(comment ? { comment } : {}) })).data,
};

// --- WALLET SERVICE ---
const toWalletUiShape = (data) => {
    const totalBalance = data?.totalBalance ?? 0;
    const reservedAmount = data?.reservedAmount ?? 0;
    // `availableBalance` is never stored (INTEGRATION.md §9) — always derived.
    return { balance: totalBalance, reservedBalance: reservedAmount, available: totalBalance - reservedAmount };
};

export const firebaseWalletService = {
    getWallet: async () => {
        const currentUser = await firebaseAuthService.getCurrentUser();
        if (!currentUser) throw new Error('Unauthorized');
        const snap = await getDoc(doc(db, 'wallets', currentUser.id));
        return toWalletUiShape(snap.exists() ? snap.data() : null);
    },
    getTransactions: async () => {
        const currentUser = await firebaseAuthService.getCurrentUser();
        if (!currentUser) throw new Error('Unauthorized');
        const snap = await getDocs(query(collection(db, 'wallets', currentUser.id, 'transactions'), orderBy('createdAt', 'desc')));
        return snap.docs.map(d => {
            const data = d.data();
            return {
                id: d.id,
                type: data.type,
                amount: data.amount,
                withheld: data.withheld,
                description: data.description || '',
                referenceId: data.shipmentId || data.tripId || data.withdrawalId || null,
                timestamp: toIso(data.createdAt),
            };
        });
    },
    topUp: async (amount) => {
        const res = await call('topUpWallet')({ amount: Number(amount) });
        return { id: `topup-${Date.now()}`, type: 'TOP_UP', amount: res.data.credited, description: 'شحن رصيد', timestamp: new Date().toISOString() };
    },
    /** Only holds the amount (reservedAmount rises) — settlement happens later when an admin calls processWithdrawal, not instantly like the mock. */
    /**
     * Saves the carrier's IBAN + account name on their profile through
     * updateBankDetails (INTEGRATION.md §12) — not client-writable directly,
     * because the backend verifies the IBAN's check digits.
     */
    saveBankDetails: async (iban, bankAccountName) => {
        try {
            return (await call('updateBankDetails')({ iban, bankAccountName })).data;
        } catch (err) {
            if (err.code === 'functions/invalid-argument') {
                throw new Error(/bankAccountName/.test(err.message)
                    ? 'اسم صاحب الحساب مطلوب (100 حرف كحد أقصى).'
                    : 'رقم الآيبان غير صحيح — تأكد من كتابته (SA متبوعاً بـ 22 خانة).');
            }
            throw err;
        }
    },
    /** The backend snapshots the carrier's saved bank details onto the withdrawal and echoes them back. */
    withdraw: async (amount, note) => {
        try {
            const res = await call('requestWithdrawal')({ amount: Number(amount), ...(note ? { note } : {}) });
            return {
                id: res.data.withdrawalId, type: 'WITHDRAWAL', amount: -res.data.amount,
                iban: res.data.iban, bankAccountName: res.data.bankAccountName,
                description: 'طلب سحب رصيد (قيد مراجعة الإدارة)', timestamp: new Date().toISOString(),
            };
        } catch (err) {
            if (err.code === 'functions/failed-precondition') {
                if (err.details?.missing) throw new Error('يرجى إضافة بيانات الحساب البنكي قبل طلب السحب.');
                if (err.details?.availableBalance !== undefined) throw new Error(`الرصيد المتاح غير كافٍ (المتاح: ${err.details.availableBalance} ر.س).`);
                if (/you owe/i.test(err.message)) throw new Error('لا يمكن السحب قبل سداد المديونية المستحقة.');
                if (/verified/i.test(err.message)) throw new Error('حسابك غير موثّق بعد.');
            }
            throw err;
        }
    },
};

// --- NOTIFICATION SERVICE ---
// The backend writes every notification to users/{uid}/notifications with
// its Arabic title/body already rendered (INTEGRATION.md §17); that inbox
// is what the bell reads. Read state only moves through the two callables —
// the rules deny any direct client write.
// Type names as the backend emits them (functions/src/constants.ts NotificationType).
const WALLET_TYPES = ['SETTLEMENT_CREDITED', 'DEBT_FORGIVEN', 'WITHDRAWAL_PAID', 'WITHDRAWAL_REJECTED'];
const ACCOUNT_TYPES = ['ACCOUNT_APPROVED', 'ACCOUNT_REJECTED', 'ACCOUNT_SUSPENDED', 'SUSPENSION_LIFTED', 'WARNING_ISSUED', 'DOCUMENT_REJECTED', 'TRUCK_DOC_APPROVED', 'TRUCK_DOC_REJECTED'];

/** Where tapping a notification should take the user, from its routing data. */
const notificationLink = (type, data = {}) => {
    if (data.tripId) return `/app/trips/${data.tripId}/track`;
    if (data.offerId && data.shipmentId) return `/app/shipments/${data.shipmentId}/negotiation/${data.offerId}`;
    if (data.shipmentId) return `/app/shipments/${data.shipmentId}`;
    if (data.truckId || ACCOUNT_TYPES.includes(type)) return '/app/account';
    if (WALLET_TYPES.includes(type)) return '/app/wallet';
    return null;
};

export const firebaseNotificationService = {
    getNotifications: async () => {
        await auth.authStateReady();
        const uid = auth.currentUser?.uid;
        if (!uid) return [];
        const snap = await getDocs(query(
            collection(db, 'users', uid, 'notifications'),
            orderBy('createdAt', 'desc'),
            limit(50),
        ));
        return snap.docs.map((d) => {
            const n = d.data();
            const type = n.type || n.data?.type;
            const text = notificationDisplayText(type, n.title || '', n.body || '');
            return {
                id: d.id,
                type,
                title: text.title,
                message: text.body,
                timestamp: n.createdAt?.toDate?.().toISOString() ?? null,
                isRead: !!n.read,
                linkTo: notificationLink(type, n.data),
            };
        });
    },
    markAsRead: async (notificationId) => {
        await call('markNotificationRead')({ notificationId });
    },
    markAllAsRead: async () => {
        await call('markAllNotificationsRead')({});
    },
};
