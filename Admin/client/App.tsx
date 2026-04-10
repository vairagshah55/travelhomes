import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import { AuthProvider } from "./contexts/AuthContext";

import AdminLogin from "./admin/pages/AdminLogin";
import AdminDashboard from "./admin/pages/AdminDashboard";
import ManagementListing from "./admin/pages/management/ManagementListing";
import UserManagement from "./admin/pages/management/UserManagement";
import VendorManagement from "./admin/pages/management/VendorManagement";
import BookingManagement from "./admin/pages/management/BookingManagement";
import PaymentManagement from "./admin/pages/management/PaymentManagement";
import AdminAnalytics from "./admin/pages/AdminAnalytics";
import AdminAnalyticsReportPage from "./admin/pages/AdminAnalyticsReports";
import AdminHelpDesk from "./admin/pages/AdminHelpDesk";
import AdminPlugins from "./admin/pages/AdminPlugins";
import AdminCRM from "./admin/pages/AdminCRM";
import AdminGlobalSettings from "./admin/pages/AdminGlobalSettings";
import AdminCMS from "./admin/pages/AdminCMS";
import AdminStaff from "./admin/pages/AdminStaff";
import AdminMarketing from "./admin/pages/AdminMarketing";
import AdminProtectedRoute from "./admin/components/AdminProtectedRoute";
import Profile from "./admin/components/Profile";
import NotFound from "./admin/pages/NotFound";
import Notifications from "./admin/pages/Notifications";
import Help from "./admin/pages/Help";
import AdminSEOMeta from "./admin/components/AdminSEOMeta";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="travel-dashboard-theme">
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter basename="/admin">
            <AdminSEOMeta />
            <Routes>

              {/* Public Routes */}
              <Route path="/" element={<AdminLogin />} />
              <Route path="/login" element={<AdminLogin />} />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <AdminProtectedRoute>
                    <AdminDashboard />
                  </AdminProtectedRoute>
                }
              />

              <Route
                path="/management/listing"
                element={
                  <AdminProtectedRoute>
                    <ManagementListing />
                  </AdminProtectedRoute>
                }
              />

              <Route
                path="/management/user"
                element={
                  <AdminProtectedRoute>
                    <UserManagement />
                  </AdminProtectedRoute>
                }
              />

              <Route
                path="/management/vendor"
                element={
                  <AdminProtectedRoute>
                    <VendorManagement />
                  </AdminProtectedRoute>
                }
              />

              <Route
                path="/management/booking"
                element={
                  <AdminProtectedRoute>
                    <BookingManagement />
                  </AdminProtectedRoute>
                }
              />

              <Route
                path="/payments"
                element={
                  <AdminProtectedRoute>
                    <PaymentManagement />
                  </AdminProtectedRoute>
                }
              />

              <Route
                path="/analytics"
                element={
                  <AdminProtectedRoute>
                    <AdminAnalytics />
                  </AdminProtectedRoute>
                }
              />

              <Route
                path="/analytics/report"
                element={
                  <AdminProtectedRoute>
                    <AdminAnalyticsReportPage />
                  </AdminProtectedRoute>
                }
              />

              <Route
                path="/help-desk"
                element={
                  <AdminProtectedRoute>
                    <AdminHelpDesk />
                  </AdminProtectedRoute>
                }
              />

              <Route
                path="/plugins"
                element={
                  <AdminProtectedRoute>
                    <AdminPlugins />
                  </AdminProtectedRoute>
                }
              />

              <Route
                path="/notifications"
                element={
                  <AdminProtectedRoute>
                    <Notifications />
                  </AdminProtectedRoute>
                }
              />

              <Route
                path="/profile"
                element={
                  <AdminProtectedRoute>
                    <Profile />
                  </AdminProtectedRoute>
                }
              />

              <Route
                path="/help"
                element={
                  <AdminProtectedRoute>
                    <Help />
                  </AdminProtectedRoute>
                }
              />

              <Route
                path="/crm"
                element={
                  <AdminProtectedRoute>
                    <AdminCRM />
                  </AdminProtectedRoute>
                }
              />

              <Route
                path="/global-settings"
                element={
                  <AdminProtectedRoute>
                    <AdminGlobalSettings />
                  </AdminProtectedRoute>
                }
              />

              <Route
                path="/cms"
                element={
                  <AdminProtectedRoute>
                    <AdminCMS />
                  </AdminProtectedRoute>
                }
              />

              <Route
                path="/staff"
                element={
                  <AdminProtectedRoute>
                    <AdminStaff />
                  </AdminProtectedRoute>
                }
              />

              <Route
                path="/staff/roles"
                element={
                  <AdminProtectedRoute>
                    <AdminStaff />
                  </AdminProtectedRoute>
                }
              />

              <Route
                path="/staff/permissions"
                element={
                  <AdminProtectedRoute>
                    <AdminStaff />
                  </AdminProtectedRoute>
                }
              />

              <Route
                path="/marketing"
                element={
                  <AdminProtectedRoute>
                    <AdminMarketing />
                  </AdminProtectedRoute>
                }
              />

              {/* Catch All */}
              <Route path="*" element={<NotFound />} />

            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;