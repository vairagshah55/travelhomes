import React from "react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { currencyINR, toAmount } from "@/utils/currency";
import {
  AdminDetailDrawer,
  DetailField,
  DetailNote,
  DetailSection,
} from "./AdminDetailDrawer";

/**
 * Booking inspector.
 *
 * Was a centred `fixed inset-0` overlay built from hardcoded white/black/grey
 * and `bg-green-100` status chips; it is now a right-side drawer on the shared
 * tokens, so the bookings table stays visible and readable behind it.
 *
 * Amounts were being formatted with `Intl.NumberFormat("en-US", {currency:
 * "USD"})` — a ₹5,000 booking rendered as "$5,000.00". They now go through the
 * shared `currencyINR`, matching the tables and the payments pages.
 */

export interface BookingDetail {
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

interface BookingDetailsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingDetail;
  /** Walk the filtered list without closing. */
  position?: { index: number; total: number };
  onPrev?: () => void;
  onNext?: () => void;
}

/** Long form, for the two dates that anchor a trip. */
const formatDate = (value: string) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
};

const BookingDetailsPopup: React.FC<BookingDetailsPopupProps> = ({
  isOpen,
  onClose,
  booking,
  position,
  onPrev,
  onNext,
}) => {
  return (
    <AdminDetailDrawer
      open={isOpen}
      onClose={onClose}
      eyebrow="Booking"
      title={booking.bookingId}
      subtitle={booking.serviceName}
      status={
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={booking.status} />
          <StatusBadge status={booking.paymentStatus} />
        </div>
      }
      position={position}
      onPrev={onPrev}
      onNext={onNext}
    >
      <DetailSection title="Trip">
        <DetailField label="Check-in" value={formatDate(booking.checkIn)} />
        <DetailField label="Check-out" value={formatDate(booking.checkOut)} />
        <DetailField label="Guests" value={booking.guests} />
        <DetailField label="Service type" value={booking.serviceType} />
        <DetailField label="Location" value={booking.location} full />
      </DetailSection>

      <DetailSection title="Guest">
        <DetailField label="Name" value={booking.clientName} />
        <DetailField label="Phone" value={booking.clientPhone} />
        <DetailField label="Email" value={booking.clientEmail} full />
      </DetailSection>

      <DetailSection title="Payment">
        <DetailField label="Total amount" value={currencyINR(toAmount(booking.totalAmount))} />
        <DetailField label="Payment status" value={<StatusBadge status={booking.paymentStatus} />} />
      </DetailSection>

      {booking.specialRequests && (
        <DetailSection title="Special requests">
          <DetailNote>{booking.specialRequests}</DetailNote>
        </DetailSection>
      )}
    </AdminDetailDrawer>
  );
};

export default BookingDetailsPopup;
