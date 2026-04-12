import React, { useState } from "react";
import { Search, ChevronDown, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CustomPagination } from "@/components/CustomPagination";
import { formatDate } from "@/utils/formateTime";
import { TEAL, BLACK, GRAY_500, GRAY_400, WHITE, SURFACE, GREEN, AMBER } from "./tokens";

/* ─── Skeleton ────────────────────────────────────────────────────────────── */
const Sk = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800 ${className}`} />
);

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

export const PaymentTable: React.FC<{ loading: boolean; data: PaymentRecord[] }> = ({ loading, data }) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState("Monthly");
  const [currentPage, setCurrentPage] = useState(1);

  const filtered = data.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.paymentMethod?.toLowerCase().includes(q) ||
      p.paymentRefId?.toLowerCase().includes(q) ||
      p.bookingId?.toLowerCase().includes(q) ||
      p.fullName?.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const page = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div
      style={{
        backgroundColor: WHITE,
        border: "1.5px solid #EBEBEB",
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 2px 12px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)",
      }}
    >
      {/* Header */}
      <div style={{ padding: "18px 22px", borderBottom: "1.5px solid #EBEBEB", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: BLACK }}>Payment History</p>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div style={{ position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: searchFocused ? TEAL : GRAY_400, transition: "color 0.15s", pointerEvents: "none" }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder="Search…"
              style={{
                width: 200, height: 38, paddingLeft: 34, paddingRight: 12,
                fontSize: 13, color: BLACK, fontWeight: 450,
                backgroundColor: searchFocused ? WHITE : SURFACE,
                border: `1.5px solid ${searchFocused ? TEAL : "transparent"}`,
                borderRadius: 10, outline: "none",
                boxShadow: searchFocused ? "0 0 0 3px rgba(7,228,228,0.15)" : "none",
                transition: "all 0.15s",
              }}
            />
          </div>
          {/* Filter */}
          <div style={{ position: "relative" }}>
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              style={{ height: 38, padding: "0 32px 0 12px", fontSize: 13, fontWeight: 600, color: GRAY_500, backgroundColor: SURFACE, border: "1.5px solid transparent", borderRadius: 10, outline: "none", appearance: "none", cursor: "pointer" }}
            >
              <option value="Monthly">Monthly</option>
              <option value="Weekly">Weekly</option>
              <option value="Daily">Daily</option>
            </select>
            <ChevronDown size={14} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: GRAY_400 }} />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="relative w-full overflow-x-auto">
        <table style={{ width: "100%", minWidth: 900, fontSize: 13, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: SURFACE }}>
              {["Payment Method", "Payment Ref ID", "Booking ID", "Amount", "Full Name", "Date", "Status"].map((h) => (
                <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11, fontWeight: 700, color: GRAY_500, textTransform: "uppercase", letterSpacing: "0.03em", whiteSpace: "nowrap" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: "1px solid #EBEBEB" }}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <td key={j} style={{ padding: "12px 16px" }}><Sk className={`h-4 ${j === 6 ? "w-16" : "w-24"}`} /></td>
                  ))}
                </tr>
              ))
            ) : page.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "40px 16px", textAlign: "center", color: GRAY_400, fontSize: 14 }}>
                  {searchQuery ? `No results for "${searchQuery}"` : "No payment history yet"}
                </td>
              </tr>
            ) : (
              page.map((p, i) => (
                <tr
                  key={i}
                  style={{ borderBottom: "1px solid #EBEBEB", transition: "background-color 0.1s", cursor: "pointer" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = SURFACE; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.backgroundColor = "transparent"; }}
                  onClick={() => navigate(`/bookings/details?id=${p.bookingId}`)}
                >
                  <td style={{ padding: "12px 16px", fontWeight: 500, color: GRAY_500, whiteSpace: "nowrap" }}>{p.paymentMethod}</td>
                  <td style={{ padding: "12px 16px", fontWeight: 500, color: GRAY_500, whiteSpace: "nowrap", fontFamily: "monospace", fontSize: 12 }}>{p.paymentRefId?.substring(0, 12)}…</td>
                  <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                    <span style={{ fontWeight: 700, color: TEAL, display: "inline-flex", alignItems: "center", gap: 4 }}>
                      {p.bookingId?.substring(0, 10)}… <ArrowUpRight size={12} />
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: 700, color: BLACK, whiteSpace: "nowrap" }}>₹ {p.amountPay}</td>
                  <td style={{ padding: "12px 16px", fontWeight: 500, color: GRAY_500, whiteSpace: "nowrap" }}>{p.fullName}</td>
                  <td style={{ padding: "12px 16px", fontWeight: 500, color: GRAY_500, whiteSpace: "nowrap" }}>{formatDate(p.receiptDate)}</td>
                  <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                    <span
                      style={{
                        display: "inline-block", fontSize: 11, fontWeight: 700,
                        padding: "3px 10px", borderRadius: 99,
                        backgroundColor: p.status === "Paid" ? "#f0fdf4" : "#fffbeb",
                        color: p.status === "Paid" ? GREEN : AMBER,
                        border: `1px solid ${p.status === "Paid" ? `${GREEN}25` : `${AMBER}25`}`,
                      }}
                    >
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filtered.length > ITEMS_PER_PAGE && (
        <div style={{ padding: "14px 22px", borderTop: "1.5px solid #EBEBEB" }}>
          <CustomPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
        </div>
      )}
    </div>
  );
};
