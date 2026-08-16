import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  ChevronRight,
  ChevronUp,
  HelpCircle,
  LogOut,
  Menu,
  Search,
  Settings,
  User as UserIcon,
} from "lucide-react";
import { useAdminBreadcrumbs } from "./adminNav";
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
import { MENU_ITEM, MENU_ITEM_DANGER, PORTAL_VARS } from "./adminUI";

/**
 * Admin top bar.
 *
 * Layout: hamburger (mobile) → breadcrumb trail → search + notifications + help
 * + account on the right. The page TITLE lives in the content area
 * (AdminPageTitle); the bar carries location and utilities only, so it stays
 * slim at the sidebar brand row's 56px.
 *
 * The breadcrumb sits here rather than in the page band because it answers
 * "where am I in the product", which is chrome, while the band answers "what is
 * this page and what can I do with it". It was previously drawn in both places
 * on nested routes.
 *
 * The bar is white, so controls are defined by a hairline rather than a fill —
 * a grey pill on white reads as a smudge, and a white pill on white would be
 * invisible without the border. Hover and focus move that hairline to blue and
 * tint the glyph, instead of swapping the fill, so nothing shifts weight as the
 * cursor crosses the bar.
 */

/** Shared silhouette for the 32px square controls (search, bell). */
const CTRL =
  "text-[#4b5565] hover:text-[#121926] hover:bg-[#f0f2f6] " +
  "focus-visible:ring-2 focus-visible:ring-[#2563eb]/35 outline-none " +
  "transition-[color,background-color] duration-150";

interface AdminHeaderProps {
  title: string;
  onOpenMobileSidebar?: () => void;
  onOpenPalette?: () => void;
}

/**
 * Location trail. Intermediate segments are links; the current page is plain
 * text. Below `sm` only the last two crumbs render — a four-level trail wraps
 * the bar onto a second line on a phone.
 */
