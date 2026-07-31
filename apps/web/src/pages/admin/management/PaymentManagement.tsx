import React, { useEffect, useMemo, useState } from "react";
import { Eye, SearchX, Trash2, CreditCard } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import PaymentDetailsPopup from "@/components/admin/PaymentDetailsPopup";
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
import { usePayments, type PaymentData } from "@/hooks/admin/usePayments";
import { useFeatureAccess } from "@/hooks/admin/useFeatureAccess";
import { ADMIN_FEATURES } from "@/lib/adminPermissions";

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

const PaymentManagement: React.FC = () => {
  const access = useFeatureAccess(ADMIN_FEATURES.payments);
  const [activeTab, setActiveTab] = useState("payment-received");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("paymentId");
  const [filters, setFilters] = useState<ActiveFilters>({});
  const [currentPage, setCurrentPage] = useState(1);

  const [showPaymentDetails, setShowPaymentDetails] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentData | null>(null);
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

  // The data is already filtered server-side; client-side slice for pagination only.
  const totalPages = Math.ceil(payments.length / ITEMS_PER_PAGE);
  const paginated = useMemo(
    () => payments.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE),
    [payments, currentPage],
  );
  const hasActiveQuery = !!searchTerm.trim() || Object.keys(filters).length > 0;

  const handleView = (payment: PaymentData) => {
    setSelectedPayment(payment);
    setShowPaymentDetails(true);
  };

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
      header: "Payment ID",
      cell: (p) => (
        <button
          onClick={() => handleView(p)}
          className="font-semibold text-tpl-primary hover:underline"
        >
          {p.paymentId}
        </button>
      ),
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
    <AdminLayout title="Payment Management">
      <MotionReveal delay={0}>
        <div className="bg-app-surface rounded-[18px] border border-app-border shadow-[0_1px_2px_rgba(16,24,40,0.04),0_10px_28px_-14px_rgba(16,24,40,0.16)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.35),0_12px_32px_-16px_rgba(0,0,0,0.55)] overflow-hidden">
          <div className="p-5 space-y-5">
            <TabStrip tabs={TABS} activeKey={activeTab} onChange={setActiveTab} />

            <AdminToolbar
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              searchPlaceholder="Search payments…"
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
              <AdminDataTable<PaymentData>
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
                noResultsTitle={
                  searchTerm ? `No results for "${searchTerm}"` : "No matching payments"
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
                  totalItems: payments.length,
                  onPageChange: setCurrentPage,
                }}
              />
            </div>
          </div>
        </div>
      </MotionReveal>

      <PaymentDetailsPopup
        isOpen={showPaymentDetails}
        onClose={() => setShowPaymentDetails(false)}
        payment={
          selectedPayment ?? {
            paymentId: "",
            businessName: "",
            personName: "",
            servicesId: "",
            status: "",
          }
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
        isLoading={deletePayment.isPending}
      />
    </AdminLayout>
  );
};

export default PaymentManagement;
