import React, { useMemo, useState } from "react";
import { Eye, SearchX, Trash2, CreditCard } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import PaymentDetailsPopup from "@/components/admin/PaymentDetailsPopup";
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
import { usePayments, type PaymentData } from "@/hooks/admin/usePayments";
import { useFeatureAccess } from "@/hooks/admin/useFeatureAccess";
import { ADMIN_FEATURES } from "@/lib/adminPermissions";
import { CARD_FLUSH } from "@/components/admin/adminUI";
import { useTableUrlState, type UrlFilterDef } from "@/components/admin/useTableUrlState";

const TABS = [
  { key: "payment-received", label: "Payment Received" },
  { key: "vendor", label: "Vendor" },
  { key: "refund-status", label: "Refund Status" },
];

const SORT_OPTIONS = [
  { value: "businessName", label: "Business Name" },
  { value: "personName", label: "Person Name" },
  { value: "paymentId", label: "Payment ID" },
];

const SERVICE_TYPE_OPTIONS = [
  { value: "camper-van", label: "Camper Van" },
  { value: "unique-stay", label: "Unique Stay" },
  { value: "activity", label: "Activity" },
];

const ITEMS_PER_PAGE = 15;

/* Query params this page owns. */
const URL_FILTERS: UrlFilterDef[] = [{ key: "serviceType", type: "select" }];

const PaymentManagement: React.FC = () => {
  const access = useFeatureAccess(ADMIN_FEATURES.payments);

  /* Tab, search, sort, page, filters and the open record live in the URL, so
     "the failed payment I'm looking at" is a link. */
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
    defaultTab: "payment-received",
    defaultSort: "paymentId",
  });

  const [confirm, setConfirm] = useState<{
    title: string;
    description: string;
    variant: "danger" | "warning";
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);

  const serviceType = (filters.serviceType as string) || undefined;

  const { query, deletePayment } = usePayments({
    tab: activeTab,
    serviceType,
    search: searchTerm || undefined,
    sortBy,
    sortDir: "asc",
  });

  const payments = query.data ?? [];

  const filterDefs: FilterDefinition[] = [
    {
      key: "serviceType",
      label: "Service Type",
      type: "select",
      options: SERVICE_TYPE_OPTIONS,
    },
  ];

  // The data is already filtered server-side; client-side slice for pagination only.
  const totalPages = Math.max(1, Math.ceil(payments.length / ITEMS_PER_PAGE));
  // A `?page=` carried over from a longer list can outrun a narrower one.
  const currentPage = Math.min(page, totalPages);
  const paginated = useMemo(
    () => payments.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
    [payments, currentPage],
  );

  /* `?id=` is the open record; the index is derived so prev/next is a ±1. */
  const selectedIndex = selectedId ? payments.findIndex((p) => p._id === selectedId) : -1;
  const selectedPayment = selectedIndex >= 0 ? payments[selectedIndex] : null;

  const handleView = (payment: PaymentData) => setSelectedId(payment._id);

  const askDelete = (payment: PaymentData) =>
    setConfirm({
      title: "Delete payment record?",
      description: `Payment "${payment.paymentId}" will be permanently removed. This cannot be undone.`,
      variant: "danger",
      confirmLabel: "Delete",
      onConfirm: () => {
        deletePayment.mutate(payment._id);
        setConfirm(null);
      },
    });

  const columns: ColumnDef<PaymentData>[] = [
    {
      key: "paymentId",
      // Plain text: the whole row opens the drawer, so a link here would be a
      // second target for the same destination.
      header: "Payment ID",
      cell: (p) => <span className="font-semibold text-app-fg tabular-nums">{p.paymentId}</span>,
    },
    {
      key: "businessName",
      header: "Business Name",
      cell: (p) => <span className="text-tpl-dark-4 dark:text-tpl-dark-6">{p.businessName}</span>,
    },
    {
      key: "personName",
      header: "Person Name",
      hideBelow: "md",
      cell: (p) => <span className="text-tpl-dark-4 dark:text-tpl-dark-6">{p.personName}</span>,
    },
    {
      key: "servicesId",
      header: "Services ID",
      hideBelow: "lg",
      cell: (p) => <span className="text-tpl-dark-4 dark:text-tpl-dark-6">{p.servicesId}</span>,
    },
    {
      key: "servicesNames",
      header: "Services Names",
      hideBelow: "lg",
      cell: (p) => <span className="text-tpl-dark-4 dark:text-tpl-dark-6">{p.servicesNames}</span>,
    },
    {
      key: "status",
      header: "Status",
      cell: (p) => <StatusBadge status={p.status} />,
    },
  ];

  const rowActions: RowAction<PaymentData>[] = [
    { label: "View", icon: Eye, onClick: handleView },
    ...(access.canDelete
      ? [{ label: "Delete", icon: Trash2, onClick: askDelete, variant: "danger" as const }]
      : []),
  ];

  return (
    <AdminLayout
      title="Payment Management"
      subtitle="Transactions, payouts and refunds across all bookings."
      tabs={<TabStrip variant="flush" tabs={TABS} activeKey={activeTab} onChange={setActiveTab} />}
    >
      <MotionReveal delay={0}>
        <div className={CARD_FLUSH}>
          <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 border-b border-app-border">
            <AdminToolbar
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              searchPlaceholder="Search payments…"
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
            />
          </div>

          <AdminDataTable<PaymentData>
            /* 15 rows a page runs past the fold on a laptop, so the body
                   scrolls in place and the header stays put. */
            maxBodyHeight="calc(100vh - 22rem)"
            columns={columns}
            data={paginated}
            isLoading={query.isLoading}
            isError={query.isError}
            errorMessage="Failed to load payments."
            onRetry={() => query.refetch()}
            hasActiveQuery={hasActiveQuery}
            emptyIcon={hasActiveQuery ? SearchX : CreditCard}
            emptyTitle="No payment records yet"
            emptyDescription="Payment records appear here once transactions are processed."
            noResultsTitle={searchTerm ? `No results for "${searchTerm}"` : "No matching payments"}
            noResultsDescription="Try different keywords or remove filters."
            noResultsAction={{ label: "Clear filters", onClick: clearQuery }}
            rowActions={rowActions}
            onRowClick={handleView}
            pagination={{
              currentPage,
              totalPages,
              pageSize: ITEMS_PER_PAGE,
              totalItems: payments.length,
              onPageChange: setPage,
            }}
          />
        </div>
      </MotionReveal>

      {selectedPayment && (
        <PaymentDetailsPopup
          isOpen
          onClose={() => setSelectedId(null)}
          payment={selectedPayment}
          position={{ index: selectedIndex + 1, total: payments.length }}
          onPrev={
            selectedIndex > 0 ? () => setSelectedId(payments[selectedIndex - 1]._id) : undefined
          }
          onNext={
            selectedIndex < payments.length - 1
              ? () => setSelectedId(payments[selectedIndex + 1]._id)
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
        isLoading={deletePayment.isPending}
      />
    </AdminLayout>
  );
};

export default PaymentManagement;
