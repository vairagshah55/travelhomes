import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion } from "framer-motion";
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
  Search,
  MoreHorizontal,
  CheckCircle,
  Clock,
  Eye,
  TrendingUp,
  IndianRupee,
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
import AdminLayout from "../components/AdminLayout";
import HelpDeskPopup from "@/components/HelpDeskPopup";
import { useNavigate } from "react-router-dom";
import { StatusBadge } from "@/admin/ui/StatusBadge";
import { ChartTooltip } from "@/admin/ui/ChartTooltip";
import { ConfirmModal } from "@/admin/ui/ConfirmModal";
import { Breadcrumb } from "@/admin/ui/Breadcrumb";
import { formatINR } from "@/utils/formatCurrency";

// ─── Chart component defined outside to prevent recreation on every render ────
const DashboardChart = ({
  title,
  data,
  type = "area",
  color = "#185FA5",
  dataKey = "value",
}: {
  title: string;
  data: any[];
  type?: "area" | "bar";
  color?: string;
  dataKey?: string;
}) => {
  const gradId = `grad_${title.replace(/\s+/g, "_")}`;
  return (
    <div className="bg-white rounded-lg border border-surface-border p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-dashboard-body">{title}</h3>
        <span className="text-[11px] px-2 py-0.5 bg-surface-muted rounded-full text-gray-400">
          Last 6 Months
        </span>
      </div>
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          {type === "area" ? (
            <AreaChart data={data} margin={{ top: 8, right: 16, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <Tooltip content={<ChartTooltip valuePrefix={dataKey === "total" ? "₹" : ""} valueFormatter={dataKey === "total" ? formatINR : undefined} />} />
              <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fillOpacity={1} fill={`url(#${gradId})`} dot={false} />
            </AreaChart>
          ) : (
            <BarChart data={data} margin={{ top: 8, right: 16, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <Tooltip cursor={{ fill: "rgba(0,0,0,0.03)" }} />
              <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// ─── Count-up hook ─────────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 900) {
  const [count, setCount] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const start = prev.current;
    const diff = target - start;
    if (diff === 0) return;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.round(start + diff * ease));
      if (progress < 1) requestAnimationFrame(tick);
      else prev.current = target;
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return count;
}

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard = ({
  title,
  value,
  icon: Icon,
  bgColor,
  iconBg,
  onClick,
  index,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  bgColor: string;
  iconBg: string;
  onClick: () => void;
  index: number;
}) => {
  const numericTarget = parseInt(value, 10);
  const isNumeric = !isNaN(numericTarget) && value !== "—";
  const animated = useCountUp(isNumeric ? numericTarget : 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.25, ease: "easeOut" }}
      onClick={onClick}
      className={`${bgColor} rounded-lg cursor-pointer px-4 py-3.5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group`}
    >
      <div className="flex items-center gap-3">
        <div className={`${iconBg} rounded-lg p-2 shrink-0 group-hover:scale-105 transition-transform duration-200`}>
          <Icon size={15} className="text-gray-600" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-gray-500 truncate">{title}</p>
          <p className="text-lg font-bold text-dashboard-heading font-geist tracking-tight leading-tight mt-0.5">
            {isNumeric ? animated : value}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Auth header helper ────────────────────────────────────────────────────────
const authHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken")}`,
});

// ─── Main component ───────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const navigate = useNavigate();
  const [showHelpDeskPopup, setShowHelpDeskPopup] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [ticketSearch, setTicketSearch] = useState("");
  const [ticketSort, setTicketSort] = useState("date-desc");

  const [statsCards, setStatsCards] = React.useState([
    { title: "Total Users",      value: "—", icon: Users,          bgColor: "bg-orange-50",  iconBg: "bg-orange-100",  navigate: "/management/user"    },
    { title: "Active Users",     value: "—", icon: UserCheck,      bgColor: "bg-green-50",   iconBg: "bg-green-100",   navigate: "/management/user"    },
    { title: "Total Vendors",    value: "—", icon: ClipboardCheck, bgColor: "bg-blue-50",    iconBg: "bg-blue-100",    navigate: "/management/vendor"  },
    { title: "Active Vendors",   value: "—", icon: Wallet,         bgColor: "bg-purple-50",  iconBg: "bg-purple-100",  navigate: "/management/vendor"  },
    { title: "Pending KYC",      value: "—", icon: TrendingUp,     bgColor: "bg-yellow-50",  iconBg: "bg-yellow-100",  navigate: "/management/vendor"  },
    { title: "Total Listings",   value: "—", icon: MousePointer,   bgColor: "bg-indigo-50",  iconBg: "bg-indigo-100",  navigate: "/management/listing" },
    { title: "Pending Listings", value: "—", icon: ClipboardList,  bgColor: "bg-red-50",     iconBg: "bg-red-100",     navigate: "/management/listing" },
    { title: "Total Revenue",    value: "—", icon: IndianRupee,    bgColor: "bg-amber-50",   iconBg: "bg-amber-100",   navigate: "/payments"           },
  ]);

  const [ticketData, setTicketData] = React.useState<any[]>([]);
  const [graphs, setGraphs] = React.useState<any>({ revenue: [], users: [], vendors: [], bookings: [] });

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("/api/admin/dashboard", { headers: authHeader() });
        const json = await res.json();
        const d = json?.data || {};

        setStatsCards([
          { title: "Total Users",        value: String(d.stats?.users?.total        ?? 0), icon: Users,          bgColor: "bg-orange-50",  iconBg: "bg-orange-100",  navigate: "/management/user"    },
          { title: "Active Users",       value: String(d.stats?.users?.active       ?? 0), icon: UserCheck,      bgColor: "bg-green-50",   iconBg: "bg-green-100",   navigate: "/management/user"    },
          { title: "Total Vendors",      value: String(d.stats?.vendors?.total      ?? 0), icon: ClipboardCheck, bgColor: "bg-blue-50",    iconBg: "bg-blue-100",    navigate: "/management/vendor"  },
          { title: "Active Vendors",     value: String(d.stats?.vendors?.active     ?? 0), icon: Wallet,         bgColor: "bg-purple-50",  iconBg: "bg-purple-100",  navigate: "/management/vendor"  },
          { title: "Pending KYC",        value: String(d.stats?.vendors?.pendingKyc ?? 0), icon: TrendingUp,     bgColor: "bg-yellow-50",  iconBg: "bg-yellow-100",  navigate: "/management/vendor"  },
          { title: "Total Listings",     value: String(d.stats?.listings?.total     ?? 0), icon: MousePointer,   bgColor: "bg-indigo-50",  iconBg: "bg-indigo-100",  navigate: "/management/listing" },
          { title: "Pending Listings",   value: String(d.stats?.listings?.pending   ?? 0), icon: ClipboardList,  bgColor: "bg-red-50",     iconBg: "bg-red-100",     navigate: "/management/listing" },
          { title: "Total Revenue",      value: formatINR(d.stats?.revenue?.total   ?? 0), icon: IndianRupee,    bgColor: "bg-amber-50",   iconBg: "bg-amber-100",   navigate: "/payments"           },
        ]);

        if (d.graphs) setGraphs(d.graphs);

        const tickets = Array.isArray(d.tickets) ? d.tickets : (d.latestTickets || []);
        setTicketData(
          tickets.map((t: any) => ({
            _id: t._id,
            vendorName: t.vendorName || t.name || "N/A",
            email: t.email || t.vendorEmail || "N/A",
            subject: t.subject || "N/A",
            date: t.date || t.createdAt || "",
            dateDisplay: new Date(t.date || t.createdAt).toLocaleDateString("en-GB"),
            status: t.status || "Open",
            message: t.description || t.message || "N/A",
          })),
        );
      } catch {
        // silently fail on poll — avoids noisy toast on every 60s cycle
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 60_000);
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/helpdesk/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success(`Ticket marked as ${newStatus}.`);
        setTicketData((prev) => prev.map((t) => (t._id === id ? { ...t, status: newStatus } : t)));
      } else {
        toast.error("Failed to update status.");
      }
    } catch {
      toast.error("Error updating status.");
    }
  };

  const handleDeleteTicket = (id: string) => {
    setConfirmDelete(id);
  };

  const confirmDeleteTicket = async () => {
    if (!confirmDelete) return;
    const id = confirmDelete;
    setConfirmDelete(null);
    try {
      const res = await fetch(`/api/admin/helpdesk/${id}`, { method: "DELETE", headers: authHeader() });
      if (res.ok) {
        toast.success("Ticket deleted.");
        setTicketData((prev) => prev.filter((t) => t._id !== id));
      } else {
        toast.error("Failed to delete ticket.");
      }
    } catch {
      toast.error("Error deleting ticket.");
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
      if (ticketSort === "date-desc") return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (ticketSort === "date-asc")  return new Date(a.date).getTime() - new Date(b.date).getTime();
      if (ticketSort === "status")    return a.status.localeCompare(b.status);
      if (ticketSort === "name")      return a.vendorName.localeCompare(b.vendorName);
      return 0;
    });
    return rows;
  }, [ticketData, ticketSearch, ticketSort]);


  return (
    <AdminLayout title="Dashboard">
      <Breadcrumb items={[{ label: "Dashboard" }]} />
      <div className="space-y-[14px]">
        {/* ── Stat Cards ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 xl:grid-cols-8 gap-[14px]">
          {statsCards.map((stat, i) => (
            <StatCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              bgColor={stat.bgColor}
              iconBg={stat.iconBg}
              onClick={() => navigate(stat.navigate)}
              index={i}
            />
          ))}
        </div>

        {/* ── Charts ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-[14px]">
          <DashboardChart title="Revenue Generated" data={graphs.revenue} type="area" color="#185FA5" dataKey="total" />
          <DashboardChart title="Bookings"           data={graphs.bookings} type="area" color="#1D9E75" dataKey="count" />
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-[14px]">
          <DashboardChart title="Active Users"   data={graphs.users}   type="bar" color="#378ADD" dataKey="count" />
          <DashboardChart title="Active Vendors" data={graphs.vendors} type="bar" color="#EF9F27" dataKey="count" />
        </div>

        {/* ── Tickets Table ────────────────────────────────────────────────── */}
        <div className="bg-white rounded-lg border border-surface-border overflow-hidden">
          <div className="px-4 py-3 border-b border-surface-border flex items-center justify-between flex-wrap gap-3">
            <h3 className="text-sm font-semibold text-dashboard-heading font-geist">Tickets Raised</h3>
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search tickets…"
                  value={ticketSearch}
                  onChange={(e) => setTicketSearch(e.target.value)}
                  className="pl-8 w-48 h-8 text-xs border-surface-border rounded-lg"
                />
              </div>
              <Select value={ticketSort} onValueChange={setTicketSort}>
                <SelectTrigger className="w-36 h-8 text-xs border-surface-border">
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
            <TableHeader className="bg-surface-muted">
              <TableRow>
                <TableHead className="font-semibold text-[11px] uppercase tracking-wide text-gray-400 h-9">Name</TableHead>
                <TableHead className="font-semibold text-[11px] uppercase tracking-wide text-gray-400 h-9">Email</TableHead>
                <TableHead className="font-semibold text-[11px] uppercase tracking-wide text-gray-400 h-9">Subject</TableHead>
                <TableHead className="font-semibold text-[11px] uppercase tracking-wide text-gray-400 h-9">Date</TableHead>
                <TableHead className="font-semibold text-[11px] uppercase tracking-wide text-gray-400 h-9">Status</TableHead>
                <TableHead className="font-semibold text-[11px] uppercase tracking-wide text-gray-400 h-9 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-xs text-gray-400">
                    {ticketSearch ? "No tickets match your search." : "No tickets found."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredTickets.map((ticket) => (
                  <TableRow key={ticket._id} className="border-b border-surface-border hover:bg-surface-muted/60 transition-colors">
                    <TableCell className="font-medium text-xs py-2.5">{ticket.vendorName}</TableCell>
                    <TableCell className="text-xs text-gray-500">{ticket.email}</TableCell>
                    <TableCell className="text-xs text-gray-600 max-w-[200px] truncate">{ticket.subject}</TableCell>
                    <TableCell className="text-xs text-gray-500">{ticket.dateDisplay}</TableCell>
                    <TableCell>
                      <StatusBadge status={ticket.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors focus:outline-none">
                            <MoreHorizontal size={15} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => { setSelectedTicket(ticket); setShowHelpDeskPopup(true); }} className="gap-2 cursor-pointer">
                            <Eye size={15} /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(ticket._id, "Read")} className="gap-2 cursor-pointer">
                            <CheckCircle size={15} className="text-blue-500" /> Mark Read
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(ticket._id, "Pending")} className="gap-2 cursor-pointer">
                            <Clock size={15} className="text-orange-500" /> Mark Pending
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateStatus(ticket._id, "Resolved")} className="gap-2 cursor-pointer">
                            <CheckCircle size={15} className="text-green-500" /> Resolve
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteTicket(ticket._id)} className="gap-2 cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50">
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
