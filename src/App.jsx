import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Loader } from './components/common/Loader';
// Public pages are in the first download: they are what a new visitor opens.
import { Landing } from './pages/public/Landing';
import { LegalPage } from './pages/public/LegalPage';

/**
 * Everything behind the landing page is downloaded only when it's opened, so
 * a visitor on a phone doesn't pay for Firebase and every app screen just to
 * read the home page. If a file from an older deploy is gone (an open tab
 * after a new release), reload once to get the new version.
 */
const RELOAD_KEY = 'hemooltak-chunk-reload';
const session = {
    get: () => { try { return sessionStorage.getItem(RELOAD_KEY); } catch { return null; } },
    set: () => { try { sessionStorage.setItem(RELOAD_KEY, '1'); } catch { /* private mode */ } },
    clear: () => { try { sessionStorage.removeItem(RELOAD_KEY); } catch { /* private mode */ } },
};
// `fallback`: 'screen' for pages shown on their own (sign-in, the app shell),
// 'page' for screens shown inside the app shell.
const lazyPage = (load, name, fallback = 'page') => {
    const Page = lazy(() => load()
        .then((module) => { session.clear(); return { default: module[name] ?? module.default }; })
        .catch((error) => {
            if (!session.get()) {
                session.set();
                window.location.reload();
                return new Promise(() => {});
            }
            throw error;
        }));
    // Each page waits inside its own boundary, so the app's sidebar and top
    // bar stay on screen while a page's file is downloading.
    const WithFallback = (props) => (
        <Suspense fallback={<Loader variant={fallback} />}>
            <Page {...props} />
        </Suspense>
    );
    return WithFallback;
};

const Login = lazyPage(() => import('./pages/auth/Login'), 'Login', 'screen');
const Register = lazyPage(() => import('./pages/auth/Register'), 'Register', 'screen');
const AppLayout = lazyPage(() => import('./components/layout/AppLayout'), 'default', 'screen');
const DashboardWrapper = lazyPage(() => import('./pages/common/DashboardWrapper'), 'DashboardWrapper');
const CreateShipment = lazyPage(() => import('./pages/shipper/CreateShipment'), 'CreateShipment');
const ReceivedOffers = lazyPage(() => import('./pages/shipper/ReceivedOffers'), 'ReceivedOffers');
const TripsList = lazyPage(() => import('./pages/shipper/TripsList'), 'TripsList');
const TripRating = lazyPage(() => import('./pages/shipper/TripRating'), 'TripRating');
const Profile = lazyPage(() => import('./pages/shipper/Profile'), 'Profile');
const NotificationsPage = lazyPage(() => import('./pages/shipper/NotificationsPage'), 'NotificationsPage');
const ShipmentsWrapper = lazyPage(() => import('./pages/common/ShipmentsWrapper'), 'ShipmentsWrapper');
const ShipmentDetailWrapper = lazyPage(() => import('./pages/common/ShipmentDetailWrapper'), 'ShipmentDetailWrapper');
const TripTrackWrapper = lazyPage(() => import('./pages/common/TripTrackWrapper'), 'TripTrackWrapper');
const NegotiationWrapper = lazyPage(() => import('./pages/common/NegotiationWrapper'), 'NegotiationWrapper');
const WalletWrapper = lazyPage(() => import('./pages/common/WalletWrapper'), 'WalletWrapper');

// Google Maps is only loaded inside the app (/app/*) — the only place with maps.
// The app shell is fetched at the same time, not after it.
const WithMaps = lazyPage(() => {
    import('./components/layout/AppLayout').catch(() => { /* retried when AppLayout itself loads */ });
    return import('./components/map/MapsProvider');
}, 'default', 'screen');

function App() {
    return (<BrowserRouter>
      <Routes>
        {/* Public pages: landing at /, legal pages in the footer */}
        <Route path="/" element={<Landing />}/>
        <Route path="/terms" element={<LegalPage page="terms" />}/>
        <Route path="/privacy" element={<LegalPage page="privacy" />}/>
        <Route path="/refund" element={<LegalPage page="refund" />}/>

        {/* Auth Routes */}
        <Route path="/login" element={<Login />}/>
        <Route path="/register" element={<Register />}/>

        {/* App Routes (Shipper & Carrier) */}
        <Route element={<WithMaps />}>
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<DashboardWrapper />}/>
          <Route path="shipments" element={<ShipmentsWrapper />}/>
          <Route path="shipments/new" element={<CreateShipment />}/>
          <Route path="shipments/:shipmentId" element={<ShipmentDetailWrapper />}/>
          <Route path="shipments/:shipmentId/offers" element={<ReceivedOffers />}/>
          <Route path="shipments/:shipmentId/negotiation/:offerId" element={<NegotiationWrapper />}/>

          <Route path="trips" element={<TripsList />}/>
          <Route path="trips/:tripId/track" element={<TripTrackWrapper />}/>
          <Route path="trips/:tripId/rating" element={<TripRating />}/>

          <Route path="wallet" element={<WalletWrapper />}/>
          <Route path="account" element={<Profile />}/>
          <Route path="notifications" element={<NotificationsPage />}/>
          {/* other app routes */}
        </Route>
        </Route>

        <Route path="*" element={<Navigate to="/login" replace/>}/>
      </Routes>
    </BrowserRouter>);
}
export default App;
