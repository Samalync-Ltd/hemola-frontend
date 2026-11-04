import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Map, AdvancedMarker, useMapsLibrary } from '@vis.gl/react-google-maps';
import { Button } from '../common/Button';
import { MapPin } from './MapPin';
import { GOOGLE_MAPS_MAP_ID, toLatLng } from './googleMaps';
import { lookupCityCoordinates } from '../../utils/geo';

// Most specific "city" Google gives for a point: the town itself, else the
// governorate, else the region (rural pins often have no locality).
const CITY_COMPONENT_TYPES = ['locality', 'administrative_area_level_2', 'administrative_area_level_1'];

const cityFromGeocode = (results = []) => {
    for (const type of CITY_COMPONENT_TYPES) {
        for (const result of results) {
            const component = result.address_components?.find((c) => c.types.includes(type));
            if (component) return component.long_name;
        }
    }
    return null;
};

/**
 * Full-screen-ish map picker for pinning a precise pickup/delivery location.
 * Additive to the existing directions/contact text fields — this is stored
 * alongside them, not instead of them. Uses Google Maps (see googleMaps.js).
 *
 * The picked point is reverse-geocoded (Google Geocoding, in Arabic) so the
 * city name can be filled in for the user: `onConfirm(point, city)` — `city`
 * is null when Google has none for that spot or the lookup is unavailable.
 */
export const MapPickerModal = ({ isOpen, onClose, onConfirm, title, cityName, initialPoint }) => {
    const cityCenter = cityName ? lookupCityCoordinates(cityName) : null;
    const [point, setPoint] = useState(initialPoint || null);
    const [city, setCity] = useState(null);
    const [isResolving, setIsResolving] = useState(false);
    const geocodingLib = useMapsLibrary('geocoding');

    // Resolve the city every time the pin moves, so the user sees what will
    // be filled in before confirming.
    useEffect(() => {
        if (!point || !geocodingLib) return undefined;
        let cancelled = false;
        setIsResolving(true);
        new geocodingLib.Geocoder()
            .geocode({ location: toLatLng(point), language: 'ar', region: 'SA' })
            .then(({ results }) => { if (!cancelled) setCity(cityFromGeocode(results)); })
            .catch(() => { if (!cancelled) setCity(null); }) // e.g. Geocoding API not enabled on the key
            .finally(() => { if (!cancelled) setIsResolving(false); });
        return () => { cancelled = true; };
    }, [point, geocodingLib]);

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
                    <Map
                        mapId={GOOGLE_MAPS_MAP_ID}
                        defaultCenter={toLatLng(center)}
                        defaultZoom={12}
                        style={{ height: '100%', width: '100%' }}
                        gestureHandling="greedy"
                        clickableIcons={false}
                        onClick={(e) => e.detail.latLng && setPoint([e.detail.latLng.lat, e.detail.latLng.lng])}
                    >
                        {point && <AdvancedMarker position={toLatLng(point)}><MapPin color="#E53E3E" /></AdvancedMarker>}
                    </Map>
                    <div style={{
                        position: 'absolute', top: 10, left: 10, right: 10, zIndex: 1000,
                        backgroundColor: 'white', borderRadius: 8, padding: '8px 12px',
                        textAlign: 'center', fontSize: 13, boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    }}>
                        {!point ? 'اضغط على الخريطة لتحديد الموقع بدقة'
                            : isResolving ? 'جاري تحديد المدينة'
                                : city ? <>المدينة: <strong>{city}</strong> — اضغط تأكيد للحفظ</>
                                    : 'تم تحديد الموقع — اضغط تأكيد للحفظ'}
                    </div>
                </div>
                <div style={{ padding: 16, borderTop: '1px solid var(--color-border)' }}>
                    <Button
                        style={{ width: '100%' }}
                        disabled={!point || isResolving}
                        onClick={() => { onConfirm(point, city); onClose(); }}
                    >
                        تأكيد الموقع
                    </Button>
                </div>
            </div>
        </div>,
        document.body
    );
};
