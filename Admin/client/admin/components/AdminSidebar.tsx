import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Grid3X3,
  FileTextIcon,
  CreditCard,
  BarChart3,
  ThumbsUp,
  Box,
  Settings,
  Bell,
  TrendingUp,
  Users2,
  LogOut,
  ChevronDown,
  X,
} from "lucide-react";
import LogoWebsite from "../../components/ui/LogoWebsite";

interface AdminSidebarProps {
  className?: string;
  showMobileSidebar;
  setShowMobileSidebar;
}

interface SubItem {
  label: string;
  path: string;
  active: boolean;
}

interface SidebarItem {
  icon: any;
  label: string;
  active?: boolean;
  path?: string;
  hasSubmenu?: boolean;
  subItems?: SubItem[];
}

interface SidebarSection {
  group?: string;
  items: SidebarItem[];
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({
  className = "",
  showMobileSidebar,
  setShowMobileSidebar,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>([
    "Management",
    "Analytics",
  ]);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/login");
  };

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const sections: SidebarSection[] = [
    {
      items: [
        {
          icon: Grid3X3,
          label: "Dashboard",
          active: location.pathname === "/dashboard",
          path: "/dashboard",
        },
      ],
    },
    {
      group: "Manage",
      items: [
        {
          icon: FileTextIcon,
          label: "Management",
          hasSubmenu: true,
          active: location.pathname.startsWith("/management"),
          path: "/management/listing",
          subItems: [
            { label: "Listing", path: "/management/listing", active: isActive("/management/listing") },
            { label: "User", path: "/management/user", active: isActive("/management/user") },
            { label: "Vendor", path: "/management/vendor", active: isActive("/management/vendor") },
            { label: "Booking", path: "/management/booking", active: isActive("/management/booking") },
          ],
        },
        {
          icon: CreditCard,
          label: "Payments",
          active: isActive("/payments"),
          path: "/payments",
        },
        {
          icon: ThumbsUp,
          label: "Help Desk",
          active: isActive("/help-desk"),
          path: "/help-desk",
        },
      ],
    },
    {
      group: "Growth",
      items: [
        {
          icon: BarChart3,
          label: "Analytics",
          hasSubmenu: true,
          active: location.pathname.startsWith("/analytics"),
          path: "/analytics",
          subItems: [
            { label: "Analytics", path: "/analytics", active: location.pathname === "/analytics" },
            { label: "Report", path: "/analytics/report", active: isActive("/analytics/report") },
          ],
        },
        {
          icon: TrendingUp,
          label: "Marketing",
          active: isActive("/marketing"),
          path: "/marketing",
        },
      ],
    },
    {
      group: "System",
      items: [
        {
          icon: Box,
          label: "CMS",
          active: isActive("/cms"),
          path: "/cms",
        },
        {
          icon: Bell,
          label: "CRM",
          active: isActive("/crm"),
          path: "/crm",
        },
        {
          icon: Box,
          label: "Plugins",
          active: isActive("/plugins"),
          path: "/plugins",
        },
        {
          icon: Users2,
          label: "Staff",
          hasSubmenu: true,
          active: location.pathname.startsWith("/staff"),
          path: "/staff",
          subItems: [
            { label: "Roles", path: "/staff/roles", active: isActive("/staff/roles") },
            { label: "List of Staff", path: "/staff", active: location.pathname === "/staff" },
          ],
        },
        {
          icon: Settings,
          label: "Global Settings",
          active: isActive("/global-settings"),
          path: "/global-settings",
        },
      ],
    },
  ];

  const allItems = sections.flatMap((s) => s.items);

  const toggleSubmenu = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label],
    );
  };

  const NavItem = ({
    item,
    onNavigate,
  }: {
    item: SidebarItem;
    onNavigate?: () => void;
  }) => {
    const isExpanded = expandedItems.includes(item.label);
    const hasActiveSubItem = item.subItems?.some((s) => s.active);
    const isActive = item.active || hasActiveSubItem;

    return (
      <div>
        <button
          onClick={() => {
            if (item.hasSubmenu) toggleSubmenu(item.label);
            if (item.path) {
              navigate(item.path);
              onNavigate?.();
            }
          }}
          title={sidebarCollapsed ? item.label : undefined}
          className={`
            w-full flex items-center gap-2.5 px-3 rounded-lg text-left transition-all duration-150
            h-9 text-[12.5px] font-medium
            ${isActive
              ? "bg-brand-500 text-white shadow-sm"
              : "text-dashboard-neutral-07 hover:bg-surface-muted hover:text-brand-500"
            }
            ${sidebarCollapsed ? "justify-center px-0" : ""}
          `}
        >
          <item.icon size={15} strokeWidth={1.6} className="shrink-0" />
          {!sidebarCollapsed && (
            <>
              <span className="flex-1 truncate">{item.label}</span>
              {item.hasSubmenu && (
                <ChevronDown
                  size={13}
                  className={`shrink-0 transition-transform ${isExpanded ? "rotate-0" : "-rotate-90"}`}
                />
              )}
            </>
          )}
        </button>

        <AnimatePresence initial={false}>
          {item.subItems && isExpanded && !sidebarCollapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="ml-[22px] mt-0.5 space-y-0.5 relative">
                <div
                  className="absolute left-0 top-0 w-px bg-surface-border"
                  style={{ height: `${item.subItems.length * 34 - 8}px` }}
                />
                {item.subItems.map((sub, si) => (
                  <motion.button
                    key={si}
                    initial={{ x: -4, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: si * 0.03, duration: 0.12 }}
                    onClick={() => { navigate(sub.path); onNavigate?.(); }}
                    className={`
                      w-full flex items-center pl-4 pr-3 h-[34px] rounded-md text-left text-[12px] transition-all
                      ${sub.active
                        ? "bg-brand-50 text-brand-600 font-semibold"
                        : "text-gray-500 hover:bg-surface-muted hover:text-brand-500"
                      }
                    `}
                  >
                    {sub.label}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <>
      {/* Mobile overlay */}
      {showMobileSidebar && (
        <div className="fixed inset-0 z-50 bg-black/50 lg:hidden" onClick={() => setShowMobileSidebar(false)}>
          <div
            className="fixed left-0 top-0 h-full w-[220px] bg-white border-r border-surface-border flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 h-[52px] border-b border-surface-border shrink-0">
              <LogoWebsite />
              <button onClick={() => setShowMobileSidebar(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>
            <nav className="flex-1 px-2 py-3 space-y-3 overflow-y-auto scrollbar-hide">
              {sections.map((section, si) => (
                <div key={si}>
                  {section.group && (
                    <p className="px-3 mb-1 text-[10.5px] font-semibold uppercase tracking-widest text-gray-400">
                      {section.group}
                    </p>
                  )}
                  <div className="space-y-0.5">
                    {section.items.map((item, ii) => (
                      <NavItem key={ii} item={item} onNavigate={() => setShowMobileSidebar(false)} />
                    ))}
                  </div>
                </div>
              ))}
            </nav>
            <div className="px-2 py-3 border-t border-surface-border shrink-0">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 h-9 rounded-lg text-red-500 hover:bg-red-50 transition-colors text-[12.5px] font-medium"
              >
                <LogOut size={15} strokeWidth={1.6} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div
        className={`relative hidden lg:flex flex-col h-screen bg-white border-r border-surface-border transition-all duration-300 shrink-0 ${sidebarCollapsed ? "w-[60px]" : "w-[220px]"} ${className}`}
      >
        {/* Logo */}
        <div className={`flex items-center h-[52px] border-b border-surface-border shrink-0 ${sidebarCollapsed ? "justify-center px-2" : "px-4"}`}>
          {!sidebarCollapsed ? <LogoWebsite /> : <Grid3X3 size={18} className="text-brand-500" />}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-3 overflow-y-auto scrollbar-hide overflow-x-hidden">
          {sections.map((section, si) => (
            <div key={si}>
              {section.group && !sidebarCollapsed && (
                <p className="px-3 mb-1 text-[10.5px] font-semibold uppercase tracking-widest text-gray-400">
                  {section.group}
                </p>
              )}
              <div className="space-y-0.5">
                {section.items.map((item, ii) => (
                  <NavItem key={ii} item={item} />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className={`px-2 py-3 border-t border-surface-border shrink-0`}>
          <button
            onClick={handleLogout}
            title={sidebarCollapsed ? "Logout" : undefined}
            className={`w-full flex items-center gap-2.5 px-3 h-9 rounded-lg text-red-500 hover:bg-red-50 transition-colors text-[12.5px] font-medium ${sidebarCollapsed ? "justify-center px-0" : ""}`}
          >
            <LogOut size={15} strokeWidth={1.6} className="shrink-0" />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-[60px] z-10 bg-white border border-surface-border rounded-full p-0.5 shadow-sm hover:shadow-md transition-all"
        >
          <ChevronDown
            size={12}
            className={`transition-transform duration-300 ${sidebarCollapsed ? "rotate-[-90deg]" : "rotate-90"}`}
          />
        </button>
      </div>
    </>
  );
};

export default AdminSidebar;
