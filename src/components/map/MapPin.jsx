import React from 'react';

// Colored teardrop pins rendered as AdvancedMarker content — gives us the
// pickup/delivery distinction we need (matches mobile's trip map: navy
// pickup pin, green delivery pin). The tip sits at the bottom-center of the
// element, which is where AdvancedMarker anchors by default.
export const MapPin = ({ color, glyph = '📍' }) => (
    <div style={{
        width: 30, height: 30, borderRadius: '50% 50% 50% 0',
        background: color, transform: 'translateY(-4px) rotate(-45deg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 2px 6px rgba(0,0,0,0.4)', border: '2px solid white',
    }}>
        <span style={{ transform: 'rotate(45deg)', fontSize: 14 }}>{glyph}</span>
    </div>
);

export const PickupPin = () => <MapPin color="#0F2440" glyph="📦" />; // navy — matches mobile's pickup pin
export const DeliveryPin = () => <MapPin color="#27AE60" glyph="🏁" />; // green — matches mobile's delivery pin
export const CarrierPin = () => <MapPin color="#FF7A29" glyph="🚚" />; // amber/orange — matches mobile's truck marker
