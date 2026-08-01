import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Bell,
  Box,
  ChevronRight,
  CreditCard,
  FileText,
  Layers,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Megaphone,
  Pin,
  PinOff,
  Settings,
  Users2,
  type LucideIcon,
} from "lucide-react";

import { AdminBrandMark } from "@/components/admin/AdminBrand";
import { BrandLogo } from "@/components/BrandLogo";
import LogoWebsite from "@/components/admin/LogoWebsite";
import { useAuth } from "@/contexts/AdminAuthContext";
import { featureForPath } from "@/lib/adminPermissions";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

/* The admin rail and the vendor rail (components/Navigation.tsx) are the same
   piece of chrome in two apps, so they share a shape:

     1. brand row     (84px, fixed — its bottom edge lines up with the header)
     2. nav           (flex-1, the ONLY scroll container; native scrollbar
                       hidden, cut edges fade instead)
     3. footer        (sign out, fixed)

   Pin lives in the brand row rather than a footer button: an unpinned rail
   peeks open on hover, so a permanent "Collapse" row at the bottom was a
   second control for the same state, eating a band of fixed height. */

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
  /** Per-item accent hue (color-coded nav tiles). 6-digit hex. */
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

/** Where a row goes when clicked — its own path, or its first child's. */
const targetOf = (item: NavItem) => item.path ?? item.children?.[0]?.path;

/* Label-reveal class. Labels/chevrons fade out while the rail is narrow and
   fade back in when it's expanded (pinned open, or peeking on hover). The
   expand state is computed in JS (see `railOpen` below) rather than CSS
   `:hover`, because a pure-CSS peek can't be suppressed right after the user
   unpins while the cursor is still over the panel — which made collapse look
   broken. `pointer-events-none` while hidden keeps the chevron from swallowing
   clicks aimed at the 76px rail. */
const reveal = (hidden: boolean) =>
  `transition-opacity duration-200 ${hidden ? "opacity-0 pointer-events-none" : "opacity-100"}`;

/** Section caption above a nav group. */
const SectionLabel = ({ hidden, children }: { hidden: boolean; children: React.ReactNode }) => (
  <p
    className={cn(
      "px-2 mb-1.5 h-4 text-[10.5px] font-bold uppercase tracking-[0.07em]",
      "text-tpl-dark-5 whitespace-nowrap",
      reveal(hidden),
    )}
  >
    {children}
  </p>
);

/* ── Nav row ─────────────────────────────────────────────────────────────── */
interface NavRowProps {
  item: NavItem;
  collapsed: boolean;
  active: boolean;
  hasActiveChild: boolean;
  expanded: boolean;
  /** Anchor the rail scrolls to. Only the deepest active row carries it. */
  anchor: boolean;
  /** `undefined` opts this instance out of the shared sliding pill. */
  pillId?: string;
  onToggle: () => void;
  onOpen: () => void;
}

function NavRow({
  item,
  collapsed,
  active,
  hasActiveChild,
  expanded,
  anchor,
  pillId,
  onToggle,
  onOpen,
}: NavRowProps) {
  const isActive = active || hasActiveChild;
  const hasChildren = !!item.children?.length;

  return (
    /* Two hit targets in one visual row: the row navigates, the chevron only
       folds. Nested <button>s are invalid HTML, so they're siblings inside a
       positioned wrapper that carries the pill + hover wash. */
    <div className="group relative flex items-center rounded-xl">
      {/* Sliding active pill — a single shared element animates between rows
          (framer layoutId). */}
      {isActive && (
        <motion.span
          layoutId={pillId}
          className="absolute inset-0 rounded-xl bg-[rgba(13,148,136,0.09)] shadow-[inset_3px_0_0_0_#0d9488]"
          transition={{ type: "spring", stiffness: 520, damping: 42 }}
        />
      )}
      {/* Hover wash for inactive rows */}
      {!isActive && (
        <span className="absolute inset-0 rounded-xl bg-transparent group-hover:bg-[rgba(16,24,40,0.045)] transition-colors duration-200" />
      )}

      <button
        onClick={onOpen}
        title={item.label}
        aria-current={isActive ? "page" : undefined}
        data-active-row={anchor ? "" : undefined}
        className="relative z-10 flex-1 min-w-0 flex items-center gap-3 h-11 pl-2 pr-1 rounded-xl text-left text-[14px] font-medium text-[#475467] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#0d9488]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f1f8f7]"
      >
        {/* Icon tile — inverts on active (solid teal + white glyph). Fixed
            position so it never shifts between collapsed/expanded. */}
        <span
          className="grid place-items-center w-9 h-9 rounded-lg shrink-0 transition-all duration-200 group-hover:scale-[1.06]"
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
          className={cn(
            "flex-1 truncate tracking-[-0.01em] transition-transform duration-200",
            isActive
              ? "text-[#0d9488] font-semibold"
              : "group-hover:translate-x-0.5 group-hover:text-[#101828]",
            reveal(collapsed),
          )}
        >
          {item.label}
        </span>
      </button>

      {hasChildren && (
        <button
          onClick={onToggle}
          aria-expanded={expanded}
          aria-label={`${expanded ? "Collapse" : "Expand"} ${item.label}`}
          className={cn(
            "relative z-10 shrink-0 grid place-items-center w-6 h-11 mr-1 rounded-lg outline-none",
            "text-tpl-dark-5/70 hover:text-[#101828] transition-colors",
            "focus-visible:ring-2 focus-visible:ring-[#0d9488]/40",
            reveal(collapsed),
          )}
        >
          <ChevronRight
            size={13}
            strokeWidth={2.4}
            className={cn("transition-transform duration-200", expanded && "rotate-90")}
          />
        </button>
      )}
    </div>
  );
}

