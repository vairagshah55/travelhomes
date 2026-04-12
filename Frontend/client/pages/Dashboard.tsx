import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogOverlay } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Eye,
  CheckSquare,
  ClipboardCheck,
  Wallet,
  MousePointer,
  Users,
  ArrowUpDown,
  MapPinOff,
  TrendingUp,
} from 'lucide-react';
import { Avatar } from '@/components/ui/avatar';
import { Sidebar } from '@/components/Navigation';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import { DashboardHeader } from '../components/Header';
import { bookingDetailsApi, vendorAnalyticsApi, BookingDetailDTO, VendorAnalyticsCounts, VendorAnalyticsGraphData } from '../lib/api';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { formatDate, format } from 'date-fns';

// ─── Brand teal ───────────────────────────────────────────────────────────────
const TEAL = '#3BD9DA';
const TEAL_SUBTLE = '#E8FAFA';

// ─── Stats Card ───────────────────────────────────────────────────────────────
const StatsCard = ({
  icon: Icon,
  title,
  value,
  sub,
}: {
  icon: React.ElementType;
  title: string;
  value: string;
  sub?: string;
}) => (
  <Card
    data-animate="kpi-card"
    data-animate-item
    className="border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 cursor-default group motion-kpi-card"
  >
    <CardContent className="p-4 flex items-start gap-3">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 transition-transform duration-200 group-hover:scale-110 motion-kpi-icon"
        style={{ background: TEAL_SUBTLE }}
      >
        <Icon size={18} style={{ color: TEAL }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">{title}</p>
        <p data-countup data-countup-duration="1200" className="text-xl font-bold text-gray-900 dark:text-white mt-0.5 tracking-tight">{value}</p>
        {sub && (
          <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-0.5 flex items-center gap-1">
            <TrendingUp size={10} />
            {sub}
          </p>
        )}
      </div>
    </CardContent>
  </Card>
);

// ─── Chart configs ────────────────────────────────────────────────────────────
const earningsChartConfig = {
  earnings: { label: 'Earnings', color: '#3BD9DA' },
} satisfies ChartConfig;

const visitorsChartConfig = {
  visitors: { label: 'Visitors', color: '#8B5CF6' },
} satisfies ChartConfig;

// ─── Booking Table ────────────────────────────────────────────────────────────
const BookingTable = ({
  title,
  data,
  loading,
}: {
  title: string;
  data: BookingDetailDTO[];
  loading: boolean;
}) => {
  const [selectedBooking, setSelectedBooking] = useState<BookingDetailDTO | null>(null);
  const [open, setOpen] = useState(false);

  const handleOpenModal = (booking: BookingDetailDTO) => {
    setSelectedBooking(booking);
    setOpen(true);
  };

  return (
    <div data-animate="section" className="space-y-4 motion-section-reveal">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">{title}</h3>
          <Select defaultValue="today">
            <SelectTrigger className="h-8 w-auto text-xs border-gray-200 dark:border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-sm font-semibold w-fit"
          style={{ color: TEAL }}
        >
          View All
        </Button>
      </div>

      <Card className="border border-gray-100 dark:border-gray-800 motion-surface-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50 dark:bg-gray-800/60">
              <TableRow className="border-gray-100 dark:border-gray-800">
                <TableHead className="font-semibold text-gray-700 dark:text-gray-300 text-xs uppercase tracking-wide min-w-[120px]">Booking ID</TableHead>
                <TableHead className="font-semibold text-gray-700 dark:text-gray-300 text-xs uppercase tracking-wide min-w-[140px]">Client</TableHead>
                <TableHead className="font-semibold text-gray-700 dark:text-gray-300 text-xs uppercase tracking-wide min-w-[120px]">Location</TableHead>
                <TableHead className="font-semibold text-gray-700 dark:text-gray-300 text-xs uppercase tracking-wide min-w-[140px]">
                  <div className="flex items-center gap-1.5">
                    Check In <ArrowUpDown size={12} className="text-gray-400 motion-sort-arrow" />
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-gray-700 dark:text-gray-300 text-xs uppercase tracking-wide min-w-[140px]">
                  <div className="flex items-center gap-1.5">
                    Check Out <ArrowUpDown size={12} className="text-gray-400 motion-sort-arrow" />
                  </div>
                </TableHead>
                <TableHead className="font-semibold text-gray-700 dark:text-gray-300 text-xs uppercase tracking-wide min-w-[90px]">Guests</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody data-animate-group="booking-rows" data-stagger="30">
              {loading && (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center">
                    <div className="flex justify-center items-center gap-2 text-gray-400">
                      <div className="h-5 w-5 motion-spinner" />
                      <span className="text-sm">Loading bookings…</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {!loading && data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-14 text-center">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <MapPinOff size={36} strokeWidth={1.5} />
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No bookings yet</p>
                      <p className="text-xs text-gray-400 dark:text-gray-600">Bookings from guests will appear here</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {data.map((booking, index) => (
                <TableRow
                  key={index}
                  data-animate="table-row"
                  data-animate-item
                  className="border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors cursor-pointer group motion-table-row"
                >
                  <TableCell>
                    <button
                      onClick={() => handleOpenModal(booking)}
                      className="text-sm font-semibold hover:underline transition-all"
                      style={{ color: TEAL }}
                    >
                      {booking.id}
                    </button>
                  </TableCell>
                  <TableCell className="text-sm text-gray-700 dark:text-gray-300">{booking.clientName}</TableCell>
                  <TableCell className="text-sm text-gray-500 dark:text-gray-400">{booking.location}</TableCell>
                  <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(booking.checkIn, 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                    {formatDate(booking.checkOut, 'dd MMM yyyy')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Users size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">{booking.guests}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Booking detail modal */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg w-full motion-modal-surface">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700 dark:text-gray-300">
              {[
                ['Booking ID', selectedBooking.id],
                ['Client Name', selectedBooking.clientName],
                ['Service Name', selectedBooking.serviceName],
                ['Check In', selectedBooking.checkIn],
                ['Check Out', selectedBooking.checkOut],
                ['Guests', selectedBooking.guests],
                ['Location', selectedBooking.location],
              ].map(([label, val]) => (
                <div key={label as string} className="flex flex-col gap-0.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">{label}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{val}</span>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Chart Card ───────────────────────────────────────────────────────────────
const ChartCard = ({
  title,
  config,
  dataKey,
  gradientId,
  data,
}: {
  title: string;
  config: ChartConfig;
  dataKey: string;
  gradientId: string;
  data: VendorAnalyticsGraphData[];
}) => {
  const color = (config[dataKey] as any)?.color ?? TEAL;
  return (
    <div data-animate="chart-card" data-animate-item className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 motion-surface-card">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h3>
        <Select defaultValue="month">
          <SelectTrigger className="h-7 w-auto text-xs border-gray-200 dark:border-gray-700 gap-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="h-[260px] w-full">
        <ChartContainer config={config} className="h-full w-full">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.2} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="rgba(107,114,128,0.15)" />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fill: '#9CA3AF', fontSize: 11 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tick={{ fill: '#9CA3AF', fontSize: 11 }}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={color}
              strokeWidth={2}
              fillOpacity={1}
              fill={`url(#${gradientId})`}
              dot={false}
              activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
            />
          </AreaChart>
        </ChartContainer>
      </div>
    </div>
  );
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const [stats, setStats] = useState<VendorAnalyticsCounts | null>(null);
  const [bookings, setBookings] = useState<BookingDetailDTO[]>([]);
  const [graphData, setGraphData] = useState<VendorAnalyticsGraphData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('travel_auth_token');
        setLoading(true);
        if (!token) {
          console.error('No auth token found');
          return;
        }

        const bookingParams: Record<string, any> = { mine: true };
        if (user?.userType === 'vendor' && user?.id) {
          bookingParams.vendorId = user.id;
        }

        const [statsRes, bookingsRes, graphsRes] = await Promise.all([
          vendorAnalyticsApi.getCounts(token),
          bookingDetailsApi.list(token, bookingParams),
          vendorAnalyticsApi.getGraphs(token),
        ]);

        if (statsRes.success) setStats(statsRes.data);
        if (bookingsRes.success) setBookings(bookingsRes.data);
        if (graphsRes.success) setGraphData(graphsRes.data);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchData();
  }, [user]);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const today = format(new Date(), 'EEEE, d MMMM yyyy');

  const statsItems = [
    { icon: Eye,           title: 'Impressions',       value: stats?.metrics?.impressions?.toLocaleString() ?? '—' },
    { icon: CheckSquare,   title: 'Total Bookings',     value: stats?.total?.toLocaleString() ?? '—' },
    { icon: ClipboardCheck,title: 'Listed Properties',  value: stats?.properties?.approved?.toLocaleString() ?? '—' },
    { icon: Wallet,        title: 'Total Earning',      value: `₹${stats?.payments?.received?.toLocaleString() ?? '0'}` },
    { icon: MousePointer,  title: 'Clicks',             value: stats?.metrics?.clicks?.toLocaleString() ?? '—' },
  ];

  return (
    <div className="flex h-screen bg-dashboard-bg dark:bg-gray-950 font-plus-jakarta motion-page-shell">
      {/* Sidebar */}
      <div className="hidden lg:block flex-shrink-0">
        <Sidebar isCollapsed={isCollapsed} onToggleCollapse={() => setIsCollapsed(p => !p)} />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader Headtitle="Dashboard" />

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-6 scrollbar-hide">
          {/* ── Greeting ── */}
          <div data-animate="section" className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1 motion-section-reveal">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white font-geist">
                {greeting}, {((user as any)?.name ?? user?.firstName ?? 'there').split(' ')[0]} 👋
              </h2>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">{today}</p>
            </div>
          </div>

          {/* ── Stats ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-7" data-animate-group="dashboard-stats" data-stagger="60">
            {statsItems.map((s) => (
              <StatsCard key={s.title} icon={s.icon} title={s.title} value={s.value} />
            ))}
          </div>

          {/* ── Charts ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-7" data-animate-group="dashboard-charts" data-stagger="100">
            <ChartCard
              title="Total Earnings"
              config={earningsChartConfig}
              dataKey="earnings"
              gradientId="fillEarnings"
              data={graphData}
            />
            <ChartCard
              title="Total Visitors"
              config={visitorsChartConfig}
              dataKey="visitors"
              gradientId="fillVisitors"
              data={graphData}
            />
          </div>

          {/* ── Bookings table ── */}
          <BookingTable title="Recent Bookings" data={bookings} loading={loading} />
        </main>
      </div>

      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onOpenChange={setIsChangePasswordOpen}
      />
    </div>
  );
};

export default Dashboard;
