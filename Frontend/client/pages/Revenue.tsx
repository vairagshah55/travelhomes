import React, { useState, useEffect } from "react";
import { Sidebar } from "@/components/Navigation";
import { DashboardHeader } from "@/components/Header";
import { vendorAnalyticsApi, bookingDetailsApi } from "@/lib/api";
import { StatCards, EarningsChart, PaymentTable } from "@/components/revenue";
import type { PaymentRecord } from "@/components/revenue";

// ─── Brand tokens (header only) ──────────────────────────────────────────────
const TEAL     = "#07e4e4";
const BLACK    = "#131313";
const GRAY_400 = "#9a9a9a";

const Revenue = () => {
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState({ totalEarnings: "0", totalPaymentReceived: "0", pendingPayment: "0" });
  const [chartData, setChartData] = useState<{ month: string; value: number }[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);

  useEffect(() => {
    const load = async () => {
      const token = localStorage.getItem("travel_auth_token");
      if (!token) return;
      setLoading(true);
      try {
        const counts = await vendorAnalyticsApi.getCounts(token);
        if (counts.success && counts.data.payments) {
          const received = counts.data.payments.received || 0;
          const pending = counts.data.payments.pending || 0;
          setRevenueData({
            totalEarnings: (received + pending).toLocaleString("en-IN"),
            totalPaymentReceived: received.toLocaleString("en-IN"),
            pendingPayment: pending.toLocaleString("en-IN"),
          });
        }

        const graphs = await vendorAnalyticsApi.getGraphs(token, "monthly");
        if (graphs.success) {
          setChartData(graphs.data.map((g: any) => ({ month: g.name.substring(0, 3), value: g.earnings })));
        } else {
          setChartData(["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m) => ({ month: m, value: 0 })));
        }

        const bk = await bookingDetailsApi.list(token);
        if (bk.success && (bk as any).data) {
          setPaymentHistory((bk as any).data.map((b: any) => ({
            paymentMethod: "Razorpay",
            paymentRefId: b.id,
            bookingId: b.id,
            amountPay: b.servicePrice || "0",
            fullName: b.clientName,
            receiptDate: b.checkIn ? (b.checkIn.includes(",") ? b.checkIn.split(",")[0] : b.checkIn) : "N/A",
            status: b.status === "confirmed" || b.status === "active" ? "Paid" : "Pending",
          })));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="flex h-screen w-full bg-gray-50 dark:bg-gray-900 font-plus-jakarta overflow-hidden">
      <div className="hidden lg:block"><Sidebar /></div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader Headtitle="Revenue" />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">

            {/* Page header */}
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <div style={{ width: 20, height: 3, borderRadius: 99, backgroundColor: TEAL }} />
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: GRAY_400 }}>Dashboard</span>
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: BLACK, letterSpacing: "-0.03em" }}>Revenue Overview</h1>
            </div>

            <StatCards loading={loading} data={revenueData} />
            <EarningsChart loading={loading} chartData={chartData} totalEarnings={revenueData.totalEarnings} />
            <PaymentTable loading={loading} data={paymentHistory} />

          </div>
        </main>
      </div>
    </div>
  );
};

export default Revenue;
