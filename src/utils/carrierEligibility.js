// One source of truth for "what may this carrier see and offer on", shared
// by the carrier home page, the shipments list and the shipment page so the
// three never disagree.
//
// The account checks mirror hemooltak-backend/functions/src/guards.ts
// (assertCarrierCanTakeWork) and the truck checks mirror negotiation.ts
// (assertTruckUsable), in the same order — so the reason shown here is the
// reason submitOffer would give. submitOffer and acceptOffer both verify
// truck capacity (TRUCK_CAPACITY_TOO_LOW) against shipment weight.

import { ShipmentStatus } from '../constants/enums';
import { t } from '../i18n';
import { truckTypeName } from '../i18n/catalog';

const OPEN_STATUSES = [ShipmentStatus.PENDING_OFFERS, ShipmentStatus.NEGOTIATING];

/** Right type for the shipment and big enough for its weight (tons). */
export const truckCanCarry = (truck, shipment) =>
    Boolean(
        truck &&
        shipment &&
        truck.type === shipment.requiredTruckType &&
        truck.capacityTons != null &&
        truck.capacityTons !== '' &&
        Number.isFinite(Number(truck.capacityTons)) &&
        Number(truck.capacityTons) > 0 &&
        Number(truck.capacityTons) >= Number(shipment.weight || 0)
    );

/** Both papers approved — what the backend checks, not the isSelectable mirror. */
export const isTruckApproved = (truck) =>
    truck.operatingCard?.status === 'APPROVED' && truck.registration?.status === 'APPROVED';

/**
 * Listed for this carrier: open to offers, and at least one of their trucks
 * matches the type and can carry the weight. A matching truck still under
 * review keeps the shipment visible (with the reason it can't be offered on
 * yet) — hiding it would leave the carrier wondering why the market is empty.
 */
export const isShipmentForCarrier = (shipment, carrier) =>
    OPEN_STATUSES.includes(shipment.status)
    && (carrier?.trucks || []).some(t => truckCanCarry(t, shipment));

/**
 * Why this carrier can't take any new work right now, or null. Account-level
 * only — it applies to every shipment alike, so pages show it once.
 */
export const carrierBlockReason = (carrier) => {
    if (!carrier) return null;
    if (carrier.accountStatus !== 'VERIFIED') return t('shipments.carrier.block.notVerified');
    if (carrier.isSuspended) return t('shipments.carrier.block.suspended');
    if (carrier.isBusy) return t('shipments.carrier.block.busy');
    if ((carrier.outstandingDebt ?? 0) > 0) {
        return t('shipments.carrier.block.debt', { amount: carrier.outstandingDebt });
    }
    return null;
};

/** Trucks this carrier may offer on this shipment with. */
export const usableTrucksFor = (carrier, shipment) =>
    (carrier?.trucks || []).filter(t => truckCanCarry(t, shipment) && isTruckApproved(t));

/** Why this carrier can't offer on this shipment, or null if they can. */
export const offerBlockReason = (carrier, shipment) => {
    const accountReason = carrierBlockReason(carrier);
    if (accountReason) return accountReason;
    if (!OPEN_STATUSES.includes(shipment.status)) return t('shipments.carrier.offerBlock.closed');

    const typeLabel = truckTypeName(shipment.requiredTruckType);
    const matching = (carrier.trucks || []).filter(t => truckCanCarry(t, shipment));
    if (matching.length === 0) {
        const sameType = (carrier.trucks || []).some(t => t.type === shipment.requiredTruckType);
        return sameType
            ? t('shipments.carrier.offerBlock.tooSmall', { type: typeLabel, weight: shipment.weight })
            : t('shipments.carrier.offerBlock.wrongType', { type: typeLabel });
    }
    if (!matching.some(isTruckApproved)) {
        const rejected = matching.some(t => t.operatingCard?.status === 'REJECTED' || t.registration?.status === 'REJECTED');
        return rejected
            ? t('shipments.carrier.offerBlock.docRejected')
            : t('shipments.carrier.offerBlock.docsInReview');
    }
    return null;
};
