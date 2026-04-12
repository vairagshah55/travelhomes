import React, { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
} from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  children?: MenuItem[];
  badge?: number;
}

interface SidebarProps {
  defaultCollapsed?: boolean;
  onToggle?: (collapsed: boolean) => void;
}

const menuItems: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  {
    id: 'bookings', label: 'Bookings', icon: Calendar, path: '/bookings',
    children: [
      { id: 'all-bookings',     label: 'All Bookings', icon: Calendar, path: '/bookings' },
      { id: 'booking-details',  label: 'Details',      icon: FileText, path: '/bookings/details' },
    ],
  },
  {
    id: 'offering', label: 'Offerings', icon: Package, path: '/offering',
    children: [
      { id: 'all-offerings', label: 'All Offerings', icon: Package, path: '/offering' },
      { id: 'add-offering',  label: 'Add New',       icon: Package, path: '/offering/add' },
    ],
  },
  { id: 'revenue',   label: 'Revenue',   icon: DollarSign,    path: '/revenue'    },
  {
    id: 'marketing', label: 'Marketing', icon: BarChart3, path: '/marketing',
    children: [
      { id: 'marketing-home', label: 'Overview', icon: BarChart3, path: '/marketing' },
      { id: 'offers',         label: 'Offers',   icon: Package,   path: '/marketing/offers' },
    ],
  },
  { id: 'analytics', label: 'Analytics', icon: BarChart3,     path: '/analytics'  },
  { id: 'messages',  label: 'Messages',  icon: MessageSquare, path: '/vendor-chat' },
];

const bottomMenuItems: MenuItem[] = [
  { id: 'notifications', label: 'Notifications',  icon: Bell,        path: '/notifications', badge: 8 },
  { id: 'settings',      label: 'Settings',        icon: Settings,    path: '/settings'       },
  { id: 'help',          label: 'Help & Support',  icon: HelpCircle,  path: '/help'           },
  { id: 'visit-site',    label: 'Visit Site',       icon: Globe,       path: '/'               },
];

/* ─── small reusable badge ─── */
const Badge = ({ count, active }: { count: number; active: boolean }) => (
  <span className={`
    inline-flex items-center justify-center
    text-[10px] font-bold leading-none
    min-w-[18px] h-[18px] px-1 rounded-full
    ${active
      ? 'bg-blue-600 text-white'
      : 'bg-gray-100 dark:bg-gray-700/80 text-gray-500 dark:text-gray-400'}
  `}>
    {count > 99 ? '99+' : count}
  </span>
);

/* ─── tooltip shown in collapsed mode ─── */
const CollapsedTooltip = ({ label, badge }: { label: string; badge?: number }) => (
  <div className="
    pointer-events-none absolute left-full ml-4 z-50
    flex items-center gap-2
    px-3 py-2 rounded-xl whitespace-nowrap
    bg-gray-900/95 dark:bg-gray-800 text-white text-[12px] font-medium
    shadow-2xl ring-1 ring-white/10
    opacity-0 invisible -translate-x-1
    group-hover:opacity-100 group-hover:visible group-hover:translate-x-0
    transition-all duration-150 ease-out
  ">
    {/* arrow */}
    <span className="absolute right-full top-1/2 -translate-y-1/2
      border-[5px] border-transparent border-r-gray-900/95 dark:border-r-gray-800" />
    {label}
    {badge !== undefined && badge > 0 && (
      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-blue-500 rounded-full leading-none">
        {badge}
      </span>
    )}
  </div>
);

