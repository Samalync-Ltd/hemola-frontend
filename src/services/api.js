import { mockShipments, mockOffers, mockTrips, mockWallets, mockTransactions, mockNotifications, mockUsers, MOCK_ARRAYS } from '../mocks/data';
import { persistMockStore } from '../mocks/persistence';
import { ShipmentStatus, OfferStatus, TripStage, TransactionType, AccountStatus } from '../constants/enums';
import { COMMISSION_RATE, CANCELLATION_WARNING_THRESHOLD } from '../constants/config';
// Helper to simulate network delay
const delay = (ms = 800) => new Promise(resolve => setTimeout(resolve, ms));

/** Snapshots the whole mock store — call after any function that mutates it. */
const persist = () => persistMockStore(MOCK_ARRAYS);

/**
 * Every exported service below mutates the shared mock store at some point
 * (or reads it, harmlessly re-persisting the same data) — wrapping them all
 * here means a new service method persists correctly by default instead of
 * relying on a manually-placed `persist()` call at every mutation site,
 * which is exactly the kind of spot a change quietly misses later. Methods
 * that mutate state asynchronously via `setTimeout` (the simulated carrier
 * auto-response, the delayed withdrawal settlement) still call `persist()`
 * explicitly at that later point — this wrapper only covers what changed
 * before the returned promise settled.
 */
const withAutoPersist = (service) => Object.fromEntries(
    Object.entries(service).map(([name, value]) => {
        if (typeof value !== 'function') return [name, value];
        return [name, async (...args) => {
            const result = await value(...args);
            persist();
            return result;
        }];
    })
);