function HeaderBreadcrumb() {
  const crumbs = useAdminBreadcrumbs();
  if (crumbs.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center gap-0.5 min-w-0 text-[12.5px] font-medium text-app-fg-subtle"
    >
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        // Hide everything but the final two on narrow viewports.
        const hideSmall = i < crumbs.length - 2;
        return (
          <React.Fragment key={crumb.href}>
            {i > 0 && (
              <ChevronRight
                size={12}
                strokeWidth={2.2}
                aria-hidden
                className={`shrink-0 opacity-40 ${hideSmall ? "hidden sm:block" : ""}`}
              />
            )}
            {isLast ? (
              <span
                aria-current="page"
                className="px-1 font-semibold text-app-fg truncate max-w-[220px]"
              >
                {crumb.label}
              </span>
            ) : (
              <Link
                to={crumb.href}
                className={`px-1 py-0.5 rounded truncate max-w-[150px] hover:text-app-accent transition-colors ${
                  hideSmall ? "hidden sm:block" : ""
                }`}
              >
                {crumb.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

export default function AdminHeader({
  title,
  onOpenMobileSidebar,
  onOpenPalette,
}: AdminHeaderProps) {
  const navigate = useNavigate();
  const { data: unreadCount = 0 } = useNotificationCount();

  // Sync the browser tab title with the current admin page. Restores the
  // default when leaving the admin (AdminHeader unmounts).
  useEffect(() => {
    if (title) document.title = `${title} · Travel Homes`;
    return () => {
      document.title = "Travel Homes";
    };
  }, [title]);

  return (
    /* 56px, not 84px. The bar carries three small controls; at 84 it was mostly
       empty and pushed the page's real heading a third of the way down the
       screen. Utility chrome should be quiet and thin — the page owns the
       vertical budget. */
    <header
      data-admin-skin="teal"
      className="sticky top-0 z-30 flex items-center gap-3 px-3 md:px-4 h-14 bg-[var(--glass-header)] backdrop-blur-xl border-b border-tpl-stroke shrink-0"
    >
      <button
        onClick={onOpenMobileSidebar}
        className={`lg:hidden grid place-items-center size-8 rounded-md shrink-0 ${CTRL}`}
        aria-label="Open sidebar"
      >
        <Menu size={18} />
        <span className="sr-only">Toggle Sidebar</span>
      </button>

      {/* Left — where am I. Takes the free space so the utilities stay pinned
          right regardless of trail length. */}
      <div className="flex-1 min-w-0">
        <HeaderBreadcrumb />
      </div>

      {/* Right — search, then utilities, then identity. */}
      <div className="flex items-center gap-1 shrink-0">
        <motion.button
          whileTap={{ scale: 0.99 }}
          onClick={onOpenPalette}
          className={`group hidden md:flex items-center gap-2 pl-2.5 pr-1.5 h-8 rounded-md w-[240px] shrink-0 text-[13px]
            border border-[#e5e8ee] bg-[#f7f8fa] hover:bg-white hover:border-[#d3d8e0]
            focus-visible:ring-2 focus-visible:ring-[#2563eb]/35 outline-none
            transition-[background-color,border-color] duration-150`}
          aria-label="Search (⌘K)"
        >
          <Search size={15} strokeWidth={2} className="text-[#9aa4b2] shrink-0" />
          <span className="flex-1 text-left text-[#8a94a6]">Search anything…</span>
          <kbd className="text-[10.5px] font-medium font-sans px-1.5 py-0.5 rounded border border-[#e5e8ee] bg-white text-[#9aa4b2] leading-none">
            ⌘K
          </kbd>
        </motion.button>

        {/* Compact search trigger — icon only, below md. */}
        <button
          onClick={onOpenPalette}
          className={`md:hidden grid place-items-center size-8 rounded-md shrink-0 ${CTRL}`}
          aria-label="Search (⌘K)"
        >
          <Search size={17} />
        </button>

        <button
          onClick={() => navigate("/admin/help")}
          className={`hidden sm:grid place-items-center size-8 rounded-md shrink-0 ${CTRL}`}
          aria-label="Help and support"
        >
          <HelpCircle size={17} strokeWidth={1.85} />
        </button>

        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={() => navigate("/admin/notifications")}
          className={`relative grid place-items-center size-8 rounded-md ${CTRL}`}
          aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
        >
          <Bell size={17} strokeWidth={1.85} />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                className="absolute top-0.5 right-0.5 grid place-items-center min-w-[15px] h-[15px] px-1 rounded-full bg-[#f23030] text-white text-[9.5px] font-bold leading-none ring-2 ring-white"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Hairline between the utility controls and identity — the two are
            different kinds of thing and the bar has no other structure. */}
        <span aria-hidden className="hidden md:block w-px h-5 bg-tpl-stroke mx-1.5" />

        {/* User info — avatar + truncated name + chevron */}
        <HeaderUserInfo />
      </div>
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
      <DropdownMenuTrigger
        className={`group cursor-pointer shrink-0 flex items-center gap-2 h-8 pl-1 pr-1 lg:pr-2 rounded-md
          transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]/35
          ${isOpen ? "bg-[#f0f2f6]" : "hover:bg-[#f0f2f6]"}`}
      >
        <span className="sr-only">My Account</span>
        <figure className="flex items-center gap-2">
          <Avatar className="size-6">
            <AvatarFallback className="bg-[#2563eb] text-white text-[10.5px] font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          {/* Name + chevron hidden below lg so the bar never overflows on
              mid-size viewports. */}
          <figcaption className="hidden lg:flex items-center gap-0.5 font-medium text-[#364152]">
            {isLoading ? (
              <span className="w-16 h-3 rounded bg-tpl-gray-3 animate-pulse" />
            ) : (
              <span className="max-w-24 truncate text-[13px]">{name}</span>
            )}
            <ChevronUp
              size={13}
              strokeWidth={2}
              className={`text-[#9aa4b2] transition-transform duration-200 ${isOpen ? "rotate-0" : "rotate-180"}`}
              aria-hidden
            />
          </figcaption>
        </figure>
      </DropdownMenuTrigger>

      {/* Radix portals this to <body>, outside the admin root, so it carries
          its own token vars — otherwise every `app-*` class below falls back to
          the global palette and the menu renders in the public site's colours. */}
      <DropdownMenuContent
        align="end"
        sideOffset={10}
        style={PORTAL_VARS}
        className="min-w-[268px] rounded-xl border border-app-border bg-app-surface p-0 overflow-hidden shadow-[0_2px_4px_rgba(18,25,38,0.04),0_16px_32px_-12px_rgba(18,25,38,0.18)]"
      >
        {/* Identity row — solid brand avatar, name, muted email */}
        <div className="flex items-center gap-3 px-4 py-3.5">
          <Avatar className="size-11 shrink-0">
            <AvatarFallback className="bg-app-accent text-app-accent-fg text-[14px] font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="text-[14px] font-semibold text-app-fg leading-tight truncate">
              {name}
            </div>
            {email && (
              <div className="text-[12.5px] text-app-fg-muted leading-tight truncate mt-0.5">
                {email}
              </div>
            )}
          </div>
        </div>

        <DropdownMenuSeparator className="bg-app-border m-0" />

        <div className="p-1.5">
          {[
            { icon: UserIcon, label: "View profile", to: "/admin/profile" },
            { icon: Settings, label: "Account settings", to: "/admin/global-settings" },
            { icon: HelpCircle, label: "Help & support", to: "/admin/help" },
          ].map((item) => (
            <DropdownMenuItem
              key={item.to}
              onSelect={() => navigate(item.to)}
              className={MENU_ITEM}
            >
              <item.icon size={16} className="shrink-0 text-app-fg-subtle" />
              {item.label}
            </DropdownMenuItem>
          ))}
        </div>

        <DropdownMenuSeparator className="bg-app-border m-0" />

        <div className="p-1.5">
          <DropdownMenuItem onSelect={handleLogout} className={MENU_ITEM_DANGER}>
            <LogOut size={16} className="shrink-0" />
            Log out
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
