import React, { useState } from "react";
import { Eye, Trash2, CalendarX, SearchX } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import BookingDetailsPopup from "@/components/admin/BookingDetailsPopup";
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
import { useBookings, type Booking } from "@/hooks/admin/useBookings";
import { useFeatureAccess } from "@/hooks/admin/useFeatureAccess";
import { ADMIN_FEATURES } from "@/lib/adminPermissions";
import { formatDate } from "@/utils/formateTime";
import { CARD_FLUSH } from "@/components/admin/adminUI";
import { useTableUrlState, type UrlFilterDef } from "@/components/admin/useTableUrlState";

const TABS = [
  { key: "all-bookings", label: "All Bookings" },
  { key: "upcoming-bookings", label: "Upcoming Bookings" },
  { key: "past-booking", label: "Past Bookings" },
  { key: "cancelled-bookings", label: "Cancelled Bookings" },
];

const SORT_OPTIONS = [
  { value: "bookingId", label: "Booking ID" },
  { value: "clientName", label: "Client Name" },
  { value: "serviceName", label: "Service Name" },
];

const SERVICE_TYPE_OPTIONS = [
  { value: "caravan", label: "Caravan" },
  { value: "stay", label: "Stay" },
  { value: "activity", label: "Activity" },
];

const ITEMS_PER_PAGE = 15;

/* Which query params this page owns. Declared at module scope because
   useTableUrlState needs the key/type pairs before the data (and therefore the
   full FilterDefinition list, whose options are derived) exists. */
const URL_FILTERS: UrlFilterDef[] = [{ key: "serviceType", type: "select" }];

/**
 * Maps the AdminToolbar sort dropdown value to the backend sort field.
 * The toolbar stores values that already match backend fields for bookings,
 * so this is a pass-through — kept explicit for clarity and future changes.
 */
function mapSortValue(val: string): string {
  if (val === "clientName") return "clientName";
  if (val === "serviceName") return "serviceName";
  return "bookingId";
}

