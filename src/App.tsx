import React, { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AuthProvider } from '@/contexts/AuthContext';
import { LocalizationProvider } from '@/contexts/LocalizationContext';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import { PWAInstallProvider } from '@/contexts/PWAInstallContext';
import { DataProvider } from '@/contexts/DataContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Spinner from '@/components/Spinner';
import Layout from '@/components/Layout';
import Login from '@/components/Login';
import Register from '@/components/Register';
import ForgotPassword from '@/components/ForgotPassword';
import UpdatePassword from '@/components/UpdatePassword';
import { ROLES_PERMISSIONS } from '@/constants';
import { Role } from '@/types';

const Dashboard = lazy(() => import('@/components/Dashboard'));
const Session = lazy(() => import('@/components/pulse/Pulse'));
const TicketsList = lazy(() => import('@/components/tickets/TicketsList'));
const TicketDetail = lazy(() => import('@/components/tickets/TicketDetail').then(m => ({ default: m.TicketDetail })));
const AssetsList = lazy(() => import('@/components/assets/AssetsList').then(m => ({ default: m.AssetsList })));
const AssetDetail = lazy(() => import('@/components/assets/AssetDetail'));
const AddAsset = lazy(() => import('@/components/assets/AddAsset'));
const LicensesList = lazy(() => import('@/components/licenses/LicensesList'));
const LicenseDetail = lazy(() => import('@/components/licenses/LicenseDetail'));
const IncidentsList = lazy(() => import('@/components/incidents/IncidentsList').then(m => ({ default: m.IncidentsList })));
const IncidentDetail = lazy(() => import('@/components/incidents/IncidentDetail'));
const Reports = lazy(() => import('@/components/reports/Reports'));
const KnowledgeBase = lazy(() => import('@/components/kb/KnowledgeBase'));
const KBArticleDetail = lazy(() => import('@/components/kb/KBArticleDetail'));
const KBArticleEditor = lazy(() => import('@/components/kb/KBArticleEditor'));
const Settings = lazy(() => import('@/components/settings/Settings'));
const VendorsList = lazy(() => import('@/components/vendors/VendorsList'));
const AssetMap = lazy(() => import('@/components/maps/AssetMap'));
const LocationsList = lazy(() => import('@/components/locations/LocationsList'));
const OnboardingList = lazy(() => import('@/components/onboarding/OnboardingList'));
const OnboardingDetail = lazy(() => import('@/components/onboarding/OnboardingDetail'));

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
        return <>{children}</>;
    }

    const hasPermission = ROLES_PERMISSIONS[userRole]?.includes(pageId)
        || pageId === 'vendors'
        || pageId === 'map'
        || pageId === 'locations'
        || pageId === 'onboarding';

    if (!hasPermission) {
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
        <Suspense fallback={<div className="flex items-center justify-center h-screen"><Spinner /></div>}>
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
        </Suspense>
      </NotificationsProvider>
    </DataProvider>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <LocalizationProvider>
        <AuthProvider>
          <PWAInstallProvider>
            <HashRouter>
                <AppRoutes />
            </HashRouter>
          </PWAInstallProvider>
        </AuthProvider>
      </LocalizationProvider>
    </ErrorBoundary>
  );
};

export default App;