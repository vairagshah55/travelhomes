import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/Navigation";
import { DashboardHeader } from "@/components/Header";
import { vendorAnalyticsApi, bookingDetailsApi } from "@/lib/api";
import { StatCards, EarningsChart, PaymentTable } from "@/components/revenue";
import type { PaymentRecord } from "@/components/revenue";

// ─── Brand tokens (header only) ──────────────────────────────────────────────
const TEAL = "#07e4e4";
const BLACK = "#131313";
const GRAY_400 = "#9a9a9a";

const Revenue = () => {
  const token =
    typeof window !== "undefined"
      ? (localStorage.getItem("travel_auth_token") ?? undefined)
      : undefined;
  const enabled = !!token;

  // Three independent queries — counts (payments), monthly graphs, and
  // bookings list. Each is cached so navigating away and back doesn't
  // re-hit the API.
  const countsQuery = useQuery({
    queryKey: ["revenue", "counts"],
    enabled,
    queryFn: async () => {
      const res = await vendorAnalyticsApi.getCounts(token!);
      return res.success ? res.data : null;
    },
  });
  const graphsQuery = useQuery({
    queryKey: ["revenue", "graphs", "monthly"],
    enabled,
    queryFn: async () => {
      const res = await vendorAnalyticsApi.getGraphs(token!, "monthly");
      return res.success ? res.data : [];
    },
  });
  const bookingsQuery = useQuery({
    queryKey: ["revenue", "bookings"],
    enabled,
    queryFn: async () => {
      const res = await bookingDetailsApi.list(token!);
      return res.success ? (res as any).data : [];
    },
  });

  const revenueData = (() => {
    const payments = countsQuery.data?.payments;
    if (!payments) return { totalEarnings: "0", totalPaymentReceived: "0", pendingPayment: "0" };
    const received = payments.received || 0;
    const pending = payments.pending || 0;
    return {
      totalEarnings: (received + pending).toLocaleString("en-IN"),
      totalPaymentReceived: received.toLocaleString("en-IN"),
      pendingPayment: pending.toLocaleString("en-IN"),
    };
  })();

  const chartData: { month: string; value: number }[] = (() => {
    const data = graphsQuery.data;
    if (data && data.length > 0) {
      return data.map((g: any) => ({ month: g.name.substring(0, 3), value: g.earnings }));
    }
    return ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map(
      (m) => ({ month: m, value: 0 }),
    );
  })();

  const paymentHistory: PaymentRecord[] = (bookingsQuery.data ?? []).map((b: any) => ({
    paymentMethod: "Razorpay",
    paymentRefId: b.id,
    bookingId: b.id,
    amountPay: b.servicePrice || "0",
    fullName: b.clientName,
    receiptDate: b.checkIn
      ? b.checkIn.includes(",")
        ? b.checkIn.split(",")[0]
        : b.checkIn
      : "N/A",
    status: b.status === "confirmed" || b.status === "active" ? "Paid" : "Pending",
  }));

  const loading = countsQuery.isLoading || graphsQuery.isLoading || bookingsQuery.isLoading;

  return (
    <div className="flex h-screen w-full bg-gray-50 dark:bg-gray-900 font-plus-jakarta overflow-hidden">
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader Headtitle="Revenue" />

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-6">
            {/* Page header */}
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <div style={{ width: 20, height: 3, borderRadius: 99, backgroundColor: TEAL }} />
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: GRAY_400,
                  }}
                >
                  Dashboard
                </span>
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: BLACK, letterSpacing: "-0.03em" }}>
                Revenue Overview
              </h1>
            </div>

            <StatCards loading={loading} data={revenueData} />
            <EarningsChart
              loading={loading}
              chartData={chartData}
              totalEarnings={revenueData.totalEarnings}
            />
            <PaymentTable loading={loading} data={paymentHistory} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Revenue;
