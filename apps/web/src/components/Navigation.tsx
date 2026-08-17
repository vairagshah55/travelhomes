import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { AdminBrandMark } from "@/components/admin/AdminBrand";
import { ACTIVE_PILL, BRAND_VARS } from "@/components/shared";
import { notificationsApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { LogOut, ChevronRight, Pin, PinOff } from "lucide-react";
import { VENDOR_NAV, VENDOR_NAV_ITEMS, type VendorNavItem } from "@/components/vendorNav";

/* This rail renders in the same language as the vendor pages it frames —
   `BRAND_VARS` + the kit's tokens from `components/shared/Panel.tsx`, so
   `bg-brand` / `text-brand` resolve teal here exactly as they do inside a
   Panel, and the active row is the same sliding `layoutId` pill the Settings
   and Notifications rails use. Surface and hairline come from the `app-*`
   console tokens (see the [data-console] block in global.css) — the same ones
   DashboardHeader reads, so rail and header stay one piece of chrome.

   LAYOUT CONTRACT — three bands, exactly one of which scrolls:
     1. brand row      (56px, fixed — lines up with the top bar)
     2. nav            (flex-1, the ONLY scroll container: Main Menu + Support
                        live inside it and move together)
     3. logout footer  (one row, fixed)
   Support used to be a second `shrink-0` band pinned below the scroller, which
   ate ~300px of fixed height and squeezed the main list into a short window —
   so the menu clipped mid-row with a native scrollbar down the middle of the
   rail. One scroller + hidden scrollbar + edge fades is the standard shape and
   removes that entirely. */

/* The rail renders `components/vendorNav.ts`; so does the ⌘K palette. Keeping
   the list in one place is why a page can't appear in one surface and not the
   other — the failure mode the admin already hit with its own palette. */
type MenuItem = VendorNavItem & { badge?: number };

// Sidebar accepts a handful of shapes across the codebase — nothing is
// required. The component reads `forceExpanded` and `defaultCollapsed`
// internally; the rest of the props (`isCollapsed`, `onToggleCollapse`,
// `setIsCollapsed`, `isMobile`) are accepted for compatibility with the
// various call sites in pages/ but are ignored at the component level.
interface SidebarProps {
  defaultCollapsed?: boolean;
  onToggle?: (collapsed: boolean) => void;
  forceExpanded?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  setIsCollapsed?: (collapsed: boolean) => void;
  isMobile?: boolean;
}

/** Section caption above a nav group — same type as the panel group headers. */
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="px-4 pb-1.5 text-[10.5px] font-bold uppercase tracking-[0.07em] text-muted-foreground/80 whitespace-nowrap">
    {children}
  </p>
);

/* ─── count badge ─── */
const Badge = ({
  count,
  active,
  alert = false,
}: {
  count: number;
  active: boolean;
  alert?: boolean;
}) => (
  <span
    className={cn(
      "inline-flex items-center justify-center min-w-[19px] h-[18px] px-1.5 rounded-full",
      "text-[10px] font-bold leading-none tabular-nums",
      alert
        ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
        : active
          ? "bg-brand/15 text-brand"
          : "bg-muted text-muted-foreground",
    )}
  >
    {count > 99 ? "99+" : count}
  </span>
);

/* ─── tooltip shown in collapsed mode ───
   Dark chip in both themes: it floats over the light page ground, and a
   light-on-light tooltip needs a border to be visible at all, which then reads
   as a small panel rather than a label. `--console-tip` is declared alongside
   the console ramp in global.css so the value isn't a literal here. */
const CollapsedTooltip = ({ label, badge }: { label: string; badge?: number }) => (
  <div
    className="
    pointer-events-none absolute left-full ml-3 z-50
    flex items-center gap-2
    px-2.5 py-1.5 rounded-lg whitespace-nowrap
    bg-[color:var(--console-tip)] text-white text-[12.5px] font-semibold
    shadow-[0_8px_24px_-8px_rgba(14,26,27,0.45)] ring-1 ring-white/10
    opacity-0 invisible -translate-x-1
    group-hover:opacity-100 group-hover:visible group-hover:translate-x-0
    transition-all duration-150 ease-out
  "
  >
    {/* arrow */}
    <span
      aria-hidden
      className="absolute right-full top-1/2 -translate-y-1/2
      border-[5px] border-transparent border-r-[color:var(--console-tip)]"
    />
    {label}
    {badge !== undefined && badge > 0 && (
      <span className="px-1.5 py-0.5 text-[10px] font-bold bg-white/20 text-white rounded-full leading-none tabular-nums">
        {badge > 99 ? "99+" : badge}
      </span>
    )}
  </div>
);

