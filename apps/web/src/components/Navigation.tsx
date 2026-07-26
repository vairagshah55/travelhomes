import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AdminBrandMark } from "@/components/admin/AdminBrand";
import {
  LayoutDashboard,
  Calendar,
  Package,
  DollarSign,
  BarChart3,
  Settings,
  LogOut,
  ChevronRight,
  MessageSquare,
  FileText,
  HelpCircle,
  Bell,
  Pin,
  PinOff,
  Globe,
} from "lucide-react";

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  /** Per-item accent hue for the color-coded icon tile (mirrors admin nav). */
  color?: string;
  children?: MenuItem[];
  badge?: number;
}

// Sidebar accepts a handful of shapes across the codebase — nothing is
// required. The component reads `forceExpanded` and `defaultCollapsed`
// internally; the rest of the props (`isCollapsed`, `onToggleCollapse`,
// `setIsCollapsed`, `isMobile`) are accepted for compatibility with the
// various call sites in pages/ but are ignored at the component level.
interface SidebarProps {
  defaultCollapsed?: boolean;
  onToggle?: (collapsed: boolean) => void;
  forceExpanded?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  setIsCollapsed?: (collapsed: boolean) => void;
  isMobile?: boolean;
}

const menuItems: MenuItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
    color: "#3BD9D9",
  },
  {
    id: "bookings",
    label: "Bookings",
    icon: Calendar,
    path: "/bookings",
    color: "#a855f7",
    children: [
      { id: "all-bookings", label: "All Bookings", icon: Calendar, path: "/bookings" },
      { id: "booking-details", label: "Details", icon: FileText, path: "/bookings/details" },
    ],
  },
  {
    id: "offering",
    label: "Offerings",
    icon: Package,
    path: "/offering",
    color: "#3b82f6",
    children: [
      { id: "all-offerings", label: "All Offerings", icon: Package, path: "/offering" },
      { id: "add-offering", label: "Add New", icon: Package, path: "/offering/add" },
    ],
  },
  { id: "revenue", label: "Revenue", icon: DollarSign, path: "/revenue", color: "#22c55e" },
  {
    id: "marketing",
    label: "Marketing",
    icon: BarChart3,
    path: "/marketing",
    color: "#ec4899",
    children: [
      { id: "marketing-home", label: "Overview", icon: BarChart3, path: "/marketing" },
      { id: "offers", label: "Offers", icon: Package, path: "/marketing/offers" },
    ],
  },
  { id: "analytics", label: "Analytics", icon: BarChart3, path: "/analytics", color: "#f59e0b" },
  {
    id: "messages",
    label: "Messages",
    icon: MessageSquare,
    path: "/vendor-chat",
    color: "#14b8a6",
  },
];

const bottomMenuItems: MenuItem[] = [
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
    path: "/notifications",
    color: "#3b82f6",
  },
  { id: "settings", label: "Settings", icon: Settings, path: "/settings", color: "#8a929f" },
  { id: "help", label: "Help & Support", icon: HelpCircle, path: "/help", color: "#22c55e" },
  { id: "visit-site", label: "Visit Site", icon: Globe, path: "/", color: "#0d9488" },
];

/* ─── small reusable badge ─── */
const Badge = ({ count, active }: { count: number; active: boolean }) => (
  <span
    className={`
    inline-flex items-center justify-center
    text-[10px] font-bold leading-none
    min-w-[18px] h-[18px] px-1 rounded-full
    ${
      active
        ? "bg-app-accent text-app-accent-fg"
        : "bg-gray-100 dark:bg-gray-700/80 text-gray-500 dark:text-gray-400"
    }
  `}
  >
    {count > 99 ? "99+" : count}
  </span>
);

/* ─── tooltip shown in collapsed mode ─── */
const CollapsedTooltip = ({ label, badge }: { label: string; badge?: number }) => (
  <div
    className="
    pointer-events-none absolute left-full ml-4 z-50
    flex items-center gap-2
    px-3 py-2 rounded-xl whitespace-nowrap
    bg-gray-900/95 dark:bg-gray-800 text-white text-[12px] font-medium
    shadow-2xl ring-1 ring-white/10
    opacity-0 invisible -translate-x-1
    group-hover:opacity-100 group-hover:visible group-hover:translate-x-0
    transition-all duration-150 ease-out
  "
  >
    {/* arrow */}
    <span
      className="absolute right-full top-1/2 -translate-y-1/2
      border-[5px] border-transparent border-r-gray-900/95 dark:border-r-gray-800"
    />
    {label}
    {badge !== undefined && badge > 0 && (
      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-app-accent text-app-accent-fg rounded-full leading-none">
        {badge}
      </span>
    )}
  </div>
);

