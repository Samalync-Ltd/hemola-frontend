import React, { useEffect } from 'react';
import { Map, AdvancedMarker, Polyline, useMap } from '@vis.gl/react-google-maps';
import { PickupPin, DeliveryPin } from './MapPin';
import { GOOGLE_MAPS_MAP_ID, toLatLng } from './googleMaps';

/** Frames both pins once the map is ready (a single pin keeps the default zoom). */
const FitToPoints = ({ points }) => {
    const map = useMap();
    // Keyed on the coordinates, not the array, so a parent re-render (live
    // trip updates) doesn't yank the camera back while the user is panning.
    const key = JSON.stringify(points);
    useEffect(() => {
        if (!map || points.length < 2) return;
        const bounds = new window.google.maps.LatLngBounds();
        points.forEach((p) => bounds.extend(p));
        map.fitBounds(bounds, 40);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, key]);
    return null;
};

/**
 * Shows pickup and delivery together, clearly distinguished (navy pickup pin
 * vs. green delivery pin — same colors as mobile's trip map), for the trip
 * tracking screens. Only ever rendered post-assignment — see the visibility
 * rule on SiteDetails.
 */
export const TripMap = ({ pickup, delivery, height = 220, interactive = true, focus = null }) => {
    if (!pickup && !delivery) return null;
    // `focus` ('pickup' | 'delivery'): the point the carrier is heading to now.
    const emphasisFor = (point) => (!focus ? undefined : focus === point ? 'focus' : 'muted');
    const points = [pickup, delivery].filter(Boolean).map(toLatLng);

    return (
        <div style={{ height, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
            <Map
                mapId={GOOGLE_MAPS_MAP_ID}
                defaultCenter={points[0]}
                defaultZoom={points.length > 1 ? 6 : 11}
                style={{ height: '100%', width: '100%' }}
                gestureHandling={interactive ? 'greedy' : 'none'}
                disableDefaultUI={!interactive}
                keyboardShortcuts={interactive}
                clickableIcons={false}
            >
                <FitToPoints points={points} />
                {points.length > 1 && (
                    <Polyline
                        path={points}
                        strokeOpacity={0}
                        icons={[{
                            icon: { path: 'M 0,-1 0,1', strokeColor: '#0F2440', strokeOpacity: 0.6, strokeWeight: 3, scale: 3 },
                            offset: '0', repeat: '14px',
                        }]}
                    />
                )}
                {pickup && <AdvancedMarker position={toLatLng(pickup)} zIndex={focus === 'pickup' ? 2 : 1}><PickupPin emphasis={emphasisFor('pickup')} /></AdvancedMarker>}
                {delivery && <AdvancedMarker position={toLatLng(delivery)} zIndex={focus === 'delivery' ? 2 : 1}><DeliveryPin emphasis={emphasisFor('delivery')} /></AdvancedMarker>}
            </Map>
        </div>
    );
};

/** Google Maps directions from the device's current location to the point — starts navigation on a phone. */
export const openDirections = (lat, lng) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank', 'noopener,noreferrer');
};

/** Opens the coordinate in Google Maps in a new tab — universal, no API key. */
export const openInMaps = (lat, lng) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank', 'noopener,noreferrer');
};
