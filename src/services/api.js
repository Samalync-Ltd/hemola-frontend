import { mockShipments, mockOffers, mockTrips, mockWallets, mockTransactions, mockNotifications, mockUsers } from '../mocks/data';
import { ShipmentStatus, OfferStatus, TripStage, TransactionType } from '../constants/enums';
// Helper to simulate network delay
const delay = (ms = 800) => new Promise(resolve => setTimeout(resolve, ms));
export const authService = {
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
};
export const shipmentService = {
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
    }
};
export const offerService = {
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
            carrierTruckType: data.truckType
        };
        mockOffers.push(newOffer);
        return newOffer;
    },
    acceptOffer: async (offerId, finalPrice) => {
        await delay();
        const offer = mockOffers.find(o => o.id === offerId);
        if (!offer) throw new Error('العرض غير موجود');

        // Accept this offer, reject others
        mockOffers.forEach(o => {
            if (o.shipmentId === offer.shipmentId) {
                o.status = o.id === offerId ? OfferStatus.ACCEPTED : OfferStatus.REJECTED;
            }
        });

        // Update shipment
        const shipment = mockShipments.find(s => s.id === offer.shipmentId);
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
            shipperId: shipment ? shipment.shipperId : 'user-shipper-1',
            currentStage: TripStage.ASSIGNED,
            finalPrice: finalPrice,
            startedAt: new Date().toISOString(),
            route: shipment ? `${shipment.pickupCity} -> ${shipment.deliveryCity}` : 'غير محدد',
            carrierName: offer.carrierName
        };
        mockTrips.unshift(newTrip);

        return newTrip;
    }
};
export const tripService = {
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
    updateTripStage: async (id, stage) => {
        await delay();
        const trip = mockTrips.find(t => t.id === id);
        if (trip) {
            trip.currentStage = stage;
            if (!trip.stages) trip.stages = [];
            trip.stages.push({
                stage: stage,
                timestamp: new Date().toISOString()
            });
        }
    }
};
export const walletService = {
    getWallet: async () => {
        await delay();
        const user = await authService.getCurrentUser();
        if (!user) throw new Error('Unauthorized');
        let wallet = mockWallets.find(w => w.userId === user.id);
        if (!wallet) {
            wallet = { userId: user.id, balance: 0, reservedBalance: 0 };
            mockWallets.push(wallet);
        }
        return { ...wallet };
    },
    getTransactions: async () => {
        await delay();
        const user = await authService.getCurrentUser();
        if (!user) throw new Error('Unauthorized');
        const userWallet = mockWallets.find(w => w.userId === user.id);
        if (!userWallet) return [];
        return mockTransactions.filter(t => t.walletId === userWallet.userId);
    },
    topUp: async (amount) => {
        await delay();
        const user = await authService.getCurrentUser();
        if (!user) throw new Error('Unauthorized');
        let wallet = mockWallets.find(w => w.userId === user.id);
        if (!wallet) {
            wallet = { userId: user.id, balance: 0, reservedBalance: 0 };
            mockWallets.push(wallet);
        }
        wallet.balance += Number(amount);
        const newTransaction = {
            id: `txn-${Math.floor(Math.random() * 10000)}`,
            walletId: wallet.userId,
            type: TransactionType.TOP_UP,
            amount: Number(amount),
            description: 'شحن رصيد إضافي',
            timestamp: new Date().toISOString(),
            balanceAfter: wallet.balance
        };
        mockTransactions.unshift(newTransaction);
        return newTransaction;
    },
    withdraw: async (amount) => {
        await delay();
        const user = await authService.getCurrentUser();
        if (!user) throw new Error('Unauthorized');
        let wallet = mockWallets.find(w => w.userId === user.id);
        if (!wallet) throw new Error('المحفظة غير موجودة');
        
        const withdrawAmount = Number(amount);
        if (withdrawAmount <= 0) throw new Error('مبلغ السحب غير صحيح');
        if (withdrawAmount > wallet.balance) throw new Error('الرصيد غير كافٍ لإتمام عملية السحب');

        wallet.balance -= withdrawAmount;
        const newTransaction = {
            id: `txn-${Math.floor(Math.random() * 10000)}`,
            walletId: wallet.userId,
            type: 'WITHDRAWAL',
            amount: -withdrawAmount,
            description: 'سحب رصيد',
            timestamp: new Date().toISOString(),
            balanceAfter: wallet.balance
        };
        mockTransactions.unshift(newTransaction);
        return newTransaction;
    }
};
export const notificationService = {
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
};
export const userService = {
    getUserById: async (id) => {
        await delay(200);
        const user = mockUsers.find(u => u.id === id);
        return user ? { ...user } : null;
    }
};
