import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// Layouts
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
// Auth Pages
import { DashboardWrapper } from './pages/common/DashboardWrapper';
import { CreateShipment } from './pages/shipper/CreateShipment';
import { ReceivedOffers } from './pages/shipper/ReceivedOffers';
import { TripsList } from './pages/shipper/TripsList';
import { TripRating } from './pages/shipper/TripRating';
import { Profile } from './pages/shipper/Profile';
import { NotificationsPage } from './pages/shipper/NotificationsPage';
import AppLayout from './components/layout/AppLayout';

import { ShipmentsWrapper } from './pages/common/ShipmentsWrapper';
import { ShipmentDetailWrapper } from './pages/common/ShipmentDetailWrapper';
import { TripTrackWrapper } from './pages/common/TripTrackWrapper';
import { NegotiationWrapper } from './pages/common/NegotiationWrapper';
import { WalletWrapper } from './pages/common/WalletWrapper';

function App() {
    return (<BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />}/>
        <Route path="/register" element={<Register />}/>

        {/* App Routes (Shipper & Carrier) */}
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

        <Route path="*" element={<Navigate to="/login" replace/>}/>
      </Routes>
    </BrowserRouter>);
}
export default App;
