import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Eye, CheckSquare, ClipboardCheck, Wallet, MousePointer,
  Users, ArrowUpDown, MapPinOff, Plus, Calendar, ChevronRight,
  Clock, Sparkles, ArrowRight,
} from 'lucide-react';
import { Sidebar } from '@/components/Navigation';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import { DashboardHeader } from '../components/Header';
import {
  bookingDetailsApi, vendorAnalyticsApi,
  BookingDetailDTO, VendorAnalyticsCounts, VendorAnalyticsGraphData,
} from '../lib/api';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { formatDate, format, isPast, isFuture } from 'date-fns';

const TEAL  = '#3BD9DA';
const TEAL2 = '#2bc5c6';

// ─── helpers ──────────────────────────────────────────────────────────────────
const Sk = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800/80 ${className}`} />
);

const bookingStatus = (checkIn: string, checkOut: string) => {
  if (isFuture(new Date(checkIn)))  return { label: 'Upcoming',  dot: 'bg-blue-400',    pill: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' };
  if (isPast(new Date(checkOut)))   return { label: 'Completed', dot: 'bg-emerald-400',  pill: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' };
  return                                   { label: 'Ongoing',   dot: 'bg-amber-400',    pill: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' };
};

const initials  = (n: string) => n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
const avatarCls = (n: string) => (['bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300','bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300','bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300','bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300','bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300'] as const)[n.charCodeAt(0) % 5];

// ─── chart configs ─────────────────────────────────────────────────────────────
const earningsConfig = { earnings: { label: 'Earnings', color: TEAL      } } satisfies ChartConfig;
const visitorsConfig = { visitors: { label: 'Visitors', color: '#8B5CF6' } } satisfies ChartConfig;

// ─── ChartCard ────────────────────────────────────────────────────────────────
const ChartCard = ({ title, config, dataKey, gradientId, data, loading }: {
  title: string; config: ChartConfig; dataKey: string;
  gradientId: string; data: VendorAnalyticsGraphData[]; loading: boolean;
}) => {
  const color = (config[dataKey] as any)?.color ?? TEAL;
  const total = data.reduce((s, d) => s + ((d as any)[dataKey] ?? 0), 0);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 flex flex-col">
      <div className="flex items-start justify-between mb-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.09em] text-gray-400 dark:text-gray-500">{title}</p>
        <Select defaultValue="month">
          <SelectTrigger className="h-7 w-auto text-[11px] border-gray-200 dark:border-gray-700 rounded-lg gap-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading
        ? <Sk className="w-32 h-8 mb-6" />
        : <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-6">
            {dataKey === 'earnings' ? `₹${total.toLocaleString()}` : total.toLocaleString()}
          </p>
      }

      {loading
        ? <Sk className="flex-1 min-h-[200px]" />
        : <div className="flex-1 min-h-[200px]">
            <ChartContainer config={config} className="h-full w-full">
              <AreaChart data={data} margin={{ top: 4, right: 2, left: -26, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={color} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={color} stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="rgba(107,114,128,0.08)" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tickMargin={10} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                <YAxis tickLine={false} axisLine={false} tickMargin={6} tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5}
                  fillOpacity={1} fill={`url(#${gradientId})`} dot={false}
                  activeDot={{ r: 5, fill: color, strokeWidth: 2.5, stroke: '#fff' }} />
              </AreaChart>
            </ChartContainer>
          </div>
      }
    </div>
  );
};

