import L from 'leaflet';

// Leaflet's default marker images don't resolve correctly through Vite's
// bundler — rather than patching that up, colored div-icons give us the
// pickup/delivery distinction we need anyway (matches mobile's OsmTripMap:
// navy pickup pin, green delivery pin).
export const createPinIcon = (color, glyph = '📍') => L.divIcon({
    className: 'hemola-map-pin',
    html: `<div style="
        width: 30px; height: 30px; border-radius: 50% 50% 50% 0;
        background: ${color}; transform: rotate(-45deg);
        display: flex; align-items: center; justify-content: center;
        box-shadow: 0 2px 6px rgba(0,0,0,0.4); border: 2px solid white;
    "><span style="transform: rotate(45deg); font-size: 14px;">${glyph}</span></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
});

export const pickupIcon = createPinIcon('#0F2440', '📦'); // navy — matches mobile's pickup pin
export const deliveryIcon = createPinIcon('#27AE60', '🏁'); // green — matches mobile's delivery pin
export const carrierIcon = createPinIcon('#FF7A29', '🚚'); // amber/orange — matches mobile's truck marker
