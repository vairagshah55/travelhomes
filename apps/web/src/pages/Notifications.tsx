import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import {
  AlertCircle,
  BadgeCheck,
  Bell,
  BellRing,
  Briefcase,
  Building2,
  CalendarCheck,
  CheckCheck,
  Inbox,
  LifeBuoy,
  Megaphone,
  Search,
  Trash2,
  UserRound,
  Wallet,
  X,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import DashboardLayout from "@/components/DashboardLayout";
import {
  BRAND_VARS,
  BTN_NEUTRAL,
  BTN_SOFT,
  CONTROL,
  ConfirmModal,
  EmptyState,
  PANEL,
  PANEL_FOOTER,
  Panel,
  PanelHead,
} from "@/components/shared";
import { cn } from "@/lib/utils";
import { notificationsApi, type NotificationDTO } from "@/lib/api";
import { toast } from "sonner";

/* Shared with DashboardHeader's bell badge (`["notifications","unread","vendor"]`)
   under the same root key — every mutation here invalidates the root so the
   badge and this list can never disagree. */
const NOTIFICATIONS_KEY = ["notifications", "list", "vendor"] as const;
const NOTIFICATIONS_ROOT = ["notifications"] as const;

/** The server sends `_id`; some older payloads carried `id`/`time` instead. */
type NotifRow = Omit<NotificationDTO, "type"> & {
  type: string;
  id?: string;
  time?: string;
};

const rowId = (n: NotifRow) => n._id ?? n.id ?? "";

/* ── Type vocabulary ──────────────────────────────────────────────────────────
   Every notification arrives with a `type` (Server/models/Notification.js), so
   the row can say what it is instead of showing the same placeholder avatar for
   all of them. Tile colours are data-driven — the sanctioned use of inline
   `style` (CONVENTIONS.md Rule 1) and the same convention the sidebar uses.
   Colour is semantic per type; the rail below groups them for navigation.     */

type GroupKey = "bookings" | "payments" | "listings" | "support" | "system";

type TypeMeta = { label: string; icon: LucideIcon; color: string; group: GroupKey };

const TYPE_META: Record<string, TypeMeta> = {
  new_booking: { label: "Booking", icon: CalendarCheck, color: "#0ea5e9", group: "bookings" },
  payment_received: { label: "Payment", icon: Wallet, color: "#22c55e", group: "payments" },
  service_approval: { label: "Approved", icon: BadgeCheck, color: "#10b981", group: "listings" },
  service_rejection: { label: "Rejected", icon: XCircle, color: "#f43f5e", group: "listings" },
  helpdesk_ticket: { label: "Support", icon: LifeBuoy, color: "#f59e0b", group: "support" },
  vendor_registration: { label: "Vendor", icon: Building2, color: "#a855f7", group: "system" },
  new_user: { label: "New user", icon: UserRound, color: "#6366f1", group: "system" },
  job_application: { label: "Application", icon: Briefcase, color: "#14b8a6", group: "system" },
  system_alert: { label: "System", icon: Megaphone, color: "#ef4444", group: "system" },
};

const FALLBACK_META: TypeMeta = {
  label: "Update",
  icon: Bell,
  color: "#64748b",
  group: "system",
};

const metaFor = (n: NotifRow) => TYPE_META[n.type] ?? FALLBACK_META;

/* ── Filters ──────────────────────────────────────────────────────────────── */

type FilterKey = "all" | "unread" | GroupKey;

const CATEGORY_FILTERS: { key: GroupKey; label: string; icon: LucideIcon; color: string }[] = [
  { key: "bookings", label: "Bookings", icon: CalendarCheck, color: "#0ea5e9" },
  { key: "payments", label: "Payments", icon: Wallet, color: "#22c55e" },
  { key: "listings", label: "Listings", icon: BadgeCheck, color: "#a855f7" },
  { key: "support", label: "Support", icon: LifeBuoy, color: "#f59e0b" },
  { key: "system", label: "System", icon: Megaphone, color: "#64748b" },
];

const FILTER_LABEL: Record<FilterKey, string> = {
  all: "All notifications",
  unread: "Unread",
  bookings: "Bookings",
  payments: "Payments",
  listings: "Listings",
  support: "Support",
  system: "System",
};

/* ── Time ─────────────────────────────────────────────────────────────────────
   Recent items read better relatively; anything past a week needs the date.  */

const DAY = 86_400_000;

const parse = (raw?: string) => {
  const t = raw ? new Date(raw).getTime() : NaN;
  return Number.isNaN(t) ? null : t;
};

const relative = (raw?: string) => {
  const t = parse(raw);
  return t === null ? "" : formatDistanceToNow(new Date(t), { addSuffix: true });
};

const absolute = (raw?: string) => {
  const t = parse(raw);
  return t === null
    ? "—"
    : new Date(t).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
};

const shortWhen = (raw?: string) => {
  const t = parse(raw);
  if (t === null) return "—";
  return Date.now() - t < 7 * DAY
    ? relative(raw)
    : new Date(t).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

/** Day buckets give the list structure without a date on every single row. */
const BUCKETS = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "week", label: "Earlier this week" },
  { key: "older", label: "Older" },
] as const;

