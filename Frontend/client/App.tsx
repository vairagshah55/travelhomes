import "./global.css";
import "./styles/tokens.css";
import "./styles/animations.css";

import React, { lazy, Suspense, useLayoutEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
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
import SEOMeta from "./components/SEOMeta";
import ScrollToTop from "./components/ScrollToTop";
import RouteFallback from "./components/RouteFallback";
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
const BookingDetails = lazy(() => import("./pages/BookingDetails"));
const Offering = lazy(() => import("./pages/Offering"));
const AddOfferings = lazy(() => import("./pages/AddOfferings"));
const EditOfferings = lazy(() => import("./pages/EditOfferings"));
const OfferingDetails = lazy(() => import("./pages/productDetailes/OfferingDetails"));
const Revenue = lazy(() => import("./pages/Revenue"));
const Marketing = lazy(() => import("./pages/Marketing"));
const Offers = lazy(() => import("./pages/Offers"));
const Analytics = lazy(() => import("./pages/Analytics"));

// ─── Chat / settings / profile ─────────────────────────────────────────────
const Chat = lazy(() => import("./pages/Chat"));
const VendorChat = lazy(() => import("./pages/VendorChat"));
const DashboardChat = lazy(() => import("./pages/DashboardChat"));
const Settings = lazy(() => import("./pages/Settings"));
const Profile = lazy(() => import("./pages/Profile"));
const Notifications = lazy(() => import("./pages/Notifications"));

// ─── Search + product detail ───────────────────────────────────────────────
const SearchResults = lazy(() => import("./pages/SearchResults"));
const CamperVanDetails = lazy(() => import("./pages/productDetailes/CamperVanDetails"));
const UniqueStayDetails = lazy(() => import("./pages/productDetailes/UniqueStayDetails"));
const ActivityDetails = lazy(() => import("./pages/productDetailes/ActivityDetails"));
const Payment = lazy(() => import("./pages/productDetailes/Payment"));

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

const queryClient = new QueryClient();

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
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/search" element={<SearchResults />} />
                  <Route path="/search-results" element={<SearchResults />} />
                  <Route path="/campervan/:id" element={<CamperVanDetails />} />
                  <Route path="/unique-stay/:id" element={<UniqueStayDetails />} />
                  <Route path="/activity/:id" element={<ActivityDetails />} />

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

                  {/* Protected routes */}
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
                    path="/chat"
                    element={
                      <ProtectedRoute allowedRoles={["vendor", "user"]}>
                        <Chat />
                      </ProtectedRoute>
                    }
                  />
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
                  <Route
                    path="/notifications"
                    element={
                      <ProtectedRoute>
                        <Notifications />
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/terms" element={<TermsAndConditions />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />

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

createRoot(document.getElementById("root")!).render(<App />);
