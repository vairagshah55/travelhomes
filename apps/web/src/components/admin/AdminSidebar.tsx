import React, { useEffect, useState } from "react";
import { motion, MotionConfig } from "framer-motion";
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

import { AdminBrandMark } from "@/components/admin/AdminBrand";
import LogoWebsite from "@/components/admin/LogoWebsite";
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
  /** Per-item accent hue (57facets color-coded nav). 6-digit hex. */
  color: string;
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
    items: [
      { icon: LayoutDashboard, label: "Dashboard", color: "#3BD9D9", path: "/admin/dashboard" },
    ],
  },
  {
    group: "Manage",
    items: [
      { icon: Layers, label: "Management", color: "#a855f7", path: "/admin/management" },
      { icon: CreditCard, label: "Payments", color: "#3b82f6", path: "/admin/payments" },
      { icon: LifeBuoy, label: "Help Desk", color: "#22c55e", path: "/admin/help-desk" },
    ],
  },
  {
    group: "Insights",
    items: [
      {
        icon: BarChart3,
        label: "Analytics",
        color: "#ec4899",
        children: [
          { label: "Overview", path: "/admin/analytics" },
          { label: "Reports", path: "/admin/analytics/report" },
        ],
      },
      { icon: Megaphone, label: "Marketing", color: "#f59e0b", path: "/admin/marketing" },
    ],
  },
  {
    group: "Workspace",
    items: [
      { icon: FileText, label: "CMS", color: "#14b8a6", path: "/admin/cms" },
      { icon: Bell, label: "CRM", color: "#3b82f6", path: "/admin/crm" },
      { icon: Box, label: "Plugins", color: "#a855f7", path: "/admin/plugins" },
      {
        icon: Users2,
        label: "Staff",
        color: "#22c55e",
        children: [
          { label: "All Staff", path: "/admin/staff" },
          { label: "Roles", path: "/admin/staff/roles" },
        ],
      },
      { icon: Settings, label: "Settings", color: "#8a929f", path: "/admin/global-settings" },
    ],
  },
];

// Every concrete nav path (items + sub-items), used to resolve active state.
const ALL_NAV_PATHS = SECTIONS.flatMap((s) =>
  s.items.flatMap((i) => [i.path, ...(i.children?.map((c) => c.path) ?? [])]),
).filter((p): p is string => !!p);

function useActivePath() {
  const { pathname } = useLocation();
  // Resolve the single best match: the LONGEST nav path the current URL falls
  // under. Without this, a parent path (e.g. /admin/analytics) stays "active"
  // on a child route (/admin/analytics/report), lighting up both items.
  const best = ALL_NAV_PATHS.filter((p) => pathname === p || pathname.startsWith(p + "/")).sort(
    (a, b) => b.length - a.length,
  )[0];
  return (path?: string) => !!path && path === best;
}

/* Label-reveal class. Labels/chevrons fade out while the rail is narrow and
   fade back in when it's expanded (pinned open, or peeking on hover). The
   expand state is computed in JS (see `expanded` below) rather than CSS
   `:hover`, because a pure-CSS peek can't be suppressed right after the user
   clicks Collapse while the cursor is still over the panel — which made
   collapse look broken. */