type BucketKey = (typeof BUCKETS)[number]["key"];

const bucketOf = (raw?: string): BucketKey => {
  const t = parse(raw);
  if (t === null) return "older";
  const midnight = new Date();
  midnight.setHours(0, 0, 0, 0);
  const start = midnight.getTime();
  if (t >= start) return "today";
  if (t >= start - DAY) return "yesterday";
  if (t >= start - 7 * DAY) return "week";
  return "older";
};

/* ── Page ─────────────────────────────────────────────────────────────────── */

const Notifications = () => {
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openNotif, setOpenNotif] = useState<NotifRow | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string[] | null>(null);
  const [deleting, setDeleting] = useState(false);

  const notificationsQuery = useQuery<NotifRow[]>({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: async () => {
      const res = await notificationsApi.list(false, 50, "vendor");
      return res.success ? (res.data as NotifRow[]) : [];
    },
  });
  const notifications = notificationsQuery.data ?? [];

  /** Counts drive the rail badges and the "mark all read" affordance. */
  const counts = useMemo(() => {
    const c: Record<FilterKey, number> = {
      all: notifications.length,
      unread: 0,
      bookings: 0,
      payments: 0,
      listings: 0,
      support: 0,
      system: 0,
    };
    for (const n of notifications) {
      if (!n.isRead) c.unread += 1;
      c[metaFor(n).group] += 1;
    }
    return c;
  }, [notifications]);

  const query = search.trim().toLowerCase();

  const visible = useMemo(
    () =>
      notifications.filter((n) => {
        if (filter === "unread" && n.isRead) return false;
        if (filter !== "all" && filter !== "unread" && metaFor(n).group !== filter) return false;
        if (query && !`${n.title} ${n.message}`.toLowerCase().includes(query)) return false;
        return true;
      }),
    [notifications, filter, query],
  );

  const sections = useMemo(
    () =>
      BUCKETS.map((b) => ({
        ...b,
        items: visible.filter((n) => bucketOf(n.createdAt) === b.key),
      })).filter((s) => s.items.length > 0),
    [visible],
  );

  const visibleIds = visible.map(rowId);
  const allSelected = visible.length > 0 && visibleIds.every((id) => selectedIds.includes(id));

  /** Selection is scoped to what's on screen — changing the view clears it. */
  const changeFilter = (next: FilterKey) => {
    setFilter(next);
    setSelectedIds([]);
  };

  // ─── Mutations ────────────────────────────────────────────────────────────
  // Each one writes the cache optimistically, then invalidates the root key so
  // the server stays the source of truth for both this list and the bell badge.

  const patchCache = (fn: (rows: NotifRow[]) => NotifRow[]) =>
    queryClient.setQueryData<NotifRow[]>(NOTIFICATIONS_KEY, (prev) => fn(prev ?? []));

  const resync = () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_ROOT });

  const markRead = async (ids: string[]) => {
    const targets = notifications.filter((n) => ids.includes(rowId(n)) && !n.isRead).map(rowId);
    if (targets.length === 0) return;

    patchCache((rows) =>
      rows.map((n) => (targets.includes(rowId(n)) ? { ...n, isRead: true } : n)),
    );
    try {
      await Promise.all(targets.map((id) => notificationsApi.markAsRead(id)));
    } catch {
      toast.error("We couldn't mark those as read.");
    } finally {
      resync();
    }
  };

  const markAllRead = async () => {
    if (counts.unread === 0) return;
    patchCache((rows) => rows.map((n) => ({ ...n, isRead: true })));
    try {
      await notificationsApi.markAllAsRead();
      toast.success("All notifications marked as read");
    } catch {
      toast.error("We couldn't mark them as read.");
    } finally {
      resync();
    }
  };

  const runDelete = async () => {
    const ids = pendingDelete ?? [];
    if (ids.length === 0) return;

    setDeleting(true);
    patchCache((rows) => rows.filter((n) => !ids.includes(rowId(n))));
    try {
      // `remove` for one, `bulk-delete` for many — same endpoints as before.
      if (ids.length === 1) await notificationsApi.remove(ids[0]);
      else await notificationsApi.deleteMany(ids);
      toast.success(
        ids.length === 1 ? "Notification deleted" : `${ids.length} notifications deleted`,
      );
    } catch {
      toast.error("We couldn't delete that. Try again.");
    } finally {
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
      if (openNotif && ids.includes(rowId(openNotif))) setOpenNotif(null);
      setPendingDelete(null);
      setDeleting(false);
      resync();
    }
  };

  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));

  const toggleSelectAll = () =>
    setSelectedIds(allSelected ? [] : Array.from(new Set([...selectedIds, ...visibleIds])));

  const openRow = (n: NotifRow) => {
    setOpenNotif(n);
    if (!n.isRead) markRead([rowId(n)]);
  };

  const railItems: { key: FilterKey; label: string; icon: LucideIcon; color: string }[] = [
    { key: "all", label: "All", icon: Inbox, color: "#0d9488" },
    { key: "unread", label: "Unread", icon: BellRing, color: "#f23030" },
    // A category with nothing in it is a dead end — only offer real ones.
    ...CATEGORY_FILTERS.filter((f) => counts[f.key] > 0 || filter === f.key),
  ];

  /** Falls back to "All" — a category filter disappears once its last row goes. */
  const activeRailItem = railItems.find((i) => i.key === filter) ?? railItems[0];

  const openMeta = openNotif ? metaFor(openNotif) : null;

  return (
    <DashboardLayout
      title="Notifications"
      contentClassName="flex-1 overflow-y-auto scrollbar-hide p-4 lg:p-6 bg-muted/40 dark:bg-transparent"
    >
      {/* pb clears the fixed MobileVendorNav on small screens. */}
      <div style={BRAND_VARS} className="max-w-6xl mx-auto pb-24 lg:pb-12">
        <div className="grid gap-5 lg:gap-7 lg:grid-cols-[254px_minmax(0,1fr)]">
          {/* ── Left rail: how many are waiting, and what to look at ── */}
          <aside className="lg:sticky lg:top-2 self-start space-y-3">
            <div className={cn(PANEL, "p-4")}>
              <div className="flex items-center gap-3">
                <span className="relative grid place-items-center w-11 h-11 rounded-full bg-brand/[0.1] text-brand shrink-0">
                  <BellRing size={18} strokeWidth={2.1} />
                  {counts.unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#f23030] ring-2 ring-card" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="text-[22px] font-bold leading-none tabular-nums text-foreground">
                    {counts.unread}
                  </p>
                  <p className="mt-1 text-[12px] text-muted-foreground">
                    {counts.unread === 1 ? "unread notification" : "unread notifications"}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                onClick={markAllRead}
                disabled={counts.unread === 0}
                className={cn(BTN_SOFT, "mt-3.5 w-full disabled:opacity-45")}
              >
                <CheckCheck size={14} strokeWidth={2.3} />
                Mark all read
              </Button>
            </div>

            {/* Desktop rail */}
            <nav
              role="tablist"
              aria-label="Notification filters"
              className={cn(PANEL, "hidden lg:flex flex-col gap-0.5 p-2")}
            >
              {railItems.map((item) => {
                const active = filter === item.key;
                return (
                  <button
                    key={item.key}
                    role="tab"
                    aria-selected={active}
                    onClick={() => changeFilter(item.key)}
                    className={cn(
                      "group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left",
                      "outline-none transition-colors duration-150",
                      "focus-visible:ring-2 focus-visible:ring-brand/40",
                      !active && "hover:bg-muted/70 dark:hover:bg-white/[0.04]",
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="notificationsRailPill"
                        className="absolute inset-0 rounded-xl bg-brand/[0.09] shadow-[inset_3px_0_0_0_hsl(var(--brand))]"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      />
                    )}
                    <span
                      className={cn(
                        "relative grid place-items-center w-8 h-8 rounded-[10px] shrink-0",
                        "transition-colors duration-150",
                        active && "bg-brand text-brand-fg",
                      )}
                      style={
                        active
                          ? undefined
                          : { backgroundColor: `${item.color}1f`, color: item.color }
                      }
                    >
                      <item.icon size={15} strokeWidth={2.1} />
                    </span>
                    <span
                      className={cn(
                        "relative text-[13.5px] font-semibold truncate",
                        active ? "text-brand" : "text-foreground",
                      )}
                    >
                      {item.label}
                    </span>
                    <span
                      className={cn(
                        "relative ml-auto shrink-0 grid place-items-center min-w-[20px] h-[20px] px-1.5",
                        "rounded-full text-[10.5px] font-bold tabular-nums",
                        item.key === "unread" && counts.unread > 0
                          ? "bg-[#f23030]/10 text-[#f23030]"
                          : active
                            ? "bg-brand/15 text-brand"
                            : "bg-muted text-muted-foreground",
                      )}
                    >
                      {counts[item.key]}
                    </span>
                  </button>
                );
              })}
            </nav>

            {/* Mobile strip — no sliding pill, so the two navs never share a layoutId */}
            <div
              role="tablist"
              aria-label="Notification filters"
              className="lg:hidden flex items-center gap-1 p-1 overflow-x-auto scrollbar-hide bg-card border border-border/70 rounded-2xl shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
            >
              {railItems.map((item) => {
                const active = filter === item.key;
                return (
                  <button
                    key={item.key}
                    role="tab"
                    aria-selected={active}
                    onClick={() => changeFilter(item.key)}
                    className={cn(
                      "flex items-center gap-2 h-10 px-3.5 rounded-xl whitespace-nowrap",
                      "text-[13px] font-semibold transition-colors duration-150 outline-none",
                      "focus-visible:ring-2 focus-visible:ring-brand/40",
                      active ? "bg-brand/[0.09] text-brand" : "text-muted-foreground",
                    )}
                  >
                    <item.icon size={15} strokeWidth={2.2} />
                    {item.label}
                    <span className="tabular-nums opacity-70">{counts[item.key]}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* ── The list ── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={filter}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="min-w-0"
            >
              <Panel>
                <PanelHead
                  icon={activeRailItem.icon}
                  title={FILTER_LABEL[filter]}
                  blurb={
                    notificationsQuery.isLoading
                      ? "Loading your latest activity…"
                      : "Newest first. Open one to read the full message."
                  }
                />

                {notifications.length > 0 && (
                  <div className="flex items-center gap-3 px-5 py-3 border-b border-border/70">
                    {/* Radix renders the checkbox as a <button>, which a <label
                        htmlFor> can't activate — the text carries its own click. */}
                    <div className="flex items-center gap-2 shrink-0">
                      <Checkbox
                        id="notif-select-all"
                        checked={allSelected}
                        onCheckedChange={toggleSelectAll}
                        disabled={visible.length === 0}
                        aria-label="Select all notifications in view"
                      />
                      <button
                        onClick={toggleSelectAll}
                        disabled={visible.length === 0}
                        aria-controls="notif-select-all"
                        className="hidden sm:inline text-[12.5px] font-semibold text-foreground/85 select-none disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Select all
                      </button>
                    </div>

                    <div className="relative flex-1 min-w-0">
                      <Search
                        size={14}
                        strokeWidth={2.2}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 pointer-events-none"
                      />
                      <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search notifications"
                        aria-label="Search notifications"
                        className={cn("h-9 pl-9 pr-9", CONTROL)}
                      />
                      {search && (
                        <button
                          onClick={() => setSearch("")}
                          aria-label="Clear search"
                          className="absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center w-6 h-6 rounded-md text-muted-foreground hover:bg-muted transition-colors duration-150"
                        >
                          <X size={13} strokeWidth={2.4} />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Bulk actions only exist once something is picked. */}
                <AnimatePresence initial={false}>
                  {selectedIds.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden border-b border-border/70 bg-brand/[0.05]"
                    >
                      <div className="flex items-center gap-2 px-5 py-2.5">
                        <p className="text-[12.5px] font-bold tabular-nums text-brand">
                          {selectedIds.length} selected
                        </p>
                        <div className="ml-auto flex items-center gap-1">
                          <button
                            onClick={() => markRead(selectedIds)}
                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12.5px] font-semibold text-foreground/80 hover:bg-card transition-colors duration-150"
                          >
                            <CheckCheck size={14} strokeWidth={2.3} />
                            <span className="hidden sm:inline">Mark read</span>
                          </button>
                          <button
                            onClick={() => setPendingDelete(selectedIds)}
                            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-[12.5px] font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 transition-colors duration-150"
                          >
                            <Trash2 size={14} strokeWidth={2.3} />
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                          <button
                            onClick={() => setSelectedIds([])}
                            aria-label="Clear selection"
                            className="grid place-items-center w-8 h-8 rounded-lg text-muted-foreground hover:bg-card transition-colors duration-150"
                          >
                            <X size={14} strokeWidth={2.4} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {notificationsQuery.isLoading ? (
                  <div className="divide-y divide-border/70">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center gap-3 px-5 py-4 animate-pulse">
                        <div className="w-4 h-4 rounded bg-muted shrink-0" />
                        <div className="w-9 h-9 rounded-[10px] bg-muted shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-1/3 rounded bg-muted" />
                          <div className="h-2.5 w-3/4 rounded bg-muted/70" />
                        </div>
                        <div className="hidden sm:block h-2.5 w-16 rounded bg-muted shrink-0" />
                      </div>
                    ))}
                  </div>
                ) : notificationsQuery.isError ? (
                  <EmptyState
                    icon={AlertCircle}
                    title="We couldn't load your notifications"
                    description="The request didn't go through. Try again in a moment."
                    actionLabel="Try again"
                    onAction={() => notificationsQuery.refetch()}
                  />
                ) : notifications.length === 0 ? (
                  <EmptyState
                    icon={Bell}
                    title="Nothing here yet"
                    description="Bookings, payouts, listing reviews and support replies all land here as they happen."
                  />
                ) : visible.length === 0 ? (
                  <div className="px-5 py-12 text-center">
                    {filter === "unread" && !query ? (
                      <>
                        <span className="mx-auto grid place-items-center w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <CheckCheck size={22} strokeWidth={2.2} />
                        </span>
                        <p className="mt-3 text-[14.5px] font-bold text-foreground">
                          You're all caught up
                        </p>
                        <p className="mt-1 text-[12.5px] text-muted-foreground">
                          Nothing unread right now.
                        </p>
                      </>
                    ) : (
                      <p className="text-[13px] text-muted-foreground">
                        {query
                          ? `Nothing matches “${search.trim()}”.`
                          : `No ${FILTER_LABEL[filter].toLowerCase()} notifications.`}
                      </p>
                    )}
                    <button
                      onClick={() => {
                        setSearch("");
                        changeFilter("all");
                      }}
                      className="mt-3 text-[12.5px] font-semibold text-brand hover:underline"
                    >
                      Show all notifications
                    </button>
                  </div>
                ) : (
                  sections.map((section, sectionIndex) => (
                    <section key={section.key}>
                      <header
                        className={cn(
                          "px-5 py-2 bg-muted/40 dark:bg-white/[0.02] border-b border-border/70",
                          sectionIndex > 0 && "border-t",
                        )}
                      >
                        <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
                          {section.label}
                          <span className="ml-1.5 font-semibold tabular-nums opacity-70">
                            {section.items.length}
                          </span>
                        </p>
                      </header>

                      <ul className="divide-y divide-border/70">
                        {section.items.map((n, i) => {
                          const id = rowId(n);
                          const meta = metaFor(n);
                          const selected = selectedIds.includes(id);
                          return (
                            <motion.li
                              key={id}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.25, delay: Math.min(i, 6) * 0.035 }}
                              className={cn(
                                "group relative flex items-start gap-3 pl-5 pr-3 py-3.5",
                                "transition-colors duration-150",
                                selected
                                  ? "bg-brand/[0.06]"
                                  : !n.isRead
                                    ? "bg-brand/[0.02] hover:bg-brand/[0.045]"
                                    : "hover:bg-muted/50 dark:hover:bg-white/[0.03]",
                              )}
                            >
                              {!n.isRead && (
                                <span
                                  aria-hidden
                                  className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-brand"
                                />
                              )}

                              <Checkbox
                                checked={selected}
                                onCheckedChange={() => toggleSelect(id)}
                                aria-label={`Select "${n.title}"`}
                                className="mt-2.5 shrink-0"
                              />

                              <button
                                onClick={() => openRow(n)}
                                className={cn(
                                  "min-w-0 flex-1 flex items-start gap-3 text-left rounded-lg outline-none",
                                  "focus-visible:ring-2 focus-visible:ring-brand/40",
                                )}
                              >
                                <span
                                  className="grid place-items-center w-9 h-9 rounded-[10px] shrink-0"
                                  style={{
                                    backgroundColor: `${meta.color}1f`,
                                    color: meta.color,
                                  }}
                                >
                                  <meta.icon size={16} strokeWidth={2.1} />
                                </span>

                                <span className="min-w-0 flex-1">
                                  <span className="flex items-center gap-2">
                                    <span
                                      className={cn(
                                        "text-[13.5px] leading-5 truncate",
                                        n.isRead
                                          ? "font-semibold text-foreground/80"
                                          : "font-bold text-foreground",
                                      )}
                                    >
                                      {n.title}
                                    </span>
                                    {!n.isRead && (
                                      <span
                                        aria-label="Unread"
                                        className="w-1.5 h-1.5 rounded-full bg-brand shrink-0"
                                      />
                                    )}
                                  </span>
                                  <span className="mt-0.5 block text-[12.5px] leading-relaxed text-muted-foreground line-clamp-1">
                                    {n.message}
                                  </span>
                                  <span className="mt-1 flex sm:hidden items-center gap-1.5 text-[11px] text-muted-foreground">
                                    <span className="font-semibold" style={{ color: meta.color }}>
                                      {meta.label}
                                    </span>
                                    ·<span className="tabular-nums">{shortWhen(n.createdAt)}</span>
                                  </span>
                                </span>

                                <span className="hidden sm:flex flex-col items-end gap-1 shrink-0 pl-2">
                                  <span className="text-[11.5px] tabular-nums text-muted-foreground whitespace-nowrap">
                                    {shortWhen(n.createdAt)}
                                  </span>
                                  <span
                                    className="text-[11px] font-semibold"
                                    style={{ color: meta.color }}
                                  >
                                    {meta.label}
                                  </span>
                                </span>
                              </button>

                              <button
                                onClick={() => setPendingDelete([id])}
                                aria-label={`Delete "${n.title}"`}
                                className={cn(
                                  "mt-1.5 grid place-items-center w-8 h-8 rounded-lg shrink-0 outline-none",
                                  "text-muted-foreground/70 hover:text-red-600 hover:bg-red-50",
                                  "dark:hover:text-red-400 dark:hover:bg-red-500/10",
                                  "opacity-0 group-hover:opacity-100 focus-visible:opacity-100",
                                  "focus-visible:ring-2 focus-visible:ring-red-500/40",
                                  "transition-[opacity,color,background-color] duration-150",
                                )}
                              >
                                <Trash2 size={14} strokeWidth={2.2} />
                              </button>
                            </motion.li>
                          );
                        })}
                      </ul>
                    </section>
                  ))
                )}

                {!notificationsQuery.isLoading && notifications.length > 0 && (
                  <footer className={PANEL_FOOTER}>
                    <p className="text-[11.5px] text-muted-foreground">
                      Showing{" "}
                      <span className="font-semibold tabular-nums text-foreground/80">
                        {visible.length}
                      </span>{" "}
                      of{" "}
                      <span className="font-semibold tabular-nums text-foreground/80">
                        {notifications.length}
                      </span>
                    </p>
                    <p className="text-[11.5px] text-muted-foreground">
                      Your 50 most recent notifications
                    </p>
                  </footer>
                )}
              </Panel>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Notification detail ── */}
      <Dialog open={!!openNotif} onOpenChange={(open) => !open && setOpenNotif(null)}>
        <DialogContent
          style={BRAND_VARS}
          className="sm:max-w-[520px] p-0 gap-0 overflow-hidden rounded-[18px] bg-card border-border/70"
        >
          {openNotif && openMeta && (
            <>
              <div className="px-6 pt-6 pb-4 border-b border-border/70">
                <span
                  className="inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11.5px] font-bold"
                  style={{ backgroundColor: `${openMeta.color}1f`, color: openMeta.color }}
                >
                  <openMeta.icon size={12} strokeWidth={2.5} />
                  {openMeta.label}
                </span>
                <DialogTitle className="mt-3 pr-8 text-left text-[18px] font-bold leading-6 tracking-[-0.01em] text-foreground">
                  {openNotif.title}
                </DialogTitle>
                <p className="mt-1 text-[12px] tabular-nums text-muted-foreground">
                  {absolute(openNotif.createdAt)} · {relative(openNotif.createdAt)}
                </p>
              </div>

              <div className="px-6 py-5 max-h-[52vh] overflow-y-auto">
                <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap text-foreground/80">
                  {openNotif.message}
                </p>
              </div>

              <footer className={cn(PANEL_FOOTER, "px-6 justify-end gap-2")}>
                <button
                  onClick={() => setPendingDelete([rowId(openNotif)])}
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl text-[12.5px] font-semibold text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 transition-colors duration-150"
                >
                  <Trash2 size={14} strokeWidth={2.3} />
                  Delete
                </button>
                <Button variant="ghost" onClick={() => setOpenNotif(null)} className={BTN_NEUTRAL}>
                  Close
                </Button>
              </footer>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Deleting was previously silent and irreversible — confirm it. */}
      <ConfirmModal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={runDelete}
        isLoading={deleting}
        variant="danger"
        title={
          (pendingDelete?.length ?? 0) > 1
            ? `Delete ${pendingDelete?.length} notifications?`
            : "Delete this notification?"
        }
        description="This can't be undone."
        confirmLabel="Delete"
      />
    </DashboardLayout>
  );
};

export default Notifications;
