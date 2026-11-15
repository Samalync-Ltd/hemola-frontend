import React from 'react';
import { Outlet } from 'react-router-dom';
import { APIProvider } from '@vis.gl/react-google-maps';
import { GOOGLE_MAPS_API_KEY } from './googleMaps';

/**
 * Loads Google Maps for the routes inside it (the app, /app/*) — the only
 * screens with maps. Kept out of the public pages so they stay light.
 */
const MapsProvider = () => (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} language="ar" region="SA">
        <Outlet />
    </APIProvider>
);

export default MapsProvider;
