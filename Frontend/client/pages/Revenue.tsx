import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Bell,
  Menu,
  Plus,
  Search,
  ChevronDown,
  Eye,
  MousePointer,
  ClipboardCheck
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Sidebar } from '@/components/Navigation';
import { useNavigate } from 'react-router-dom';
import ProfileDropdown from '@/components/ProfileDropdown';
import MobileVendorNav from '@/components/MobileVendorNav';
import { DashboardHeader } from '@/components/Header';
import { vendorAnalyticsApi, bookingDetailsApi } from '@/lib/api';
import { CustomPagination } from '@/components/CustomPagination';
import { formatDate } from '@/utils/formateTime';

const Revenue = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('Monthly');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState({
    totalEarnings: '0',
    totalPaymentReceived: '0',
    pendingPayment: '0'
  });
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  const Sk = ({ className = '' }: { className?: string }) => (
    <div className={`animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800 ${className}`} />
  );

  // Filter payment history based on search
  const filteredPaymentHistory = paymentHistory.filter(payment => {
    const searchLower = searchQuery.toLowerCase();
    return (
      payment.paymentMethod?.toLowerCase().includes(searchLower) ||
      payment.paymentRefId?.toLowerCase().includes(searchLower) ||
      payment.bookingId?.toLowerCase().includes(searchLower) ||
      payment.fullName?.toLowerCase().includes(searchLower)
    );
  });

  const totalPages = Math.ceil(filteredPaymentHistory.length / itemsPerPage);
  const paginatedHistory = filteredPaymentHistory.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    const load = async () => {
        const token = localStorage.getItem('travel_auth_token');
        if(!token) return;
        setLoading(true);
        try {
           // 1. Counts
           const counts = await vendorAnalyticsApi.getCounts(token);
           if(counts.success && counts.data.payments) {
               const received = counts.data.payments.received || 0;
               const pending = counts.data.payments.pending || 0;
               setRevenueData({
                   totalEarnings: (received + pending).toLocaleString('en-IN'), 
                   totalPaymentReceived: received.toLocaleString('en-IN'),
                   pendingPayment: pending.toLocaleString('en-IN')
               });
           }
           
           // 2. Graphs
           const graphs = await vendorAnalyticsApi.getGraphs(token, 'monthly');
           if(graphs.success) {
               setChartData(graphs.data.map(g => ({ month: g.name.substring(0,3), value: g.earnings })));
           } else {
              setChartData([
                { month: 'Jan', value: 0 }, { month: 'Feb', value: 0 }, { month: 'Mar', value: 0 },
                { month: 'Apr', value: 0 }, { month: 'May', value: 0 }, { month: 'Jun', value: 0 },
                { month: 'Jul', value: 0 }, { month: 'Aug', value: 0 }, { month: 'Sep', value: 0 },
                { month: 'Oct', value: 0 }, { month: 'Nov', value: 0 }, { month: 'Dec', value: 0 }
              ]);
           }

           // 3. Payment History (Bookings)
           const bk = await bookingDetailsApi.list(token);
           if(bk.success && (bk as any).data) {
              setPaymentHistory((bk as any).data.map((b: any) => ({
                  paymentMethod: 'Razorpay', 
                  paymentRefId: b.id, 
                  bookingId: b.id,
                  amountPay: b.servicePrice || '0',
                  fullName: b.clientName,
                  receiptDate: b.checkIn ? (b.checkIn.includes(',') ? b.checkIn.split(',')[0] : b.checkIn) : 'N/A',
                  status: b.status === 'confirmed' || b.status === 'active' ? 'Paid' : 'Pending'
              })));
           }

        } catch(e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }
    load();
  }, []);


  return (
 <div className="flex h-screen w-full bg-dashboard-bg dark:bg-gray-900 font-plus-jakarta overflow-hidden motion-page-shell">
  {/* Sidebar (Desktop Only) */}
  <div className="hidden lg:block">
    <Sidebar />
  </div>

  {/* Main Content Area */}
  <div className="flex-1 flex flex-col overflow-hidden">
    {/* Header */}
    <DashboardHeader Headtitle="Revenue" />

    {/* Scrollable Main Content */}
    <main
      className="
        flex-1
        overflow-y-auto scrollbar-hide
         md:px-6 lg:px-8
        transition-all
      "
    >
      {/* Top Bar */}
      <div data-animate="section" className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4 motion-section-reveal">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white font-geist">Revenue Overview</h2>
        <Button
          className="rounded-xl px-5 h-10 font-semibold text-sm flex items-center gap-2 shadow-sm hover:shadow-md transition-all"
          style={{ background: '#3BD9DA', color: '#131313' }}
        >
          <Plus size={16} />
          <span className="hidden sm:inline">New Booking</span>
        </Button>
      </div>

      {/* Main Dashboard Content */}
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 flex items-start gap-3">
                  <Sk className="w-10 h-10 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2 pt-0.5">
                    <Sk className="h-3 w-24" />
                    <Sk className="h-6 w-28" />
                  </div>
                </div>
              ))
            : [
                { label: 'Total Earnings',        value: `₹ ${revenueData.totalEarnings}`,        icon: Eye },
                { label: 'Payment Received',       value: `₹ ${revenueData.totalPaymentReceived}`, icon: MousePointer },
                { label: 'Pending Payment',        value: `₹ ${revenueData.pendingPayment}`,       icon: ClipboardCheck },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" style={{ background: '#E8FAFA' }}>
                      <Icon size={18} style={{ color: '#3BD9DA' }} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</p>
                      <p className="text-xl font-bold text-gray-900 dark:text-white mt-0.5">{value}</p>
                    </div>
                  </div>
                </div>
              ))
          }
        </div>

        {/* Earnings Chart */}
        <div data-animate="section" className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-800 motion-section-reveal motion-surface-card">
          <div className="flex items-center justify-between mb-4 sm:mb-6 flex-wrap gap-3">
            <div className="flex flex-col">
              <h3 className="text-sm sm:text-base font-semibold text-dashboard-title dark:text-gray-300">
                Total Earnings
              </h3>
              <p data-countup data-countup-duration="1200" className="text-lg font-bold text-dashboard-primary dark:text-white">
                 ₹ {revenueData.totalEarnings}
              </p>
            </div>
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded px-3 py-1.5">
              <span className="text-sm font-medium text-dashboard-primary dark:text-white">
                Monthly
              </span>
              <ChevronDown size={16} className="text-dashboard-primary dark:text-white" />
            </div>
          </div>

          <div className="relative h-48 bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4">
            {loading ? (
              <div className="flex items-end justify-between h-full gap-1.5 px-6">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="flex-1 rounded-t animate-pulse bg-gray-200 dark:bg-gray-600"
                    style={{ height: `${20 + Math.random() * 60}%` }} />
                ))}
              </div>
            ) : (
            <div className="flex items-end justify-between h-full">
              {chartData.map((item, index) => (
                <div key={index} className="flex flex-col items-center gap-1.5 flex-1" data-animate="section" data-animate-item>
                  <div
                    className="rounded-t w-6 sm:w-8 transition-all"
                    style={{
                      background: 'linear-gradient(to top, #3BD9DA, #a5f3f4)',
                      height: `${(item.value / 500) * 100}%`,
                      minHeight: "8px",
                    }}
                  ></div>
                  <span className="text-[11px] sm:text-xs text-dashboard-body dark:text-gray-400 font-medium">
                    {item.month}
                  </span>
                </div>
              ))}
            </div>
            )}

            {/* Y-Axis Labels */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] sm:text-xs text-dashboard-body dark:text-gray-400 py-1 sm:py-2">
              {[500, 400, 300, 200, 100, 0].map((val) => (
                <span key={val}>{val}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Payment History Table */}
        <div data-animate="section" className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden motion-section-reveal motion-surface-card">
  {/* Header Section */}
  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800">
    <h3 className="text-base font-bold text-gray-900 dark:text-white">
      Payment History
    </h3>

    <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full sm:w-auto">
      {/* Search Input */}
      <div className="relative flex-1 sm:flex-none motion-search-field">
        <Search
          size={18}
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        />
        <Input
          placeholder="Search List"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 w-full sm:w-56 md:w-64 figma-input motion-search-input"
        />
      </div>

      {/* Filter Dropdown */}
      <Select value={filterPeriod} onValueChange={setFilterPeriod}>
        <SelectTrigger className="w-24 sm:w-28 md:w-32 figma-input">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="motion-dropdown-surface">
          <SelectItem value="Monthly">Monthly</SelectItem>
          <SelectItem value="Weekly">Weekly</SelectItem>
          <SelectItem value="Daily">Daily</SelectItem>
        </SelectContent>
      </Select>
    </div>
  </div>

  {/* Responsive Scrollable Table */}
  <div className="relative w-full overflow-x-auto">
    <table className="w-full min-w-[1200px] text-sm">
      <thead className="bg-gray-50 dark:bg-gray-700">
        <tr>
          {[
            "Payment Method",
            "Payment Ref ID",
            "Booking ID",
            "Amount Pay",
            "Full Name",
            "Receipt Date",
            "Status",
          ].map((title, i) => (
            <th
              key={i}
              className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[11px] sm:text-sm font-semibold text-dashboard-title dark:text-gray-300 whitespace-nowrap"
            >
              {title}
            </th>
          ))}
        </tr>
      </thead>

      <tbody className="divide-y divide-gray-100 dark:divide-gray-600 w-full">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: 7 }).map((__, j) => (
                  <td key={j} className="px-3 sm:px-4 py-3">
                    <div className="h-4 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" style={{ width: j === 6 ? 64 : j === 0 ? 80 : 96 }} />
                  </td>
                ))}
              </tr>
            ))
          : paginatedHistory.map((payment, index) => (
          <tr
            key={index}
            data-animate="table-row"
            data-animate-item
            className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors motion-table-row"
          >
            <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-dashboard-body dark:text-gray-300 whitespace-nowrap">
              {payment.paymentMethod}
            </td>
            <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-dashboard-body dark:text-gray-300 whitespace-nowrap">
              {payment.paymentRefId}
            </td>
            <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-bold text-dashboard-primary dark:text-white whitespace-nowrap">
              {payment.bookingId}
            </td>
            <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-dashboard-body dark:text-gray-300 whitespace-nowrap">
              {payment.amountPay}
            </td>
            <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-dashboard-body dark:text-gray-300 whitespace-nowrap">
              {payment.fullName}
            </td>
            <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-dashboard-body dark:text-gray-300 whitespace-nowrap">
              {formatDate(payment.receiptDate)}
            </td>
            <td className="px-3 sm:px-4 py-2 sm:py-3 whitespace-nowrap">
              <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                payment.status === 'Paid'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 motion-badge-confirmed'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 motion-badge-pending'
              }`}>
                {payment.status}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
  
  {/* Pagination Controls */}
  {filteredPaymentHistory.length > itemsPerPage && (
      <div className="py-4 border-t border-dashboard-stroke dark:border-gray-600">
        <CustomPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
  )}
</div>

      </div>
    </main>
  </div>
</div>


  );
};

export default Revenue;
