import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import FilterModal from '../components/FilterModal';
import MobileUserNav from '../components/MobileUserNav';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import LogoWebsite from '@/components/ui/LogoWebsite';
import { IoIosArrowBack } from 'react-icons/io';
import { testimonialsApi } from '../lib/testimonials';
import { bookingsApi, BookingDTO } from '../lib/api';
import UniqueStaysSkeleton from '@/utils/UniqueStaysSkeleton';
import { getImageUrl } from '@/lib/utils';
import { CustomPagination } from '@/components/CustomPagination';
import { Loader } from '@/components/ui/Loader';

const UserTrips = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'previous' | 'delete'>('upcoming');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<BookingDTO | null>(null);
  const [selectedTrips, setSelectedTrips] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [allBookings, setAllBookings] = useState<BookingDTO[]>([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
    if (activeTab !== 'delete') {
      setSelectedTrips([]);
    }
  }, [activeTab]);

  useEffect(() => {
    const fetchBookings = async () => {
      const uid = user?.id || (user as any)?._id;
      if (!uid) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        console.log('Fetching bookings for user:', uid);
        const token = localStorage.getItem('travel_auth_token') || sessionStorage.getItem('travel_auth_token') || '';
        const res = await bookingsApi.getUserBookings(uid, token);
        console.log('Bookings response:', res);
        if (res.success) {
          setAllBookings(res.bookings);
        } else {
          console.error('Failed to fetch bookings:', res);
          toast.error('Failed to load your trips. Please try again.');
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user?.id, (user as any)?._id]);

  const upcomingTrips = allBookings.filter(b => 
    ['confirmed', 'pending', 'active', 'checked-in'].includes(b.bookingStatus?.toLowerCase())
  );

  const previousTrips = allBookings.filter(b => 
    ['completed', 'checked-out', 'cancelled'].includes(b.bookingStatus?.toLowerCase())
  );

  const currentTrips = activeTab === 'upcoming' ? upcomingTrips : (activeTab === 'previous' ? previousTrips : allBookings);

  const itemsPerPage = 12;
  const totalPages = Math.ceil(currentTrips.length / itemsPerPage);
  const paginatedTrips = currentTrips.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage,
  );

  const [cancelled,setcancelled]=useState(false);
  const handleFilterApply = (filters: any) => {
    console.log('Applied filters:', filters);
    // Here you would typically filter the trips based on the applied filters
  };

  const handleDeleteSelected = async () => {
    if (selectedTrips.length === 0) return;
    
    if (!window.confirm(`Are you sure you want to delete ${selectedTrips.length} trips? This action cannot be undone.`)) {
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('travel_auth_token') || sessionStorage.getItem('travel_auth_token') || '';
      
      const deletePromises = selectedTrips.map(id => bookingsApi.delete(id, token));
      await Promise.all(deletePromises);
      
      setAllBookings(prev => prev.filter(b => !selectedTrips.includes(b._id)));
      setSelectedTrips([]);
      toast.success('Selected trips deleted successfully');
    } catch (error) {
      console.error('Error deleting trips:', error);
      toast.error('Failed to delete some trips');
    } finally {
      setLoading(false);
    }
  };

  const toggleTripSelection = (id: string) => {
    setSelectedTrips(prev => 
      prev.includes(id) ? prev.filter(tid => tid !== id) : [...prev, id]
    );
  };

  const handleCancelletion = async (trip: BookingDTO) => {
     try {
       const token = localStorage.getItem('travel_auth_token') || sessionStorage.getItem('travel_auth_token') || '';
       const res = await bookingsApi.updateStatus(trip._id, 'cancelled', token);
       if (res.success) {
         setAllBookings(prev => prev.map(b => b._id === trip._id ? { ...b, bookingStatus: 'cancelled' } : b));
         setIsCancelModalOpen(false);
         setcancelled(true);
       }
     } catch (error) {
       console.error('Error cancelling booking:', error);
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
    onSelect
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
    <div className={`flex flex-col dark:bg-gray-800 bg-white rounded-xl shadow-sm border ${selected ? 'border-black ring-1 ring-black dark:border-white dark:ring-white' : 'border-gray-200'} overflow-hidden hover:shadow-md transition-all h-full`}>
      <div className="relative h-48 sm:h-52">
        {selectable && (
            <div className="absolute top-3 left-3 z-10 bg-white/80 rounded-sm p-1 backdrop-blur-sm">
              <input 
                type="checkbox" 
                checked={selected} 
                onChange={(e) => { e.stopPropagation(); onSelect && onSelect(); }}
                className="w-5 h-5 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
              />
            </div>
        )}
        <img
          src={getImageUrl(trip.serviceDetails?.photos?.coverUrl)}
          alt={trip.serviceName}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-3 right-3">
             <span className="inline-block px-3 py-1 text-xs font-bold bg-white/90 text-gray-800 rounded-full uppercase shadow-sm backdrop-blur-sm">
              {trip.bookingStatus}
            </span>
        </div>
      </div>
      
      <div className="p-4 flex flex-col flex-1 gap-4">
        <div className="space-y-2">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white font-geist line-clamp-1" title={trip.serviceDetails?.brandName || trip.serviceDetails?.name || trip.serviceName}>
              {trip.serviceDetails?.brandName || trip.serviceDetails?.name || trip.serviceName}
            </h3>
          
          <div className="grid grid-cols-2 gap-3 text-sm mt-3">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 font-plus-jakarta uppercase">Checkin</span>
              <span className="text-gray-800 dark:text-gray-200 font-medium font-plus-jakarta">{new Date(trip.checkInDate).toLocaleDateString()}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 font-plus-jakarta uppercase">Checkout</span>
              <span className="text-gray-800 dark:text-gray-200 font-medium font-plus-jakarta">{new Date(trip.checkOutDate).toLocaleDateString()}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm pt-2">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400 font-plus-jakarta uppercase">Guests:</span>
              <span className="text-gray-800 dark:text-gray-200 font-medium font-plus-jakarta">{trip.numberOfGuests}</span>
            </div>
        </div>

        <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-col gap-4">
          <div className="text-lg font-bold text-gray-800 dark:text-white font-plus-jakarta">
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
                  className="rounded-full text-xs font-geist"
                >
                  Invoice
                </Button>
                <Button
                  onClick={() => onView(trip)}
                  variant="outline"
                  size="sm"
                  className="rounded-full text-xs font-geist"
                >
                  View
                </Button>
                {trip.bookingStatus !== 'cancelled' && (
                  <Button
                    onClick={() => onReview(trip)}
                    size="sm"
                    className="bg-black text-white hover:bg-gray-800 rounded-full text-xs font-geist"
                  >
                    Review
                  </Button>
                )}
              </>
            ) : (
              <>
                {trip.bookingStatus !== 'cancelled' && (
                  <Button
                    onClick={() => onCancel(trip)}
                    variant="outline"
                    size="sm"
                    className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 rounded-full text-xs font-geist"
                  >
                    Cancel
                  </Button>
                )}
                 {trip.bookingStatus === 'cancelled' && (
                    <span className="px-3 py-1 text-red-500 text-xs font-bold border border-red-200 rounded-full bg-red-50">Cancelled</span>
                )}
                <Button
                  onClick={() => onView(trip)}
                  size="sm"
                  className="bg-black text-white hover:bg-gray-800 rounded-full text-xs font-geist"
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">Cancel Reservation</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Terms and Conditions</h3>
              <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <p>• Cancellation must be made at least 24 hours before check-in time.</p>
                <p>• Late cancellations may incur fees up to 50% of the total booking amount.</p>
                <p>• No-shows will result in full charge of the booking amount.</p>
                <p>• Cancellations due to force majeure will be reviewed on a case-by-case basis.</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800 dark:text-white">Refund Policy</h3>
              <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <p>• Full refund for cancellations made 7+ days before check-in.</p>
                <p>• 50% refund for cancellations made 3-7 days before check-in.</p>
                <p>• No refund for cancellations made less than 72 hours before check-in.</p>
                <p>• Refunds will be processed within 5-7 business days.</p>
                <p>• Refunds will be credited to the original payment method.</p>
              </div>
            </div>

            {selectedTrip && (
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <h4 className="font-semibold mb-2 text-gray-800 dark:text-white">Booking Details</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  <strong>Property:</strong> {selectedTrip.serviceName}<br/>
                  <strong>Check-in:</strong> {new Date(selectedTrip.checkInDate).toLocaleDateString()}<br/>
                  <strong>Check-out:</strong> {new Date(selectedTrip.checkOutDate).toLocaleDateString()}<br/>
                  <strong>Amount:</strong> ₹{selectedTrip.totalAmount}
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-4 mt-6">
            <Button
              onClick={() => setIsCancelModalOpen(false)}
              variant="outline"
              className="flex-1"
            >
              Keep Reservation
            </Button>
            <Button
              onClick={() => handleCancelletion(selectedTrip)}
              className="flex-1 bg-black hover:bg-gray-900 text-white"
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Booking Details</h2>
            <button
              onClick={() => setIsViewModalOpen(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {selectedTrip && (
            <div className="space-y-6">
              <div className="flex gap-6">
                <img
                  src={getImageUrl(selectedTrip.serviceDetails?.photos?.coverUrl || 'https://api.builder.io/api/v1/image/assets/TEMP/88b7818e66e186cf9b23faeb2d03c7a668a7f9ff?width=220')}
                  alt={selectedTrip.serviceName}
                  className="w-32 h-32 object-cover rounded-lg flex-shrink-0"
                />
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{selectedTrip.serviceName}</h3>
                  <span className="inline-block px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded font-geist w-fit uppercase">
                    {selectedTrip.bookingStatus}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Booking Information</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Booking ID:</strong> #{selectedTrip.bookingId}</p>
                      <p><strong>Booking Date:</strong> {new Date(selectedTrip.createdAt).toLocaleDateString()}</p>
                      <p><strong>Status:</strong> <span className="uppercase">{selectedTrip.bookingStatus}</span></p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Stay Details</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Check-in:</strong> {new Date(selectedTrip.checkInDate).toLocaleDateString()}</p>
                      <p><strong>Check-out:</strong> {new Date(selectedTrip.checkOutDate).toLocaleDateString()}</p>
                      <p><strong>Guests:</strong> {selectedTrip.numberOfGuests}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Payment Details</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Total Amount:</strong> ₹{selectedTrip.totalAmount}</p>
                      <p><strong>Payment Method:</strong> {selectedTrip.clientPhone ? 'Standard' : 'N/A'}</p>
                      <p><strong>Payment Status:</strong> Paid</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Contact Information</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Name:</strong> {user?.firstName} {user?.lastName}</p>
                      <p><strong>Email:</strong> {user?.email}</p>
                      <p><strong>Phone:</strong> {selectedTrip.clientPhone}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Additional Notes</h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Please arrive at the property by 3:00 PM on your check-in date. Late check-ins may require coordination with the host.
                  WiFi password and access instructions will be provided upon arrival.
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end mt-6">
            <Button
              onClick={() => setIsViewModalOpen(false)}
              className="px-6 py-2"
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
    const [review, setReview] = useState('');

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
        setReview('');
      } catch (error) {
        console.error('Error submitting review:', error);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Write a Review</h2>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {selectedTrip && (
              <div className="space-y-6">
                <div className="flex gap-4">
                  <img
                    src={selectedTrip.serviceDetails?.photos?.coverUrl || 'https://api.builder.io/api/v1/image/assets/TEMP/88b7818e66e186cf9b23faeb2d03c7a668a7f9ff?width=220'}
                    alt={selectedTrip.serviceName}
                    className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                  />
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-white">{selectedTrip.serviceName}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {new Date(selectedTrip.checkInDate).toLocaleDateString()} - {new Date(selectedTrip.checkOutDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Overall Rating
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className={`w-8 h-8 ${
                          star <= rating ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                      >
                        <svg fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Your Review
                  </label>
                  <textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    placeholder="Share your experience with this stay..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    rows={4}
                  />
                </div>

                <div className="flex gap-4">
                  <Button
                    onClick={() => setIsReviewModalOpen(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmitReview}
                    disabled={rating === 0 || review.trim() === ''}
                    className="flex-1"
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
      console.log('Downloading invoice for trip:', selectedTrip?.bookingId);
      toast.success('Invoice download functionality would be implemented here', {
        duration: 4000,
        position: 'top-right',
        style: {
          background: '#10B981',
          color: '#fff',
          fontWeight: '500',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)',
        },
        iconTheme: {
          primary: '#fff',
          secondary: '#10B981',
        },
      });
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Invoice</h2>
              <div className="flex gap-2">
                <Button
                  onClick={handleDownloadInvoice}
                  variant=""
                  className="flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF
                </Button>
                <button
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {selectedTrip && (
              <div className="space-y-8">
                {/* Header */}
                <div className="flex justify-between items-start border-b pb-6">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center">
                        <LogoWebsite/>
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">TravelHome</h1>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Premium Accommodation Platform</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <p>123 Travel Street, City, State 12345</p>
                      <p>support@travelhome.com | +1 (555) 123-4567</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-2">INVOICE</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      <strong>Invoice #:</strong> INV-{selectedTrip.bookingId}<br/>
                      <strong>Date:</strong> {new Date().toLocaleDateString()}<br/>
                      <strong>Due Date:</strong> Paid
                    </p>
                  </div>
                </div>

                {/* Bill To */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Bill To:</h3>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <p>{user?.firstName} {user?.lastName}</p>
                      <p>{user?.email}</p>
                      <p>{selectedTrip.clientPhone}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Booking Details:</h3>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      <p><strong>Booking ID:</strong> #{selectedTrip.bookingId}</p>
                      <p><strong>Property:</strong> {selectedTrip.serviceName}</p>
                    </div>
                  </div>
                </div>

                {/* Stay Details */}
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-4">Stay Details</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-gray-700">
                          <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-sm font-semibold">Description</th>
                          <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-sm font-semibold">Check-in</th>
                          <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-sm font-semibold">Check-out</th>
                          <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-sm font-semibold">Guests</th>
                          <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right text-sm font-semibold">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">{selectedTrip.serviceName}</td>
                          <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">{new Date(selectedTrip.checkInDate).toLocaleDateString()}</td>
                          <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">{new Date(selectedTrip.checkOutDate).toLocaleDateString()}</td>
                          <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm">{selectedTrip.numberOfGuests}</td>
                          <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm text-right">₹{selectedTrip.totalAmount}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="flex justify-end">
                  <div className="w-64">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal:</span>
                        <span>₹{selectedTrip.totalAmount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Service Fee:</span>
                        <span>₹0</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Taxes:</span>
                        <span>₹0</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between font-semibold">
                        <span>Total:</span>
                        <span>₹{selectedTrip.totalAmount}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="border-t pt-6">
                  <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Payment Information</h3>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    <p><strong>Payment Method:</strong> Credit Card ****1234</p>
                    <p><strong>Payment Date:</strong> {new Date().toLocaleDateString()}</p>
                    <p><strong>Status:</strong> Paid in Full</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t pt-6 text-center text-sm text-gray-600 dark:text-gray-300">
                  <p>Thank you for choosing TravelHome! We hope you had a wonderful stay.</p>
                  <p className="mt-2">For any questions regarding this invoice, please contact our support team.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const navigate = useNavigate();





  return (
   <div className="min-h-screen flex flex-col gap-0 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-200 transition-colors">
  <Header variant="transparent" className="fixed w-full z-50" />



{loading && (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <Loader size="xl" />
          <p className="text-gray-600 dark:text-gray-400 animate-pulse font-medium">
                     Loading trip details...
          </p>
        </div>
      </div>
    )
  }
      {/* Main Content */}
     <div className="flex-1 px-4  mt-20 py-10">
    <div className="max-w-7xl mx-auto">
 
          {/* Page Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
            <h1 className="text-3xl cursor-pointer font-semibold dark:bg-black dark:text-white text-gray-800 font-poppins mb-4 md:mb-0 flex items-center"><span onClick={() => navigate(-1)}><IoIosArrowBack/></span> Trips</h1>
            <Button
              onClick={() => setIsFilterOpen(true)}
              variant="outline"
              className="flex items-center gap-2 px-5 py-2 border border-gray-300 rounded-full hover:bg-gray-50 dark:hover:bg-gray-500 font-plus-jakarta"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 18 18">
                <path d="M16.5 2.25H1.5L7.5 9.345V14.25L10.5 15.75V9.345L16.5 2.25Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Filters
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-8 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-3 text-base font-bold font-plus-jakarta transition-colors relative whitespace-nowrap ${
                activeTab === 'upcoming'
                  ? 'text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-500'
                  : 'text-gray-400 dark:bg-black dark:hover:bg-gray-500'
              }`}
            >
              Upcomings
              {activeTab === 'upcoming' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black dark:bg-white"></div>
              )}
            </button>
            <button
              onClick={() => setActiveTab('previous')}
              className={`px-4 py-3 text-base font-bold font-plus-jakarta transition-colors relative whitespace-nowrap ${
                activeTab === 'previous'
                  ? 'text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-500'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:bg-gray-500'
              }`}
            >
              Previous
              {activeTab === 'previous' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black dark:bg-white"></div>
              )}
            </button>
             <button
              onClick={() => setActiveTab('delete')}
              className={`px-4 py-3 text-base font-bold font-plus-jakarta transition-colors relative whitespace-nowrap ${
                activeTab === 'delete'
                  ? 'text-black dark:text-white hover:bg-gray-50 dark:hover:bg-gray-500'
                  : 'text-gray-400 hover:text-gray-600 dark:hover:bg-gray-500'
              }`}
            >
              Delete
              {activeTab === 'delete' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-black dark:bg-white"></div>
              )}
            </button>
          </div>

          {/* Trips List */}
          <div className="mt-6">
            {/* Delete Action Bar */}
            {activeTab === 'delete' && (
                <div className="mb-6 flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex items-center gap-2">
                    <span className="text-gray-800 dark:text-white font-medium font-plus-jakarta">{selectedTrips.length} trips selected</span>
                    <span className="text-xs text-gray-500 font-normal hidden sm:inline-block">(Select trips to remove them permanently)</span>
                </div>
                <Button 
                    onClick={handleDeleteSelected}
                    disabled={selectedTrips.length === 0}
                    className="bg-red-600 hover:bg-red-700 text-white rounded-full font-geist"
                    size="sm"
                >
                    Delete Selected
                </Button>
                </div>
            )}

            {loading ? (
             <UniqueStaysSkeleton/>
            ) : paginatedTrips.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {paginatedTrips.map(trip => (
                  <TripCard
                    key={trip._id}
                    trip={trip}
                    isPrevious={activeTab === 'previous' || (activeTab === 'delete' && ['completed', 'checked-out', 'cancelled'].includes(trip.bookingStatus?.toLowerCase()))}
                    onCancel={handleCancel}
                    onView={handleView}
                    onReview={handleReview}
                    onGetInvoice={handleGetInvoice}
                    selectable={activeTab === 'delete'}
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
              <div className="text-center py-12">
                <p className="text-gray-500 dark:bg-black dark:text-white font-plus-jakarta">
                  No {activeTab === 'delete' ? '' : activeTab} trips found.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />

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
