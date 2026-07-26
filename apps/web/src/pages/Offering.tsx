import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Award, Search, ChevronDown, CheckCircle2, Clock, IndianRupee } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { offersApi, type OfferDTO } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { CustomPagination } from "@/components/CustomPagination";
import UniqueStaysSkeleton from "@/utils/UniqueStaysSkeleton";
import { OfferingCard, OfferPanel } from "@/components/offering";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/shared";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ITEMS_PER_PAGE = 12;

/* ── Stats card ─────────────────────────────────────────────────────────── */
const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  hint?: string;
  accent?: string;
}> = ({ icon, label, value, hint, accent = "#0d9488" }) => (
  <div className="bg-th-surface-0 border border-th-warm-border rounded-[16px] px-4 py-3.5 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center gap-3">
    <div
      className="w-[38px] h-[38px] rounded-[11px] flex items-center justify-center flex-shrink-0 border-[1.5px]"
      style={{
        backgroundColor: `${accent}14`,
        borderColor: `${accent}30`,
      }}
    >
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[10.5px] font-bold text-th-warm-text-muted uppercase tracking-[0.04em] mb-[2px]">
        {label}
      </p>
      <p className="text-[18px] font-extrabold text-th-text-primary tracking-[-0.02em] leading-[1.1] whitespace-nowrap overflow-hidden text-ellipsis">
        {value}
      </p>
      {hint && <p className="text-[10.5px] text-th-warm-text-dark mt-[2px]">{hint}</p>}
    </div>
  </div>
);

/* ── Filter dropdown pill ──────────────────────────────────────────────── */
const FilterPill: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <button
        type="button"
        className="inline-flex items-center gap-2 h-[42px] px-3.5 rounded-[12px] border border-th-warm-border bg-th-surface-0 text-[13px] font-semibold text-th-text-primary cursor-pointer whitespace-nowrap"
      >
        {label}
        <ChevronDown size={14} className="text-th-warm-text-muted" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" className="w-48 p-1.5">
      {children}
    </DropdownMenuContent>
  </DropdownMenu>
);

const FILTER_ITEM_CLASS =
  "cursor-pointer rounded-md px-2.5 py-2 text-[13px] font-medium text-[#131313] " +
  "transition-colors " +
  "focus:bg-[rgba(13,148,136,0.10)] focus:text-[#0d9488] " +
  "data-[highlighted]:bg-[rgba(13,148,136,0.10)] data-[highlighted]:text-[#0d9488]";

const currencyINR = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

