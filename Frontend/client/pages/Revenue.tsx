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

  const [revenueData, setRevenueData] = useState({
    totalEarnings: '0',
    totalPaymentReceived: '0',
    pendingPayment: '0'
  });
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

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
        }
    }
    load();
  }, []);


  return (
 <div className="flex h-screen w-full bg-dashboard-bg dark:bg-gray-900 font-plus-jakarta overflow-hidden">
  {/* Sidebar (Desktop Only) */}
  <div className="hidden lg:block">
    <Sidebar 
      isCollapsed={isCollapsed} 
      onToggleCollapse={handleToggleCollapse}
    />
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
      <div
        className="
          flex flex-wrap items-center justify-between
          gap-3 px-4 sm:px-5 py-4
          border-b border-dashboard-stroke dark:border-gray-700
          bg-white dark:bg-gray-800
          rounded-t-3xl
        "
      >
        <h2 className="text-lg sm:text-xl font-bold text-dashboard-heading dark:text-white font-geist">
          Overview
        </h2>

        <Button
          className="
            bg-dashboard-primary text-white hover:bg-gray-800
            rounded-full px-4 sm:px-6 h-10 sm:h-11
            font-geist font-medium flex items-center gap-2
          "
        >
          <Plus size={18} />
          <span className="hidden sm:inline">New Booking</span>
        </Button>
      </div>

      {/* Main Dashboard Content */}
      <div
        className="
          p-4 sm:p-5 bg-white dark:bg-gray-800
          rounded-b-3xl max-w-7xl mx-auto space-y-6
        "
      >
        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 ">
          {/* Total Earnings */}
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4  border border-orange-100 dark:border-orange-800">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-200 dark:bg-orange-800 rounded-full flex items-center justify-center mt-1">
                <Eye size={20} className="text-dashboard-primary" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-dashboard-body dark:text-gray-300 mb-1 sm:mb-2">
                  Total Earnings
                </h4>
                <p className="text-xl sm:text-2xl font-bold text-dashboard-primary dark:text-white font-geist">
                  ₹ {revenueData.totalEarnings}
                </p>
              </div>
            </div>
          </div>

          {/* Total Payment Received */}
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-200 dark:bg-purple-800 rounded-full flex items-center justify-center mt-1">
                <MousePointer size={20} className="text-dashboard-primary" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-dashboard-body dark:text-gray-300 mb-1 sm:mb-2 uppercase">
                  Total Payment Received
                </h4>
                <p className="text-xl sm:text-2xl font-bold text-dashboard-primary dark:text-white font-geist">
                  {revenueData.totalPaymentReceived}
                </p>
              </div>
            </div>
          </div>

          {/* Pending Payment */}
          <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-xl p-4 border border-cyan-100 dark:border-cyan-800">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-cyan-200 dark:bg-cyan-800 rounded-full flex items-center justify-center mt-1">
                <ClipboardCheck size={20} className="text-dashboard-primary" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-dashboard-body dark:text-gray-300 mb-1 sm:mb-2">
                  Pending Payment
                </h4>
                <p className="text-xl sm:text-2xl font-bold text-dashboard-primary dark:text-white font-geist">
                  {revenueData.pendingPayment}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Earnings Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-5 border border-dashboard-stroke dark:border-gray-600">
          <div className="flex items-center justify-between mb-4 sm:mb-6 flex-wrap gap-3">
            <div className="flex flex-col">
              <h3 className="text-sm sm:text-base font-semibold text-dashboard-title dark:text-gray-300">
                Total Earnings
              </h3>
              <p className="text-lg font-bold text-dashboard-primary dark:text-white">
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
            <div className="flex items-end justify-between h-full">
              {chartData.map((item, index) => (
                <div key={index} className="flex flex-col items-center gap-1.5 flex-1">
                  <div
                    className="bg-gradient-to-t from-dashboard-primary to-blue-400 rounded-t w-6 sm:w-8 transition-all hover:from-blue-600 hover:to-blue-500"
                    style={{ height: `${(item.value / 500) * 100}%`, minHeight: "8px" }}
                  ></div>
                  <span className="text-[11px] sm:text-xs text-dashboard-body dark:text-gray-400 font-medium">
                    {item.month}
                  </span>
                </div>
              ))}
            </div>

            {/* Y-Axis Labels */}
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-[10px] sm:text-xs text-dashboard-body dark:text-gray-400 py-1 sm:py-2">
              {[500, 400, 300, 200, 100, 0].map((val) => (
                <span key={val}>{val}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Payment History Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashboard-stroke dark:border-gray-600 overflow-hidden">
  {/* Header Section */}
  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-5 border-b border-dashboard-stroke dark:border-gray-600">
    <h3 className="text-base sm:text-lg font-semibold text-dashboard-title dark:text-gray-300">
      Payment History
    </h3>

    <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full sm:w-auto">
      {/* Search Input */}
      <div className="relative flex-1 sm:flex-none">
        <Search
          size={18}
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
        />
        <Input
          placeholder="Search List"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 w-full sm:w-56 md:w-64 figma-input"
        />
      </div>

      {/* Filter Dropdown */}
      <Select value={filterPeriod} onValueChange={setFilterPeriod}>
        <SelectTrigger className="w-24 sm:w-28 md:w-32 figma-input">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
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

      <tbody className="divide-y divide-gray-100 dark:divide-gray-600 w-full ">
        {paginatedHistory.map((payment, index) => (
          <tr
            key={index}
            className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
            <td className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-dashboard-body dark:text-gray-300 whitespace-nowrap">
              {payment.status}
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