// --- Wallet internals shared by walletService and the settlement/cancellation
// flows below. `balance` is the total; `reservedBalance` is held against
// shipments awaiting delivery; "available" (what can be spent/withdrawn) is
// always balance - reservedBalance. Mirrors the mobile wallet model 1:1.
const findOrCreateWallet = (userId) => {
    let wallet = mockWallets.find(w => w.userId === userId);
    if (!wallet) {
        wallet = { userId, balance: 0, reservedBalance: 0 };
        mockWallets.push(wallet);
    }
    return wallet;
};
const availableBalance = (wallet) => wallet.balance - wallet.reservedBalance;
const logTransaction = (walletId, type, amount, description) => {
    const wallet = findOrCreateWallet(walletId);
    const txn = {
        id: `txn-${Math.floor(Math.random() * 100000)}`,
        walletId,
        type,
        amount,
        description,
        timestamp: new Date().toISOString(),
        balanceAfter: wallet.balance,
    };
    mockTransactions.unshift(txn);
    return txn;
};
export const authService = withAutoPersist({
    login: async (identifier, password, role = 'SHIPPER') => {
        await delay();
        
        const normalizedId = identifier.toLowerCase();
        let user = mockUsers.find(u => 
            (u.email.toLowerCase() === normalizedId || u.phone === identifier) && 
            u.role === role
        );

        if (!user) {
            throw new Error('بيانات تسجيل الدخول غير صحيحة');
        }

        localStorage.setItem('demo_role', role);
        localStorage.setItem('demo_user_id', user.id); // Persist actual user ID
        return user;
    },
    /**
     * Creates a genuinely new mock user from the registration wizard's
     * collected data, instead of the previous behavior of silently falling
     * back to a seeded demo identity. This is what makes "fresh account"
     * mean something on web: a brand-new id has no seeded shipments,
     * offers, trips, or wallet history anywhere in the mock store, so every
     * screen that filters by the current user's id naturally starts empty
     * — the same guarantee mobile's `isFreshAccountProvider` gives.
     */
    registerNewUser: (payload) => {
        const id = `${payload.role === 'CARRIER' ? 'new-carrier' : 'new-shipper'}-${Date.now()}`;
        const isCompany = payload.accountType === 'COMPANY';
        const user = {
            id,
            role: payload.role,
            name: isCompany ? payload.managerName : payload.individualName,
            email: payload.email,
            phone: payload.phone,
            accountType: payload.accountType,
            // Demo-only: the review step's "simulate admin approval" button
            // is what gets a user here, so the account is verified by then.
            accountStatus: AccountStatus.VERIFIED,
            notificationsEnabled: true,
            ...(isCompany ? { companyName: payload.companyName } : {}),
            ...(payload.role === 'CARRIER'
                ? {
                    truckType: payload.truckType,
                    plateNumber: payload.plateNumber || '',
                    rating: 0,
                    completedTrips: 0,
                }
                : {}),
        };
        mockUsers.push(user);
        localStorage.setItem('demo_role', user.role);
        localStorage.setItem('demo_user_id', user.id);
        return user;
    },
    /** Mock-only: no real password check, just reports success like a real flow would. */
    changePassword: async () => {
        await delay(500);
        return { success: true };
    },
    /** One master switch — receive notifications, or don't. */
    setNotificationsEnabled: async (userId, value) => {
        await delay(200);
        const user = mockUsers.find(u => u.id === userId);
        if (user) user.notificationsEnabled = value;
        return { notificationsEnabled: value };
    },
    /** Carrier truck info shown/edited from the profile screen. */
    updateTruckInfo: async (userId, { truckType, plateNumber }) => {
        await delay(400);
        const user = mockUsers.find(u => u.id === userId);
        if (!user) throw new Error('المستخدم غير موجود');
        user.truckType = truckType;
        user.plateNumber = plateNumber;
        return { ...user };
    },
    getCurrentUser: async () => {
        await delay(300);
        const role = localStorage.getItem('demo_role');
        const userId = localStorage.getItem('demo_user_id');
        
        if (!role) return null;

        if (userId) {
            const user = mockUsers.find(u => u.id === userId);
            if (user) return user;
        }

        // Fallback for older sessions
        return role === 'CARRIER' ? mockUsers[1] : mockUsers[0];
    },
    logout: async () => {
        await delay(300);
        localStorage.removeItem('demo_role');
        localStorage.removeItem('demo_user_id');
    }
});
export const shipmentService = withAutoPersist({
    getShipments: async () => {
        await delay();
        return [...mockShipments];
    },
    getShipmentById: async (id) => {
        await delay();
        const shipment = mockShipments.find(s => s.id === id);
        if (!shipment)
            throw new Error('الشحنة غير موجودة');
        return { ...shipment };
    },
    createShipment: async (data) => {
        await delay();
        const newShipment = {
            ...data,
            id: `HM-${Math.floor(1000 + Math.random() * 9000)}`,
            status: ShipmentStatus.OFFERS_PENDING,
            createdAt: new Date().toISOString(),
            offerCount: 0
        };
        mockShipments.unshift(newShipment);
        return newShipment;
    },
    /**
     * DEMO_MODE's simulated marketplace trickle (see CarrierShipments.jsx) —
     * a real shipment record in the mock store representing another
     * (simulated) shipper's posting, not just something painted into one
     * screen's local state, so clicking into it to submit an offer works
     * like any real shipment. `shipperId` is a synthetic id with no backing
     * account, so it never appears in any real shipper's own shipment list.
     */
    injectDemoShipment: async (data) => {
        const newShipment = { ...data, shipperId: 'demo-shipper', createdAt: new Date().toISOString() };
        mockShipments.unshift(newShipment);
        return newShipment;
    },
    /**
     * Free, no-commission cancellation for a shipment that hasn't been
     * assigned to a carrier yet (no trip/reservation exists at this point —
     * see tripService.cancelTrip for the post-assignment, commission-charging
     * path). Blocked once a carrier is assigned.
     */
    cancelShipment: async (id) => {
        await delay(300);
        const shipment = mockShipments.find(s => s.id === id);
        if (!shipment) throw new Error('الشحنة غير موجودة');
        if (shipment.status === ShipmentStatus.ACTIVE || shipment.status === ShipmentStatus.COMPLETED) {
            throw new Error('لا يمكن إلغاء الشحنة بعد إسنادها لناقل — استخدم خيار إلغاء الرحلة بدلاً من ذلك.');
        }
        shipment.status = ShipmentStatus.CANCELLED;
        return { ...shipment };
    },
    /**
     * Directions + on-site contact stay editable only up to assignment —
     * mirrors mobile's `canEditSiteDetails`. Never exposed pre-acceptance:
     * the public browse list (CarrierShipments) and the pre-acceptance
     * detail view (CarrierShipmentDetail) simply never render these fields.
     */
    updateSiteDetails: async (id, { pickupDirections, pickupContact, deliveryDirections, deliveryContact }) => {
        await delay(300);
        const shipment = mockShipments.find(s => s.id === id);
        if (!shipment) throw new Error('الشحنة غير موجودة');
        if (shipment.status === ShipmentStatus.ACTIVE || shipment.status === ShipmentStatus.COMPLETED) {
            throw new Error('لا يمكن تعديل بيانات الموقع بعد إسناد الشحنة لناقل.');
        }
        Object.assign(shipment, { pickupDirections, pickupContact, deliveryDirections, deliveryContact });
        return { ...shipment };
    }
});
export const offerService = withAutoPersist({
    getOffersForShipment: async (shipmentId) => {
        await delay();
        return mockOffers.filter(o => o.shipmentId === shipmentId);
    },
    getOffersByCarrier: async (carrierId) => {
        await delay();
        return mockOffers.filter(o => o.carrierId === carrierId);
    },
    submitOffer: async (data) => {
        await delay();
        const newOffer = {
            id: `offer-${Math.floor(Math.random() * 10000)}`,
            shipmentId: data.shipmentId,
            carrierId: data.carrierId,
            offeredPrice: data.offeredPrice,
            status: OfferStatus.PENDING,
            submittedAt: new Date().toISOString(),
            carrierRating: 5.0,
            carrierName: data.carrierName,
            carrierTruckType: data.truckType,
            history: [{ amount: data.offeredPrice, senderRole: 'CARRIER', timestamp: new Date().toISOString() }],
        };
        mockOffers.push(newOffer);
        const shipment = mockShipments.find(s => s.id === data.shipmentId);
        if (shipment) shipment.status = ShipmentStatus.NEGOTIATING;
        return newOffer;
    },
    /**
     * DEMO_MODE's simulated first offer on a fresh shipper's first shipment
     * (see ReceivedOffers.jsx) — a real offer record in the mock store, not
     * just something painted into one screen's local state, so navigating
     * into its negotiation thread (or reloading) finds it like any other
     * offer. `carrierId` is a synthetic id with no backing user record,
     * same as mobile's simulated `CarrierSummary` demo entries.
     */
    injectDemoOffer: async (shipmentId, { carrierName, carrierRating, carrierTruckType, offeredPrice }) => {
        const newOffer = {
            id: `demo-offer-${shipmentId}`,
            shipmentId,
            carrierId: 'demo-carrier',
            offeredPrice,
            status: OfferStatus.PENDING,
            submittedAt: new Date().toISOString(),
            carrierRating,
            carrierName,
            carrierTruckType,
            history: [{ amount: offeredPrice, senderRole: 'CARRIER', timestamp: new Date().toISOString() }],
        };
        mockOffers.push(newOffer);
        const shipment = mockShipments.find(s => s.id === shipmentId);
        if (shipment) shipment.status = ShipmentStatus.NEGOTIATING;
        return newOffer;
    },
    /** Either party proposes a new price — the thread stays open (PENDING) for the other side to accept/counter/reject. */
    counterOffer: async (offerId, amount, senderRole) => {
        await delay(400);
        const offer = mockOffers.find(o => o.id === offerId);
        if (!offer) throw new Error('العرض غير موجود');
        offer.offeredPrice = amount;
        offer.status = OfferStatus.PENDING;
        offer.history = [...(offer.history || []), { amount, senderRole, timestamp: new Date().toISOString() }];

        // No live counterpart in this demo (single-session) app — same as
        // mobile's `_scheduleCarrierResponse`, a shipper's counter gets a
        // simulated carrier reply shortly after: accept outright if it's
        // close to the shipment's original suggested price, otherwise
        // counter back at the midpoint. A carrier's counter waits for the
        // real shipper to respond from their own Negotiation view.
        if (senderRole === 'SHIPPER') {
            const shipment = mockShipments.find(s => s.id === offer.shipmentId);
            const originalPrice = shipment ? shipment.proposedPrice : amount;
            setTimeout(() => {
                // Bail if the shipper already acted again (new counter/accept/reject).
                const stillPending = offer.status === OfferStatus.PENDING &&
                    offer.history[offer.history.length - 1]?.amount === amount;
                if (!stillPending) return;

                // A demo negotiation should feel like a negotiation: the
                // simulated carrier always counters at least once before it
                // will accept, even when the shipper's opening counter is
                // already close to (or above) the original price. Only from
                // the carrier's *second* response onward does the "close
                // enough, just accept" shortcut apply — so a round trip
                // always shows at least two rounds of counter-offers before
                // resolving, matching mobile's negotiation_threads_provider.
                const carrierResponseCount = offer.history.filter(h => h.senderRole === 'CARRIER').length;
                const isFirstCarrierResponse = carrierResponseCount <= 1; // Only the opening bid so far.

                if (!isFirstCarrierResponse && amount <= originalPrice * 1.06) {
                    // Carrier accepts the shipper's price outright — the shipper
                    // still has to press "accept & assign" to reserve funds and
                    // create the trip (see offerService.acceptOffer).
                    offer.status = OfferStatus.ACCEPTED;
                } else {
                    const midpoint = Math.round((amount + originalPrice) / 2);
                    offer.offeredPrice = midpoint;
                    offer.history = [...offer.history, { amount: midpoint, senderRole: 'CARRIER', timestamp: new Date().toISOString() }];
                }
                persist();
            }, 1600);
        }
        return { ...offer };
    },
    rejectOffer: async (offerId) => {
        await delay(300);
        const offer = mockOffers.find(o => o.id === offerId);
        if (!offer) throw new Error('العرض غير موجود');
        offer.status = OfferStatus.REJECTED;
        return { ...offer };
    },
    /**
     * The carrier's side of "accepting" a price the shipper countered with —
     * only settles the negotiation (no money moves yet). The shipper still
     * has to press their own "accept & assign" (acceptOffer below), which is
     * what actually reserves funds and creates the trip. Money only ever
     * moves through an explicit shipper action, same as mobile.
     */
    agreeToPrice: async (offerId) => {
        await delay(300);
        const offer = mockOffers.find(o => o.id === offerId);
        if (!offer) throw new Error('العرض غير موجود');
        offer.status = OfferStatus.ACCEPTED;
        return { ...offer };
    },
    /**
     * Accepts an offer, finalizes the price, and assigns the carrier — the
     * agreed price is reserved (held, not spent) on the shipper's wallet
     * first. Throws if the shipper's available balance can't cover it, same
     * as mobile's `AcceptOfferOutcome.insufficientBalance`, so nothing about
     * the offer/shipment/trip changes when refused.
     */
    acceptOffer: async (offerId, finalPrice) => {
        await delay();
        const offer = mockOffers.find(o => o.id === offerId);
        if (!offer) throw new Error('العرض غير موجود');

        const shipment = mockShipments.find(s => s.id === offer.shipmentId);
        const shipperId = shipment ? shipment.shipperId : 'user-shipper-1';
        const shipperWallet = findOrCreateWallet(shipperId);
        if (availableBalance(shipperWallet) < finalPrice) {
            throw new Error(
                `الرصيد المتاح غير كافٍ لتأكيد هذا السعر (${finalPrice} ر.س). ` +
                `الرصيد المتاح الحالي: ${availableBalance(shipperWallet)} ر.س`
            );
        }
        shipperWallet.reservedBalance += finalPrice;

        // Accept this offer, reject others
        mockOffers.forEach(o => {
            if (o.shipmentId === offer.shipmentId) {
                o.status = o.id === offerId ? OfferStatus.ACCEPTED : OfferStatus.REJECTED;
            }
        });

        // Update shipment
        if (shipment) {
            shipment.status = ShipmentStatus.ACTIVE;
            shipment.finalPrice = finalPrice;
            shipment.assignedCarrierId = offer.carrierId;
        }

        // Create new trip
        const newTrip = {
            id: `TR-${Math.floor(1000 + Math.random() * 9000)}`,
            shipmentId: offer.shipmentId,
            carrierId: offer.carrierId,
            shipperId,
            currentStage: TripStage.ASSIGNED,
            finalPrice: finalPrice,
            startedAt: new Date().toISOString(),
            route: shipment ? `${shipment.pickupCity} -> ${shipment.deliveryCity}` : 'غير محدد',
            carrierName: offer.carrierName,
            messages: [],
        };
        mockTrips.unshift(newTrip);

        return newTrip;
    }
});
export const tripService = withAutoPersist({
    getTrips: async () => {
        await delay();
        return [...mockTrips];
    },
    getTripById: async (id) => {
        await delay();
        const trip = mockTrips.find(t => t.id === id);
        if (!trip)
            throw new Error('الرحلة غير موجودة');
        return { ...trip };
    },
    updateTripStage: async (id, stage, proof) => {
        await delay();
        const trip = mockTrips.find(t => t.id === id);
        if (trip) {
            trip.currentStage = stage;
            if (!trip.stages) trip.stages = [];
            trip.stages.push({
                stage: stage,
                timestamp: new Date().toISOString(),
                proof: proof || undefined, // { photoDataUrl, lat, lng, capturedAt } — see ProofPhotoCapture
            });
            if (stage === TripStage.DELIVERED) {
                tripService.settleDelivery(id);
            }
        }
        return trip ? { ...trip } : null;
    },
    /**
     * Commission split at delivery: the shipper's held reservation is
     * released and debited in full, the carrier is credited price minus
     * COMMISSION_RATE. Idempotent per trip — settling twice is a no-op.
     */
    settleDelivery: (tripId) => {
        const trip = mockTrips.find(t => t.id === tripId);
        if (!trip || trip.settled) return;
        trip.settled = true;

        const commission = Math.round(trip.finalPrice * COMMISSION_RATE);
        const carrierNet = trip.finalPrice - commission;

        const shipperWallet = findOrCreateWallet(trip.shipperId);
        shipperWallet.reservedBalance = Math.max(0, shipperWallet.reservedBalance - trip.finalPrice);
        shipperWallet.balance -= trip.finalPrice;
        logTransaction(trip.shipperId, TransactionType.FEE_DEDUCTION, -trip.finalPrice, `تسوية رحلة ${trip.id} — دفعة للناقل`);

        const carrierWallet = findOrCreateWallet(trip.carrierId);
        carrierWallet.balance += carrierNet;
        logTransaction(trip.carrierId, TransactionType.TRIP_SETTLEMENT, carrierNet, `تسوية رحلة ${trip.id} (بعد خصم عمولة المنصة ${Math.round(COMMISSION_RATE * 100)}%)`);
    },
    /** Trip stages the cancellation policy still allows a cancel from — blocked from LOADED onward. */
    cancellableStages: [TripStage.ASSIGNED, TripStage.EN_ROUTE_PICKUP, TripStage.ARRIVED_PICKUP],
    /**
     * Cancels an in-progress trip and applies the same commission /
     * blacklist rules as mobile:
     *  - Before assignment there's no trip yet, so this only ever runs on an
     *    assigned/in-progress trip — cancellation there always charges
     *    commission to whoever cancelled.
     *  - Shipper cancels: shipper pays the commission, carrier gets nothing,
     *    shipment is closed (not re-listed).
     *  - Carrier cancels: shipper is refunded in full (reservation released,
     *    nothing debited), carrier pays the commission (balance may go
     *    negative — that's the "debt" mobile carries into the next
     *    settlement), and a cancellation warning is recorded — the carrier
     *    is blacklisted at CANCELLATION_WARNING_THRESHOLD. The shipment goes
     *    back on the marketplace for another carrier to pick up.
     * Throws if `stage` is at/after LOADED — callers should already disable
     * the action there, this is the safety net.
     */
    cancelTrip: async (tripId, cancelledBy) => {
        await delay(400);
        const trip = mockTrips.find(t => t.id === tripId);
        if (!trip) throw new Error('الرحلة غير موجودة');
        if (!tripService.cancellableStages.includes(trip.currentStage)) {
            throw new Error('لا يمكن إلغاء الرحلة بعد بدء التحميل — يرجى التواصل مع دعم المنصة.');
        }

        const commission = Math.round(trip.finalPrice * COMMISSION_RATE);
        const shipperWallet = findOrCreateWallet(trip.shipperId);
        shipperWallet.reservedBalance = Math.max(0, shipperWallet.reservedBalance - trip.finalPrice);

        const shipment = mockShipments.find(s => s.id === trip.shipmentId);

        if (cancelledBy === 'SHIPPER') {
            shipperWallet.balance -= commission;
            logTransaction(trip.shipperId, TransactionType.COMMISSION_DEDUCTION, -commission, `عمولة إلغاء الرحلة ${trip.id}`);
            if (shipment) shipment.status = ShipmentStatus.CANCELLED;
        } else {
            const carrierWallet = findOrCreateWallet(trip.carrierId);
            carrierWallet.balance -= commission;
            logTransaction(trip.carrierId, TransactionType.COMMISSION_DEDUCTION, -commission, `عمولة إلغاء الرحلة ${trip.id}`);

            const carrier = mockUsers.find(u => u.id === trip.carrierId);
            if (carrier) {
                carrier.warningCount = (carrier.warningCount || 0) + 1;
                if (carrier.warningCount >= CANCELLATION_WARNING_THRESHOLD) carrier.isBlacklisted = true;
            }
            // Reopens the shipment for other carriers, same as mobile's returnToMarketplace.
            if (shipment) {
                shipment.status = ShipmentStatus.OFFERS_PENDING;
                shipment.assignedCarrierId = null;
                shipment.finalPrice = null;
            }
        }

        trip.overallStatus = 'CANCELLED';
        trip.cancellation = { cancelledBy, commission, at: new Date().toISOString() };
        return { ...trip };
    },
    /** Appends one closed-set quick message to a trip's shared timeline. */
    sendQuickMessage: async (tripId, senderRole, messageKey, label) => {
        await delay(200);
        const trip = mockTrips.find(t => t.id === tripId);
        if (!trip) throw new Error('الرحلة غير موجودة');
        if (!trip.messages) trip.messages = [];
        const message = { id: `msg-${Date.now()}`, senderRole, messageKey, label, timestamp: new Date().toISOString() };
        trip.messages.push(message);
        return message;
    }
});
export const walletService = withAutoPersist({
    getWallet: async () => {
        await delay();
        const user = await authService.getCurrentUser();
        if (!user) throw new Error('Unauthorized');
        const wallet = findOrCreateWallet(user.id);
        // `available` (spendable/withdrawable now) vs `balance` (total) —
        // the difference is whatever's held against in-progress shipments.
        return { ...wallet, available: availableBalance(wallet) };
    },
    getTransactions: async () => {
        await delay();
        const user = await authService.getCurrentUser();
        if (!user) throw new Error('Unauthorized');
        return mockTransactions.filter(t => t.walletId === user.id);
    },
    topUp: async (amount) => {
        await delay();
        const user = await authService.getCurrentUser();
        if (!user) throw new Error('Unauthorized');
        const wallet = findOrCreateWallet(user.id);
        wallet.balance += Number(amount);
        return logTransaction(user.id, TransactionType.TOP_UP, Number(amount), 'شحن رصيد إضافي');
    },
    /**
     * Requests a withdrawal: holds the amount immediately (against
     * *available*, not total, balance — funds reserved for a shipment can't
     * also be withdrawn) and settles it a moment later, simulating admin
     * processing. Matches mobile's hold → settle withdrawal flow.
     */
    withdraw: async (amount) => {
        await delay();
        const user = await authService.getCurrentUser();
        if (!user) throw new Error('Unauthorized');
        const wallet = findOrCreateWallet(user.id);

        const withdrawAmount = Number(amount);
        if (withdrawAmount <= 0) throw new Error('مبلغ السحب غير صحيح');
        if (withdrawAmount > availableBalance(wallet)) {
            throw new Error(`الرصيد المتاح غير كافٍ لإتمام عملية السحب (المتاح: ${availableBalance(wallet)} ر.س)`);
        }

        wallet.reservedBalance += withdrawAmount;
        const pendingTxn = logTransaction(user.id, TransactionType.WITHDRAWAL, -withdrawAmount, 'طلب سحب رصيد (قيد المعالجة)');

        setTimeout(() => {
            wallet.reservedBalance = Math.max(0, wallet.reservedBalance - withdrawAmount);
            wallet.balance -= withdrawAmount;
            pendingTxn.description = 'سحب رصيد';
            pendingTxn.balanceAfter = wallet.balance;
            persist();
        }, 3000);

        return pendingTxn;
    }
});
export const notificationService = withAutoPersist({
    getNotifications: async () => {
        await delay();
        return [...mockNotifications];
    },
    markAsRead: async (id) => {
        await delay(200);
        const notif = mockNotifications.find(n => n.id === id);
        if (notif) notif.isRead = true;
    },
    markAllAsRead: async () => {
        await delay(200);
        mockNotifications.forEach(n => n.isRead = true);
    }
});
export const userService = withAutoPersist({
    getUserById: async (id) => {
        await delay(200);
        const user = mockUsers.find(u => u.id === id);
        return user ? { ...user } : null;
    }
});
