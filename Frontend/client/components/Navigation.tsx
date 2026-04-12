import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation, Link } from 'react-router-dom';
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
  PanelLeftOpen,
  PanelLeftClose,
} from 'lucide-react';
import LogoWebsite from './ui/LogoWebsite';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAuth } from '../contexts/AuthContext';
import { getImageUrl } from '@/lib/utils';

const TEAL = '#3BD9DA';
const W_OPEN = 240;
const W_CLOSED = 68;

type NavItem = {
  icon: React.ElementType;
  label: string;
  href: string;
  subItems?: { label: string; href: string }[];
};

type NavGroup = {
  groupLabel: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    groupLabel: 'Overview',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    ],
  },
  {
    groupLabel: 'Management',
    items: [
      {
        icon: Calendar,
        label: 'Bookings',
        href: '/bookings',
        subItems: [
          { label: 'Calendar', href: '/bookings' },
          { label: 'Booking Details', href: '/bookings/details' },
        ],
      },
      {
        icon: Award,
        label: 'Offering',
        href: '/offering',
        subItems: [
          { label: 'View Offerings', href: '/offering' },
          { label: 'Add Offerings', href: '/offering/add' },
        ],
      },
      { icon: BarChart3, label: 'Revenue', href: '/revenue' },
      {
        icon: TrendingUp,
        label: 'Marketing',
        href: '/marketing',
        subItems: [
          { label: 'Upload Content', href: '/marketing' },
          { label: 'Offers', href: '/marketing/offers' },
        ],
      },
    ],
  },
  {
    groupLabel: 'Insights',
    items: [
      { icon: PieChart, label: 'Analytics', href: '/analytics' },
      { icon: MessageCircle, label: 'Chat', href: '/dashchat' },
    ],
  },
  {
    groupLabel: 'Account',
    items: [
      {
        icon: Settings,
        label: 'Settings',
        href: '/settings',
        subItems: [
          { label: 'General Settings', href: '/settings' },
          { label: 'Raise Issue Ticket', href: '/settings/account' },
        ],
      },
    ],
  },
];

