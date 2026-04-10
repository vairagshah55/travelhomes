import React, { useEffect, useState } from "react";
import {
  Search,
  Filter,
  ChevronDown,
  Eye,
  MoreHorizontal,
  X,
  Bell,
} from "lucide-react";
import AdminSidebar from "../components/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AdminProfileDropdown from "../components/AdminProfileDropdown";
import AdminHeader from "../components/AdminHeader";
import { helpDeskService } from "@/services/api";

interface HelpDeskItem {
  _id: string;
  vendorName?: string;
  name?: string;
  companyName?: string;
  email?: string;
  phoneNumber?: string;
  subject: string;
  createdAt?: string | Date;
  date?: string | Date;
  status: "Pending" | "Resolved";
  description?: string;
  message?: string;
}

const AdminHelpDesk: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<HelpDeskItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("camper_van");
  const [statusFilter, setStatusFilter] = useState<"all" | "Pending" | "Resolved">("all");
  const [mobileOpen, setMobileOpen] = useState(false);

  const [items, setItems] = useState<HelpDeskItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch items from API
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        setError(null);
        const apiSortBy = sortBy === 'date' ? 'date' : sortBy === 'status' ? 'status' : 'createdAt';
        const response = await helpDeskService.getItems({
          search: searchTerm || undefined,
          sortBy: apiSortBy as any,
          sortDir: 'desc',
          status: statusFilter,
        });
        const data = (response && response.data) ? response.data : (Array.isArray(response) ? response : []);
        setItems(data as HelpDeskItem[]);
      } catch (err: any) {
        setError(typeof err === 'string' ? err : 'Failed to fetch help desk items.');
        console.error('Error fetching help desk items:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [searchTerm, sortBy, statusFilter]);

  const formatDate = (d: string | Date) => {
    try {
      const dt = new Date(d);
      if (isNaN(dt.getTime())) return String(d);
      return dt.toLocaleDateString('en-GB'); // DD/MM/YYYY
    } catch {
      return String(d);
    }
  };

  const handleView = (item: HelpDeskItem) => {
    setSelectedItem(item);
  };

  const handleResolve = async (id: string) => {
    try {
      setLoading(true);
      await helpDeskService.updateStatus(id, 'Resolved');
      // Refresh list after update
      const apiSortBy = sortBy === 'date' ? 'date' : sortBy === 'status' ? 'status' : 'createdAt';
      const refreshed = await helpDeskService.getItems({
        search: searchTerm || undefined,
        sortBy: apiSortBy as any,
        sortDir: 'desc',
        status: statusFilter,
      });
      const data = (refreshed && refreshed.data) ? refreshed.data : (Array.isArray(refreshed) ? refreshed : []);
      setItems(data as HelpDeskItem[]);
    } catch (err) {
      console.error('Failed to update status', err);
    } finally {
      setLoading(false);
    }
  };

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
          Headtitle={"Help Desk"}
          setMobileSidebarOpen={setMobileOpen}
        />

        {/* Main Content */}
        <div className="flex-1 p-5">
          <div className="bg-white rounded-t-3xl rounded-b-6 border border-dashboard-stroke h-full flex flex-col">
            {/* Content Header */}
            <div className="px-5 py-4 border-b border-dashboard-stroke">
              <h2 className="text-sm font-bold text-dashboard-heading font-geist tracking-tight">
                List
              </h2>
            </div>

            {/* Content Body */}
            <div className="flex-1 p-5 space-y-6">
              {/* Search and Filters */}
              <div className="flex items-center justify-between gap-5  max-md:flex-wrap">
                <div className="flex items-center gap-2 flex-1">
                  <div className="relative max-w-[255px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dashboard-body" />
                    <Input
                      placeholder="Search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-10 border-dashboard-neutral-06 text-sm font-plus-jakarta bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4  max-md:flex-wrap ">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-dashboard-body font-poppins">
                      Sort By
                    </span>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-[159px] h-10 border-dashboard-stroke text-sm font-poppins text-dashboard-body">
                        <SelectValue placeholder="Camper Van" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="camper_van">Camper Van</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="status">Status</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-10 px-5 border-dashboard-stroke text-dashboard-body font-poppins gap-2"
                      >
                        <Filter className="w-[18px] h-[18px]" />
                        {statusFilter === 'all' ? 'Filters' : statusFilter}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 bg-white">
                      <DropdownMenuItem onClick={() => setStatusFilter("all")}>
                        All
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter("Pending")}>
                        Pending
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setStatusFilter("Resolved")}>
                        Resolved
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Table */}
              <div className="border border-dashboard-stroke rounded-xl bg-white overflow-scroll">
                {/* Table Header */}
                <div className="flex items-center bg-gray-50 border-b border-dashboard-stroke">
                  <div className="w-[164px] px-4 py-3">
                    <span className="text-sm font-bold text-dashboard-title font-plus-jakarta">
                      Name
                    </span>
                  </div>
                  <div className="w-[256px] px-3 py-3">
                    <span className="text-sm font-bold text-dashboard-title font-plus-jakarta">
                      Email / Company
                    </span>
                  </div>
                  <div className="w-[260px] px-3 py-3">
                    <span className="text-sm font-bold text-dashboard-title font-plus-jakarta">
                      Subject
                    </span>
                  </div>
                  <div className="w-[160px] px-3 py-3">
                    <span className="text-sm font-bold text-dashboard-title font-plus-jakarta">
                      Date
                    </span>
                  </div>
                  <div className="flex-1 px-3 py-3">
                    <span className="text-sm font-bold text-dashboard-title font-plus-jakarta">
                      Status
                    </span>
                  </div>
                  <div className="w-[160px] px-3 py-3">
                    <span className="text-sm font-bold text-dashboard-title font-plus-jakarta">
                      Action
                    </span>
                  </div>
                </div>

                {/* Table Rows */}
                {items.map((item) => (
                  <div
                    key={item._id}
                    className="flex items-center border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-[164px] px-4 py-3.5">
                      <span className="text-sm text-dashboard-primary font-plus-jakarta">
                        {item.vendorName || item.name || 'N/A'}
                      </span>
                    </div>
                    <div className="w-[256px] px-3 py-3.5">
                      <span className="text-sm text-dashboard-body font-poppins">
                        {item.companyName || item.email || 'N/A'}
                      </span>
                    </div>
                    <div className="w-[260px] px-3 py-3.5">
                      <span className="text-sm text-dashboard-body font-poppins">
                        {item.subject}
                      </span>
                    </div>
                    <div className="w-[160px] px-3 py-3.5">
                      <span className="text-sm text-dashboard-primary font-plus-jakarta">
                        {formatDate(item.date || item.createdAt || new Date())}
                      </span>
                    </div>
                    <div className="flex-1 px-3 py-3">
                      <span
                        className={`inline-flex px-3 py-1 rounded-lg text-sm font-medium font-plus-jakarta ${
                          item.status === "Pending"
                            ? "bg-status-orange-bg text-status-orange-text"
                            : "bg-status-green-bg text-status-green-text"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <div className="w-[160px] px-3 py-1.5">
                      <div className="flex items-center gap-6">
                        {/* <Button
                          variant="outline"
                          size="sm"
                          className="h-8 px-4 border-dashboard-primary text-dashboard-primary hover:bg-dashboard-primary hover:text-white transition-colors font-poppins text-xs font-medium"
                          onClick={() => handleView(item)}
                        >
                          View
                        </Button> */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                            >
                              <MoreHorizontal className="w-6 h-6 text-dashboard-body" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() => handleView(item)}
                              className="gap-2"
                            >
                              <svg
                                width="18"
                                height="18"
                                viewBox="0 0 18 18"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M16.5 8V11.75C16.5 15.5 15 17 11.25 17H6.75C3 17 1.5 15.5 1.5 11.75V7.25C1.5 3.5 3 2 6.75 2H10.5"
                                  stroke="#2A2A2A"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M16.5 8H13.5C11.25 8 10.5 7.25 10.5 5V2L16.5 8Z"
                                  stroke="#2A2A2A"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M5.25 10.25H9.75"
                                  stroke="#2A2A2A"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M5.25 13.25H8.25"
                                  stroke="#2A2A2A"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleResolve(item._id)}
                              className="gap-2"
                            >
                              <svg
                                width="18"
                                height="18"
                                viewBox="0 0 18 18"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M9 17C13.125 17 16.5 13.625 16.5 9.5C16.5 5.375 13.125 2 9 2C4.875 2 1.5 5.375 1.5 9.5C1.5 13.625 4.875 17 9 17Z"
                                  stroke="#292D32"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M5.8125 9.50043L7.935 11.6229L12.1875 7.37793"
                                  stroke="#292D32"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                              Resolved
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Help Desk Details Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-3xl p-8">
          

          <DialogHeader className="space-y-7">
            <DialogTitle className="text-2xl font-bold text-dashboard-heading font-geist tracking-tight">
              Help Desk
            </DialogTitle>
          </DialogHeader>

          {selectedItem && (
            <div className="space-y-9">
              {/* First Row */}
              <div className="flex gap-10">
                <div className="flex-1 space-y-3">
                  <label className="text-sm font-bold text-dashboard-text font-geist tracking-[0.16px]">
                    Name
                  </label>
                  <p className="text-sm text-dashboard-body font-plus-jakarta tracking-[0.2px]">
                    {selectedItem.vendorName || selectedItem.name || 'N/A'}
                  </p>
                </div>
                <div className="flex-1 space-y-3">
                  <label className="text-sm font-bold text-dashboard-text font-geist tracking-[0.16px]">
                    Email / Company
                  </label>
                  <p className="text-sm text-dashboard-body font-plus-jakarta tracking-[0.2px]">
                    {selectedItem.companyName || selectedItem.email || 'N/A'}
                  </p>
                </div>
                <div className="flex-1 space-y-3">
                  <label className="text-sm font-bold text-dashboard-text font-geist tracking-[0.16px]">
                    Date
                  </label>
                  <p className="text-sm text-dashboard-body font-plus-jakarta tracking-[0.2px]">
                    {formatDate(selectedItem.date || selectedItem.createdAt || new Date())}
                  </p>
                </div>
              </div>

              {/* Second Row */}
              <div className="flex gap-10">
                <div className="flex-1 space-y-3">
                  <label className="text-sm font-bold text-dashboard-text font-geist tracking-[0.16px]">
                    Status
                  </label>
                  <p className="text-sm text-dashboard-text font-poppins">
                    {selectedItem.status}
                  </p>
                </div>
                <div className="flex-1 space-y-3">
                  <label className="text-sm font-bold text-dashboard-text font-geist tracking-[0.16px]">
                    Subject
                  </label>
                  <p className="text-sm text-dashboard-body font-plus-jakarta tracking-[0.2px]">
                    {selectedItem.subject}
                  </p>
                </div>
                <div className="flex-1 space-y-3">
                  <label className="text-sm font-bold text-dashboard-text font-geist tracking-[0.16px]">
                    Phone
                  </label>
                  <p className="text-sm text-dashboard-body font-plus-jakarta tracking-[0.2px]">
                    {selectedItem.phoneNumber || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Message */}
              <div className="space-y-3">
                <label className="text-sm font-bold text-dashboard-text font-geist tracking-[0.16px]">
                  Description
                </label>
                <p className="text-sm text-dashboard-body font-plus-jakarta leading-6 tracking-[0.16px]">
                  {selectedItem.message || selectedItem.description || 'N/A'}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminHelpDesk;
