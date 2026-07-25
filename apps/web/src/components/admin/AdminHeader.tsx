import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  ChevronUp,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings,
  User as UserIcon,
} from "lucide-react";
import AdminCommandPalette from "./AdminCommandPalette";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AdminAuthContext";
import { getInitials } from "@/utils/getInitials";
import { useNotificationCount } from "@/hooks/admin/useNotifications";

/**
 * Admin top bar — NextAdmin template style.
 *
 * Layout: hamburger (mobile) → page title + subtitle → expandable search pill,
 * theme toggle, circular notification button, user info dropdown on the right.
 *
 * Title comes from the layout prop; breadcrumb still auto-derives from URL but
 * sits above the title for nested pages so users keep their bearings.
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
  const { data: unreadCount = 0 } = useNotificationCount();
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Sync the browser tab title with the current admin page. Restores the
  // default when leaving the admin (AdminHeader unmounts).
  useEffect(() => {
    if (title) document.title = `${title} · Travel Homes`;
    return () => {
      document.title = "Travel Homes";
    };
  }, [title]);

  const crumbs = useBreadcrumbs();
  const isNested = crumbs.length > 1;

  return (
    <header
      data-admin-skin="navy"
      className="dark sticky top-0 z-30 flex items-center justify-between gap-4 px-4 md:px-5 2xl:px-10 py-4 md:py-5 bg-[var(--glass-header)] backdrop-blur-xl border-b border-tpl-stroke shrink-0 shadow-tpl-1"
    >
      {/* Left — mobile menu + page title block. min-w-0 lets the title
          truncate gracefully when the right cluster needs room. */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden rounded-lg border border-tpl-stroke dark:border-tpl-stroke px-1.5 py-1 text-tpl-dark dark:bg-tpl-body-bg dark:text-white hover:bg-gray-50 dark:hover:bg-white/10 transition-colors shrink-0"
          aria-label="Open sidebar"
        >
          <Menu size={20} />
          <span className="sr-only">Toggle Sidebar</span>
        </button>

        <div className="min-w-0 flex flex-col justify-center">
          {isNested && (
            <nav
              aria-label="Breadcrumb"
              className="hidden md:flex items-center mb-1 text-[12px] font-medium text-tpl-dark-5 dark:text-tpl-dark-6"
            >
              <Link
                to="/admin/dashboard"
                className="flex items-center justify-center w-5 h-5 rounded text-tpl-dark-5 dark:text-tpl-dark-6 hover:text-tpl-primary transition-colors"
                aria-label="Admin dashboard"
              >
                <LayoutDashboard size={13} strokeWidth={1.75} />
              </Link>
              {crumbs.slice(0, -1).map((crumb) => (
                <React.Fragment key={crumb.href}>
                  <span className="mx-1 text-tpl-dark-6 select-none">/</span>
                  <Link
                    to={crumb.href}
                    className="px-1 rounded hover:text-tpl-primary transition-colors truncate max-w-[140px]"
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
              className="text-[28px] font-bold text-tpl-dark dark:text-white tracking-tight leading-tight mb-0.5 truncate"
            >
              {title}
            </motion.h1>
          </AnimatePresence>

          {subtitle && (
            <p className="text-[14px] text-tpl-dark-5 dark:text-tpl-dark-6 truncate leading-tight font-medium">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Center — search, truly centered between the flex-1 title (left) and
          the flex-1 account cluster (right). */}
      <button
        onClick={() => setPaletteOpen(true)}
        className="group hidden xl:flex items-center gap-2.5 pl-4 pr-2 h-11 rounded-full bg-white text-gray-500 text-[14px] font-medium shadow-[0_2px_10px_rgba(0,0,0,0.10)] hover:shadow-[0_6px_18px_rgba(0,0,0,0.16)] transition-shadow w-[340px] focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F5C8A] outline-none shrink-0"
        aria-label="Search (⌘K)"
      >
        <Search
          size={18}
          strokeWidth={2}
          className="text-gray-400 group-hover:text-[#0F5C8A] transition-colors"
        />
        <span className="flex-1 text-left">Search…</span>
        <span className="text-[11px] font-mono px-1.5 py-1 rounded-md bg-gray-100 border border-gray-200 text-gray-500 leading-none">
          ⌘K
        </span>
      </button>

      {/* Compact search trigger — icon only, below xl. */}
      <button
        onClick={() => setPaletteOpen(true)}
        className="xl:hidden grid place-items-center size-11 rounded-full border border-white/15 bg-white/10 hover:bg-white/[0.16] text-white/80 hover:text-white transition-colors shrink-0"
        aria-label="Search (⌘K)"
      >
        <Search size={18} />
      </button>

      {/* Right — notifications + account, pinned to the right edge. */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0 flex-1 justify-end">
        {actions && <div className="hidden md:flex items-center mr-1">{actions}</div>}

        {/* Notifications — circular button with red ping dot */}
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={() => navigate("/admin/notifications")}
          className="relative grid place-items-center size-11 rounded-full border border-white/15 bg-white/10 hover:bg-white/[0.16] text-white/80 hover:text-white transition-colors"
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
                className="absolute -top-1 -right-1 grid place-items-center min-w-[18px] h-[18px] px-1 rounded-full bg-tpl-red-light text-white text-[10px] font-bold leading-none ring-2 ring-tpl-gray-2 dark:ring-tpl-dark-2"
              >
                <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-tpl-red-light opacity-60" />
                {unreadCount > 99 ? "99+" : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {/* User info — template UserInfo dropdown: avatar + truncated name + chevron */}
        <HeaderUserInfo />
      </div>

      <AdminCommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </header>
  );
}

/* ── UserInfo dropdown — ported from template's Header user-info ─────────
   48px avatar (template uses size-12), name truncated max-w-24, chevron flips
   open/closed. Menu lists Profile / Settings / Help / Logout. */
function HeaderUserInfo() {
  const navigate = useNavigate();
  const { user, isLoading, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const name = user?.name || "Admin";
  const email = user?.email || "";
  const initials = getInitials(user?.name);

  const handleLogout = () => {
    setIsOpen(false);
    logout();
    navigate("/admin/login");
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger className="cursor-pointer rounded outline-none focus-visible:ring-1 focus-visible:ring-tpl-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-tpl-dark-2 shrink-0">
        <span className="sr-only">My Account</span>
        <figure className="flex items-center gap-3">
          <Avatar className="size-11">
            <AvatarFallback className="bg-white/15 text-white text-[13px] font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          {/* Name + chevron hidden below lg (1024px) — matches template's
              max-[1024px]:sr-only behavior so the header doesn't overflow
              on mid-size viewports. */}
          <figcaption className="hidden lg:flex items-center gap-1 font-medium text-tpl-dark dark:text-white">
            {isLoading ? (
              <span className="w-20 h-3 rounded bg-tpl-gray-3 dark:bg-white/10 animate-pulse" />
            ) : (
              <span className="max-w-24 truncate text-[14px]">{name}</span>
            )}
            <ChevronUp
              size={16}
              strokeWidth={1.5}
              className={`transition-transform ${isOpen ? "rotate-0" : "rotate-180"}`}
              aria-hidden
            />
          </figcaption>
        </figure>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={10}
        className="min-w-[264px] rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg p-0 overflow-hidden"
      >
        {/* Identity row — solid brand avatar, name, muted email */}
        <div className="flex items-center gap-3 px-4 py-3.5">
          <Avatar className="size-11 shrink-0">
            <AvatarFallback className="bg-[#0F5C8A] text-white text-[14px] font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="text-[14px] font-semibold text-gray-900 dark:text-white leading-tight truncate">
              {name}
            </div>
            {email && (
              <div className="text-[12.5px] text-gray-500 dark:text-gray-400 leading-tight truncate mt-0.5">
                {email}
              </div>
            )}
          </div>
        </div>

        <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700 m-0" />

        <div className="p-1.5">
          <DropdownMenuItem
            onSelect={() => navigate("/admin/profile")}
            className="gap-2.5 px-2.5 py-2 cursor-pointer text-gray-700 dark:text-gray-200 focus:bg-gray-100 dark:focus:bg-gray-700/60 focus:text-gray-900 dark:focus:text-white rounded-lg"
          >
            <UserIcon size={17} className="text-gray-400 dark:text-gray-500" />
            <span className="text-[13.5px] font-medium">View profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => navigate("/admin/global-settings")}
            className="gap-2.5 px-2.5 py-2 cursor-pointer text-gray-700 dark:text-gray-200 focus:bg-gray-100 dark:focus:bg-gray-700/60 focus:text-gray-900 dark:focus:text-white rounded-lg"
          >
            <Settings size={17} className="text-gray-400 dark:text-gray-500" />
            <span className="text-[13.5px] font-medium">Account Settings</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => navigate("/admin/help")}
            className="gap-2.5 px-2.5 py-2 cursor-pointer text-gray-700 dark:text-gray-200 focus:bg-gray-100 dark:focus:bg-gray-700/60 focus:text-gray-900 dark:focus:text-white rounded-lg"
          >
            <HelpCircle size={17} className="text-gray-400 dark:text-gray-500" />
            <span className="text-[13.5px] font-medium">Help &amp; support</span>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700 m-0" />

        <div className="p-1.5">
          <DropdownMenuItem
            onSelect={handleLogout}
            className="gap-2.5 px-2.5 py-2 cursor-pointer text-red-600 dark:text-red-400 focus:bg-red-50 dark:focus:bg-red-900/20 focus:text-red-700 dark:focus:text-red-300 rounded-lg"
          >
            <LogOut size={17} />
            <span className="text-[13.5px] font-medium">Log out</span>
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
