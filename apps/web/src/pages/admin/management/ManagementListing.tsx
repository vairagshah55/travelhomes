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
  Loader2,
  Image as ImageIcon,
  IndianRupee,
  Layers,
  RefreshCw,
  ShieldAlert,
  Store,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import ViewDetailsPopup from "@/components/admin/ViewDetailsPopup";
import VendorDetailsPopup from "@/components/admin/VendorDetailsPopup";
import ManagementForm, { Offer as FormOffer } from "@/components/admin/ManagementForm";
import { pickSubmissionDetails } from "@/lib/listingSubmission";
import { SERVICE_TYPES, serviceTypeLabel, serviceTypeOf } from "@/lib/listingKind";
import RejectReasonPopup from "@/components/admin/RejectReasonPopup";
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
import { useListings, type Offer } from "@/hooks/admin/useListings";
import { useVendorDirectory } from "@/hooks/admin/useVendors";
import { useFeatureAccess } from "@/hooks/admin/useFeatureAccess";
import { ADMIN_FEATURES } from "@/lib/adminPermissions";
import { vendorService, offersService, listingSubmissionService } from "@/services/api";
import { toast } from "sonner";
import { getImageUrl } from "@/lib/adminUtils";
import { formatINR } from "@/utils/formatCurrency";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import {
  ComplianceBadge,
  ComplianceRenewDialog,
  type CompliancePayload,
} from "@/components/compliance";
import { evaluateCompliance } from "@/lib/vehicleCompliance";
import { BTN_NEUTRAL, BTN_PRIMARY, CARD_FLUSH, STAT_GRID } from "@/components/admin/adminUI";
import { useTableUrlState, type UrlFilterDef } from "@/components/admin/useTableUrlState";

/* ── Tab definitions ────────────────────────────────────────────────────── */
const TABS = [
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "deactivated", label: "Deactivated" },
  /* Vehicles pulled off the catalog by the expiry sweep. Its own tab rather
     than a filter on Deactivated: that tab maps to the API's `cancelled`,
     while a compliance hold writes `deactivated`, so held listings would
     otherwise be reachable from no tab at all. */
  { key: "compliance", label: "Compliance hold" },
];

/* ── Sort options (client-side) ─────────────────────────────────────────── */
const SORT_OPTIONS = [
  { value: "default", label: "Default" },
  { value: "price-low-high", label: "Price: Low to High" },
  { value: "price-high-low", label: "Price: High to Low" },
  { value: "name-a-z", label: "Name: A-Z" },
];

const ITEMS_PER_PAGE = 10;

/* Key for listings `serviceTypeOf` returns null for. Not a ServiceType, so it
   cannot collide with one. */
const UNCLASSIFIED = "unclassified";

/* Query params this page owns. Module scope, because useTableUrlState needs the
   key/type pairs before `filterDefs` — whose options are derived from the
   loaded listings — can be built. */
const URL_FILTERS: UrlFilterDef[] = [
  /* The service-type strip under the toolbar. It is a filter as far as the URL
     is concerned — so it survives a refresh and travels in a shared link — but
     it is deliberately kept OUT of `filterDefs` below, or it would appear a
     second time inside the filter dropdown. */
  { key: "kind", type: "select" },
  { key: "vendor", type: "select" },
  { key: "brandName", type: "select" },
  { key: "serviceName", type: "select" },
  { key: "location", type: "select" },
];

/* Metric row. Each figure is computed from the listings already fetched for
   the active tab — deriving them costs nothing and, unlike a second endpoint,
   can never disagree with the table underneath it. */
const STAT_DEFS = [
  { key: "listings", title: "Listings", icon: PackageOpen, color: "#2563eb" },
  { key: "vendors", title: "Vendors", icon: Store, color: "#7c3aed" },
  { key: "categories", title: "Categories", icon: Layers, color: "#0891b2" },
  { key: "avgPrice", title: "Avg price", icon: IndianRupee, color: "#059669" },
] as const;

