import React, { useState } from "react";
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
  Menu,
  X,
} from "lucide-react";
import LogoWebsite from "../../components/ui/LogoWebsite";
import AdminProfileDropdown from "./AdminProfileDropdown";

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

const AdminSidebar: React.FC<AdminSidebarProps> = ({ className = "",showMobileSidebar, setShowMobileSidebar }) => {
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

  // Sidebar menu items
const sidebarItems: SidebarItem[] = [
  {
    icon: Grid3X3,
    label: "Dashboard",
    active: location.pathname === "/dashboard",
    path: "/dashboard",
  },
  {
    icon: FileTextIcon,
    label: "Management",
    hasSubmenu: true,
    active: location.pathname.includes("/management"),
    path: "/management/listing",
    subItems: [
      {
        label: "Listing",
        path: "/management/listing",
        active: location.pathname === "/management/listing",
      },
      {
        label: "User",
        path: "/management/user",
        active: location.pathname === "/management/user",
      },
      {
        label: "Vendor",
        path: "/management/vendor",
        active: location.pathname === "/management/vendor",
      },
      {
        label: "Booking",
        path: "/management/booking",
        active: location.pathname === "/management/booking",
      },
    ],
  },
  {
    icon: CreditCard,
    label: "Payments",
    active: location.pathname === "/payments",
    path: "/payments",
  },
  {
    icon: BarChart3,
    label: "Analytics",
    hasSubmenu: true,
    active: location.pathname.includes("/analytics"),
    path: "/analytics",
    subItems: [
      {
        label: "Analytics",
        path: "/analytics",
        active: location.pathname === "/analytics",
      },
      {
        label: "Report",
        path: "/analytics/report",
        active: location.pathname === "/analytics/report",
      },
    ],
  },
  {
    icon: ThumbsUp,
    label: "Help Desk",
    active: location.pathname === "/help-desk",
    path: "/help-desk",
  },
  {
    icon: Box,
    label: "CMS",
    active: location.pathname === "/cms",
    path: "/cms",
  },
  {
    icon: Settings,
    label: "Global Settings",
    active: location.pathname === "/global-settings",
    path: "/global-settings",
  },
  {
    icon: Bell,
    label: "CRM",
    active: location.pathname === "/crm",
    path: "/crm",
  },
  {
    icon: TrendingUp,
    label: "Marketing",
    active: location.pathname === "/marketing",
    path: "/marketing",
  },
  {
    icon: Box,
    label: "Plugins",
    active: location.pathname === "/plugins",
    path: "/plugins",
  },
  {
    icon: Users2,
    label: "Staff",
    hasSubmenu: true,
    active: location.pathname.includes("/staff"),
    path: "/staff",
    subItems: [
      {
        label: "Roles",
        path: "/staff/roles",
        active: location.pathname === "/staff/roles",
      },
      {
        label: "List of Staff",
        path: "/staff",
        active:
          location.pathname === "/staff" &&
          !location.pathname.includes("roles"),
      },
    ],
  },
];

  const toggleSubmenu = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label],
    );
  };

  return (
    <>
      {/* Mobile Sidebar Overlay */}
      {showMobileSidebar && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 lg:hidden">
          <div className="fixed z-50 left-0 top-0 h-full w-64 bg-dashboard-bg transform transition-transform">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center justify-center">
                <LogoWebsite />
              </div>
              <button
                onClick={() => setShowMobileSidebar(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="p-4 space-y-2 overflow-y-scroll scrollbar-hide h-[55%] overflow-x-hidden">
              {sidebarItems.map((item, index) => (
                <div key={index}>
                  <button
                    onClick={() => {
                      if (item.hasSubmenu) {
                        toggleSubmenu(item.label);
                      }
                      if (item.path) {
                        navigate(item.path);
                        setShowMobileSidebar(false);
                      }
                    }}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors font-plus-jakarta text-base font-medium
                      ${
                        item.active
                          ? "bg-dashboard-primary text-white"
                          : "text-dashboard-neutral-07 hover:bg-gray-100"
                      }
                    `}
                  >
                    <item.icon size={20} strokeWidth={1.5} />
                    <span className="flex-1">{item.label}</span>
                    {item.hasSubmenu && (
                      <ChevronDown
                        size={16}
                        className={`transition-transform ${
                          expandedItems.includes(item.label)
                            ? "rotate-0"
                            : "rotate-90"
                        }`}
                      />
                    )}
                  </button>

                  {/* Mobile Submenu */}
                  {item.subItems && expandedItems.includes(item.label) && (
                    <div className="ml-9 space-y-1 mt-2">
                      {item.subItems.map((subItem, subIndex) => (
                        <button
                          key={subIndex}
                          onClick={() => {
                            navigate(subItem.path);
                            setShowMobileSidebar(false);
                          }}
                          className={`
                            w-full flex items-center px-3 py-2.5 rounded-lg text-left transition-colors font-geist text-sm tracking-tight
                            ${
                              subItem.active
                                ? "bg-dashboard-primary text-white"
                                : "text-gray-600 hover:bg-gray-100"
                            }
                          `}
                        >
                          {subItem.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
            <div className="p-4 mt-auto">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors font-plus-jakarta text-base font-medium"
              >
                <LogOut size={20} strokeWidth={1.5} />
                <span className="">Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div
        className={`hidden lg:flex flex-col gap-1 h-screen bg-dashboard-bg transition-all overflow-hidden duration-300 ${sidebarCollapsed ? "w-20" : "w-64"} ${className}`}
      >
        {/* Logo */}
        <div className="px-4 py-[26px]">
          <div className="flex items-center justify-center">
            <LogoWebsite />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-2 pt-5 z-20 overflow-y-scroll scrollbar-hide overflow-x-hidden">
          {sidebarItems.map((item, index) => {
            const isExpanded = expandedItems.includes(item.label);
            const hasActiveSubItem = item.subItems?.some(
              (subItem) => subItem.active,
            );

            return (
              <>
                <div key={index} className="space-y-2">
                  <button
                    onClick={() => {
                      if (item.hasSubmenu) {
                        toggleSubmenu(item.label);
                      }
                      if (item.path) {
                        navigate(item.path);
                      }
                    }}
                    className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-colors font-plus-jakarta text-base font-medium
                    ${
                      item.active || hasActiveSubItem
                        ? "bg-dashboard-primary text-white"
                        : "text-dashboard-neutral-07 hover:bg-gray-100"
                    }
                    ${sidebarCollapsed ? "justify-center" : ""}
                  `}
                  >
                    <span>
                      <item.icon size={20} strokeWidth={1.5} />
                    </span>
                    {!sidebarCollapsed && (
                      <>
                        <span className="flex-1">{item.label}</span>
                        {item.hasSubmenu && (
                          <ChevronDown
                            size={16}
                            className={`transition-transform ${
                              isExpanded ? "rotate-0" : "rotate-90"
                            }`}
                          />
                        )}
                      </>
                    )}
                  </button>

                  {/* Submenu */}
                  {item.subItems && isExpanded && !sidebarCollapsed && (
                    <div className="ml-9 space-y-1 relative">
                      {/* Tree Lines - Exact match to Figma design */}
                      <div
                        className="absolute -left-[13px] top-0 w-[13px]"
                        style={{ height: `${item.subItems.length * 40 + 4}px` }}
                      >
                        {/* Vertical line */}
                        <div
                          className="absolute left-0 top-0 w-[2px] border-l border-[#E7E7E7]"
                          style={{
                            height: `${item.subItems.length * 40 - 10}px`,
                          }}
                        ></div>

                        {/* Horizontal connecting lines for each sub-item */}
                        {item.subItems.map((_, subIndex) => (
                          <div
                            key={subIndex}
                            className="absolute left-0 w-[13px] h-[9px] border-l border-b border-[#E7E7E7] rounded-bl-lg"
                            style={{ top: `${14 + subIndex * 40}px` }}
                          ></div>
                        ))}
                      </div>

                      {item.subItems.map((subItem, subIndex) => (
                        <button
                          key={subIndex}
                          onClick={() => navigate(subItem.path)}
                          className={`
                          w-full flex items-center px-3 py-2.5 rounded-lg text-left transition-colors font-geist text-sm tracking-tight
                          ${
                            subItem.active
                              ? "bg-dashboard-primary text-white"
                              : "text-gray-600 hover:bg-gray-100"
                          }
                        `}
                        >
                          {subItem.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            );
          })}
        </nav>

        {/* Divider */}
        {!sidebarCollapsed && (
          <div className="px-4 py-2">
            <div className="h-px bg-dashboard-stroke w-full" />
          </div>
        )}

        {/* Logout */}
        <div className="p-4 z-50 bg-dashboard-bg">
          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors font-plus-jakarta text-base font-medium
              ${sidebarCollapsed ? "justify-center" : ""}
            `}
          >
            <LogOut size={20} strokeWidth={1.5} />
            {!sidebarCollapsed && <span className="">Logout</span>}
          </button>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className={`absolute  ${sidebarCollapsed ? "left-5" : "left-52"} top-20 bg-white border border-gray-200 rounded-full p-1.5 shadow-sm hover:shadow-md transition-shadow`}
        >
          <ChevronDown
            size={16}
            className={`transform transition-transform ${sidebarCollapsed ? "rotate-90" : "-rotate-90"}`}
          />
        </button>
      </div>

     
    </>
  );
};

export default AdminSidebar;
