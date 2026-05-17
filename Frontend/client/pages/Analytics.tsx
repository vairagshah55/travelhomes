import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, MousePointer, ClipboardCheck, ListChecks, Wallet, TrendingUp } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { vendorAnalyticsApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface MetricCard {
  title: string;
  value: string;
  icon: React.ReactNode;
  bgColor: string;
  iconBgColor: string;
}

const Analytics = () => {
  const Sk = ({ className = "" }: { className?: string }) => (
    <div className={`animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800 ${className}`} />
  );

  // Filters
  const [monthlyFilter, setMonthlyFilter] = useState("monthly");
  const [yearlyFilter, setYearlyFilter] = useState("yearly");
  const [dailyFilter, setDailyFilter] = useState("daily");

  const { token: authToken } = useAuth();
  const token = authToken ?? undefined;

  // Counts + metrics + payments + properties — single endpoint, single cache.
  const countsQuery = useQuery({
    queryKey: ["analytics", "counts"],
    queryFn: async () => {
      const res = await vendorAnalyticsApi.getCounts(token);
      return res?.success && res.data ? res.data : null;
    },
  });

  // Three separate graph queries keyed by their filter so flipping
  // monthly/yearly/daily refetches only that bucket.
  const monthlyQuery = useQuery<any[]>({
    queryKey: ["analytics", "graphs", "monthly", monthlyFilter],
    queryFn: async () => {
      const res = await vendorAnalyticsApi.getGraphs(token, monthlyFilter);
      return res.success && res.data ? res.data : [];
    },
  });
  const yearlyQuery = useQuery<any[]>({
    queryKey: ["analytics", "graphs", "yearly", yearlyFilter],
    queryFn: async () => {
      const res = await vendorAnalyticsApi.getGraphs(token, yearlyFilter);
      return res.success && res.data ? res.data : [];
    },
  });
  const dailyQuery = useQuery<any[]>({
    queryKey: ["analytics", "graphs", "daily", dailyFilter],
    queryFn: async () => {
      const res = await vendorAnalyticsApi.getGraphs(token, dailyFilter);
      return res.success && res.data ? res.data : [];
    },
  });

  const counts = {
    total: countsQuery.data?.total ?? 0,
    upcoming: countsQuery.data?.upcoming ?? 0,
    past: countsQuery.data?.past ?? 0,
    cancelled: countsQuery.data?.cancelled ?? 0,
  };
  const impressions = countsQuery.data?.metrics?.impressions ?? 0;
  const clicks = countsQuery.data?.metrics?.clicks ?? 0;
  const payments = countsQuery.data?.payments ?? { received: 0, pending: 0 };
  const properties = countsQuery.data?.properties ?? { approved: 0, pending: 0 };
  const monthlyGraphData = monthlyQuery.data ?? [];
  const yearlyGraphData = yearlyQuery.data ?? [];
  const dailyGraphData = dailyQuery.data ?? [];
  const loading = countsQuery.isLoading;

  const topRowMetrics: MetricCard[] = [
    {
      title: "Impression",
      value: String(impressions),
      icon: <Eye size={20} style={{ color: "#3BD9DA" }} />,
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      iconBgColor: "bg-orange-100 dark:bg-orange-800/30",
    },
    {
      title: "Clicked",
      value: String(clicks),
      icon: <MousePointer size={20} style={{ color: "#3BD9DA" }} />,
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      iconBgColor: "bg-purple-100 dark:bg-purple-800/30",
    },
    {
      title: "No. of Payment Received",
      value: String(payments.received),
      icon: <ClipboardCheck size={20} style={{ color: "#3BD9DA" }} />,
      bgColor: "bg-cyan-50 dark:bg-cyan-900/20",
      iconBgColor: "bg-cyan-100 dark:bg-cyan-800/30",
    },
    {
      title: "No. of Payment Pending",
      value: String(payments.pending),
      icon: <ListChecks size={20} style={{ color: "#3BD9DA" }} />,
      bgColor: "bg-red-50 dark:bg-red-900/20",
      iconBgColor: "bg-red-100 dark:bg-red-800/30",
    },
  ];

  const bottomRowMetrics: MetricCard[] = [
    {
      title: "Total Booking",
      value: String(counts.total),
      icon: <Wallet size={20} style={{ color: "#3BD9DA" }} />,
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      iconBgColor: "bg-purple-100 dark:bg-purple-800/30",
    },
    {
      title: "Upcoming Booking",
      value: String(counts.upcoming),
      icon: <ClipboardCheck size={20} style={{ color: "#3BD9DA" }} />,
      bgColor: "bg-cyan-50 dark:bg-cyan-900/20",
      iconBgColor: "bg-cyan-100 dark:bg-cyan-800/30",
    },
    {
      title: "Past Booking",
      value: String(counts.past),
      icon: <ListChecks size={20} style={{ color: "#3BD9DA" }} />,
      bgColor: "bg-green-50 dark:bg-green-900/20",
      iconBgColor: "bg-green-100 dark:bg-green-800/30",
    },
    {
      title: "Cancelled Booking",
      value: String(counts.cancelled),
      icon: <Wallet size={20} style={{ color: "#3BD9DA" }} />,
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      iconBgColor: "bg-purple-100 dark:bg-purple-800/30",
    },
  ];

  const secondBottomRowMetrics: MetricCard[] = [
    {
      title: "Approved Property Listing",
      value: String(properties.approved),
      icon: <Eye size={20} style={{ color: "#3BD9DA" }} />,
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      iconBgColor: "bg-orange-100 dark:bg-orange-800/30",
    },
    {
      title: "Pending Property for Approval",
      value: String(properties.pending),
      icon: <Eye size={20} style={{ color: "#3BD9DA" }} />,
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      iconBgColor: "bg-orange-100 dark:bg-orange-800/30",
    },
  ];

  const MetricCardComponent = ({ metric }: { metric: MetricCard }) => (
    <div
      data-animate="kpi-card"
      data-animate-item
      className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group motion-kpi-card"
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 transition-transform duration-200 group-hover:scale-110 motion-kpi-icon"
          style={{ background: "#E8FAFA" }}
        >
          {metric.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">
            {metric.title}
          </p>
          <p
            data-countup
            data-countup-duration="1200"
            className="text-xl font-bold text-gray-900 dark:text-white mt-0.5 tracking-tight font-geist"
          >
            {metric.value}
          </p>
        </div>
      </div>
    </div>
  );

  const ChartComponent = ({
    title,
    filter,
    onFilterChange,
    data,
    dataKey,
    color = "#334054",
  }: {
    title: string;
    filter: string;
    onFilterChange: (value: string) => void;
    data: any[];
    dataKey: string;
    color?: string;
  }) => (
    <div
      data-animate="chart-card"
      data-animate-item
      className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 hover:shadow-md transition-all duration-200 motion-surface-card"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 font-plus-jakarta">
          {title}
        </h3>
        <Select value={filter} onValueChange={onFilterChange}>
          <SelectTrigger className="w-24 h-7 text-xs bg-gray-100 dark:bg-gray-700 border-none">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="daily">Daily</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="monthly">Monthly</SelectItem>
            <SelectItem value="yearly">Yearly</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="h-48 relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{
              top: 10,
              right: 10,
              left: 0,
              bottom: 0,
            }}
          >
            <defs>
              <linearGradient
                id={`color${dataKey}${title.replace(/\s/g, "")}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "#6B7280" }}
              interval="preserveStartEnd"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: "#6B7280" }}
              width={30}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "none",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
            />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#color${dataKey}${title.replace(/\s/g, "")})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <DashboardLayout
      title="Analytics"
      outerClassName="motion-page-shell"
      contentClassName="flex-1 overflow-y-auto scrollbar-hide p-4 lg:p-6"
    >
      <div className="max-w-7xl mx-auto space-y-6">
        {/* All Metrics — single unified grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {loading
            ? Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 flex items-start gap-3"
                >
                  <Sk className="w-10 h-10 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <Sk className="h-3 w-20" />
                    <Sk className="h-6 w-14" />
                  </div>
                </div>
              ))
            : [...topRowMetrics, ...bottomRowMetrics, ...secondBottomRowMetrics].map(
                (metric, index) => <MetricCardComponent key={index} metric={metric} />,
              )}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {loading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5"
              >
                <div className="flex items-center justify-between mb-4">
                  <Sk className="h-5 w-36" />
                  <Sk className="h-7 w-24 rounded-lg" />
                </div>
                <Sk className="h-48 w-full" />
              </div>
            ))
          ) : (
            <>
              <ChartComponent
                title="Monthly Earnings"
                filter={monthlyFilter}
                onFilterChange={setMonthlyFilter}
                data={monthlyGraphData}
                dataKey="earnings"
                color="#3BD9DA"
              />
              <ChartComponent
                title="Yearly Earnings"
                filter={yearlyFilter}
                onFilterChange={setYearlyFilter}
                data={yearlyGraphData}
                dataKey="earnings"
                color="#8B5CF6"
              />
            </>
          )}
        </div>

        {/* Visitors chart full width */}
        {loading ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <Sk className="h-5 w-36" />
              <Sk className="h-7 w-24 rounded-lg" />
            </div>
            <Sk className="h-48 w-full" />
          </div>
        ) : (
          <ChartComponent
            title="Daily Visitors"
            filter={dailyFilter}
            onFilterChange={setDailyFilter}
            data={dailyGraphData}
            dataKey="visitors"
            color="#3BD9DA"
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default Analytics;
