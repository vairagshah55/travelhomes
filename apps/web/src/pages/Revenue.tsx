import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock3, IndianRupee, Receipt, Wallet } from "lucide-react";
import { vendorAnalyticsApi, bookingDetailsApi } from "@/lib/api";
import DashboardLayout from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { BRAND_VARS, StatTile, StatTileSkeleton } from "@/components/shared";
import { EarningsChart, PaymentTable, inr, toAmount } from "@/components/revenue";
import type { ChartItem, PaymentRecord } from "@/components/revenue";

/**
 * Turn a failed request into something a vendor can act on.
 *
 * `/api/bookingDetails` answers 403 "Vendor not found" when the signed-in
 * account has no Vendor record — a JWT stays valid across a database switch,
 * so a stale session looks exactly like a server fault otherwise.
 */
const reasonFor = (error: unknown): string | undefined => {
  if (!error) return undefined;
  const status = (error as { status?: number }).status;
  const message = (error as Error).message;
  if (status === 401) return "Your session has expired. Sign in again to see this.";
  if (status === 403) {
    return message?.toLowerCase().includes("vendor not found")
      ? "This account isn't linked to a vendor profile, so there's nothing to show. Sign in with your vendor account."
      : message || "You don't have access to this.";
  }
  return message || undefined;
};

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
      subtitle="What you've earned, what's already settled, and what's still on its way."
    >
      <div style={BRAND_VARS} className="space-y-5 md:space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
          {countsQuery.isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <StatTileSkeleton key={i} />)
          ) : (
            <>
              <StatTile
                index={0}
                icon={IndianRupee}
                label="Gross earnings"
                value={totals.total}
                format={inr}
                hint="Received plus pending"
              />
              <StatTile
                index={1}
                icon={Wallet}
                label="Settled"
                value={totals.received}
                format={inr}
                hint={
                  totals.total > 0
                    ? `${Math.round((totals.received / totals.total) * 100)}% of gross`
                    : "Nothing settled yet"
                }
              />
              <StatTile
                index={2}
                icon={Clock3}
                label="Awaiting settlement"
                value={totals.pending}
                format={inr}
                hint={totals.pending > 0 ? "Paid by guests, not yet paid out" : "Nothing outstanding"}
              />
              {/* Average transaction is the number that tells a vendor whether
                  to price up or sell more nights — gross alone conflates the
                  two. Derived from the payments list already on the page. */}
              <StatTile
                index={3}
                icon={Receipt}
                label="Avg transaction"
                value={
                  payments.length
                    ? Math.round(payments.reduce((s, p) => s + p.amount, 0) / payments.length)
                    : 0
                }
                format={inr}
                hint={`Across ${payments.length} booking${payments.length === 1 ? "" : "s"}`}
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
          errorMessage={reasonFor(graphsQuery.error)}
          onRetry={() => graphsQuery.refetch()}
        />

        <PaymentTable
          loading={bookingsQuery.isLoading}
          isError={bookingsQuery.isError}
          errorMessage={reasonFor(bookingsQuery.error)}
          onRetry={() => bookingsQuery.refetch()}
          data={payments}
        />
      </div>
    </DashboardLayout>
  );
};

export default Revenue;
