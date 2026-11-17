import React from 'react';
import { Outlet } from 'react-router-dom';
import { APIProvider } from '@vis.gl/react-google-maps';
import { GOOGLE_MAPS_API_KEY } from './googleMaps';
import { getLanguage } from '../../i18n/language';

/**
 * Loads Google Maps for the routes inside it (the app, /app/*) — the only
 * screens with maps. Kept out of the public pages so they stay light.
 *
 * Google loads its script once per page, in one language: the site's
 * language at that moment. Switching language afterwards changes all of our
 * own text at once; Google's map labels follow on the next page load.
 */
const MapsProvider = () => (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} language={getLanguage()} region="SA">
        <Outlet />
    </APIProvider>
);

export default MapsProvider;
