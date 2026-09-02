import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { I18nProvider } from '@/i18n/I18nProvider';
import { Toaster } from '@/components/ui/sonner';
import { ProtectedRoute } from '@/components/routing/ProtectedRoute';
import { ROUTES } from '@/lib/routes';
import './App.css';

import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/auth/Login';
import { Signup } from './pages/auth/Signup';
import { DashboardLayout } from './pages/dashboard/DashboardLayout';
import { Dashboard } from './pages/dashboard/Dashboard';
import { PinGenerator } from './pages/dashboard/PinGenerator';
import { Schedule } from './pages/dashboard/Schedule';
import { Analytics } from './pages/dashboard/Analytics';
import { Settings } from './pages/dashboard/Settings';
import { AutopilotPage } from './pages/dashboard/Autopilot';
import { PrivacyPolicy } from './pages/legal/PrivacyPolicy';
import { TermsOfService } from './pages/legal/TermsOfService';
import { LegalNotice } from './pages/legal/LegalNotice';
import { NotFound } from './pages/NotFound';
import { ComingSoon } from './pages/ComingSoon';

function ProtectedDashboard() {
  return (
    <ProtectedRoute>
      <DashboardLayout />
    </ProtectedRoute>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.home} element={<LandingPage />} />
      <Route path={ROUTES.login} element={<Login />} />
      <Route path={ROUTES.signup} element={<Signup />} />
      <Route path={ROUTES.privacy} element={<PrivacyPolicy />} />
      <Route path={ROUTES.terms} element={<TermsOfService />} />
      <Route path={ROUTES.legal} element={<LegalNotice />} />
      <Route path={ROUTES.comingSoon} element={<ComingSoon />} />
      <Route path={ROUTES.cookies} element={<Navigate to={ROUTES.privacyCookies} replace />} />
      <Route path="/confidentialite" element={<Navigate to={ROUTES.privacy} replace />} />
      <Route path="/mentions-legales" element={<Navigate to={ROUTES.legal} replace />} />
      <Route path="/cgv" element={<Navigate to={ROUTES.terms} replace />} />

      <Route path={ROUTES.dashboard} element={<ProtectedDashboard />}>
        <Route index element={<Dashboard />} />
        <Route path="generator" element={<PinGenerator />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="autopilot" element={<AutopilotPage />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <I18nProvider>
      <AuthProvider>
        <div className="min-h-screen w-full overflow-x-hidden">
          <BrowserRouter>
            <AppRoutes />
            <Toaster position="top-right" />
          </BrowserRouter>
        </div>
      </AuthProvider>
    </I18nProvider>
  );
}

export default App;
