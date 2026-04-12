import React from "react";
import { IndianRupee, TrendingUp, Calendar } from "lucide-react";
import { TEAL, BLACK, GRAY_400, WHITE, GREEN, AMBER } from "./tokens";

/* ─── Skeleton ────────────────────────────────────────────────────────────── */
const Sk = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800 ${className}`} />
);

/* ─── Single stat card ────────────────────────────────────────────────────── */
const StatCard = ({ label, value, icon: Icon, color }: {
  label: string; value: string; icon: React.ElementType; color: string;
}) => (
  <div
    style={{
      backgroundColor: WHITE,
      border: "1.5px solid #EBEBEB",
      borderRadius: 20,
      padding: "20px 22px",
      boxShadow: "0 2px 12px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)",
      transition: "all 0.2s",
    }}
    onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)"; }}
    onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)"; }}
  >
    <div className="flex items-start gap-3">
      <div
        style={{
          width: 42, height: 42, borderRadius: 13,
          backgroundColor: `${color}12`,
          border: `1.5px solid ${color}25`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={18} color={color} strokeWidth={2.5} />
      </div>
      <div>
        <p style={{ fontSize: 12, fontWeight: 600, color: GRAY_400, textTransform: "uppercase", letterSpacing: "0.03em" }}>{label}</p>
        <p style={{ fontSize: 22, fontWeight: 800, color: BLACK, letterSpacing: "-0.02em", marginTop: 2 }}>{value}</p>
      </div>
    </div>
  </div>
);

/* ─── Exported grid ───────────────────────────────────────────────────────── */
interface RevenueData {
  totalEarnings: string;
  totalPaymentReceived: string;
  pendingPayment: string;
}

export const StatCards: React.FC<{ loading: boolean; data: RevenueData }> = ({ loading, data }) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
    {loading ? (
      Array.from({ length: 3 }).map((_, i) => (
        <div key={i} style={{ backgroundColor: WHITE, border: "1.5px solid #EBEBEB", borderRadius: 20, padding: "20px 22px" }}>
          <div className="flex items-start gap-3">
            <Sk className="w-[42px] h-[42px] rounded-[13px] shrink-0" />
            <div className="flex-1 space-y-2 pt-1"><Sk className="h-3 w-24" /><Sk className="h-6 w-28" /></div>
          </div>
        </div>
      ))
    ) : (
      <>
        <StatCard label="Total Earnings" value={`₹ ${data.totalEarnings}`} icon={IndianRupee} color={TEAL} />
        <StatCard label="Payment Received" value={`₹ ${data.totalPaymentReceived}`} icon={TrendingUp} color={GREEN} />
        <StatCard label="Pending Payment" value={`₹ ${data.pendingPayment}`} icon={Calendar} color={AMBER} />
      </>
    )}
  </div>
);
