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
import LogoWebsite from "@/components/admin/LogoWebsite";

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
    sessionStorage.removeItem("adminToken");
    navigate("/admin/login");
  };

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const sections: SidebarSection[] = [
    {
      items: [
        {
          icon: Grid3X3,
          label: "Dashboard",
          active: location.pathname === "/admin/dashboard",
          path: "/admin/dashboard",
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
          active: location.pathname.startsWith("/admin/management"),
          path: "/admin/management/listing",
          subItems: [
            { label: "Listing", path: "/admin/management/listing", active: isActive("/admin/management/listing") },
            { label: "User", path: "/admin/management/user", active: isActive("/admin/management/user") },
            { label: "Vendor", path: "/admin/management/vendor", active: isActive("/admin/management/vendor") },
            { label: "Booking", path: "/admin/management/booking", active: isActive("/admin/management/booking") },
          ],
        },
        {
          icon: CreditCard,
          label: "Payments",
          active: isActive("/admin/payments"),
          path: "/admin/payments",
        },
        {
          icon: ThumbsUp,
          label: "Help Desk",
          active: isActive("/admin/help-desk"),
          path: "/admin/help-desk",
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
          active: location.pathname.startsWith("/admin/analytics"),
          path: "/admin/analytics",
          subItems: [
            { label: "Analytics", path: "/admin/analytics", active: location.pathname === "/admin/analytics" },
            { label: "Report", path: "/admin/analytics/report", active: isActive("/admin/analytics/report") },
          ],
        },
        {
          icon: TrendingUp,
          label: "Marketing",
          active: isActive("/admin/marketing"),
          path: "/admin/marketing",
        },
      ],
    },
    {
      group: "System",
      items: [
        {
          icon: Box,
          label: "CMS",
          active: isActive("/admin/cms"),
          path: "/admin/cms",
        },
        {
          icon: Bell,
          label: "CRM",
          active: isActive("/admin/crm"),
          path: "/admin/crm",
        },
        {
          icon: Box,
          label: "Plugins",
          active: isActive("/admin/plugins"),
          path: "/admin/plugins",
        },
        {
          icon: Users2,
          label: "Staff",
          hasSubmenu: true,
          active: location.pathname.startsWith("/admin/staff"),
          path: "/admin/staff",
          subItems: [
            { label: "Roles", path: "/admin/staff/roles", active: isActive("/admin/staff/roles") },
            { label: "List of Staff", path: "/admin/staff", active: location.pathname === "/admin/staff" },
          ],
        },
        {
          icon: Settings,
          label: "Global Settings",
          active: isActive("/admin/global-settings"),
          path: "/admin/global-settings",
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
            group relative w-full flex items-center gap-2.5 px-2.5 rounded-md text-left
            transition-[background-color,color] duration-150 ease-out
            h-9 text-[13px]
            ${isActive
              ? "bg-ocean-50 text-ocean-700 font-semibold"
              : "text-gray-600 font-medium hover:bg-gray-100 hover:text-gray-900"
            }
            ${sidebarCollapsed ? "justify-center px-0" : ""}
          `}
        >
          {/* Left accent bar — slides in/out on active with shared layoutId for cross-item motion */}
          {isActive && !sidebarCollapsed && (
            <motion.span
              layoutId="sidebar-active-accent"
              className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-ocean-500"
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
            />
          )}

          <item.icon
            size={16}
            strokeWidth={isActive ? 2 : 1.75}
            className={`shrink-0 transition-colors ${isActive ? "text-ocean-600" : "text-gray-400 group-hover:text-gray-600"}`}
          />
          {!sidebarCollapsed && (
            <>
              <span className="flex-1 truncate">{item.label}</span>
              {item.hasSubmenu && (
                <motion.span
                  animate={{ rotate: isExpanded ? 0 : -90 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  className="shrink-0 text-gray-400 group-hover:text-gray-600"
                >
                  <ChevronDown size={13} />
                </motion.span>
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
              <div className="ml-[18px] pl-3 mt-0.5 mb-1 space-y-px border-l border-gray-200">
                {item.subItems.map((sub, si) => (
                  <motion.button
                    key={si}
                    initial={{ x: -4, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: si * 0.025, duration: 0.14, ease: "easeOut" }}
                    onClick={() => { navigate(sub.path); onNavigate?.(); }}
                    className={`
                      relative w-full flex items-center gap-2 px-2.5 h-7 rounded-md text-left text-[12.5px]
                      transition-[background-color,color] duration-150
                      ${sub.active
                        ? "bg-ocean-50 text-ocean-700 font-semibold"
                        : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                      }
                    `}
                  >
                    <span className={`w-1 h-1 rounded-full shrink-0 transition-colors ${sub.active ? "bg-ocean-500" : "bg-gray-300"}`} />
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
            className="fixed left-0 top-0 h-full w-60 bg-white border-r border-gray-200 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 h-14 border-b border-gray-200 shrink-0">
              <LogoWebsite />
              <button onClick={() => setShowMobileSidebar(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>
            <nav className="flex-1 px-2 py-3 space-y-4 overflow-y-auto scrollbar-hide">
              {sections.map((section, si) => (
                <div key={si}>
                  {section.group && (
                    <p className="px-3 mb-1 text-[11px] font-medium text-gray-400">
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
            <div className="px-2 py-2 border-t border-gray-200 shrink-0">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-2.5 h-8 rounded-md text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors text-[13px] font-medium"
              >
                <LogOut size={16} strokeWidth={1.75} />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div
        className={`relative hidden lg:flex flex-col h-screen bg-white border-r border-gray-200 transition-all duration-300 shrink-0 ${sidebarCollapsed ? "w-16" : "w-56"} ${className}`}
      >
        {/* Logo */}
        <div className={`flex items-center h-14 border-b border-gray-200 shrink-0 ${sidebarCollapsed ? "justify-center px-2" : "px-4"}`}>
          {!sidebarCollapsed ? <LogoWebsite /> : <Grid3X3 size={18} className="text-brand-500" />}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-4 overflow-y-auto scrollbar-hide overflow-x-hidden">
          {sections.map((section, si) => (
            <div key={si}>
              {section.group && !sidebarCollapsed && (
                <p className="px-3 mb-1 text-[11px] font-medium text-gray-400">
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
        <div className="px-2 py-2 border-t border-gray-200 shrink-0">
          <button
            onClick={handleLogout}
            title={sidebarCollapsed ? "Logout" : undefined}
            className={`w-full flex items-center gap-2.5 px-2.5 h-8 rounded-md text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors text-[13px] font-medium ${sidebarCollapsed ? "justify-center px-0" : ""}`}
          >
            <LogOut size={16} strokeWidth={1.75} className="shrink-0" />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>

        {/* Collapse toggle — sits on the right edge, centered on logo divider */}
        <motion.button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.92 }}
          className="absolute -right-3 top-[44px] z-10 h-6 w-6 flex items-center justify-center bg-white border border-gray-200 rounded-full shadow-sm hover:shadow-md text-gray-500 hover:text-ocean-600 hover:border-ocean-300 transition-colors"
          aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <motion.span
            animate={{ rotate: sidebarCollapsed ? -90 : 90 }}
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="flex"
          >
            <ChevronDown size={12} />
          </motion.span>
        </motion.button>
      </div>
    </>
  );
};

export default AdminSidebar;
