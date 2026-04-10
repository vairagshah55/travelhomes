import React from "react";
import { X } from "lucide-react";

interface BookingDetailsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
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
  };
}

const BookingDetailsPopup: React.FC<BookingDetailsPopupProps> = ({
  isOpen,
  onClose,
  booking,
}) => {
  if (!isOpen) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center ">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="max-h-[600px] overflow-y-auto scrollbar-hide relative bg-white rounded-xl p-8 w-full max-w-2xl mx-4 shadow-xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-1 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
        >
          <X className="w-4 h-4 text-black" />
        </button>

        {/* Header */}
        <div className="mb-7">
          <h2 className="text-2xl font-bold text-black">Booking Details</h2>
        </div>

        {/* Content */}
        <div className="space-y-9">
          {/* Booking Information */}
          <div>
            <h3 className="text-lg font-semibold text-black mb-4">
              Booking Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Booking ID</p>
                <p className="text-base font-medium text-black">
                  {booking.bookingId}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Status</p>
                <span className="inline-block px-3 py-1 rounded-lg text-sm font-medium bg-green-100 text-green-600">
                  {booking.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Service Name</p>
                <p className="text-base font-medium text-black">
                  {booking.serviceName}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Service Type</p>
                <p className="text-base font-medium text-black">
                  {booking.serviceType}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Location</p>
                <p className="text-base font-medium text-black">
                  {booking.location}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                <p className="text-base font-medium text-black">
                  {formatCurrency(booking.totalAmount)}
                </p>
              </div>
            </div>
          </div>

          {/* Client Information */}
          <div>
            <h3 className="text-lg font-semibold text-black mb-4">
              Client Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Client Name</p>
                <p className="text-base font-medium text-black">
                  {booking.clientName}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Email</p>
                <p className="text-base font-medium text-black">
                  {booking.clientEmail}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Phone</p>
                <p className="text-base font-medium text-black">
                  {booking.clientPhone}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Number of Guests</p>
                <p className="text-base font-medium text-black">
                  {booking.guests}
                </p>
              </div>
            </div>
          </div>

          {/* Booking Dates */}
          <div>
            <h3 className="text-lg font-semibold text-black mb-4">
              Booking Dates
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Check-in Date</p>
                <p className="text-base font-medium text-black">
                  {formatDate(booking.checkIn)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Check-out Date</p>
                <p className="text-base font-medium text-black">
                  {formatDate(booking.checkOut)}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div>
            <h3 className="text-lg font-semibold text-black mb-4">
              Payment Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Payment Status</p>
                <span className="inline-block px-3 py-1 rounded-lg text-sm font-medium bg-blue-100 text-blue-600">
                  {booking.paymentStatus}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                <p className="text-base font-medium text-black">
                  {formatCurrency(booking.totalAmount)}
                </p>
              </div>
            </div>
          </div>

          {/* Special Requests */}
          {booking.specialRequests && (
            <div>
              <h3 className="text-lg font-semibold text-black mb-4">
                Special Requests
              </h3>
              <p className="text-base text-gray-700 bg-gray-50 p-4 rounded-lg">
                {booking.specialRequests}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingDetailsPopup;