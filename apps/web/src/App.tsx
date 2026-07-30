import "./global.css";
import "./styles/tokens.css";
import "./styles/animations.css";

import React, { lazy, Suspense, useLayoutEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster as HotToaster } from "react-hot-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import OnboardingRedirect from "./components/OnboardingRedirect";
import { DashboardLayoutShell } from "./components/DashboardLayout";
import SEOMeta from "./components/SEOMeta";
import ScrollToTop from "./components/ScrollToTop";
import GenericRouteFallback from "./components/GenericRouteFallback";
import AdminRouteFallback from "./components/admin/AdminRouteFallback";
import ProductDetailsSkeleton from "./components/product-details/ProductDetailsSkeleton";
import { initDashboardAnimations } from "./animations";

// Eager: the homepage drives first paint, NotFound is the 404 fallback.
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Lazy: every other route is code-split into its own chunk so the initial
// bundle stays small. Suspense handles the load with <RouteFallback />.

// ─── Auth ──────────────────────────────────────────────────────────────────
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const VerifyOTP = lazy(() => import("./pages/VerifyOTP"));
const ForgetPassword = lazy(() => import("./pages/ForgetPassword"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const OAuthRedirect = lazy(() => import("./pages/OAuthRedirect"));

// ─── Onboarding ────────────────────────────────────────────────────────────
const ServiceSelection = lazy(() => import("./pages/onboarding/ServiceSelection"));
const CaravanOnboarding = lazy(() => import("./pages/onboarding/CaravanOnboarding"));
const StaysOnboarding = lazy(() => import("./pages/onboarding/StaysOnboarding"));
const ActivityOnboarding = lazy(() => import("./pages/onboarding/ActivityOnboarding"));
const ActivitySelfie = lazy(() => import("./pages/onboarding/ActivitySelfie"));
const OnboardingComplete = lazy(() => import("./pages/onboarding/OnboardingComplete"));
const SelfieVerification = lazy(() => import("./pages/onboarding/SelfieVerification"));
const Congratulations = lazy(() => import("./pages/onboarding/Congratulations"));

// ─── Vendor dashboard ──────────────────────────────────────────────────────
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Bookings = lazy(() => import("./pages/Bookings"));
const NewBooking = lazy(() => import("./pages/NewBooking"));
const EditBooking = lazy(() => import("./pages/EditBooking"));
const BookingDetails = lazy(() => import("./pages/BookingDetails"));
const Offering = lazy(() => import("./pages/Offering"));
const AddOfferings = lazy(() => import("./pages/AddOfferings"));
const EditOfferings = lazy(() => import("./pages/EditOfferings"));
const OfferingDetails = lazy(() => import("./pages/product-details/OfferingDetails"));
const Revenue = lazy(() => import("./pages/Revenue"));
const Marketing = lazy(() => import("./pages/Marketing"));
const Offers = lazy(() => import("./pages/Offers"));
const Analytics = lazy(() => import("./pages/Analytics"));

// ─── Chat / settings / profile ─────────────────────────────────────────────
const Chat = lazy(() => import("./pages/Chat"));
const VendorChat = lazy(() => import("./pages/VendorChat"));
const Settings = lazy(() => import("./pages/Settings"));
const Profile = lazy(() => import("./pages/Profile"));
const Notifications = lazy(() => import("./pages/Notifications"));

// ─── Search + product detail ───────────────────────────────────────────────
const SearchResults = lazy(() => import("./pages/SearchResults"));
const CamperVanDetails = lazy(() => import("./pages/product-details/CamperVanDetails"));
const UniqueStayDetails = lazy(() => import("./pages/product-details/UniqueStayDetails"));
const ActivityDetails = lazy(() => import("./pages/product-details/ActivityDetails"));
const Payment = lazy(() => import("./pages/product-details/Payment"));

// ─── User account ──────────────────────────────────────────────────────────
const UserProfile = lazy(() => import("./pages/UserProfile"));
const UserProfileEdit = lazy(() => import("./pages/UserProfileEdit"));
const UserTrips = lazy(() => import("./pages/UserTrips"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const AccountSettings = lazy(() => import("./pages/AccountSettings"));

// ─── Marketing / static ────────────────────────────────────────────────────
const Help = lazy(() => import("./pages/Help"));
const Blogs = lazy(() => import("./pages/blogs/Blogs"));
const BlogsDetail = lazy(() => import("./pages/blogs/BlogDetials"));
const Host = lazy(() => import("./pages/Hostwithus"));
const About = lazy(() => import("./pages/About"));
const Contact = lazy(() => import("./pages/Contact"));
const Career = lazy(() => import("./pages/Career"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));

// ─── Admin (merged from previous Admin/ app) ──────────────────────────────
// Loaded lazily so user-facing chunks don't include admin code. Mounted at
// /admin/* — see App's Routes block. Admin runs inside this app's
// BrowserRouter (its own BrowserRouter was removed) and brings its own
// QueryClient + AuthProvider scoped to admin routes only.
const AdminApp = lazy(() => import("@/AdminApp").then((m) => ({ default: m.AdminApp })));

// Default query options:
//   - staleTime: 30s — listings, dashboards, and most reads tolerate ~30s
//     of stale data, and this halves the request volume during navigation.
//   - retry: 1 — retry once on transient failures, then surface the error.
//     Network 5xx and timeouts are usually a single transient blip.
//   - refetchOnWindowFocus: false — don't refetch every time a tab regains
//     focus. The default true is too aggressive for this app's read pattern.
//   - retryOnMount: false — if a query is still in error and the component
//     re-mounts (e.g. tab switch), don't immediately re-hit the failed
//     endpoint; let the user click retry or wait for an explicit invalidate.
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

const App = () => {
  useLayoutEffect(() => initDashboardAnimations(), []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="travel-dashboard-theme">
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <HotToaster
              position="top-center"
              toastOptions={{
                duration: 4000,
                className: "motion-hot-toast",
                success: {
                  className: "motion-hot-toast motion-hot-toast-success",
                },
                error: {
                  className: "motion-hot-toast motion-hot-toast-error",
                },
              }}
            />
            <BrowserRouter>
              <ScrollToTop />
              <SEOMeta />
              <Suspense fallback={<GenericRouteFallback />}>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/search" element={<SearchResults />} />
                  <Route path="/search-results" element={<SearchResults />} />
                  {/* Product-detail routes get a skeleton that matches their
                      actual layout (real Header/Footer + content skeleton). The
                      same component is also rendered in-page while react-query
                      fetches stay/vendor data, so cold-visit shows ONE
                      uninterrupted skeleton (not chunk-fallback then in-page
                      skeleton with different visuals). */}
                  <Route
                    path="/campervan/:id"
                    element={
                      <Suspense fallback={<ProductDetailsSkeleton />}>
                        <CamperVanDetails />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/unique-stay/:id"
                    element={
                      <Suspense fallback={<ProductDetailsSkeleton />}>
                        <UniqueStayDetails />
                      </Suspense>
                    }
                  />
                  <Route
                    path="/activity/:id"
                    element={
                      <Suspense fallback={<ProductDetailsSkeleton />}>
                        <ActivityDetails />
                      </Suspense>
                    }
                  />

                  <Route
                    path="/login"
                    element={
                      <PublicRoute>
                        <Login />
                      </PublicRoute>
                    }
                  />
                  <Route
                    path="/register"
                    element={
                      <PublicRoute>
                        <Register />
                      </PublicRoute>
                    }
                  />
                  <Route
                    path="/forgot-password"
                    element={
                      <PublicRoute>
                        <ForgetPassword />
                      </PublicRoute>
                    }
                  />
                  <Route
                    path="/verify-otp"
                    element={
                      <PublicRoute>
                        <VerifyOTP />
                      </PublicRoute>
                    }
                  />
                  <Route path="/auth/google/callback" element={<AuthCallback />} />
                  <Route
                    path="/oauth-redirect"
                    element={
                      <PublicRoute>
                        <OAuthRedirect />
                      </PublicRoute>
                    }
                  />
                  <Route
                    path="/blogs"
                    element={
                      <ProtectedRoute>
                        <Blogs />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/blogsDetials"
                    element={
                      <ProtectedRoute>
                        <BlogsDetail />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/hostwithus"
                    element={
                      <ProtectedRoute>
                        {" "}
                        <Host />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/about"
                    element={
                      <ProtectedRoute>
                        {" "}
                        <About />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/payment"
                    element={
                      <ProtectedRoute>
                        <Payment />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/contact"
                    element={
                      <ProtectedRoute>
                        <Contact />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/career"
                    element={
                      <ProtectedRoute>
                        {" "}
                        <Career />
                      </ProtectedRoute>
                    }
                  />

                  {/* Onboarding routes */}
                  <Route
                    path="/onboarding/service-selection"
                    element={
                      <ProtectedRoute>
                        <ServiceSelection />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/onboarding/caravan"
                    element={
                      <ProtectedRoute>
                        <CaravanOnboarding />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/onboarding/stay"
                    element={
                      <ProtectedRoute>
                        <StaysOnboarding />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/onboarding/activity"
                    element={
                      <ProtectedRoute>
                        <ActivityOnboarding />
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/onboarding/activity-selfie"
                    element={
                      <ProtectedRoute>
                        <ActivitySelfie />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/onboarding/complete"
                    element={
                      <ProtectedRoute>
                        <OnboardingComplete />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/onboarding/selfie-verification"
                    element={
                      <ProtectedRoute>
                        <SelfieVerification />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/onboarding/congratulations"
                    element={
                      <ProtectedRoute>
                        <Congratulations />
                      </ProtectedRoute>
                    }
                  />

                  {/* Dashboard routes — share a persistent layout shell so the
                      sidebar/header stay mounted while only the page content swaps.
                      Inner ProtectedRoute on each child enforces role-specific access. */}
                  <Route
                    element={
                      <ProtectedRoute>
                        <DashboardLayoutShell />
                      </ProtectedRoute>
                    }
                  >
                    <Route
                      path="/dashboard"
                      element={
                        <ProtectedRoute allowedRoles={["vendor"]}>
                          <OnboardingRedirect>
                            <Dashboard />
                          </OnboardingRedirect>
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/bookings"
                      element={
                        <ProtectedRoute allowedRoles={["vendor"]}>
                          <Bookings />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/bookings/new"
                      element={
                        <ProtectedRoute allowedRoles={["vendor"]}>
                          <NewBooking />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/bookings/:id/edit"
                      element={
                        <ProtectedRoute allowedRoles={["vendor"]}>
                          <EditBooking />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/bookings/details"
                      element={
                        <ProtectedRoute allowedRoles={["vendor"]}>
                          <BookingDetails />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/offering"
                      element={
                        <ProtectedRoute allowedRoles={["vendor"]}>
                          <Offering />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/offering/add"
                      element={
                        <ProtectedRoute allowedRoles={["vendor"]}>
                          <AddOfferings />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/offering/:id"
                      element={
                        <ProtectedRoute allowedRoles={["vendor"]}>
                          <OfferingDetails />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/offering/:id/edit"
                      element={
                        <ProtectedRoute allowedRoles={["vendor"]}>
                          <EditOfferings />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/revenue"
                      element={
                        <ProtectedRoute allowedRoles={["vendor"]}>
                          <Revenue />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/marketing"
                      element={
                        <ProtectedRoute allowedRoles={["vendor"]}>
                          <Marketing />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/marketing/offers"
                      element={
                        <ProtectedRoute allowedRoles={["vendor"]}>
                          <Offers />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/analytics"
                      element={
                        <ProtectedRoute allowedRoles={["vendor"]}>
                          <Analytics />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/settings"
                      element={
                        <ProtectedRoute>
                          <Settings />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/settings/account"
                      element={
                        <ProtectedRoute>
                          <Settings />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/settings/preferences"
                      element={
                        <ProtectedRoute>
                          <Settings />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/profile"
                      element={
                        <ProtectedRoute>
                          <Profile />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/notifications"
                      element={
                        <ProtectedRoute>
                          <Notifications />
                        </ProtectedRoute>
                      }
                    />
                    {/* VendorChat lives inside the shell because it uses
                        <DashboardLayout> for its title + content styling.
                        Keeping it outside the shell while the page wraps
                        itself in DashboardLayout was the source of the
                        "two sidebars" double-render. */}
                    <Route
                      path="/dashchat"
                      element={
                        <ProtectedRoute allowedRoles={["vendor"]}>
                          <VendorChat />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/vendor-chat"
                      element={
                        <ProtectedRoute allowedRoles={["vendor"]}>
                          <VendorChat />
                        </ProtectedRoute>
                      }
                    />
                  </Route>

                  {/* Standalone protected routes — full-screen pages without the dashboard shell */}
                  <Route
                    path="/chat"
                    element={
                      <ProtectedRoute allowedRoles={["vendor", "user"]}>
                        <Chat />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/user-profile"
                    element={
                      <ProtectedRoute allowedRoles={["user", "vendor"]}>
                        <UserProfile />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/user-profile-edit"
                    element={
                      <ProtectedRoute allowedRoles={["user", "vendor"]}>
                        <UserProfileEdit />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/user-trips"
                    element={
                      <ProtectedRoute allowedRoles={["user", "vendor"]}>
                        <UserTrips />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/wishlist"
                    element={
                      <ProtectedRoute allowedRoles={["user", "vendor"]}>
                        <Wishlist />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/account-settings"
                    element={
                      <ProtectedRoute>
                        <AccountSettings />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/help"
                    element={
                      <ProtectedRoute>
                        <Help />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/terms" element={<TermsAndConditions />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />

                  {/* Admin sub-app — paths inside AdminApp are interpreted
                      relative to /admin (e.g. /admin/dashboard, /admin/login).
                      Inner Suspense uses a minimal admin-tinted fallback so the
                      lazy chunk load doesn't flash the property-detail skeleton. */}
                  <Route
                    path="/admin/*"
                    element={
                      <Suspense fallback={<AdminRouteFallback />}>
                        <AdminApp />
                      </Suspense>
                    }
                  />

                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
