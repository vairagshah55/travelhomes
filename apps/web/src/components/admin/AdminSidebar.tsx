import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, MotionConfig } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Check,
  ChevronRight,
  ChevronsUpDown,
  Command,
  ExternalLink,
  LayoutGrid,
  LogOut,
  Pin,
  PinOff,
  Store,
} from "lucide-react";

import { AdminBrandMark } from "@/components/admin/AdminBrand";
import LogoWebsite from "@/components/admin/LogoWebsite";
import { useAuth } from "@/contexts/AdminAuthContext";
import { featureForPath } from "@/lib/adminPermissions";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MENU_ITEM, PORTAL_VARS } from "./adminUI";
import {
  ADMIN_NAV,
  targetOf,
  useActiveNavPath,
  type AdminNavGroup,
  type AdminNavItem,
} from "./adminNav";

/* The rail is three fixed bands around one scroller:

     1. brand row   (56px — its bottom edge lines up with the header's)
     2. nav         (flex-1, the ONLY scroll container; native scrollbar
                     hidden, cut edges fade instead)
     3. footer      (command palette + sign out)

   Pin lives in the brand row rather than a footer button: an unpinned rail
   peeks open on hover, so a permanent "Collapse" row at the bottom was a
   second control for the same state, eating a band of fixed height. */

interface AdminSidebarProps {
  className?: string;
  showMobileSidebar: boolean;
  setShowMobileSidebar: (v: boolean) => void;
  onOpenPalette?: () => void;
}

const COLLAPSED_GROUPS_KEY = "adminNavCollapsedGroups";

/* Label-reveal class. Labels/chevrons fade out while the rail is narrow and
   fade back in when it's expanded (pinned open, or peeking on hover). The
   expand state is computed in JS (see `railOpen` below) rather than CSS
   `:hover`, because a pure-CSS peek can't be suppressed right after the user
   unpins while the cursor is still over the panel — which made collapse look
   broken. `pointer-events-none` while hidden keeps controls from swallowing
   clicks aimed at the 64px rail. */
const reveal = (hidden: boolean) =>
  `transition-opacity duration-200 ${hidden ? "opacity-0 pointer-events-none" : "opacity-100"}`;

/* ── Nav row ─────────────────────────────────────────────────────────────── */
interface NavRowProps {
  item: AdminNavItem;
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
       positioned wrapper that carries the pill + hover wash.

       Icons are MONOCHROME — they inherit the row's text colour and turn blue
       with it when active. Nine icon hues in one rail is the single strongest
       "stock template" signal, and it also made the active row compete with
       every inactive one for attention rather than standing out from them. */
    <div className="group relative flex items-center rounded-lg">
      {isActive && (
        <motion.span
          layoutId={pillId}
          className="absolute inset-0 rounded-lg bg-app-accent-soft"
          transition={{ type: "spring", stiffness: 620, damping: 46 }}
        />
      )}
      {!isActive && (
        <span className="absolute inset-0 rounded-lg bg-transparent group-hover:bg-[rgba(18,25,38,0.045)] transition-colors duration-150" />
      )}

      <button
        onClick={onOpen}
        title={item.label}
        aria-current={isActive ? "page" : undefined}
        data-active-row={anchor ? "" : undefined}
        className={cn(
          "relative z-10 flex-1 min-w-0 flex items-center gap-2.5 h-9 pl-2.5 pr-1 rounded-lg",
          "text-left text-[13.5px] cursor-pointer outline-none",
          "focus-visible:ring-2 focus-visible:ring-app-accent/35",
          isActive ? "font-semibold text-app-accent" : "font-medium text-[#4b5565]",
        )}
      >
        <item.icon
          size={17}
          strokeWidth={isActive ? 2.2 : 1.9}
          className={cn(
            "shrink-0 transition-colors duration-150",
            isActive ? "text-app-accent" : "text-app-fg-subtle group-hover:text-[#364152]",
          )}
        />
        <span className={cn("flex-1 truncate tracking-[-0.005em]", reveal(collapsed))}>
          {item.label}
        </span>
      </button>

