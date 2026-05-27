import React, { useState } from "react";
import { ArrowUpRight, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDate } from "@/utils/formateTime";
import { AdminDataTable, type ColumnDef } from "@/components/admin/AdminDataTable";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { StatusBadge } from "@/components/shared";

export interface PaymentRecord {
  paymentMethod: string;
  paymentRefId: string;
  bookingId: string;
  amountPay: string;
  fullName: string;
  receiptDate: string;
  status: string;
}

const ITEMS_PER_PAGE = 12;

const PERIOD_OPTIONS = [
  { value: "all", label: "All Time" },
  { value: "weekly", label: "This Week" },
  { value: "monthly", label: "This Month" },
];

/** Returns midnight (UTC) of the Monday that starts the current ISO week. */
function startOfCurrentWeek(): Date {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun … 6=Sat
  const diff = (day === 0 ? -6 : 1 - day); // shift to Monday
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + diff));
  return monday;
}

/** Returns midnight UTC of the 1st of the current calendar month. */
function startOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function isInPeriod(dateStr: string, period: string): boolean {
  if (period === "all") return true;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return true; // keep rows with unparseable dates
  if (period === "weekly") return d >= startOfCurrentWeek();
  if (period === "monthly") return d >= startOfCurrentMonth();
  return true;
}

export const PaymentTable: React.FC<{ loading: boolean; data: PaymentRecord[] }> = ({
  loading,
  data,
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = data.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      p.paymentMethod?.toLowerCase().includes(q) ||
      p.paymentRefId?.toLowerCase().includes(q) ||
      p.bookingId?.toLowerCase().includes(q) ||
      p.fullName?.toLowerCase().includes(q);
    const matchesPeriod = isInPeriod(p.receiptDate, filterPeriod);
    return matchesSearch && matchesPeriod;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedRows = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);

  const hasActiveQuery = searchQuery.trim().length > 0 || filterPeriod !== "all";

  const handleSearchChange = (v: string) => {
    setSearchQuery(v);
    setCurrentPage(1);
  };

  const handlePeriodChange = (v: string) => {
    setFilterPeriod(v);
    setCurrentPage(1);
  };

  const columns: ColumnDef<PaymentRecord>[] = [
    {
      key: "paymentMethod",
      header: "Payment Method",
      cell: (row) => (
        <span className="font-medium text-app-fg-muted whitespace-nowrap">
          {row.paymentMethod}
        </span>
      ),
    },
    {
      key: "paymentRefId",
      header: "Payment Ref ID",
      cell: (row) => (
        <span className="font-mono text-[12px] text-app-fg-muted whitespace-nowrap">
          {row.paymentRefId?.substring(0, 12)}…
        </span>
      ),
    },
    {
      key: "bookingId",
      header: "Booking ID",
      cell: (row) => (
        <span className="font-bold text-app-accent inline-flex items-center gap-1 whitespace-nowrap">
          {row.bookingId?.substring(0, 10)}… <ArrowUpRight size={12} />
        </span>
      ),
    },
    {
      key: "amountPay",
      header: "Amount",
      cell: (row) => (
        <span className="font-bold text-app-fg whitespace-nowrap">₹ {row.amountPay}</span>
      ),
    },
    {
      key: "fullName",
      header: "Full Name",
      cell: (row) => (
        <span className="font-medium text-app-fg-muted whitespace-nowrap">{row.fullName}</span>
      ),
    },
    {
      key: "receiptDate",
      header: "Date",
      cell: (row) => (
        <span className="font-medium text-app-fg-muted whitespace-nowrap">
          {formatDate(row.receiptDate)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div
      style={{
        backgroundColor: "var(--color-app-surface, #fff)",
        border: "1.5px solid #EBEBEB",
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 2px 12px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "18px 22px",
          borderBottom: "1.5px solid #EBEBEB",
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <p className="text-[14px] font-bold text-app-fg">Payment History</p>
        </div>
        <AdminToolbar
          searchValue={searchQuery}
          onSearchChange={handleSearchChange}
          searchPlaceholder="Search by name, method, ref…"
          sortOptions={PERIOD_OPTIONS}
          sortValue={filterPeriod}
          onSortChange={handlePeriodChange}
        />
      </div>

      {/* Table */}
      <AdminDataTable<PaymentRecord>
        columns={columns}
        data={pagedRows}
        isLoading={loading}
        hasActiveQuery={hasActiveQuery}
        emptyIcon={Wallet}
        emptyTitle="No payment history yet"
        emptyDescription="Payments will appear here once bookings are completed."
        noResultsTitle="No matching payments"
        noResultsDescription="Try adjusting your search or changing the period filter."
        getRowId={(row, index) => row.paymentRefId ?? String(index)}
        onRowClick={(row) => navigate(`/bookings/details?id=${row.bookingId}`)}
        pagination={
          filtered.length > ITEMS_PER_PAGE
            ? {
                currentPage: safePage,
                totalPages,
                totalItems: filtered.length,
                onPageChange: setCurrentPage,
              }
            : undefined
        }
        skeletonRows={6}
      />
    </div>
  );
};
