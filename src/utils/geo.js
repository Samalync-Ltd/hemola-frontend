// Mirrors `hemola/lib/core/utils/saudi_cities.dart` + `geo.dart` on mobile —
// same static city table and Haversine formula, so "nearest first" sorting
// works identically on both platforms without calling a routing API per
// shipment.

export const SAUDI_CITY_COORDINATES = {
    'الرياض': [24.7136, 46.6753],
    'جدة': [21.4858, 39.1925],
    'مكة المكرمة': [21.3891, 39.8579],
    'المدينة المنورة': [24.5247, 39.5692],
    'الدمام': [26.4207, 50.0888],
    'الخبر': [26.2172, 50.1971],
    'الطائف': [21.2703, 40.4158],
    'تبوك': [28.3998, 36.5715],
    'أبها': [18.2164, 42.5053],
    'حائل': [27.5114, 41.6900],
    'جازان': [16.8892, 42.5511],
    'نجران': [17.4924, 44.1277],
    'ينبع': [24.0895, 38.0618],
    'الأحساء': [25.3833, 49.5867],
    'بريدة': [26.3260, 43.9750],
    'خميس مشيط': [18.3000, 42.7333],
    'الجبيل': [27.0046, 49.6603],
    'القصيم': [26.3260, 43.9750],
};

/** Returns `[lat, lng]` for a known city, or `null` if unrecognized. */
export const lookupCityCoordinates = (city) => SAUDI_CITY_COORDINATES[(city || '').trim()] ?? null;

const toRad = (deg) => (deg * Math.PI) / 180;

/** Great-circle distance in km — sorting only, not routing. */
export const haversineKm = (lat1, lon1, lat2, lon2) => {
    const earthRadiusKm = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * Resolves the current position via the browser Geolocation API.
 * Never rejects — resolves to `null` on denial/unavailable/timeout so
 * callers can fall back to their default sort instead of erroring.
 */
export const getCurrentPositionSafe = () =>
    new Promise((resolve) => {
        if (!('geolocation' in navigator)) {
            resolve(null);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => resolve(null),
            { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
        );
    });
