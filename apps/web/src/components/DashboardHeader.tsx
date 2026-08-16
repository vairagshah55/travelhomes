import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Bell, Menu, LayoutDashboard, Plus } from "lucide-react";
import { BRAND_VARS, BTN_PRIMARY } from "@/components/shared";
import { cn } from "@/lib/utils";
import { Sidebar } from "./Navigation";
import ProfileDropdown from "./ProfileDropdown";
import ChangePasswordModal from "./ChangePasswordModal";
import { ThemeToggle } from "./ThemeToggle";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { notificationsApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

/**
 * Vendor top bar — geometry and chrome mirror AdminHeader so the two consoles
 * read as one product: 84px tall (lines up with the sidebar brand row), the
 * same `px-4 md:px-5 2xl:px-10` gutter as the admin header/content, glass
 * surface + hairline bottom border, and 44px (size-11) circular controls.
 *
 * The vendor keeps its page title in the bar (unlike admin, whose title lives
 * in the content area) because several vendor pages render no <h1> of their own.
 */

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
  // Only ancestor crumbs render — the last one is the title right below it.
  const trail = crumbs.slice(0, -1);

  const handleSwitchToUser = async () => {
    await updateUserType("user");
    navigate("/");
  };

  return (
    <header
      data-animate-header
      className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 md:px-5 2xl:px-10 h-[84px] shrink-0 bg-[#f1f8f7] dark:bg-gray-900 backdrop-blur-xl border-b border-[#dce7e5] dark:border-gray-800 shadow-tpl-1 motion-dashboard-header"
    >
      {/* ── Left — mobile drawer trigger + title/breadcrumbs ── */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <button
              className="lg:hidden shrink-0 rounded-lg border border-[#dce7e5] dark:border-gray-700 px-1.5 py-1 text-[#101828] dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Open sidebar"
            >
              <Menu size={20} />
              <span className="sr-only">Toggle Sidebar</span>
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 motion-mobile-sidebar">
            <Sidebar forceExpanded />
          </SheetContent>
        </Sheet>

        {/* Title + breadcrumbs — breadcrumb type matches AdminHeader
            (12px / gray-400 / "/" separators) and hides below md so the
            84px bar never crowds on small screens. */}
        <div className="flex flex-col justify-center min-w-0">
          {trail.length > 0 && (
            <nav
              aria-label="Breadcrumb"
              className="mb-1 hidden md:flex items-center text-[12px] font-medium text-gray-400 dark:text-gray-500"
            >
              <Link
                to="/dashboard"
                className="flex items-center justify-center w-5 h-5 rounded hover:text-app-accent transition-colors"
                aria-label="Vendor dashboard"
              >
                <LayoutDashboard size={13} strokeWidth={1.75} />
              </Link>
              {trail.map((crumb) => (
                <React.Fragment key={crumb.href}>
                  <span className="mx-1 select-none">/</span>
                  <Link
                    to={crumb.href}
                    className="px-1 rounded hover:text-app-accent transition-colors truncate max-w-[160px]"
                  >
                    {crumb.label}
                  </Link>
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
            className="text-[18px] sm:text-[20px] font-bold text-gray-900 dark:text-white tracking-tight font-geist leading-tight truncate"
          >
            {Headtitle}
          </motion.h1>
        </div>
      </div>

      {/* ── Right — create, theme, notifications, account (all size-11) ── */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0">
        {/* Creating a booking is the vendor's most common write action, so it
            lives in the chrome rather than on one page. Matches the 44px
            control height of the bell/avatar; collapses to icon-only on
            phones, where the label would crowd the 84px bar. */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate("/bookings/new")}
          style={BRAND_VARS}
          aria-label="New booking"
          className={cn(
            BTN_PRIMARY,
            // BTN_PRIMARY assumes shadcn <Button> for layout; this is a raw
            // motion.button, so it brings its own flex.
            "inline-flex items-center justify-center whitespace-nowrap",
            "h-11 rounded-full px-0 w-11 sm:w-auto sm:px-5 text-[13px]",
          )}
        >
          <Plus size={16} strokeWidth={2.6} />
          <span className="hidden sm:inline">New booking</span>
        </motion.button>

        <ThemeToggle />

        {/* Notifications — circular button with red ping dot */}
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={() => navigate("/notifications")}
          className="relative grid place-items-center size-11 rounded-full border border-[#eceff3] dark:border-gray-700 bg-[#f3f4f6] dark:bg-gray-800 hover:bg-[#eef0f3] dark:hover:bg-gray-700 text-[#475467] dark:text-gray-300 hover:text-[#101828] dark:hover:text-white transition-colors"
          aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        >
          <Bell size={18} strokeWidth={1.75} />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                className="absolute -top-1 -right-1 grid place-items-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#f23030] text-white text-[10px] font-bold leading-none ring-2 ring-white dark:ring-gray-900"
              >
                <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#f23030] opacity-60" />
                {unreadCount > 99 ? "99+" : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

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