/* ── Component ──────────────────────────────────────────────────────────── */
const ManagementListing = () => {
  /* Approve / Mark Pending / Cancel are all PUTs on the listing, so they ride
     on canEdit; only Delete needs canDelete. */
  const access = useFeatureAccess(ADMIN_FEATURES.inventory);

  /* ── Tab / search / sort / filter / page / open-record state, in the URL ──
     A review queue is the case that most needs this: "the listing I'm asking
     you about" is now a link, and a refresh after an approve keeps the tab,
     the filters and the page it happened on. */
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
    defaultTab: "pending",
    defaultSort: "default",
  });

  /* ── Modal state ── */
  const [showManagementForm, setShowManagementForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  // FormOffer is ManagementForm's Offer shape (required by initialData prop).
  const [selectedOffer, setSelectedOffer] = useState<FormOffer | null>(null);

  /* The full listing, fetched per record — the table row is a summary that
     omits most detail fields. Keyed by id so a response that arrives after the
     operator has stepped on is discarded rather than rendered. */
  const [viewDetail, setViewDetail] = useState<{ id: string; data: Offer } | null>(null);
  const [isViewLoading, setIsViewLoading] = useState(false);

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

  // Compliance-document renewal (vehicle listings only)
  const [renewTarget, setRenewTarget] = useState<Offer | null>(null);

  // Vendor details popup
  const [showVendorDetails, setShowVendorDetails] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<any | null>(null);
  const [isVendorLoading, setIsVendorLoading] = useState(false);
  const [vendorError, setVendorError] = useState<string | null>(null);

  /* ── Data ── */
  const { query, createListing, updateListing, setStatus, renewCompliance, deleteListing } =
    useListings(activeTab);
  const offers = query.data ?? [];

  /* Listings only carry the vendor's `vendorId` code, so resolve names through
   * the vendor directory for the Vendor column, the Vendor filter and search. */
  const { nameFor: vendorNameFor } = useVendorDirectory();

  /* ── In-flight row mutations ──
   * Approve / Mark Pending / Cancel / Delete all resolve over the network and
   * only repaint once the invalidated query refetches. Derive the affected id
   * straight from the mutation so the row can show that it's working and
   * refuse a second click. `variables` survives after settling, so it's only
   * meaningful while `isPending`. */
  const statusPendingId = setStatus.isPending ? setStatus.variables?.id : undefined;
  const statusPendingTo = setStatus.isPending ? setStatus.variables?.status : undefined;
  const deletePendingId = deleteListing.isPending ? deleteListing.variables : undefined;

  const isRowBusy = (o: Offer) => o._id === statusPendingId || o._id === deletePendingId;
  const isStatusPending = (o: Offer, status: "pending" | "approved" | "cancelled") =>
    o._id === statusPendingId && statusPendingTo === status;

  /* ── Derived filter options from loaded data ── */
  const brandNameOptions = useMemo(() => {
    const set = new Set(offers.map((o) => o.name).filter(Boolean));
    return Array.from(set).map((v) => ({ value: v, label: v }));
  }, [offers]);

  const categoryOptions = useMemo(() => {
    const set = new Set(offers.map((o) => o.category).filter(Boolean));
    return Array.from(set).map((v) => ({ value: v as string, label: v as string }));
  }, [offers]);

  /* Only the vendors that actually own a listing in this tab — a dropdown of
   * every vendor would mostly be dead options. Value stays the vendorId code
   * (what the listing carries); the label is the resolved name. */
  const vendorOptions = useMemo(() => {
    const ids = Array.from(new Set(offers.map((o) => o.vendorId).filter(Boolean) as string[]));
    return ids
      .map((id) => {
        const name = vendorNameFor(id);
        return { value: id, label: name ? `${name} (${id})` : id };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [offers, vendorNameFor]);

  const locationOptions = useMemo(() => {
    const set = new Set(
      offers.map((o) => [o.city, o.locality, o.state].filter(Boolean).join(", ")).filter(Boolean),
    );
    return Array.from(set).map((v) => ({ value: v, label: v }));
  }, [offers]);

  const activeTabLabel = TABS.find((t) => t.key === activeTab)?.label ?? "All";

  /* ── Service type ──
     A second strip inside every status tab: All · Unique Stay · Camper Van ·
     Activity · Vehicle Rental. It rides in the URL as a filter (see
     URL_FILTERS) but reads as navigation, because a reviewer works one kind of
     listing at a time — a vehicle is approved against its insurance dates, a
     stay against its rooms and photos, and the two were interleaved before. */
  const activeKind = String(filters.kind || "all");
  const setKind = (key: string) =>
    setFilters({ ...filters, kind: key === "all" ? "" : key });
  const activeKindLabel =
    activeKind === "all"
      ? ""
      : activeKind === UNCLASSIFIED
        ? "Unclassified"
        : serviceTypeLabel(activeKind);

  /* The scope the metric row describes: the status tab narrowed by the service
     strip. Search and the filter dropdown are deliberately NOT applied — those
     are transient ways of finding a row, not a change of what you're looking
     at, and a stat that moved on every keystroke would be unreadable. */
  const scoped = useMemo(
    () =>
      activeKind === "all"
        ? offers
        : offers.filter((o) => (serviceTypeOf(o as any) ?? UNCLASSIFIED) === activeKind),
    [offers, activeKind],
  );

  /* Metric-row figures, all derived from the listings already loaded. */
  const stats = useMemo(() => {
    const priced = scoped
      .map((o) => Number(o.regularPrice))
      .filter((n) => Number.isFinite(n) && n > 0);
    const avg = priced.length
      ? Math.round(priced.reduce((sum, n) => sum + n, 0) / priced.length)
      : 0;
    return {
      listings: String(scoped.length),
      vendors: String(new Set(scoped.map((o) => o.vendorId).filter(Boolean)).size),
      categories: String(new Set(scoped.map((o) => o.category).filter(Boolean)).size),
      // A formatted string, so AdminStatCard renders it as-is instead of
      // count-up animating a rupee figure digit by digit.
      avgPrice: avg ? formatINR(avg) : "—",
    };
  }, [scoped]);

  const filterDefs: FilterDefinition[] = [
    {
      key: "vendor",
      label: "Vendor",
      type: "select",
      options: vendorOptions,
    },
    {
      // Filters on the listing's own `name`. Labelled "Brand Name" before, which
      // collided with the vendor's brandName now that Vendor is its own filter.
      key: "brandName",
      label: "Listing Name",
      type: "select",
      options: brandNameOptions,
    },
    {
      key: "serviceName",
      label: "Category",
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

  /* ── Client-side filter + sort ──
     Split in two around the service-type strip: everything else narrows the
     list first, the strip counts what each type would show at that point, and
     only then does the chosen type narrow it further. Counting before the
     search would promise rows a click can't deliver. */
  const beforeKind = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let list = offers;

    // Search across name, category, vendor (name + id), city, locality
    if (term) {
      list = list.filter((o) =>
        [
          o.name,
          o.title,
          o.category,
          o.vendorId,
          vendorNameFor(o.vendorId),
          o.city,
          o.locality,
          o.state,
        ]
          .filter(Boolean)
          .some((val) => String(val).toLowerCase().includes(term)),
      );
    }

    // Filter: vendor — matched on the vendorId code the listing stores
    if (filters.vendor) {
      list = list.filter((o) => String(o.vendorId || "") === String(filters.vendor));
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

    return list;
  }, [offers, searchTerm, filters, vendorNameFor]);

  /* `serviceTypeOf` rather than a `serviceType ===` compare: most of the real
     taxonomy is names like "Havelis" and "Tempo Traveller", and listings typed
     straight into the admin form never got a serviceType stamped at all. It
     falls back to reading the category, so those rows land in a tab instead of
     nowhere. See lib/listingKind. */
  const kindOf = (o: Offer) => serviceTypeOf(o as any);

  const kindCounts = useMemo(() => {
    const counts: Record<string, number> = { all: beforeKind.length };
    beforeKind.forEach((o) => {
      // `null` is its own bucket, not a row to quietly drop — see UNCLASSIFIED.
      const k = kindOf(o) ?? UNCLASSIFIED;
      counts[k] = (counts[k] ?? 0) + 1;
    });
    return counts;
  }, [beforeKind]);

  /* Every service type, every tab, zero counts included. An empty type is an
     answer — "nothing of this kind is waiting" — and the strip has to be there
     on a tab with no rows at all, which is where this page opens: the default
     tab is Pending, and a queue that has just been worked through is empty. */
  const kindTabs = useMemo(
    () => [
      { key: "all", label: "All", count: kindCounts.all ?? 0 },
      ...SERVICE_TYPES.map((t) => ({
        key: t.value,
        label: t.label,
        count: kindCounts[t.value] ?? 0,
      })),
      /* Listings `serviceTypeOf` cannot place — no stored serviceType and a
         category none of its keywords match ("Cave", "Budget Camper"). Shown
         only when there are some, for the same reason Compliance hold is its
         own tab: without it those rows belong to no type and the counts across
         the strip quietly fail to add up to All. */
      ...(kindCounts[UNCLASSIFIED] || activeKind === UNCLASSIFIED
        ? [
            {
              key: UNCLASSIFIED,
              label: "Unclassified",
              count: kindCounts[UNCLASSIFIED] ?? 0,
            },
          ]
        : []),
    ],
    [kindCounts, activeKind],
  );

  const filtered = useMemo(() => {
    const list =
      activeKind === "all"
        ? beforeKind
        : beforeKind.filter((o) => (kindOf(o) ?? UNCLASSIFIED) === activeKind);

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
  }, [beforeKind, activeKind, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  // A `?page=` carried over from a longer list can outrun a narrower one.
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  /* Drawer position within the whole filtered set — `?id=` is the source of
     truth and the index is derived from it, so prev/next walk the review queue
     without closing and a listing that leaves the tab (because it was just
     approved) closes the drawer instead of going stale. */
  const viewIndex = selectedId ? filtered.findIndex((o) => o._id === selectedId) : -1;
  const viewRow = viewIndex >= 0 ? filtered[viewIndex] : null;
  const viewOffer: Offer | null = viewRow
    ? viewDetail?.id === viewRow._id
      ? { ...viewRow, ...viewDetail.data }
      : viewRow
    : null;

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

  // Opening a listing is just setting `?id=` — the fetch below follows from it,
  // which is what lets prev/next inside the drawer load each record too.
  const handleView = (offer: Offer) => setSelectedId(offer._id);

  /* The table rows are summaries that omit most detail fields, so the FULL
     listing is fetched by id (same `offersService.get` call as before, moved
     behind the selection) and every section — business/personal details, rules,
     includes/excludes, gallery, capacity — is populated. The summary row seeds
     the drawer meanwhile, so its header is right from the first frame.

     The onboarding submission is fetched with it. Business details, personal /
     KYC details and the registration-certificate photos are NOT fields on
     `Offer` — they only exist on the submission — so those three sections of
     the drawer could never render and sat dead on every listing. Only the
     fields that exist nowhere else are merged (see pickSubmissionDetails);
     merging the whole document would put the submission's own name, status,
     photos and category over the listing's. */
  useEffect(() => {
    if (!viewRow) return;
    const id = viewRow._id;
    let cancelled = false;
    setIsViewLoading(true);
    offersService
      .get(id)
      .then(async (res: any) => {
        const full = res?.data ?? res;
        if (cancelled || !full) return;
        const submission = await listingSubmissionService.get(full.sourceModel, full.sourceId);
        if (cancelled) return;
        setViewDetail({ id, data: { ...full, ...pickSubmissionDetails(submission) } });
      })
      .catch((e: unknown) => {
        console.error("Failed to load listing details", e);
        if (!cancelled) toast.error("Couldn't load the full listing details.");
      })
      .finally(() => {
        if (!cancelled) setIsViewLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [viewRow?._id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Open ManagementForm for add
  const handleAddNew = () => {
    setSelectedOffer(null);
    setIsEditing(false);
    setShowManagementForm(true);
  };

  // Open ManagementForm for edit — map the FULL editable field set so nothing
  // is dropped. (Cast to any: the list row carries every schema field at
  // runtime even though the summary `Offer` type only enumerates a subset.)
  const handleEdit = (offer: Offer) => {
    const o = offer as any;
    const formData: FormOffer = {
      _id: o._id,
      name: o.name || "",
      category: o.category || "",
      /* Which third of the schema applies. Inferred for rows that predate the
         field (anything typed straight into this form), so the picker opens on
         the right answer instead of empty — an empty required field would block
         an unrelated edit from saving. */
      serviceType: o.serviceType || serviceTypeOf(o) || "",
      status: o.status,
      // Without this the form's vendor picker opens on "No vendor assigned" for
      // a listing that has one — an edit would look like it was dropping it.
      vendorId: o.vendorId || "",
      regularPrice: o.regularPrice ?? "",
      finalPrice: o.finalPrice ?? o.discountPrice ?? "",
      description: o.description || "",
      features: o.features || "",
      rules: o.rules || "",
      optionalRules: o.optionalRules || "",
      priceIncludes: o.priceIncludes || "",
      priceExcludes: o.priceExcludes || "",
      seatingCapacity: o.seatingCapacity ?? "",
      sleepingCapacity: o.sleepingCapacity ?? "",
      guestCapacity: o.guestCapacity ?? "",
      personCapacity: o.personCapacity ?? "",
      numberOfBeds: o.numberOfBeds ?? "",
      numberOfRooms: o.numberOfRooms ?? "",
      numberOfBathrooms: o.numberOfBathrooms ?? "",
      stayType: o.stayType || "",
      timeDuration: o.timeDuration || "",
      perDayCharge: o.perDayCharge ?? "",
      perKmCharge: o.perKmCharge ?? "",
      perDayIncludes: o.perDayIncludes || "",
      perDayExcludes: o.perDayExcludes || "",
      perKmIncludes: o.perKmIncludes || "",
      perKmExcludes: o.perKmExcludes || "",
      expectations: o.expectations || "",
      locality: o.locality || "",
      city: o.city || "",
      state: o.state || "",
      pincode: o.pincode || "",
      address: o.address || "",
      discounts: o.discounts || {},
      photos: o.photos || { coverUrl: "", galleryUrls: [] },

      /* Vehicle rental. None of this was mapped, so the admin form could not
         show or change a single field of a vehicle listing — and the field
         relevance guess, working off the category string ("Sedan", "SUV"),
         matched nothing and fell back to revealing all forty fields. */
      vehicleClass: o.vehicleClass || "",
      brand: o.brand || "",
      model: o.model || "",
      manufactureYear: o.manufactureYear ?? "",
      registrationNumber: o.registrationNumber || "",
      fuelType: o.fuelType || "",
      transmission: o.transmission || "",
      airConditioned: !!o.airConditioned,
      luggageCapacity: o.luggageCapacity ?? "",
      pickupPoints: o.pickupPoints || "",
      selfDriveEnabled: !!o.selfDriveEnabled,
      selfDrivePerDay: o.selfDrivePerDay ?? "",
      selfDrivePerKm: o.selfDrivePerKm ?? "",
      freeKmPerDay: o.freeKmPerDay ?? "",
      extraKmCharge: o.extraKmCharge ?? "",
      securityDeposit: o.securityDeposit ?? "",
      minRentalHours: o.minRentalHours ?? "",
      selfDriveIncludes: o.selfDriveIncludes || "",
      selfDriveExcludes: o.selfDriveExcludes || "",
      withDriverEnabled: !!o.withDriverEnabled,
      withDriverPerDay: o.withDriverPerDay ?? "",
      withDriverPerKm: o.withDriverPerKm ?? "",
      driverAllowancePerDay: o.driverAllowancePerDay ?? "",
      nightChargeAfter: o.nightChargeAfter ?? "",
      outstationPerKm: o.outstationPerKm ?? "",
      withDriverIncludes: o.withDriverIncludes || "",
      withDriverExcludes: o.withDriverExcludes || "",
      fuelPolicy: o.fuelPolicy || "",
      tollsAndParking: o.tollsAndParking || "",
      cancellationWindowHours: o.cancellationWindowHours ?? "",
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
  const handleStatusChange = (
    offer: Offer,
    status: "pending" | "approved" | "cancelled",
    options?: { onSuccess?: () => void },
  ) => {
    if (status === "cancelled") {
      // Route through RejectReasonPopup (cancel flow)
      setRejectOffer(offer);
      setRejectAction("cancelled");
      setShowRejectPopup(true);
      return;
    }
    // A second click while the first is still in flight would fire a duplicate
    // request and double-toast.
    if (setStatus.isPending) return;
    setStatus.mutate({ id: offer._id, status }, { onSuccess: options?.onSuccess });
  };

  // RejectReasonPopup submit
  const handleRejectSubmit = (reason: string) => {
    if (!rejectOffer || setStatus.isPending) return;
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
  const submitRenewal = async (payload: CompliancePayload) => {
    if (!renewTarget) return;
    await renewCompliance.mutateAsync({ id: renewTarget._id, payload });
  };

  const askDelete = (offer: Offer) => {
    setConfirm({
      title: "Delete Listing",
      description: `Are you sure you want to delete "${offer.name}"? This action cannot be undone.`,
      variant: "danger",
      confirmLabel: "Delete",
      onConfirm: () => {
        if (deleteListing.isPending) return;
        deleteListing.mutate(offer._id, { onSettled: () => setConfirm(null) });
      },
    });
  };

  /* ── Columns ────────────────────────────────────────────────────────────
     Six columns of equally-weighted grey text is what made this read as a
     spreadsheet. Name, category and location are ONE thing — the listing — so
     they now share a single media cell: thumbnail, name in full-strength ink,
     category and place as muted metadata beneath. Everything else drops to
     supporting weight, which leaves exactly two things scannable per row: what
     the listing is, and what state it's in. */
  const columns: ColumnDef<Offer>[] = [
    {
      key: "name",
      header: "Listing",
      className: "min-w-[260px]",
      cell: (o) => {
        const place = [o.locality, o.city, o.state].filter(Boolean).join(", ");
        return (
          <div className="flex items-center gap-3 min-w-0">
            {o.photos?.coverUrl ? (
              <img
                src={getImageUrl(o.photos.coverUrl as string)}
                alt=""
                loading="lazy"
                className="w-10 h-10 rounded-lg object-cover shrink-0 ring-1 ring-black/[0.06]"
              />
            ) : (
              <div className="grid place-items-center w-10 h-10 rounded-lg shrink-0 bg-app-surface-2 ring-1 ring-black/[0.04]">
                <ImageIcon size={15} className="text-app-fg-subtle/70" strokeWidth={1.8} />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[13.5px] font-semibold text-app-fg truncate leading-tight">
                {o.name || "Untitled listing"}
              </p>
              <p className="mt-0.5 text-[12px] text-app-fg-subtle truncate leading-tight">
                {o.category || "Uncategorised"}
                {place && <span className="mx-1.5 opacity-40">·</span>}
                {place}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      key: "vendorId",
      header: "Vendor",
      hideBelow: "md",
      cell: (o) => {
        const name = vendorNameFor(o.vendorId);
        if (!o.vendorId) return <span className="text-app-fg-subtle">—</span>;
        return (
          <button
            onClick={(e) => {
              // The row itself opens the listing drawer; the vendor cell is the
              // one place inside it that goes somewhere else.
              e.stopPropagation();
              handleVendorClick(o.vendorId || "");
            }}
            className="group/v flex items-center gap-2.5 text-left min-w-0 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-app-accent/35"
            title={name ? `${name} · ${o.vendorId}` : o.vendorId}
          >
            <span className="grid place-items-center w-7 h-7 rounded-full shrink-0 bg-app-accent-soft text-app-accent text-[10.5px] font-bold uppercase">
              {(name || o.vendorId).slice(0, 2)}
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-medium text-app-fg truncate leading-tight group-hover/v:text-app-accent transition-colors">
                {name || o.vendorId}
              </span>
              {name && (
                <span className="block text-[11.5px] text-app-fg-subtle truncate leading-tight tabular-nums">
                  {o.vendorId}
                </span>
              )}
            </span>
          </button>
        );
      },
    },
    {
      key: "regularPrice",
      header: "Price",
      hideBelow: "sm",
      align: "right",
      cell: (o) => (
        <span className="text-[13px] font-semibold text-app-fg tabular-nums">
          {o.regularPrice != null ? formatINR(Number(o.regularPrice)) : "—"}
        </span>
      ),
    },
    {
      /* Only vehicle listings render anything here, so the column is quiet on a
         page of stays and activities and loud on the one row that matters. */
      key: "compliance",
      header: "Documents",
      hideBelow: "lg",
      className: "w-[160px]",
      cell: (o) => {
        const verdict = evaluateCompliance(o);
        if (!verdict) return <span className="text-app-fg-subtle">—</span>;
        return <ComplianceBadge listing={o} showWhenOk />;
      },
    },
    {
      key: "status",
      header: "Status",
      className: "w-[130px]",
      cell: (o) =>
        isRowBusy(o) ? (
          <span className="inline-flex items-center gap-1.5 text-[12px] font-medium text-app-fg-subtle">
            <Loader2 size={13} className="animate-spin" />
            Updating…
          </span>
        ) : (
          <StatusBadge status={o.status || "pending"} />
        ),
    },
  ];

  /* ── Row actions — conditions mirror the original dropdown exactly ── */
  const editActions: RowAction<Offer>[] = [
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
      loading: (o) => isStatusPending(o, "approved"),
      // Any status change in flight blocks the others.
      disabled: () => setStatus.isPending,
    },
    {
      label: "Mark Pending",
      icon: Clock,
      onClick: (o) => handleStatusChange(o, "pending"),
      // Hidden when already pending
      hidden: (o) => o.status?.toLowerCase() === "pending",
      loading: (o) => isStatusPending(o, "pending"),
      disabled: () => setStatus.isPending,
    },
    {
      label: "Cancel",
      icon: XCircle,
      onClick: (o) => handleStatusChange(o, "cancelled"),
      // Hidden when already cancelled/deactivated
      hidden: (o) => o.status?.toLowerCase() === "cancelled",
      disabled: () => setStatus.isPending,
    },
    {
      label: "Update documents",
      icon: ShieldAlert,
      onClick: (o) => setRenewTarget(o),
      // Vehicle listings only — nothing else carries a dated document.
      hidden: (o) => !evaluateCompliance(o),
      disabled: () => renewCompliance.isPending,
    },
  ];

  const rowActions: RowAction<Offer>[] = [
    {
      label: "View",
      icon: Eye,
      onClick: handleView,
    },
    ...(access.canEdit ? editActions : []),
    ...(access.canDelete
      ? [
          {
            label: "Delete",
            icon: Trash2,
            onClick: askDelete,
            variant: "danger" as const,
            // Visible ONLY when status is cancelled (deactivated)
            hidden: (o: Offer) => o.status?.toLowerCase() !== "cancelled",
            loading: (o: Offer) => o._id === deletePendingId,
            disabled: () => deleteListing.isPending,
          },
        ]
      : []),
  ];

  /* ── Render ── */
  return (
    <AdminLayout
      title="Listings"
      subtitle="Vehicles, stays and activities submitted by vendors — review, approve and publish."
      headerActions={
        <>
          <button
            onClick={() => query.refetch()}
            disabled={query.isFetching}
            className={BTN_NEUTRAL}
            aria-label="Refresh listings"
          >
            <RefreshCw size={15} className={query.isFetching ? "animate-spin" : undefined} />
            Refresh
          </button>
          {access.canCreate && (
            <button onClick={handleAddNew} className={BTN_PRIMARY}>
              <Plus size={15} strokeWidth={2.4} /> Create listing
            </button>
          )}
        </>
      }
      tabs={
        <TabStrip
          variant="flush"
          tabs={TABS.map((t) => (t.key === activeTab ? { ...t, count: offers.length } : t))}
          activeKey={activeTab}
          onChange={setActiveTab}
        />
      }
    >
      {/* ── Metrics ─────────────────────────────────────────────────────────
          Every figure is derived from the listings already loaded for the
          selected tab — no extra request and nothing invented. The hint under
          each says which tab it describes, so "12" is never mistaken for a
          platform-wide total. */}
      <div className={`${STAT_GRID} mb-5`}>
        {STAT_DEFS.map((stat, i) => (
          <AdminStatCard
            key={stat.key}
            title={stat.title}
            value={stats[stat.key]}
            icon={stat.icon}
            iconColor={stat.color}
            hint={activeKindLabel ? `in ${activeTabLabel} · ${activeKindLabel}` : `in ${activeTabLabel}`}
            delay={i * 0.04}
          />
        ))}
      </div>

      <MotionReveal delay={0}>
        <section className={CARD_FLUSH}>
          {/* Service type sits ABOVE the toolbar, because it changes what you
              are looking at while search and the filters only narrow it. Its
              own TabStrip: the indicator is keyed on the tab keys, so this one
              and the status strip in the page header animate independently. */}
          <div className="px-3 pt-1 border-b border-app-border">
            <TabStrip variant="flush" tabs={kindTabs} activeKey={activeKind} onChange={setKind} />
          </div>

          {/* Toolbar is the card's HEADER — a recessed band on the card rather
              than another floating row. That is what makes search/filter read
              as belonging to this table instead of to the page. */}
          <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 border-b border-app-border">
            <AdminToolbar
              className="flex-1 min-w-0"
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              searchPlaceholder="Search listings, vendors, places…"
              sortOptions={SORT_OPTIONS}
              sortValue={sortBy}
              onSortChange={setSortBy}
              filterSlot={
                <AdminFilterBar
                  filters={filterDefs}
                  activeFilters={filters}
                  onApply={setFilters}
                  onClear={() => setFilters({})}
                />
              }
              trailing={
                <span className="text-[12px] text-app-fg-subtle tabular-nums whitespace-nowrap">
                  {filtered.length === offers.length
                    ? `${filtered.length} listing${filtered.length === 1 ? "" : "s"}`
                    : `${filtered.length} of ${offers.length}`}
                </span>
              }
            />
          </div>

          <AdminDataTable<Offer>
            columns={columns}
            data={paginated}
            isLoading={query.isLoading}
            isError={query.isError}
            errorMessage="Failed to load listings."
            onRetry={() => query.refetch()}
            hasActiveQuery={hasActiveQuery}
            emptyIcon={hasActiveQuery ? SearchX : PackageOpen}
            emptyTitle={
              activeTab === "compliance"
                ? "No listings on compliance hold"
                : activeKindLabel
                  ? `No ${activeTabLabel.toLowerCase()} ${activeKindLabel.toLowerCase()} listings`
                  : `No ${activeTabLabel.toLowerCase()} listings`
            }
            emptyDescription={
              activeTab === "compliance"
                ? "Vehicles land here automatically when their insurance or PUC certificate expires, and leave again when the vendor enters a new date."
                : "Listings appear here once vendors submit them for review."
            }
            noResultsTitle={searchTerm ? `No results for "${searchTerm}"` : "No matching listings"}
            noResultsDescription="Try different keywords or remove filters."
            noResultsAction={{ label: "Clear filters", onClick: clearQuery }}
            rowActions={rowActions}
            rowBusy={isRowBusy}
            onRowClick={handleView}
            pagination={{
              currentPage,
              totalPages,
              pageSize: ITEMS_PER_PAGE,
              totalItems: filtered.length,
              onPageChange: setPage,
            }}
          />
        </section>
      </MotionReveal>

      {/* ── Popups — props & flows preserved exactly from original ── */}

      {viewOffer && (
        <ViewDetailsPopup
          isOpen
          onClose={() => setSelectedId(null)}
          listingData={viewOffer}
          isLoading={isViewLoading && viewDetail?.id !== viewOffer._id}
          isApproving={isStatusPending(viewOffer, "approved")}
          position={{ index: viewIndex + 1, total: filtered.length }}
          onPrev={viewIndex > 0 ? () => setSelectedId(filtered[viewIndex - 1]._id) : undefined}
          onNext={
            viewIndex < filtered.length - 1
              ? () => setSelectedId(filtered[viewIndex + 1]._id)
              : undefined
          }
          onApprove={
            viewOffer.status !== "approved"
              ? () => {
                  // Stay open until the server confirms — closing first left the
                  // admin with no idea whether the approve landed.
                  handleStatusChange(viewOffer, "approved", {
                    onSuccess: () => setSelectedId(null),
                  });
                }
              : undefined
          }
          onRenewCompliance={
            access.canEdit && evaluateCompliance(viewOffer)
              ? () => setRenewTarget(viewOffer)
              : undefined
          }
          onReject={
            viewOffer.status !== "rejected" && viewOffer.status !== "cancelled"
              ? () => {
                  handleStatusChange(viewOffer, "cancelled");
                  setSelectedId(null);
                }
              : undefined
          }
        />
      )}

      <ComplianceRenewDialog
        open={!!renewTarget}
        onClose={() => setRenewTarget(null)}
        listing={renewTarget}
        onSubmit={submitRenewal}
        asAdmin
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
