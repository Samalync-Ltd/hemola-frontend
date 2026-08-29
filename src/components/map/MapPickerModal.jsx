import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Button } from '../common/Button';
import { createPinIcon } from '../../utils/mapIcons';
import { lookupCityCoordinates } from '../../utils/geo';

const pickIcon = createPinIcon('#E53E3E', '📍');

const ClickHandler = ({ onPick }) => {
    useMapEvents({ click: (e) => onPick([e.latlng.lat, e.latlng.lng]) });
    return null;
};

/**
 * Full-screen-ish map picker for pinning a precise pickup/delivery location.
 * Additive to the existing directions/contact text fields — this is stored
 * alongside them, not instead of them. Uses OpenStreetMap tiles (no API key),
 * matching mobile's flutter_map picker exactly.
 */
export const MapPickerModal = ({ isOpen, onClose, onConfirm, title, cityName, initialPoint }) => {
    const cityCenter = cityName ? lookupCityCoordinates(cityName) : null;
    const [point, setPoint] = useState(initialPoint || null);

    if (!isOpen) return null;

    const center = point || cityCenter || [24.7136, 46.6753]; // Riyadh fallback

    return createPortal(
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div style={{ width: '90vw', maxWidth: 700, height: '80vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--color-surface, #fff)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong>{title}</strong>
                    <Button variant="outline" size="sm" onClick={onClose}>إغلاق</Button>
                </div>
                <div style={{ flex: 1, position: 'relative' }}>
                    <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
                        <TileLayer
                            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                            attribution="© OpenStreetMap"
                        />
                        <ClickHandler onPick={setPoint} />
                        {point && <Marker position={point} icon={pickIcon} />}
                    </MapContainer>
                    <div style={{
                        position: 'absolute', top: 10, left: 10, right: 10, zIndex: 1000,
                        backgroundColor: 'white', borderRadius: 8, padding: '8px 12px',
                        textAlign: 'center', fontSize: 13, boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    }}>
                        {point ? 'تم تحديد الموقع — اضغط تأكيد للحفظ' : 'اضغط على الخريطة لتحديد الموقع بدقة'}
                    </div>
                </div>
                <div style={{ padding: 16, borderTop: '1px solid var(--color-border)' }}>
                    <Button
                        style={{ width: '100%' }}
                        disabled={!point}
                        onClick={() => { onConfirm(point); onClose(); }}
                    >
                        تأكيد الموقع
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
};