export const Sidebar: React.FC<SidebarProps> = ({
  defaultCollapsed = false,
  onToggle,
  forceExpanded = false,
}) => {
  const [pinned, setPinned] = useState(!defaultCollapsed);
  const [hoverOpen, setHoverOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const sidebarRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const isOpen = forceExpanded || pinned || hoverOpen;

  /* The mobile drawer renders a SECOND Sidebar while the desktop one is still
     mounted (hidden by CSS, not unmounted). Two live `layoutId`s with the same
     name make framer animate the pill between the two trees, so the drawer
     instance opts out and paints its active row statically. */
  const pillId = forceExpanded ? undefined : "vendorNavActivePill";

  /* Same key + cadence as DashboardHeader's bell, so the rail badge and the
     header badge are the same number and useQuery dedupes the request. */
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["notifications", "unread", "vendor"],
    queryFn: async () => {
      const res = await notificationsApi.list(true, 1, "vendor");
      return res.success ? res.totalUnread : 0;
    },
    refetchInterval: 30_000,
    staleTime: 25_000,
    retry: false,
  });

  /** Notifications carries the live unread count; everything else is static. */
  const badgeFor = (item: MenuItem) =>
    item.id === "notifications" ? unreadCount : (item.badge ?? 0);

  // IDs of parent menu items whose children contain the current route. These
  // should ALWAYS be considered expanded (in addition to whatever the user
  // toggled manually), so that re-opening the sidebar on a sub-route shows
  // the active sub-link instead of a collapsed parent.
  const matchPath = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");
  const activeParentIds = useMemo(() => {
    const ids: string[] = [];
    VENDOR_NAV_ITEMS.forEach((item) => {
      if (item.children?.some((c) => matchPath(c.path))) ids.push(item.id);
    });
    return ids;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Whenever the URL changes, the section owning the route becomes THE open
  // one. Accordion (single open group) rather than additive: with every group
  // expandable at once the list grew past the viewport, which is what made the
  // rail feel like it was scrolling for no reason.
  useEffect(() => {
    if (activeParentIds.length === 0) return;
    setExpandedItems(new Set(activeParentIds));
  }, [activeParentIds]);

  /* ─── scroll affordance ───
     Native scrollbars are hidden (the `scrollbar-thin` utilities this file used
     to carry come from a tailwind plugin that isn't installed, so the browser
     default was painting a grey gutter down the rail). Instead the scroller
     fades its cut edges, which reads as "there's more" without a gutter. */
  const [edges, setEdges] = useState({ top: false, bottom: false });
  const syncEdges = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    setEdges({
      top: scrollTop > 4,
      bottom: scrollTop + clientHeight < scrollHeight - 4,
    });
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    syncEdges();
    el.addEventListener("scroll", syncEdges, { passive: true });
    // Content height changes when a group expands/collapses and when the rail
    // opens/closes — observe the inner wrapper, not just the viewport.
    const ro = new ResizeObserver(syncEdges);
    ro.observe(el);
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    return () => {
      el.removeEventListener("scroll", syncEdges);
      ro.disconnect();
    };
  }, [syncEdges]);

  // Keep the current page visible when the rail opens on a route that sits
  // below the fold. `block: "nearest"` scrolls the rail only — never the page.
  useLayoutEffect(() => {
    if (!isOpen) return;
    const row = scrollRef.current?.querySelector<HTMLElement>("[data-active-row]");
    row?.scrollIntoView({ block: "nearest" });
  }, [location.pathname, isOpen]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleMouseEnter = () => {
    if (pinned || forceExpanded) return;
    hoverTimer.current = setTimeout(() => setHoverOpen(true), 100);
  };
  const handleMouseLeave = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    if (!pinned && !forceExpanded) {
      setHoverOpen(false);
      // Reset to the active-parents baseline (not empty) so that when the
      // sidebar hovers open again, the parent containing the current page
      // is still expanded. User-toggled expansions of *other* parents do
      // collapse — that matches the previous "clean slate on close" feel,
      // while keeping the current sub-route visible.
      setExpandedItems(new Set(activeParentIds));
    }
  };
  const handlePinToggle = () => {
    const next = !pinned;
    setPinned(next);
    if (!next) setHoverOpen(false);
    onToggle?.(!next);
  };

  /** Accordion: opening a group closes the others; re-clicking closes it. */
  const toggleExpand = (id: string) => {
    if (!isOpen) return;
    setExpandedItems((prev) => (prev.has(id) ? new Set() : new Set([id])));
  };

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  /**
   * A row is active when it owns the current URL AND no other top-level row
   * owns it more specifically.
   *
   * The longest-prefix rule used to apply only to siblings inside one group.
   * That was enough while Offers lived under Marketing; now that they are
   * peers in different sections, `/marketing/offers` matches Marketing's
   * prefix too and BOTH rows lit up — two active pills in one rail, and with a
   * shared `layoutId` framer would try to animate one element between them.
   */
  const isParentActive = (item: MenuItem) => {
    const own = isActive(item.path) || (item.children?.some((c) => isActive(c.path)) ?? false);
    if (!own) return false;
    return !VENDOR_NAV_ITEMS.some(
      (other) =>
        other.id !== item.id && isActive(other.path) && other.path.length > item.path.length,
    );
  };

  // For sibling children where one path is a prefix of another (e.g. /offering
  // and /offering/add), the plain prefix test in `isActive` lights up BOTH.
  // Only the most specific match should be active — i.e. the sibling whose
  // path is the longest matching prefix of the current URL.
  const isChildActive = (child: MenuItem, siblings: MenuItem[]) => {
    if (!isActive(child.path)) return false;
    return !siblings.some(
      (s) => s.id !== child.id && isActive(s.path) && s.path.length > child.path.length,
    );
  };

  /** Row navigates AND reveals its group — the chevron is the pure toggle. */
  const openItem = (item: MenuItem) => {
    navigate(item.path);
    if (item.children?.length) setExpandedItems(new Set([item.id]));
  };

  /* ─── single nav row (top-level) ─── */
  const renderItem = (item: MenuItem) => {
    const hasChildren = !!item.children?.length;
    const expanded = expandedItems.has(item.id);
    const active = isParentActive(item);
    const badge = badgeFor(item);
    const alertBadge = item.id === "notifications";
    // Only the deepest active row is the scroll anchor: for a group, that's the
    // child row rendered below, not the parent.
    const isAnchor = active && (!hasChildren || !expanded);

    return (
      <div key={item.id}>
        {/* ── collapsed state ── */}
        {!isOpen ? (
          <div className="group relative flex justify-center px-2 py-[1px]">
            {/* Collapsed rows navigate. `toggleExpand` is a no-op at 68px wide
                (there's nowhere to draw the children), so the old collapsed
                parent rows swallowed the click and went nowhere. */}
            <button
              onClick={() => navigate(item.path)}
              aria-current={active ? "page" : undefined}
              aria-label={item.label}
              data-active-row={isAnchor ? "" : undefined}
              className={cn(
                "relative grid place-items-center w-10 h-10 rounded-xl outline-none",
                "transition-[background-color,color] duration-150",
                "focus-visible:ring-2 focus-visible:ring-brand/40",
                active
                  ? "bg-brand/[0.1] text-brand"
                  : "text-app-fg-subtle hover:bg-app-surface-2 hover:text-app-fg",
              )}
            >
              <item.icon size={18} strokeWidth={active ? 2.3 : 1.9} />
              {/* unread dot — the count itself only fits in the tooltip */}
              {badge > 0 && !active && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-600 ring-2 ring-app-surface" />
              )}
            </button>
            <CollapsedTooltip label={item.label} badge={badge} />
          </div>
        ) : (
          /* ── expanded state ──
             Two hit targets in one visual row: the row navigates, the chevron
             only folds. Nested <button>s are invalid HTML, so they're siblings
             inside a positioned wrapper that carries the pill + hover wash. */
          <div
            className={cn(
              "group relative mx-2 flex items-center rounded-xl",
              "transition-colors duration-150",
              !active && "hover:bg-muted/70 dark:hover:bg-white/[0.04]",
            )}
          >
            {active && (
              <motion.span
                layoutId={pillId}
                className={ACTIVE_PILL}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}

            <button
              onClick={() => openItem(item)}
              aria-current={active ? "page" : undefined}
              data-active-row={isAnchor ? "" : undefined}
              className={cn(
                "relative flex-1 min-w-0 flex items-center gap-2.5 h-10 pl-2 pr-1",
                "text-left select-none outline-none rounded-xl",
                "focus-visible:ring-2 focus-visible:ring-brand/40",
              )}
            >
              {/* Monochrome, like the admin rail. The per-item `color` is still
                  in SECTIONS (the mobile nav and a few badges read it) but is
                  no longer painted here: nine hues in one rail was the
                  strongest "bought template" signal left in the console, and
                  it made the active row compete with eight inactive ones. */}
              <span
                className={cn(
                  "grid place-items-center w-7 h-7 rounded-lg shrink-0",
                  "transition-colors duration-150",
                  active ? "text-brand" : "text-app-fg-subtle group-hover:text-app-fg",
                )}
              >
                <item.icon size={17} strokeWidth={active ? 2.3 : 1.9} />
              </span>

              <span
                className={cn(
                  "flex-1 text-[13.5px] whitespace-nowrap tracking-[-0.01em] truncate",
                  active
                    ? "text-brand font-semibold"
                    : "text-foreground/80 font-medium group-hover:text-foreground",
                )}
              >
                {item.label}
              </span>
            </button>

            {badge > 0 && (
              <span className="relative shrink-0 pr-1.5">
                <Badge count={badge} active={active} alert={alertBadge} />
              </span>
            )}

            {hasChildren && (
              <button
                onClick={() => toggleExpand(item.id)}
                aria-expanded={expanded}
                aria-label={`${expanded ? "Collapse" : "Expand"} ${item.label}`}
                className="relative shrink-0 grid place-items-center w-6 h-10 mr-1 rounded-lg outline-none
                  text-muted-foreground/60 hover:text-foreground
                  focus-visible:ring-2 focus-visible:ring-brand/40"
              >
                <ChevronRight
                  size={13}
                  strokeWidth={2.4}
                  className={cn("transition-transform duration-200", expanded && "rotate-90")}
                />
              </button>
            )}
          </div>
        )}

        {/* ── children (animated) ── */}
        <AnimatePresence initial={false}>
          {isOpen && hasChildren && expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="mt-0.5 mb-1 ml-[calc(0.5rem+0.875rem)] mr-2 space-y-px border-l border-border/70 pl-3">
                {item.children!.map((child, subIndex) => {
                  const ca = isChildActive(child, item.children!);
                  return (
                    <motion.button
                      key={child.id}
                      initial={{ x: -6, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: subIndex * 0.04, duration: 0.15 }}
                      onClick={() => navigate(child.path)}
                      aria-current={ca ? "page" : undefined}
                      data-active-row={ca ? "" : undefined}
                      className={cn(
                        "group w-full flex items-center gap-2 h-8 px-2.5 rounded-lg",
                        "text-left select-none outline-none transition-colors duration-150",
                        "focus-visible:ring-2 focus-visible:ring-brand/40",
                        ca
                          ? "bg-brand/[0.09] text-brand"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/70 dark:hover:bg-white/[0.04]",
                      )}
                    >
                      <span
                        className={cn(
                          "w-1 h-1 rounded-full shrink-0 transition-colors duration-150",
                          ca
                            ? "bg-brand"
                            : "bg-muted-foreground/40 group-hover:bg-muted-foreground",
                        )}
                      />
                      <span
                        className={cn(
                          "flex-1 text-[12.5px] whitespace-nowrap truncate",
                          ca ? "font-semibold" : "font-medium",
                        )}
                      >
                        {child.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  /* ─── logout row (pinned footer) ─── */
  const renderLogout = () => {
    if (!isOpen) {
      return (
        <div className="group relative flex justify-center px-2">
          <button
            onClick={handleLogout}
            aria-label="Logout"
            className="grid place-items-center w-10 h-10 rounded-xl text-red-500/80 outline-none hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 focus-visible:ring-2 focus-visible:ring-red-500/40 transition-colors duration-150"
          >
            <LogOut size={18} strokeWidth={2.1} />
          </button>
          <CollapsedTooltip label="Logout" />
        </div>
      );
    }
    return (
      <button
        onClick={handleLogout}
        className="group w-[calc(100%-1rem)] flex items-center gap-2.5 mx-2 h-10 pl-2 pr-3 rounded-xl
          text-left select-none outline-none text-muted-foreground
          hover:bg-red-50 dark:hover:bg-red-500/10
          hover:text-red-600 dark:hover:text-red-400
          focus-visible:ring-2 focus-visible:ring-red-500/40
          transition-colors duration-150"
      >
        <span className="grid place-items-center w-7 h-7 rounded-lg shrink-0 bg-red-500/[0.09] text-red-500 transition-transform duration-150 group-hover:scale-[1.05]">
          <LogOut size={15} strokeWidth={2.1} />
        </span>
        <span className="flex-1 text-[13.5px] font-medium whitespace-nowrap">Logout</span>
      </button>
    );
  };

  /* ─── render ─── */
  return (
    <MotionConfig reducedMotion="user">
      <div
        ref={sidebarRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ ...BRAND_VARS, width: forceExpanded ? "100%" : isOpen ? 256 : 68 }}
        /* Surface + hairline are the `app-*` tokens rather than the literal
           #f1f8f7 / #dce7e5 pair, so the rail follows whatever the console
           scope defines and stays in step with DashboardHeader, which used to
           carry the same two literals. */
        className="
          relative flex flex-col h-full overflow-hidden
          bg-app-surface
          shadow-[inset_-1px_0_0_var(--surface-border)]
          transition-[width] duration-300 ease-in-out
        "
      >
        {/* ─── Brand row — 56px so its bottom edge lines up with the top bar ─── */}
        <div
          className={cn(
            "flex items-center h-14 shrink-0 px-3",
            "shadow-[inset_0_-1px_0_var(--surface-border)]",
            !isOpen && "justify-center",
          )}
        >
          {isOpen ? (
            <div className="flex items-center gap-2.5 flex-1 min-w-0">
              <AdminBrandMark size={30} />
              <span className="font-extrabold tracking-tight leading-none text-[16px] whitespace-nowrap min-w-0 truncate">
                <span className="text-foreground">Travel</span>
                <span className="text-brand">Homes</span>
              </span>

              {!forceExpanded && (
                <button
                  onClick={handlePinToggle}
                  title={pinned ? "Unpin sidebar" : "Pin sidebar open"}
                  aria-pressed={pinned}
                  className={cn(
                    "ml-auto shrink-0 grid place-items-center w-7 h-7 rounded-lg outline-none",
                    "transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-brand/40",
                    pinned
                      ? "bg-brand/[0.09] text-brand hover:bg-brand/[0.16]"
                      : "text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted",
                  )}
                >
                  {pinned ? (
                    <Pin size={13} strokeWidth={2.3} />
                  ) : (
                    <PinOff size={13} strokeWidth={2.3} />
                  )}
                </button>
              )}
            </div>
          ) : (
            <AdminBrandMark size={32} />
          )}
        </div>

        {/* ─── Nav — the single scroll region (Main Menu + Support) ─── */}
        <div className="relative flex-1 min-h-0">
          <nav
            ref={scrollRef}
            aria-label="Vendor navigation"
            className="h-full overflow-y-auto overflow-x-hidden overscroll-contain scrollbar-hide"
          >
            <div className="py-2.5">
              {VENDOR_NAV.map((section, i) => (
                <div key={section.id} className={cn(i > 0 && (isOpen ? "mt-4" : "mt-3"))}>
                  {/* Collapsed, a caption has nowhere to render at 68px wide, so
                      groups are separated by a hairline instead. Expanded, the
                      caption IS the separator — a rule under a label as well is
                      one divider too many. */}
                  {i > 0 && !isOpen && (
                    <div className="mx-3 mb-3 border-t border-app-border" aria-hidden />
                  )}
                  {isOpen && section.label && <SectionLabel>{section.label}</SectionLabel>}
                  <div className="space-y-px">{section.items.map(renderItem)}</div>
                </div>
              ))}
            </div>
          </nav>

          {/* Edge fades — the scroll cue, in place of a scrollbar gutter. */}
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-x-0 top-0 h-6 transition-opacity duration-200",
              "bg-gradient-to-b from-app-surface to-transparent",
              edges.top ? "opacity-100" : "opacity-0",
            )}
          />
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-0 h-8 transition-opacity duration-200",
              "bg-gradient-to-t from-app-surface to-transparent",
              edges.bottom ? "opacity-100" : "opacity-0",
            )}
          />
        </div>

        {/* ─── Footer — logout only, so the scroller keeps the height ─── */}
        <div className="shrink-0 py-2.5 shadow-[inset_0_1px_0_var(--surface-border)]">
          {renderLogout()}
        </div>
      </div>
    </MotionConfig>
  );
};

export default Sidebar;