export const Sidebar: React.FC<SidebarProps> = ({
  defaultCollapsed = false,
  onToggle,
}) => {
  const [pinned,        setPinned]        = useState(!defaultCollapsed);
  const [hoverOpen,     setHoverOpen]     = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const sidebarRef   = useRef<HTMLDivElement>(null);
  const hoverTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navigate  = useNavigate();
  const location  = useLocation();
  const isOpen    = pinned || hoverOpen;

  const handleMouseEnter = () => {
    if (pinned) return;
    hoverTimer.current = setTimeout(() => setHoverOpen(true), 100);
  };
  const handleMouseLeave = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    if (!pinned) { setHoverOpen(false); setExpandedItems(new Set()); }
  };
  const handlePinToggle = () => {
    const next = !pinned;
    setPinned(next);
    if (!next) setHoverOpen(false);
    onToggle?.(!next);
  };

  const toggleExpand = (id: string) => {
    if (!isOpen) return;
    setExpandedItems(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const isActive       = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');
  const isParentActive = (item: MenuItem) => isActive(item.path) || (item.children?.some(c => isActive(c.path)) ?? false);

  /* ─── single nav row (top-level) ─── */
  const renderItem = (item: MenuItem) => {
    const hasChildren = !!item.children?.length;
    const expanded    = expandedItems.has(item.id);
    const active      = isParentActive(item);

    return (
      <div key={item.id}>
        {/* ── collapsed state ── */}
        {!isOpen ? (
          <div className="group relative flex justify-center py-1 px-2">
            <button
              onClick={() => hasChildren ? toggleExpand(item.id) : navigate(item.path)}
              className={`
                relative flex items-center justify-center w-10 h-10 rounded-xl
                transition-all duration-150
                ${active
                  ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/30'
                  : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-white/[0.07] hover:text-gray-700 dark:hover:text-gray-200'}
              `}
            >
              <item.icon size={18} />
              {/* notification dot */}
              {item.badge !== undefined && item.badge > 0 && !active && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 ring-2 ring-white dark:ring-[#0f1117]" />
              )}
            </button>
            <CollapsedTooltip label={item.label} badge={item.badge} />
          </div>
        ) : (
          /* ── expanded state ── */
          <div
            onClick={() => hasChildren ? toggleExpand(item.id) : navigate(item.path)}
            className={`
              group relative flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl cursor-pointer select-none
              transition-all duration-150
              ${active
                ? 'bg-gradient-to-r from-blue-50 to-indigo-50/40 dark:from-blue-500/[0.12] dark:to-indigo-500/[0.04] text-blue-700 dark:text-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/[0.04] hover:text-gray-900 dark:hover:text-gray-100'}
            `}
          >
            {/* gradient left bar */}
            <span className={`
              absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full
              bg-gradient-to-b from-blue-500 to-indigo-500
              transition-all duration-200
              ${active ? 'h-6 opacity-100' : 'h-0 opacity-0'}
            `} />

            <item.icon
              size={16}
              className={`shrink-0 transition-all duration-150
                ${active ? 'text-blue-600 dark:text-blue-400' : 'group-hover:scale-110'}
              `}
            />

            <span className="flex-1 text-[13px] font-medium whitespace-nowrap tracking-[-0.01em]">
              {item.label}
            </span>

            {item.badge !== undefined && item.badge > 0 && (
              <Badge count={item.badge} active={active} />
            )}

            {hasChildren && (
              <ChevronRight
                size={13}
                className={`text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}
              />
            )}
          </div>
        )}

        {/* ── children (expanded only) ── */}
        {isOpen && hasChildren && expanded && (
          <div className="mt-0.5 mb-1 mx-2 ml-[calc(0.5rem+1.5rem)] space-y-0.5 border-l-2 border-gray-100 dark:border-gray-800/80 pl-3 pr-0">
            {item.children!.map(child => {
              const ca = isActive(child.path);
              return (
                <div
                  key={child.id}
                  onClick={() => navigate(child.path)}
                  className={`
                    group flex items-center gap-2 py-2 px-2.5 rounded-lg cursor-pointer
                    transition-colors duration-150 select-none
                    ${ca
                      ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400'
                      : 'text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/[0.04]'}
                  `}
                >
                  <span className={`w-1 h-1 rounded-full shrink-0 transition-colors duration-150
                    ${ca ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600 group-hover:bg-gray-400'}
                  `} />
                  <span className="flex-1 text-[12px] font-medium whitespace-nowrap">
                    {child.label}
                  </span>
                  {child.badge !== undefined && child.badge > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-500 text-white leading-none">
                      {child.badge}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  /* ─── logout row ─── */
  const renderLogout = () => {
    if (!isOpen) {
      return (
        <div className="group relative flex justify-center py-1 px-2">
          <button
            onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
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
        onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
        className="flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl cursor-pointer select-none
          text-gray-400 dark:text-gray-500
          hover:bg-red-50 dark:hover:bg-red-500/10
          hover:text-red-600 dark:hover:text-red-400
          transition-all duration-150 group"
      >
        <LogOut size={16} className="shrink-0 transition-transform duration-150 group-hover:scale-110" />
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
        bg-white dark:bg-[#0f1117]
        shadow-[inset_-1px_0_0_#f0f0f0] dark:shadow-[inset_-1px_0_0_#1c1f26]
        transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
      "
    >
      {/* ─── Header ─── */}
      <div className={`
        flex items-center h-[60px] shrink-0 px-3.5
        shadow-[inset_0_-1px_0_#f0f0f0] dark:shadow-[inset_0_-1px_0_#1c1f26]
        ${!isOpen ? 'justify-center' : ''}
      `}>
        {isOpen ? (
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            {/* logo mark */}
            <div className="w-8 h-8 shrink-0 rounded-xl
              bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600
              shadow-lg shadow-blue-500/25
              flex items-center justify-center"
            >
              <span className="text-white font-black text-[13px] leading-none">T</span>
            </div>

            <div className="min-w-0">
              <p className="text-[14px] font-bold text-gray-900 dark:text-white tracking-tight whitespace-nowrap leading-tight">
                TripHut
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight whitespace-nowrap">
                Host Dashboard
              </p>
            </div>

            <button
              onClick={handlePinToggle}
              title={pinned ? 'Unpin sidebar' : 'Pin sidebar open'}
              className={`
                ml-auto shrink-0 p-1.5 rounded-lg transition-all duration-150
                ${pinned
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10'
                  : 'text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
                }
              `}
            >
              {pinned ? <Pin size={13} /> : <PinOff size={13} />}
            </button>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-xl
            bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600
            shadow-lg shadow-blue-500/25
            flex items-center justify-center"
          >
            <span className="text-white font-black text-[13px] leading-none">T</span>
          </div>
        )}
      </div>

      {/* ─── Main nav ─── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3
        scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800 scrollbar-track-transparent"
      >
        {isOpen && (
          <p className="px-5 pt-1 pb-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400 dark:text-gray-600 whitespace-nowrap">
            Main Menu
          </p>
        )}
        <div className="space-y-0.5">
          {menuItems.map(renderItem)}
        </div>
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
