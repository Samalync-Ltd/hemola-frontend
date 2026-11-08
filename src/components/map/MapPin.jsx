import React from 'react';

// Colored teardrop pins rendered as AdvancedMarker content — gives us the
// pickup/delivery distinction we need (matches mobile's trip map: navy
// pickup pin, green delivery pin). The tip sits at the bottom-center of the
// element, which is where AdvancedMarker anchors by default.
//
// `emphasis`: 'focus' (the carrier's current destination — larger, with an
// orange ring), 'muted' (the other point — still visible, faded) or none.
export const MapPin = ({ color, glyph = '📍', emphasis }) => {
    const isFocus = emphasis === 'focus';
    const size = isFocus ? 40 : 30;
    return (
        <div style={{
            width: size, height: size, borderRadius: '50% 50% 50% 0',
            background: color, transform: 'translateY(-4px) rotate(-45deg)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: isFocus ? '0 0 0 4px rgba(255,122,41,0.55), 0 2px 8px rgba(0,0,0,0.45)' : '0 2px 6px rgba(0,0,0,0.4)',
            border: '2px solid white',
            opacity: emphasis === 'muted' ? 0.45 : 1,
        }}>
            <span style={{ transform: 'rotate(45deg)', fontSize: isFocus ? 18 : 14 }}>{glyph}</span>
        </div>
    );
};

export const PickupPin = ({ emphasis }) => <MapPin color="#0F2440" glyph="📦" emphasis={emphasis} />; // navy — matches mobile's pickup pin
export const DeliveryPin = ({ emphasis }) => <MapPin color="#27AE60" glyph="🏁" emphasis={emphasis} />; // green — matches mobile's delivery pin
export const CarrierPin = () => <MapPin color="#FF7A29" glyph="🚚" />; // amber/orange — matches mobile's truck marker
