import { DocumentStatus } from '../constants/enums';

/**
 * Canonical shape of one truck in a carrier's `trucks` collection — a
 * carrier can have many of these. Each truck owns its own document pair
 * (operatingCard, registration) independently of every other truck.
 */
export const createTruck = ({
    id,
    brand = '',
    model = '',
    type = '',
    capacityTons = 0,
    plateNumber = '',
    operatingCard = {},
    registration = {},
} = {}) => ({
    id: id || `truck-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
    brand,
    model,
    type,
    capacityTons: Number(capacityTons) || 0,
    plateNumber,
    operatingCard: {
        fileUrl: operatingCard.fileUrl || '',
        status: operatingCard.status || DocumentStatus.PENDING,
        expiryDate: operatingCard.expiryDate || '',
    },
    registration: {
        fileUrl: registration.fileUrl || '',
        status: registration.status || DocumentStatus.PENDING,
    },
});
