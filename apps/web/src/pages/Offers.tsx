import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BadgeCheck,
  CircleSlash,
  Eye,
  PauseCircle,
  Pencil,
  Percent,
  PlayCircle,
  Plus,
  Tag,
  Trash2,
  XCircle,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { AdminDataTable, type ColumnDef, type RowAction } from "@/components/admin/AdminDataTable";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import ViewDetailsPopup from "@/components/admin/ViewDetailsPopup";
import { useTableUrlState } from "@/components/admin/useTableUrlState";
import {
  BRAND_VARS,
  BTN_PRIMARY,
  BTN_RAW,
  ConfirmModal,
  Panel,
  StatTile,
  StatTileSkeleton,
  StatusBadge,
  TabStrip,
} from "@/components/shared";
import { useAuth } from "@/contexts/AuthContext";
import { offersApi, type OfferDTO } from "@/lib/api";
import {
  MY_OFFERS_LIMIT,
  OfferEditDialog,
  inr,
  mediaUrl,
  myOffersKey,
  useMyOffers,
  type MyOffers,
} from "@/components/marketing";

type TabKey = "all" | "pending" | "approved" | "cancelled";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "cancelled", label: "Cancelled" },
];

const SORT_OPTIONS = [
  { value: "latest", label: "Latest first" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "name", label: "Name A–Z" },
];

const PER_PAGE = 10;

const priceOf = (o: OfferDTO) => {
  const n = Number(o.regularPrice);
  return Number.isFinite(n) ? n : 0;
};

/* ── Promotions ───────────────────────────────────────────────────────────────
   Each offering carries a `discounts` sub-doc with four independently-toggled
   slots. The page never read it: a "promotions" screen was rendering name,
   category, price and status — the same five facts as /offering — so there was
   no way to answer the questions it exists for. Which promotions are running?
   How deep is the discount? Which live listings have none at all?

   Everything below reads the record already in hand. No new request. */

const SLOT_LABELS = {
  firstUser: "First booking",
  festival: "Festival",
  weekly: "Weekly",
  special: "Special",
} as const;

type SlotKey = keyof typeof SLOT_LABELS;

export interface ActivePromo {
  key: SlotKey;
  label: string;
  /** Percentage off, derived from either a % or a fixed-amount slot. */
  percent: number;
}

/** The slots a vendor has switched on, with each one's effective discount. */
const activePromos = (o: OfferDTO): ActivePromo[] => {
  const base = priceOf(o);
  const out: ActivePromo[] = [];
  for (const key of Object.keys(SLOT_LABELS) as SlotKey[]) {
    const slot = o.discounts?.[key];
    if (!slot?.enabled) continue;
    const raw = Number(slot.value);
    if (!Number.isFinite(raw) || raw <= 0) continue;
    // A fixed slot stores rupees off; a percentage slot stores the percentage.
    // Both are shown as a percentage so four promotions can be compared at a
    // glance — "₹500 off" and "20% off" are not comparable side by side.
    const percent =
      slot.type === "fixed" ? (base > 0 ? Math.round((raw / base) * 100) : 0) : Math.round(raw);
    if (percent > 0) out.push({ key, label: SLOT_LABELS[key], percent });
  }
  return out;
};

/** Deepest discount on an offering, counting the flat `discountPrice` too. */
const bestDiscount = (o: OfferDTO): number => {
  const base = priceOf(o);
  const flat =
    base > 0 && o.discountPrice && Number(o.discountPrice) < base
      ? Math.round(((base - Number(o.discountPrice)) / base) * 100)
      : 0;
  return Math.max(flat, ...activePromos(o).map((p) => p.percent), 0);
};

