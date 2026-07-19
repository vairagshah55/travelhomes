import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Users,
  UserCheck,
  ClipboardCheck,
  Wallet,
  MousePointer,
  ClipboardList,
  Search,
  MoreHorizontal,
  CheckCircle,
  Clock,
  Eye,
  TrendingUp,
  IndianRupee,
  Trash2,
  AlertCircle,
  Inbox,
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
import AdminLayout from "@/components/admin/AdminLayout";
import HelpDeskPopup from "@/components/admin/HelpDeskPopup";
import { useNavigate } from "react-router-dom";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ChartTooltip } from "@/components/shared/ChartTooltip";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { formatINR } from "@/utils/formatCurrency";
import { useDashboard } from "@/hooks/admin/useDashboard";
import { adminKeys } from "@/hooks/admin/queryKeys";
import { api } from "@/services/api";

// ─── Chart card — template-style (white card, rounded-[10px], shadow-1) ──────
const DashboardChart = ({
  title,
  data,
  type = "area",
  color = "#5750F1",
  dataKey = "value",
  loading = false,
}: {
  title: string;
  data: any[];
  type?: "area" | "bar";
  color?: string;
  dataKey?: string;
  loading?: boolean;
}) => {
  const gradId = `grad_${title.replace(/\s+/g, "_")}`;
  const isEmpty = !loading && (!data || data.length === 0);
  return (
    <div className="bg-white dark:bg-tpl-dark-2 rounded-2xl border border-tpl-stroke shadow-tpl-1 px-6 pt-6 pb-4">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[18px] font-bold text-tpl-dark dark:text-white">{title}</h3>
        <span className="text-[12px] font-medium px-2.5 py-1 bg-tpl-gray-2 dark:bg-white/5 rounded-full text-tpl-dark-5 dark:text-tpl-dark-6">
          Last 6 Months
        </span>
      </div>
      <div className="h-52 w-full">
        {loading ? (
          <div className="h-full w-full rounded-lg bg-tpl-gray-2 dark:bg-white/5 animate-pulse" />
        ) : isEmpty ? (
          <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-tpl-dark-5 dark:text-tpl-dark-6">
            <Inbox size={28} strokeWidth={1.5} className="opacity-50" />
            <p className="text-[13px]">No data for this period</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {type === "area" ? (
              <AreaChart data={data} margin={{ top: 8, right: 16, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.18} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="rgba(255,255,255,0.06)"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <Tooltip
                  content={
                    <ChartTooltip
                      valuePrefix={dataKey === "total" ? "₹" : ""}
                      valueFormatter={dataKey === "total" ? formatINR : undefined}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey={dataKey}
                  stroke={color}
                  strokeWidth={2}
                  fillOpacity={1}
                  fill={`url(#${gradId})`}
                  dot={false}
                />
              </AreaChart>
            ) : (
              <BarChart data={data} margin={{ top: 8, right: 16, left: -24, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="rgba(255,255,255,0.06)"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "#9ca3af" }}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
                <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

// ─── Main component ───────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: payload, isLoading, isError, refetch } = useDashboard();

  const [showHelpDeskPopup, setShowHelpDeskPopup] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [ticketSearch, setTicketSearch] = useState("");
  const [ticketSort, setTicketSort] = useState("date-desc");

  const d = payload?.data ?? {};

  // NextAdmin template palette — vibrant solid-fill circular icon badges.
  const statsCards = useMemo(
    () => [
      {
        title: "Total Users",
        value: String(d.stats?.users?.total ?? 0),
        icon: Users,
        iconColor: "#18BFFF",
        navigate: "/management/user",
      },
      {
        title: "Active Users",
        value: String(d.stats?.users?.active ?? 0),
        icon: UserCheck,
        iconColor: "#3FD97F",
        navigate: "/management/user",
      },
      {
        title: "Total Vendors",
        value: String(d.stats?.vendors?.total ?? 0),
        icon: ClipboardCheck,
        iconColor: "#8155FF",
        navigate: "/management/vendor",
      },
      {
        title: "Active Vendors",
        value: String(d.stats?.vendors?.active ?? 0),
        icon: Wallet,
        iconColor: "#5750F1",
        navigate: "/management/vendor",
      },
      {
        title: "Pending KYC",
        value: String(d.stats?.vendors?.pendingKyc ?? 0),
        icon: TrendingUp,
        iconColor: "#F59460",
        navigate: "/management/vendor",
      },
      {
        title: "Total Listings",
        value: String(d.stats?.listings?.total ?? 0),
        icon: MousePointer,
        iconColor: "#3C50E0",
        navigate: "/management/listing",
      },
      {
        title: "Pending Listings",
        value: String(d.stats?.listings?.pending ?? 0),
        icon: ClipboardList,
        iconColor: "#F56060",
        navigate: "/management/listing",
      },
      {
        title: "Total Revenue",
        value: formatINR(d.stats?.revenue?.total ?? 0),
        icon: IndianRupee,
        iconColor: "#FF9C55",
        navigate: "/payments",
      },
    ],
    [d.stats],
  );

  const graphs = d.graphs ?? { revenue: [], users: [], vendors: [], bookings: [] };

  const ticketData = useMemo(() => {
    const tickets = Array.isArray(d.tickets) ? d.tickets : d.latestTickets || [];
    return tickets.map((t: any) => ({
      _id: t._id,
      vendorName: t.vendorName || t.name || "N/A",
      email: t.email || t.vendorEmail || "N/A",
      subject: t.subject || "N/A",
      date: t.date || t.createdAt || "",
      dateDisplay: new Date(t.date || t.createdAt).toLocaleDateString("en-GB"),
      status: t.status || "Open",
      message: t.description || t.message || "N/A",
    }));
  }, [d.tickets, d.latestTickets]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/admin/helpdesk/${id}/status`, { status: newStatus });
      toast.success(`Ticket marked as ${newStatus}.`);
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    } catch {
      toast.error("Failed to update status.");
    }
  };

  const confirmDeleteTicket = async () => {
    if (!confirmDelete) return;
    const id = confirmDelete;
    setConfirmDelete(null);
    try {
      await api.delete(`/admin/helpdesk/${id}`);
      toast.success("Ticket deleted.");
      queryClient.invalidateQueries({ queryKey: adminKeys.dashboard() });
    } catch {
      toast.error("Failed to delete ticket.");
    }
  };

  // ── Ticket filtering + sorting ──────────────────────────────────────────────
  const filteredTickets = useMemo(() => {
    let rows = [...ticketData];
    if (ticketSearch.trim()) {
      const q = ticketSearch.toLowerCase();
      rows = rows.filter(
        (t) =>
          t.vendorName.toLowerCase().includes(q) ||
          t.email.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q),
      );
    }
    rows.sort((a, b) => {
      if (ticketSort === "date-desc")
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (ticketSort === "date-asc") return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (ticketSort === "status") return a.status.localeCompare(b.status);
      if (ticketSort === "name") return a.vendorName.localeCompare(b.vendorName);
      return 0;
    });
    return rows;
  }, [ticketData, ticketSearch, ticketSort]);

  return (
    <AdminLayout title="Dashboard" subtitle="Overview of your TravelHomes business">
      <div className="space-y-6 md:space-y-7">
        {/* ── Stat Cards ───────────────────────────────────────────────────── */}
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4 2xl:grid-cols-4 2xl:gap-7">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-tpl-dark-2 rounded-2xl border border-app-border shadow-tpl-1 p-5 animate-pulse"
                >
                  <div className="size-11 rounded-xl bg-tpl-gray-2 dark:bg-white/5" />
                  <div className="mt-5 space-y-2">
                    <div className="h-7 w-20 rounded bg-tpl-gray-2 dark:bg-white/5" />
                    <div className="h-3 w-24 rounded bg-tpl-gray-2 dark:bg-white/5" />
                  </div>
                </div>
              ))
            : statsCards.map((stat, i) => (
                <AdminStatCard
                  key={stat.title}
                  title={stat.title}
                  value={stat.value}
                  icon={stat.icon}
                  iconColor={stat.iconColor}
                  onClick={() => navigate(stat.navigate)}
                  delay={i * 0.05}
                />
              ))}
        </div>

        {isError && (
          <div className="flex items-center justify-between gap-3 rounded-[10px] border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-5 py-4">
            <div className="flex items-center gap-2.5 text-[13px] text-red-700 dark:text-red-400">
              <AlertCircle size={18} />
              Couldn’t load the latest dashboard data.
            </div>
            <button
              onClick={() => refetch()}
              className="rounded-full bg-red-600 hover:bg-red-700 px-4 h-9 text-[13px] font-semibold text-white transition-colors"
            >
              Try again
            </button>
          </div>
        )}

        {/* ── Charts ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6 2xl:gap-7">
          <DashboardChart
            title="Revenue Generated"
            data={graphs.revenue}
            type="area"
            color="#30B8BF"
            dataKey="total"
            loading={isLoading}
          />
          <DashboardChart
            title="Bookings"
            data={graphs.bookings}
            type="area"
            color="#22AD5C"
            dataKey="count"
            loading={isLoading}
          />
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6 2xl:gap-7">
          <DashboardChart
            title="Active Users"
            data={graphs.users}
            type="bar"
            color="#2660A0"
            dataKey="count"
            loading={isLoading}
          />
          <DashboardChart
            title="Active Vendors"
            data={graphs.vendors}
            type="bar"
            color="#F59460"
            dataKey="count"
            loading={isLoading}
          />
        </div>

        {/* ── Tickets Table — template card style ──────────────────────────── */}
        <div className="bg-white dark:bg-tpl-dark-2 rounded-2xl border border-tpl-stroke shadow-tpl-1 overflow-hidden">
          <div className="px-6 py-5 border-b border-tpl-stroke dark:border-tpl-stroke flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-[20px] font-bold text-tpl-dark dark:text-white">Tickets Raised</h3>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-tpl-dark-5"
                />
                <Input
                  type="search"
                  placeholder="Search tickets…"
                  value={ticketSearch}
                  onChange={(e) => setTicketSearch(e.target.value)}
                  className="w-52 h-10 text-sm pl-9"
                />
              </div>
              <Select value={ticketSort} onValueChange={setTicketSort}>
                <SelectTrigger className="w-40 h-10 text-sm rounded-full border-tpl-stroke bg-tpl-gray-2 dark:bg-white/5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Newest First</SelectItem>
                  <SelectItem value="date-asc">Oldest First</SelectItem>
                  <SelectItem value="status">By Status</SelectItem>
                  <SelectItem value="name">By Name</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="px-6">Name</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead className="hidden lg:table-cell">Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`sk-${i}`} className="animate-pulse">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j} className={j === 0 ? "px-6" : ""}>
                        <div
                          className={`h-3 rounded bg-tpl-gray-2 dark:bg-white/5 ${j === 5 ? "w-8 ml-auto" : j === 0 ? "w-28" : "w-20"}`}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filteredTickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-sm text-tpl-dark-5">
                    {ticketSearch ? "No tickets match your search." : "No tickets found."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredTickets.map((ticket) => (
                  <TableRow key={ticket._id}>
                    <TableCell className="font-medium text-tpl-dark dark:text-white px-6">
                      {ticket.vendorName}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{ticket.email}</TableCell>
                    <TableCell className="max-w-[240px] truncate">{ticket.subject}</TableCell>
                    <TableCell className="hidden lg:table-cell">{ticket.dateDisplay}</TableCell>
                    <TableCell>
                      <StatusBadge status={ticket.status} />
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            className="p-1.5 rounded-md text-tpl-dark-5 hover:text-tpl-primary hover:bg-tpl-primary-soft transition-colors focus:outline-none"
                            aria-label="Ticket actions"
                          >
                            <MoreHorizontal size={16} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedTicket(ticket);
                              setShowHelpDeskPopup(true);
                            }}
                            className="gap-2 cursor-pointer"
                          >
                            <Eye size={15} /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleUpdateStatus(ticket._id, "Read")}
                            className="gap-2 cursor-pointer"
                          >
                            <CheckCircle size={15} className="text-tpl-blue" /> Mark Read
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleUpdateStatus(ticket._id, "Pending")}
                            className="gap-2 cursor-pointer"
                          >
                            <Clock size={15} className="text-tpl-orange" /> Mark Pending
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleUpdateStatus(ticket._id, "Resolved")}
                            className="gap-2 cursor-pointer"
                          >
                            <CheckCircle size={15} className="text-tpl-green" /> Resolve
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setConfirmDelete(ticket._id)}
                            className="gap-2 cursor-pointer text-tpl-red focus:text-tpl-red focus:bg-tpl-red-soft"
                          >
                            <Trash2 size={15} /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <HelpDeskPopup
        isOpen={showHelpDeskPopup}
        onClose={() => setShowHelpDeskPopup(false)}
        ticket={selectedTicket}
      />

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteTicket}
        title="Delete ticket?"
        description="This action cannot be undone."
      />
    </AdminLayout>
  );
};

export default AdminDashboard;
