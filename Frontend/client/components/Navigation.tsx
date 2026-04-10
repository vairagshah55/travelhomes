import React, { useState } from 'react';
import {
  LayoutDashboard,
  Calendar,
  Award,
  BarChart3,
  TrendingUp,
  PieChart,
  MessageCircle,
  Settings,
  LogOut,
  ChevronRight,
  ChevronDown,
  ChevronLeft
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import LogoWebsite from './ui/LogoWebsite';

// Navigation Items
const navigationItems = [
  // { icon: LayoutDashboard, label: 'Dashboard', expandable: false, href: '/' },
 { icon: LayoutDashboard, label: 'Dashboard', expandable: false, href: '/dashboard' },

  { 
    icon: Calendar, 
    label: 'Bookings', 
    expandable: true, 
    href: '/bookings',
    subItems: [
      { label: 'Calendar', href: '/bookings' },
      { label: 'Bookings Details', href: '/bookings/details' },
      // { label: 'Add New Bookings', href: '/bookings/new' },
    ]
  },
  {
    icon: Award,
    label: 'Offering',
    expandable: true,
    href: '/offering',
    subItems: [
      { label: 'View Offerings', href: '/offering' },
      { label: 'Add Offerings', href: '/offering/add' },
    ]
  },
  { icon: BarChart3, label: 'Revenue', expandable: false, href: '/revenue' },
  {
    icon: TrendingUp,
    label: 'Marketing',
    expandable: true,
    href: '/marketing',
    subItems: [
      { label: 'Upload Content', href: '/marketing' },
      { label: 'Offers', href: '/marketing/offers' },
    ]
  },
  { icon: PieChart, label: 'Analytics', expandable: false, href: '/analytics' },
  { icon: MessageCircle, label: 'Chat', expandable: false, href: '/dashchat' },
  { 
    icon: Settings, 
    label: 'Settings', 
    expandable: true, 
    href: '/settings',
    subItems: [
      { label: 'General Settings', href: '/settings' },
      { label: 'Raise Issue Ticket', href: '/settings/account' },
    ]
  },
];

// Sidebar Navigation Component with Figma-style tree structure
export const Sidebar = ({ className = "", isCollapsed = false, onToggleCollapse }: { 
  className?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}) => {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['Bookings']));
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  const isSubItemActive = (href: string) => {
    return location.pathname === href;
  };

  const toggleExpanded = (itemLabel: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemLabel)) {
      newExpanded.delete(itemLabel);
    } else {
      newExpanded.add(itemLabel);
    }
    setExpandedItems(newExpanded);
  };

  const isExpanded = (itemLabel: string) => expandedItems.has(itemLabel);

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'}  h-full bg-dashboard-bg dark:bg-gray-900 p-4 flex flex-col transition-all duration-300 ${className}`}>
      {/* Logo */}
      <div className="flex items-center justify-center p-4 ">
        {!isCollapsed && (
         <LogoWebsite/>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 relative overflow-y-auto scrollbar-hide">
        {navigationItems.map((item, index) => (
          <div key={index} className="relative">
            {/* Main Navigation Item */}
            <div
              className={`group flex items-center justify-between transition-all duration-200 ${
                isActive(item.href)
                  ? 'bg-black text-white rounded-xl shadow-sm'
                  : 'text-dashboard-neutral-07 dark:text-gray-300 hover:text-dashboard-primary'
              }`}
              onClick={() => {
                if (item.expandable && !isCollapsed) {
                  toggleExpanded(item.label);
                }
              }}
            >
              <Link to={item.href} className="flex items-center gap-3 flex-1 p-3">
                <item.icon size={20} className="flex-shrink-0" />
                {!isCollapsed && <span className="font-medium font-plus-jakarta text-base">{item.label}</span>}
              </Link>

              {item.expandable && !isCollapsed && (
                <ChevronDown
                  size={16}
                  className={`mr-3 transition-transform duration-200 ${
                    isExpanded(item.label) ? 'rotate-180' : 'rotate-90'
                  } ${
                    isActive(item.href) ? 'text-white' : 'text-dashboard-primary dark:text-gray-400'
                  }`}
                />
              )}
            </div>

            {/* Submenu */}
            {item.expandable && item.subItems && isExpanded(item.label) && !isCollapsed && (
              <div className="mt-1 pl-12">
                {item.subItems.map((subItem, subIndex) => (
                  <Link key={subIndex} to={subItem.href}>
                    <div className={`py-2 px-3 text-sm font-plus-jakarta transition-all duration-200 cursor-pointer ${
                      isSubItemActive(subItem.href)
                        ? 'text-dashboard-primary font-medium'
                        : 'text-dashboard-neutral-07 dark:text-gray-400 hover:text-dashboard-primary'
                    }`}>
                      {subItem.label}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Separator */}
      <div className="h-px bg-dashboard-stroke dark:bg-gray-700 my-8" />

      {/* Logout */}
      <div
      onClick={() => {
        // Clear user data and token from localStorage
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        // Redirect to login page
        window.location.href = '/';
      }
        } 
      className="flex items-center gap-3 p-3 cursor-pointer text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
        <LogOut size={20} className="flex-shrink-0" />
        {!isCollapsed && <span className="font-medium font-plus-jakarta text-base">Logout</span>}
      </div>
    </div>
  );
};
