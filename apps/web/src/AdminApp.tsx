// Self-hosted Inter — the admin UI's single standard font (bundled by Vite,
// so it renders consistently offline instead of falling back to Segoe UI).
// Loaded here (admin entry) so it stays scoped to the admin bundle.
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";

import "./admin.css";

import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// BrowserRouter intentionally NOT imported — admin mounts inside the parent
// app's router at /admin/* so nested routers would crash. Only Routes/Route
// are needed; paths are interpreted relative to /admin.
import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/admin/ThemeProvider";
import { AuthProvider } from "@/contexts/AdminAuthContext";

import AdminLogin from "@/pages/admin/AdminLogin";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import ManagementOverview from "@/pages/admin/management/ManagementOverview";
import ManagementListing from "@/pages/admin/management/ManagementListing";
import UserManagement from "@/pages/admin/management/UserManagement";
import VendorManagement from "@/pages/admin/management/VendorManagement";
import BookingManagement from "@/pages/admin/management/BookingManagement";
import PaymentManagement from "@/pages/admin/management/PaymentManagement";
import AdminAnalytics from "@/pages/admin/AdminAnalytics";
import AdminAnalyticsReportPage from "@/pages/admin/AdminAnalyticsReports";
import AdminHelpDesk from "@/pages/admin/AdminHelpDesk";
import AdminPlugins from "@/pages/admin/AdminPlugins";
import AdminCRM from "@/pages/admin/AdminCRM";
import AdminGlobalSettings from "@/pages/admin/AdminGlobalSettings";
import AdminCMS from "@/pages/admin/AdminCMS";
import AdminStaff from "@/pages/admin/AdminStaff";
import AdminMarketing from "@/pages/admin/AdminMarketing";
import AdminProtectedRoute from "@/components/admin/AdminProtectedRoute";
import Profile from "@/components/admin/Profile";
import NotFound from "@/pages/admin/NotFound";
import Notifications from "@/pages/admin/Notifications";
import Help from "@/pages/admin/Help";
import AdminSEOMeta from "@/components/admin/AdminSEOMeta";

// Match the Frontend SPA's defaults so the migration patterns we use
// across both apps share a single mental model:
//   - 30s stale time keeps page-to-page navigation snappy
//   - retry once on transient failures, then surface
//   - no refetch on window focus / no auto-retry on remount
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
      retryOnMount: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

// Renamed from `App` to `AdminApp` so the parent router (Frontend's App.tsx)
// can mount it at /admin/* without naming collisions. Providers stay scoped
// to admin routes — admin's QueryClient/AuthProvider only wrap admin pages.
export const AdminApp = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="travel-dashboard-theme">
      <AuthProvider>
        <TooltipProvider>
          {/* Toasts render via the global <Sonner/> mounted in App.tsx — a
              second instance here would double-render every admin toast. */}
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
              path="/management"
              element={
                <AdminProtectedRoute>
                  <ManagementOverview />
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
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default AdminApp;