const BookingManagement: React.FC = () => {
  const access = useFeatureAccess(ADMIN_FEATURES.bookings);

  /* Tab, search, sort, page and the open record all live in the URL, so a
     refresh restores the exact view and the address bar is shareable. */
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
    defaultTab: "all-bookings",
    defaultSort: "bookingId",
  });

  // Single confirm state drives the one shared ConfirmModal.
  const [confirm, setConfirm] = useState<{
    title: string;
    description: string;
    variant: "danger" | "warning";
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);

  // serviceType comes from the AdminFilterBar filter (replaces the old pill strip).
  const serviceType = typeof filters.serviceType === "string" ? filters.serviceType : undefined;

  const { query, deleteBooking } = useBookings({
    tab: activeTab,
    serviceType,
    search: searchTerm || undefined,
    sortBy: mapSortValue(sortBy),
    sortDir: "asc",
  });

  const bookings = query.data ?? [];

  const filterDefs: FilterDefinition[] = [
    {
      key: "serviceType",
      label: "Service Type",
      type: "select",
      options: SERVICE_TYPE_OPTIONS,
    },
  ];

  const totalPages = Math.max(1, Math.ceil(bookings.length / ITEMS_PER_PAGE));
  // A `?page=` deep-linked from a longer list can outrun a narrower one.
  const currentPage = Math.min(page, totalPages);
  const paginated = bookings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  /* The drawer walks the whole FILTERED result set, not just the current page —
     stepping to the next record shouldn't stop at a pagination boundary that
     exists for the table's benefit rather than the operator's. The id is the
     source of truth (it survives a refresh); the index is derived, so prev/next
     is a ±1 and the position readout comes for free. A record that drops out of
     the list closes the drawer on its own rather than showing a stale record. */
  const selectedIndex = selectedId ? bookings.findIndex((b) => b._id === selectedId) : -1;
  const selectedBooking = selectedIndex >= 0 ? bookings[selectedIndex] : null;

  const handleView = (booking: Booking) => setSelectedId(booking._id);

  const askDelete = (booking: Booking) =>
    setConfirm({
      title: "Delete booking?",
      description: `Booking "${booking.bookingId}" will be permanently removed. This cannot be undone.`,
      variant: "danger",
      confirmLabel: "Delete",
      onConfirm: () => {
        deleteBooking.mutate(booking._id);
        setConfirm(null);
      },
    });

  const columns: ColumnDef<Booking>[] = [
    {
      key: "bookingId",
      header: "Booking ID",
      // The whole row opens the drawer now, so the identifier is plain text
      // rather than a link — a link inside a clickable row is two targets for
      // one destination, and the underline invited a click that was already
      // available anywhere on the row.
      cell: (b) => <span className="font-semibold text-app-fg">{b.bookingId}</span>,
    },
    {
      key: "clientName",
      header: "Client Name",
      cell: (b) => <span className="text-app-fg-muted">{b.clientName}</span>,
    },
    {
      key: "serviceName",
      header: "Service Name",
      hideBelow: "md",
      cell: (b) => <span className="text-app-fg-muted">{b.serviceName}</span>,
    },
    {
      key: "checkIn",
      header: "Check-in",
      hideBelow: "lg",
      cell: (b) => (
        <span className="text-app-fg-muted">{formatDate(b.checkIn)}</span>
      ),
    },
    {
      key: "checkOut",
      header: "Check-out",
      hideBelow: "lg",
      cell: (b) => (
        <span className="text-app-fg-muted">{formatDate(b.checkOut)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (b) => <StatusBadge status={b.status} />,
    },
  ];

  const rowActions: RowAction<Booking>[] = [
    { label: "View", icon: Eye, onClick: handleView },
    ...(access.canDelete
      ? [{ label: "Delete", icon: Trash2, onClick: askDelete, variant: "danger" as const }]
      : []),
  ];

  return (
    <AdminLayout
      title="Booking Management"
      subtitle="Every booking placed on the platform, with payment and trip status."
      tabs={<TabStrip variant="flush" tabs={TABS} activeKey={activeTab} onChange={setActiveTab} />}
    >
      <MotionReveal delay={0}>
        <div className={CARD_FLUSH}>
          <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 border-b border-app-border">
            <AdminToolbar
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              searchPlaceholder="Search bookings…"
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
              resultCount={query.isLoading ? undefined : bookings.length}
              resultNoun="booking"
            />
          </div>

          <AdminDataTable<Booking>
            /* 15 rows a page runs past the fold on a laptop, so the body
                   scrolls in place and the header stays put. */
            maxBodyHeight="calc(100vh - 22rem)"
            columns={columns}
            data={paginated}
            isLoading={query.isLoading}
            isError={query.isError}
            errorMessage="Failed to load bookings."
            onRetry={() => query.refetch()}
            hasActiveQuery={hasActiveQuery}
            emptyIcon={hasActiveQuery ? SearchX : CalendarX}
            emptyTitle="No bookings yet"
            emptyDescription="Bookings will appear here once guests make reservations."
            noResultsTitle={searchTerm ? `No results for "${searchTerm}"` : "No matching bookings"}
            noResultsDescription="Try different keywords or remove filters."
            noResultsAction={{ label: "Clear filters", onClick: clearQuery }}
            rowActions={rowActions}
            onRowClick={handleView}
            pagination={{
              currentPage,
              totalPages,
              pageSize: ITEMS_PER_PAGE,
              totalItems: bookings.length,
              onPageChange: setPage,
            }}
          />
        </div>
      </MotionReveal>

      {selectedBooking && (
        <BookingDetailsPopup
          isOpen
          onClose={() => setSelectedId(null)}
          booking={selectedBooking}
          position={{ index: selectedIndex + 1, total: bookings.length }}
          onPrev={
            selectedIndex > 0 ? () => setSelectedId(bookings[selectedIndex - 1]._id) : undefined
          }
          onNext={
            selectedIndex < bookings.length - 1
              ? () => setSelectedId(bookings[selectedIndex + 1]._id)
              : undefined
          }
        />
      )}

      <ConfirmModal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm?.onConfirm()}
        title={confirm?.title ?? ""}
        description={confirm?.description}
        confirmLabel={confirm?.confirmLabel}
        variant={confirm?.variant}
        isLoading={deleteBooking.isPending}
      />
    </AdminLayout>
  );
};

export default BookingManagement;
