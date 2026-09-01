import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Plus,
  Award,
  Search,
  ChevronDown,
  CheckCircle2,
  Clock,
  IndianRupee,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { offersApi, type OfferDTO } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { CustomPagination } from "@/components/CustomPagination";
import { OfferingCard } from "@/components/offering";
import { cn } from "@/lib/utils";
import {
  BRAND_VARS,
  BTN_PRIMARY,
  BTN_RAW,
  CONTROL,
  EmptyState,
  PANEL,
  PILL_NEUTRAL,
  Panel,
  StatTile,
  StatTileSkeleton,
  TabStrip,
} from "@/components/shared";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import ViewDetailsPopup from "@/components/admin/ViewDetailsPopup";
import {
  ComplianceAlertBand,
  ComplianceRenewDialog,
  type CompliancePayload,
} from "@/components/compliance";
import { useTableUrlState, type UrlFilterDef } from "@/components/admin/useTableUrlState";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { currencyINR } from "@/utils/currency";
import { toast } from "sonner";

/* Query params this page owns. */
const URL_FILTERS: UrlFilterDef[] = [{ key: "type", type: "select" }];

const ITEMS_PER_PAGE = 12;

/* ── Filter dropdown pill ──────────────────────────────────────────────── */
const FilterPill: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button
        type="button"
        className={cn(
          "inline-flex items-center gap-2 h-9 px-3 rounded-lg border whitespace-nowrap",
          "text-[13px] font-semibold text-foreground/85 bg-card border-border",
          "outline-none transition-colors duration-150 hover:bg-muted",
          "focus-visible:ring-4 focus-visible:ring-brand/15 focus-visible:border-brand",
        )}
      >
        {label}
        <ChevronDown size={14} className="text-muted-foreground" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent
      align="start"
      style={BRAND_VARS}
      data-console-portal=""
      className="w-52 p-1.5"
    >
      {children}
    </DropdownMenuContent>
  </DropdownMenu>
);

/* Radix's own `focus:bg-accent` resolves to an invalid colour in this app —
   see the SELECT_ITEM note in components/shared/Panel.tsx. */
const FILTER_ITEM_CLASS =
  "cursor-pointer rounded-lg px-2.5 py-2 text-[13px] font-medium text-foreground " +
  "transition-colors " +
  "focus:bg-brand/[0.1] focus:text-brand " +
  "data-[highlighted]:bg-brand/[0.1] data-[highlighted]:text-brand";

const TYPE_LABELS: Record<string, string> = {
  all: "All types",
  "camper-van": "Camper vans",
  "unique-stay": "Unique stays",
  activity: "Activities",
};

const SORT_LABELS = {
  recent: "Recently added",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  name: "Name A–Z",
} as const;

type SortKey = keyof typeof SORT_LABELS;

/** Grid-shaped loading state — matches the card, not a generic block. */
const CardSkeleton = () => (
  <div className={cn(PANEL, "overflow-hidden")}>
    <div className="aspect-[4/3] bg-muted animate-pulse" />
    <div className="p-4 space-y-2.5">
      <div className="h-3.5 w-2/3 rounded bg-muted animate-pulse" />
      <div className="h-3 w-1/2 rounded bg-muted/70 animate-pulse" />
      <div className="flex items-center justify-between pt-2">
        <div className="h-5 w-20 rounded bg-muted animate-pulse" />
        <div className="h-7 w-14 rounded-full bg-muted animate-pulse" />
      </div>
    </div>
  </div>
);


