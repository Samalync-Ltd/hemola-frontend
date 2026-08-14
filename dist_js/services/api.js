import { mockShipments, mockOffers, mockTrips, mockWallet, mockTransactions, mockNotifications, mockUsers } from '../mocks/data';
import { ShipmentStatus } from '../constants/enums';
// Helper to simulate network delay
const delay = (ms = 800) => new Promise(resolve => setTimeout(resolve, ms));
export const authService = {
    login: async (email, password) => {
        await delay();
        const user = mockUsers.find(u => u.email === email);
        if (!user)
            throw new Error('بيانات الدخول غير صحيحة');
        return user;
    },
    getCurrentUser: async () => {
        await delay(300);
        return mockUsers[0]; // Default to first shipper
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
    acceptOffer: async (offerId) => {
        await delay();
        // Simulate accepting offer, assigning trip, etc.
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
    }
};
export const notificationService = {
    getNotifications: async () => {
        await delay();
        return [...mockNotifications];
    }
};
