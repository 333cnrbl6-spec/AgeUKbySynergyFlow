import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';

import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard.jsx';
import Clients from './pages/Clients';
import Jobs from './pages/Jobs';
import JobCalendar from './pages/JobCalendar';
import Activities from './pages/Activities';
import Invoices from './pages/Invoices';
import Staff from './pages/Staff';
import Suppliers from './pages/Suppliers';
import Facilities from './pages/Facilities';
import Grants from './pages/Grants';
import Referrals from './pages/Referrals';
import Partners from './pages/Partners';
import Compliance from './pages/Compliance';
import ImpactReporting from './pages/ImpactReporting';
import XeroIntegration from './pages/XeroIntegration';
import Timesheets from './pages/Timesheets';
import Prospects from './pages/Prospects';
import Services from './pages/Services';
import DataPartnerships from './pages/DataPartnerships';
import Analytics from './pages/Analytics';
import MapDashboard from './pages/MapDashboard';
import ImpactStories from './pages/ImpactStories';
import InformationHub from './pages/InformationHub';
import ComplimentaryServices from './pages/ComplimentaryServices';
import HealthServices from './pages/HealthServices';
import ClientDetails from './pages/ClientDetails';
import ClientPortal from './pages/ClientPortal';
import StaffCalendar from './pages/StaffCalendar';
import SessionList from './pages/SessionList';
import CommunityExchange from './pages/CommunityExchange';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="mt-3 text-sm text-muted-foreground">Loading Age UK Bury...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      {/* Client Portal (no layout) */}
      <Route path="/portal" element={<ClientPortal />} />

      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/clients/:clientId" element={<ClientDetails />} />
        <Route path="/prospects" element={<Prospects />} />
        <Route path="/jobs" element={<Jobs />} />
        <Route path="/calendar" element={<JobCalendar />} />
        <Route path="/activities" element={<Activities />} />
        <Route path="/services" element={<Services />} />
        <Route path="/partnerships" element={<DataPartnerships />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/staff" element={<Staff />} />
        <Route path="/suppliers" element={<Suppliers />} />
        <Route path="/facilities" element={<Facilities />} />
        <Route path="/grants" element={<Grants />} />
        <Route path="/referrals" element={<Referrals />} />
        <Route path="/partners" element={<Partners />} />
        <Route path="/compliance" element={<Compliance />} />
        <Route path="/impact" element={<ImpactReporting />} />
        <Route path="/xero" element={<XeroIntegration />} />
        <Route path="/timesheets" element={<Timesheets />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/map" element={<MapDashboard />} />
        <Route path="/impact" element={<ImpactStories />} />
        <Route path="/information" element={<InformationHub />} />
        <Route path="/services" element={<ComplimentaryServices />} />
        <Route path="/health" element={<HealthServices />} />
        <Route path="/staff-calendar" element={<StaffCalendar />} />
        <Route path="/session-list" element={<SessionList />} />
        <Route path="/exchange" element={<CommunityExchange />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App