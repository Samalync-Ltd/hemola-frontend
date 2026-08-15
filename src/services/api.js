import { mockShipments, mockOffers, mockTrips, mockWallet, mockTransactions, mockNotifications, mockUsers } from '../mocks/data';
import { ShipmentStatus, OfferStatus, TripStage } from '../constants/enums';
// Helper to simulate network delay
const delay = (ms = 800) => new Promise(resolve => setTimeout(resolve, ms));
export const authService = {
    login: async (email, password) => {
        await delay();
        let user = mockUsers.find(u => u.email === email);
        if (!user) {
            // Mock behavior: Just return the first shipper user if email is not found
            user = mockUsers[0]; 
        }
        localStorage.setItem('demo_role', user.role);
        return user;
    },
    getCurrentUser: async () => {
        await delay(300);
        const role = localStorage.getItem('demo_role') || 'SHIPPER';
        return role === 'CARRIER' ? mockUsers[1] : mockUsers[0];
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
        return { ...mockWallet };
    },
    getTransactions: async () => {
        await delay();
        return [...mockTransactions];
    },
    topUp: async (amount) => {
        await delay();
        mockWallet.balance += Number(amount);
        const newTransaction = {
            id: `txn-${Math.floor(Math.random() * 10000)}`,
            walletId: mockWallet.userId,
            type: TransactionType.TOP_UP,
            amount: Number(amount),
            description: 'شحن رصيد إضافي',
            timestamp: new Date().toISOString(),
            balanceAfter: mockWallet.balance
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
