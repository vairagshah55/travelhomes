import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AdminSidebar from "../components/AdminSidebar";
import AdminProfileDropdown from "../components/AdminProfileDropdown";
import HelpDeskPopup from "@/components/HelpDeskPopup";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Users,
  UserCheck,
  ClipboardCheck,
  Wallet,
  MousePointer,
  ClipboardList,
  Bell,
  Search,
  Filter,
  ChevronDown,
  MoreHorizontal,
  Trash2,
  CheckCircle,
  Clock,
  Eye,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import AdminHeader from "../components/AdminHeader";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const [showHelpDeskPopup, setShowHelpDeskPopup] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Dynamic stats and tickets from API
  const [statsCards, setStatsCards] = React.useState([
    { title: "Total Users", value: "0", icon: Users, bgColor: "bg-orange-50", iconBg: "bg-orange-100", navigate:"/admin/management/user"  },
    { title: "Active Users", value: "0", icon: UserCheck, bgColor: "bg-green-50", iconBg: "bg-green-100", navigate:"/admin/management/user#active"  },
    { title: "Total Vendors", value: "0", icon: ClipboardCheck, bgColor: "bg-blue-50", iconBg: "bg-blue-100", navigate:"/admin/management/vendor"  },
    { title: "Active Vendors", value: "0", icon: Wallet, bgColor: "bg-purple-50", iconBg: "bg-purple-100", navigate:"/admin/management/vendor#active"  },
    { title: "Pending Vendor KYC", value: "0", icon: Wallet, bgColor: "bg-purple-50", iconBg: "bg-purple-100", navigate:"/admin/management/vendor#kyvpending"  },
    { title: "Total Listing Offerings", value: "0", icon: MousePointer, bgColor: "bg-indigo-50", iconBg: "bg-indigo-100", navigate:"/admin/management/listing"  },
    { title: "Pending Listing", value: "0", icon: ClipboardList, bgColor: "bg-green-50", iconBg: "bg-green-100", navigate:"/admin/management/listing#pending"  },
  ]);

  const [ticketData, setTicketData] = React.useState<any[]>([]);
  const [graphs, setGraphs] = React.useState<any>({
    revenue: [],
    users: [],
    vendors: [],
    bookings: []
  });
