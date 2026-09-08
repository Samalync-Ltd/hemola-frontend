import React from 'react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import { pickupIcon, deliveryIcon } from '../../utils/mapIcons';

/**
 * Shows pickup and delivery together, clearly distinguished (navy pickup pin
 * vs. green delivery pin — same colors as mobile's OsmTripMap), for the trip
 * tracking screens. Only ever rendered post-assignment — see the visibility
 * rule on SiteDetails.
 */
export const TripMap = ({ pickup, delivery, height = 220, interactive = true }) => {
    if (!pickup && !delivery) return null;
    const points = [pickup, delivery].filter(Boolean);
    const center = points[0];

    return (
        <div style={{ height, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
            <MapContainer
                center={center}
                zoom={points.length > 1 ? 6 : 11}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
                dragging={interactive}
                touchZoom={interactive}
                doubleClickZoom={interactive}
                boxZoom={interactive}
                keyboard={interactive}
                zoomControl={interactive}
                attributionControl={interactive}
            >
                <TileLayer
                    url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="© OpenStreetMap"
                />
                {points.length > 1 && <Polyline positions={points} color="#0F2440" weight={3} opacity={0.6} dashArray="6,6" />}
                {pickup && <Marker position={pickup} icon={pickupIcon} />}
                {delivery && <Marker position={delivery} icon={deliveryIcon} />}
            </MapContainer>
        </div>
    );
};

/** Opens the coordinate in Google Maps in a new tab — universal, no API key. */
export const openInMaps = (lat, lng) => {
    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank', 'noopener,noreferrer');
};
