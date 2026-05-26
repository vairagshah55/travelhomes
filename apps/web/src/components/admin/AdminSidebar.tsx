import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useAutoAnimate } from "@formkit/auto-animate/react";
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
  HelpCircle,
  Layers,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Megaphone,
  Settings,
  User,
  Users2,
  type LucideIcon,
} from "lucide-react";

import LogoWebsite from "@/components/admin/LogoWebsite";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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

function useActivePath() {
  const { pathname } = useLocation();
  return (path?: string) => {
    if (!path) return false;
    return pathname === path || pathname.startsWith(path + "/");
  };
}

/* ── User card with shadcn DropdownMenu + Avatar ───────────────────────── */
interface UserMenuProps {
  collapsed: boolean;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

function SidebarUserCard({ collapsed, onNavigate, onLogout }: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`w-full flex items-center rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 ${
            collapsed ? "justify-center p-1.5" : "gap-2.5 p-2"
          }`}
        >
          <div className="relative shrink-0">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-gradient-to-br from-ocean-400 to-ocean-700 text-white text-[12px] font-bold">
                VS
              </AvatarFallback>
            </Avatar>
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
              <ChevronDown size={14} className="shrink-0 text-gray-400" />
            </>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align={collapsed ? "start" : "end"}
        side={collapsed ? "right" : "top"}
        sideOffset={8}
        className="w-56"
      >
        <DropdownMenuLabel>
          <p className="text-[12.5px] font-semibold text-gray-900 dark:text-white truncate">
            Vairag Shah
          </p>
          <p className="text-[10.5px] font-normal text-gray-500 dark:text-gray-400 truncate">
            vairag.shah@univoxx.com
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => onNavigate("/admin/profile")}>
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onNavigate("/admin/global-settings")}>
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onNavigate("/admin/help")}>
          <HelpCircle className="mr-2 h-4 w-4" />
          Help &amp; support
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={onLogout}
          className="text-red-600 dark:text-red-400 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-500/10"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
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
          isActive
            ? "text-ocean-600 dark:text-ocean-300"
            : "text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-200"
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

/* ── Sidebar nav body — shared between desktop and mobile ──────────────── */
interface SidebarBodyProps {
  collapsed: boolean;
  expanded: string[];
  toggleExpanded: (label: string) => void;
  onNavigate: (path: string) => void;
}

function SidebarBody({ collapsed, expanded, toggleExpanded, onNavigate }: SidebarBodyProps) {
  const isActive = useActivePath();
  // AutoAnimate handles the expand/collapse of sub-item lists without manual
  // height animation. duration matches the sidebar's transition rhythm.
  const [animateRef] = useAutoAnimate<HTMLDivElement>({ duration: 180, easing: "ease-out" });

  return (
    <div ref={animateRef}>
      {SECTIONS.map((section, si) => (
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
                    onNavigate={onNavigate}
                  />

                  {item.children && isExpanded && !collapsed && (
                    <div className="ml-[18px] pl-3 mt-1 mb-1 space-y-0.5 border-l border-gray-200 dark:border-gray-800">
                      {item.children.map((sub) => {
                        const subActive = isActive(sub.path);
                        return (
                          <button
                            key={sub.path}
                            onClick={() => onNavigate(sub.path)}
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
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
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

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("adminSidebarCollapsed") === "1";
  });
  useEffect(() => {
    localStorage.setItem("adminSidebarCollapsed", collapsed ? "1" : "0");
  }, [collapsed]);

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

  const handleNavigate = (path: string) => {
    navigate(path);
    setShowMobileSidebar(false);
  };

  return (
    <>
      {/* ── Mobile drawer via shadcn Sheet ──────────────────────────── */}
      <Sheet open={showMobileSidebar} onOpenChange={setShowMobileSidebar}>
        <SheetContent
          side="left"
          className="w-[260px] p-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 sm:max-w-[260px]"
        >
          <SheetTitle className="sr-only">Admin navigation</SheetTitle>
          <div className="flex flex-col h-full">
            <div className="flex items-center px-4 py-3 min-h-[64px] border-b border-gray-200 dark:border-gray-800 shrink-0">
              <LogoWebsite />
            </div>
            <nav className="flex-1 px-2 py-3 overflow-y-auto scrollbar-hide">
              <SidebarBody
                collapsed={false}
                expanded={expanded}
                toggleExpanded={toggleExpanded}
                onNavigate={handleNavigate}
              />
            </nav>
            <div className="p-2 border-t border-gray-200 dark:border-gray-800 shrink-0">
              <SidebarUserCard
                collapsed={false}
                onNavigate={handleNavigate}
                onLogout={handleLogout}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Desktop sidebar ──────────────────────────────────────────── */}
      <aside
        className={`relative hidden lg:flex flex-col h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shrink-0 transition-[width] duration-300 ease-out ${
          collapsed ? "w-[64px]" : "w-[240px]"
        } ${className}`}
      >
        {/* Logo header */}
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
          <SidebarBody
            collapsed={collapsed}
            expanded={expanded}
            toggleExpanded={toggleExpanded}
            onNavigate={(p) => navigate(p)}
          />
        </nav>

        {/* Footer */}
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