const Offers = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { token: authToken } = useAuth();
  const token = authToken ?? undefined;

  /* Tab, search, sort, page and the open record live in `?tab=&q=&sort=&page=&id=`,
     the same hook the admin lists use. A refresh — or the redirect back from an
     edit — used to drop you on page 1 of "All" with nothing selected. */
  const {
    tab: rawTab,
    setTab,
    q: search,
    setQ: setSearch,
    sort,
    setSort,
    page,
    setPage,
    selectedId: viewId,
    setSelectedId: setViewId,
  } = useTableUrlState({ defaultTab: "all", defaultSort: "latest" });
  const tab = rawTab as TabKey;

  const [editing, setEditing] = useState<OfferDTO | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<OfferDTO | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<OfferDTO | null>(null);
  /** Ids with a write in flight — the row dims and its menu shows a spinner. */
  const [busyIds, setBusyIds] = useState<string[]>([]);

  const { data, isLoading, isError, refetch } = useMyOffers();
  const offers = useMemo(() => data?.items ?? [], [data]);
  const serverTotal = data?.total ?? offers.length;

  const counts = useMemo(
    () => ({
      all: offers.length,
      pending: offers.filter((o) => o.status === "pending").length,
      approved: offers.filter((o) => o.status === "approved").length,
      cancelled: offers.filter((o) => o.status === "cancelled").length,
    }),
    [offers],
  );

  const stats = useMemo(() => {
    const live = offers.filter((o) => o.status === "approved");
    const promoted = live.filter((o) => bestDiscount(o) > 0);
    const deepest = promoted.reduce((max, o) => Math.max(max, bestDiscount(o)), 0);
    return {
      /* Deliberately NOT four counts of the same list sliced four ways, which
         is what this row used to be (total / approved / pending / inactive —
         three of them already visible as tab counts a few pixels below). Each
         card now answers a different question, and the last one is the only
         genuinely actionable number on the page. */
      promoted: promoted.length,
      deepest,
      live: live.length,
      unpromoted: live.length - promoted.length,
      pending: counts.pending,
      total: serverTotal,
    };
  }, [offers, counts, serverTotal]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = offers.filter((o) => {
      if (tab !== "all" && o.status !== tab) return false;
      if (!q) return true;
      return `${o.name ?? ""} ${o.category ?? ""} ${o.city ?? ""} ${o.state ?? ""}`
        .toLowerCase()
        .includes(q);
    });

    // "latest" keeps the server order (createdAt desc) — no client re-sort.
    if (sort === "price_desc") return [...rows].sort((a, b) => priceOf(b) - priceOf(a));
    if (sort === "price_asc") return [...rows].sort((a, b) => priceOf(a) - priceOf(b));
    if (sort === "name")
      return [...rows].sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
    return rows;
  }, [offers, tab, search, sort]);

  const totalPages = Math.max(1, Math.ceil(visible.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const rows = visible.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  /* Drawer position within the whole filtered set, not just the page on
     screen — stepping to the next offering shouldn't stop at a pagination
     boundary that exists for the table's benefit. */
  const viewIndex = viewId ? visible.findIndex((o) => o._id === viewId) : -1;
  const viewOffer = viewIndex >= 0 ? visible[viewIndex] : null;

  /* No local resetPage(): setTab/setQ/setSort already drop `?page=`. Calling
     both in one handler actively BROKE the write — react-router hands each
     functional update the same current params, so the second call recomputed
     from a base that never had the first call's change and silently discarded
     it. The search box wrote `?q=` and the page reset wiped it in the same
     tick. */

  /* ── Mutations ──────────────────────────────────────────────────────────
     Every write passes the token. The previous page called update / setStatus
     / remove with no auth header at all — /api/offers requires a JWT on those
     verbs, so each one came back 401 and the row never changed. */
  const withBusy = async (id: string, fn: () => Promise<void>) => {
    setBusyIds((prev) => [...prev, id]);
    try {
      await fn();
    } finally {
      setBusyIds((prev) => prev.filter((x) => x !== id));
    }
  };

  const patchCache = (updated: OfferDTO) =>
    queryClient.setQueryData<MyOffers>(myOffersKey, (prev) =>
      prev
        ? { ...prev, items: prev.items.map((o) => (o._id === updated._id ? updated : o)) }
        : prev,
    );

  const dropFromCache = (id: string) =>
    queryClient.setQueryData<MyOffers>(myOffersKey, (prev) =>
      prev
        ? { items: prev.items.filter((o) => o._id !== id), total: Math.max(0, prev.total - 1) }
        : prev,
    );

  const saveEdit = async (id: string, values: Partial<OfferDTO>) => {
    try {
      const res = await offersApi.update(id, values, token);
      if (res?.data) patchCache(res.data);
      setEditing(null);
      toast.success("Offering updated.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed.");
    }
  };

  const setStatus = (offer: OfferDTO, status: "approved" | "cancelled" | "deactivated") =>
    withBusy(offer._id!, async () => {
      try {
        const res = await offersApi.setStatus(offer._id!, status, token);
        if (res?.data) patchCache(res.data);
        toast.success(
          status === "cancelled"
            ? "Offering cancelled."
            : status === "deactivated"
              ? "Listing paused."
              : "Listing resumed.",
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't update this offering.");
      }
    });

  const doDelete = (offer: OfferDTO) =>
    withBusy(offer._id!, async () => {
      try {
        await offersApi.remove(offer._id!, token);
        dropFromCache(offer._id!);
        toast.success("Offering deleted.");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Couldn't delete this offering.");
      }
    });

  /* ── Columns ── */
  const columns: ColumnDef<OfferDTO>[] = [
    {
      key: "name",
      header: "Offering",
      cell: (o) => (
        <div className="flex items-center gap-3 min-w-0">
          {o.photos?.coverUrl ? (
            <img
              src={mediaUrl(o.photos.coverUrl)}
              alt=""
              loading="lazy"
              className="w-10 h-10 rounded-xl object-cover shrink-0"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/placeholder.svg";
              }}
            />
          ) : (
            <span className="grid place-items-center w-10 h-10 rounded-xl bg-muted shrink-0">
              <Tag size={15} className="text-muted-foreground/60" />
            </span>
          )}
          <span className="min-w-0">
            <span className="block text-[13px] font-semibold text-foreground truncate">
              {o.name || "Untitled"}
            </span>
            <span className="block sm:hidden text-[11.5px] text-muted-foreground truncate">
              {o.category || "—"}
            </span>
          </span>
        </div>
      ),
    },
    {
      key: "promotions",
      header: "Promotions",
      hideBelow: "sm",
      cell: (o) => {
        const promos = activePromos(o);
        if (promos.length === 0) {
          return (
            <span className="text-[12px] text-muted-foreground/70">
              {o.status === "approved" ? "None running" : "—"}
            </span>
          );
        }
        return (
          <span className="flex flex-wrap items-center gap-1">
            {/* Two chips, then a count. Four slot names side by side pushed the
                price column off a laptop, and the fourth chip carries almost no
                information once you know how many are running. */}
            {promos.slice(0, 2).map((p) => (
              <span
                key={p.key}
                className="inline-flex items-center gap-1 h-[22px] px-2 rounded-full bg-brand/[0.09] text-brand text-[11px] font-semibold whitespace-nowrap"
              >
                {p.label}
                <span className="tabular-nums opacity-80">{p.percent}%</span>
              </span>
            ))}
            {promos.length > 2 && (
              <span className="text-[11px] font-semibold tabular-nums text-muted-foreground">
                +{promos.length - 2}
              </span>
            )}
          </span>
        );
      },
    },
    {
      key: "regularPrice",
      header: "Price",
      hideBelow: "md",
      className: "text-right",
      cell: (o) => {
        const off = bestDiscount(o);
        return (
          <span className="block whitespace-nowrap text-right">
            <span
              className={
                off > 0
                  ? "text-[12.5px] tabular-nums text-muted-foreground line-through"
                  : "text-[12.5px] font-semibold tabular-nums text-foreground"
              }
            >
              {inr(o.regularPrice)}
            </span>
            {off > 0 && (
              <span className="ml-1.5 text-[12.5px] font-bold tabular-nums text-foreground">
                {o.discountPrice
                  ? inr(o.discountPrice)
                  : inr(Math.round(priceOf(o) * (1 - off / 100)))}
              </span>
            )}
          </span>
        );
      },
    },
    {
      key: "discount",
      header: "Best offer",
      hideBelow: "lg",
      className: "text-right",
      cell: (o) => {
        const off = bestDiscount(o);
        return off > 0 ? (
          <span className="text-[12.5px] font-bold tabular-nums text-emerald-600 dark:text-emerald-500">
            −{off}%
          </span>
        ) : (
          <span className="text-[12.5px] text-muted-foreground/70">—</span>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      cell: (o) => <StatusBadge status={o.status || "pending"} />,
    },
  ];

  /* ── Row actions — mirrored from the server's owner rules (offers.service
     checkStatusPermission): cancel only from pending, pause only from
     approved, resume only from deactivated. The old menu offered Cancel on
     every row, which 403'd on anything already approved. ── */
  const rowActions: RowAction<OfferDTO>[] = [
    { label: "View", icon: Eye, onClick: (o) => setViewId(o._id ?? null) },
    { label: "Quick edit", icon: Pencil, onClick: (o) => setEditing(o) },
    {
      label: "Pause listing",
      icon: PauseCircle,
      onClick: (o) => setStatus(o, "deactivated"),
      hidden: (o) => o.status !== "approved",
    },
    {
      label: "Resume listing",
      icon: PlayCircle,
      onClick: (o) => setStatus(o, "approved"),
      hidden: (o) => o.status !== "deactivated",
    },
    {
      label: "Cancel",
      icon: XCircle,
      onClick: (o) => setConfirmCancel(o),
      hidden: (o) => o.status !== "pending",
    },
    {
      label: "Delete",
      icon: Trash2,
      onClick: (o) => setConfirmDelete(o),
      variant: "danger",
    },
  ];

  const hasActiveQuery = search.trim().length > 0 || tab !== "all";

  /* Tabs live on the header band's bottom edge. Inside the card they were the
     third stacked strip — panel head, then tabs, then toolbar — before a single
     row of data, which is roughly 150px of chrome above the content. */
  const tabs = (
    <TabStrip
      variant="flush"
      tabs={TABS.map((t) => ({ ...t, count: counts[t.key] }))}
      activeKey={tab}
      onChange={setTab}
    />
  );

  return (
    <DashboardLayout
      title="Offers & promotions"
      subtitle="Discounts running against your listings — what's live, how deep it goes, and which offerings have nothing on them."
      tabs={tabs}
      headerActions={
        <button onClick={() => navigate("/offering/add")} className={`${BTN_RAW} ${BTN_PRIMARY}`}>
          <Plus size={15} strokeWidth={2.4} />
          New offering
        </button>
      }
    >
      <div style={BRAND_VARS} className="space-y-5">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <StatTileSkeleton key={i} />)
          ) : (
            <>
              <StatTile
                index={0}
                icon={Tag}
                label="Running promotions"
                hint={`On ${stats.promoted} of ${stats.live} live offering${stats.live === 1 ? "" : "s"}`}
                value={stats.promoted}
              />
              <StatTile
                index={1}
                icon={Percent}
                label="Deepest discount"
                hint={stats.deepest > 0 ? "Best offer you're running" : "Nothing discounted yet"}
                value={stats.deepest > 0 ? `${stats.deepest}%` : "—"}
              />
              <StatTile
                index={2}
                icon={BadgeCheck}
                label="Live offerings"
                hint="Approved and bookable"
                value={stats.live}
              />
              <StatTile
                index={3}
                icon={CircleSlash}
                label="Without an offer"
                hint={
                  stats.unpromoted > 0
                    ? "A discount is the cheapest way to move these"
                    : "Every live offering has one"
                }
                value={stats.unpromoted}
                onClick={stats.unpromoted > 0 ? () => setTab("approved") : undefined}
              />
            </>
          )}
        </div>

        <Panel>
          {/* The toolbar IS the card's header row — search grows to fill it, the
              sort control and the result count sit at the end, and the table
              starts directly under the hairline. */}
          <div className="px-4 py-3 border-b border-border">
            <AdminToolbar
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search name, category or city…"
              sortOptions={SORT_OPTIONS}
              sortValue={sort}
              onSortChange={setSort}
            />
          </div>

          <AdminDataTable<OfferDTO>
            columns={columns}
            data={rows}
            isLoading={isLoading}
            isError={isError}
            errorMessage="We couldn't load your offerings."
            onRetry={() => refetch()}
            hasActiveQuery={hasActiveQuery}
            emptyIcon={Tag}
            emptyTitle="No offerings yet"
            emptyDescription="List a camper van, stay or activity and it will show up here."
            emptyAction={{ label: "Add an offering", onClick: () => navigate("/offering/add") }}
            noResultsTitle="No matching offerings"
            noResultsDescription="Try a different search, or switch tabs."
            rowActions={rowActions}
            rowBusy={(o) => busyIds.includes(o._id ?? "")}
            getRowId={(row, index) => row._id ?? String(index)}
            onRowClick={(o) => setViewId(o._id ?? null)}
            pagination={
              visible.length > PER_PAGE
                ? {
                    currentPage: safePage,
                    totalPages,
                    totalItems: visible.length,
                    onPageChange: setPage,
                  }
                : undefined
            }
            skeletonRows={6}
          />

          {serverTotal > MY_OFFERS_LIMIT && (
            <p className="px-4 py-3 text-[11.5px] text-muted-foreground border-t border-border">
              Showing the {MY_OFFERS_LIMIT} most recent of {serverTotal} offerings.
            </p>
          )}
        </Panel>
      </div>

      {/* The same inspector the admin opens on a listing — one rendering of one
          record, in whichever accent the console is wearing. */}
      {viewOffer && (
        <ViewDetailsPopup
          isOpen
          onClose={() => setViewId(null)}
          listingData={viewOffer}
          portalScope="vendor"
          position={{ index: viewIndex + 1, total: visible.length }}
          onPrev={viewIndex > 0 ? () => setViewId(visible[viewIndex - 1]._id ?? null) : undefined}
          onNext={
            viewIndex < visible.length - 1
              ? () => setViewId(visible[viewIndex + 1]._id ?? null)
              : undefined
          }
        />
      )}

      <OfferEditDialog offer={editing} onClose={() => setEditing(null)} onSave={saveEdit} />

      <ConfirmModal
        open={!!confirmCancel}
        onClose={() => setConfirmCancel(null)}
        onConfirm={() => {
          if (confirmCancel) setStatus(confirmCancel, "cancelled");
          setConfirmCancel(null);
        }}
        title="Cancel this offering?"
        description="It will be withdrawn from review. You can't undo this from here."
        confirmLabel="Cancel offering"
        cancelLabel="Keep it"
        variant="warning"
      />

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) doDelete(confirmDelete);
          setConfirmDelete(null);
        }}
        title="Delete this offering?"
        description="The listing and its photos are removed permanently. This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </DashboardLayout>
  );
};

export default Offers;
