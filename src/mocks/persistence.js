// The mock "database" (mocks/data.js) is just plain in-memory JS arrays —
// there's no backend, so anything created during a session (a new
// registration, a posted shipment, a submitted offer) only ever lived in
// that module's memory. A hard page reload (typing a URL, hitting refresh,
// or navigating with `window.location` instead of the router) re-executes
// every module from scratch and silently discards all of it, falling back
// to the original seed data — which is very easy to mistake for "demo mode
// is broken" when it's actually a page reload wiping the demo's own state.
//
// This persists that same in-memory store to localStorage after every
// mutation and rehydrates it on load, so the mock backend survives a
// refresh the same way a real backend would.

const STORAGE_KEY = 'hemola_mock_store_v1';

/**
 * Restores previously-persisted arrays in place (never reassigns — every
 * other module imported these by reference via `export const`, so the
 * array identity must stay the same; only its contents get replaced).
 */
export const hydrateMockStore = (arrays) => {
    let saved;
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return;
        saved = JSON.parse(raw);
    } catch {
        return; // Corrupt/unavailable storage — just keep the fresh seed data.
    }
    for (const [name, arr] of Object.entries(arrays)) {
        if (Array.isArray(saved?.[name])) {
            arr.length = 0;
            arr.push(...saved[name]);
        }
    }
};

/** Snapshots the current in-memory arrays to localStorage. */
export const persistMockStore = (arrays) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(arrays));
    } catch {
        // Storage full/unavailable (private browsing, quota) — the session
        // still works in memory, it just won't survive a refresh.
    }
};