// ─── BookingTable ─────────────────────────────────────────────────────────────
const BookingTable = ({ data, loading }: { data: BookingDetailDTO[]; loading: boolean }) => {
  const [selected, setSelected] = useState<BookingDetailDTO | null>(null);
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      {/* header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
            <Calendar size={15} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-[13.5px] font-bold text-gray-900 dark:text-white tracking-tight">Recent Bookings</h3>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-tight">
              {loading ? 'Loading…' : `${data.length} record${data.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select defaultValue="all">
            <SelectTrigger className="h-8 w-auto text-xs border-gray-200 dark:border-gray-700 rounded-xl gap-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="ghost" size="sm" onClick={() => navigate('/bookings')}
            className="h-8 px-3 text-xs font-semibold rounded-xl gap-1 text-gray-500 hover:text-gray-900 dark:hover:text-white">
            All Bookings <ArrowRight size={13} />
          </Button>
        </div>
      </div>

      {/* table */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-50 dark:border-gray-800/60 hover:bg-transparent bg-gray-50/50 dark:bg-gray-800/20">
              {['Booking', 'Client', 'Service', 'Check In', 'Check Out', 'Status', 'Guests'].map((h, i) => (
                <TableHead key={h}
                  className={`text-[10.5px] font-semibold uppercase tracking-[0.07em] text-gray-400 dark:text-gray-500 ${i === 0 ? 'pl-6' : ''} ${i === 6 ? 'pr-6' : ''}`}>
                  {h.includes('Check') ? <div className="flex items-center gap-1">{h} <ArrowUpDown size={10} /></div> : h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="border-gray-50 dark:border-gray-800/40">
                <TableCell className="pl-6"><Sk className="h-4 w-20" /></TableCell>
                <TableCell><div className="flex items-center gap-2.5"><Sk className="w-8 h-8 rounded-full" /><Sk className="h-4 w-28" /></div></TableCell>
                <TableCell><Sk className="h-4 w-36" /></TableCell>
                <TableCell><Sk className="h-4 w-24" /></TableCell>
                <TableCell><Sk className="h-4 w-24" /></TableCell>
                <TableCell><Sk className="h-6 w-20 rounded-full" /></TableCell>
                <TableCell className="pr-6"><Sk className="h-4 w-8" /></TableCell>
              </TableRow>
            ))}

            {!loading && data.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="py-24 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center">
                      <MapPinOff size={26} className="text-gray-300 dark:text-gray-600" strokeWidth={1.5} />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">No bookings yet</p>
                      <p className="text-xs text-gray-400 dark:text-gray-600">Guest bookings will appear here once received</p>
                    </div>
                    <Button size="sm" onClick={() => navigate('/offering/add')}
                      className="rounded-xl text-xs gap-1.5 h-8" style={{ background: TEAL, color: '#000' }}>
                      <Plus size={13} /> Add your first listing
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {data.map((b, i) => {
              const s = bookingStatus(b.checkIn, b.checkOut);
              return (
                <TableRow key={i} onClick={() => setSelected(b)}
                  className="border-gray-50 dark:border-gray-800/40 hover:bg-gray-50/80 dark:hover:bg-white/[0.025] transition-colors cursor-pointer group">
                  <TableCell className="pl-6">
                    <span className="text-[12.5px] font-bold tabular-nums" style={{ color: TEAL }}>
                      #{b.id?.slice(-6).toUpperCase()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${avatarCls(b.clientName ?? 'A')}`}>
                        {initials(b.clientName ?? '?')}
                      </div>
                      <span className="text-[13px] font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">{b.clientName}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-[12.5px] text-gray-500 dark:text-gray-400 max-w-[160px] truncate block">{b.serviceName}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <Clock size={11} className="text-gray-300 dark:text-gray-600 shrink-0" />
                      <span className="text-[12.5px] text-gray-600 dark:text-gray-400">{formatDate(b.checkIn, 'dd MMM yyyy')}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-[12.5px] text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(b.checkOut, 'dd MMM yyyy')}</span>
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${s.pill}`}>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
                      {s.label}
                    </span>
                  </TableCell>
                  <TableCell className="pr-6">
                    <div className="flex items-center gap-1.5">
                      <Users size={11} className="text-gray-300 dark:text-gray-600" />
                      <span className="text-[12.5px] font-medium text-gray-600 dark:text-gray-400">{b.guests}</span>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* detail modal */}
      <Dialog open={!!selected} onOpenChange={v => !v && setSelected(null)}>
        <DialogContent className="max-w-md w-full rounded-2xl">
          <DialogHeader className="pb-4 border-b border-gray-100 dark:border-gray-800">
            <DialogTitle className="flex items-center gap-2.5 text-base font-bold">
              Booking Details
              {selected && (
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${bookingStatus(selected.checkIn, selected.checkOut).pill}`}>
                  {bookingStatus(selected.checkIn, selected.checkOut).label}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="grid grid-cols-2 gap-3 pt-2">
              {[
                ['Booking ID',  `#${selected.id?.slice(-6).toUpperCase()}`],
                ['Client',      selected.clientName],
                ['Service',     selected.serviceName],
                ['Price',       `₹${selected.servicePrice}`],
                ['Check In',    formatDate(selected.checkIn,  'dd MMM yyyy')],
                ['Check Out',   formatDate(selected.checkOut, 'dd MMM yyyy')],
                ['Guests',      String(selected.guests)],
              ].map(([label, val]) => (
                <div key={label} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-100 dark:border-gray-700/50">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5">{label}</p>
                  <p className="text-[13px] font-semibold text-gray-900 dark:text-white leading-snug">{val}</p>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Dashboard ─────────────────────────────────────────────────────────────────
const Dashboard = () => {
  const navigate = useNavigate();
  const { user }  = useAuth();
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [stats,     setStats]     = useState<VendorAnalyticsCounts | null>(null);
  const [bookings,  setBookings]  = useState<BookingDetailDTO[]>([]);
  const [graphData, setGraphData] = useState<VendorAnalyticsGraphData[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const token = localStorage.getItem('travel_auth_token');
        if (!token) return;
        setLoading(true);
        const params: Record<string, any> = { mine: true };
        if (user?.userType === 'vendor' && user?.id) params.vendorId = user.id;
        const [sRes, bRes, gRes] = await Promise.all([
          vendorAnalyticsApi.getCounts(token),
          bookingDetailsApi.list(token, params),
          vendorAnalyticsApi.getGraphs(token),
        ]);
        if (sRes.success) setStats(sRes.data);
        if (bRes.success) setBookings(bRes.data);
        if (gRes.success) setGraphData(gRes.data);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    if (user) load();
  }, [user]);

  const greeting  = (() => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; })();
  const firstName = ((user as any)?.name ?? user?.firstName ?? 'there').split(' ')[0];
  const today     = format(new Date(), 'EEEE, d MMMM yyyy');

  // ── metrics for the hero strip ──
  const heroMetrics = [
    { label: 'Total Earnings', value: loading ? null : `₹${stats?.payments?.received?.toLocaleString() ?? '0'}`, color: TEAL },
    { label: 'Total Bookings', value: loading ? null : stats?.total?.toLocaleString() ?? '0',                     color: '#8B5CF6' },
    { label: 'Active Listings',value: loading ? null : stats?.properties?.approved?.toLocaleString() ?? '0',      color: '#F59E0B' },
  ];

  // ── 5 stat cards ──
  const statCards = [
    { icon: Eye,            label: 'Impressions',      value: stats?.metrics?.impressions?.toLocaleString() ?? '0', border: 'border-t-cyan-400',    iconCls: 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-500'    },
    { icon: MousePointer,   label: 'Clicks',           value: stats?.metrics?.clicks?.toLocaleString() ?? '0',     border: 'border-t-amber-400',   iconCls: 'bg-amber-50 dark:bg-amber-500/10 text-amber-500'  },
    { icon: Users,          label: 'Visitors',         value: stats?.metrics?.visitors?.toLocaleString() ?? '0',   border: 'border-t-pink-400',    iconCls: 'bg-pink-50 dark:bg-pink-500/10 text-pink-500'    },
    { icon: CheckSquare,    label: 'Total Bookings',   value: stats?.total?.toLocaleString() ?? '0',                border: 'border-t-blue-400',    iconCls: 'bg-blue-50 dark:bg-blue-500/10 text-blue-500'    },
    { icon: ClipboardCheck, label: 'Listed Properties',value: stats?.properties?.approved?.toLocaleString() ?? '0',border: 'border-t-violet-400',  iconCls: 'bg-violet-50 dark:bg-violet-500/10 text-violet-500'},
    { icon: Wallet,         label: 'Total Earnings',   value: `₹${stats?.payments?.received?.toLocaleString() ?? '0'}`, border: 'border-t-emerald-400', iconCls: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-500'},
  ];

  // ── booking status strip ──
  const statusStrip = [
    { label: 'Upcoming',  value: stats?.upcoming,              dot: 'bg-blue-400',    text: 'text-blue-600 dark:text-blue-400'    },
    { label: 'Completed', value: stats?.past,                  dot: 'bg-emerald-400', text: 'text-emerald-600 dark:text-emerald-400'},
    { label: 'Cancelled', value: stats?.cancelled,             dot: 'bg-red-400',     text: 'text-red-500 dark:text-red-400'      },
    { label: 'Pending',   value: stats?.properties?.pending,   dot: 'bg-amber-400',   text: 'text-amber-600 dark:text-amber-400'  },
  ];

  return (
    <div className="flex h-screen bg-[#f7f8fa] dark:bg-[#0a0b0f] font-plus-jakarta">
      {/* Sidebar */}
      <div className="hidden lg:block flex-shrink-0 h-full">
        <Sidebar />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <DashboardHeader Headtitle="Dashboard" />

        <main className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
          <div className="p-5 lg:p-7 space-y-5">

            {/* ── HERO CARD ─────────────────────────────────────────────────── */}
            <div className="relative overflow-hidden rounded-2xl border border-gray-200/60 dark:border-gray-800"
              style={{ background: 'linear-gradient(135deg,#edfffe 0%,#ffffff 55%,#f3f0ff 100%)' }}>

              {/* dark-mode override */}
              <div className="absolute inset-0 bg-gray-900 opacity-0 dark:opacity-100 pointer-events-none" />

              {/* decorative blobs */}
              <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full pointer-events-none"
                style={{ background: `radial-gradient(circle, ${TEAL}22 0%, transparent 70%)` }} />
              <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, #8B5CF622 0%, transparent 70%)' }} />

              <div className="relative p-6 lg:p-8">
                {/* top row */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                  <div className="flex items-center gap-4">
                    {/* avatar */}
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold shrink-0 shadow-lg"
                      style={{ background: `linear-gradient(135deg, ${TEAL}, #6366f1)`, boxShadow: `0 8px 24px ${TEAL}44` }}>
                      {firstName[0]?.toUpperCase() ?? 'H'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
                          <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                          Live
                        </span>
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{today}</span>
                      </div>
                      <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                        {greeting}, {firstName} 👋
                      </h1>
                      <p className="text-[12.5px] text-gray-400 dark:text-gray-500 mt-0.5">
                        Here's what's happening with your listings today.
                      </p>
                    </div>
                  </div>

                  <Button onClick={() => navigate('/offering/add')}
                    className="h-10 px-5 rounded-xl text-[13px] font-semibold gap-2 shadow-md self-start sm:self-auto shrink-0"
                    style={{ background: `linear-gradient(135deg, ${TEAL}, ${TEAL2})`, color: '#0a2525', boxShadow: `0 4px 16px ${TEAL}55` }}>
                    <Plus size={16} />
                    New Listing
                  </Button>
                </div>

                {/* hero metrics strip */}
                <div className="mt-6 pt-5 border-t border-gray-200/60 dark:border-gray-700/40 grid grid-cols-3 gap-4 sm:gap-8">
                  {heroMetrics.map(({ label, value, color }) => (
                    <div key={label}>
                      <p className="text-[10.5px] font-semibold uppercase tracking-[0.08em] text-gray-400 dark:text-gray-500 mb-1">{label}</p>
                      {value === null
                        ? <Sk className="h-8 w-24" />
                        : <p className="text-2xl sm:text-3xl font-bold tracking-tight" style={{ color }}>{value}</p>
                      }
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── STAT CARDS ──────────────────────────────────────────────── */}
            {/* DEV: Reset metrics button for testing */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={async () => {
                  const token = localStorage.getItem('travel_auth_token');
                  if (!token) return;
                  if (!confirm('Reset all impressions, clicks & visitor data to 0?')) return;
                  try {
                    const API = import.meta.env.VITE_API_BASE_URL || '';
                    const res = await fetch(`${API}/api/vendorAnalytics/reset`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
                    const json = await res.json();
                    if (json.success) {
                      alert('Metrics reset! Refreshing…');
                      window.location.reload();
                    } else { alert('Failed: ' + json.message); }
                  } catch (e: any) { alert('Error: ' + e.message); }
                }}
                style={{ fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 8, border: '1.5px solid #fca5a5', backgroundColor: 'rgba(239,68,68,0.04)', color: '#ef4444', cursor: 'pointer' }}
              >
                🔄 Reset Metrics (Dev)
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {statCards.map(({ icon: Icon, label, value, border, iconCls }) => (
                loading
                  ? <div key={label} className={`bg-white dark:bg-gray-900 rounded-2xl p-5 border-t-[3px] border border-gray-100 dark:border-gray-800 ${border}`}>
                      <Sk className="w-9 h-9 rounded-xl mb-4" />
                      <Sk className="w-20 h-7 mb-2" />
                      <Sk className="w-24 h-3.5" />
                    </div>
                  : <div key={label}
                      className={`group bg-white dark:bg-gray-900 rounded-2xl p-5 border-t-[3px] border border-gray-100 dark:border-gray-800 ${border} hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-gray-950/50 hover:-translate-y-0.5 transition-all duration-200 cursor-default`}>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-110 ${iconCls}`}>
                        <Icon size={16} />
                      </div>
                      <p className="text-[22px] font-bold text-gray-900 dark:text-white tracking-tight leading-none mb-1.5">{value}</p>
                      <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">{label}</p>
                    </div>
              ))}
            </div>

            {/* ── BOOKING STATUS STRIP ────────────────────────────────────── */}
            {!loading && stats && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 divide-x divide-gray-100 dark:divide-gray-800 flex overflow-hidden">
                {statusStrip.map(({ label, value, dot, text }) => (
                  <div key={label} className="flex-1 flex flex-col items-center justify-center gap-1.5 py-4 hover:bg-gray-50/70 dark:hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${dot}`} />
                      <span className="text-[11px] font-semibold text-gray-400 dark:text-gray-500">{label}</span>
                    </div>
                    <p className={`text-xl font-bold tracking-tight ${text}`}>{value ?? 0}</p>
                  </div>
                ))}
              </div>
            )}

            {/* ── CHARTS ─────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <ChartCard title="Total Earnings" config={earningsConfig} dataKey="earnings" gradientId="fillEarnings" data={graphData} loading={loading} />
              <ChartCard title="Total Visitors" config={visitorsConfig} dataKey="visitors" gradientId="fillVisitors" data={graphData} loading={loading} />
            </div>

            {/* ── BOOKINGS TABLE ──────────────────────────────────────────── */}
            <BookingTable data={bookings} loading={loading} />

          </div>
        </main>
      </div>

      <ChangePasswordModal isOpen={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen} />
    </div>
  );
};

export default Dashboard;
