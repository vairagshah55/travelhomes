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
 * Admin top bar.
 *
 * Layout: hamburger (mobile) → centered command-palette search → notifications
 * + account on the right. The page title lives in the content area
 * (AdminPageTitle), so the bar stays slim at the sidebar's 84px brand height.
 *
 * Controls are white pills on the faint-teal bar rather than grey-on-grey: the
 * chrome surface is #f1f8f7, so a grey control reads as a smudge. White + a
 * #dce7e5 hairline gives every control the same silhouette, and hover/focus
 * moves that hairline to teal instead of swapping fills.
 */

/** Shared silhouette for the 44px circular controls (search, bell). */
const CTRL =
  "border border-[#dce7e5] bg-white text-[#475467] shadow-[0_1px_2px_rgba(16,24,40,0.04)] " +
  "hover:border-[#3bd9da]/35 hover:text-[#117479] hover:shadow-[0_2px_8px_-2px_rgba(59, 217, 218, 0.5)] " +
  "focus-visible:ring-2 focus-visible:ring-[#3bd9da]/40 focus-visible:ring-offset-2 " +
  "focus-visible:ring-offset-[#f1f8f7] outline-none " +
  "transition-[color,border-color,box-shadow] duration-200";

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
      className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 md:px-5 2xl:px-10 h-[84px] bg-[var(--glass-header)] backdrop-blur-xl border-b border-tpl-stroke shrink-0 shadow-tpl-1"
    >
      {/* Left — mobile menu button only. The page title now lives in the
          content area (AdminPageTitle); the empty flex-1 balances the right
          cluster so the search stays centered. */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <button
          onClick={onOpenMobileSidebar}
          className={`lg:hidden grid place-items-center size-11 rounded-full shrink-0 ${CTRL}`}
          aria-label="Open sidebar"
        >
          <Menu size={20} />
          <span className="sr-only">Toggle Sidebar</span>
        </button>
      </div>

      {/* Center — search, truly centered between the flex-1 spacer (left) and
          the flex-1 account cluster (right). */}
      <motion.button
        whileTap={{ scale: 0.99 }}
        onClick={() => setPaletteOpen(true)}
        className={`group hidden xl:flex items-center gap-2.5 pl-4 pr-2 h-11 rounded-full w-[340px] shrink-0 text-[14px] font-medium ${CTRL}`}
        aria-label="Search (⌘K)"
      >
        <Search
          size={18}
          strokeWidth={2}
          className="text-[#98a2b3] group-hover:text-[#117479] transition-colors"
        />
        <span className="flex-1 text-left text-[#667085] group-hover:text-[#475467] transition-colors">
          Search…
        </span>
        <span className="text-[11px] font-mono px-1.5 py-1 rounded-md bg-[#f1f8f7] border border-[#e3ecea] text-[#98a2b3] leading-none group-hover:border-[#3bd9da]/25 group-hover:text-[#117479] transition-colors">
          ⌘K
        </span>
      </motion.button>

      {/* Compact search trigger — icon only, below xl. */}
      <button
        onClick={() => setPaletteOpen(true)}
        className={`xl:hidden grid place-items-center size-11 rounded-full shrink-0 ${CTRL}`}
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
          className={`relative grid place-items-center size-11 rounded-full ${CTRL}`}
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
                className="absolute -top-1 -right-1 grid place-items-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#f23030] text-white text-[10px] font-bold leading-none ring-2 ring-[#f1f8f7]"
              >
                <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-[#f23030] opacity-60" />
                {unreadCount > 99 ? "99+" : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {/* Hairline between the utility controls and identity — the two are
            different kinds of thing and the bar has no other structure. */}
        <span aria-hidden className="hidden md:block w-px h-7 bg-tpl-stroke mx-0.5" />

        {/* User info — avatar + truncated name + chevron */}
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
      {/* The account control is a pill, not a bare avatar: it sits next to two
          44px circular buttons, so it needs the same hit area and hover
          feedback or it reads as decoration. */}
      <DropdownMenuTrigger
        className={`group cursor-pointer shrink-0 flex items-center gap-2.5 h-11 pl-1 pr-1 lg:pr-3 rounded-full
          border transition-[background-color,border-color,box-shadow] duration-200 outline-none
          focus-visible:ring-2 focus-visible:ring-[#3bd9da]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f1f8f7]
          ${
            isOpen
              ? "bg-white border-[#3bd9da]/35 shadow-[0_2px_8px_-2px_rgba(59, 217, 218, 0.5)]"
              : "bg-transparent border-transparent hover:bg-white hover:border-[#dce7e5]"
          }`}
      >
        <span className="sr-only">My Account</span>
        <figure className="flex items-center gap-2.5">
          <Avatar className="size-9 ring-2 ring-white shadow-[0_2px_6px_-2px_rgba(59, 217, 218, 0.65)]">
            <AvatarFallback className="bg-[#117479] text-white text-[13px] font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          {/* Name + chevron hidden below lg (1024px) so the 84px bar never
              overflows on mid-size viewports. */}
          <figcaption className="hidden lg:flex items-center gap-1 font-medium text-tpl-dark">
            {isLoading ? (
              <span className="w-20 h-3 rounded bg-tpl-gray-3 animate-pulse" />
            ) : (
              <span className="max-w-24 truncate text-[14px]">{name}</span>
            )}
            <ChevronUp
              size={16}
              strokeWidth={1.75}
              className={`text-[#98a2b3] transition-transform duration-200 ${isOpen ? "rotate-0" : "rotate-180"}`}
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
            <AvatarFallback className="bg-[#117479] text-white text-[14px] font-bold">
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
