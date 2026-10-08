import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Common Components
import Navbar from './components/common/Navbar';
import ProtectedRoute from './components/common/ProtectedRoute';

// Public Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProvidersDirectoryPage from './pages/ProvidersDirectoryPage';
import ProfileSettingsPage from './pages/ProfileSettingsPage';

// Customer Pages
import CustomerDashboard from './pages/customer/CustomerDashboard';
import NewRequestPage from './pages/customer/NewRequestPage';
import RequestDetailPage from './pages/customer/RequestDetailPage';
import CustomerBookingDetail from './pages/customer/CustomerBookingDetail';
import CustomerInvoicesPage from './pages/customer/CustomerInvoicesPage';

// Provider Pages
import ProviderDashboard from './pages/provider/ProviderDashboard';
import ProviderOpportunitiesPage from './pages/provider/ProviderOpportunitiesPage';
import ProviderSchedulePage from './pages/provider/ProviderSchedulePage';
import ProviderProfileEditPage from './pages/provider/ProviderProfileEditPage';
import ProviderReviewsPage from './pages/provider/ProviderReviewsPage';
import ProviderBookingDetail from './pages/provider/ProviderBookingDetail';

// Operations Pages
import OperationsDashboard from './pages/operations/OperationsDashboard';

// Support Pages
import SupportDisputesPage from './pages/support/SupportDisputesPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
import AdminVerificationPage from './pages/admin/AdminVerificationPage';
import AdminStaffApprovalsPage from './pages/admin/AdminStaffApprovalsPage';
import AdminPricingPage from './pages/admin/AdminPricingPage';
import AdminAuditPage from './pages/admin/AdminAuditPage';

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-indigo-600 selection:text-white">
            {/* Top Navigation */}
            <Navbar />

            {/* Application Main Router Views */}
            <main className="flex-1">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/providers" element={<ProvidersDirectoryPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Common Authenticated Profile Route */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/profile" element={<ProfileSettingsPage />} />
                </Route>

                {/* Customer Routes */}
                <Route element={<ProtectedRoute allowedRoles={['customer', 'admin']} />}>
                  <Route path="/customer/dashboard" element={<CustomerDashboard />} />
                  <Route path="/customer/new-request" element={<NewRequestPage />} />
                  <Route path="/customer/requests/:id" element={<RequestDetailPage />} />
                  <Route path="/customer/bookings/:id" element={<CustomerBookingDetail />} />
                  <Route path="/customer/invoices" element={<CustomerInvoicesPage />} />
                </Route>

                {/* Service Provider Routes */}
                <Route element={<ProtectedRoute allowedRoles={['provider', 'admin']} />}>
                  <Route path="/provider/dashboard" element={<ProviderDashboard />} />
                  <Route path="/provider/opportunities" element={<ProviderOpportunitiesPage />} />
                  <Route path="/provider/schedule" element={<ProviderSchedulePage />} />
                  <Route path="/provider/profile" element={<ProviderProfileEditPage />} />
                  <Route path="/provider/reviews" element={<ProviderReviewsPage />} />
                  <Route path="/provider/bookings/:id" element={<ProviderBookingDetail />} />
                </Route>

                {/* Operations Manager Routes */}
                <Route element={<ProtectedRoute allowedRoles={['operations', 'admin']} />}>
                  <Route path="/operations/dashboard" element={<OperationsDashboard />} />
                </Route>

                {/* Support Agent Routes */}
                <Route element={<ProtectedRoute allowedRoles={['support', 'admin']} />}>
                  <Route path="/support/disputes" element={<SupportDisputesPage />} />
                  <Route path="/support/disputes/:id" element={<SupportDisputesPage />} />
                </Route>

                {/* Platform Admin Routes */}
                <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                  <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  <Route path="/admin/categories" element={<AdminCategoriesPage />} />
                  <Route path="/admin/verification" element={<AdminVerificationPage />} />
                  <Route path="/admin/staff-approvals" element={<AdminStaffApprovalsPage />} />
                  <Route path="/admin/pricing" element={<AdminPricingPage />} />
                  <Route path="/admin/audit" element={<AdminAuditPage />} />
                </Route>

                {/* Fallback to Home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
}
