import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// Layouts
import { Login } from './pages/auth/Login';
import { Register } from './pages/auth/Register';
// Auth Pages
import { Dashboard } from './pages/shipper/Dashboard';
import { MyShipments } from './pages/shipper/MyShipments';
import { CreateShipment } from './pages/shipper/CreateShipment';
import { ReceivedOffers } from './pages/shipper/ReceivedOffers';
import { TripsList } from './pages/shipper/TripsList';
import { TripTrack } from './pages/shipper/TripTrack';
import { TripRating } from './pages/shipper/TripRating';
import { WalletPage } from './pages/shipper/Wallet';
import { Profile } from './pages/shipper/Profile';
import AdminLayout from './components/layout/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminApprovals } from './pages/admin/AdminApprovals';
function App() {
    return (<BrowserRouter>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />}/>
        <Route path="/register" element={<Register />}/>

        {/* App Routes (Shipper) */}
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Dashboard />}/>
          <Route path="shipments" element={<MyShipments />}/>
          <Route path="shipments/new" element={<CreateShipment />}/>
          <Route path="shipments/:shipmentId" element={<ShipmentDetail />}/>
          <Route path="shipments/:shipmentId/offers" element={<ReceivedOffers />}/>
          <Route path="shipments/:shipmentId/negotiation/:offerId" element={<Negotiation />}/>
          
          <Route path="trips" element={<TripsList />}/>
          <Route path="trips/:tripId/track" element={<TripTrack />}/>
          <Route path="trips/:tripId/rating" element={<TripRating />}/>
          
          <Route path="wallet" element={<WalletPage />}/>
          <Route path="account" element={<Profile />}/>
          {/* other app routes */}
        </Route>

        {/* Admin Routes */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />}/>
          <Route path="approvals" element={<AdminApprovals />}/>
          {/* other admin routes */}
        </Route>

        <Route path="*" element={<Navigate to="/login" replace/>}/>
      </Routes>
    </BrowserRouter>);
}
export default App;
