import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Bell,
  Box,
  ChevronDown,
  ChevronsLeft,
  CreditCard,
  FileText,
  Globe,
  Layers,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Megaphone,
  Settings,
  Users2,
  X,
  type LucideIcon,
} from "lucide-react";
import LogoWebsite from "@/components/admin/LogoWebsite";

interface AdminSidebarProps {
  className?: string;
  showMobileSidebar: boolean;
  setShowMobileSidebar: (v: boolean) => void;
}

interface SubItem {
  label: string;
  path: string;
}

interface NavItem {
  icon: LucideIcon;
  label: string;
  path?: string;
  children?: SubItem[];
}

interface NavSection {
  group?: string;
  items: NavItem[];
}

// ─── Information architecture ────────────────────────────────────────────────
// Grouped semantically: data-entities together, growth tools together, system
// configuration together. Order matches admin's daily workflow priority.
const SECTIONS: NavSection[] = [
  {
    items: [{ icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" }],
  },
  {
    group: "Manage",
    items: [
      {
        icon: Layers,
        label: "Management",
        children: [
          { label: "Listings", path: "/admin/management/listing" },
          { label: "Users", path: "/admin/management/user" },
          { label: "Vendors", path: "/admin/management/vendor" },
          { label: "Bookings", path: "/admin/management/booking" },
        ],
      },
      { icon: CreditCard, label: "Payments", path: "/admin/payments" },
      { icon: LifeBuoy, label: "Help Desk", path: "/admin/help-desk" },
    ],
  },
  {
    group: "Insights",
    items: [
      {
        icon: BarChart3,
        label: "Analytics",
        children: [
          { label: "Overview", path: "/admin/analytics" },
          { label: "Reports", path: "/admin/analytics/report" },
        ],
      },
      { icon: Megaphone, label: "Marketing", path: "/admin/marketing" },
    ],
  },
  {
    group: "Workspace",
    items: [
      { icon: FileText, label: "CMS", path: "/admin/cms" },
      { icon: Bell, label: "CRM", path: "/admin/crm" },
      { icon: Box, label: "Plugins", path: "/admin/plugins" },
      {
        icon: Users2,
        label: "Staff",
        children: [
          { label: "All Staff", path: "/admin/staff" },
          { label: "Roles", path: "/admin/staff/roles" },
        ],
      },
      { icon: Settings, label: "Settings", path: "/admin/global-settings" },
    ],
  },
];

/* ── Active-state matcher ────────────────────────────────────────────────── */
function useActivePath() {
  const { pathname } = useLocation();
  return (path?: string) => {
    if (!path) return false;
    return pathname === path || pathname.startsWith(path + "/");
  };
}

/* ── User card / profile menu ────────────────────────────────────────────── */
interface UserMenuProps {
  collapsed: boolean;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

function SidebarUserCard({ collapsed, onNavigate, onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center rounded-lg transition-colors ${
          collapsed
            ? "justify-center p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
            : "gap-2.5 p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
        }`}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <div className="relative shrink-0">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ocean-400 to-ocean-700 flex items-center justify-center text-white text-[12px] font-bold shadow-sm">
            VS
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 block w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-gray-900" />
        </div>

        {!collapsed && (
          <>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[12.5px] font-semibold text-gray-900 dark:text-white truncate leading-tight">
                Vairag Shah
              </p>
              <p className="text-[10.5px] text-gray-500 dark:text-gray-400 truncate leading-tight">
                Super Admin
              </p>
            </div>
            <ChevronDown
              size={14}
              className={`shrink-0 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            />
          </>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            transition={{ duration: 0.14, ease: "easeOut" }}
            className={`absolute z-40 ${collapsed ? "left-full ml-2 bottom-0" : "left-0 right-0 bottom-full mb-2"} bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden`}
            role="menu"
          >
            <div className="px-3 py-2.5 border-b border-gray-100 dark:border-gray-800">
              <p className="text-[12.5px] font-semibold text-gray-900 dark:text-white truncate">
                Vairag Shah
              </p>
              <p className="text-[10.5px] text-gray-500 dark:text-gray-400 truncate">
                vairag.shah@univoxx.com
              </p>
            </div>
            <div className="py-1">
              <MenuItem onClick={() => { onNavigate("/admin/profile"); setOpen(false); }}>
                Profile
              </MenuItem>
              <MenuItem onClick={() => { onNavigate("/admin/global-settings"); setOpen(false); }}>
                Settings
              </MenuItem>
              <MenuItem onClick={() => { onNavigate("/admin/help"); setOpen(false); }}>
                Help & Support
              </MenuItem>
            </div>
            <div className="py-1 border-t border-gray-100 dark:border-gray-800">
              <MenuItem
                onClick={() => { onLogout(); setOpen(false); }}
                variant="danger"
                icon={<LogOut size={14} />}
              >
                Sign out
              </MenuItem>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuItem({
  children,
  onClick,
  variant = "default",
  icon,
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "danger";
  icon?: React.ReactNode;
}) {
  const base = "w-full flex items-center gap-2 px-3 py-1.5 text-[12.5px] transition-colors";
  const tone =
    variant === "danger"
      ? "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
      : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800";
  return (
    <button onClick={onClick} className={`${base} ${tone}`} role="menuitem">
      {icon}
      {children}
    </button>
  );
}

/* ── Nav row ─────────────────────────────────────────────────────────────── */
interface NavRowProps {
  item: NavItem;
  collapsed: boolean;
  active: boolean;
  hasActiveChild: boolean;
  expanded: boolean;
  onToggle: () => void;
  onNavigate: (path: string) => void;
}

function NavRow({ item, collapsed, active, hasActiveChild, expanded, onToggle, onNavigate }: NavRowProps) {
  const isActive = active || hasActiveChild;
  const hasChildren = !!item.children?.length;

  const handleClick = () => {
    if (hasChildren) onToggle();
    if (item.path) onNavigate(item.path);
  };

  return (
    <button
      onClick={handleClick}
      title={collapsed ? item.label : undefined}
      className={`
        group relative w-full flex items-center rounded-md text-left
        transition-[background-color,color] duration-150 ease-out
        ${collapsed ? "justify-center h-9 px-0" : "gap-2.5 h-9 px-2.5"}
        text-[13px] font-medium
        ${
          isActive
            ? "bg-ocean-50 dark:bg-ocean-500/10 text-ocean-700 dark:text-ocean-300"
            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
        }
      `}
    >
      {isActive && !collapsed && (
        <motion.span
          layoutId="sidebar-active-accent"
          className="absolute -left-2 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-ocean-500"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}

      <item.icon
        size={16}
        strokeWidth={isActive ? 2.2 : 1.75}
        className={`shrink-0 transition-colors ${
          isActive ? "text-ocean-600 dark:text-ocean-300" : "text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-200"
        }`}
      />

      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {hasChildren && (
            <motion.span
              animate={{ rotate: expanded ? 0 : -90 }}
              transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
              className="shrink-0 text-gray-400 dark:text-gray-500"
            >
              <ChevronDown size={13} />
            </motion.span>
          )}
        </>
      )}
    </button>
  );
}

/* ── Main component ─────────────────────────────────────────────────────── */
const AdminSidebar: React.FC<AdminSidebarProps> = ({
  className = "",
  showMobileSidebar,
  setShowMobileSidebar,
}) => {
  const navigate = useNavigate();
  const isActive = useActivePath();

  // Persist collapsed preference across sessions.
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("adminSidebarCollapsed") === "1";
  });
  useEffect(() => {
    localStorage.setItem("adminSidebarCollapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  // Auto-expand any parent whose child is currently active.
  const initialExpanded = SECTIONS.flatMap((s) => s.items)
    .filter((i) => i.children?.some((c) => isActive(c.path)))
    .map((i) => i.label);
  const [expanded, setExpanded] = useState<string[]>(initialExpanded);

  const toggleExpanded = (label: string) =>
    setExpanded((prev) => (prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]));

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    sessionStorage.removeItem("adminToken");
    navigate("/admin/login");
  };

  const renderNav = (closeMobileOnNavigate = false) =>
    SECTIONS.map((section, si) => (
      <div key={si} className="mb-3 last:mb-0">
        {section.group && !collapsed && (
          <p className="px-3 mb-1 text-[10.5px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            {section.group}
          </p>
        )}
        <div className="space-y-0.5">
          {section.items.map((item) => {
            const itemActive = isActive(item.path);
            const childActive = item.children?.some((c) => isActive(c.path)) ?? false;
            const isExpanded = expanded.includes(item.label);
            return (
              <div key={item.label}>
                <NavRow
                  item={item}
                  collapsed={collapsed}
                  active={itemActive}
                  hasActiveChild={childActive}
                  expanded={isExpanded}
                  onToggle={() => toggleExpanded(item.label)}
                  onNavigate={(p) => {
                    navigate(p);
                    if (closeMobileOnNavigate) setShowMobileSidebar(false);
                  }}
                />

                <AnimatePresence initial={false}>
                  {item.children && isExpanded && !collapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="ml-[18px] pl-3 mt-1 mb-1 space-y-0.5 border-l border-gray-200 dark:border-gray-800">
                        {item.children.map((sub, ci) => {
                          const subActive = isActive(sub.path);
                          return (
                            <motion.button
                              key={sub.path}
                              initial={{ x: -4, opacity: 0 }}
                              animate={{ x: 0, opacity: 1 }}
                              transition={{ delay: ci * 0.03, duration: 0.14 }}
                              onClick={() => {
                                navigate(sub.path);
                                if (closeMobileOnNavigate) setShowMobileSidebar(false);
                              }}
                              className={`
                                group/sub w-full flex items-center gap-2 px-2.5 h-7 rounded-md text-left text-[12.5px]
                                transition-colors duration-150
                                ${
                                  subActive
                                    ? "bg-ocean-50 dark:bg-ocean-500/10 text-ocean-700 dark:text-ocean-300 font-semibold"
                                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                                }
                              `}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-150 ${
                                  subActive
                                    ? "bg-ocean-500 ring-2 ring-ocean-500/15"
                                    : "bg-gray-300 dark:bg-gray-600 group-hover/sub:bg-gray-400"
                                }`}
                              />
                              {sub.label}
                            </motion.button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    ));

  return (
    <>
      {/* ── Mobile drawer ────────────────────────────────────────────── */}
      <AnimatePresence>
        {showMobileSidebar && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden"
              onClick={() => setShowMobileSidebar(false)}
            />
            <motion.div
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: "spring", stiffness: 350, damping: 32 }}
              className="fixed left-0 top-0 bottom-0 z-50 w-[260px] bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col lg:hidden"
            >
              <div className="flex items-center justify-between px-4 py-3 min-h-[64px] border-b border-gray-200 dark:border-gray-800 shrink-0">
                <LogoWebsite />
                <button
                  onClick={() => setShowMobileSidebar(false)}
                  className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                  aria-label="Close sidebar"
                >
                  <X size={18} />
                </button>
              </div>
              <nav className="flex-1 px-2 py-3 overflow-y-auto scrollbar-hide">
                {renderNav(true)}
              </nav>
              <div className="p-2 border-t border-gray-200 dark:border-gray-800 shrink-0">
                <SidebarUserCard
                  collapsed={false}
                  onNavigate={(p) => {
                    navigate(p);
                    setShowMobileSidebar(false);
                  }}
                  onLogout={handleLogout}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Desktop sidebar ──────────────────────────────────────────── */}
      <aside
        className={`relative hidden lg:flex flex-col h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shrink-0 transition-[width] duration-300 ease-out ${
          collapsed ? "w-[64px]" : "w-[240px]"
        } ${className}`}
      >
        {/* Logo header — matches AdminHeader's natural height (py-3) */}
        <div
          className={`flex items-center py-3 min-h-[64px] border-b border-gray-200 dark:border-gray-800 shrink-0 ${
            collapsed ? "justify-center px-2" : "px-4"
          }`}
        >
          {collapsed ? (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-ocean-500 to-ocean-700 flex items-center justify-center shadow-sm">
              <Globe size={16} className="text-white" />
            </div>
          ) : (
            <LogoWebsite />
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto overflow-x-hidden scrollbar-hide">
          {renderNav(false)}
        </nav>

        {/* Footer: user card + collapse toggle */}
        <div className="border-t border-gray-200 dark:border-gray-800 shrink-0">
          <div className="p-2">
            <SidebarUserCard
              collapsed={collapsed}
              onNavigate={(p) => navigate(p)}
              onLogout={handleLogout}
            />
          </div>
          <button
            onClick={() => setCollapsed((v) => !v)}
            className={`w-full flex items-center gap-2 px-3 h-8 text-[11.5px] font-medium text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-t border-gray-100 dark:border-gray-800 ${
              collapsed ? "justify-center" : ""
            }`}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <motion.span
              animate={{ rotate: collapsed ? 180 : 0 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="flex shrink-0"
            >
              <ChevronsLeft size={14} />
            </motion.span>
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
