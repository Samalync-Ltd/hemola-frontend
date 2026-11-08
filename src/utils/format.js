import { TruckTypeAr } from '../constants/enums';

export const formatPrice = (amount) => {
    return new Intl.NumberFormat('ar-SA').format(amount) + ' ر.س';
};
export const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }).format(date);
};
export const formatTime = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-SA', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
    }).format(date);
};

/** 1800 -> "1,800" — the amount style used in every money message (up to 2 decimals). */
export const formatAmount = (amount) =>
    Number(amount || 0).toLocaleString('en-US', { maximumFractionDigits: 2 });

/** A truck's type in Arabic everywhere — the free-text name for OTHER, never the raw enum code. */
export const truckTypeLabel = (type, customType, labels = TruckTypeAr) => {
    if (!type) return '—';
    if (type === 'OTHER' && customType) return customType;
    return labels[type] || TruckTypeAr[type] || type;
};

/**
 * One way to show a carrier's rating everywhere (offers list, negotiation,
 * trip page). The backend stores the average with full precision and starts
 * everyone at 0 — "جديد" reads better than a zero-star carrier.
 */
export const formatRating = (rating, completedTrips = null) => {
    const value = Number(rating || 0);
    if (value === 0 && !completedTrips) return 'جديد';
    return `${Number(value.toFixed(1))}`;
};