const Offering = () => {
  const navigate = useNavigate();
  /* The page already honoured `?tab=` on mount, one way. It is two-way now, and
     search, type, page and the open record ride along in the same place — the
     shared hook the admin lists use. */
  const {
    tab: rawTab,
    setTab: setActiveTab,
    q: searchQuery,
    setQ: setSearchQuery,
    page,
    setPage,
    filters,
    setFilters,
    sort,
    setSort,
    selectedId: viewId,
    setSelectedId: setViewId,
  } = useTableUrlState({ filters: URL_FILTERS, defaultTab: "approved", defaultSort: "recent" });
  const activeTab = rawTab as "approved" | "pending" | "deactivated";
  const sortKey = (sort in SORT_LABELS ? sort : "recent") as SortKey;
  const typeFilter = (filters.type as string) || "all";
  const setTypeFilter = (value: string) =>
    setFilters(value === "all" ? {} : { type: value });
  const { user, token: authToken } = useAuth();
  const queryClient = useQueryClient();
  const token = authToken ?? undefined;

  const [confirm, setConfirm] = useState<{
    title: string;
    description: string;
    variant: "danger" | "warning" | "info";
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const enabled = !!user?.id;

  const approvedQuery = useQuery<OfferDTO[]>({
    queryKey: ["offerings", "approved", user?.id],
    enabled,
    refetchInterval: 100_000,
    queryFn: async () => {
      const res = await offersApi.list("approved", token, { mine: true });
      return Array.isArray(res.data) ? res.data : [];
    },
  });
  const pendingQuery = useQuery<OfferDTO[]>({
    queryKey: ["offerings", "pending", user?.id],
    enabled,
    refetchInterval: 100_000,
    queryFn: async () => {
      const res = await offersApi.list("pending", token, { mine: true });
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  /* Listings that are off the site. Without this the compliance sweep is a
     trapdoor: it flips an expired vehicle to `deactivated`, which belongs to
     neither of the two tabs above, so the listing simply vanishes from the
     console the vendor was told to go and fix it in. */
  const deactivatedQuery = useQuery<OfferDTO[]>({
    queryKey: ["offerings", "deactivated", user?.id],
    enabled,
    refetchInterval: 100_000,
    queryFn: async () => {
      const res = await offersApi.list("deactivated" as "approved", token, { mine: true });
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  const approvedOffers = approvedQuery.data ?? [];
  const pendingOffers = pendingQuery.data ?? [];
  const deactivatedOffers = deactivatedQuery.data ?? [];
  const loading = approvedQuery.isLoading || pendingQuery.isLoading;

  const reload = () => {
    queryClient.invalidateQueries({ queryKey: ["offerings"] });
  };

  const baseOffers =
    activeTab === "approved"
      ? approvedOffers
      : activeTab === "deactivated"
        ? deactivatedOffers
        : pendingOffers;

  /* The band draws from every tab, not the visible one. A vehicle that lapsed
     is sitting under "Off the site" — telling the vendor about it only once
     they have already navigated there defeats the point. */
  const complianceListings = useMemo(
    () => [...approvedOffers, ...pendingOffers, ...deactivatedOffers],
    [approvedOffers, pendingOffers, deactivatedOffers],
  );

  const [renewTarget, setRenewTarget] = useState<OfferDTO | null>(null);

  const offers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = baseOffers.filter((o) => {
      if (typeFilter !== "all") {
        const st = (o.serviceType || "").toLowerCase();
        if (st !== typeFilter) return false;
      }
      if (q) {
        const hay =
          `${o.name ?? ""} ${o.category ?? ""} ${o.city ?? ""} ${o.state ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    /* Sorted client-side over the already-fetched list — no new request. A
       catalog you can only read in insertion order stops being usable at about
       twenty listings, which is where these accounts land. */
    const price = (o: OfferDTO) => Number(o.regularPrice || 0);
    const sorted = [...filtered];
    if (sortKey === "price-asc") sorted.sort((a, b) => price(a) - price(b));
    else if (sortKey === "price-desc") sorted.sort((a, b) => price(b) - price(a));
    else if (sortKey === "name") sorted.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
    return sorted;
  }, [baseOffers, typeFilter, searchQuery, sortKey]);

  /* The page-reset effect that used to sit here is gone: the URL hook resets
     `?page=` inside setQ/setFilters/setTab. As an effect it also ran on MOUNT,
     which meant a deep link like `?q=camper&page=2` snapped back to page 1
     before the operator saw it. */

  const stats = useMemo(() => {
    const prices = approvedOffers.map((o) => Number(o.regularPrice || 0)).filter((n) => n > 0);
    const revenue = prices.reduce((sum, n) => sum + n, 0);
    return {
      approved: approvedOffers.length,
      pending: pendingOffers.length,
      revenue,
      avgPrice: prices.length ? Math.round(revenue / prices.length) : 0,
    };
  }, [approvedOffers, pendingOffers]);

  const totalPages = Math.ceil(offers.length / ITEMS_PER_PAGE);
  const paginated = offers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const hasActiveQuery = typeFilter !== "all" || searchQuery.trim().length > 0;

  /* Position within the whole filtered set, so prev/next crosses page edges. */
  const viewIndex = viewId ? offers.findIndex((o) => o._id === viewId) : -1;
  const viewOffer = viewIndex >= 0 ? offers[viewIndex] : null;

  const onDelete = (id: string) => {
    const listing = offers.find((o) => o._id === id);
    const name = listing?.name;
    setConfirm({
      title: "Delete listing?",
      description: name
        ? `"${name}" will be permanently removed and cannot be undone.`
        : "This listing will be permanently removed and cannot be undone.",
      variant: "danger",
      confirmLabel: "Delete listing",
      onConfirm: async () => {
        setDeleting(true);
        try {
          await offersApi.remove(id, token);
          reload();
        } finally {
          setDeleting(false);
          setConfirm(null);
        }
      },
    });
  };
  const submitRenewal = async (payload: CompliancePayload) => {
    if (!renewTarget?._id) return;
    const res = await offersApi.updateCompliance(renewTarget._id, payload, token);
    reload();
    toast.success(res.restored ? `"${renewTarget.name}" is live again.` : "Documents updated.");
  };

  /* Editing is its own page (/offering/:id/edit) — the old right-side
     OfferPanel duplicated a subset of the wizard's fields. */
  const onEdit = (offer: OfferDTO) => navigate(`/offering/${offer._id}/edit`);

  /* The status tabs moved onto the header band's bottom edge. They used to be a
     segmented pill inside a "Your listings" panel that carried nothing else —
     a whole card whose only job was to hold a control. Switching a tab now
     visibly swaps the page body, which is what a tab is supposed to mean. */
  const tabs = (
    <TabStrip
      variant="flush"
      tabs={[
        { key: "approved", label: "Live", count: approvedOffers.length },
        { key: "pending", label: "Under review", count: pendingOffers.length },
        { key: "deactivated", label: "Off the site", count: deactivatedOffers.length },
      ]}
      activeKey={activeTab}
      onChange={setActiveTab}
    />
  );

  return (
    <>
      <DashboardLayout
        title="Offerings"
        subtitle="Every camper van, stay and activity listed under this account, in every state."
        tabs={tabs}
        headerActions={
          <Button onClick={() => navigate("/offering/add")} className={cn(BTN_RAW, BTN_PRIMARY)}>
            <Plus size={15} strokeWidth={2.5} />
            Add offering
          </Button>
        }
      >
        <div style={BRAND_VARS} className="space-y-5">
          {/* ── Compliance ── Above the metrics: a listing that is off the site
              is not a number, it is something to go and fix. */}
          {!loading && (
            <ComplianceAlertBand
              listings={complianceListings}
              onRenew={(listing) => setRenewTarget(listing as OfferDTO)}
            />
          )}

          {/* ── Metrics ── */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <StatTileSkeleton key={i} />)
            ) : (
              <>
                <StatTile
                  icon={CheckCircle2}
                  label="Live"
                  hint="Bookable by travellers"
                  value={stats.approved}
                  index={0}
                />
                <StatTile
                  icon={Clock}
                  label="Under review"
                  hint={stats.pending > 0 ? "Not bookable yet" : "Nothing waiting"}
                  value={stats.pending}
                  index={1}
                  onClick={stats.pending > 0 ? () => setActiveTab("pending") : undefined}
                />
                <StatTile
                  icon={IndianRupee}
                  label="Avg nightly rate"
                  hint="Across live offerings"
                  value={currencyINR(stats.avgPrice)}
                  index={2}
                />
                <StatTile
                  icon={Award}
                  label="Catalog value"
                  hint="Combined day rate"
                  value={currencyINR(stats.revenue)}
                  index={3}
                />
              </>
            )}
          </div>

          {/* ── Toolbar ──
              A bare control row on the page ground, not another card: the cards
              below ARE the panels, and wrapping the filters in a second one gave
              the page two competing white surfaces before any content. */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[190px] sm:max-w-[320px]">
              <Search
                size={14}
                strokeWidth={2.2}
                aria-hidden
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 pointer-events-none"
              />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, category or city"
                aria-label="Search listings"
                className={cn(CONTROL, "h-9 pl-9 bg-card text-[13px]")}
              />
            </div>

            <FilterPill label={TYPE_LABELS[typeFilter]}>
              {(["all", "camper-van", "unique-stay", "activity"] as const).map((key) => (
                <DropdownMenuItem
                  key={key}
                  className={FILTER_ITEM_CLASS}
                  onClick={() => setTypeFilter(key)}
                >
                  {TYPE_LABELS[key]}
                </DropdownMenuItem>
              ))}
            </FilterPill>

            <FilterPill label={SORT_LABELS[sortKey]}>
              {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                <DropdownMenuItem
                  key={key}
                  className={FILTER_ITEM_CLASS}
                  onClick={() => setSort(key === "recent" ? "" : key)}
                >
                  {SORT_LABELS[key]}
                </DropdownMenuItem>
              ))}
            </FilterPill>

            {hasActiveQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setTypeFilter("all");
                }}
                className={cn(PILL_NEUTRAL, "h-9 bg-card hover:bg-muted transition-colors")}
              >
                <X size={13} strokeWidth={2.4} aria-hidden />
                Clear
              </button>
            )}

            <p className="ml-auto text-[12px] tabular-nums text-muted-foreground">
              {loading
                ? "Loading…"
                : hasActiveQuery
                  ? `${offers.length} of ${baseOffers.length} shown`
                  : `${offers.length} listing${offers.length === 1 ? "" : "s"}`}
            </p>
          </div>

          {/* ── Grid — the cards ARE panels, so they sit on the page, not in one ── */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : offers.length === 0 ? (
            <Panel>
              {hasActiveQuery ? (
                <EmptyState
                  icon={Search}
                  title="No listings match your filters"
                  description="Try clearing the search or picking a different type."
                  actionLabel="Clear filters"
                  onAction={() => {
                    setSearchQuery("");
                    setTypeFilter("all");
                  }}
                  className="min-h-[320px]"
                />
              ) : (
                <EmptyState
                  icon={Award}
                  title={
                    activeTab === "approved"
                      ? "No approved listings yet"
                      : activeTab === "deactivated"
                        ? "Nothing is off the site"
                        : "No pending listings"
                  }
                  description={
                    activeTab === "approved"
                      ? "Listings show up here once an admin approves them. Anything you submit sits under Pending until then."
                      : activeTab === "deactivated"
                        ? "Listings land here when you pause them, or when a vehicle's insurance or PUC certificate expires."
                        : "New listings go into pending review first. Create one to get started."
                  }
                  actionLabel={
                    activeTab === "approved"
                      ? "View pending listings"
                      : activeTab === "deactivated"
                        ? "Back to live listings"
                        : "Create your first listing"
                  }
                  onAction={() =>
                    activeTab === "approved"
                      ? setActiveTab("pending")
                      : activeTab === "deactivated"
                        ? setActiveTab("approved")
                        : navigate("/offering/add")
                  }
                  className="min-h-[320px]"
                />
              )}
            </Panel>
          ) : (
            <>
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
              >
                {paginated.map((listing) => (
                  <OfferingCard
                    key={listing._id}
                    listing={listing}
                    onDelete={onDelete}
                    onEdit={onEdit}
                    onCardClick={(id) => setViewId(id)}
                    onRenewCompliance={setRenewTarget}
                  />
                ))}
              </motion.div>

              {totalPages > 1 && (
                <CustomPagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              )}
            </>
          )}
        </div>
      </DashboardLayout>
      {/* Same inspector the admin opens on a listing, in the vendor's accent. */}
      {viewOffer && (
        <ViewDetailsPopup
          isOpen
          onClose={() => setViewId(null)}
          listingData={viewOffer}
          portalScope="vendor"
          onRenewCompliance={() => setRenewTarget(viewOffer)}
          position={{ index: viewIndex + 1, total: offers.length }}
          onPrev={viewIndex > 0 ? () => setViewId(offers[viewIndex - 1]._id ?? null) : undefined}
          onNext={
            viewIndex < offers.length - 1
              ? () => setViewId(offers[viewIndex + 1]._id ?? null)
              : undefined
          }
        />
      )}

      <ComplianceRenewDialog
        open={!!renewTarget}
        onClose={() => setRenewTarget(null)}
        listing={renewTarget}
        onSubmit={submitRenewal}
      />

      <ConfirmModal
        open={!!confirm}
        onClose={() => !deleting && setConfirm(null)}
        onConfirm={() => confirm?.onConfirm()}
        title={confirm?.title ?? ""}
        description={confirm?.description}
        confirmLabel={confirm?.confirmLabel}
        variant={confirm?.variant}
        isLoading={deleting}
      />
    </>
  );
};

export default Offering;
