import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BadgeCheck,
  CircleSlash,
  Clock3,
  Eye,
  PauseCircle,
  Pencil,
  PlayCircle,
  Tag,
  Trash2,
  XCircle,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { AdminDataTable, type ColumnDef, type RowAction } from "@/components/admin/AdminDataTable";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import {
  BRAND_VARS,
  ConfirmModal,
  Panel,
  PanelHead,
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

const Offers = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { token: authToken } = useAuth();
  const token = authToken ?? undefined;

  const [tab, setTab] = useState<TabKey>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("latest");
  const [page, setPage] = useState(1);

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

  const stats = useMemo(
    () => ({
      total: serverTotal,
      approved: counts.approved,
      pending: counts.pending,
      inactive: offers.filter((o) =>
        ["cancelled", "deactivated", "blocked", "rejected"].includes(o.status),
      ).length,
    }),
    [offers, counts, serverTotal],
  );

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

  const resetPage = () => setPage(1);

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
      key: "category",
      header: "Category",
      hideBelow: "sm",
      cell: (o) => <span className="text-[12.5px] text-muted-foreground">{o.category || "—"}</span>,
    },
    {
      key: "regularPrice",
      header: "Price",
      hideBelow: "md",
      cell: (o) => (
        <span className="whitespace-nowrap">
          <span className="text-[12.5px] font-semibold tabular-nums text-foreground">
            {inr(o.regularPrice)}
          </span>
          {o.discountPrice ? (
            <span className="ml-1.5 text-[11px] font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
              {inr(o.discountPrice)}
            </span>
          ) : null}
        </span>
      ),
    },
    {
      key: "location",
      header: "Location",
      hideBelow: "lg",
      cell: (o) => (
        <span className="text-[12.5px] text-muted-foreground truncate">
          {[o.locality, o.city, o.state].filter(Boolean).join(", ") || "—"}
        </span>
      ),
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
    { label: "View", icon: Eye, onClick: (o) => navigate(`/offering/${o._id}`) },
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

  return (
    <DashboardLayout
      title="Offers"
      contentClassName="flex-1 overflow-y-auto scrollbar-hide p-4 lg:p-6 bg-muted/40 dark:bg-transparent"
    >
      {/* pb clears the fixed MobileVendorNav on small screens. */}
      <div style={BRAND_VARS} className="max-w-6xl mx-auto space-y-5 pb-24 lg:pb-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <StatTileSkeleton key={i} />)
          ) : (
            <>
              <StatTile
                index={0}
                icon={Tag}
                label="Offerings"
                hint="Everything you've listed"
                value={stats.total}
                color="#0d9488"
              />
              <StatTile
                index={1}
                icon={BadgeCheck}
                label="Live"
                hint="Approved and bookable"
                value={stats.approved}
                color="#22c55e"
              />
              <StatTile
                index={2}
                icon={Clock3}
                label="Pending"
                hint="Waiting on admin"
                value={stats.pending}
                color="#f59e0b"
              />
              <StatTile
                index={3}
                icon={CircleSlash}
                label="Inactive"
                hint="Paused, cancelled or rejected"
                value={stats.inactive}
                color="#94a3b8"
              />
            </>
          )}
        </div>

        <Panel>
          <PanelHead
            icon={Tag}
            title="Your offerings"
            blurb="Everything listed under this account, in every state."
            aside={
              !isLoading && !isError ? (
                <span className="text-[11.5px] font-semibold tabular-nums text-muted-foreground">
                  {visible.length === offers.length
                    ? `${offers.length} total`
                    : `${visible.length} of ${offers.length}`}
                </span>
              ) : undefined
            }
          />

          <div className="px-5 pt-2">
            <TabStrip
              tabs={TABS.map((t) => ({ ...t, count: counts[t.key] }))}
              activeKey={tab}
              onChange={(k) => {
                setTab(k as TabKey);
                resetPage();
              }}
              className="border-b-0"
            />
          </div>

          <div className="px-5 py-3.5 border-y border-border/70">
            <AdminToolbar
              searchValue={search}
              onSearchChange={(v) => {
                setSearch(v);
                resetPage();
              }}
              searchPlaceholder="Search name, category or city…"
              sortOptions={SORT_OPTIONS}
              sortValue={sort}
              onSortChange={(v) => {
                setSort(v);
                resetPage();
              }}
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
            onRowClick={(o) => navigate(`/offering/${o._id}`)}
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
            <p className="px-5 py-3 text-[11.5px] text-muted-foreground border-t border-border/70">
              Showing the {MY_OFFERS_LIMIT} most recent of {serverTotal} offerings.
            </p>
          )}
        </Panel>
      </div>

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
