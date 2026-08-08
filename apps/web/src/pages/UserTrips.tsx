import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import Footer from "../components/Footer";
import FilterModal from "../components/FilterModal";
import MobileUserNav from "../components/MobileUserNav";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import LogoWebsite from "@/components/ui/LogoWebsite";
import { IoIosArrowBack } from "react-icons/io";
import { SlidersHorizontal, X, Star, Download, MapPinned } from "lucide-react";
import { testimonialsApi } from "../lib/testimonials";
import { bookingsApi, BookingDTO } from "../lib/api";
import UniqueStaysSkeleton from "@/utils/UniqueStaysSkeleton";
import { getImageUrl } from "@/lib/utils";
import { CustomPagination } from "@/components/CustomPagination";

const TABS = [
  { key: "upcoming", label: "Upcoming" },
  { key: "previous", label: "Previous" },
  { key: "delete", label: "Delete" },
] as const;

const getStatusBadgeClass = (status?: string) => {
  const s = (status || "").toLowerCase();
  if (s === "cancelled") return "bg-red-50 text-red-600";
  if (s === "pending") return "bg-amber-50 text-amber-700";
  if (s === "completed" || s === "checked-out") return "bg-gray-100 text-gray-600";
  return "bg-[#e6fafa] text-[#117479]";
};

