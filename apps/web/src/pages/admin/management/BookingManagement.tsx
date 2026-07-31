import React, { useEffect, useMemo, useState } from "react";
import { Eye, Trash2, CalendarX, SearchX } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import BookingDetailsPopup from "@/components/admin/BookingDetailsPopup";
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
import { useBookings, type Booking } from "@/hooks/admin/useBookings";
import { formatDate } from "@/utils/formateTime";

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
  const [activeTab, setActiveTab] = useState("all-bookings");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("bookingId");
  const [filters, setFilters] = useState<ActiveFilters>({});
  const [currentPage, setCurrentPage] = useState(1);

  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

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

  // Reset page whenever any query-influencing state changes.
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, sortBy, filters]);

  const filterDefs: FilterDefinition[] = [
    {
      key: "serviceType",
      label: "Service Type",
      type: "select",
      options: SERVICE_TYPE_OPTIONS,
    },
  ];

  const totalPages = Math.max(1, Math.ceil(bookings.length / ITEMS_PER_PAGE));
  const paginated = bookings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const hasActiveQuery = !!searchTerm.trim() || Object.keys(filters).length > 0;

  const handleView = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowBookingDetails(true);
  };

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
      cell: (b) => (
        <button
          onClick={() => handleView(b)}
          className="font-semibold text-tpl-primary hover:underline"
        >
          {b.bookingId}
        </button>
      ),
    },
    {
      key: "clientName",
      header: "Client Name",
      cell: (b) => <span className="text-tpl-dark-4 dark:text-tpl-dark-6">{b.clientName}</span>,
    },
    {
      key: "serviceName",
      header: "Service Name",
      hideBelow: "md",
      cell: (b) => <span className="text-tpl-dark-4 dark:text-tpl-dark-6">{b.serviceName}</span>,
    },
    {
      key: "checkIn",
      header: "Check-in",
      hideBelow: "lg",
      cell: (b) => (
        <span className="text-tpl-dark-4 dark:text-tpl-dark-6">{formatDate(b.checkIn)}</span>
      ),
    },
    {
      key: "checkOut",
      header: "Check-out",
      hideBelow: "lg",
      cell: (b) => (
        <span className="text-tpl-dark-4 dark:text-tpl-dark-6">{formatDate(b.checkOut)}</span>
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
    { label: "Delete", icon: Trash2, onClick: askDelete, variant: "danger" },
  ];

  return (
    <AdminLayout title="Booking Management">
      <MotionReveal delay={0}>
        <div className="bg-app-surface rounded-[18px] border border-app-border shadow-[0_1px_2px_rgba(16,24,40,0.04),0_10px_28px_-14px_rgba(16,24,40,0.16)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.35),0_12px_32px_-16px_rgba(0,0,0,0.55)] overflow-hidden">
          <div className="p-5 space-y-5">
            <TabStrip tabs={TABS} activeKey={activeTab} onChange={setActiveTab} />

            <AdminToolbar
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              searchPlaceholder="Search bookings…"
              sortOptions={SORT_OPTIONS}
              sortValue={sortBy}
              onSortChange={setSortBy}
            />

            <AdminFilterBar
              filters={filterDefs}
              activeFilters={filters}
              onApply={setFilters}
              onClear={() => setFilters({})}
            />

            <div className="border border-tpl-stroke dark:border-white/10 rounded-xl overflow-hidden">
              <AdminDataTable<Booking>
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
                noResultsTitle={
                  searchTerm ? `No results for "${searchTerm}"` : "No matching bookings"
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
                  totalItems: bookings.length,
                  onPageChange: setCurrentPage,
                }}
              />
            </div>
          </div>
        </div>
      </MotionReveal>

      {showBookingDetails && selectedBooking && (
        <BookingDetailsPopup
          isOpen={showBookingDetails}
          onClose={() => setShowBookingDetails(false)}
          booking={selectedBooking}
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
