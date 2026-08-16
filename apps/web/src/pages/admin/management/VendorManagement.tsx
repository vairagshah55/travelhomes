import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Eye, Ban, BadgeCheck, Clock, Trash2, Store, SearchX } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AdminLayout from "@/components/admin/AdminLayout";
import VendorDetailsPopup from "@/components/admin/VendorDetailsPopup";
import { TabStrip } from "@/components/shared/TabStrip";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import {
  AdminFilterBar,
  type FilterDefinition,
} from "@/components/admin/AdminFilterBar";
import { AdminDataTable, type ColumnDef, type RowAction } from "@/components/admin/AdminDataTable";
import { MotionReveal } from "@/components/admin/MotionReveal";
import { useVendors, type Vendor } from "@/hooks/admin/useVendors";
import { useFeatureAccess } from "@/hooks/admin/useFeatureAccess";
import { ADMIN_FEATURES } from "@/lib/adminPermissions";
import { vendorSchema, type VendorFormValues } from "./vendorSchema";
import { vendorService } from "@/services/api";
import { BTN_PRIMARY, CARD_FLUSH, STAT_GRID } from "@/components/admin/adminUI";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { useTableUrlState, type UrlFilterDef } from "@/components/admin/useTableUrlState";

const TABS = [
  { key: "all-vendors", label: "All Vendors" },
  { key: "pending-vendors", label: "Pending Vendors" },
  { key: "approved", label: "Approved" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
  { key: "banned", label: "Banned" },
  { key: "kyc-unverified", label: "KYC Unverified" },
];

const SORT_OPTIONS = [
  { value: "brandName", label: "Name" },
  { value: "createdAt", label: "Date" },
  { value: "location", label: "Location" },
];

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "banned", label: "Banned" },
];

const ITEMS_PER_PAGE = 10;

/* Query params this page owns — see the note in UserManagement for why these
   are declared at module scope rather than read off `filterDefs`. */
const URL_FILTERS: UrlFilterDef[] = [
  { key: "status", type: "select" },
  { key: "location", type: "select" },
  { key: "registered", type: "date-range" },
];

/* Metric row for the "All Vendors" tab, derived from the loaded list. */
const STAT_DEFS = [
  { key: "total", title: "Total Vendors", icon: Store, color: "#2563eb" },
  { key: "approved", title: "Approved", icon: BadgeCheck, color: "#12b76a" },
  { key: "pending", title: "Pending Approval", icon: Clock, color: "#f59e0b" },
  { key: "banned", title: "Banned", icon: Ban, color: "#f04438" },
] as const;

