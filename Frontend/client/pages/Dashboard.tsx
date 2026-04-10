import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle,DialogOverlay } from "@/components/ui/dialog"; // Adjust import based on your setup
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Eye,
  CheckSquare,
  ClipboardCheck,
  Wallet,
  MousePointer,
  Bell,
  Plus,
  Users,
  ArrowUpDown,
  ChevronDown,
  Menu,
  Send,
  MessageCircle,
  X,
  Minus,
  MapPinOff
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Sidebar } from '@/components/Navigation';
import ProfileDropdown from '@/components/ProfileDropdown';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import MobileVendorNav from '@/components/MobileVendorNav';
import {DashboardHeader} from '../components/Header';
import { bookingDetailsApi, vendorAnalyticsApi, BookingDetailDTO, VendorAnalyticsCounts, VendorAnalyticsGraphData } from '../lib/api';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { formatDate } from 'date-fns';

// Stats Card Component
const StatsCard = ({
  icon: Icon,
  title,
  value,
  bgColor,
  iconBg
}: {
  icon: React.ElementType;
  title: string;
  value: string;
  bgColor: string;
  iconBg: string;
}) => (
  <Card className={`${bgColor} border-0 flex-1 transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer group`}>
    <CardContent className="p-4">
      <div className="flex items-start gap-5">
        <div className={`${iconBg} rounded-full p-3 transition-transform group-hover:scale-110`}>
          <Icon size={20} className="text-dashboard-primary transition-transform group-hover:rotate-12" />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium text-dashboard-body">{title}</p>
          <p className="text-2xl font-bold text-dashboard-primary tracking-tight group-hover:text-dashboard-heading transition-colors">{value}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Status Badge Component
// const StatusBadge = ({ type, label }: { type: 'orange' | 'purple' | 'green'; label: string }) => {
//   const styles = {
//     orange: 'bg-status-orange-bg text-status-orange-text',
//     purple: 'bg-status-purple-bg text-status-purple-text',
//     green: 'bg-status-green-bg text-status-green-text',
//   };

//   return (
//     <Badge variant="secondary" className={`${styles[type]} border-0 font-medium`}>
//       {label}
//     </Badge>
//   );
// };



// Table Component





const earningsChartConfig = {
  earnings: {
    label: "Earnings",
    color: "#2563eb",
  },
} satisfies ChartConfig;

const visitorsChartConfig = {
  visitors: {
    label: "Visitors",
    color: "#60a5fa",
  },
} satisfies ChartConfig;

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState('elmer');
  const [newMessage, setNewMessage] = useState('');
  
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
           // Optionally redirect to login
           return;
        }

        const bookingParams: Record<string, any> = { mine: true };
        if (user?.userType === 'vendor' && user?.id) {
          // Pass vendorId to filter bookings on backend
          bookingParams.vendorId = user.id;
        }

        const [statsRes, bookingsRes, graphsRes] = await Promise.all([
          vendorAnalyticsApi.getCounts(token),
          bookingDetailsApi.list(token, bookingParams),
          vendorAnalyticsApi.getGraphs(token)
        ]);

        if (statsRes.success) {
          setStats(statsRes.data);
          setLoading(false);
        }
        if (bookingsRes.success) {
          setBookings(bookingsRes.data);
          setLoading(false);
        }
        if (graphsRes.success) {
          setGraphData(graphsRes.data);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user]);

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleNotificationClick = () => {
    navigate('/notifications');
  };

  const handleSwitchToUser = async () => {
    await updateUserType('user');
    navigate('/user-profile'); // Navigate to user dashboard
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // Here you would typically send the message to your backend
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Chat data
  const chatList = [
    {
      id: 'elmer',
      name: 'Elmer Laverty',
      message: 'just ideas for next time',
      time: '12m',
      avatar: 'https://api.builder.io/api/v1/image/assets/TEMP/be4a4e75066693fe1cd9dd4592522f7eb516375a?width=96',
      isActive: true,
      hasUnread: false
    },
    {
      id: 'elmer2',
      name: 'Sarah Johnson',
      message: 'Thanks for the booking!',
      time: '15m',
      avatar: 'https://api.builder.io/api/v1/image/assets/TEMP/026909e15a189514c1fd8ffbc0a749d76d066ca9?width=96',
      isActive: false,
      hasUnread: true
    },
    {
      id: 'elmer3',
      name: 'Mike Wilson',
      message: 'When is check-in?',
      time: '1h',
      avatar: 'https://api.builder.io/api/v1/image/assets/TEMP/eb39745c8108a69a643c98d18ead577372ef67c4?width=96',
      isActive: false,
      hasUnread: true
    }
  ];

  const messages = [
    {
      id: 1,
      type: 'received',
      content: 'just ideas for next time',
      time: '2:31 PM',
      avatar: 'https://api.builder.io/api/v1/image/assets/TEMP/e0e97c7f6f6549797f0826fa6cf62f5e7b5bc7de?width=80'
    },
    {
      id: 2,
      type: 'received',
      content: "I'll be there in 2 mins ⏰",
      time: '2:31 PM',
      avatar: 'https://api.builder.io/api/v1/image/assets/TEMP/e0e97c7f6f6549797f0826fa6cf62f5e7b5bc7de?width=80'
    },
    {
      id: 3,
      type: 'sent',
      content: 'Perfect! Looking forward to it.',
      time: '2:32 PM'
    },
    {
      id: 4,
      type: 'received',
      content: 'Thanks for being flexible with the timing 😊',
      time: '2:33 PM',
      avatar: 'https://api.builder.io/api/v1/image/assets/TEMP/e0e97c7f6f6549797f0826fa6cf62f5e7b5bc7de?width=80'
    }
  ];

  // Sample data
  const tripStartingData = [
    {
      id: 'CV042W4',
      clientName: 'Badal Singh',
      serviceName: 'XYX',
    location: 'Indore',
      checkIn: '20/2/2024, 10:30 pm',
      checkOut: '20/2/2024, 10:30 pm',
      guests: '7'
    },
    {
      id: 'CV042E4',
      clientName: 'Badal Singh',
      serviceName: 'XYZ',
      location: 'Indore',
      checkIn: '20/2/2024, 10:30 pm',
      checkOut: '20/2/2024, 10:30 pm',
      guests: '7'
    },
    {
      id: 'CV042344',
      clientName: 'Badal Singh',
      serviceName: 'XYZ',
     location: 'Indore',
      checkIn: '20/2/2024, 10:30 pm',
      checkOut: '20/2/2024, 10:30 pm',
      guests: '7'
    }
  ];

const BookingTable = ({ title, data }: { title: string; data: BookingDetailDTO[];}) => {
  const [selectedBooking, setSelectedBooking] = useState<BookingDetailDTO | null>(null);
  const [open, setOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('today');

  const handleOpenModal = (booking: BookingDetailDTO) => {
    setSelectedBooking(booking);
    setOpen(true);
  };

  const handleFilterChange = (value: string) => {
    setSelectedFilter(value);
  };

  

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
     <div className='flex gap-3'>
         <h3 className="text-lg font-bold text-dashboard-primary">{title}</h3>
          <Select defaultValue="today" onValueChange={handleFilterChange}>
            <SelectTrigger className="w-auto border-dashboard-neutral-06 text-dashboard-neutral-07">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
     </div>
        <div className="flex items-center gap-4">
        
          <Button
            variant="ghost"
            className="text-dashboard-primary font-bold text-sm  transition-colors"
          >
            View All
          </Button>
        </div>
      </div>

      <Card className="border-dashboard-stroke">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50 dark:bg-black dark:text-white">
              <TableRow>
                <TableHead className="font-bold text-dashboard-title min-w-[120px]">Booking ID</TableHead>
                <TableHead className="font-bold text-dashboard-title min-w-[140px]">Client Name</TableHead>
                <TableHead className="font-bold text-dashboard-title min-w-[120px]">Service Name</TableHead>
                <TableHead className="font-bold text-dashboard-title min-w-[160px]">
                  <div className="flex items-center gap-2">
                    Check In
                    <ArrowUpDown size={16} className="text-gray-400" />
                  </div>
                </TableHead>
                <TableHead className="font-bold text-dashboard-title min-w-[160px]">
                  <div className="flex items-center gap-2">
                    Check Out
                    <ArrowUpDown size={16} className="text-gray-400" />
                  </div>
                </TableHead>
                <TableHead className="font-bold text-dashboard-title min-w-[100px]">No. of Guest</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center flex justify-center items-center w-full gap-2 py-4">  
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dashboard-primary"></div>
                    <span className="ml-2 ">Loading bookings...</span>
                  </TableCell>
                </TableRow>
              )}
              {!loading && data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center flex justify-center items-center w-full gap-2 py-4">
                    <div className="flex flex-col items-center justify-center">
                      <MapPinOff size={48} className="mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">No bookings found</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Try adjusting your filters or create a new booking.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {(data || []).map((booking, index) => (
                <TableRow
                  key={index}
                  className="border-gray-100 hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors cursor-pointer group"
                >
                  <TableCell>
                    <button
                      onClick={() => handleOpenModal(booking)}
                      className="font-bold text-booking-link hover:underline transition-all"
                    >
                      {booking.id}
                    </button>
                  </TableCell>
                  <TableCell className="text-dashboard-body group-hover:text-dashboard-heading transition-colors">
                    {booking.clientName}
                  </TableCell>
                  <TableCell>
                  {booking.location} 
                  </TableCell>
         <TableCell className="text-dashboard-body text-sm group-hover:text-dashboard-heading transition-colors">
  {formatDate(booking.checkIn, "dd MMM yyyy")}
</TableCell>

<TableCell className="text-dashboard-body text-sm group-hover:text-dashboard-heading transition-colors">
  {formatDate(booking.checkOut, "dd MMM yyyy")}
</TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Users size={18} className="text-gray-400 group-hover:text-dashboard-primary transition-colors" />
                      <span className="text-dashboard-body group-hover:text-dashboard-heading transition-colors">
                        {booking.guests}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Modal for booking details */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogOverlay className='bg-gray-300'/>
        <DialogContent className="max-w-lg w-full">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 text-sm dark:bg-black dark:text-white text-gray-700">
              <p className="flex flex-col"><strong>Booking ID:</strong> {selectedBooking.id}</p>
              <p className="flex flex-col"><strong>Client Name:</strong> {selectedBooking.clientName}</p>
              <p className="flex flex-col"><strong>Service Name:</strong> {selectedBooking.serviceName}</p>
              <p className="flex flex-col"><strong>Check In:</strong> {selectedBooking.checkIn}</p>
              <p className="flex flex-col"><strong>Check Out:</strong> {selectedBooking.checkOut}</p>
              <p className="flex flex-col"><strong>No. of Guests:</strong> {selectedBooking.guests}</p>
              <p className="flex flex-col"><strong>Location:</strong> {selectedBooking.location}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

  return (
    <div className="flex h-screen bg-dashboard-bg font-plus-jakarta">
      {/* Desktop Sidebar - Hidden on mobile, shown on lg+ */}
      <div className="hidden lg:block">
        <Sidebar isCollapsed={isCollapsed} onToggleCollapse={handleToggleCollapse} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-x-hidden">
        {/* Dashboard Content */}
        <div className="flex-1 flex flex-col">
        {/* Header */}
        <DashboardHeader Headtitle={"Dashboard"}/>

        {/* Main Dashboard Content */}
        <main className="flex-1 p-4 lg:p-6 dark:bg-black dark:text-white bg-white m-2 lg:m-5 rounded-2xl lg:rounded-3xl overflow-auto scrollbar-hide overflow-x-hidden">
          {/* Overview Header */}
          <div className="flex lg:flex-row lg:items-center justify-between mb-6 lg:mb-8 border-b border-dashboard-stroke pb-4 lg:pb-6 gap-4">
            <h2 className="text-lg lg:text-xl font-bold text-dashboard-heading font-geist">Overview</h2>
            {/* <Button className="bg-dashboard-primary text-white dark:text-black  hover:shadow-lg hover:scale-105 rounded-full px-4 lg:px-6 w-fit transition-all duration-200 group">
              <Plus size={18} className="mr-2 group-hover:rotate-90 transition-transform" />
              New Booking
            </Button> */}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 mb-6 lg:mb-8">
            <StatsCard
              icon={Eye}
              title="Impression"
              value={stats?.metrics?.impressions?.toString() || "0"}
              bgColor="bg-stats-impression-bg"
              iconBg="bg-stats-impression-icon"
            />
            <StatsCard
              icon={CheckSquare}
              title="Total Bookings"
              value={stats?.total?.toString() || "0"}
              bgColor="bg-stats-bookings-bg"
              iconBg="bg-stats-bookings-icon"
            />
            <StatsCard
              icon={ClipboardCheck}
              title="Listed Properties"
              value={stats?.properties?.approved?.toString() || "0"}
              bgColor="bg-stats-properties-bg"
              iconBg="bg-stats-properties-icon"
            />
            <StatsCard
              icon={Wallet}
              title="Total Earning"
              value={`$${stats?.payments?.received?.toString() || "0"}`}
              bgColor="bg-stats-earnings-bg"
              iconBg="bg-stats-earnings-icon"
            />
          </div>

          {/* Second Row Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 mb-6 lg:mb-8">
            <StatsCard
              icon={MousePointer}
              title="Clicked"
              value={stats?.metrics?.clicks?.toString() || "0"}
              bgColor="bg-stats-clicks-bg"
              iconBg="bg-stats-clicks-icon"
            />
          </div>

          {/* Tables */}
          <div className="space-y-6 lg:space-y-8">
            <BookingTable title="Recent Bookings" loadingt={loading} data={bookings} />
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 lg:mt-8">
             {/* Earnings Chart */}
             <div className="bg-white dark:bg-black border border-dashboard-stroke dark:border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                   <h3 className="text-lg font-bold text-dashboard-title dark:text-white">Total Earnings</h3>
                </div>
                <div className="h-[300px] w-full">
                  <ChartContainer config={earningsChartConfig} className="h-full w-full">
                    <AreaChart data={graphData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="fillEarnings" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-earnings)" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="var(--color-earnings)" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis 
                        dataKey="name" 
                        tickLine={false} 
                        axisLine={false} 
                        tickMargin={8} 
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                      />
                      <YAxis 
                        tickLine={false} 
                        axisLine={false} 
                        tickMargin={8} 
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area 
                        type="monotone" 
                        dataKey="earnings" 
                        stroke="var(--color-earnings)" 
                        fillOpacity={1} 
                        fill="url(#fillEarnings)" 
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ChartContainer>
                </div>
             </div>

             {/* Visitors Chart */}
             <div className="bg-white dark:bg-black border border-dashboard-stroke dark:border-gray-800 rounded-xl p-6">
                <div className="flex items-center justify-between mb-6">
                   <h3 className="text-lg font-bold text-dashboard-title dark:text-white">Total Visitors</h3>
                </div>
                <div className="h-[300px] w-full">
                  <ChartContainer config={visitorsChartConfig} className="h-full w-full">
                    <AreaChart data={graphData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="fillVisitors" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-visitors)" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="var(--color-visitors)" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis 
                        dataKey="name" 
                        tickLine={false} 
                        axisLine={false} 
                        tickMargin={8} 
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                      />
                      <YAxis 
                        tickLine={false} 
                        axisLine={false} 
                        tickMargin={8} 
                        tick={{ fill: '#6B7280', fontSize: 12 }}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area 
                        type="monotone" 
                        dataKey="visitors" 
                        stroke="var(--color-visitors)" 
                        fillOpacity={1} 
                        fill="url(#fillVisitors)" 
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ChartContainer>
                </div>
             </div>
          </div>
        </main>
        </div>

        {/* Chat Panel */}
    
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onOpenChange={setIsChangePasswordOpen}
      />
    </div>
  );
};

export default Dashboard;