      {hasChildren && (
        <button
          onClick={onToggle}
          aria-expanded={expanded}
          aria-label={`${expanded ? "Collapse" : "Expand"} ${item.label}`}
          className={cn(
            "relative z-10 shrink-0 grid place-items-center w-6 h-9 mr-1 rounded-md outline-none",
            "text-app-fg-subtle hover:text-[#121926] transition-colors",
            "focus-visible:ring-2 focus-visible:ring-app-accent/35",
            reveal(collapsed),
          )}
        >
          <ChevronRight
            size={12}
            strokeWidth={2.6}
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
  collapsedGroups: string[];
  pillId?: string;
  toggleExpanded: (label: string) => void;
  toggleGroup: (id: string) => void;
  onNavigate: (path: string) => void;
  onOpenItem: (item: AdminNavItem) => void;
}

function SidebarBody({
  collapsed,
  expanded,
  collapsedGroups,
  pillId,
  toggleExpanded,
  toggleGroup,
  onNavigate,
  onOpenItem,
}: SidebarBodyProps) {
  const isActive = useActiveNavPath();
  const { can } = useAuth();

  /**
   * Drop anything the role can't open. A parent with children is kept only if at
   * least one child survives, and a whole group disappears once it's empty — so
   * a dashboard-only staff member sees just Dashboard instead of a nav full of
   * links that would bounce them straight back.
   */
  const allowed = useMemo(() => {
    return (path?: string) => {
      if (!path) return true;
      const feature = featureForPath(path);
      return !feature || can(feature);
    };
  }, [can]);

  const visibleGroups: AdminNavGroup[] = useMemo(
    () =>
      ADMIN_NAV.map((group) => ({
        ...group,
        items: group.items
          .map((item) => {
            if (item.children?.length) {
              const children = item.children.filter((c) => allowed(c.path));
              return children.length ? { ...item, children } : null;
            }
            return allowed(item.path) ? item : null;
          })
          .filter((i): i is AdminNavItem => i !== null),
      })).filter((group) => group.items.length > 0),
    [allowed],
  );

  return (
    <div>
      {visibleGroups.map((group) => {
        // A narrow rail ignores group folding: the captions are invisible at
        // 64px, so a folded group would just be a silently missing icon.
        const groupFolded = !collapsed && collapsedGroups.includes(group.id);

        return (
          <div key={group.id} className="mb-4 last:mb-0">
            {group.label && (
              <button
                onClick={() => toggleGroup(group.id)}
                aria-expanded={!groupFolded}
                className={cn(
                  "group/cap w-full flex items-center gap-1 px-2.5 mb-1 h-4 rounded",
                  "text-[10.5px] font-semibold uppercase tracking-[0.08em] whitespace-nowrap",
                  "text-app-fg-subtle hover:text-[#4b5565] outline-none",
                  "focus-visible:ring-2 focus-visible:ring-app-accent/35 transition-colors",
                  reveal(collapsed),
                )}
              >
                <span className="flex-1 text-left">{group.label}</span>
                <ChevronRight
                  size={11}
                  strokeWidth={2.6}
                  aria-hidden
                  className={cn(
                    "shrink-0 opacity-0 group-hover/cap:opacity-70 focus-visible:opacity-70",
                    "transition-[opacity,transform] duration-200",
                    !groupFolded && "rotate-90",
                  )}
                />
              </button>
            )}

            <AnimatePresence initial={false}>
              {!groupFolded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const itemActive = isActive(item.path);
                      const childActive = item.children?.some((c) => isActive(c.path)) ?? false;
                      const isExpanded = expanded.includes(item.label);
                      const hasChildren = !!item.children?.length;
                      // For a group, the scroll anchor is the active child row
                      // below — not the parent — unless it's folded shut.
                      const anchor =
                        (itemActive || childActive) && (!hasChildren || !isExpanded);

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

                          {/* Sub-items. Hidden while the rail is narrow —
                              there's nowhere to draw them at 64px. */}
                          <AnimatePresence initial={false}>
                            {!collapsed && hasChildren && isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                                className="overflow-hidden"
                              >
                                {/* Sub-items hang off a guide rail aligned with
                                    the parent's icon, so the group reads as one
                                    unit. */}
                                <ul className="mt-0.5 mb-1 ml-[19px] mr-1 space-y-px border-l border-tpl-stroke pl-2.5">
                                  {item.children!.map((sub, subIndex) => {
                                    const subActive = isActive(sub.path);
                                    return (
                                      <motion.li
                                        key={sub.path}
                                        initial={{ x: -4, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        transition={{ delay: subIndex * 0.03, duration: 0.13 }}
                                      >
                                        <button
                                          onClick={() => onNavigate(sub.path)}
                                          aria-current={subActive ? "page" : undefined}
                                          data-active-row={subActive ? "" : undefined}
                                          className={cn(
                                            "w-full flex items-center h-8 px-2.5 rounded-md",
                                            "text-left text-[12.5px] select-none outline-none transition-colors duration-150",
                                            "focus-visible:ring-2 focus-visible:ring-app-accent/35",
                                            subActive
                                              ? "bg-app-accent-soft text-app-accent font-semibold"
                                              : "text-[#4b5565] font-medium hover:bg-[rgba(18,25,38,0.045)] hover:text-[#121926]",
                                          )}
                                        >
                                          <span className="flex-1 truncate">{sub.label}</span>
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
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

/* ── Surface switcher ────────────────────────────────────────────────────
   TravelHomes ships three front-ends off one codebase — this admin, the vendor
   console and the public site — and operators move between them constantly.
   The brand row is the conventional home for that switch, and it is a REAL
   switch: every entry goes somewhere that exists. */
function SurfaceSwitcher({ collapsed, onNavigate }: { collapsed: boolean; onNavigate: () => void }) {
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "group flex items-center gap-2 min-w-0 flex-1 h-9 pl-1 pr-1.5 rounded-lg outline-none",
          "hover:bg-[rgba(18,25,38,0.045)] data-[state=open]:bg-[rgba(18,25,38,0.045)]",
          "focus-visible:ring-2 focus-visible:ring-app-accent/35 transition-colors duration-150",
        )}
        aria-label="Switch workspace"
      >
        <AdminBrandMark size={26} />
        <span className={cn("flex items-center gap-1 min-w-0", reveal(collapsed))}>
          <span className="flex flex-col items-start min-w-0 leading-none">
            <span className="text-[13px] font-bold text-[#121926] tracking-[-0.01em] truncate">
              TravelHomes
            </span>
            <span className="mt-0.5 text-[10.5px] font-medium text-app-fg-subtle">
              Admin panel
            </span>
          </span>
          <ChevronsUpDown
            size={12}
            strokeWidth={2.4}
            aria-hidden
            className="shrink-0 ml-0.5 text-app-fg-subtle opacity-70"
          />
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        sideOffset={8}
        style={PORTAL_VARS}
        className="min-w-[240px] p-1.5 rounded-xl border-app-border bg-app-surface shadow-[0_2px_4px_rgba(18,25,38,0.04),0_16px_32px_-12px_rgba(18,25,38,0.18)]"
      >
        <DropdownMenuItem
          className={MENU_ITEM}
          onSelect={() => {
            navigate("/admin/dashboard");
            onNavigate();
          }}
        >
          <LayoutGrid size={16} className="shrink-0 text-app-accent" />
          <span className="flex-1">Admin panel</span>
          <Check size={15} className="shrink-0 text-app-accent" aria-label="Current" />
        </DropdownMenuItem>

        <DropdownMenuItem
          className={MENU_ITEM}
          onSelect={() => {
            navigate("/dashboard");
            onNavigate();
          }}
        >
          <Store size={16} className="shrink-0 text-app-fg-subtle" />
          <span className="flex-1">Vendor console</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-app-border my-1.5" />

        <DropdownMenuItem
          className={MENU_ITEM}
          onSelect={() => window.open("/", "_blank", "noopener,noreferrer")}
        >
          <ExternalLink size={16} className="shrink-0 text-app-fg-subtle" />
          <span className="flex-1">Public site</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ── Main component ─────────────────────────────────────────────────────── */
const AdminSidebar: React.FC<AdminSidebarProps> = ({
  className = "",
  showMobileSidebar,
  setShowMobileSidebar,
  onOpenPalette,
}) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isActive = useActiveNavPath();
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

  // Folded sections, persisted. Eighteen destinations is a lot of rail; an
  // operator who never touches CMS should be able to put it away for good.
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = JSON.parse(localStorage.getItem(COLLAPSED_GROUPS_KEY) ?? "[]");
      return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string") : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    localStorage.setItem(COLLAPSED_GROUPS_KEY, JSON.stringify(collapsedGroups));
  }, [collapsedGroups]);
  const toggleGroup = (id: string) =>
    setCollapsedGroups((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    );

  // Parents whose children own the current route always count as expanded, so
  // landing on a sub-route shows the active sub-link instead of a folded group.
  const activeParents = useMemo(
    () =>
      ADMIN_NAV.flatMap((s) => s.items)
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
  const openItem = (item: AdminNavItem) => {
    const target = targetOf(item);
    if (target) handleNavigate(target);
    if (item.children?.length) setExpanded([item.label]);
  };

  const footerRow =
    "group w-full flex items-center gap-2.5 h-9 pl-2.5 pr-2 rounded-lg text-left select-none outline-none " +
    "transition-colors duration-150";

  return (
    <MotionConfig reducedMotion="user">
      {/* ── Mobile drawer via shadcn Sheet ──────────────────────────── */}
      <Sheet open={showMobileSidebar} onOpenChange={setShowMobileSidebar}>
        <SheetContent
          side="left"
          data-admin-skin="teal"
          className="w-[272px] p-0 bg-tpl-card-bg border-r border-tpl-stroke sm:max-w-[272px]"
        >
          <SheetTitle className="sr-only">Admin navigation</SheetTitle>
          <div className="flex flex-col h-full py-4 px-3">
            <div className="px-1 pb-2 shrink-0">
              <LogoWebsite />
            </div>
            <nav className="flex-1 mt-3 overflow-y-auto scrollbar-hide">
              {/* The desktop rail stays mounted (hidden by CSS) while the
                  drawer is open. Two live `layoutId`s of the same name make
                  framer animate one pill between the two trees, so the drawer
                  paints its active row statically. */}
              <SidebarBody
                collapsed={false}
                expanded={expanded}
                collapsedGroups={collapsedGroups}
                toggleExpanded={toggleExpanded}
                toggleGroup={toggleGroup}
                onNavigate={handleNavigate}
                onOpenItem={openItem}
              />
            </nav>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Desktop sidebar ──────────────────────────────────────────────
          In-flow flex child whose width IS the live state (64px collapsed ↔
          248px open). Because the content area is a flex sibling, it reflows
          automatically — the sidebar never overlays/covers the page. */}
      <aside
        onMouseEnter={() => !pinned && setPeek(true)}
        onMouseLeave={() => setPeek(false)}
        data-admin-skin="teal"
        className={cn(
          "hidden lg:flex flex-col h-screen shrink-0 overflow-hidden",
          "bg-tpl-card-bg border-r border-tpl-stroke",
          "transition-[width] duration-300 ease-out",
          railOpen ? "w-[248px]" : "w-[64px]",
          className,
        )}
      >
        {/* Brand row — 56px so its bottom edge lines up with the header. */}
        <div className="flex items-center gap-1 h-14 shrink-0 pl-2.5 pr-2 border-b border-tpl-stroke">
          <SurfaceSwitcher
            collapsed={!railOpen}
            onNavigate={() => setShowMobileSidebar(false)}
          />

          <button
            onClick={togglePinned}
            title={pinned ? "Unpin sidebar" : "Pin sidebar open"}
            aria-pressed={pinned}
            className={cn(
              "shrink-0 grid place-items-center w-7 h-7 rounded-md outline-none",
              "transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-app-accent/35",
              pinned
                ? "text-app-accent bg-app-accent-soft"
                : "text-app-fg-subtle hover:text-[#364152] hover:bg-[rgba(18,25,38,0.05)]",
              reveal(!railOpen),
            )}
          >
            {pinned ? <Pin size={12} strokeWidth={2.4} /> : <PinOff size={12} strokeWidth={2.4} />}
          </button>
        </div>

        {/* Nav — the single scroll region */}
        <div className="relative flex-1 min-h-0">
          <nav
            ref={scrollRef}
            aria-label="Admin navigation"
            className="h-full px-2.5 pt-3 pb-3 overflow-y-auto overflow-x-hidden overscroll-contain scrollbar-hide"
          >
            <SidebarBody
              collapsed={!railOpen}
              expanded={expanded}
              collapsedGroups={collapsedGroups}
              pillId="adminNavActivePill"
              toggleExpanded={toggleExpanded}
              toggleGroup={toggleGroup}
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

        {/* Footer — command palette + sign out. The palette entry lives here
            as well as in the top bar: when the rail is what you're looking at,
            "where is everything else" is the question it answers. */}
        <div className="shrink-0 px-2.5 py-2 border-t border-tpl-stroke space-y-0.5">
          {onOpenPalette && (
            <button
              onClick={onOpenPalette}
              title="Command palette (⌘K)"
              className={cn(
                footerRow,
                "text-[#4b5565] hover:bg-[rgba(18,25,38,0.045)] hover:text-[#121926]",
                "focus-visible:ring-2 focus-visible:ring-app-accent/35",
              )}
            >
              <Command
                size={17}
                strokeWidth={1.9}
                className="shrink-0 text-app-fg-subtle group-hover:text-[#364152] transition-colors"
              />
              <span
                className={cn(
                  "flex-1 text-[13.5px] font-medium whitespace-nowrap",
                  reveal(!railOpen),
                )}
              >
                Search & commands
              </span>
              <kbd
                className={cn(
                  "shrink-0 px-1.5 py-0.5 rounded border border-tpl-stroke bg-[#f7f8fa]",
                  "text-[10px] font-sans font-medium text-app-fg-subtle leading-none",
                  reveal(!railOpen),
                )}
              >
                ⌘K
              </kbd>
            </button>
          )}

          <button
            onClick={handleLogout}
            title="Sign out"
            className={cn(
              footerRow,
              "text-[#4b5565] hover:bg-red-50 hover:text-red-600",
              "focus-visible:ring-2 focus-visible:ring-red-500/35",
            )}
          >
            <LogOut
              size={17}
              strokeWidth={1.9}
              className="shrink-0 text-app-fg-subtle group-hover:text-red-600 transition-colors"
            />
            <span
              className={cn("flex-1 text-[13.5px] font-medium whitespace-nowrap", reveal(!railOpen))}
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