const VendorManagement = () => {
  // View on manage_vendors opens the page; create/edit/delete are separate
  // grants, so the write affordances are gated on their own flags.
  const access = useFeatureAccess(ADMIN_FEATURES.vendors);

  /* Tab, search, sort, page, filters and the open record live in the URL. */
  const {
    tab: activeTab,
    setTab: setActiveTab,
    q: searchTerm,
    setQ: setSearchTerm,
    sort: sortBy,
    setSort: setSortBy,
    page,
    setPage,
    filters,
    setFilters,
    selectedId,
    setSelectedId,
    hasActiveQuery,
    clearQuery,
  } = useTableUrlState({
    filters: URL_FILTERS,
    defaultTab: "all-vendors",
    defaultSort: "brandName",
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  /* The table row is a summary; the drawer shows the full record, which needs
     its own fetch. Keyed by id so a stale response for a vendor the operator
     has already stepped past is discarded rather than rendered. */
  const [vendorDetail, setVendorDetail] = useState<{ id: string; data: Vendor } | null>(null);
  const [isVendorLoading, setIsVendorLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  // Confirm state: a single configurable dialog drives ban / delete / bulk delete.
  const [confirm, setConfirm] = useState<{
    title: string;
    description: string;
    variant: "danger" | "warning";
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);

  const { query, createVendor, setStatus, deleteVendor } = useVendors(activeTab);
  const vendors = query.data ?? [];

  // The URL hook resets the page; a selection made against the previous list
  // still has to be dropped.
  useEffect(() => {
    setSelectedIds([]);
  }, [activeTab, searchTerm, sortBy, filters]);

  // Location filter options derived from the loaded vendors.
  const locationOptions = useMemo(() => {
    const set = new Set(vendors.map((v) => v.location).filter(Boolean));
    return Array.from(set).map((loc) => ({ value: loc, label: loc }));
  }, [vendors]);

  const counts = useMemo(() => {
    const by = (s: string) => vendors.filter((v) => v.status?.toLowerCase() === s).length;
    return {
      total: vendors.length,
      approved: by("approved"),
      pending: by("pending"),
      banned: by("banned"),
    };
  }, [vendors]);

  const filterDefs: FilterDefinition[] = [
    { key: "status", label: "Status", type: "select", options: STATUS_OPTIONS },
    { key: "location", label: "Location", type: "select", options: locationOptions },
    { key: "registered", label: "Registered", type: "date-range" },
  ];

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let list = vendors;

    if (term) {
      list = list.filter((v) =>
        [v.brandName, v.personName, v.location, v.vendorId]
          .filter(Boolean)
          .some((val) => String(val).toLowerCase().includes(term)),
      );
    }

    if (filters.status)
      list = list.filter((v) => v.status?.toLowerCase() === String(filters.status).toLowerCase());
    if (filters.location)
      list = list.filter(
        (v) => v.location?.toLowerCase() === String(filters.location).toLowerCase(),
      );
    if (Array.isArray(filters.registered)) {
      const [from, to] = filters.registered;
      if (from) {
        const f = new Date(from).getTime();
        list = list.filter((v) => (v.createdAt ? new Date(v.createdAt).getTime() >= f : false));
      }
      if (to) {
        const t = new Date(to).getTime() + 86_400_000;
        list = list.filter((v) => (v.createdAt ? new Date(v.createdAt).getTime() < t : false));
      }
    }

    const key = sortBy as keyof Vendor;
    return [...list].sort((a, b) => {
      const av = String(a[key] ?? "").toLowerCase();
      const bv = String(b[key] ?? "").toLowerCase();
      return av < bv ? -1 : av > bv ? 1 : 0;
    });
  }, [vendors, searchTerm, sortBy, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  // A `?page=` carried over from a longer list can outrun a narrower one.
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  /* Drawer position within the whole filtered set — `?id=` is the source of
     truth, the index is derived from it. */
  const detailsIndex = selectedId ? filtered.findIndex((v) => v._id === selectedId) : -1;
  const detailsRow = detailsIndex >= 0 ? filtered[detailsIndex] : null;

  /* Same request as before, moved behind the id so prev/next re-fetch too. The
     row already in hand seeds the drawer, so the header renders immediately and
     only the body waits. */
  useEffect(() => {
    if (!detailsRow) return;
    let cancelled = false;
    setIsVendorLoading(true);
    vendorService
      .getVendor(detailsRow._id || detailsRow.vendorId)
      .then((res: any) => {
        if (!cancelled) setVendorDetail({ id: detailsRow._id, data: res?.data || res || detailsRow });
      })
      .catch(() => {
        if (!cancelled) setVendorDetail({ id: detailsRow._id, data: detailsRow });
      })
      .finally(() => {
        if (!cancelled) setIsVendorLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [detailsRow?._id, detailsRow?.vendorId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleView = (vendor: Vendor) => setSelectedId(vendor._id);

  const askBan = (vendor: Vendor) =>
    setConfirm({
      title: `Ban "${vendor.brandName}"?`,
      description:
        "They will immediately lose platform access and all their listings will be suspended.",
      variant: "warning",
      confirmLabel: "Ban vendor",
      onConfirm: () => {
        setStatus.mutate({ id: vendor._id, status: "banned" });
        setConfirm(null);
      },
    });

  const askDelete = (vendor: Vendor) =>
    setConfirm({
      title: "Delete vendor?",
      description: `"${vendor.brandName}" and all associated data will be permanently removed. This cannot be undone.`,
      variant: "danger",
      confirmLabel: "Delete",
      onConfirm: () => {
        deleteVendor.mutate(vendor._id);
        setConfirm(null);
      },
    });

  const askBulkDelete = () =>
    setConfirm({
      title: `Delete ${selectedIds.length} vendor${selectedIds.length > 1 ? "s" : ""}?`,
      description:
        "The selected vendors and all associated data will be permanently removed. This cannot be undone.",
      variant: "danger",
      confirmLabel: "Delete all",
      onConfirm: async () => {
        setConfirm(null);
        await Promise.allSettled(selectedIds.map((id) => deleteVendor.mutateAsync(id)));
        setSelectedIds([]);
      },
    });

  const columns: ColumnDef<Vendor>[] = [
    {
      key: "vendorId",
      // The whole row opens the drawer, so the identifier is plain text: a link
      // inside a clickable row is two targets for one destination.
      header: "Vendor ID",
      cell: (v) => <span className="font-semibold text-app-fg">{v.vendorId}</span>,
    },
    {
      key: "photo",
      header: "Photo",
      hideBelow: "md",
      cell: (v) => (
        <Avatar className="w-10 h-10">
          <AvatarImage src={v.photo} />
          <AvatarFallback>{v.personName?.charAt(0)}</AvatarFallback>
        </Avatar>
      ),
    },
    {
      key: "brandName",
      header: "Brand Name",
      cell: (v) => <span className="text-tpl-dark-4 dark:text-tpl-dark-6">{v.brandName}</span>,
    },
    {
      key: "personName",
      header: "Person Name",
      hideBelow: "lg",
      cell: (v) => <span className="text-tpl-dark-4 dark:text-tpl-dark-6">{v.personName}</span>,
    },
    {
      key: "listedServices",
      header: "Services",
      hideBelow: "lg",
      align: "center",
      cell: (v) => (
        <span className="text-tpl-dark-4 dark:text-tpl-dark-6">{v.listedServices ?? 0}</span>
      ),
    },
    {
      key: "location",
      header: "Location",
      hideBelow: "md",
      cell: (v) => <span className="text-tpl-dark-4 dark:text-tpl-dark-6">{v.location}</span>,
    },
    { key: "status", header: "Status", cell: (v) => <StatusBadge status={v.status} /> },
  ];

  const rowActions: RowAction<Vendor>[] = [
    { label: "View", icon: Eye, onClick: handleView },
    ...(access.canEdit
      ? [
          {
            label: "Ban",
            icon: Ban,
            onClick: askBan,
            hidden: (v: Vendor) => v.status?.toLowerCase() === "banned",
          },
        ]
      : []),
    ...(access.canDelete
      ? [{ label: "Delete", icon: Trash2, onClick: askDelete, variant: "danger" as const }]
      : []),
  ];

  return (
    <AdminLayout
      title="Vendor Management"
      subtitle="Partners who list on TravelHomes — approve applications, track KYC and manage account status."
      tabs={<TabStrip variant="flush" tabs={TABS} activeKey={activeTab} onChange={setActiveTab} />}
      headerActions={
        access.canCreate ? (
          <button onClick={() => setShowAddModal(true)} className={BTN_PRIMARY}>
            <Plus size={16} /> Add Vendor
          </button>
        ) : undefined
      }
    >
      {/* Counts describe the whole vendor list, so they're only shown on the
          unfiltered tab — see the same note in UserManagement. */}
      {activeTab === "all-vendors" && (
        <div className={`${STAT_GRID} mb-5 md:mb-6`}>
          {STAT_DEFS.map((stat, i) => (
            <AdminStatCard
              key={stat.title}
              title={stat.title}
              value={String(counts[stat.key])}
              icon={stat.icon}
              iconColor={stat.color}
              delay={i * 0.05}
            />
          ))}
        </div>
      )}

      <MotionReveal delay={0}>
        <div className={CARD_FLUSH}>
          <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 border-b border-app-border">
            <AdminToolbar
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              searchPlaceholder="Search vendors…"
              sortOptions={SORT_OPTIONS}
              sortValue={sortBy}
              onSortChange={setSortBy}
              selectedCount={selectedIds.length}
              bulkActions={
                access.canDelete
                  ? [{ label: "Delete", icon: Trash2, variant: "danger", onClick: askBulkDelete }]
                  : []
              }
              onClearSelection={() => setSelectedIds([])}
              filterSlot={
                <AdminFilterBar
                  filters={filterDefs}
                  activeFilters={filters}
                  onApply={setFilters}
                  onClear={() => setFilters({})}
                />
              }
            />
          </div>

          <AdminDataTable<Vendor>
            columns={columns}
            data={paginated}
            isLoading={query.isLoading}
            isError={query.isError}
            errorMessage="Failed to load vendors."
            onRetry={() => query.refetch()}
            hasActiveQuery={hasActiveQuery}
            emptyIcon={hasActiveQuery ? SearchX : Store}
            emptyTitle="No vendors yet"
            emptyDescription="Vendors appear here once they register and submit for verification."
            noResultsTitle={searchTerm ? `No results for "${searchTerm}"` : "No matching vendors"}
            noResultsDescription="Try different keywords or remove filters."
            noResultsAction={{ label: "Clear filters", onClick: clearQuery }}
            selectable={access.canDelete}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            rowActions={rowActions}
            onRowClick={handleView}
            pagination={{
              currentPage,
              totalPages,
              pageSize: ITEMS_PER_PAGE,
              totalItems: filtered.length,
              onPageChange: setPage,
            }}
          />
        </div>
      </MotionReveal>

      {detailsRow && (
        <VendorDetailsPopup
          isOpen
          onClose={() => setSelectedId(null)}
          /* Seeded with the row until the full record arrives, so the header
             and status are correct from the first frame. */
          vendor={vendorDetail?.id === detailsRow._id ? vendorDetail.data : detailsRow}
          isLoading={isVendorLoading && vendorDetail?.id !== detailsRow._id}
          position={{ index: detailsIndex + 1, total: filtered.length }}
          onPrev={
            detailsIndex > 0 ? () => setSelectedId(filtered[detailsIndex - 1]._id) : undefined
          }
          onNext={
            detailsIndex < filtered.length - 1
              ? () => setSelectedId(filtered[detailsIndex + 1]._id)
              : undefined
          }
        />
      )}

      <AddVendorDialog
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        isSaving={createVendor.isPending}
        onSubmit={(values) =>
          createVendor.mutate(
            {
              vendorId: values.vendorId || `V-${Date.now()}`,
              photo: values.photo || "",
              brandName: values.brandName,
              personName: values.personName,
              listedServices: values.listedServices,
              location: values.location,
              status: "pending",
            },
            { onSuccess: () => setShowAddModal(false) },
          )
        }
      />

      <ConfirmModal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm?.onConfirm()}
        title={confirm?.title ?? ""}
        description={confirm?.description}
        confirmLabel={confirm?.confirmLabel}
        variant={confirm?.variant}
        isLoading={deleteVendor.isPending || setStatus.isPending}
      />
    </AdminLayout>
  );
};

/* ── Add Vendor dialog — shadcn Dialog + react-hook-form + zod ───────────── */
function AddVendorDialog({
  open,
  onClose,
  onSubmit,
  isSaving,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: VendorFormValues) => void;
  isSaving: boolean;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VendorFormValues>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      brandName: "",
      personName: "",
      location: "",
      vendorId: "",
      photo: "",
      listedServices: 0,
    },
  });

  useEffect(() => {
    if (open) reset();
  }, [open, reset]);

  const field = "text-[12px] font-semibold text-tpl-dark-5 dark:text-tpl-dark-6";
  const err = "text-[12px] text-tpl-red mt-1";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Vendor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <label className={field}>Brand Name *</label>
            <Input {...register("brandName")} placeholder="Brand name" disabled={isSaving} />
            {errors.brandName && <p className={err}>{errors.brandName.message}</p>}
          </div>
          <div>
            <label className={field}>Person Name *</label>
            <Input {...register("personName")} placeholder="Person name" disabled={isSaving} />
            {errors.personName && <p className={err}>{errors.personName.message}</p>}
          </div>
          <div>
            <label className={field}>Location *</label>
            <Input {...register("location")} placeholder="Location" disabled={isSaving} />
            {errors.location && <p className={err}>{errors.location.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={field}>Vendor ID</label>
              <Input {...register("vendorId")} placeholder="Auto" disabled={isSaving} />
            </div>
            <div>
              <label className={field}>Listed Services</label>
              <Input type="number" {...register("listedServices")} disabled={isSaving} />
              {errors.listedServices && <p className={err}>{errors.listedServices.message}</p>}
            </div>
          </div>
          <div>
            <label className={field}>Photo URL</label>
            <Input {...register("photo")} placeholder="https://…" disabled={isSaving} />
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving} className={BTN_PRIMARY}>
              {isSaving ? "Saving…" : "Save Vendor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default VendorManagement;
