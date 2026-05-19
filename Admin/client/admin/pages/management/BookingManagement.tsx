import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, Filter, MoreHorizontal, Eye, Trash2, CalendarX2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AdminLayout from "../../components/AdminLayout";
import BookingDetailsPopup from "@/components/BookingDetailsPopup";
import ConfirmationDialog from "@/components/ConfirmationDialog";
import { bookingService } from "@/services/api";
import Pagination from "@/components/Pagination";
import { TabStrip } from "@/admin/ui/TabStrip";
import { StatusBadge } from "@/admin/ui/StatusBadge";
import { ConfirmModal } from "@/admin/ui/ConfirmModal";
import { EmptyState } from "@/admin/ui/EmptyState";
import { Breadcrumb } from "@/admin/ui/Breadcrumb";

interface BookingData {
  _id: string;
  bookingId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  serviceName: string;
  serviceType: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  location: string;
  specialRequests?: string;
}

const BookingManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    "all-bookings" | "upcoming-bookings" | "past-booking" | "cancelled-bookings"
  >("all-bookings");
  const [activeServiceType, setActiveServiceType] = useState("caravan");
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // New state for API-backed data
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("bookingId");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const handleTabChange = (
    tabId: "all-bookings" | "upcoming-bookings" | "past-booking" | "cancelled-bookings",
  ) => {
    setActiveTab(tabId);
    // Reset service type based on new tab
    if (tabId === "all-bookings" || tabId === "upcoming-bookings") {
      setActiveServiceType("caravan");
    } else if (tabId === "past-booking") {
      setActiveServiceType("caravan");
    } else {
      setActiveServiceType("caravan");
    }
  };

  // Map UI select values to backend sort fields (no UI change)
  const mapSortValue = (val: string) => {
    if (val === "client-name") return "clientName";
    if (val === "service-name") return "serviceName";
    return "bookingId"; // default for "booking-id" or others
  };

  // Bookings list — keyed by every filter that influences the request
  // so changing any of them refetches once and caches the result.
  const bookingsKey = [
    "bookings",
    activeTab,
    activeServiceType,
    searchTerm || "",
    mapSortValue(sortBy),
  ] as const;
  const bookingsQuery = useQuery<BookingData[]>({
    queryKey: bookingsKey,
    queryFn: async () => {
      const params = {
        tab: activeTab,
        serviceType: activeServiceType,
        search: searchTerm || undefined,
        sortBy: mapSortValue(sortBy),
        sortDir: "asc" as const,
      };
      const response = await bookingService.getBookings(params);
      if (response && response.data) return response.data;
      if (Array.isArray(response)) return response as any;
      return [];
    },
  });
  const bookings = bookingsQuery.data ?? [];
  const loading = bookingsQuery.isLoading;
  const error = bookingsQuery.error
    ? (bookingsQuery.error as Error).message || "Failed to fetch bookings."
    : null;
  const fetchBookings = () => queryClient.invalidateQueries({ queryKey: bookingsKey });

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, activeServiceType, searchTerm, sortBy]);

  const tabs = [
    { id: "all-bookings", label: "All Bookings" },
    { id: "upcoming-bookings", label: "Upcoming Bookings" },
    { id: "past-booking", label: "Past Bookings" },
    { id: "cancelled-bookings", label: "Cancelled Bookings" },
  ];

  const getServiceTypes = () => {
    if (activeTab === "all-bookings") {
      return [
        { id: "caravan", label: "Caravan" },
        { id: "stay", label: "Stay" },
        { id: "activity", label: "Activity" },
      ];
    } else if (
      activeTab === "upcoming-bookings" ||
      activeTab === "past-booking" ||
      activeTab === "cancelled-bookings"
    ) {
      return [
        { id: "caravan", label: "Caravan" },
        { id: "stay", label: "Stay" },
        { id: "activity", label: "Activity" },
      ];
    }
    return [];
  };

  const serviceTypes = useMemo(getServiceTypes, [activeTab]);

  const handleViewBooking = (booking: BookingData) => {
    setSelectedBooking(booking);
    setShowBookingDetails(true);
    setShowActionMenu(null);
  };

  const handleDeleteBooking = (id: string) => {
    setShowActionMenu(null);
    setConfirmDelete(id);
  };

  const doDeleteBooking = async () => {
    if (!confirmDelete) return;
    const id = confirmDelete;
    setConfirmDelete(null);
    try {
      await bookingService.deleteBooking(id);
      toast.success("Booking deleted successfully.");
      fetchBookings();
    } catch {
      toast.error("Failed to delete booking.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-orange-100 text-orange-600";
      case "confirmed":
        return "bg-green-100 text-green-600";
      case "cancelled":
        return "bg-red-100 text-red-600";
      case "upcoming":
        return "bg-blue-100 text-blue-600";
      case "past":
        return "bg-gray-100 text-gray-600";
      default:
        return "bg-orange-100 text-orange-600";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <AdminLayout title="Bookings">
        <div className="flex-1">
          <Breadcrumb items={[{ label: "Dashboard", href: "/dashboard" }, { label: "Management" }, { label: "Bookings" }]} />

          <div className="bg-white rounded-xl border border-surface-border overflow-hidden">
            {/* Content Header */}
            <div className="px-5 py-3 border-b border-surface-border">
              <h2 className="text-sm font-semibold text-dashboard-heading font-geist tracking-tight">Booking Details</h2>
            </div>

            <div className="p-5 flex flex-col gap-5">
              {/* Tabs */}
              <TabStrip
                tabs={tabs.map((t) => ({ key: t.id, label: t.label }))}
                activeKey={activeTab}
                onChange={(k) => handleTabChange(k as any)}
              />

              {/* Service Type Filter */}
              <div className="inline-flex  max-md:flex-wrap items-center p-0.5 border border-gray-200 rounded-full bg-white shadow-sm w-fit">
                {serviceTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setActiveServiceType(type.id)}
                    className={`px-4 py-3 text-sm font-semibold rounded-full transition-colors ${
                      activeServiceType === type.id
                        ? "bg-black text-white"
                        : "text-black hover:bg-gray-50"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>

              {/* Search and Filters */}
              <div className="flex items-center justify-between  max-md:flex-wrap">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    placeholder="Search"
                    className="pl-10 border-gray-300 rounded-lg"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="flex items-center gap-4  max-md:flex-wrap">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">Sort By</span>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-40 border-gray-300">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="booking-id">Booking ID</SelectItem>
                        <SelectItem value="client-name">Client Name</SelectItem>
                        <SelectItem value="service-name">Service Name</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <button className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-600">
                    <Filter className="w-4 h-4" />
                    Filters
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="border border-gray-200 rounded-xl overflow-auto max-h-[calc(100vh-320px)]">
                <table className="w-full">
                  <thead className="sticky top-0 z-10">
                    <tr>
                      <th className="bg-gray-50 border-b border-gray-200 text-left px-4 py-3 text-sm font-bold text-gray-700">
                        Booking ID
                      </th>
                      <th className="bg-gray-50 border-b border-gray-200 text-left px-3 py-3 text-sm font-bold text-gray-700">
                        Client Name
                      </th>
                      <th className="bg-gray-50 border-b border-gray-200 text-left px-3 py-3 text-sm font-bold text-gray-700">
                        Service Name
                      </th>
                      <th className="bg-gray-50 border-b border-gray-200 text-left px-3 py-3 text-sm font-bold text-gray-700 w-40">
                        Check-in Date
                      </th>
                      <th className="bg-gray-50 border-b border-gray-200 text-left px-3 py-3 text-sm font-bold text-gray-700 w-40">
                        Check-out Date
                      </th>
                      <th className="bg-gray-50 border-b border-gray-200 text-left px-3 py-3 text-sm font-bold text-gray-700 w-32">
                        Status
                      </th>
                      <th className="text-left px-3 py-3 text-sm font-bold text-gray-700 w-40">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      Array.from({ length: 6 }).map((_, i) => (
                        <tr key={i} className="border-t border-gray-100 animate-pulse">
                          <td className="px-4 py-4"><div className="h-3.5 w-20 bg-gray-200 rounded" /></td>
                          <td className="px-3 py-4"><div className="h-3.5 w-28 bg-gray-200 rounded" /></td>
                          <td className="px-3 py-4"><div className="h-3.5 w-32 bg-gray-200 rounded" /></td>
                          <td className="px-3 py-4"><div className="h-3.5 w-24 bg-gray-200 rounded" /></td>
                          <td className="px-3 py-4"><div className="h-6 w-24 bg-gray-200 rounded-lg" /></td>
                          <td className="px-3 py-4"><div className="h-6 w-16 bg-gray-200 rounded-lg" /></td>
                          <td className="px-3 py-4"><div className="h-5 w-5 bg-gray-200 rounded" /></td>
                        </tr>
                      ))
                    ) : bookings.length === 0 ? (
                      <tr>
                        <td colSpan={7}>
                          <EmptyState
                            icon={CalendarX2}
                            title="No bookings found"
                            description="No bookings match your current filters. Try a different date range or status."
                          />
                        </td>
                      </tr>
                    ) : (
                      bookings
                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                        .map((booking, i) => (
                          <motion.tr
                            key={booking._id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03, duration: 0.18 }}
                            className="text-sm border-t border-gray-100 hover:bg-gray-50/60 transition-colors"
                          >
                            <td className="px-4 py-4">
                              <span className="font-bold text-black">{booking.bookingId}</span>
                            </td>
                            <td className="px-3 py-4 text-gray-600">{booking.clientName}</td>
                            <td className="px-3 py-4 text-gray-600">{booking.serviceName}</td>
                            <td className="px-3 py-4 text-black">{formatDate(booking.checkIn)}</td>
                            <td className="px-3 py-4">
                              <span className="px-3 py-1 bg-purple-100 text-purple-600 rounded-lg">
                                {formatDate(booking.checkOut)}
                              </span>
                            </td>
                            <td className="px-3 py-4">
                              <StatusBadge status={booking.status} />
                            </td>
                            <td className="px-3 py-4">
                              <div className="relative">
                                <button
                                  onClick={() => setShowActionMenu(showActionMenu === booking._id ? null : booking._id)}
                                  className="text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg p-1.5 transition-all"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                                {showActionMenu === booking._id && (
                                  <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-xl shadow-lg p-1 z-50 w-32">
                                    <button className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors" onClick={() => handleViewBooking(booking)}>
                                      <Eye size={15} className="text-gray-600" />
                                      <span className="text-sm text-gray-700">View</span>
                                    </button>
                                    <button className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-red-50 rounded-lg transition-colors" onClick={() => handleDeleteBooking(booking._id)}>
                                      <Trash2 size={15} className="text-red-500" />
                                      <span className="text-sm text-red-600">Delete</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
              {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-lg">{error}</div>}

              <Pagination
                currentPage={currentPage}
                totalPages={Math.max(1, Math.ceil(bookings.length / itemsPerPage))}
                onPageChange={setCurrentPage}
              />
            </div>
          </div>
        </div>

      {/* Booking Details Popup */}
      {showBookingDetails && selectedBooking && (
        <BookingDetailsPopup
          isOpen={showBookingDetails}
          onClose={() => setShowBookingDetails(false)}
          booking={selectedBooking}
        />
      )}
      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={doDeleteBooking}
        title="Delete booking?"
        description="This booking record will be permanently removed. This cannot be undone."
      />
    </AdminLayout>
  );
};

export default BookingManagement;