const navigate = useNavigate();

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/adminDashboarde/admin/dashboard', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken')}`
          }
        });
        const json = await res.json();
        const d = json?.data || {};
        console.log('Dashboard data:', d);
        const nextStats = [
          { title: "Total Users", value: String(d.stats?.users?.total ?? d.usersTotal ?? 0), icon: Users, bgColor: "bg-orange-50", iconBg: "bg-orange-100",navigate:"/admin/management/user"  },
          { title: "Active Users", value: String(d.stats?.users?.active ?? d.usersActive ?? 0), icon: UserCheck, bgColor: "bg-green-50", iconBg: "bg-green-100" ,navigate:"/users" },
          { title: "Total Vendors", value: String(d.stats?.vendors?.total ?? d.vendorsTotal ?? 0), icon: ClipboardCheck, bgColor: "bg-blue-50", iconBg: "bg-blue-100",navigate:"/users"  },
          { title: "Active Vendors", value: String(d.stats?.vendors?.active ?? d.vendorsActive ?? 0), icon: Wallet, bgColor: "bg-purple-50", iconBg: "bg-purple-100",navigate:"/users"  },
          { title: "Pending Vendor KYC", value: String(d.stats?.vendors?.pendingKyc ?? d.vendorsPendingKyc ?? 0), icon: Wallet, bgColor: "bg-purple-50", iconBg: "bg-purple-100" ,navigate:"/users" },
          { title: "Total Listing Offerings", value: String(d.stats?.listings?.total ?? d.listingsTotal ?? 0), icon: MousePointer, bgColor: "bg-indigo-50", iconBg: "bg-indigo-100",navigate:"/users"  },
          { title: "Pending Listing", value: String(d.stats?.listings?.pending ?? d.listingsPending ?? 0), icon: ClipboardList, bgColor: "bg-green-50", iconBg: "bg-green-100",navigate:"/users"  },
        ];
        setStatsCards(nextStats);
        
        if (d.graphs) {
          setGraphs(d.graphs);
        }

        const tickets = Array.isArray(d.tickets) ? d.tickets : (d.latestTickets || []);
        const mapped = tickets.map((t: any) => ({
          _id: t._id,
          vendorName: t.vendorName || t.name || 'N/A',
          email: t.email || t.vendorEmail || 'N/A',
          subject: t.subject || 'N/A',
          date: new Date(t.date || t.createdAt).toLocaleDateString('en-GB'),
          status: t.status || 'Open',
          statusColor: t.status === 'Resolved' ? 'bg-green-100 text-green-600' : 
                       t.status === 'Read' ? 'bg-blue-100 text-blue-600' :
                       'bg-orange-100 text-orange-600',
          message: t.description || t.message || 'N/A',
        }));
        setTicketData(mapped);
      } catch (e) {
        console.error('Failed to load dashboard data', e);
      }
    };

    fetchData();
    // Poll every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/helpdesk/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        toast.success(`Ticket marked as ${newStatus}`);
        // Refresh local state
        setTicketData(prev => prev.map(t => t._id === id ? { 
          ...t, 
          status: newStatus, 
          statusColor: newStatus === 'Resolved' ? 'bg-green-100 text-green-600' : 
                       newStatus === 'Read' ? 'bg-blue-100 text-blue-600' :
                       'bg-orange-100 text-orange-600' 
        } : t));
      } else {
        toast.error('Failed to update status');
      }
    } catch (err) {
      toast.error('Error updating status');
    }
  };

  const handleDeleteTicket = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this ticket?')) return;
    try {
      const res = await fetch(`/api/admin/helpdesk/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken')}`
        }
      });
      if (res.ok) {
        toast.success('Ticket deleted successfully');
        setTicketData(prev => prev.filter(t => t._id !== id));
      } else {
        toast.error('Failed to delete ticket');
      }
    } catch (err) {
      toast.error('Error deleting ticket');
    }
  };

  const handleTicketClick = (ticket: any) => {
    setSelectedTicket(ticket);
    setShowHelpDeskPopup(true);
  };

  // Real Chart Component
  const DashboardChart = ({ title, data, type = 'area', color = '#8884d8', dataKey = 'value' }: { title: string, data: any[], type?: 'area' | 'bar', color?: string, dataKey?: string }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-semibold text-gray-700">{title}</h3>
        <div className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 rounded text-sm">
          <span className="text-gray-900">Last 6 Months</span>
        </div>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'area' ? (
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`color${title.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip />
              <Area type="monotone" dataKey={dataKey} stroke={color} fillOpacity={1} fill={`url(#color${title.replace(/\s/g, '')})`} />
            </AreaChart>
          ) : (
            <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} />
              <YAxis axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: 'transparent' }} />
              <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex">
      <div className="fixed">

      <AdminSidebar
        showMobileSidebar={mobileOpen}
        setShowMobileSidebar={setMobileOpen}
        />
        </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-x-hidden ml-60 max-lg:ml-0">
        {/* Top Header */}
        <AdminHeader
          Headtitle={"Dashboard"}
          setMobileSidebarOpen={setMobileOpen}
        />

        {/* Main Content */}
        <div className="flex-1 p-5 overflow-auto">
          <div className="bg-white rounded-t-3xl rounded-b-6 border border-dashboard-stroke">
            {/* Content Header */}
            <div className="px-5 py-4 border-b border-dashboard-stroke">
              <h2 className="text-xl font-bold text-dashboard-heading font-geist tracking-tight">
                Overview
              </h2>
            </div>

            {/* Content Body */}
            <div className="p-5 space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {statsCards.map((stat, index) => (
                  <div
                    key={index}
                    onClick={() => navigate(`${stat.navigate}`)}
                    className={`${stat.bgColor} rounded-xl cursor-pointer p-3.5`}
                  >
                    <div className="flex items-start gap-5">
                      <div
                        className={`${stat.iconBg} rounded-full p-2.5 mt-0.5`}
                      >
                        <stat.icon size={20} className="text-gray-900" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-[#485467] mb-2.5 font-plus-jakarta">
                          {stat.title}
                        </div>
                        <div className="text-2xl font-bold text-[#131313] font-geist tracking-tight">
                          {stat.value}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Second Row Stats */}
              {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                {statsCards.slice(4).map((stat, index) => (
                  <div
                    key={index}
                    className={`${stat.bgColor} rounded-xl p-3.5`}
                  >
                    <div className="flex items-start gap-5">
                      <div
                        className={`${stat.iconBg} rounded-full p-2.5 mt-0.5`}
                      >
                        <stat.icon size={20} className="text-gray-900" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-[#485467] mb-2.5 font-plus-jakarta">
                          {stat.title}
                        </div>
                        <div className="text-2xl font-bold text-[#131313] font-geist tracking-tight">
                          {stat.value}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div> */}

              {/* Charts Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                <DashboardChart title="Revenue Generated" data={graphs.revenue} type="area" color="#8884d8" dataKey="total" />
                <DashboardChart title="Active Users" data={graphs.users} type="bar" color="#82ca9d" dataKey="count" />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                <DashboardChart title="Active Vendors" data={graphs.vendors} type="bar" color="#ffc658" dataKey="count" />
                <DashboardChart title="Bookings" data={graphs.bookings} type="area" color="#ff7300" dataKey="count" />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                <DashboardChart title="New Users" data={graphs.users} type="area" color="#82ca9d" dataKey="count" />
                <DashboardChart title="New vendors" data={graphs.vendors} type="area" color="#ffc658" dataKey="count" />
              </div>

              {/* Tickets Table */}
              <div className="space-y-5 max-md:flex-wrap">
                <h3 className="text-xl font-bold text-[#101828] font-geist tracking-tight">
                  Ticket Raised
                </h3>

                {/* Search and Filters */}
                <div className="flex items-center  max-md:flex-wrap justify-between">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search
                        size={20}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      />
                      <Input
                        placeholder="Search"
                        className="pl-10 w-64 h-10 border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="flex  max-md:flex-wrap items-center gap-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600">Sort By</span>
                      <Select defaultValue="camper-van">
                        <SelectTrigger className="w-40 h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="camper-van">Camper Van</SelectItem>
                          <SelectItem value="hotels">Unique Stay</SelectItem>
                          <SelectItem value="activities">Activities</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* <Button
                      variant="outline"
                      className="h-10 px-5 border-gray-300"
                    >
                      <Filter size={18} className="mr-2" />
                      Filters
                    </Button> */}
                  </div>
                </div>

                {/* Table */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-scroll">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="font-bold text-gray-800 py-3">
                          Vendor Name
                        </TableHead>
                        <TableHead className="font-bold text-gray-800">
                          Email
                        </TableHead>
                        <TableHead className="font-bold text-gray-800">
                          Subject
                        </TableHead>
                        <TableHead className="font-bold text-gray-800">
                          Date
                        </TableHead>
                        <TableHead className="font-bold text-gray-800">
                          Status
                        </TableHead>
                        <TableHead className="font-bold text-gray-800">
                          Action
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ticketData.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-4">
                            No tickets found.
                          </TableCell>
                        </TableRow> 
                      )}
                      {ticketData.map((ticket, index) => (
                        <TableRow
                          key={index}
                          className="border-b border-gray-100"
                        >
                          <TableCell className="font-medium py-4">
                            {ticket.vendorName}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {ticket.email}
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {ticket.subject}
                          </TableCell>
                          <TableCell className="font-medium">
                            {ticket.date}
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`${ticket.statusColor} border-0 px-3 py-1 text-sm font-medium`}
                            >
                              {ticket.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              
                              
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="text-gray-400 hover:text-gray-600 focus:outline-none">
                                    <MoreHorizontal size={20} />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg">
                                  <DropdownMenuItem 
                                    onClick={() => handleTicketClick(ticket)}
                                    className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                  >
                                    <Eye size={16} /> View
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleUpdateStatus(ticket._id, 'Read')}
                                    className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                  >
                                    <CheckCircle size={16} className="text-blue-600" /> Mark Read
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleUpdateStatus(ticket._id, 'Pending')}
                                    className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                  >
                                    <Clock size={16} /> Mark Pending
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleUpdateStatus(ticket._id, 'Resolved')}
                                    className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                                  >
                                    <CheckCircle size={16} /> Resolve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteTicket(ticket._id)}
                                    className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-red-50 text-red-600 hover:text-red-700 dark:hover:bg-red-900/30"
                                  >
                                    <Trash2 size={16} /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Help Desk Popup */}
      <HelpDeskPopup
        isOpen={showHelpDeskPopup}
        onClose={() => setShowHelpDeskPopup(false)}
        ticket={selectedTicket}
      />
    </div>
  );
};

export default AdminDashboard;
