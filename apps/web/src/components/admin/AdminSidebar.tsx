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
import { BrandLogo } from "@/components/BrandLogo";
import { useAuth } from "@/contexts/AdminAuthContext";
import { getInitials } from "@/utils/getInitials";
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
  const { user } = useAuth();
  const name = user?.name || "Admin";
  const email = user?.email || "";
  const role = user?.role || "Admin";
  const initials = getInitials(user?.name);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={`w-full flex items-center rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-white/5 ${
            collapsed ? "justify-center p-2" : "gap-3 p-2.5"
          }`}
        >
          <div className="relative shrink-0">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-tpl-primary text-white text-[13px] font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-0.5 -right-0.5 block w-2.5 h-2.5 bg-tpl-green-light rounded-full ring-2 ring-white dark:ring-tpl-dark-2" />
          </div>

          {!collapsed && (
            <>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-[14px] font-semibold text-tpl-dark dark:text-white truncate leading-tight">
                  {name}
                </p>
                <p className="text-[12px] text-tpl-dark-5 dark:text-tpl-dark-6 truncate leading-tight mt-0.5 capitalize">
                  {role}
                </p>
              </div>
              <ChevronDown size={14} className="shrink-0 text-tpl-dark-5" />
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
            {name}
          </p>
          {email && (
            <p className="text-[10.5px] font-normal text-gray-500 dark:text-gray-400 truncate">
              {email}
            </p>
          )}
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
    // Expanded sidebar: toggle the in-place children panel. Parent with no
    // children navigates to its own path. (Collapsed-mode parents are
    // rendered through the DropdownMenu wrapper below — this handler is not
    // invoked for them.)
    if (hasChildren) onToggle();
    if (item.path) onNavigate(item.path);
  };

  const buttonClasses = `
    group relative w-full flex items-center rounded-lg text-left
    transition-all duration-200 ease-out
    ${collapsed ? "justify-center h-11 px-0" : "gap-3 h-11 px-3.5"}
    text-[14px] font-medium
    ${
      isActive
        ? "bg-tpl-primary-soft text-tpl-primary dark:text-white"
        : "text-tpl-dark-4 dark:text-tpl-dark-6 hover:bg-gray-100 hover:text-tpl-dark dark:hover:bg-white/10 dark:hover:text-white"
    }
  `;

  const buttonContent = (
    <>
      <item.icon
        size={22}
        strokeWidth={isActive ? 2 : 1.6}
        className={`shrink-0 transition-colors ${
          isActive
            ? "text-tpl-primary dark:text-white"
            : "text-tpl-dark-5 dark:text-tpl-dark-6 group-hover:text-tpl-dark dark:group-hover:text-white"
        }`}
      />

      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {hasChildren && (
            <motion.span
              animate={{ rotate: expanded ? 0 : -180 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="shrink-0 text-current opacity-70"
            >
              <ChevronDown size={14} />
            </motion.span>
          )}
        </>
      )}
    </>
  );

  // Collapsed + has children → wrap in a DropdownMenu so clicking the icon
  // opens a popover with the submenu to the right. Sidebar stays collapsed.
  if (collapsed && hasChildren) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button title={item.label} className={buttonClasses}>
            {buttonContent}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side="right"
          align="start"
          sideOffset={12}
          className="min-w-[200px] py-2 border border-tpl-stroke bg-white dark:bg-tpl-dark-2 shadow-tpl-2"
        >
          <DropdownMenuLabel className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-tpl-dark-5">
            {item.label}
          </DropdownMenuLabel>
          {item.children!.map((sub) => (
            <DropdownMenuItem
              key={sub.path}
              onSelect={() => onNavigate(sub.path)}
              className="gap-2.5 px-3 py-2 cursor-pointer text-[14px] font-medium focus:bg-tpl-primary-soft focus:text-tpl-primary"
            >
              {sub.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <button onClick={handleClick} title={collapsed ? item.label : undefined} className={buttonClasses}>
      {buttonContent}
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
        <div key={si} className="mb-6 last:mb-0">
          {section.group && !collapsed && (
            <p className="px-3.5 mb-3 text-[12px] font-medium text-tpl-dark-4 dark:text-tpl-dark-6 uppercase tracking-wider">
              {section.group}
            </p>
          )}
          <div className="space-y-2">
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
                    <ul className="ml-9 mr-0 space-y-1.5 pb-[8px] pr-0 pt-2.5">
                      {item.children.map((sub) => {
                        const subActive = isActive(sub.path);
                        return (
                          <li key={sub.path}>
                            <button
                              onClick={() => onNavigate(sub.path)}
                              className={`
                                relative block w-full text-left rounded-lg px-3.5 py-2 text-[14px] font-medium
                                transition-all duration-200
                                ${
                                  subActive
                                    ? "bg-tpl-primary-soft text-tpl-primary dark:text-white"
                                    : "text-tpl-dark-4 dark:text-tpl-dark-6 hover:bg-gray-100 hover:text-tpl-dark dark:hover:bg-white/10 dark:hover:text-white"
                                }
                              `}
                            >
                              {sub.label}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
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
  const { logout } = useAuth();

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
    logout();
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
          className="w-[290px] p-0 bg-white dark:bg-tpl-dark-2 border-r border-tpl-stroke dark:border-tpl-stroke sm:max-w-[290px]"
        >
          <SheetTitle className="sr-only">Admin navigation</SheetTitle>
          <div className="flex flex-col h-full py-7 pl-[20px] pr-[6px]">
            <div className="px-1 pb-2 shrink-0">
              <LogoWebsite />
            </div>
            <nav className="flex-1 mt-6 overflow-y-auto pr-3 scrollbar-hide">
              <SidebarBody
                collapsed={false}
                expanded={expanded}
                toggleExpanded={toggleExpanded}
                onNavigate={handleNavigate}
              />
            </nav>
            <div className="mt-2 pr-3 shrink-0">
              <SidebarUserCard
                collapsed={false}
                onNavigate={handleNavigate}
                onLogout={handleLogout}
              />
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Desktop sidebar — NextAdmin template style ───────────────── */}
      <aside
        className={`relative hidden lg:flex flex-col h-screen bg-white dark:bg-tpl-dark-2 border-r border-tpl-stroke dark:border-tpl-stroke shrink-0 transition-[width] duration-300 ease-out overflow-hidden ${
          collapsed ? "w-[72px]" : "w-[290px]"
        } ${className}`}
      >
        {/* Brand header — fixed height + bottom border so it lines up with
            the main top header bar, reading as one continuous strip. */}
        <div
          className={`flex items-center h-[89px] shrink-0 border-b border-tpl-stroke dark:border-tpl-stroke ${
            collapsed ? "justify-center px-2" : "pl-[25px] pr-[7px]"
          }`}
        >
          {collapsed ? (
            <BrandLogo variant="mark" size={36} />
          ) : (
            <LogoWebsite />
          )}
        </div>

        {/* Nav */}
        <nav className={`flex-1 pt-6 overflow-y-auto overflow-x-hidden scrollbar-hide ${collapsed ? "px-2" : "pl-[25px] pr-[12px]"}`}>
          <SidebarBody
            collapsed={collapsed}
            expanded={expanded}
            toggleExpanded={toggleExpanded}
            onNavigate={(p) => navigate(p)}
          />
        </nav>

        {/* Footer */}
        <div className={`shrink-0 ${collapsed ? "px-2" : "pl-[25px] pr-[12px]"} py-4 border-t border-tpl-stroke dark:border-tpl-stroke`}>
          <SidebarUserCard
            collapsed={collapsed}
            onNavigate={(p) => navigate(p)}
            onLogout={handleLogout}
          />
          <button
            onClick={() => setCollapsed((v) => !v)}
            className={`mt-3 w-full flex items-center gap-2 h-7 rounded-md text-[11.5px] font-medium text-tpl-dark-5 hover:text-tpl-primary dark:hover:text-white transition-colors ${
              collapsed ? "justify-center" : "px-2"
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
