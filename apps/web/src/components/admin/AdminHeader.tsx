import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  ChevronUp,
  HelpCircle,
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

interface AdminHeaderProps {
  title: string;
  onOpenMobileSidebar?: () => void;
}

export default function AdminHeader({ title, onOpenMobileSidebar }: AdminHeaderProps) {
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

  return (
    <header
      data-admin-skin="teal"
      className="dark sticky top-0 z-30 flex items-center justify-between gap-4 px-4 md:px-5 2xl:px-10 h-[84px] bg-[var(--glass-header)] backdrop-blur-xl border-b border-tpl-stroke shrink-0 shadow-tpl-1"
    >
      {/* Left — mobile menu button only. The page title now lives in the
          content area (AdminPageTitle); the empty flex-1 balances the right
          cluster so the search stays centered. */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden rounded-lg border border-tpl-stroke dark:border-tpl-stroke px-1.5 py-1 text-tpl-dark dark:bg-tpl-body-bg dark:text-tpl-dark hover:bg-gray-50 dark:hover:bg-[#0a0a0a]/10 transition-colors shrink-0"
          aria-label="Open sidebar"
        >
          <Menu size={20} />
          <span className="sr-only">Toggle Sidebar</span>
        </button>
      </div>

      {/* Center — search, truly centered between the flex-1 title (left) and
          the flex-1 account cluster (right). */}
      <button
        onClick={() => setPaletteOpen(true)}
        className="group hidden xl:flex items-center gap-2.5 pl-4 pr-2 h-11 rounded-full bg-white text-gray-500 text-[14px] font-medium shadow-[0_2px_10px_rgba(0,0,0,0.10)] hover:shadow-[0_6px_18px_rgba(0,0,0,0.16)] transition-shadow w-[340px] focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#3bd9d9] outline-none shrink-0"
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
        className="xl:hidden grid place-items-center size-11 rounded-full border border-[#0a0a0a]/15 bg-[#0a0a0a]/[0.07] hover:bg-[#0a0a0a]/[0.13] text-[#0a0a0a]/80 hover:text-[#0a0a0a] transition-colors shrink-0"
        aria-label="Search (⌘K)"
      >
        <Search size={18} />
      </button>

      {/* Right — notifications + account, pinned to the right edge. */}
      <div className="flex items-center gap-2 md:gap-3 shrink-0 flex-1 justify-end">
        {/* Notifications — circular button with red ping dot */}
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={() => navigate("/admin/notifications")}
          className="relative grid place-items-center size-11 rounded-full border border-[#0a0a0a]/15 bg-[#0a0a0a]/[0.07] hover:bg-[#0a0a0a]/[0.13] text-[#0a0a0a]/80 hover:text-[#0a0a0a] transition-colors"
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
                className="absolute -top-1 -right-1 grid place-items-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#0a0a0a] text-white text-[10px] font-bold leading-none ring-2 ring-[#3bd9d9]"
              >
                <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#0a0a0a] opacity-50" />
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
            <AvatarFallback className="bg-[#0a0a0a] text-white text-[13px] font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          {/* Name + chevron hidden below lg (1024px) — matches template's
              max-[1024px]:sr-only behavior so the header doesn't overflow
              on mid-size viewports. */}
          <figcaption className="hidden lg:flex items-center gap-1 font-medium text-tpl-dark dark:text-tpl-dark">
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
