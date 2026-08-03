import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Eye, Ban, Trash2, Store, SearchX } from "lucide-react";
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
  type ActiveFilters,
  type FilterDefinition,
} from "@/components/admin/AdminFilterBar";
import { AdminDataTable, type ColumnDef, type RowAction } from "@/components/admin/AdminDataTable";
import { MotionReveal } from "@/components/admin/MotionReveal";
import { useVendors, type Vendor } from "@/hooks/admin/useVendors";
import { useFeatureAccess } from "@/hooks/admin/useFeatureAccess";
import { ADMIN_FEATURES } from "@/lib/adminPermissions";
import { vendorSchema, type VendorFormValues } from "./vendorSchema";
import { vendorService } from "@/services/api";

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

const VendorManagement = () => {
  // View on manage_vendors opens the page; create/edit/delete are separate
  // grants, so the write affordances are gated on their own flags.
  const access = useFeatureAccess(ADMIN_FEATURES.vendors);
  const [activeTab, setActiveTab] = useState("all-vendors");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("brandName");
  const [filters, setFilters] = useState<ActiveFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [showVendorDetails, setShowVendorDetails] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
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

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [activeTab, searchTerm, sortBy, filters]);

  // Location filter options derived from the loaded vendors.
  const locationOptions = useMemo(() => {
    const set = new Set(vendors.map((v) => v.location).filter(Boolean));
    return Array.from(set).map((loc) => ({ value: loc, label: loc }));
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

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );
  const hasActiveQuery = !!searchTerm.trim() || Object.keys(filters).length > 0;

  const handleView = async (vendor: Vendor) => {
    try {
      const res = await vendorService.getVendor(vendor._id || vendor.vendorId);
      setSelectedVendor(res?.data || res || vendor);
    } catch {
      setSelectedVendor(vendor);
    }
    setShowVendorDetails(true);
  };

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
      header: "Vendor ID",
      cell: (v) => (
        <button
          onClick={() => handleView(v)}
          className="font-semibold text-tpl-primary hover:underline"
        >
          {v.vendorId}
        </button>
      ),
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
    <AdminLayout title="Vendor Management">
      <MotionReveal delay={0}>
        <div className="bg-app-surface rounded-[18px] border border-app-border shadow-[0_1px_2px_rgba(16,24,40,0.04),0_10px_28px_-14px_rgba(16,24,40,0.16)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.35),0_12px_32px_-16px_rgba(0,0,0,0.55)] overflow-hidden">
          <div className="p-5 space-y-5">
            <TabStrip tabs={TABS} activeKey={activeTab} onChange={setActiveTab} />

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
              primaryAction={
                access.canCreate ? (
                  <Button
                    onClick={() => setShowAddModal(true)}
                    className="h-10 rounded-full bg-tpl-primary hover:bg-tpl-primary/90 text-white gap-2"
                  >
                    <Plus size={16} /> Add Vendor
                  </Button>
                ) : undefined
              }
            />

            <AdminFilterBar
              filters={filterDefs}
              activeFilters={filters}
              onApply={setFilters}
              onClear={() => setFilters({})}
            />

            <div className="border border-tpl-stroke dark:border-white/10 rounded-xl overflow-hidden">
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
                noResultsTitle={
                  searchTerm ? `No results for "${searchTerm}"` : "No matching vendors"
                }
                noResultsDescription="Try different keywords or remove filters."
                noResultsAction={{
                  label: "Clear filters",
                  onClick: () => {
                    setSearchTerm("");
                    setFilters({});
                  },
                }}
                selectable={access.canDelete}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                rowActions={rowActions}
                pagination={{
                  currentPage,
                  totalPages,
                  totalItems: filtered.length,
                  onPageChange: setCurrentPage,
                }}
              />
            </div>
          </div>
        </div>
      </MotionReveal>

      <VendorDetailsPopup
        isOpen={showVendorDetails}
        onClose={() => setShowVendorDetails(false)}
        vendor={selectedVendor}
      />

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
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-tpl-primary hover:bg-tpl-primary/90 text-white"
            >
              {isSaving ? "Saving…" : "Save Vendor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default VendorManagement;