export const Sidebar: React.FC<SidebarProps> = ({ defaultCollapsed = false, onToggle }) => {
  const [pinned, setPinned] = useState(!defaultCollapsed);
  const [hoverOpen, setHoverOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const sidebarRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const isOpen = pinned || hoverOpen;

  // IDs of parent menu items whose children contain the current route. These
  // should ALWAYS be considered expanded (in addition to whatever the user
  // toggled manually), so that re-opening the sidebar on a sub-route shows
  // the active sub-link instead of a collapsed parent.
  const matchPath = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");
  const activeParentIds = useMemo(() => {
    const ids: string[] = [];
    [...menuItems, ...bottomMenuItems].forEach((item) => {
      if (item.children?.some((c) => matchPath(c.path))) ids.push(item.id);
    });
    return ids;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Whenever the URL changes, fold the active parent(s) into expandedItems so
  // the matching sub-menu is visible the moment the sidebar opens.
  useEffect(() => {
    if (activeParentIds.length === 0) return;
    setExpandedItems((prev) => {
      const next = new Set(prev);
      activeParentIds.forEach((id) => next.add(id));
      return next;
    });
  }, [activeParentIds]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleMouseEnter = () => {
    if (pinned) return;
    hoverTimer.current = setTimeout(() => setHoverOpen(true), 100);
  };
  const handleMouseLeave = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    if (!pinned) {
      setHoverOpen(false);
      // Reset to the active-parents baseline (not empty) so that when the
      // sidebar hovers open again, the parent containing the current page
      // is still expanded. User-toggled expansions of *other* parents do
      // collapse — that matches the previous "clean slate on close" feel,
      // while keeping the current sub-route visible.
      setExpandedItems(new Set(activeParentIds));
    }
  };
  const handlePinToggle = () => {
    const next = !pinned;
    setPinned(next);
    if (!next) setHoverOpen(false);
    onToggle?.(!next);
  };

  const toggleExpand = (id: string) => {
    if (!isOpen) return;
    setExpandedItems((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });
  };

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");
  const isParentActive = (item: MenuItem) =>
    isActive(item.path) || (item.children?.some((c) => isActive(c.path)) ?? false);

  // For sibling children where one path is a prefix of another (e.g. /offering
  // and /offering/add), the plain prefix test in `isActive` lights up BOTH.
  // Only the most specific match should be active — i.e. the sibling whose
  // path is the longest matching prefix of the current URL.
  const isChildActive = (child: MenuItem, siblings: MenuItem[]) => {
    if (!isActive(child.path)) return false;
    return !siblings.some(
      (s) => s.id !== child.id && isActive(s.path) && s.path.length > child.path.length,
    );
  };

  /* ─── single nav row (top-level) ─── */
  const renderItem = (item: MenuItem) => {
    const hasChildren = !!item.children?.length;
    const expanded = expandedItems.has(item.id);
    const active = isParentActive(item);

    return (
      <div key={item.id}>
        {/* ── collapsed state ── */}
        {!isOpen ? (
          <div className="group relative flex justify-center py-1 px-2">
            <button
              onClick={() => (hasChildren ? toggleExpand(item.id) : navigate(item.path))}
              style={
                !active && item.color
                  ? { backgroundColor: `${item.color}1f`, color: item.color }
                  : undefined
              }
              className={`
                relative flex items-center justify-center w-10 h-10 rounded-xl
                transition-all duration-150
                ${active ? "bg-app-accent text-app-accent-fg shadow-sm" : "hover:brightness-95"}
              `}
            >
              <item.icon size={18} />
              {/* notification dot */}
              {item.badge !== undefined && item.badge > 0 && !active && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-500 ring-2 ring-[#f1f8f7] dark:ring-[#0f1117]" />
              )}
            </button>
            <CollapsedTooltip label={item.label} badge={item.badge} />
          </div>
        ) : (
          /* ── expanded state ── */
          <div
            onClick={() => (hasChildren ? toggleExpand(item.id) : navigate(item.path))}
            className={`
              group relative flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl cursor-pointer select-none
              transition-all duration-150
              ${
                active
                  ? "bg-app-accent-soft text-app-accent"
                  : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.04] hover:text-gray-900 dark:hover:text-gray-100"
              }
            `}
          >
            {/* gradient left bar */}
            <span
              className={`
              absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full
              bg-app-accent
              transition-all duration-200
              ${active ? "h-6 opacity-100" : "h-0 opacity-0"}
            `}
            />

            <span
              className="grid place-items-center w-8 h-8 rounded-lg shrink-0 transition-all duration-150 group-hover:scale-[1.05]"
              style={
                active
                  ? { backgroundColor: "#0d9488", color: "#fff" }
                  : item.color
                    ? { backgroundColor: `${item.color}1f`, color: item.color }
                    : undefined
              }
            >
              <item.icon size={16} />
            </span>

            <span className="flex-1 text-[13px] font-medium whitespace-nowrap tracking-[-0.01em]">
              {item.label}
            </span>

            {item.badge !== undefined && item.badge > 0 && (
              <Badge count={item.badge} active={active} />
            )}

            {hasChildren && (
              <ChevronRight
                size={13}
                className={`text-gray-400 transition-transform duration-200 ${expanded ? "rotate-90" : ""}`}
              />
            )}
          </div>
        )}

        {/* ── children (animated) ── */}
        <AnimatePresence initial={false}>
          {isOpen && hasChildren && expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="mt-0.5 mb-1 mx-2 ml-[calc(0.5rem+1.5rem)] space-y-0.5 border-l-2 border-gray-100 dark:border-gray-800/80 pl-3 pr-0">
                {item.children!.map((child, subIndex) => {
                  const ca = isChildActive(child, item.children!);
                  return (
                    <motion.div
                      key={child.id}
                      initial={{ x: -6, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: subIndex * 0.04, duration: 0.15 }}
                      onClick={() => navigate(child.path)}
                      className={`
                        group flex items-center gap-2 py-2 px-2.5 rounded-lg cursor-pointer
                        transition-colors duration-150 select-none
                        ${
                          ca
                            ? "bg-app-accent-soft text-app-accent"
                            : "text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                        }
                      `}
                    >
                      <span
                        className={`w-1 h-1 rounded-full shrink-0 transition-colors duration-150
                        ${ca ? "bg-app-accent" : "bg-gray-300 dark:bg-gray-600 group-hover:bg-gray-400"}
                      `}
                      />
                      <span className="flex-1 text-[12px] font-medium whitespace-nowrap">
                        {child.label}
                      </span>
                      {child.badge !== undefined && child.badge > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-app-accent text-app-accent-fg leading-none">
                          {child.badge}
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  /* ─── logout row ─── */
  const renderLogout = () => {
    if (!isOpen) {
      return (
        <div className="group relative flex justify-center py-1 px-2">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center w-10 h-10 rounded-xl text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-all duration-150"
          >
            <LogOut size={18} />
          </button>
          <CollapsedTooltip label="Logout" />
        </div>
      );
    }
    return (
      <div
        onClick={handleLogout}
        className="flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl cursor-pointer select-none
          text-gray-400 dark:text-gray-500
          hover:bg-red-50 dark:hover:bg-red-500/10
          hover:text-red-600 dark:hover:text-red-400
          transition-all duration-150 group"
      >
        <LogOut
          size={16}
          className="shrink-0 transition-transform duration-150 group-hover:scale-110"
        />
        <span className="text-[13px] font-medium whitespace-nowrap">Logout</span>
      </div>
    );
  };

  /* ─── render ─── */
  return (
    <div
      ref={sidebarRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ width: isOpen ? 256 : 68 }}
      className="
        relative flex flex-col h-full overflow-hidden
        bg-[#f1f8f7] dark:bg-[#0f1117]
        shadow-[inset_-1px_0_0_#dce7e5] dark:shadow-[inset_-1px_0_0_#1c1f26]
        transition-[width] duration-300 ease-in-out
      "
    >
      {/* ─── Header ─── */}
      <div
        className={`
        flex items-center h-[60px] shrink-0 px-3.5
        shadow-[inset_0_-1px_0_#dce7e5] dark:shadow-[inset_0_-1px_0_#1c1f26]
        ${!isOpen ? "justify-center" : ""}
      `}
      >
        {isOpen ? (
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <AdminBrandMark size={30} />
            <span className="font-extrabold tracking-tight leading-none text-[16px] whitespace-nowrap min-w-0 truncate">
              <span className="text-[#101828] dark:text-white">Travel</span>
              <span className="text-[#0d9488]">Homes</span>
            </span>

            <button
              onClick={handlePinToggle}
              title={pinned ? "Unpin sidebar" : "Pin sidebar open"}
              className={`
                ml-auto shrink-0 p-1.5 rounded-lg transition-all duration-150
                ${
                  pinned
                    ? "text-app-accent bg-app-accent-soft"
                    : "text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                }
              `}
            >
              {pinned ? <Pin size={13} /> : <PinOff size={13} />}
            </button>
          </div>
        ) : (
          <AdminBrandMark size={32} />
        )}
      </div>

      {/* ─── Main nav ─── */}
      <nav
        className="flex-1 overflow-y-auto overflow-x-hidden py-3
        scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800 scrollbar-track-transparent"
      >
        {isOpen && (
          <p className="px-5 pt-1 pb-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400 dark:text-gray-600 whitespace-nowrap">
            Main Menu
          </p>
        )}
        <div className="space-y-0.5">{menuItems.map(renderItem)}</div>
      </nav>

      {/* ─── Bottom nav ─── */}
      <div className="shrink-0 py-3 shadow-[inset_0_1px_0_#f0f0f0] dark:shadow-[inset_0_1px_0_#1c1f26]">
        {isOpen && (
          <p className="px-5 pt-1 pb-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400 dark:text-gray-600 whitespace-nowrap">
            Support
          </p>
        )}
        <div className="space-y-0.5">
          {bottomMenuItems.map(renderItem)}
          {renderLogout()}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
