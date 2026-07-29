import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock3, IndianRupee, Wallet } from "lucide-react";
import { vendorAnalyticsApi, bookingDetailsApi } from "@/lib/api";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { BRAND_VARS, StatTile, StatTileSkeleton } from "@/components/shared";
import { EarningsChart, PaymentTable, inr, toAmount } from "@/components/revenue";
import type { ChartItem, PaymentRecord } from "@/components/revenue";

const Revenue = () => {
  const { token: authToken } = useAuth();
  const token = authToken ?? undefined;
  const enabled = !!token;

  /** Chart period — the server accepts daily | monthly | yearly. */
  const [period, setPeriod] = useState("monthly");

  // Three independent queries — counts (payments), earnings graph, and the
  // bookings list. Each is cached so navigating away and back doesn't re-hit
  // the API, and each renders its own loading/error state rather than one
  // page-wide flag that blocked everything on the slowest request.
  const countsQuery = useQuery({
    queryKey: ["revenue", "counts"],
    enabled,
    queryFn: async () => {
      const res = await vendorAnalyticsApi.getCounts(token!);
      return res.success ? res.data : null;
    },
  });
  const graphsQuery = useQuery({
    queryKey: ["revenue", "graphs", period],
    enabled,
    queryFn: async () => {
      const res = await vendorAnalyticsApi.getGraphs(token!, period);
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

  const totals = useMemo(() => {
    const payments = countsQuery.data?.payments;
    const received = payments?.received || 0;
    const pending = payments?.pending || 0;
    return { received, pending, total: received + pending };
  }, [countsQuery.data]);

  /**
   * No synthetic 12-month fallback. The old page padded a failed or empty
   * response with twelve ₹0 months, which drew a flat line indistinguishable
   * from a real quiet year — on a revenue page that reads as "you earned
   * nothing" rather than "we couldn't load this".
   */
  const chartData: ChartItem[] = useMemo(
    () =>
      (graphsQuery.data ?? []).map((g: any) => ({
        month: String(g.name ?? "").substring(0, 3),
        value: g.earnings ?? 0,
      })),
    [graphsQuery.data],
  );

  /**
   * The booking list has no payment method or payment reference — the old table
   * hardcoded `paymentMethod: "Razorpay"` on every row and put the booking id in
   * the "Payment Ref ID" column, so two columns showed the same value and one of
   * them was invented. Dropped both in favour of fields the API actually returns.
   */
  const payments: PaymentRecord[] = useMemo(
    () =>
      (bookingsQuery.data ?? []).map((b: any) => ({
        bookingId: b.id,
        guest: b.clientName,
        service: b.serviceName,
        amount: toAmount(b.servicePrice),
        date: b.checkIn,
        status: b.status === "confirmed" || b.status === "active" ? "paid" : "pending",
      })),
    [bookingsQuery.data],
  );

  return (
    <DashboardLayout
      title="Revenue"
      contentClassName="flex-1 overflow-y-auto scrollbar-hide p-4 lg:p-6 bg-muted/40 dark:bg-transparent"
    >
      {/* pb clears the fixed MobileVendorNav on small screens. */}
      <div style={BRAND_VARS} className="max-w-6xl mx-auto space-y-5 pb-24 lg:pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {countsQuery.isLoading ? (
            Array.from({ length: 3 }).map((_, i) => <StatTileSkeleton key={i} />)
          ) : (
            <>
              <StatTile
                index={0}
                icon={IndianRupee}
                label="Total earnings"
                value={totals.total}
                format={inr}
                hint="Received plus pending"
                color="#0d9488"
              />
              <StatTile
                index={1}
                icon={Wallet}
                label="Payment received"
                value={totals.received}
                format={inr}
                hint="Settled to your account"
                color="#22c55e"
              />
              <StatTile
                index={2}
                icon={Clock3}
                label="Pending payment"
                value={totals.pending}
                format={inr}
                hint="Awaiting settlement"
                color="#f59e0b"
              />
            </>
          )}
        </div>

        <EarningsChart
          chartData={chartData}
          period={period}
          onPeriodChange={setPeriod}
          isLoading={graphsQuery.isLoading}
          isError={graphsQuery.isError}
          onRetry={() => graphsQuery.refetch()}
        />

        <PaymentTable
          loading={bookingsQuery.isLoading}
          isError={bookingsQuery.isError}
          onRetry={() => bookingsQuery.refetch()}
          data={payments}
        />
      </div>
    </DashboardLayout>
  );
};

export default Revenue;
