// Google Maps JS API settings — see .env.example. The key is restricted by
// HTTP referrer in Google Cloud, so it is safe to ship in the bundle.
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// AdvancedMarker only renders on a map that has a Map ID. DEMO_MAP_ID is
// Google's built-in one for development; set a real Map ID for production.
export const GOOGLE_MAPS_MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';

/** [lat, lng] (how coordinates are stored app-wide) → Google's {lat, lng}. */
export const toLatLng = ([lat, lng]) => ({ lat, lng });