export const Sidebar = ({
  className = '',
  isCollapsed,
  onToggleCollapse,
  forceExpanded = false,
}: {
  className?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  forceExpanded?: boolean;
}) => {
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  // showText lags behind isOpen: false instantly, true after delay
  const [showText, setShowText] = useState(forceExpanded);
  const [openItems, setOpenItems] = useState<Set<string>>(new Set(['Bookings']));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isOpen = forceExpanded || hovered || pinned;

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (isOpen) {
      // Delay text mount until sidebar has visually opened enough
      timerRef.current = setTimeout(() => setShowText(true), 180);
    } else {
      // Remove text from DOM immediately — no delay, no bleed
      setShowText(false);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isOpen]);

  const isActive = (href: string) =>
    href === '/dashboard'
      ? location.pathname === '/dashboard'
      : location.pathname.startsWith(href);

  const isSubActive = (href: string) => location.pathname === href;

  const toggleItem = (label: string) => {
    setOpenItems(prev => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  };

  return (
    <TooltipProvider delayDuration={300}>
      {/* Plain <aside> with CSS transition — overflow:hidden always enforced via inline style */}
      <aside
        onMouseEnter={() => { if (!forceExpanded) setHovered(true); }}
        onMouseLeave={() => { if (!forceExpanded) setHovered(false); }}
        style={{
          width: isOpen ? W_OPEN : W_CLOSED,
          transition: 'width 0.22s cubic-bezier(0.4,0,0.2,1)',
          overflow: 'hidden',       // inline — never overridden
          minWidth: isOpen ? W_OPEN : W_CLOSED,
        }}
        className={`
          relative flex flex-col h-full flex-shrink-0
          bg-white dark:bg-gray-950
          border-r border-gray-100 dark:border-gray-800
          shadow-[2px_0_16px_rgba(0,0,0,0.05)]
          ${className}
        `}
      >
        {/* ── Logo ── */}
        <div
          className="h-[65px] flex items-center border-b border-gray-100 dark:border-gray-800 flex-shrink-0"
          style={{ padding: '0 14px' }}
        >
          {showText ? (
            <LogoWebsite />
          ) : (
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-[11px] font-extrabold tracking-wide select-none mx-auto"
              style={{
                background: `linear-gradient(135deg, ${TEAL} 0%, #22C4C5 100%)`,
                boxShadow: `0 2px 8px ${TEAL}44`,
              }}
            >
              TH
            </div>
          )}
        </div>

        {/* ── Nav ── */}
        <nav
          className="flex-1 py-2 scrollbar-hide"
          style={{ overflowY: 'auto', overflowX: 'hidden' }}
        >
          {navGroups.map((group, gi) => (
            <div key={group.groupLabel} className={gi > 0 ? 'mt-1' : ''}>

              {/* Divider (collapsed) or group label (expanded) */}
              {gi > 0 && !showText && (
                <div className="mx-4 my-2 h-px bg-gray-100 dark:bg-gray-800" />
              )}
              {showText && (
                <p className={`px-4 pb-1 text-[9.5px] font-bold tracking-[0.14em] uppercase text-gray-400 dark:text-gray-600 select-none whitespace-nowrap ${gi > 0 ? 'pt-4' : 'pt-2'}`}>
                  {group.groupLabel}
                </p>
              )}

              <div className="px-2">
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  const expanded = openItems.has(item.label);
                  const hasChildren = !!(item.subItems?.length);

                  return (
                    <div key={item.label}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={`
                              relative flex items-center rounded-xl cursor-pointer select-none mb-0.5
                              transition-colors duration-150
                              ${showText ? 'px-3 py-2.5' : 'justify-center py-2.5'}
                              ${active
                                ? 'bg-[#E8FAFA] dark:bg-[#3BD9DA]/10'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-800/70'
                              }
                            `}
                            onClick={() => {
                              if (hasChildren && showText) {
                                toggleItem(item.label);
                              } else {
                                navigate(item.href);
                              }
                            }}
                          >
                            {/* Active pill */}
                            {active && (
                              <span
                                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-full"
                                style={{ background: TEAL, height: '52%' }}
                              />
                            )}

                            {/* Icon */}
                            <item.icon
                              size={18}
                              className="flex-shrink-0 transition-colors duration-150"
                              style={{ color: active ? TEAL : undefined }}
                            />

                            {/* Label + chevron — strictly not in DOM when closed */}
                            {showText && (
                              <div className="flex items-center justify-between flex-1 ml-3 min-w-0 overflow-hidden">
                                <span
                                  className={`text-[13px] font-medium whitespace-nowrap truncate leading-none transition-colors duration-150 ${
                                    active
                                      ? 'text-gray-900 dark:text-white'
                                      : 'text-gray-600 dark:text-gray-400'
                                  }`}
                                >
                                  {item.label}
                                </span>
                                {hasChildren && (
                                  <ChevronRight
                                    size={13}
                                    className={`flex-shrink-0 ml-2 transition-transform duration-200 ${
                                      expanded ? 'rotate-90' : ''
                                    } ${active ? 'text-gray-500 dark:text-gray-400' : 'text-gray-300 dark:text-gray-600'}`}
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        </TooltipTrigger>

                        {/* Tooltip only when icons-only */}
                        {!showText && (
                          <TooltipContent side="right" sideOffset={12} className="text-xs font-medium">
                            {item.label}
                          </TooltipContent>
                        )}
                      </Tooltip>

                      {/* Sub-items */}
                      <AnimatePresence initial={false}>
                        {hasChildren && expanded && showText && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                            style={{ overflow: 'hidden' }}
                          >
                            <div className="ml-8 mr-1 mb-1 pl-3.5 border-l-2 border-gray-100 dark:border-gray-800 py-0.5">
                              {item.subItems!.map((sub) => {
                                const subActive = isSubActive(sub.href);
                                return (
                                  <Link key={sub.href} to={sub.href}>
                                    <div
                                      className={`py-[7px] px-2.5 text-[12px] font-medium rounded-lg mt-0.5 whitespace-nowrap transition-colors duration-150 ${
                                        subActive
                                          ? 'text-[#3BD9DA] bg-[#E8FAFA] dark:bg-[#3BD9DA]/10'
                                          : 'text-gray-500 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                                      }`}
                                    >
                                      {sub.label}
                                    </div>
                                  </Link>
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
          ))}
        </nav>

        {/* ── Footer ── */}
        <div
          className="flex-shrink-0 border-t border-gray-100 dark:border-gray-800 p-2.5"
          style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}
        >
          {/* User card — only when expanded */}
          {showText && user && (
            <div
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800/70 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150"
              onClick={() => navigate('/user-profile')}
            >
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-gray-200 ring-2 ring-white dark:ring-gray-700">
                <img
                  src={user.photo ? getImageUrl(user.photo) : '/user-avatar.svg'}
                  onError={(e) => { e.currentTarget.src = '/user-avatar.svg'; }}
                  alt="avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-gray-900 dark:text-white truncate leading-tight">
                  {[user.firstName, user.lastName].filter(Boolean).join(' ') || 'Vendor'}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: TEAL }} />
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">Vendor Account</p>
                </div>
              </div>
            </div>
          )}

          <div className="h-px bg-gray-100 dark:bg-gray-800 mx-1" />

          {/* Pin toggle */}
          {!forceExpanded && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setPinned(p => !p)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-150
                    ${!showText ? 'justify-center' : ''}
                    ${pinned
                      ? 'bg-[#E8FAFA] dark:bg-[#3BD9DA]/10 text-[#3BD9DA]'
                      : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }
                  `}
                >
                  {pinned
                    ? <PanelLeftClose size={16} className="flex-shrink-0" />
                    : <PanelLeftOpen size={16} className="flex-shrink-0" />
                  }
                  {showText && (
                    <span className="text-[13px] font-medium whitespace-nowrap">
                      {pinned ? 'Unpin sidebar' : 'Pin sidebar'}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              {!showText && (
                <TooltipContent side="right" sideOffset={12} className="text-xs font-medium">
                  {pinned ? 'Unpin sidebar' : 'Pin sidebar open'}
                </TooltipContent>
              )}
            </Tooltip>
          )}

          {/* Logout */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                onClick={() => {
                  localStorage.removeItem('user');
                  localStorage.removeItem('token');
                  window.location.href = '/';
                }}
                className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer
                  text-gray-400 dark:text-gray-500
                  hover:text-red-500 dark:hover:text-red-400
                  hover:bg-red-50 dark:hover:bg-red-950/20
                  transition-all duration-150
                  ${!showText ? 'justify-center' : ''}
                `}
              >
                <LogOut size={16} className="flex-shrink-0" />
                {showText && (
                  <span className="text-[13px] font-medium whitespace-nowrap">Logout</span>
                )}
              </div>
            </TooltipTrigger>
            {!showText && (
              <TooltipContent side="right" sideOffset={12} className="text-xs font-medium">
                Logout
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
};
