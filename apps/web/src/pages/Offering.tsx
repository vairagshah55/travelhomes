import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Award, Search, ChevronDown, CheckCircle2, Clock, IndianRupee } from "lucide-react";
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
  CONTROL,
  EmptyState,
  PANEL,
  Panel,
  PanelHead,
  StatTile,
  StatTileSkeleton,
} from "@/components/shared";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { CONSOLE_PORTAL_VARS } from "@/components/shared";
import ViewDetailsPopup from "@/components/admin/ViewDetailsPopup";
import { useTableUrlState, type UrlFilterDef } from "@/components/admin/useTableUrlState";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { currencyINR } from "@/utils/currency";

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
          "inline-flex items-center gap-2 h-10 px-3.5 rounded-xl border whitespace-nowrap",
          "text-[13px] font-semibold text-foreground/85 bg-muted/50 dark:bg-white/5 border-border",
          "outline-none transition-colors duration-150 hover:bg-muted",
          "focus-visible:ring-4 focus-visible:ring-brand/15 focus-visible:border-brand",
        )}
      >
        {label}
        <ChevronDown size={14} className="text-muted-foreground" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" style={BRAND_VARS} className="w-48 p-1.5">
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
    selectedId: viewId,
    setSelectedId: setViewId,
  } = useTableUrlState({ filters: URL_FILTERS, defaultTab: "approved" });
  const activeTab = rawTab as "approved" | "pending";
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

  const approvedOffers = approvedQuery.data ?? [];
  const pendingOffers = pendingQuery.data ?? [];
  const loading = approvedQuery.isLoading || pendingQuery.isLoading;

  const reload = () => {
    queryClient.invalidateQueries({ queryKey: ["offerings"] });
  };

  const baseOffers = activeTab === "approved" ? approvedOffers : pendingOffers;

  const offers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return baseOffers.filter((o) => {
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
  }, [baseOffers, typeFilter, searchQuery]);

  /* The page-reset effect that used to sit here is gone: the URL hook resets
     `?page=` inside setQ/setFilters/setTab. As an effect it also ran on MOUNT,
     which meant a deep link like `?q=camper&page=2` snapped back to page 1
     before the operator saw it. */

  const stats = useMemo(() => {
    const revenue = approvedOffers.reduce((sum, o) => sum + Number(o.regularPrice || 0), 0);
    return {
      approved: approvedOffers.length,
      pending: pendingOffers.length,
      revenue,
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
  /* Editing is its own page (/offering/:id/edit) — the old right-side
     OfferPanel duplicated a subset of the wizard's fields. */
  const onEdit = (offer: OfferDTO) => navigate(`/offering/${offer._id}/edit`);

  const tabs: { key: "approved" | "pending"; label: string; count: number }[] = [
    { key: "approved", label: "Approved", count: approvedOffers.length },
    { key: "pending", label: "Pending", count: pendingOffers.length },
  ];

  return (
    <>
      <DashboardLayout
        title="Offerings"
        subtitle="Every camper van, stay and activity listed under this account, in every state."
        headerActions={
          <Button onClick={() => navigate("/offering/add")} className={cn(BTN_PRIMARY, "h-9")}>
            <Plus size={15} strokeWidth={2.5} />
            Add offering
          </Button>
        }
      >
        {/* pb clears the fixed MobileVendorNav on small screens. */}
        <div style={BRAND_VARS} className="max-w-6xl mx-auto pb-24 lg:pb-12 space-y-5">
          {/* ── Metrics ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {loading ? (
              <>
                <StatTileSkeleton />
                <StatTileSkeleton />
                <StatTileSkeleton />
              </>
            ) : (
              <>
                <StatTile
                  icon={CheckCircle2}
                  label="Approved"
                  hint="Live listings"
                  value={stats.approved}
                  color="#22c55e"
                  index={0}
                />
                <StatTile
                  icon={Clock}
                  label="Pending"
                  hint="Awaiting review"
                  value={stats.pending}
                  color="#f59e0b"
                  index={1}
                />
                <StatTile
                  icon={IndianRupee}
                  label="Catalog value"
                  hint="Approved listings, per day"
                  value={currencyINR(stats.revenue)}
                  color="#117479"
                  index={2}
                />
              </>
            )}
          </div>

          {/* ── Toolbar: tabs, search, type, create ── */}
          <Panel>
            <PanelHead
              icon={Award}
              title="Your listings"
              blurb={
                loading
                  ? "Loading your catalog…"
                  : hasActiveQuery
                    ? `${offers.length} of ${baseOffers.length} ${activeTab} shown`
                    : `${offers.length} ${activeTab} listing${offers.length === 1 ? "" : "s"}`
              }
              /* The primary action moved up to the header band, where every
                 console page keeps its primary action. Two "Add offering"
                 buttons a few hundred pixels apart is worse than one. */
            />

            <div className="flex flex-col lg:flex-row lg:items-center gap-3 px-5 py-3">
              <div
                role="tablist"
                aria-label="Listing status"
                className="flex items-center gap-1 p-1 rounded-xl bg-muted/60 dark:bg-white/[0.04] w-fit shrink-0"
              >
                {tabs.map((t) => {
                  const active = activeTab === t.key;
                  return (
                    <button
                      key={t.key}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setActiveTab(t.key)}
                      className={cn(
                        "relative inline-flex items-center gap-1.5 h-8 px-3 rounded-lg",
                        "text-[12.5px] font-semibold outline-none transition-colors duration-150",
                        "focus-visible:ring-2 focus-visible:ring-brand/40",
                        active ? "text-brand" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="offeringTabPill"
                          className="absolute inset-0 rounded-lg bg-card shadow-[0_1px_2px_rgba(16,24,40,0.08)]"
                          transition={{ type: "spring", stiffness: 420, damping: 34 }}
                        />
                      )}
                      <span className="relative">{t.label}</span>
                      <span
                        className={cn(
                          "relative grid place-items-center min-w-[20px] h-[18px] px-1.5 rounded-full",
                          "text-[10.5px] font-bold tabular-nums",
                          active ? "bg-brand/15 text-brand" : "bg-muted-foreground/10",
                        )}
                      >
                        {t.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
                <div className="relative flex-1 min-w-[190px] lg:max-w-[280px]">
                  <Search
                    size={14}
                    strokeWidth={2.2}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70 pointer-events-none"
                  />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search name, category or city"
                    aria-label="Search listings"
                    className={cn("h-10 pl-9", CONTROL)}
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
              </div>
            </div>
          </Panel>

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
                    activeTab === "approved" ? "No approved listings yet" : "No pending listings"
                  }
                  description={
                    activeTab === "approved"
                      ? "Listings show up here once an admin approves them. Anything you submit sits under Pending until then."
                      : "New listings go into pending review first. Create one to get started."
                  }
                  actionLabel={
                    activeTab === "approved" ? "View pending listings" : "Create your first listing"
                  }
                  onAction={() =>
                    activeTab === "approved" ? setActiveTab("pending") : navigate("/offering/add")
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
          portalStyle={CONSOLE_PORTAL_VARS}
          position={{ index: viewIndex + 1, total: offers.length }}
          onPrev={viewIndex > 0 ? () => setViewId(offers[viewIndex - 1]._id ?? null) : undefined}
          onNext={
            viewIndex < offers.length - 1
              ? () => setViewId(offers[viewIndex + 1]._id ?? null)
              : undefined
          }
        />
      )}

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
