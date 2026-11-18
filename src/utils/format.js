import { getLanguage } from '../i18n/language';
import { t } from '../i18n';
import { truckTypeName } from '../i18n/catalog';

// Arabic keeps exactly the formats the platform has always used (ar-SA);
// English uses day-month-year, the usual order in Saudi Arabia.
const DATE_LOCALE = { ar: 'ar-SA', en: 'en-GB' };
const TIME_LOCALE = { ar: 'ar-SA', en: 'en-US' };

const toDate = (value) => (value instanceof Date ? value : new Date(value));

/** 1800 -> «١٬٨٠٠ ر.س» / "1,800 SAR". */
export const formatPrice = (amount) => {
    const lang = getLanguage();
    const number = new Intl.NumberFormat(lang === 'ar' ? 'ar-SA' : 'en-US').format(amount);
    return t('common.money', { amount: number });
};

export const formatDate = (dateString) => new Intl.DateTimeFormat(DATE_LOCALE[getLanguage()], {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
}).format(toDate(dateString));

export const formatTime = (dateString) => new Intl.DateTimeFormat(TIME_LOCALE[getLanguage()], {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
}).format(toDate(dateString));

/** Date and time together — what every "when" column and timeline shows. */
export const formatDateTime = (value) => {
    if (!value) return '—';
    const lang = getLanguage();
    if (lang === 'ar') return toDate(value).toLocaleString('ar-SA');
    return toDate(value).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
};

/** A clock time only (quick messages, the truck's last position). */
export const formatClock = (value, { seconds = true } = {}) => {
    if (!value) return '';
    const options = seconds ? undefined : { hour: 'numeric', minute: '2-digit' };
    return toDate(value).toLocaleTimeString(TIME_LOCALE[getLanguage()], options);
};

/** 1800 -> "1,800" — the amount style used in every money message (up to 2 decimals). */
export const formatAmount = (amount) =>
    Number(amount || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

/**
 * An amount inside a text: English always "1,200" (as in the mobile app:
 * "1,200 SAR"); Arabic exactly as that screen has always shown it.
 */
export const displayAmount = (amount) => (getLanguage() === 'ar' ? amount : formatAmount(amount));

/** 1800 -> «1,800 ر.س» / "1,800 SAR" — formatAmount with the currency. */
export const formatMoney = (amount) => t('common.money', { amount: formatAmount(amount) });

/** 12 -> «12 طن» / "12 t". */
export const formatWeight = (tons) => t('common.tons', { value: tons ?? '—' });

/**
 * "Riyadh → Jeddah". `style` keeps each screen's Arabic exactly as it was:
 * 'arrow' «الرياض -> جدة», 'arrowLeft' «الرياض ← جدة», 'to' «الرياض إلى جدة».
 */
export const formatRoute = (from, to, style = 'arrow') => {
    if (!from && !to) return '—';
    const key = { arrow: 'shipments.routeArrow', arrowLeft: 'shipments.routeArrowLeft', to: 'shipments.routeTo' }[style];
    return t(key, { from: from || '—', to: to || '—' });
};

/**
 * «منذ 3 دقائق» / "3 minutes ago" — Arabic counts take different words for
 * 1, 2, 3–10 and 11+, exactly as the trip page has always shown them.
 */
export const minutesAgo = (minutes) => {
    if (minutes < 1) return t('trips.ago.now');
    if (minutes === 1) return t('trips.ago.one');
    if (minutes === 2) return t('trips.ago.two');
    return t(minutes <= 10 ? 'trips.ago.few' : 'trips.ago.many', { count: minutes });
};

/** A truck's type in the current language — the carrier's own text for OTHER, never the raw code. */
export const truckTypeLabel = (type, customType) => truckTypeName(type, customType);

/**
 * One way to show a carrier's rating everywhere (offers list, negotiation,
 * trip page). The backend stores the average with full precision and starts
 * everyone at 0 — "New" reads better than a zero-star carrier.
 */
export const formatRating = (rating, completedTrips = null) => {
    const value = Number(rating || 0);
    if (value === 0 && !completedTrips) return t('common.newCarrier');
    return `${Number(value.toFixed(1))}`;
};
