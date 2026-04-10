import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Bell,
  Menu,
  Plus,
  Eye,
  MousePointer,
  ClipboardCheck,
  ListChecks,
  Wallet,
  TrendingUp,
  ChevronDown,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sidebar } from "@/components/Navigation";
import ProfileDropdown from "@/components/ProfileDropdown";
import MobileVendorNav from "@/components/MobileVendorNav";
import { DashboardHeader } from "@/components/Header";
import { vendorAnalyticsApi } from "@/lib/api";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

interface MetricCard {
  title: string;
  value: string;
  icon: React.ReactNode;
  bgColor: string;
  iconBgColor: string;
}

const Analytics = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Filters
  const [monthlyFilter, setMonthlyFilter] = useState("monthly");
  const [yearlyFilter, setYearlyFilter] = useState("yearly");
  const [dailyFilter, setDailyFilter] = useState("daily");

  // Data for charts
  const [monthlyGraphData, setMonthlyGraphData] = useState<any[]>([]);
  const [yearlyGraphData, setYearlyGraphData] = useState<any[]>([]);
  const [dailyGraphData, setDailyGraphData] = useState<any[]>([]);

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const [counts, setCounts] = useState({ total: 0, upcoming: 0, past: 0, cancelled: 0 });
  const [impressions, setImpressions] = useState(0);
  const [clicks, setClicks] = useState(0);
  const [payments, setPayments] = useState({ received: 0, pending: 0 });
  const [properties, setProperties] = useState({ approved: 0, pending: 0 });

  // Initial Data Fetch
  useEffect(() => {
    let mounted = true;
    const token = localStorage.getItem('travel_auth_token') || undefined;
    
    vendorAnalyticsApi
      .getCounts(token)
      .then((res) => {
        if (!mounted || !res?.success || !res.data) return;
        setCounts({ total: res.data.total, upcoming: res.data.upcoming, past: res.data.past, cancelled: res.data.cancelled });
        if (res.data.metrics) {
          setImpressions(res.data.metrics.impressions || 0);
          setClicks(res.data.metrics.clicks || 0);
        }
        if (res.data.payments) setPayments(res.data.payments);
        if (res.data.properties) setProperties(res.data.properties);
      })
      .catch((err) => console.error("Error fetching counts:", err))
      .finally(() => {});
      
    return () => {
      mounted = false;
    };
  }, []);

  // Fetch Monthly Graph
  useEffect(() => {
    const token = localStorage.getItem('travel_auth_token') || undefined;
    vendorAnalyticsApi.getGraphs(token, monthlyFilter).then(res => {
      if (res.success && res.data) {
        setMonthlyGraphData(res.data);
      }
    }).catch(err => console.error(err));
  }, [monthlyFilter]);

  // Fetch Yearly Graph
  useEffect(() => {
    const token = localStorage.getItem('travel_auth_token') || undefined;
    vendorAnalyticsApi.getGraphs(token, yearlyFilter).then(res => {
      if (res.success && res.data) {
        setYearlyGraphData(res.data);
      }
    }).catch(err => console.error(err));
  }, [yearlyFilter]);

  // Fetch Daily Graph
  useEffect(() => {
    const token = localStorage.getItem('travel_auth_token') || undefined;
    vendorAnalyticsApi.getGraphs(token, dailyFilter).then(res => {
      if (res.success && res.data) {
        setDailyGraphData(res.data);
      }
    }).catch(err => console.error(err));
  }, [dailyFilter]);

  const topRowMetrics: MetricCard[] = [
    {
      title: "Impression",
      value: String(impressions),
      icon: <Eye size={20} className="text-dashboard-primary" />,
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      iconBgColor: "bg-orange-100 dark:bg-orange-800/30",
    },
    {
      title: "Clicked",
      value: String(clicks),
      icon: <MousePointer size={20} className="text-dashboard-primary" />,
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      iconBgColor: "bg-purple-100 dark:bg-purple-800/30",
    },
    {
      title: "No. of Payment Received",
      value: String(payments.received),
      icon: <ClipboardCheck size={20} className="text-dashboard-primary" />,
      bgColor: "bg-cyan-50 dark:bg-cyan-900/20",
      iconBgColor: "bg-cyan-100 dark:bg-cyan-800/30",
    },
    {
      title: "No. of Payment Pending",
      value: String(payments.pending),
      icon: <ListChecks size={20} className="text-dashboard-primary" />,
      bgColor: "bg-red-50 dark:bg-red-900/20",
      iconBgColor: "bg-red-100 dark:bg-red-800/30",
    },
  ];

  const bottomRowMetrics: MetricCard[] = [
    {
      title: "Total Booking",
      value: String(counts.total),
      icon: <Wallet size={20} className="text-dashboard-primary" />,
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      iconBgColor: "bg-purple-100 dark:bg-purple-800/30",
    },
    {
      title: "Upcoming Booking",
      value: String(counts.upcoming),
      icon: <ClipboardCheck size={20} className="text-dashboard-primary" />,
      bgColor: "bg-cyan-50 dark:bg-cyan-900/20",
      iconBgColor: "bg-cyan-100 dark:bg-cyan-800/30",
    },
    {
      title: "Past Booking",
      value: String(counts.past),
      icon: <ListChecks size={20} className="text-dashboard-primary" />,
      bgColor: "bg-green-50 dark:bg-green-900/20",
      iconBgColor: "bg-green-100 dark:bg-green-800/30",
    },
    {
      title: "Cancelled Booking",
      value: String(counts.cancelled),
      icon: <Wallet size={20} className="text-dashboard-primary" />,
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      iconBgColor: "bg-purple-100 dark:bg-purple-800/30",
    },
  ];

  const secondBottomRowMetrics: MetricCard[] = [
    {
      title: "Approved Property Listing",
      value: String(properties.approved),
      icon: <Eye size={20} className="text-dashboard-primary" />,
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      iconBgColor: "bg-orange-100 dark:bg-orange-800/30",
    },
    {
      title: "Pending Property for Approval",
      value: String(properties.pending),
      icon: <Eye size={20} className="text-dashboard-primary" />,
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
      iconBgColor: "bg-orange-100 dark:bg-orange-800/30",
    },
  ];

  const MetricCardComponent = ({ metric }: { metric: MetricCard }) => (
    <div
      className={`p-4 rounded-xl ${metric.bgColor} border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer group`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-12 h-12 rounded-full ${metric.iconBgColor} flex items-center justify-center group-hover:scale-110 transition-transform`}
        >
          {metric.icon}
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-600 dark:text-gray-400 font-plus-jakarta mb-2">
            {metric.title}
          </p>
          <p className="text-2xl font-bold text-dashboard-primary dark:text-white font-geist">
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
    color = "#334054"
  }: {
    title: string;
    filter: string;
    onFilterChange: (value: string) => void;
    data: any[];
    dataKey: string;
    color?: string;
  }) => (
    <div className="bg-white dark:bg-gray-800 border border-dashboard-stroke dark:border-gray-600 rounded-xl p-5 hover:shadow-md transition-all">
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
              <linearGradient id={`color${dataKey}${title.replace(/\s/g,'')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
                dataKey="name" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#6B7280' }}
                interval="preserveStartEnd"
            />
            <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#6B7280' }}
                width={30}
            />
            <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Area 
                type="monotone" 
                dataKey={dataKey} 
                stroke={color} 
                strokeWidth={2}
                fillOpacity={1} 
                fill={`url(#color${dataKey}${title.replace(/\s/g,'')})`} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-dashboard-bg dark:bg-gray-900 font-plus-jakarta">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <DashboardHeader Headtitle={"Analytics"} />

        {/* Content Area */}
        <div className="flex-1 flex flex-col pr-5 pb-5 overflow-y-auto scrollbar-hide">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-dashboard-stroke dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-3xl">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-dashboard-title dark:text-white font-plus-jakarta">
                Overview
              </h2>
            </div>
           
          </div>

          {/* Content */}
          <div className="flex-1 p-5 bg-white dark:bg-gray-800 rounded-b-3xl ">
            <div className="max-w-7xl mx-auto space-y-8">
              {/* Top Row Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {topRowMetrics.map((metric, index) => (
                  <MetricCardComponent key={index} metric={metric} />
                ))}
              </div>

              {/* Second Row Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {bottomRowMetrics.map((metric, index) => (
                  <MetricCardComponent key={index} metric={metric} />
                ))}
              </div>

              {/* Third Row Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {secondBottomRowMetrics.map((metric, index) => (
                  <MetricCardComponent key={index} metric={metric} />
                ))}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartComponent
                  title="Total Earnings"
                  filter={monthlyFilter}
                  onFilterChange={setMonthlyFilter}
                  data={monthlyGraphData}
                  dataKey="earnings"
                  color="#2563eb"
                />
                <ChartComponent
                  title="Total Earnings"
                  filter={yearlyFilter}
                  onFilterChange={setYearlyFilter}
                  data={yearlyGraphData}
                  dataKey="earnings"
                  color="#2563eb"
                />
              </div>

              {/* Single Chart */}
              <div className="grid grid-cols-1">
                <ChartComponent
                  title="Total Visitor"
                  filter={dailyFilter}
                  onFilterChange={setDailyFilter}
                  data={dailyGraphData}
                  dataKey="visitors"
                  color="#0ea5e9"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed lg:hidden ">
        <MobileVendorNav />
      </div>
    </div>
  );
};

export default Analytics;
