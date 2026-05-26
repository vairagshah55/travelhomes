import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, HelpCircle, LayoutDashboard, Menu, Search } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import AdminCommandPalette from "./AdminCommandPalette";

/**
 * Admin top bar. Owns:
 *   - Mobile sidebar trigger
 *   - Breadcrumb trail (auto-derived from URL)
 *   - Page title + optional subtitle
 *   - Per-page action slot
 *   - Notifications, theme toggle, help, view-site shortcut
 *
 * Deliberately no profile dropdown here — identity lives in the sidebar
 * user card so the header stays focused on page context, not chrome.
 */

const ROUTE_LABELS: Record<string, string> = {
  admin: "Admin",
  dashboard: "Dashboard",
  management: "Management",
  listing: "Listings",
  user: "Users",
  vendor: "Vendors",
  booking: "Bookings",
  payments: "Payments",
  "help-desk": "Help Desk",
  analytics: "Analytics",
  report: "Reports",
  marketing: "Marketing",
  cms: "CMS",
  crm: "CRM",
  plugins: "Plugins",
  staff: "Staff",
  roles: "Roles",
  permissions: "Permissions",
  "global-settings": "Settings",
  notifications: "Notifications",
  profile: "Profile",
  help: "Help",
};

const isId = (s: string) =>
  /^[a-f0-9]{24}$/i.test(s) || /^[0-9a-fA-F-]{36}$/.test(s) || /^\d+$/.test(s);

function useBreadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);
  const trail = segments[0] === "admin" ? segments.slice(1) : segments;
  return trail.map((seg, i) => ({
    label: isId(seg) ? "Details" : (ROUTE_LABELS[seg] ?? seg),
    href: "/admin/" + trail.slice(0, i + 1).join("/"),
    isLast: i === trail.length - 1,
  }));
}

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  onOpenMobileSidebar?: () => void;
}

export default function AdminHeader({
  title,
  subtitle,
  actions,
  onOpenMobileSidebar,
}: AdminHeaderProps) {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const token =
          localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");
        const res = await fetch("/api/admin/notifications/unread-count", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data?.count ?? data?.data?.count ?? 0);
        }
      } catch {
        // silently ignore — header polling shouldn't surface errors
      }
    };
    fetchUnread();
    const id = setInterval(fetchUnread, 60_000);
    return () => clearInterval(id);
  }, []);

  const crumbs = useBreadcrumbs();
  const isNested = crumbs.length > 1;

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 sm:px-5 py-3 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shrink-0">
      {/* Left side */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile menu */}
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden -ml-1 h-8 w-8 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors shrink-0"
          aria-label="Open sidebar"
        >
          <Menu size={20} />
        </button>

        {/* Title block — compact breadcrumb stacked above title */}
        <div className="min-w-0 flex flex-col justify-center">
          {isNested && (
            <nav
              aria-label="Breadcrumb"
              className="hidden md:flex items-center mb-0.5 text-[11px] font-medium text-gray-500 dark:text-gray-400"
            >
              <Link
                to="/admin/dashboard"
                className="flex items-center justify-center w-5 h-5 rounded text-gray-400 dark:text-gray-500 hover:text-ocean-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Admin dashboard"
              >
                <LayoutDashboard size={12} strokeWidth={1.75} />
              </Link>
              {crumbs.slice(0, -1).map((crumb) => (
                <React.Fragment key={crumb.href}>
                  <span className="mx-1 text-gray-300 dark:text-gray-700 select-none">/</span>
                  <Link
                    to={crumb.href}
                    className="px-1 rounded hover:text-ocean-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors truncate max-w-[140px]"
                  >
                    {crumb.label}
                  </Link>
                </React.Fragment>
              ))}
            </nav>
          )}

          <AnimatePresence mode="wait">
            <motion.h1
              key={title}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -4 }}
              transition={{ duration: 0.16, ease: "easeOut" }}
              className="text-[17px] font-bold text-gray-900 dark:text-white tracking-tight leading-tight truncate font-geist"
            >
              {title}
            </motion.h1>
          </AnimatePresence>

          {subtitle && (
            <p className="mt-0.5 text-[12px] text-gray-500 dark:text-gray-400 truncate leading-tight">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right actions — anchored tight to the right edge */}
      <div className="flex items-center gap-1 shrink-0">
        {actions && <div className="hidden sm:flex items-center mr-2">{actions}</div>}

        {/* Command palette trigger — compact icon button. ⌘K still works globally. */}
        <button
          onClick={() => setPaletteOpen(true)}
          className="hidden md:flex h-8 w-8 items-center justify-center rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Search (⌘K)"
          title="Search (⌘K)"
        >
          <Search size={15} strokeWidth={1.75} />
        </button>

        {/* Help */}
        <button
          onClick={() => navigate("/admin/help")}
          className="hidden md:flex h-8 w-8 items-center justify-center rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Help"
          title="Help"
        >
          <HelpCircle size={16} strokeWidth={1.75} />
        </button>

        <ThemeToggle />

        {/* Notifications */}
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={() => navigate("/admin/notifications")}
          className="relative h-8 w-8 flex items-center justify-center rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={16} strokeWidth={1.75} />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                className="absolute top-0.5 right-0.5 min-w-[15px] h-[15px] px-1 bg-red-500 rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-900"
              >
                <span className="text-[9px] font-bold text-white leading-none">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      <AdminCommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </header>
  );
}
