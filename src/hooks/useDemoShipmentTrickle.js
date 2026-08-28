import { useEffect } from 'react';
import { shipmentService } from '../services/api';
import { demoCarrierFeedShipments } from '../mocks/demoPool';

const CAP = 3 + Math.floor(Math.random() * 2); // 3 or 4, per spec.

/**
 * Simulates other shippers posting while a carrier browses an otherwise-
 * empty marketplace: one shipment after ~10s, then more every 20-30s up to
 * a small cap, then it stops. Each injected shipment is a real record in
 * the mock store (see shipmentService.injectDemoShipment), not just local
 * component state, so it's still there — clickable, offerable, and visible
 * again after navigating away and back or refreshing — no matter which
 * screen (CarrierShipments, CarrierDashboard, ...) is mounted when it lands.
 *
 * `truckType` (the viewing carrier's registered truck type) overrides each
 * injected shipment's `requiredTruckType` at creation time — every screen
 * that lists shipments filters by truck-type match, so without this a demo
 * shipment could show up once (appended straight to local state, bypassing
 * the filter) and then vanish the moment any screen re-fetches and
 * re-filters, which looks exactly like a bug.
 *
 * `enabled` should be true only when the real list came back empty.
 */
export const useDemoShipmentTrickle = (enabled, truckType, onInject) => {
    useEffect(() => {
        if (!enabled) return;
        let cancelled = false;
        let addedCount = 0;
        let timer;

        const scheduleNext = (delayMs) => {
            timer = setTimeout(async () => {
                if (cancelled || addedCount >= CAP || addedCount >= demoCarrierFeedShipments.length) return;
                const next = demoCarrierFeedShipments[addedCount];
                addedCount += 1;
                const injected = await shipmentService.injectDemoShipment({
                    ...next,
                    ...(truckType ? { requiredTruckType: truckType } : {}),
                });
                if (cancelled) return;
                onInject(injected);
                if (addedCount < CAP) scheduleNext(20000 + Math.random() * 10000); // 20-30s
            }, delayMs);
        };

        scheduleNext(10000);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled]);
};
