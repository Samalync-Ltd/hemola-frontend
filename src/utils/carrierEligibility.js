// One source of truth for "what may this carrier see and offer on", shared
// by the carrier home page, the shipments list and the shipment page so the
// three never disagree.
//
// The account checks mirror hemooltak-backend/functions/src/guards.ts
// (assertCarrierCanTakeWork) and the truck checks mirror negotiation.ts
// (assertTruckUsable), in the same order — so the reason shown here is the
// reason submitOffer would give. submitOffer and acceptOffer both verify
// truck capacity (TRUCK_CAPACITY_TOO_LOW) against shipment weight.

import { ShipmentStatus, TruckTypeAr } from '../constants/enums';

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
    if (carrier.accountStatus !== 'VERIFIED') return 'حسابك لم يُوثّق بعد — تتم مراجعة مستنداتك من قبل الإدارة.';
    if (carrier.isSuspended) return 'حسابك موقوف حالياً بسبب تكرار الإلغاء — تواصل مع الدعم لرفع الإيقاف.';
    if (carrier.isBusy) return 'لديك رحلة نشطة — أكملها أولاً قبل تقديم عروض جديدة.';
    if ((carrier.outstandingDebt ?? 0) > 0) {
        return `عليك مبلغ مستحق للمنصة (${carrier.outstandingDebt} ر.س) — اشحن محفظتك لسداده قبل تقديم عروض جديدة.`;
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
    if (!OPEN_STATUSES.includes(shipment.status)) return 'هذه الشحنة لم تعد متاحة لتقديم العروض.';

    const typeLabel = TruckTypeAr[shipment.requiredTruckType] || shipment.requiredTruckType;
    const matching = (carrier.trucks || []).filter(t => truckCanCarry(t, shipment));
    if (matching.length === 0) {
        const sameType = (carrier.trucks || []).some(t => t.type === shipment.requiredTruckType);
        return sameType
            ? `حمولة شاحنتك من نوع ${typeLabel} أقل من وزن هذه الشحنة (${shipment.weight} طن).`
            : `هذه الشحنة تتطلب شاحنة من نوع ${typeLabel} — لا تملك شاحنة من هذا النوع.`;
    }
    if (!matching.some(isTruckApproved)) {
        const rejected = matching.some(t => t.operatingCard?.status === 'REJECTED' || t.registration?.status === 'REJECTED');
        return rejected
            ? 'أحد مستندات شاحنتك مرفوض — أعد رفعه من صفحة الحساب لتتمكن من تقديم العروض.'
            : 'مستندات شاحنتك قيد المراجعة — يمكنك تقديم العروض بعد اعتماد بطاقة التشغيل والاستمارة.';
    }
    return null;
};
