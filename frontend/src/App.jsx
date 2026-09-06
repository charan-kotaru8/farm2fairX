import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';
import LandingPage from './features/landing/LandingPage';
import LoginPage from './features/auth/LoginPage';
import SignupPage from './features/auth/SignupPage';
// Farmer
import FarmerDashboard from './features/farmer-dashboard/FarmerDashboard';
import FarmerLotsView from './features/farmer-dashboard/FarmerLotsView';
import MarketIntelligence from './features/market-intel/MarketIntelligence';
import LotCreationForm from './features/farmer-dashboard/LotCreationForm';
// Buyer
import BuyerDashboard from './features/buyer-marketplace/BuyerDashboard';
import BuyerMarketplace from './features/buyer-marketplace/BuyerMarketplace';
import BuyerVerificationStatus from './features/buyer-marketplace/BuyerVerificationStatus';
// Admin
import AdminDashboard from './features/admin/AdminDashboard';
import BuyerVerificationQueue from './features/admin/BuyerVerificationQueue';
// FPO (Phase 5)
import FpoDashboard from './features/fpo/FpoDashboard';
import MemberDirectory from './features/fpo/MemberDirectory';
import AggregationFlow from './features/fpo/AggregationFlow';
import FpoAggregatedLotsView from './features/fpo/FpoAggregatedLotsView';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Route>

          {/* Farmer Routes */}
          <Route path="/farmer" element={<DashboardLayout role="farmer" />}>
            <Route index element={<Navigate to="/farmer/dashboard" replace />} />
            <Route path="dashboard" element={<FarmerDashboard />} />
            <Route path="market-intel" element={<MarketIntelligence />} />
            <Route path="lots" element={<FarmerLotsView />} />
            <Route path="lots/:lotId" element={<FarmerLotsView />} />
            <Route path="create-lot" element={<LotCreationForm />} />
          </Route>

          {/* Buyer Routes */}
          <Route path="/buyer" element={<DashboardLayout role="buyer" />}>
            <Route index element={<Navigate to="/buyer/dashboard" replace />} />
            <Route path="dashboard" element={<BuyerDashboard />} />
            <Route path="marketplace" element={<BuyerMarketplace />} />
            <Route path="verification" element={<BuyerVerificationStatus />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<DashboardLayout role="admin" />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="verifications" element={<BuyerVerificationQueue />} />
          </Route>

          {/* FPO Routes (Phase 5) */}
          <Route path="/fpo" element={<DashboardLayout role="fpo" />}>
            <Route index element={<Navigate to="/fpo/dashboard" replace />} />
            <Route path="dashboard" element={<FpoDashboard />} />
            <Route path="members" element={<MemberDirectory />} />
            <Route path="aggregate" element={<AggregationFlow />} />
            <Route path="lots" element={<FpoAggregatedLotsView />} />
          </Route>

          {/* Backwards compatibility redirects */}
          <Route path="/farmer-dashboard" element={<Navigate to="/farmer/dashboard" replace />} />
          <Route path="/buyer-dashboard" element={<Navigate to="/buyer/dashboard" replace />} />
          <Route path="/admin-dashboard" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/fpo-dashboard" element={<Navigate to="/fpo/dashboard" replace />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