const Offering = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") as "approved" | "pending") || "approved";
  const [activeTab, setActiveTab] = useState<"approved" | "pending">(initialTab);
  const [page, setPage] = useState(1);
  const [showDropdown, setShowDropdown] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "camper-van" | "unique-stay" | "activity">(
    "all",
  );
  const { user, token: authToken } = useAuth();
  const queryClient = useQueryClient();
  const token = authToken ?? undefined;

  // Panel
  const [panelOpen, setPanelOpen] = useState(false);
  const [editing, setEditing] = useState<OfferDTO | null>(null);

  const [confirm, setConfirm] = useState<{
    title: string;
    description: string;
    variant: "danger" | "warning" | "info";
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setPage(1);
  }, [activeTab]);
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

  useEffect(() => {
    setPage(1);
  }, [searchQuery, typeFilter]);

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
          setShowDropdown(null);
        }
      },
    });
  };
  const onEdit = (offer: OfferDTO) => {
    setEditing(offer);
    setPanelOpen(true);
  };
  const onSaved = () => {
    reload();
    setPanelOpen(false);
  };

  const tabs: { key: "approved" | "pending"; label: string; count: number }[] = [
    { key: "approved", label: "Approved", count: approvedOffers.length },
    { key: "pending", label: "Pending", count: pendingOffers.length },
  ];

  return (
    <>
      <DashboardLayout
        title="Offerings"
        outerClassName="overflow-hidden"
        contentClassName="flex-1 flex flex-col overflow-hidden p-4 lg:p-5"
      >
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* ── Header ── */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5">
            <div>
              <h1 className="text-[22px] font-extrabold text-th-text-primary tracking-[-0.025em] leading-[1.2]">
                Offerings
              </h1>
              <p className="text-[13px] text-th-warm-text-muted mt-[3px]">Manage Properties</p>
            </div>
            <button
              type="button"
              onClick={() => navigate("/offering/add")}
              className="flex items-center gap-2 h-[42px] px-5 rounded-[13px] border-none bg-th-brand text-[13px] font-bold text-th-text-inverse cursor-pointer shadow-[0_4px_16px_rgba(13,148,136,0.30)] transition-all duration-150 w-fit"
            >
              <Plus size={16} strokeWidth={2.5} /> Add Offering
            </button>
          </div>

          {/* ── Stats cards ── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pb-4">
            <StatCard
              icon={<CheckCircle2 size={15} color="#22c55e" strokeWidth={2.2} />}
              label="Approved"
              value={String(stats.approved)}
              hint="Live listings"
              accent="#22c55e"
            />
            <StatCard
              icon={<Clock size={15} color="#f59e0b" strokeWidth={2.2} />}
              label="Pending"
              value={String(stats.pending)}
              hint="Awaiting review"
              accent="#f59e0b"
            />
            <StatCard
              icon={<IndianRupee size={15} className="text-th-brand" strokeWidth={2.2} />}
              label="Revenue"
              value={currencyINR(stats.revenue)}
              hint="Approved catalog value"
            />
          </div>

          {/* ── Filter row ── */}
          <div className="flex flex-wrap items-center gap-2.5 pb-4">
            <div
              className="flex items-center gap-2 h-[42px] px-3 rounded-[12px] border border-th-warm-border bg-th-surface-0"
              style={{ flex: "1 1 220px", minWidth: 200, maxWidth: 360 }}
            >
              <Search size={15} className="text-th-warm-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search property…"
                className="flex-1 h-full border-none outline-none text-[13px] text-th-text-primary bg-transparent font-[450]"
              />
            </div>
            <FilterPill
              label={
                typeFilter === "all"
                  ? "All Types"
                  : typeFilter === "camper-van"
                    ? "Camper Vans"
                    : typeFilter === "unique-stay"
                      ? "Unique Stays"
                      : "Activities"
              }
            >
              {(
                [
                  ["all", "All Types"],
                  ["camper-van", "Camper Vans"],
                  ["unique-stay", "Unique Stays"],
                  ["activity", "Activities"],
                ] as const
              ).map(([key, label]) => (
                <DropdownMenuItem
                  key={key}
                  className={FILTER_ITEM_CLASS}
                  onClick={() => setTypeFilter(key)}
                >
                  {label}
                </DropdownMenuItem>
              ))}
            </FilterPill>
          </div>

          {/* ── Status tabs ── */}
          <div className="flex gap-1 mb-4 w-fit">
            {tabs.map((t) => {
              const active = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveTab(t.key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-4 py-2 rounded-full border-[1.5px] text-[13px] font-bold cursor-pointer transition-all duration-150",
                    active
                      ? "border-th-brand-border-soft bg-th-brand-soft text-th-brand"
                      : "border-th-warm-border bg-th-surface-0 text-th-warm-text-dark",
                  )}
                >
                  {t.label}
                  <span
                    className={cn(
                      "text-[11px] font-bold px-[7px] py-[1px] rounded-full",
                      active
                        ? "bg-th-brand-soft text-th-brand"
                        : "bg-[#EBEBEB] text-th-warm-text-dark",
                    )}
                  >
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Grid ── */}
          <div
            className="flex-1 overflow-y-auto scrollbar-hide"
            onClick={() => setShowDropdown(null)}
          >
            {loading ? (
              <UniqueStaysSkeleton />
            ) : offers.length === 0 ? (
              hasActiveQuery ? (
                <EmptyState
                  icon={Award}
                  title="No offerings match your filters"
                  description="Try clearing the search or pick a different type."
                  actionLabel="Clear filters"
                  onAction={() => {
                    setSearchQuery("");
                    setTypeFilter("all");
                  }}
                  className="min-h-[400px]"
                />
              ) : (
                <EmptyState
                  icon={Award}
                  title={
                    activeTab === "approved" ? "No approved offerings yet" : "No pending offerings"
                  }
                  description={
                    activeTab === "approved"
                      ? "Once the admin approves your submitted offerings, they'll appear here."
                      : "Offerings you create go into pending review first. Create one to get started."
                  }
                  actionLabel={
                    activeTab === "approved"
                      ? "View pending offerings"
                      : "Create your first offering"
                  }
                  onAction={() =>
                    activeTab === "approved" ? setActiveTab("pending") : navigate("/offering/add")
                  }
                  className="min-h-[400px]"
                />
              )
            ) : (
              <>
                <div
                  key={activeTab}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pb-6"
                >
                  {paginated.map((listing) => (
                    <OfferingCard
                      key={listing._id}
                      listing={listing}
                      showDropdown={showDropdown}
                      onToggleDropdown={(id) => setShowDropdown(showDropdown === id ? null : id)}
                      onDelete={onDelete}
                      onEdit={onEdit}
                      onCardClick={(id) => navigate(`/offering/${id}`)}
                    />
                  ))}
                </div>
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
        </div>
      </DashboardLayout>
      <OfferPanel
        open={panelOpen}
        initial={editing}
        onOpenChange={setPanelOpen}
        onSaved={onSaved}
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