const reveal = (hidden: boolean) =>
  `transition-opacity duration-200 ${hidden ? "opacity-0" : "opacity-100"}`;

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
        <button className="w-full flex items-center gap-3 p-2 rounded-xl transition-colors hover:bg-[var(--glass-bg-hover)]">
          <div className="relative shrink-0">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-[#0d9488] text-white text-[13px] font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <span className="absolute -bottom-0.5 -right-0.5 block w-2.5 h-2.5 bg-[#22c55e] rounded-full ring-2 ring-white" />
          </div>

          <div className={`flex-1 min-w-0 flex items-center ${reveal(collapsed)}`}>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-[14px] font-semibold text-tpl-dark dark:text-tpl-dark truncate leading-tight">
                {name}
              </p>
              <p className="text-[12px] text-tpl-dark-5 dark:text-tpl-dark-6 truncate leading-tight mt-0.5 capitalize">
                {role}
              </p>
            </div>
            <ChevronDown size={14} className="shrink-0 text-tpl-dark-5" />
          </div>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" side="right" sideOffset={12} className="w-56">
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

function NavRow({
  item,
  collapsed,
  active,
  hasActiveChild,
  expanded,
  onToggle,
  onNavigate,
}: NavRowProps) {
  const isActive = active || hasActiveChild;
  const hasChildren = !!item.children?.length;

  const handleClick = () => {
    if (hasChildren) onToggle();
    if (item.path) onNavigate(item.path);
  };

  return (
    <button
      onClick={handleClick}
      title={item.label}
      className="group relative w-full flex items-center gap-3 h-11 pl-2 pr-2 rounded-xl text-left text-[14px] font-medium text-[#475467] cursor-pointer transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
    >
      {/* Sliding active pill — a single shared element animates between rows
          (framer layoutId). White pill on the teal rail = the selection. */}
      {isActive && (
        <motion.span
          layoutId="adminNavActivePill"
          className="absolute inset-0 rounded-xl bg-[rgba(13,148,136,0.09)] shadow-[inset_3px_0_0_0_#0d9488]"
          transition={{ type: "spring", stiffness: 520, damping: 42 }}
        />
      )}
      {/* Hover wash for inactive rows */}
      {!isActive && (
        <span className="absolute inset-0 rounded-xl bg-transparent group-hover:bg-[rgba(16,24,40,0.04)] transition-colors duration-200" />
      )}

      {/* Icon tile — inverts on active (black tile + white glyph). Fixed
          position so it never shifts between collapsed/expanded. */}
      <span
        className="relative z-10 grid place-items-center w-9 h-9 rounded-lg shrink-0 transition-all duration-200 group-hover:scale-[1.06]"
        style={
          isActive
            ? {
                backgroundColor: "#0d9488",
                color: "#fff",
                boxShadow: "0 5px 14px -3px rgba(13,148,136,0.5)",
              }
            : { backgroundColor: `${item.color}1f`, color: item.color }
        }
      >
        <item.icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
      </span>

      <span
        className={`relative z-10 flex-1 truncate transition-transform duration-200 ${
          isActive
            ? "text-[#0d9488] font-semibold"
            : "group-hover:translate-x-0.5 group-hover:text-[#101828]"
        } ${reveal(collapsed)}`}
      >
        {item.label}
      </span>
      {hasChildren && (
        <motion.span
          animate={{ rotate: expanded ? 0 : -180 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className={`relative z-10 shrink-0 text-current opacity-70 ${reveal(collapsed)}`}
        >
          <ChevronDown size={14} />
        </motion.span>
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
  const [animateRef] = useAutoAnimate<HTMLDivElement>({ duration: 180, easing: "ease-out" });

  return (
    <div ref={animateRef}>
      {SECTIONS.map((section, si) => (
        <div key={si} className="mb-5 last:mb-0">
          {section.group && (
            <p
              className={`px-2 mb-2 h-4 text-[11px] font-semibold text-tpl-dark-5 dark:text-tpl-dark-6 uppercase tracking-wider whitespace-nowrap ${reveal(
                collapsed,
              )}`}
            >
              {section.group}
            </p>
          )}
          <div className="space-y-1.5">
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

                  {/* Sub-items. When the rail is collapsed they live behind the
                      hover-peek (revealed only when the panel is hovered). */}
                  {item.children && isExpanded && (
                    <ul
                      className={`ml-[26px] mr-0 space-y-1 pb-1 pt-2 ${collapsed ? "hidden" : "block"}`}
                    >
                      {item.children.map((sub) => {
                        const subActive = isActive(sub.path);
                        return (
                          <li key={sub.path}>
                            <button
                              onClick={() => onNavigate(sub.path)}
                              className={`relative block w-full text-left rounded-lg pl-3.5 pr-3 py-2 text-[13.5px] font-medium transition-colors duration-200 ${
                                subActive
                                  ? "bg-[var(--teal-glass)] text-tpl-primary"
                                  : "text-tpl-dark-6 hover:bg-[var(--glass-bg-hover)] hover:text-tpl-dark"
                              }`}
                            >
                              {/* Active = teal-glass pill + teal left bar (mirrors
                                  the top-level active item). */}
                              {subActive && (
                                <span
                                  aria-hidden
                                  className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-tpl-primary"
                                />
                              )}
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

  // Hover-peek: when collapsed, hovering the rail expands it into an overlay.
  // JS (not CSS :hover) so we can drop the peek the instant the user clicks
  // Collapse — otherwise the cursor sitting on the panel keeps it open.
  const [peek, setPeek] = useState(false);
  const railOpen = !collapsed || peek;
  const toggleCollapsed = () =>
    setCollapsed((v) => {
      const next = !v;
      if (next) setPeek(false); // collapse immediately, even under the cursor
      return next;
    });

  const initialExpanded = SECTIONS.flatMap((s) => s.items)
    .filter((i) => i.children?.some((c) => isActive(c.path)))
    .map((i) => i.label);
  const [expanded, setExpanded] = useState<string[]>(initialExpanded);

  const toggleExpanded = (label: string) =>
    setExpanded((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label],
    );

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setShowMobileSidebar(false);
  };

  return (
    <MotionConfig reducedMotion="user">
      {/* ── Mobile drawer via shadcn Sheet ──────────────────────────── */}
      <Sheet open={showMobileSidebar} onOpenChange={setShowMobileSidebar}>
        <SheetContent
          side="left"
          data-admin-skin="teal"
          className="w-[290px] p-0 bg-tpl-card-bg border-r border-tpl-stroke sm:max-w-[290px]"
        >
          <SheetTitle className="sr-only">Admin navigation</SheetTitle>
          <div className="group flex flex-col h-full py-6 px-4">
            <div className="px-1 pb-2 shrink-0">
              <LogoWebsite />
            </div>
            <nav className="flex-1 mt-5 overflow-y-auto scrollbar-hide">
              <SidebarBody
                collapsed={false}
                expanded={expanded}
                toggleExpanded={toggleExpanded}
                onNavigate={handleNavigate}
              />
            </nav>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Desktop sidebar ──────────────────────────────────────────────
          In-flow flex child whose width IS the live state (76px collapsed ↔
          290px open). Because the content area is a flex sibling, it reflows
          automatically — the sidebar never overlays/covers the page. Hovering
          a collapsed rail "peeks" it open (JS state, reset on toggle so a
          click-collapse takes effect immediately under the cursor). */}
      <aside
        onMouseEnter={() => collapsed && setPeek(true)}
        onMouseLeave={() => setPeek(false)}
        data-admin-skin="teal"
        className={`hidden lg:flex flex-col h-screen shrink-0 bg-tpl-card-bg border-r border-tpl-stroke overflow-hidden transition-[width] duration-300 ease-out ${
          railOpen ? "w-[290px]" : "w-[76px]"
        } ${className}`}
      >
        {/* Brand header — mark stays fixed, wordmark reveals on expand. */}
        <button
          onClick={() => navigate("/admin/dashboard")}
          className="flex items-center gap-2.5 h-[84px] shrink-0 pl-[18px] pr-3 border-b border-tpl-stroke"
          aria-label="TravelHomes admin home"
        >
          <AdminBrandMark size={34} />
          <span
            className={`font-extrabold tracking-tight leading-none text-[19px] whitespace-nowrap ${reveal(
              !railOpen,
            )}`}
          >
            <span className="text-[#101828]">Travel</span>
            <span className="text-[#0d9488]">Homes</span>
          </span>
        </button>

        {/* Nav */}
        <nav className="flex-1 px-3 pt-4 pb-3 overflow-y-auto overflow-x-hidden scrollbar-hide">
          <SidebarBody
            collapsed={!railOpen}
            expanded={expanded}
            toggleExpanded={toggleExpanded}
            onNavigate={(p) => navigate(p)}
          />
        </nav>

        {/* Footer — collapse toggle */}
        <div className="shrink-0 px-3 py-3 border-t border-tpl-stroke dark:border-tpl-stroke">
          <button
            onClick={toggleCollapsed}
            className="mt-2 w-full flex items-center gap-2.5 h-9 px-2 rounded-xl text-[12.5px] font-medium text-tpl-dark-5 hover:text-tpl-primary hover:bg-[var(--glass-bg-hover)] transition-colors"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <motion.span
              animate={{ rotate: collapsed ? 180 : 0 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="grid place-items-center w-9 h-5 shrink-0"
            >
              <ChevronsLeft size={16} />
            </motion.span>
            <span className={`whitespace-nowrap ${reveal(!railOpen)}`}>Collapse</span>
          </button>
        </div>
      </aside>
    </MotionConfig>
  );
};

export default AdminSidebar;