/* ── Sidebar nav body — shared between desktop and mobile ──────────────── */
interface SidebarBodyProps {
  collapsed: boolean;
  expanded: string[];
  pillId?: string;
  toggleExpanded: (label: string) => void;
  onNavigate: (path: string) => void;
  onOpenItem: (item: NavItem) => void;
}

function SidebarBody({
  collapsed,
  expanded,
  pillId,
  toggleExpanded,
  onNavigate,
  onOpenItem,
}: SidebarBodyProps) {
  const isActive = useActivePath();
  const { can } = useAuth();

  /**
   * Drop anything the role can't open. A parent with children is kept only if at
   * least one child survives, and a whole group disappears once it's empty — so
   * a dashboard-only staff member sees just Dashboard instead of a nav full of
   * links that would bounce them straight back.
   */
  const visibleSections = useMemo(() => {
    const allowed = (path?: string) => {
      if (!path) return true;
      const feature = featureForPath(path);
      return !feature || can(feature);
    };

    return SECTIONS.map((section) => ({
      ...section,
      items: section.items
        .map((item) => {
          if (item.children?.length) {
            const children = item.children.filter((c) => allowed(c.path));
            return children.length ? { ...item, children } : null;
          }
          return allowed(item.path) ? item : null;
        })
        .filter((i): i is NavItem => i !== null),
    })).filter((section) => section.items.length > 0);
  }, [can]);

  return (
    <div>
      {visibleSections.map((section, si) => (
        <div key={si} className="mb-4 last:mb-0">
          {section.group && <SectionLabel hidden={collapsed}>{section.group}</SectionLabel>}

          <div className="space-y-1">
            {section.items.map((item) => {
              const itemActive = isActive(item.path);
              const childActive = item.children?.some((c) => isActive(c.path)) ?? false;
              const isExpanded = expanded.includes(item.label);
              const hasChildren = !!item.children?.length;
              // For a group, the scroll anchor is the active child row below —
              // not the parent — unless the group is folded shut.
              const anchor = (itemActive || childActive) && (!hasChildren || !isExpanded);

              return (
                <div key={item.label}>
                  <NavRow
                    item={item}
                    collapsed={collapsed}
                    active={itemActive}
                    hasActiveChild={childActive}
                    expanded={isExpanded}
                    anchor={anchor}
                    pillId={pillId}
                    onToggle={() => toggleExpanded(item.label)}
                    onOpen={() => onOpenItem(item)}
                  />

                  {/* Sub-items. Hidden while the rail is narrow — there's
                      nowhere to draw them at 76px. */}
                  <AnimatePresence initial={false}>
                    {!collapsed && hasChildren && isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                        className="overflow-hidden"
                      >
                        <ul className="mt-1 mb-1 ml-[26px] mr-1 space-y-0.5 border-l border-tpl-stroke pl-3">
                          {item.children!.map((sub, subIndex) => {
                            const subActive = isActive(sub.path);
                            return (
                              <motion.li
                                key={sub.path}
                                initial={{ x: -6, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: subIndex * 0.04, duration: 0.15 }}
                              >
                                <button
                                  onClick={() => onNavigate(sub.path)}
                                  aria-current={subActive ? "page" : undefined}
                                  data-active-row={subActive ? "" : undefined}
                                  className={cn(
                                    "group/sub w-full flex items-center gap-2 h-8 px-2.5 rounded-lg",
                                    "text-left select-none outline-none transition-colors duration-150",
                                    "focus-visible:ring-2 focus-visible:ring-[#0d9488]/40",
                                    subActive
                                      ? "bg-[rgba(13,148,136,0.09)] text-[#0d9488]"
                                      : "text-tpl-dark-6 hover:bg-[rgba(16,24,40,0.045)] hover:text-tpl-dark",
                                  )}
                                >
                                  <span
                                    className={cn(
                                      "w-1 h-1 rounded-full shrink-0 transition-colors duration-150",
                                      subActive
                                        ? "bg-[#0d9488]"
                                        : "bg-tpl-dark-5/40 group-hover/sub:bg-tpl-dark-5",
                                    )}
                                  />
                                  <span
                                    className={cn(
                                      "flex-1 truncate text-[12.5px]",
                                      subActive ? "font-semibold" : "font-medium",
                                    )}
                                  >
                                    {sub.label}
                                  </span>
                                </button>
                              </motion.li>
                            );
                          })}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
  const { pathname } = useLocation();
  const isActive = useActivePath();
  const { logout } = useAuth();
  const scrollRef = useRef<HTMLElement>(null);

  // Pinned = the rail stays open. Persisted under the original key so an
  // existing preference carries over.
  const [pinned, setPinned] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("adminSidebarCollapsed") !== "1";
  });
  useEffect(() => {
    localStorage.setItem("adminSidebarCollapsed", pinned ? "0" : "1");
  }, [pinned]);

  // Hover-peek: an unpinned rail expands while the cursor is over it. JS (not
  // CSS :hover) so we can drop the peek the instant the user unpins —
  // otherwise the cursor sitting on the panel keeps it open.
  const [peek, setPeek] = useState(false);
  const railOpen = pinned || peek;
  const togglePinned = () =>
    setPinned((v) => {
      const next = !v;
      if (!next) setPeek(false); // collapse immediately, even under the cursor
      return next;
    });

  // Parents whose children own the current route always count as expanded, so
  // landing on a sub-route shows the active sub-link instead of a folded group.
  const activeParents = useMemo(
    () =>
      SECTIONS.flatMap((s) => s.items)
        .filter((i) => i.children?.some((c) => isActive(c.path)))
        .map((i) => i.label),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pathname],
  );
  const [expanded, setExpanded] = useState<string[]>(activeParents);
  useEffect(() => {
    if (activeParents.length) setExpanded(activeParents);
  }, [activeParents]);

  /** Accordion: opening a group closes the others; re-clicking closes it. */
  const toggleExpanded = (label: string) =>
    setExpanded((prev) => (prev.includes(label) ? [] : [label]));

  /* ─── scroll affordance ───
     The native scrollbar is hidden, so the scroller fades its cut edges
     instead — reads as "there's more" without a grey gutter down the rail. */
  const [edges, setEdges] = useState({ top: false, bottom: false });
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const sync = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      setEdges({ top: scrollTop > 4, bottom: scrollTop + clientHeight < scrollHeight - 4 });
    };
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    // Content height changes when a group expands and when the rail opens —
    // observe the inner wrapper, not just the viewport.
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => {
      el.removeEventListener("scroll", sync);
      ro.disconnect();
    };
  }, []);

  // Keep the current page visible when the rail opens on a route below the
  // fold. `block: "nearest"` scrolls the rail only — never the page.
  useLayoutEffect(() => {
    if (!railOpen) return;
    scrollRef.current?.querySelector<HTMLElement>("[data-active-row]")?.scrollIntoView({
      block: "nearest",
    });
  }, [pathname, railOpen]);

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setShowMobileSidebar(false);
  };

  /** Row navigates AND reveals its group — the chevron is the pure toggle. */
  const openItem = (item: NavItem) => {
    const target = targetOf(item);
    if (target) handleNavigate(target);
    if (item.children?.length) setExpanded([item.label]);
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
          <div className="flex flex-col h-full py-6 px-4">
            <div className="px-1 pb-2 shrink-0">
              <LogoWebsite />
            </div>
            <nav className="flex-1 mt-5 overflow-y-auto scrollbar-hide">
              {/* The desktop rail stays mounted (hidden by CSS) while the
                  drawer is open. Two live `layoutId`s of the same name make
                  framer animate one pill between the two trees, so the drawer
                  paints its active row statically. */}
              <SidebarBody
                collapsed={false}
                expanded={expanded}
                toggleExpanded={toggleExpanded}
                onNavigate={handleNavigate}
                onOpenItem={openItem}
              />
            </nav>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Desktop sidebar ──────────────────────────────────────────────
          In-flow flex child whose width IS the live state (76px collapsed ↔
          290px open). Because the content area is a flex sibling, it reflows
          automatically — the sidebar never overlays/covers the page. */}
      <aside
        onMouseEnter={() => !pinned && setPeek(true)}
        onMouseLeave={() => setPeek(false)}
        data-admin-skin="teal"
        className={cn(
          "hidden lg:flex flex-col h-screen shrink-0 overflow-hidden",
          "bg-tpl-card-bg border-r border-tpl-stroke",
          "transition-[width] duration-300 ease-out",
          railOpen ? "w-[290px]" : "w-[76px]",
          className,
        )}
      >
        {/* Brand row — 84px so its bottom edge lines up with the header. The
            mark stays fixed; the wordmark + pin reveal on expand. */}
        <div className="flex items-center gap-2.5 h-[84px] shrink-0 pl-[18px] pr-3 border-b border-tpl-stroke">
          <button
            onClick={() => navigate("/admin/dashboard")}
            className="flex items-center gap-2.5 min-w-0 outline-none rounded-lg focus-visible:ring-2 focus-visible:ring-[#0d9488]/40"
            aria-label="TravelHomes admin home"
          >
            <AdminBrandMark size={34} />
            <BrandLogo
              variant="name"
              size={17}
              decorative
              className={cn(reveal(!railOpen))}
            />
          </button>

          <button
            onClick={togglePinned}
            title={pinned ? "Unpin sidebar" : "Pin sidebar open"}
            aria-pressed={pinned}
            className={cn(
              "ml-auto shrink-0 grid place-items-center w-7 h-7 rounded-lg outline-none",
              "transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-[#0d9488]/40",
              pinned
                ? "bg-[rgba(13,148,136,0.09)] text-[#0d9488] hover:bg-[rgba(13,148,136,0.16)]"
                : "text-tpl-dark-5/70 hover:text-tpl-dark-5 hover:bg-[rgba(16,24,40,0.05)]",
              reveal(!railOpen),
            )}
          >
            {pinned ? <Pin size={13} strokeWidth={2.3} /> : <PinOff size={13} strokeWidth={2.3} />}
          </button>
        </div>

        {/* Nav — the single scroll region */}
        <div className="relative flex-1 min-h-0">
          <nav
            ref={scrollRef}
            aria-label="Admin navigation"
            className="h-full px-3 pt-4 pb-3 overflow-y-auto overflow-x-hidden overscroll-contain scrollbar-hide"
          >
            <SidebarBody
              collapsed={!railOpen}
              expanded={expanded}
              pillId="adminNavActivePill"
              toggleExpanded={toggleExpanded}
              onNavigate={(p) => navigate(p)}
              onOpenItem={openItem}
            />
          </nav>

          {/* Edge fades — the scroll cue, in place of a scrollbar gutter. */}
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-x-0 top-0 h-6 transition-opacity duration-200",
              "bg-gradient-to-b from-[var(--tpl-card-bg)] to-transparent",
              edges.top ? "opacity-100" : "opacity-0",
            )}
          />
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-0 h-8 transition-opacity duration-200",
              "bg-gradient-to-t from-[var(--tpl-card-bg)] to-transparent",
              edges.bottom ? "opacity-100" : "opacity-0",
            )}
          />
        </div>

        {/* Footer — sign out */}
        <div className="shrink-0 px-3 py-2.5 border-t border-tpl-stroke">
          <button
            onClick={handleLogout}
            title="Sign out"
            className="group w-full flex items-center gap-3 h-10 pl-2 pr-3 rounded-xl text-left select-none outline-none
              text-tpl-dark-5 hover:bg-red-50 hover:text-red-600
              focus-visible:ring-2 focus-visible:ring-red-500/40 transition-colors duration-150"
          >
            <span className="grid place-items-center w-9 h-9 rounded-lg shrink-0 bg-red-500/[0.09] text-red-500 transition-transform duration-150 group-hover:scale-[1.06]">
              <LogOut size={17} strokeWidth={2} />
            </span>
            <span
              className={cn(
                "flex-1 text-[13.5px] font-medium whitespace-nowrap",
                reveal(!railOpen),
              )}
            >
              Sign out
            </span>
          </button>
        </div>
      </aside>
    </MotionConfig>
  );
};

export default AdminSidebar;
