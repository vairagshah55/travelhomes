import React, { useEffect, useMemo, useState } from "react";
import {
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  PackageOpen,
  SearchX,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminLayout from "@/components/admin/AdminLayout";
import ViewDetailsPopup from "@/components/admin/ViewDetailsPopup";
import VendorDetailsPopup from "@/components/admin/VendorDetailsPopup";
import ManagementForm, { Offer as FormOffer } from "@/components/admin/ManagementForm";
import RejectReasonPopup from "@/components/admin/RejectReasonPopup";
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
import { useListings, type Offer } from "@/hooks/admin/useListings";
import { vendorService } from "@/services/api";
import { getImageUrl } from "@/lib/adminUtils";
import { formatINR } from "@/utils/formatCurrency";

/* ── Tab definitions ────────────────────────────────────────────────────── */
const TABS = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "deactivated", label: "Deactivated" },
];

/* ── Sort options (client-side) ─────────────────────────────────────────── */
const SORT_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "price-low-high", label: "Price: Low to High" },
  { value: "price-high-low", label: "Price: High to Low" },
  { value: "name-a-z", label: "Name: A-Z" },
];

const ITEMS_PER_PAGE = 10;

/* ── Component ──────────────────────────────────────────────────────────── */
const ManagementListing = () => {
  /* ── Tab / search / sort / filter / page state ── */
  const [activeTab, setActiveTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [filters, setFilters] = useState<ActiveFilters>({});
  const [currentPage, setCurrentPage] = useState(1);

  /* ── Modal state ── */
  const [showManagementForm, setShowManagementForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  // FormOffer is ManagementForm's Offer shape (required by initialData prop).
  const [selectedOffer, setSelectedOffer] = useState<FormOffer | null>(null);

  const [showViewDetails, setShowViewDetails] = useState(false);
  const [viewOffer, setViewOffer] = useState<Offer | null>(null);

  // Reject / cancel reason flow
  const [showRejectPopup, setShowRejectPopup] = useState(false);
  const [rejectOffer, setRejectOffer] = useState<Offer | null>(null);
  const [rejectAction, setRejectAction] = useState<"cancelled">("cancelled");

  // Delete confirmation (ConfirmModal replaces old ConfirmationDialog)
  const [confirm, setConfirm] = useState<{
    title: string;
    description?: string;
    variant: "danger" | "warning";
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);

  // Vendor details popup
  const [showVendorDetails, setShowVendorDetails] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<any | null>(null);
  const [isVendorLoading, setIsVendorLoading] = useState(false);
  const [vendorError, setVendorError] = useState<string | null>(null);

  /* ── Data ── */
  const { query, createListing, updateListing, setStatus, deleteListing } = useListings(activeTab);
  const offers = query.data ?? [];

  /* ── Reset page when tab / search / sort / filters change ── */
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, sortBy, filters]);

  /* ── Derived filter options from loaded data ── */
  const brandNameOptions = useMemo(() => {
    const set = new Set(offers.map((o) => o.name).filter(Boolean));
    return Array.from(set).map((v) => ({ value: v, label: v }));
  }, [offers]);

  const categoryOptions = useMemo(() => {
    const set = new Set(offers.map((o) => o.category).filter(Boolean));
    return Array.from(set).map((v) => ({ value: v as string, label: v as string }));
  }, [offers]);

  const locationOptions = useMemo(() => {
    const set = new Set(
      offers.map((o) => [o.city, o.locality, o.state].filter(Boolean).join(", ")).filter(Boolean),
    );
    return Array.from(set).map((v) => ({ value: v, label: v }));
  }, [offers]);

  const filterDefs: FilterDefinition[] = [
    {
      key: "brandName",
      label: "Brand Name",
      type: "select",
      options: brandNameOptions,
    },
    {
      key: "serviceName",
      label: "Service Name",
      type: "select",
      options: categoryOptions,
    },
    {
      key: "location",
      label: "Location",
      type: "select",
      options: locationOptions,
    },
  ];

  /* ── Client-side filter + sort ── */
  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let list = offers;

    // Search across name, category, vendorId, city, locality
    if (term) {
      list = list.filter((o) =>
        [o.name, o.title, o.category, o.vendorId, o.city, o.locality, o.state]
          .filter(Boolean)
          .some((val) => String(val).toLowerCase().includes(term)),
      );
    }

    // Filter: brand name matches listing name
    if (filters.brandName) {
      list = list.filter((o) => o.name?.toLowerCase() === String(filters.brandName).toLowerCase());
    }

    // Filter: service name = category
    if (filters.serviceName) {
      list = list.filter(
        (o) => o.category?.toLowerCase() === String(filters.serviceName).toLowerCase(),
      );
    }

    // Filter: location (city or locality contains value)
    if (filters.location) {
      const loc = String(filters.location).toLowerCase();
      list = list.filter((o) => {
        const combined = [o.city, o.locality, o.state].filter(Boolean).join(", ").toLowerCase();
        return combined.includes(loc);
      });
    }

    // Sort
    return [...list].sort((a, b) => {
      if (sortBy === "price-low-high") {
        return (Number(a.finalPrice) || 0) - (Number(b.finalPrice) || 0);
      }
      if (sortBy === "price-high-low") {
        return (Number(b.finalPrice) || 0) - (Number(a.finalPrice) || 0);
      }
      if (sortBy === "name-a-z") {
        return (a.name || "").localeCompare(b.name || "");
      }
      return 0;
    });
  }, [offers, searchTerm, sortBy, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );
  const hasActiveQuery = !!searchTerm.trim() || Object.keys(filters).length > 0;

  /* ── Handlers ── */

  // Vendor ID click → load vendor details popup
  const handleVendorClick = async (vendorId: string) => {
    if (!vendorId || vendorId === "-") return;
    try {
      setIsVendorLoading(true);
      setVendorError(null);
      setShowVendorDetails(true);
      setSelectedVendor({ vendorId });
      const res = await vendorService.getVendor(vendorId);
      setSelectedVendor(res?.data || res);
    } catch (e: any) {
      console.error("Failed to load vendor details", e);
      setVendorError(typeof e === "string" ? e : e.message || "Failed to load vendor details.");
    } finally {
      setIsVendorLoading(false);
    }
  };

  // View details popup
  const handleView = (offer: Offer) => {
    setViewOffer(offer);
    setShowViewDetails(true);
  };

  // Open ManagementForm for add
  const handleAddNew = () => {
    setSelectedOffer(null);
    setIsEditing(false);
    setShowManagementForm(true);
  };

  // Open ManagementForm for edit — map to ManagementForm's Offer shape.
  const handleEdit = (offer: Offer) => {
    const formData: FormOffer = {
      _id: offer._id,
      name: offer.name || "",
      category: offer.category || "",
      regularPrice: offer.regularPrice ?? "",
      finalPrice: offer.finalPrice ?? "",
      locality: offer.locality || "",
      city: offer.city || "",
      state: offer.state || "",
      pincode: offer.pincode || "",
      description: offer.description || "",
      features: offer.features || "",
      rules: offer.rules || "",
      priceIncludes: offer.priceIncludes || "",
      priceExcludes: offer.priceExcludes || "",
      seatingCapacity: offer.seatingCapacity ?? "",
      sleepingCapacity: offer.sleepingCapacity ?? "",
      timeDuration: offer.timeDuration || "",
      status: offer.status,
    };
    setSelectedOffer(formData);
    setIsEditing(true);
    setShowManagementForm(true);
  };

  // ManagementForm submit: create or update. Uses ManagementForm's Offer type.
  const handleFormSubmit = (data: Partial<FormOffer>) => {
    const idToUpdate = data._id || (isEditing && selectedOffer?._id);
    if (idToUpdate) {
      updateListing.mutate(
        { id: idToUpdate, payload: data as Record<string, unknown> },
        { onSuccess: () => setShowManagementForm(false) },
      );
    } else {
      createListing.mutate(data as Record<string, unknown>, {
        onSuccess: () => setShowManagementForm(false),
      });
    }
  };

  // Direct status change (approve / mark pending)
  const handleStatusChange = (offer: Offer, status: "pending" | "approved" | "cancelled") => {
    if (status === "cancelled") {
      // Route through RejectReasonPopup (cancel flow)
      setRejectOffer(offer);
      setRejectAction("cancelled");
      setShowRejectPopup(true);
      return;
    }
    setStatus.mutate({ id: offer._id, status });
  };

  // RejectReasonPopup submit
  const handleRejectSubmit = (reason: string) => {
    if (!rejectOffer) return;
    setStatus.mutate(
      { id: rejectOffer._id, status: rejectAction, reason },
      {
        onSuccess: () => {
          setShowRejectPopup(false);
          setRejectOffer(null);
        },
      },
    );
  };

  // Delete (only for cancelled/deactivated listings) — use ConfirmModal
  const askDelete = (offer: Offer) => {
    setConfirm({
      title: "Delete Listing",
      description: `Are you sure you want to delete "${offer.name}"? This action cannot be undone.`,
      variant: "danger",
      confirmLabel: "Delete",
      onConfirm: () => {
        deleteListing.mutate(offer._id);
        setConfirm(null);
      },
    });
  };

  /* ── Columns ── */
  const columns: ColumnDef<Offer>[] = [
    {
      key: "vendorId",
      header: "Vendor ID",
      cell: (o) => (
        <button
          onClick={() => handleVendorClick(o.vendorId || "")}
          className="font-semibold text-tpl-primary hover:underline"
        >
          {o.vendorId || "-"}
        </button>
      ),
    },
    {
      key: "name",
      header: "Name",
      cell: (o) => (
        <div className="flex items-center gap-3">
          {o.photos?.coverUrl ? (
            <img
              src={getImageUrl(o.photos.coverUrl as string)}
              alt="cover"
              className="w-10 h-10 rounded object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded bg-tpl-gray-3 dark:bg-white/10 flex-shrink-0" />
          )}
          <span className="font-medium text-tpl-dark dark:text-white text-sm">{o.name}</span>
        </div>
      ),
    },
    {
      key: "category",
      header: "Category",
      hideBelow: "md",
      cell: (o) => (
        <span className="text-tpl-dark-4 dark:text-tpl-dark-6">{o.category || "—"}</span>
      ),
    },
    {
      key: "regularPrice",
      header: "Price",
      hideBelow: "md",
      cell: (o) => (
        <span className="font-medium text-tpl-dark dark:text-white">
          {o.regularPrice != null ? formatINR(Number(o.regularPrice)) : "—"}
        </span>
      ),
    },
    {
      key: "location",
      header: "Location",
      hideBelow: "lg",
      cell: (o) => (
        <span className="text-tpl-dark-4 dark:text-tpl-dark-6 text-sm">
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

  /* ── Row actions — conditions mirror the original dropdown exactly ── */
  const rowActions: RowAction<Offer>[] = [
    {
      label: "View",
      icon: Eye,
      onClick: handleView,
    },
    {
      label: "Edit",
      icon: Edit,
      onClick: handleEdit,
    },
    {
      label: "Approve",
      icon: CheckCircle,
      onClick: (o) => handleStatusChange(o, "approved"),
      // Hidden when already approved
      hidden: (o) => o.status?.toLowerCase() === "approved",
    },
    {
      label: "Mark Pending",
      icon: Clock,
      onClick: (o) => handleStatusChange(o, "pending"),
      // Hidden when already pending
      hidden: (o) => o.status?.toLowerCase() === "pending",
    },
    {
      label: "Cancel",
      icon: XCircle,
      onClick: (o) => handleStatusChange(o, "cancelled"),
      // Hidden when already cancelled/deactivated
      hidden: (o) => o.status?.toLowerCase() === "cancelled",
    },
    {
      label: "Delete",
      icon: Trash2,
      onClick: askDelete,
      variant: "danger",
      // Visible ONLY when status is cancelled (deactivated)
      hidden: (o) => o.status?.toLowerCase() !== "cancelled",
    },
  ];

  /* ── Render ── */
  return (
    <AdminLayout title="Listing Management">
      <div className="bg-white dark:bg-tpl-dark-2 rounded-[10px] shadow-tpl-1 overflow-hidden">
        <div className="p-5 space-y-5">
          <TabStrip tabs={TABS} activeKey={activeTab} onChange={setActiveTab} />

          <AdminToolbar
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search listings…"
            sortOptions={SORT_OPTIONS}
            sortValue={sortBy}
            onSortChange={setSortBy}
            primaryAction={
              <Button
                onClick={handleAddNew}
                className="h-10 rounded-full bg-tpl-primary hover:bg-tpl-primary/90 text-black gap-2"
              >
                <Plus size={16} /> Add Listing
              </Button>
            }
          />

          <AdminFilterBar
            filters={filterDefs}
            activeFilters={filters}
            onApply={setFilters}
            onClear={() => setFilters({})}
          />

          <div className="border border-tpl-stroke dark:border-white/10 rounded-xl overflow-hidden">
            <AdminDataTable<Offer>
              columns={columns}
              data={paginated}
              isLoading={query.isLoading}
              isError={query.isError}
              errorMessage="Failed to load listings."
              onRetry={() => query.refetch()}
              hasActiveQuery={hasActiveQuery}
              emptyIcon={hasActiveQuery ? SearchX : PackageOpen}
              emptyTitle="No listings yet"
              emptyDescription="Listings appear here once vendors submit them for review."
              noResultsTitle={
                searchTerm ? `No results for "${searchTerm}"` : "No matching listings"
              }
              noResultsDescription="Try different keywords or remove filters."
              noResultsAction={{
                label: "Clear filters",
                onClick: () => {
                  setSearchTerm("");
                  setFilters({});
                },
              }}
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

      {/* ── Popups — props & flows preserved exactly from original ── */}

      <ViewDetailsPopup
        isOpen={showViewDetails}
        onClose={() => setShowViewDetails(false)}
        listingData={viewOffer}
        onApprove={
          viewOffer?.status !== "approved"
            ? () => {
                if (viewOffer) {
                  handleStatusChange(viewOffer, "approved");
                  setShowViewDetails(false);
                }
              }
            : undefined
        }
        onReject={
          viewOffer?.status !== "rejected" && viewOffer?.status !== "cancelled"
            ? () => {
                if (viewOffer) {
                  handleStatusChange(viewOffer, "cancelled");
                  setShowViewDetails(false);
                }
              }
            : undefined
        }
      />

      <ManagementForm
        isOpen={showManagementForm}
        onClose={() => setShowManagementForm(false)}
        onSubmit={handleFormSubmit}
        initialData={selectedOffer || undefined}
        isLoading={createListing.isPending || updateListing.isPending}
      />

      <RejectReasonPopup
        isOpen={showRejectPopup}
        onClose={() => {
          setShowRejectPopup(false);
          setRejectOffer(null);
        }}
        onSubmit={handleRejectSubmit}
        isLoading={setStatus.isPending}
      />

      <ConfirmModal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm?.onConfirm()}
        title={confirm?.title ?? ""}
        description={confirm?.description}
        confirmLabel={confirm?.confirmLabel}
        variant={confirm?.variant}
        isLoading={deleteListing.isPending}
      />

      <VendorDetailsPopup
        isOpen={showVendorDetails}
        onClose={() => {
          setShowVendorDetails(false);
          setSelectedVendor(null);
          setVendorError(null);
        }}
        vendor={selectedVendor}
        isLoading={isVendorLoading}
        error={vendorError}
      />
    </AdminLayout>
  );
};

export default ManagementListing;
