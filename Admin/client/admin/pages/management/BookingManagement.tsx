import React, { useEffect, useMemo, useState } from "react";
import { Search, Filter, MoreHorizontal, Bell, Loader2, Eye, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AdminSidebar from "../../components/AdminSidebar";
import BookingDetailsPopup from "@/components/BookingDetailsPopup";
import AdminProfileDropdown from "@/admin/components/AdminProfileDropdown";
import AdminHeader from "@/admin/components/AdminHeader";
import { bookingService } from "@/services/api";
import Pagination from "@/components/Pagination";

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
  const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(
    null,
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);

  // New state for API-backed data
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("bookingId");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const handleTabChange = (
    tabId:
      | "all-bookings"
      | "upcoming-bookings"
      | "past-booking"
      | "cancelled-bookings",
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

  // Fetch bookings from API
  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        tab: activeTab,
        serviceType: activeServiceType,
        search: searchTerm || undefined,
        sortBy: mapSortValue(sortBy),
        sortDir: "asc" as const,
      };
      const response = await bookingService.getBookings(params);
      if (response && response.data) {
        setBookings(response.data);
      } else if (Array.isArray(response)) {
        setBookings(response as any);
      } else {
        setBookings([]);
      }
    } catch (err: any) {
      console.error("Error fetching bookings", err);
      setError(typeof err === "string" ? err : "Failed to fetch bookings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
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

  const handleDeleteBooking = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this booking?")) {
      try {
        await bookingService.deleteBooking(id);
        fetchBookings();
        setShowActionMenu(null);
      } catch (err: any) {
        console.error("Error deleting booking:", err);
        alert("Failed to delete booking");
      }
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
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex">
      {/* Sidebar */}
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
          Headtitle={"Bookings"}
          setMobileSidebarOpen={setMobileOpen}
        />

        {/* Main Content */}
        <div className="flex-1 p-5 pr-0 ">
          <div className="bg-white rounded-3xl border border-gray-200 h-full">
            {/* Content Header */}
            <div className="p-5 border-b border-gray-200 rounded-t-3xl">
              <h2 className="text-xl font-bold text-gray-900">
                Booking Details
              </h2>
            </div>

            <div className="p-5 flex flex-col gap-7">
              {/* Tabs */}
              <div className="flex  max-md:flex-wrap">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id as any)}
                    className={`px-4 py-3 text-base font-bold transition-colors relative ${
                      activeTab === tab.id ? "text-black" : "text-gray-400"
                    }`}
                  >
                    {tab.label}
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"></div>
                    )}
                  </button>
                ))}
              </div>

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
                        <SelectItem value="service-name">
                          Service Name
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="w-4 h-4" />
                    Filters
                  </Button>
                </div>
              </div>

              {/* Table */}
              <div className="border border-gray-200 rounded-xl overflow-scroll">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-bold text-gray-700">
                        Booking ID
                      </th>
                      <th className="text-left px-3 py-3 text-sm font-bold text-gray-700">
                        Client Name
                      </th>
                      <th className="text-left px-3 py-3 text-sm font-bold text-gray-700">
                        Service Name
                      </th>
                      <th className="text-left px-3 py-3 text-sm font-bold text-gray-700 w-40">
                        Check-in Date
                      </th>
                      <th className="text-left px-3 py-3 text-sm font-bold text-gray-700 w-40">
                        Check-out Date
                      </th>
                      <th className="text-left px-3 py-3 text-sm font-bold text-gray-700 w-32">
                        Status
                      </th>
                      <th className="text-left px-3 py-3 text-sm font-bold text-gray-700 w-40">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings
                      .slice(
                        (currentPage - 1) * itemsPerPage,
                        currentPage * itemsPerPage,
                      )
                      .map((booking) => (
                        <tr
                          key={booking._id}
                          className="text-sm border-t border-gray-100"
                        >
                        <td className="px-4 py-4">
                          <span className="text-sm font-bold text-black">
                            {booking.bookingId}
                          </span>
                        </td>
                        <td className="text-sm px-3 py-4 text-gray-600">
                          {booking.clientName}
                        </td>
                        <td className="text-sm px-3 py-4 text-gray-600">
                          {booking.serviceName}
                        </td>
                        <td className="text-sm px-3 py-4 text-black">
                          {formatDate(booking.checkIn)}
                        </td>
                        <td className="text-sm px-3 py-4">
                          <span className="px-3 py-1 bg-purple-100 text-purple-600 rounded-lg text-sm">
                            {formatDate(booking.checkOut)}
                          </span>
                        </td>
                        <td className="text-sm px-3 py-4">
                          <span
                            className={` px-3 py-1 rounded-lg text-sm ${getStatusColor(booking.status)}`}
                          >
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-3 py-4">
                          <div className="relative">
                            <button
                              onClick={() =>
                                setShowActionMenu(
                                  showActionMenu === booking._id
                                    ? null
                                    : booking._id,
                                )
                              }
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <MoreHorizontal className="w-5 h-5" />
                            </button>

                            {/* Action Menu Dropdown */}
                            {showActionMenu === booking._id && (
                              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-xl shadow-lg p-1 z-50 w-32">
                                <button
                                  className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                                  onClick={() => handleViewBooking(booking)}
                                >
                                  <Eye size={16} className="text-gray-600" />
                                  <span className="text-sm text-gray-700">
                                    View
                                  </span>
                                </button>
                                <button
                                  className="flex items-center gap-2 w-full px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                                  onClick={() =>
                                    handleDeleteBooking(booking._id)
                                  }
                                >
                                  <Trash2 size={16} className="text-red-500" />
                                  <span className="text-sm text-red-600">
                                    Delete
                                  </span>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!loading && bookings.length === 0 && (
                      <tr>
                        <td className="px-4 py-6 text-gray-500" colSpan={7}>
                          No records
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {loading && (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="animate-spin h-8 w-8 text-gray-600" />
                  <div className="text-sm text-gray-500 px-3">Loading...</div>
                </div>
              )}
              {error && (
                <div className="text-sm text-red-600 px-3">{error}</div>
              )}

              <Pagination
                currentPage={currentPage}
                totalPages={Math.max(1, Math.ceil(bookings.length / itemsPerPage))}
                onPageChange={setCurrentPage}
              />
            </div>
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
    </div>
  );
};

export default BookingManagement;
