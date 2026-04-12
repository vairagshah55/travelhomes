import "./global.css";
import "./styles/tokens.css";
import "./styles/animations.css";

import React, { useLayoutEffect } from "react";
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
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyOTP from "./pages/VerifyOTP";
import ForgetPassword from "./pages/ForgetPassword";
import AuthCallback from "./pages/AuthCallback";
import ServiceSelection from "./pages/onboarding/ServiceSelection";
import CaravanOnboarding from "./pages/onboarding/CaravanOnboarding";
import StaysOnboarding from "./pages/onboarding/StaysOnboarding";
import ActivityOnboarding from "./pages/onboarding/ActivityOnboarding";
import ActivitySelfie from "./pages/onboarding/ActivitySelfie";
import OnboardingComplete from "./pages/onboarding/OnboardingComplete";
import SelfieVerification from "./pages/onboarding/SelfieVerification";
import Congratulations from "./pages/onboarding/Congratulations";
import Dashboard from "./pages/Dashboard";
import Bookings from "./pages/Bookings";
import BookingDetails from "./pages/BookingDetails";
// import AddNewBooking from "./pages/AddNewBooking";
import Offering from "./pages/Offering";
import AddOfferings from "./pages/AddOfferings";
import EditOfferings from "./pages/EditOfferings";
import OfferingDetails from "./pages/productDetailes/OfferingDetails";
import Revenue from "./pages/Revenue";
import Marketing from "./pages/Marketing";
import Offers from "./pages/Offers";
import Analytics from "./pages/Analytics";
import Chat from "./pages/Chat";
import VendorChat from "./pages/VendorChat";
import Settings from "./pages/Settings";
import Profile from "./pages/Profile";
import Notifications from "./pages/Notifications";
import NotFound from "./pages/NotFound";
import Index from "./pages/Index";
import SearchResults from "./pages/SearchResults";
import CamperVanDetails from "./pages/productDetailes/CamperVanDetails";
import UniqueStayDetails from "./pages/productDetailes/UniqueStayDetails";
import ActivityDetails from "./pages/productDetailes/ActivityDetails";
import UserProfile from "./pages/UserProfile";
import UserProfileEdit from "./pages/UserProfileEdit";
import UserTrips from "./pages/UserTrips";
import Wishlist from "./pages/Wishlist";
import AccountSettings from "./pages/AccountSettings";
import Help from "./pages/Help";
import Blogs from "./pages/blogs/Blogs";
import BlogsDetail from "./pages/blogs/BlogDetials";
import Host from "./pages/Hostwithus";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Career from "./pages/Career";
import DashboardChat from "./pages/DashboardChat";
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Payment from "./pages/productDetailes/Payment";
import SEOMeta from "./components/SEOMeta";
import ScrollToTop from "./components/ScrollToTop";
import OAuthRedirect from "./pages/OAuthRedirect";
import { initDashboardAnimations } from "./animations";

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
              <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/search-results" element={<SearchResults />} />
              <Route path="/campervan/:id" element={<CamperVanDetails />} />
              <Route path="/unique-stay/:id" element={<UniqueStayDetails />} />
              <Route path="/activity/:id" element={<ActivityDetails />} />
              
              <Route path="/login" element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              } />
              <Route path="/register" element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              } />
              <Route path="/forgot-password" element={
                <PublicRoute>
                  <ForgetPassword />
                </PublicRoute>
              } />
              <Route path="/verify-otp" element={
                <PublicRoute>
                  <VerifyOTP />
                </PublicRoute>
              } />
              <Route path="/auth/google/callback" element={<AuthCallback />} />
            <Route path="/oauth-redirect" element={<PublicRoute><OAuthRedirect /></PublicRoute>} />
 <Route path="/blogs" element={
             
                   <ProtectedRoute><Blogs/></ProtectedRoute> 
               
              } />
               <Route path="/blogsDetials" element={
             
                  <ProtectedRoute><BlogsDetail/></ProtectedRoute>  
               
              } />
               <Route path="/hostwithus" element={
               <ProtectedRoute> <Host/></ProtectedRoute>
                
               
              } />
                   <Route path="/about" element={
               <ProtectedRoute> <About/></ProtectedRoute>
                 
               
              } />
               <Route path="/payment" element={
                <ProtectedRoute>
                  <Payment />
                </ProtectedRoute>
              } />
                    <Route path="/contact" element={
               <ProtectedRoute><Contact/></ProtectedRoute>
                
               
              } />
                     <Route path="/career" element={
               <ProtectedRoute>    <Career/></ProtectedRoute>
              
               
              } />
        

              {/* Onboarding routes */}
              <Route path="/onboarding/service-selection" element={
                <ProtectedRoute >
                  <ServiceSelection />
                </ProtectedRoute>
              } />
              <Route path="/onboarding/caravan" element={
                <ProtectedRoute >
                  <CaravanOnboarding />
                </ProtectedRoute>
              } />
              <Route path="/onboarding/stay" element={
                <ProtectedRoute >
                  <StaysOnboarding />
                </ProtectedRoute>
              } />
              <Route path="/onboarding/activity" element={
                <ProtectedRoute>
                  <ActivityOnboarding />
                </ProtectedRoute>
              } />
             
              <Route path="/onboarding/activity-selfie" element={
                <ProtectedRoute >
                  <ActivitySelfie />
                </ProtectedRoute>
              } />
              <Route path="/onboarding/complete" element={
                <ProtectedRoute >
                  <OnboardingComplete />
                </ProtectedRoute>
              } />
              <Route path="/onboarding/selfie-verification" element={
                <ProtectedRoute >
                  <SelfieVerification />
                </ProtectedRoute>
              } />
              <Route path="/onboarding/congratulations" element={
                <ProtectedRoute >
                  <Congratulations />
                </ProtectedRoute>
              } />

              {/* Protected routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute allowedRoles={['vendor']} >
                  <OnboardingRedirect>
                    <Dashboard />
                  </OnboardingRedirect>
                </ProtectedRoute>
              } />
              <Route path="/bookings" element={
                <ProtectedRoute allowedRoles={['vendor']}>
                  <Bookings />
                </ProtectedRoute>
              } />
              <Route path="/bookings/details" element={
                <ProtectedRoute allowedRoles={['vendor']}>
                  <BookingDetails />
                </ProtectedRoute>
              } />
              {/* <Route path="/bookings/new" element={
                <ProtectedRoute allowedRoles={['vendor']}>
                  <AddNewBooking />
                </ProtectedRoute>
              } />
              <Route path="/add-new-booking" element={
                <ProtectedRoute allowedRoles={['vendor']}>
                  <AddNewBooking />
                </ProtectedRoute>
              } /> */}
              <Route path="/offering" element={
                <ProtectedRoute allowedRoles={['vendor']}>
                  <Offering />
                </ProtectedRoute>
              } />
              <Route path="/offering/add" element={
                <ProtectedRoute allowedRoles={['vendor']}>
                  <AddOfferings />
                </ProtectedRoute>
              } />
              <Route path="/offering/:id" element={
                <ProtectedRoute allowedRoles={['vendor']}>
                  <OfferingDetails />
                </ProtectedRoute>
              } />
              <Route path="/offering/:id/edit" element={
                <ProtectedRoute allowedRoles={['vendor']}>
                  <EditOfferings />
                </ProtectedRoute>
              } />
              <Route path="/revenue" element={
                <ProtectedRoute allowedRoles={['vendor']}>
                  <Revenue />
                </ProtectedRoute>
              } />
              <Route path="/marketing" element={
                <ProtectedRoute allowedRoles={['vendor']}>
                  <Marketing />
                </ProtectedRoute>
              } />
              <Route path="/marketing/offers" element={
                <ProtectedRoute allowedRoles={['vendor']}>
                  <Offers />
                </ProtectedRoute>
              } />
              <Route path="/analytics" element={
                <ProtectedRoute allowedRoles={['vendor']}>
                  <Analytics />
                </ProtectedRoute>
              } />
              <Route path="/chat" element={
                <ProtectedRoute allowedRoles={['vendor','user']}>
                  <Chat />
                </ProtectedRoute>
              } />
                <Route path="/dashchat" element={
                <ProtectedRoute allowedRoles={['vendor']}>
                  <VendorChat/>
                </ProtectedRoute>
              } />
              <Route path="/vendor-chat" element={
                <ProtectedRoute allowedRoles={['vendor']}>
                  <VendorChat />
                </ProtectedRoute>
              } />
              <Route path="/settings" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="/settings/account" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="/settings/preferences" element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/user-profile" element={
                <ProtectedRoute allowedRoles={['user',"vendor"]}>
                  <UserProfile />
                </ProtectedRoute>
              } />
              <Route path="/user-profile-edit" element={
                <ProtectedRoute allowedRoles={['user',"vendor"]}>
                  <UserProfileEdit />
                </ProtectedRoute>
              } />
              <Route path="/user-trips" element={
                <ProtectedRoute allowedRoles={['user','vendor']}>
                  <UserTrips />
                </ProtectedRoute>
              } />
              <Route path="/wishlist" element={
                <ProtectedRoute allowedRoles={['user',"vendor"]}>
                  <Wishlist />
                </ProtectedRoute>
              } />
              <Route path="/account-settings" element={
                <ProtectedRoute>
                  <AccountSettings />
                </ProtectedRoute>
              } />
              <Route path="/help" element={
                <ProtectedRoute>
                  <Help />
                </ProtectedRoute>
              } />
              <Route path="/notifications" element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              } />
              <Route path="/terms" element={
                <TermsAndConditions />
              } />
              <Route path="/privacy" element={
                <PrivacyPolicy />
              } />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

createRoot(document.getElementById("root")!).render(<App />);
