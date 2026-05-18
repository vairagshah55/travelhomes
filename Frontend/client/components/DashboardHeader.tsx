import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Bell, Menu, ChevronRight, LayoutDashboard } from "lucide-react";
import { Sidebar } from "./Navigation";
import ProfileDropdown from "./ProfileDropdown";
import ChangePasswordModal from "./ChangePasswordModal";
import { ThemeToggle } from "./ThemeToggle";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { notificationsApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

// ─── Breadcrumb label map ─────────────────────────────────────────────────────
const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  bookings: "Bookings",
  details: "Booking Details",
  offering: "Offerings",
  add: "Add Offering",
  edit: "Edit",
  revenue: "Revenue",
  marketing: "Marketing",
  offers: "Offers",
  analytics: "Analytics",
  dashchat: "Chat",
  "vendor-chat": "Chat",
  settings: "Settings",
  account: "Account",
  preferences: "Preferences",
  notifications: "Notifications",
  profile: "Profile",
  "user-profile": "User Profile",
  help: "Help",
};

const isId = (s: string) =>
  /^[a-f0-9]{24}$/i.test(s) || /^[0-9a-fA-F-]{36}$/.test(s) || /^\d+$/.test(s);

function useBreadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);

  return segments.map((seg, i) => ({
    label: isId(seg) ? "Details" : (ROUTE_LABELS[seg] ?? seg),
    href: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));
}

export function DashboardHeader({ Headtitle }: { Headtitle: string }) {
  const navigate = useNavigate();
  const { updateUserType } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  // Poll for unread vendor notifications every 30s. useQuery dedupes if
  // multiple Header instances ever mount on the same page (which can
  // happen briefly during page transitions) and silences itself on
  // failure (errors return 0 instead of throwing).
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications", "unread", "vendor"],
    queryFn: async () => {
      const res = await notificationsApi.list(true, 1, "vendor");
      return res.success ? res.totalUnread : 0;
    },
    refetchInterval: 30_000,
    staleTime: 25_000,
    retry: false,
  });

  const crumbs = useBreadcrumbs();
  const isNested = crumbs.length > 1;

  const handleSwitchToUser = async () => {
    await updateUserType("user");
    navigate("/user-profile");
  };

  return (
    <header
      data-animate-header
      className="flex items-center justify-between px-4 py-2.5 sm:px-6 bg-dashboard-bg dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-30 motion-dashboard-header"
    >
      {/* ── Left ── */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile drawer trigger */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden h-8 w-8 text-gray-500 dark:text-gray-400"
            >
              <Menu size={20} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 motion-mobile-sidebar">
            <Sidebar forceExpanded />
          </SheetContent>
        </Sheet>

        {/* Title + breadcrumbs */}
        <div className="flex flex-col justify-center min-w-0">
          {/* Breadcrumb trail — only on nested routes */}
          {isNested && (
            <nav aria-label="Breadcrumb" className="flex items-center gap-0.5 mb-0.5">
              {/* Dashboard home icon always first */}
              <Link
                to="/dashboard"
                className="flex items-center text-gray-400 hover:text-[#185FA5] transition-colors duration-150"
              >
                <LayoutDashboard size={11} />
              </Link>
              {crumbs.map((crumb, i) => (
                <React.Fragment key={crumb.href}>
                  <ChevronRight
                    size={10}
                    className="text-gray-300 dark:text-gray-700 flex-shrink-0"
                  />
                  {crumb.isLast ? (
                    <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 truncate">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      to={crumb.href}
                      className="text-[11px] text-gray-400 dark:text-gray-500 hover:text-[#185FA5] transition-colors duration-150 truncate"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </React.Fragment>
              ))}
            </nav>
          )}

          {/* Page title */}
          <motion.h1
            key={Headtitle}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.18 }}
            className="text-base sm:text-lg font-bold text-gray-900 dark:text-white tracking-tight font-geist leading-tight truncate"
          >
            {Headtitle}
          </motion.h1>
        </div>
      </div>

      {/* ── Right ── */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Switch to User */}
        <button
          onClick={handleSwitchToUser}
          className="hidden sm:flex items-center gap-1.5 rounded-full px-4 h-9 text-sm font-semibold bg-gray-900 text-white hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          Switch to User
        </button>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Notifications */}
        <button
          onClick={() => navigate("/notifications")}
          className="relative bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm h-9 w-9 flex items-center justify-center hover:shadow-md hover:border-blue-300 transition-all duration-200 group"
        >
          <Bell
            size={18}
            className="text-gray-500 dark:text-gray-300 group-hover:text-blue-500 transition-colors"
          />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[8px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-gray-800"
              >
                {unreadCount > 9 ? "9+" : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Profile */}
        <ProfileDropdown
          onViewAsUserClick={() => {}}
          onSwitchToUserClick={handleSwitchToUser}
          onBusinessDetailsClick={() => navigate("/profile?tab=business")}
          onPersonalDetailsClick={() => navigate("/profile?tab=personal")}
          onChangePasswordClick={() => setIsChangePasswordOpen(true)}
          onLogoutClick={() => {}}
        />

        <ChangePasswordModal isOpen={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen} />
      </div>
    </header>
  );
}