const UserTrips = () => {
  const { user, token: authToken } = useAuth();
  const token = authToken ?? "";
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"upcoming" | "previous" | "delete">("upcoming");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<BookingDTO | null>(null);
  const [selectedTrips, setSelectedTrips] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  const uid = user?.id || (user as any)?._id;
  const tripsKey = ["bookings", "userTrips", uid] as const;

  // useQuery handles loading state, dedups in-flight requests, and caches
  // across navigation. The legacy version refetched on every component
  // mount (e.g. after navigating into trip details and back).
  const { data: allBookings = [], isLoading: loading } = useQuery<BookingDTO[]>({
    queryKey: tripsKey,
    enabled: !!uid,
    queryFn: async () => {
      const res = await bookingsApi.getUserBookings(uid, token);
      if (res.success) return res.bookings;
      toast.error("Failed to load your trips. Please try again.");
      throw new Error("getUserBookings: success=false");
    },
  });

  useEffect(() => {
    setPage(1);
    if (activeTab !== "delete") {
      setSelectedTrips([]);
    }
  }, [activeTab]);

  const upcomingTrips = allBookings.filter((b) =>
    ["confirmed", "pending", "active", "checked-in"].includes(b.bookingStatus?.toLowerCase()),
  );

  const previousTrips = allBookings.filter((b) =>
    ["completed", "checked-out", "cancelled"].includes(b.bookingStatus?.toLowerCase()),
  );

  const currentTrips =
    activeTab === "upcoming"
      ? upcomingTrips
      : activeTab === "previous"
        ? previousTrips
        : allBookings;

  const itemsPerPage = 12;
  const totalPages = Math.ceil(currentTrips.length / itemsPerPage);
  const paginatedTrips = currentTrips.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const [cancelled, setcancelled] = useState(false);
  const handleFilterApply = (filters: any) => {
    console.log("Applied filters:", filters);
    // Here you would typically filter the trips based on the applied filters
  };

  const handleDeleteSelected = async () => {
    if (selectedTrips.length === 0) return;

    if (
      !window.confirm(
        `Are you sure you want to delete ${selectedTrips.length} trips? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      const deletePromises = selectedTrips.map((id) => bookingsApi.delete(id, token));
      await Promise.all(deletePromises);

      // Drop deleted rows from the cache rather than refetching the
      // whole list — the deleteMany endpoint is best-effort.
      queryClient.setQueryData<BookingDTO[]>(tripsKey, (prev) =>
        (prev ?? []).filter((b) => !selectedTrips.includes(b._id)),
      );
      setSelectedTrips([]);
      toast.success("Selected trips deleted successfully");
    } catch (error) {
      console.error("Error deleting trips:", error);
      toast.error("Failed to delete some trips");
    }
  };

  const toggleTripSelection = (id: string) => {
    setSelectedTrips((prev) =>
      prev.includes(id) ? prev.filter((tid) => tid !== id) : [...prev, id],
    );
  };

  const handleCancelletion = async (trip: BookingDTO) => {
    try {
      const res = await bookingsApi.updateStatus(trip._id, "cancelled", token);
      if (res.success) {
        queryClient.setQueryData<BookingDTO[]>(tripsKey, (prev) =>
          (prev ?? []).map((b) => (b._id === trip._id ? { ...b, bookingStatus: "cancelled" } : b)),
        );
        setIsCancelModalOpen(false);
        setcancelled(true);
      }
    } catch (error) {
      console.error("Error cancelling booking:", error);
    }
  };

  const handleCancel = (trip: BookingDTO) => {
    setSelectedTrip(trip);
    setIsCancelModalOpen(true);
  };

  const handleView = (trip: BookingDTO) => {
    setSelectedTrip(trip);
    setIsViewModalOpen(true);
  };

  const handleReview = (trip: BookingDTO) => {
    setSelectedTrip(trip);
    setIsReviewModalOpen(true);
  };

  const handleGetInvoice = (trip: BookingDTO) => {
    setSelectedTrip(trip);
    setIsInvoiceModalOpen(true);
  };

  const TripCard = ({
    trip,
    isPrevious = false,
    onCancel,
    onView,
    onReview,
    onGetInvoice,
    selectable = false,
    selected = false,
    onSelect,
  }: {
    trip: BookingDTO;
    isPrevious?: boolean;
    onCancel: (trip: BookingDTO) => void;
    onView: (trip: BookingDTO) => void;
    onReview: (trip: BookingDTO) => void;
    onGetInvoice: (trip: BookingDTO) => void;
    selectable?: boolean;
    selected?: boolean;
    onSelect?: () => void;
  }) => (
    <div
      className={`flex flex-col bg-white rounded-2xl border overflow-hidden transition-all h-full ${
        selected ? "border-[#3BD9DA] ring-2 ring-[#3BD9DA]/30" : "border-gray-200 hover:shadow-lg"
      }`}
    >
      <div className="relative h-44 sm:h-48">
        {selectable && (
          <div className="absolute top-3 left-3 z-10 bg-white/90 rounded-md p-1 backdrop-blur-sm shadow-sm">
            <input
              type="checkbox"
              checked={selected}
              onChange={(e) => {
                e.stopPropagation();
                if (onSelect) onSelect();
              }}
              className="w-5 h-5 rounded border-gray-300 accent-[#3BD9DA] cursor-pointer"
            />
          </div>
        )}
        <img
          src={getImageUrl(trip.serviceDetails?.photos?.coverUrl)}
          alt={trip.serviceName}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 right-3">
          <span
            className={`inline-block px-3 py-1 text-[11px] font-bold rounded-full uppercase shadow-sm backdrop-blur-sm ${getStatusBadgeClass(trip.bookingStatus)}`}
          >
            {trip.bookingStatus}
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-5 flex flex-col flex-1 gap-3">
        <div className="space-y-2">
          <h3
            className="text-lg sm:text-xl font-bold text-[#0a1c1c] font-geist line-clamp-1"
            title={trip.serviceDetails?.brandName || trip.serviceDetails?.name || trip.serviceName}
          >
            {trip.serviceDetails?.brandName || trip.serviceDetails?.name || trip.serviceName}
          </h3>

          <div className="grid grid-cols-2 gap-3 text-sm mt-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-gray-500 font-plus-jakarta uppercase">
                Checkin
              </span>
              <span className="text-[#0a1c1c] font-medium font-plus-jakarta">
                {new Date(trip.checkInDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-gray-500 font-plus-jakarta uppercase">
                Checkout
              </span>
              <span className="text-[#0a1c1c] font-medium font-plus-jakarta">
                {new Date(trip.checkOutDate).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm pt-2">
            <span className="text-xs font-bold text-gray-500 font-plus-jakarta uppercase">
              Guests:
            </span>
            <span className="text-[#0a1c1c] font-medium font-plus-jakarta">
              {trip.numberOfGuests}
            </span>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-gray-100 flex flex-col gap-3">
          <div className="text-lg font-bold text-[#0a1c1c] font-plus-jakarta">
            <span className="text-xl">₹{trip.totalAmount}</span>
            <span className="text-sm font-normal text-gray-500 ml-1">total</span>
          </div>

          <div className="flex flex-wrap gap-2 justify-end">
            {isPrevious ? (
              <>
                <Button
                  onClick={() => onGetInvoice(trip)}
                  variant="outline"
                  size="sm"
                  className="rounded-full text-xs font-geist border-gray-200 text-[#0a1c1c] hover:text-[#117479] hover:bg-[#e6fafa] hover:border-[#3BD9DA]"
                >
                  Invoice
                </Button>
                <Button
                  onClick={() => onView(trip)}
                  variant="outline"
                  size="sm"
                  className="rounded-full text-xs font-geist border-gray-200 text-[#0a1c1c] hover:text-[#117479] hover:bg-[#e6fafa] hover:border-[#3BD9DA]"
                >
                  View
                </Button>
                {trip.bookingStatus !== "cancelled" && (
                  <Button
                    onClick={() => onReview(trip)}
                    size="sm"
                    className="bg-[#3BD9DA] text-white hover:bg-[#2BC7C8] rounded-full text-xs font-geist"
                  >
                    Review
                  </Button>
                )}
              </>
            ) : (
              <>
                {trip.bookingStatus !== "cancelled" && (
                  <Button
                    onClick={() => onCancel(trip)}
                    variant="outline"
                    size="sm"
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 rounded-full text-xs font-geist"
                  >
                    Cancel
                  </Button>
                )}
                {trip.bookingStatus === "cancelled" && (
                  <span className="px-3 py-1 text-red-500 text-xs font-bold border border-red-200 rounded-full bg-red-50">
                    Cancelled
                  </span>
                )}
                <Button
                  onClick={() => onView(trip)}
                  size="sm"
                  className="bg-[#3BD9DA] text-white hover:bg-[#2BC7C8] rounded-full text-xs font-geist"
                >
                  View
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // Cancel Reservation Modal
  const CancelModal = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-5 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold mb-4 text-[#0a1c1c]">Cancel Reservation</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-[#0a1c1c]">Terms and Conditions</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>• Cancellation must be made at least 24 hours before check-in time.</p>
                <p>• Late cancellations may incur fees up to 50% of the total booking amount.</p>
                <p>• No-shows will result in full charge of the booking amount.</p>
                <p>
                  • Cancellations due to force majeure will be reviewed on a case-by-case basis.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-[#0a1c1c]">Refund Policy</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p>• Full refund for cancellations made 7+ days before check-in.</p>
                <p>• 50% refund for cancellations made 3-7 days before check-in.</p>
                <p>• No refund for cancellations made less than 72 hours before check-in.</p>
                <p>• Refunds will be processed within 5-7 business days.</p>
                <p>• Refunds will be credited to the original payment method.</p>
              </div>
            </div>

            {selectedTrip && (
              <div className="bg-gray-50 p-4 rounded-xl">
                <h4 className="font-semibold mb-2 text-[#0a1c1c]">Booking Details</h4>
                <p className="text-sm text-gray-600">
                  <strong>Property:</strong> {selectedTrip.serviceName}
                  <br />
                  <strong>Check-in:</strong>{" "}
                  {new Date(selectedTrip.checkInDate).toLocaleDateString()}
                  <br />
                  <strong>Check-out:</strong>{" "}
                  {new Date(selectedTrip.checkOutDate).toLocaleDateString()}
                  <br />
                  <strong>Amount:</strong> ₹{selectedTrip.totalAmount}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button
              onClick={() => setIsCancelModalOpen(false)}
              variant="outline"
              className="flex-1 rounded-full border-gray-300 text-[#0a1c1c] hover:bg-gray-50 hover:text-[#0a1c1c]"
            >
              Keep Reservation
            </Button>
            <Button
              onClick={() => selectedTrip && handleCancelletion(selectedTrip)}
              className="flex-1 rounded-full bg-red-600 hover:bg-red-700 text-white"
            >
              Cancel Reservation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  // View Details Modal
  const ViewModal = () => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-5 sm:p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-[#0a1c1c]">Booking Details</h2>
            <button
              onClick={() => setIsViewModalOpen(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {selectedTrip && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                <img
                  src={getImageUrl(
                    selectedTrip.serviceDetails?.photos?.coverUrl ||
                      "https://api.builder.io/api/v1/image/assets/TEMP/88b7818e66e186cf9b23faeb2d03c7a668a7f9ff?width=220",
                  )}
                  alt={selectedTrip.serviceName}
                  className="w-full sm:w-32 h-40 sm:h-32 object-cover rounded-xl flex-shrink-0"
                />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-[#0a1c1c] mb-2">
                    {selectedTrip.serviceName}
                  </h3>
                  <span
                    className={`inline-block px-3 py-1 text-sm rounded-full font-geist w-fit uppercase ${getStatusBadgeClass(selectedTrip.bookingStatus)}`}
                  >
                    {selectedTrip.bookingStatus}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-[#0a1c1c] mb-2">Booking Information</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>
                        <strong className="text-[#0a1c1c]">Booking ID:</strong> #
                        {selectedTrip.bookingId}
                      </p>
                      <p>
                        <strong className="text-[#0a1c1c]">Booking Date:</strong>{" "}
                        {new Date(selectedTrip.createdAt).toLocaleDateString()}
                      </p>
                      <p>
                        <strong className="text-[#0a1c1c]">Status:</strong>{" "}
                        <span className="uppercase">{selectedTrip.bookingStatus}</span>
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-[#0a1c1c] mb-2">Stay Details</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>
                        <strong className="text-[#0a1c1c]">Check-in:</strong>{" "}
                        {new Date(selectedTrip.checkInDate).toLocaleDateString()}
                      </p>
                      <p>
                        <strong className="text-[#0a1c1c]">Check-out:</strong>{" "}
                        {new Date(selectedTrip.checkOutDate).toLocaleDateString()}
                      </p>
                      <p>
                        <strong className="text-[#0a1c1c]">Guests:</strong>{" "}
                        {selectedTrip.numberOfGuests}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-[#0a1c1c] mb-2">Payment Details</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>
                        <strong className="text-[#0a1c1c]">Total Amount:</strong> ₹
                        {selectedTrip.totalAmount}
                      </p>
                      <p>
                        <strong className="text-[#0a1c1c]">Payment Method:</strong>{" "}
                        {selectedTrip.clientPhone ? "Standard" : "N/A"}
                      </p>
                      <p>
                        <strong className="text-[#0a1c1c]">Payment Status:</strong> Paid
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-[#0a1c1c] mb-2">Contact Information</h4>
                    <div className="space-y-2 text-sm text-gray-600">
                      <p>
                        <strong className="text-[#0a1c1c]">Name:</strong> {user?.firstName}{" "}
                        {user?.lastName}
                      </p>
                      <p>
                        <strong className="text-[#0a1c1c]">Email:</strong> {user?.email}
                      </p>
                      <p>
                        <strong className="text-[#0a1c1c]">Phone:</strong>{" "}
                        {selectedTrip.clientPhone}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <h4 className="font-semibold text-[#0a1c1c] mb-2">Additional Notes</h4>
                <p className="text-sm text-gray-600">
                  Please arrive at the property by 3:00 PM on your check-in date. Late check-ins may
                  require coordination with the host. WiFi password and access instructions will be
                  provided upon arrival.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end mt-6">
            <Button
              onClick={() => setIsViewModalOpen(false)}
              className="w-full sm:w-auto px-6 py-2 rounded-full bg-[#3BD9DA] hover:bg-[#2BC7C8] text-white"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  // Review Modal
  const ReviewModal = () => {
    const [rating, setRating] = useState(0);
    const [review, setReview] = useState("");

    const handleSubmitReview = async () => {
      try {
        await testimonialsApi.create({
          userName: user?.name || "Guest",
          rating: rating,
          content: review,
          avatar: user?.avatar,
          email: user?.email,
        });
        setIsReviewModalOpen(false);
        setRating(0);
        setReview("");
      } catch (error) {
        console.error("Error submitting review:", error);
      }
    };

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-5 sm:p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-[#0a1c1c]">Write a Review</h2>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {selectedTrip && (
              <div className="space-y-6">
                <div className="flex gap-4">
                  <img
                    src={
                      selectedTrip.serviceDetails?.photos?.coverUrl ||
                      "https://api.builder.io/api/v1/image/assets/TEMP/88b7818e66e186cf9b23faeb2d03c7a668a7f9ff?width=220"
                    }
                    alt={selectedTrip.serviceName}
                    className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
                  />
                  <div>
                    <h3 className="font-bold text-[#0a1c1c]">{selectedTrip.serviceName}</h3>
                    <p className="text-sm text-gray-600">
                      {new Date(selectedTrip.checkInDate).toLocaleDateString()} -{" "}
                      {new Date(selectedTrip.checkOutDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Overall Rating
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                        className={`w-8 h-8 transition-colors ${
                          star <= rating ? "text-amber-400" : "text-gray-300"
                        }`}
                      >
                        <Star className="w-full h-full fill-current" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Review
                  </label>
                  <textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    placeholder="Share your experience with this stay..."
                    className="w-full p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3BD9DA] focus:border-transparent"
                    rows={4}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={() => setIsReviewModalOpen(false)}
                    variant="outline"
                    className="flex-1 rounded-full border-gray-300 text-[#0a1c1c] hover:bg-gray-50 hover:text-[#0a1c1c]"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitReview}
                    disabled={rating === 0 || review.trim() === ""}
                    className="flex-1 rounded-full bg-[#3BD9DA] hover:bg-[#2BC7C8] text-white"
                  >
                    Submit Review
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Invoice Modal
  const InvoiceModal = () => {
    const handleDownloadInvoice = () => {
      // In a real app, this would generate and download a PDF
      console.log("Downloading invoice for trip:", selectedTrip?.bookingId);
      toast.success("Invoice download functionality would be implemented here", {
        duration: 4000,
        position: "top-right",
        style: {
          background: "#10B981",
          color: "#fff",
          fontWeight: "500",
          borderRadius: "12px",
          padding: "16px",
          boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.4)",
        },
        iconTheme: {
          primary: "#fff",
          secondary: "#10B981",
        },
      });
    };

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-5 sm:p-8">
            <div className="flex flex-wrap gap-3 justify-between items-center mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl font-bold text-[#0a1c1c]">Invoice</h2>
              <div className="flex gap-2">
                <Button
                  onClick={handleDownloadInvoice}
                  className="flex items-center gap-2 rounded-full bg-[#3BD9DA] hover:bg-[#2BC7C8] text-white"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Download PDF</span>
                  <span className="sm:hidden">PDF</span>
                </Button>
                <button
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {selectedTrip && (
              <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-gray-100 pb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center">
                        <LogoWebsite />
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold text-[#0a1c1c]">TravelHome</h1>
                        <p className="text-sm text-gray-600">Premium Accommodation Platform</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>123 Travel Street, City, State 12345</p>
                      <p>support@travelhome.com | +1 (555) 123-4567</p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <h2 className="text-xl font-bold text-[#0a1c1c] mb-2">INVOICE</h2>
                    <p className="text-sm text-gray-600">
                      <strong>Invoice #:</strong> INV-{selectedTrip.bookingId}
                      <br />
                      <strong>Date:</strong> {new Date().toLocaleDateString()}
                      <br />
                      <strong>Due Date:</strong> Paid
                    </p>
                  </div>
                </div>

                {/* Bill To */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-semibold text-[#0a1c1c] mb-2">Bill To:</h3>
                    <div className="text-sm text-gray-600">
                      <p>
                        {user?.firstName} {user?.lastName}
                      </p>
                      <p>{user?.email}</p>
                      <p>{selectedTrip.clientPhone}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#0a1c1c] mb-2">Booking Details:</h3>
                    <div className="text-sm text-gray-600">
                      <p>
                        <strong>Booking ID:</strong> #{selectedTrip.bookingId}
                      </p>
                      <p>
                        <strong>Property:</strong> {selectedTrip.serviceName}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stay Details */}
                <div>
                  <h3 className="font-semibold text-[#0a1c1c] mb-4">Stay Details</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-200">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border border-gray-200 px-4 py-2 text-left text-sm font-semibold text-[#0a1c1c]">
                            Description
                          </th>
                          <th className="border border-gray-200 px-4 py-2 text-left text-sm font-semibold text-[#0a1c1c]">
                            Check-in
                          </th>
                          <th className="border border-gray-200 px-4 py-2 text-left text-sm font-semibold text-[#0a1c1c]">
                            Check-out
                          </th>
                          <th className="border border-gray-200 px-4 py-2 text-left text-sm font-semibold text-[#0a1c1c]">
                            Guests
                          </th>
                          <th className="border border-gray-200 px-4 py-2 text-right text-sm font-semibold text-[#0a1c1c]">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-200 px-4 py-2 text-sm text-gray-600">
                            {selectedTrip.serviceName}
                          </td>
                          <td className="border border-gray-200 px-4 py-2 text-sm text-gray-600">
                            {new Date(selectedTrip.checkInDate).toLocaleDateString()}
                          </td>
                          <td className="border border-gray-200 px-4 py-2 text-sm text-gray-600">
                            {new Date(selectedTrip.checkOutDate).toLocaleDateString()}
                          </td>
                          <td className="border border-gray-200 px-4 py-2 text-sm text-gray-600">
                            {selectedTrip.numberOfGuests}
                          </td>
                          <td className="border border-gray-200 px-4 py-2 text-sm text-right text-gray-600">
                            ₹{selectedTrip.totalAmount}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="flex justify-end">
                  <div className="w-full sm:w-64">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Subtotal:</span>
                        <span>₹{selectedTrip.totalAmount}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Service Fee:</span>
                        <span>₹0</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Taxes:</span>
                        <span>₹0</span>
                      </div>
                      <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold text-[#0a1c1c]">
                        <span>Total:</span>
                        <span>₹{selectedTrip.totalAmount}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="border-t border-gray-100 pt-6">
                  <h3 className="font-semibold text-[#0a1c1c] mb-2">Payment Information</h3>
                  <div className="text-sm text-gray-600">
                    <p>
                      <strong>Payment Method:</strong> Credit Card ****1234
                    </p>
                    <p>
                      <strong>Payment Date:</strong> {new Date().toLocaleDateString()}
                    </p>
                    <p>
                      <strong>Status:</strong> Paid in Full
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-100 pt-6 text-center text-sm text-gray-600">
                  <p>Thank you for choosing TravelHome! We hope you had a wonderful stay.</p>
                  <p className="mt-2">
                    For any questions regarding this invoice, please contact our support team.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col min-h-screen gap-0 bg-gray-100 text-gray-900 transition-colors">
      <SiteHeader />

      <main className="flex-1 px-4 mt-20 py-6 sm:py-10">
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
            <div
              onClick={() => navigate(-1)}
              className="cursor-pointer inline-flex items-center gap-2 text-[#0a1c1c] hover:text-[#117479] transition-colors w-fit"
            >
              <IoIosArrowBack size={20} />
              <h1 className="text-2xl sm:text-3xl font-semibold font-poppins">Trips</h1>
            </div>
            <button
              onClick={() => setIsFilterOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-200 rounded-full bg-white text-[#0a1c1c] text-sm font-semibold font-plus-jakarta hover:border-[#3BD9DA] hover:bg-[#e6fafa] hover:text-[#117479] transition-colors w-fit"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Filters
            </button>
          </div>

          {/* Tabs */}
          <div className="mb-6 sm:mb-8 -mx-4 px-4 sm:mx-0 sm:px-0 overflow-x-auto no-scrollbar">
            <div className="inline-flex items-center gap-1 p-1 bg-gray-200/60 rounded-full">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-sm font-bold font-plus-jakarta whitespace-nowrap transition-all ${
                    activeTab === tab.key
                      ? "bg-white text-[#0a1c1c] shadow-sm"
                      : "text-gray-500 hover:text-[#0a1c1c]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Trips List */}
          <div>
            {/* Delete Action Bar */}
            {activeTab === "delete" && (
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[#0a1c1c] font-medium font-plus-jakarta">
                    {selectedTrips.length} trips selected
                  </span>
                  <span className="text-xs text-gray-500 font-normal">
                    (Select trips to remove them permanently)
                  </span>
                </div>
                <Button
                  onClick={handleDeleteSelected}
                  disabled={selectedTrips.length === 0}
                  className="bg-red-600 hover:bg-red-700 text-white rounded-full font-geist w-full sm:w-auto"
                  size="sm"
                >
                  Delete Selected
                </Button>
              </div>
            )}

            {loading ? (
              <UniqueStaysSkeleton />
            ) : paginatedTrips.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
                  {paginatedTrips.map((trip) => (
                    <TripCard
                      key={trip._id}
                      trip={trip}
                      isPrevious={
                        activeTab === "previous" ||
                        (activeTab === "delete" &&
                          ["completed", "checked-out", "cancelled"].includes(
                            trip.bookingStatus?.toLowerCase(),
                          ))
                      }
                      onCancel={handleCancel}
                      onView={handleView}
                      onReview={handleReview}
                      onGetInvoice={handleGetInvoice}
                      selectable={activeTab === "delete"}
                      selected={selectedTrips.includes(trip._id)}
                      onSelect={() => toggleTripSelection(trip._id)}
                    />
                  ))}
                </div>
                <CustomPagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-[#e6fafa] flex items-center justify-center mx-auto mb-4">
                  <MapPinned className="h-7 w-7 text-[#117479]" />
                </div>
                <h3 className="text-xl font-semibold text-[#0a1c1c] mb-2">
                  {activeTab === "delete" ? "No trips to manage" : `No ${activeTab} trips yet`}
                </h3>
                <p className="text-gray-500 mb-6">
                  {activeTab === "upcoming"
                    ? "You don't have any upcoming trips. Time to plan your next getaway!"
                    : activeTab === "previous"
                      ? "Your completed and past trips will show up here."
                      : "You don't have any trips to manage right now."}
                </p>
                <Button
                  onClick={() => navigate("/")}
                  className="bg-[#3BD9DA] hover:bg-[#2BC7C8] text-white rounded-full px-6"
                >
                  Explore Stays
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />

      {/* Clearance for the fixed bottom nav, painted in the footer's own
          colour so the page doesn't end on a white band. Collapses to 0 at lg,
          where the nav is hidden. Matches Wishlist.tsx's pattern. */}
      <div className="bg-[#0a1c1c] pb-mobile-nav" aria-hidden />

      {/* Mobile Navigation */}
      <MobileUserNav />

      {/* Filter Modal */}
      <FilterModal
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onApply={handleFilterApply}
      />

      {/* Modals */}
      {isCancelModalOpen && <CancelModal />}
      {isViewModalOpen && <ViewModal />}
      {isReviewModalOpen && <ReviewModal />}
      {isInvoiceModalOpen && <InvoiceModal />}
    </div>
  );
};

export default UserTrips;
