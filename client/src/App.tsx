import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layouts
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { AdminLayout } from './components/layout/AdminLayout';

// Public Pages
import { HomePage } from './pages/website/HomePage';
import { AboutPage } from './pages/website/AboutPage';
import { ServicesPage } from './pages/website/ServicesPage';
import { ProjectsPage } from './pages/website/ProjectsPage';
import { CostEstimatorPage } from './pages/website/CostEstimatorPage';
import { ContactPage } from './pages/website/ContactPage';
import { PrivacyPage, TermsPage } from './pages/website/LegalPages';

// Common Components
import { CookieConsent } from './components/common/CookieConsent';

// Auth
import { LoginPage } from './pages/auth/LoginPage';

// Admin ERP
import { DashboardPage } from './pages/admin/DashboardPage';
import { CrmPage } from './pages/admin/CrmPage';
import { ProjectsPage as AdminProjectsPage } from './pages/admin/ProjectsPage';
import { ProjectDetailPage } from './pages/admin/ProjectDetailPage';
import { QuotationsPage } from './pages/admin/QuotationsPage';
import { SiteOpsPage } from './pages/admin/SiteOpsPage';
import { InventoryPage } from './pages/admin/InventoryPage';
import { FinancePage } from './pages/admin/FinancePage';
import { PortfolioAdminPage } from './pages/admin/PortfolioAdminPage';
import { InvoicesPage } from './pages/admin/InvoicesPage';

// Client Portal
import { ClientPortalPage } from './pages/client/ClientPortalPage';

const queryClient = new QueryClient();

// Public Layout wrapper with Navbar and Footer
const PublicLayout: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

// Protected Admin Route
const ProtectedAdminRoute: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-8 h-8 border-4 border-brand-navy-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (user?.role === 'client') {
    return <Navigate to="/client-portal" replace />;
  }
  return <AdminLayout />;
};

// Protected Client Route
const ProtectedClientRoute: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="w-8 h-8 border-4 border-brand-navy-900 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <ClientPortalPage />;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Website Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/projects" element={<ProjectsPage />} />
              <Route path="/projects/:slug" element={<ProjectsPage />} />
              <Route path="/cost-estimator" element={<CostEstimatorPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
            </Route>

            {/* Authentication */}
            <Route path="/login" element={<LoginPage />} />

            {/* Admin ERP Workspace */}
            <Route path="/admin" element={<ProtectedAdminRoute />}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="crm" element={<CrmPage />} />
              <Route path="projects" element={<AdminProjectsPage />} />
              <Route path="projects/:id" element={<ProjectDetailPage />} />
              <Route path="quotations" element={<QuotationsPage />} />
              <Route path="invoices" element={<InvoicesPage />} />
              <Route path="site-ops" element={<SiteOpsPage />} />
              <Route path="inventory" element={<InventoryPage />} />
              <Route path="finance" element={<FinancePage />} />
              <Route path="portfolio" element={<PortfolioAdminPage />} />
            </Route>

            {/* Client Portal */}
            <Route path="/client-portal" element={<ProtectedClientRoute />} />

            {/* Fallback to Home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <CookieConsent />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
