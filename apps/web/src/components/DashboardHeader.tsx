import React, { useState } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Bell, Menu, LayoutDashboard, Search } from "lucide-react";
import { Sidebar } from "./Navigation";
import VendorCommandPalette from "./VendorCommandPalette";
import ProfileDropdown from "./ProfileDropdown";
import ChangePasswordModal from "./ChangePasswordModal";
import { ThemeToggle } from "./ThemeToggle";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { notificationsApi } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";

/**
 * Vendor top bar — the first of the shell's three bands, mirroring AdminHeader:
 * 56px tall (lines up with the sidebar's brand row), hairline bottom border,
 * and location + global controls only.
 *
 * The page TITLE moved out of here into the header band below (AdminPageTitle,
 * rendered by DashboardLayoutShell). It used to live in this bar because there
 * was nowhere else for it, which left an 84px strip holding a title, a
 * breadcrumb, a create button, a theme toggle, a bell and an avatar — and left
 * every page's own primary action floating in the content. The title still
 * arrives as a prop because the mobile bar, which has no band in view, shows it.
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
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

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

  const handleSwitchToUser = async () => {
    await updateUserType("user");
    navigate("/");
  };

  return (
    <header
      data-animate-header
      /* Was `bg-[#f1f8f7] … border-[#dce7e5] … shadow-tpl-1`: two literals and
         a dead class — `shadow-tpl-1` reads `--tpl-shadow-1`, which is declared
         only in admin.css and so resolved to nothing on every vendor route.
         Now on the `app-*` tokens, which ARE defined in global.css, matching
         the admin's white chrome over a light page ground. */
      className="sticky top-0 z-30 flex items-center justify-between gap-3 px-3 md:px-4 2xl:px-6 h-14 shrink-0 bg-app-surface backdrop-blur-xl border-b border-app-border motion-dashboard-header"
    >
      {/* ── Left — mobile drawer trigger + title/breadcrumbs ── */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <button
              className="lg:hidden shrink-0 rounded-lg border border-app-border px-1.5 py-1 text-app-fg hover:bg-app-surface-2 transition-colors"
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

        {/* Breadcrumb — the FULL trail now, including the current page: the
            title it used to defer to has moved down into the band. Hidden below
            md, where the title beside it is the only location cue that fits. */}
        <nav
          aria-label="Breadcrumb"
          className="hidden md:flex items-center min-w-0 text-[12px] font-medium text-app-fg-subtle"
        >
          <Link
            to="/dashboard"
            className="flex items-center justify-center w-5 h-5 rounded hover:text-app-accent transition-colors"
            aria-label="Vendor dashboard"
          >
            <LayoutDashboard size={13} strokeWidth={1.75} />
          </Link>
          {crumbs.map((crumb) => (
            <React.Fragment key={crumb.href}>
              <span className="mx-1 select-none">/</span>
              {crumb.isLast ? (
                <span
                  aria-current="page"
                  className="px-1 font-semibold text-app-fg truncate max-w-[200px]"
                >
                  {crumb.label}
                </span>
              ) : (
                <Link
                  to={crumb.href}
                  className="px-1 rounded hover:text-app-accent transition-colors truncate max-w-[160px]"
                >
                  {crumb.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>

        {/* Phones get the title here: the band's own <h1> is below the fold on
            a small screen, and a bar with only a hamburger reads as broken. */}
        <motion.span
          key={Headtitle}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.18 }}
          className="md:hidden text-[15px] font-bold text-app-fg tracking-tight truncate"
        >
          {Headtitle}
        </motion.span>
      </div>

      {/* ── Right — search, theme, notifications, account (36px controls) ──
          The global "New booking" button that used to sit here is gone. A
          create button in the chrome competes with whatever the CURRENT page's
          primary action is — on /offering it sat beside "Add offering" and both
          read as the page's main verb — and it hardcoded one of three create
          flows into every screen. Creating now happens where the thing lives,
          plus the palette's Create group from anywhere. */}
      <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
        {/* Search opens the ⌘K palette. It is a button styled as a field rather
            than a real input: there is no such thing as searching "in the
            header" — every query resolves to a destination or an action, which
            is what the palette does. */}
        <button
          onClick={() => setIsPaletteOpen(true)}
          aria-label="Search pages and actions"
          className="group hidden sm:flex items-center gap-2 h-9 pl-3 pr-2 rounded-lg border border-app-border
            bg-app-surface-2/70 text-app-fg-subtle hover:bg-app-surface-2 hover:text-app-fg-muted
            transition-colors outline-none focus-visible:ring-4 focus-visible:ring-app-accent/20"
        >
          <Search size={15} strokeWidth={2} aria-hidden />
          <span className="text-[13px] font-medium w-24 lg:w-36 text-left">Search…</span>
          <kbd className="hidden lg:inline-flex items-center gap-0.5 h-5 px-1.5 rounded border border-app-border bg-app-surface text-[10.5px] font-semibold text-app-fg-subtle">
            ⌘K
          </kbd>
        </button>
        <button
          onClick={() => setIsPaletteOpen(true)}
          aria-label="Search pages and actions"
          className="sm:hidden grid place-items-center size-9 rounded-lg text-app-fg-muted hover:bg-app-surface-2 hover:text-app-fg transition-colors"
        >
          <Search size={17} strokeWidth={1.9} />
        </button>

        <ThemeToggle />

        {/* Notifications. The badge no longer `animate-ping`s: a red dot
            pulsing forever is not an alert, it is a permanent distraction, and
            unread counts here sit above zero most of the day. */}
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={() => navigate("/notifications")}
          className="relative grid place-items-center size-9 rounded-lg text-app-fg-muted hover:bg-app-surface-2 hover:text-app-fg transition-colors"
          aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        >
          <Bell size={17} strokeWidth={1.9} />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 grid place-items-center min-w-[17px] h-[17px] px-1 rounded-full bg-red-600 text-white text-[10px] font-bold leading-none tabular-nums ring-2 ring-app-surface">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
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
        {/* Mounted once, here — the palette owns the global ⌘K listener. */}
        <VendorCommandPalette open={isPaletteOpen} onOpenChange={setIsPaletteOpen} />
      </div>
    </header>
  );
}
