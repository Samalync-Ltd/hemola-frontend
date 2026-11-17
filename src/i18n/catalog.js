import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { useLanguage, getLanguage } from './language';
import { translate } from '.';
import { TruckType } from '../constants/enums';

/**
 * Names of the admin-managed lists — cargo types (config/cargoTypes) and
 * truck types (config/truckTypes) — in the current language.
 *
 * The rule (team lead, 17 Nov): each entry has an English name set by the
 * admin. In English show it; when it is empty, show the Arabic name. An
 * admin rename applies to both languages.
 *
 * ENGLISH_NAME_FIELD is the field's name in Firestore. It is in this one
 * place on purpose: the backend owner confirms the final name, and a change
 * is this one line (and the same constant in the admin dashboard).
 */
export const ENGLISH_NAME_FIELD = 'nameEn';

// The Arabic names a truck type has before any admin rename: this site's own
// defaults, and the ones the backend seeds config/truckTypes with
// (hemooltak-backend functions/src/constants.ts TRUCK_TYPE_LABEL_AR).
const BACKEND_DEFAULT_TRUCK_AR = ['سطحة', 'شاحنة نقل ثقيل', 'شاحنة مبردة', 'شاحنة صندوق مغلق', 'صهريج', 'لوبد', 'أخرى'];
const builtInArabic = (code) => translate('ar', `enums.truckType.${code}`);
const DEFAULT_TRUCK_AR = new Set([...Object.values(TruckType).map(builtInArabic), ...BACKEND_DEFAULT_TRUCK_AR]);

let state = { cargoTypes: null, truckTypes: {}, loaded: false };
let pending = null;
const listeners = new Set();
const subscribe = (listener) => { listeners.add(listener); return () => listeners.delete(listener); };

/**
 * Reads both lists (signed-in users only — the rules refuse anyone else, and
 * then the built-in names are used). Read once per visit; `refresh` re-reads,
 * for the shipment form, where a type the admin just switched off matters.
 */
export const loadCatalog = ({ refresh = false } = {}) => {
    if (pending && !refresh) return pending;
    pending = import('../services/api')
        .then(({ catalogService }) => Promise.all([
            catalogService.getCargoTypes().catch(() => null),
            catalogService.getTruckTypeOverrides().catch(() => ({})),
        ]))
        .then(([cargoTypes, truckTypes]) => {
            state = { cargoTypes: cargoTypes || [], truckTypes: truckTypes || {}, loaded: true };
            listeners.forEach((listener) => listener());
            return state;
        })
        .catch(() => { pending = null; return state; });
    return pending;
};

const englishName = (entry) => (typeof entry?.[ENGLISH_NAME_FIELD] === 'string' ? entry[ENGLISH_NAME_FIELD].trim() : '');

/** A truck type's name. OTHER with the carrier's own description shows that description. */
export const truckTypeName = (code, customType, lang = getLanguage()) => {
    if (!code) return '—';
    if (code === 'OTHER' && customType) return customType;
    const entry = state.truckTypes?.[code] || {};
    const arabic = entry.label || (Object.values(TruckType).includes(code) ? builtInArabic(code) : code);
    if (lang === 'ar') return arabic;
    const english = englishName(entry);
    if (english) return english;
    // Not renamed by the admin: the built-in English name translates that
    // very Arabic name, so it is shown rather than Arabic in English mode.
    if (!entry.label || DEFAULT_TRUCK_AR.has(entry.label)) return translate('en', `enums.truckType.${code}`);
    return arabic;
};

/** Whether a truck type may be picked for a new shipment (a type missing from config counts as on). */
export const isTruckTypeActive = (code) => state.truckTypes?.[code]?.active !== false;

/** One entry of config/cargoTypes, in the current language. */
export const cargoItemName = (item, lang = getLanguage()) => {
    if (!item) return '—';
    return (lang === 'en' && englishName(item)) || item.name || item.id;
};

/**
 * A shipment's cargo type. New shipments keep the id in `cargoType` and the
 * Arabic name as it was when posted in `cargoTypeName`; older ones have the
 * Arabic name itself in `cargoType`.
 */
export const cargoTypeName = (shipment, lang = getLanguage()) => {
    if (!shipment) return '—';
    const item = state.cargoTypes?.find((entry) => entry.id === shipment.cargoType);
    const arabic = shipment.cargoTypeName || item?.name || shipment.cargoType || '—';
    if (lang === 'ar') return arabic;
    // The English name stored on the shipment when it was posted (backend:
    // cargoTypeNameEn), else the list's current one, else the Arabic.
    return (shipment.cargoTypeNameEn || '').trim() || englishName(item) || arabic;
};

/** The lists themselves, live: `{ cargoTypes, truckTypes, loaded }`. Loads them on first use. */
export const useCatalog = () => {
    useEffect(() => { loadCatalog(); }, []);
    return useSyncExternalStore(subscribe, () => state, () => state);
};

/** Name helpers bound to the current language; re-renders when the language or the lists change. */
export const useNames = () => {
    const lang = useLanguage();
    const catalog = useCatalog();
    return useMemo(() => ({
        truckName: (code, customType) => truckTypeName(code, customType, lang),
        cargoName: (shipment) => cargoTypeName(shipment, lang),
        cargoItemName: (item) => cargoItemName(item, lang),
    // `catalog` is listed so the names update once the lists arrive.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }), [lang, catalog]);
};
