import React, { useMemo, useState } from "react";
import { ArrowUpRight, Wallet } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AdminDataTable, type ColumnDef } from "@/components/admin/AdminDataTable";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { Panel, PanelHead, StatusBadge } from "@/components/shared";
import { formatDMY, inr, parseDMY } from "./format";

export interface PaymentRecord {
  bookingId: string;
  guest: string;
  service: string;
  /** Numeric — the API's pre-formatted "₹ 5000" is unwrapped upstream. */
  amount: number;
  /** Raw "DD/MM/YYYY" as the API sends it. */
  date: string;
  status: string;
}

const ITEMS_PER_PAGE = 12;

const PERIOD_OPTIONS = [
  { value: "all", label: "All Time" },
  { value: "weekly", label: "This Week" },
  { value: "monthly", label: "This Month" },
];

/** Midnight of the Monday starting the current ISO week, in local time. */
function startOfCurrentWeek(): Date {
  const now = new Date();
  const day = now.getDay(); // 0=Sun … 6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);
  return monday;
}

function startOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/**
 * Period filter. Previously used `new Date(dateStr)` on a "DD/MM/YYYY" string,
 * which is an Invalid Date — every row fell through the `isNaN` guard and was
 * kept, so This Week / This Month silently did nothing. `parseDMY` reads the
 * parts explicitly. Rows with a genuinely unparseable date are still kept.
 */
function isInPeriod(dateStr: string, period: string): boolean {
  if (period === "all") return true;
  const d = parseDMY(dateStr);
  if (!d) return true;
  if (period === "weekly") return d >= startOfCurrentWeek();
  if (period === "monthly") return d >= startOfCurrentMonth();
  return true;
}

export const PaymentTable: React.FC<{
  loading: boolean;
  isError?: boolean;
  /** Server's reason, when it gave one — beats a generic "couldn't load". */
  errorMessage?: string;
  onRetry?: () => void;
  data: PaymentRecord[];
}> = ({ loading, isError, errorMessage, onRetry, data }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return data.filter((p) => {
      const matchesSearch =
        !q ||
        p.bookingId?.toLowerCase().includes(q) ||
        p.guest?.toLowerCase().includes(q) ||
        p.service?.toLowerCase().includes(q);
      return matchesSearch && isInPeriod(p.date, filterPeriod);
    });
  }, [data, searchQuery, filterPeriod]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedRows = filtered.slice((safePage - 1) * ITEMS_PER_PAGE, safePage * ITEMS_PER_PAGE);
  const hasActiveQuery = searchQuery.trim().length > 0 || filterPeriod !== "all";

  /** Only the columns the API actually supplies — see the note in Revenue.tsx. */
  const columns: ColumnDef<PaymentRecord>[] = [
    {
      key: "bookingId",
      header: "Booking",
      cell: (row) => (
        <span className="font-semibold text-brand inline-flex items-center gap-1 whitespace-nowrap">
          {row.bookingId}
          <ArrowUpRight size={12} strokeWidth={2.4} />
        </span>
      ),
    },
    {
      key: "guest",
      header: "Guest",
      cell: (row) => (
        <span className="font-medium text-app-fg whitespace-nowrap">{row.guest || "—"}</span>
      ),
    },
    {
      key: "service",
      header: "Service",
      cell: (row) => (
        <span className="text-app-fg-muted whitespace-nowrap">{row.service || "—"}</span>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      cell: (row) => (
        <span className="font-bold tabular-nums text-app-fg whitespace-nowrap">
          {inr(row.amount)}
        </span>
      ),
    },
    {
      key: "date",
      header: "Check-in",
      cell: (row) => (
        <span className="tabular-nums text-app-fg-muted whitespace-nowrap">
          {formatDMY(row.date)}
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
    <Panel>
      <PanelHead
        icon={Wallet}
        title="Payment history"
        blurb="Every booking that has produced revenue."
        aside={
          !loading && !isError && data.length > 0 ? (
            <span className="text-[11.5px] font-semibold tabular-nums text-muted-foreground">
              {filtered.length === data.length
                ? `${data.length} ${data.length === 1 ? "payment" : "payments"}`
                : `${filtered.length} of ${data.length}`}
            </span>
          ) : undefined
        }
      />

      <div className="px-5 py-3.5 border-b border-border/70">
        <AdminToolbar
          searchValue={searchQuery}
          onSearchChange={(v) => {
            setSearchQuery(v);
            setCurrentPage(1);
          }}
          searchPlaceholder="Search bookings or guests…"
          sortOptions={PERIOD_OPTIONS}
          sortValue={filterPeriod}
          onSortChange={(v) => {
            setFilterPeriod(v);
            setCurrentPage(1);
          }}
        />
      </div>

      <AdminDataTable<PaymentRecord>
        columns={columns}
        data={pagedRows}
        isLoading={loading}
        isError={isError}
        errorMessage={errorMessage || "We couldn't load your payments."}
        onRetry={onRetry}
        hasActiveQuery={hasActiveQuery}
        emptyIcon={Wallet}
        emptyTitle="No payments yet"
        emptyDescription="Once a booking is confirmed, its payment shows up here."
        noResultsTitle="No matching payments"
        noResultsDescription="Try a different search, or widen the period filter."
        getRowId={(row, index) => row.bookingId ?? String(index)}
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
    </Panel>
  );
};
