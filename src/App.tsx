import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AuthProvider } from '@/contexts/AuthContext';
import { LocalizationProvider } from '@/contexts/LocalizationContext';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import { PWAInstallProvider } from '@/contexts/PWAInstallContext';
import { DataProvider } from '@/contexts/DataContext';
import Layout from '@/components/Layout';
import Login from '@/components/Login';
import Register from '@/components/Register';
import ForgotPassword from '@/components/ForgotPassword';
import UpdatePassword from '@/components/UpdatePassword';
import Dashboard from '@/components/Dashboard';
import DummyPage from '@/components/DummyPage';
import TicketsList from '@/components/tickets/TicketsList';
import { TicketDetail } from '@/components/tickets/TicketDetail';
import { AssetsList } from '@/components/assets/AssetsList';
import AssetDetail from '@/components/assets/AssetDetail';
import AddAsset from '@/components/assets/AddAsset';
import LicensesList from '@/components/licenses/LicensesList';
import LicenseDetail from '@/components/licenses/LicenseDetail';
import { IncidentsList } from '@/components/incidents/IncidentsList';
import IncidentDetail from '@/components/incidents/IncidentDetail';
import Reports from '@/components/reports/Reports';
import { ROLES_PERMISSIONS } from '@/constants';
import { Role } from '@/types';
import KnowledgeBase from '@/components/kb/KnowledgeBase';
import KBArticleDetail from '@/components/kb/KBArticleDetail';
import KBArticleEditor from '@/components/kb/KBArticleEditor';
import Settings from '@/components/settings/Settings';
import Session from '@/components/pulse/Pulse';
import VendorsList from '@/components/vendors/VendorsList';
import AssetMap from '@/components/maps/AssetMap';
import LocationsList from '@/components/locations/LocationsList';
import OnboardingList from '@/components/onboarding/OnboardingList';
import OnboardingDetail from '@/components/onboarding/OnboardingDetail';

interface ProtectedRouteProps {
    children: React.ReactNode;
    pageId: string;
    allowedRoles?: Role[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, pageId, allowedRoles }) => {
    const { isAuthenticated, user } = useAuth();
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    
    const userRole = user?.role || Role.EndUser;

    if (allowedRoles) {
        if (!allowedRoles.includes(userRole)) {
            return <Navigate to="/dashboard" replace />;
        }
    } else if (ROLES_PERMISSIONS[userRole]?.includes(pageId) || pageId === 'vendors' || pageId === 'map' || pageId === 'locations' || pageId === 'onboarding') {
        return <>{children}</>;
    } else {
         return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/update-password" element={<UpdatePassword />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <DataProvider>
      <NotificationsProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<ProtectedRoute pageId="dashboard"><Dashboard /></ProtectedRoute>} />
            <Route path="session" element={<ProtectedRoute pageId="session"><Session /></ProtectedRoute>} />
            <Route path="tickets" element={<ProtectedRoute pageId="tickets"><TicketsList /></ProtectedRoute>} />
            <Route path="tickets/:ticketId" element={<ProtectedRoute pageId="tickets"><TicketDetail /></ProtectedRoute>} />
            <Route path="assets" element={<ProtectedRoute pageId="assets"><AssetsList /></ProtectedRoute>} />
            <Route path="assets/new" element={<ProtectedRoute pageId="assets" allowedRoles={[Role.Admin, Role.Agent]}><AddAsset /></ProtectedRoute>} />
            <Route path="assets/edit/:assetId" element={<ProtectedRoute pageId="assets" allowedRoles={[Role.Admin, Role.Agent]}><AddAsset /></ProtectedRoute>} />
            <Route path="assets/:assetId" element={<ProtectedRoute pageId="assets"><AssetDetail /></ProtectedRoute>} />
            <Route path="licenses" element={<ProtectedRoute pageId="licenses"><LicensesList /></ProtectedRoute>} />
            <Route path="licenses/:licenseId" element={<ProtectedRoute pageId="licenses"><LicenseDetail /></ProtectedRoute>} />
            <Route path="incidents" element={<ProtectedRoute pageId="incidents"><IncidentsList /></ProtectedRoute>} />
            <Route path="incidents/:incidentId" element={<ProtectedRoute pageId="incidents"><IncidentDetail /></ProtectedRoute>} />
            <Route path="kb" element={<ProtectedRoute pageId="kb"><KnowledgeBase /></ProtectedRoute>} />
            <Route path="kb/new" element={<ProtectedRoute pageId="kb" allowedRoles={[Role.Admin, Role.Agent]}><KBArticleEditor /></ProtectedRoute>} />
            <Route path="kb/edit/:articleId" element={<ProtectedRoute pageId="kb" allowedRoles={[Role.Admin, Role.Agent]}><KBArticleEditor /></ProtectedRoute>} />
            <Route path="kb/:articleId" element={<ProtectedRoute pageId="kb"><KBArticleDetail /></ProtectedRoute>} />
            <Route path="reports" element={<ProtectedRoute pageId="reports"><Reports /></ProtectedRoute>} />
            <Route path="settings" element={<ProtectedRoute pageId="settings"><Settings /></ProtectedRoute>} />

            {/* Vendors */}
            <Route path="vendors" element={<ProtectedRoute pageId="vendors" allowedRoles={[Role.Admin, Role.Agent]}><VendorsList /></ProtectedRoute>} />

            {/* Mappa asset */}
            <Route path="map" element={<ProtectedRoute pageId="map"><AssetMap /></ProtectedRoute>} />

            {/* Sedi aziendali */}
            <Route path="locations" element={<ProtectedRoute pageId="locations" allowedRoles={[Role.Admin, Role.Agent]}><LocationsList /></ProtectedRoute>} />

            {/* Onboarding / Offboarding */}
            <Route path="onboarding" element={<ProtectedRoute pageId="onboarding" allowedRoles={[Role.Admin, Role.Agent]}><OnboardingList /></ProtectedRoute>} />
            <Route path="onboarding/:id" element={<ProtectedRoute pageId="onboarding" allowedRoles={[Role.Admin, Role.Agent]}><OnboardingDetail /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
          <Route path="/login" element={<Navigate to="/" replace />} />
          <Route path="/register" element={<Navigate to="/" replace />} />
        </Routes>
      </NotificationsProvider>
    </DataProvider>
  );
};

const App: React.FC = () => {
  return (
    <LocalizationProvider>
      <AuthProvider>
        <PWAInstallProvider>
          <HashRouter>
              <AppRoutes />
          </HashRouter>
        </PWAInstallProvider>
      </AuthProvider>
    </LocalizationProvider>
  );
};

export default App;