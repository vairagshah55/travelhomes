import React from "react";
import { useNavigate } from "react-router-dom";
import { formatDate, isFuture, isPast } from "date-fns";
import { ArrowRight, MessageSquare, Pencil } from "lucide-react";
import {
  AdminDetailDrawer,
  DetailField,
  DetailNote,
  DetailSection,
} from "@/components/admin/AdminDetailDrawer";
import { BTN_NEUTRAL, BTN_PRIMARY, BTN_RAW, BTN_SOFT, StatusBadge } from "@/components/shared";
import { getInitials } from "@/utils/getInitials";
import { currencyINR, toAmount } from "@/utils/currency";
import { cn } from "@/lib/utils";
import type { BookingDetailDTO } from "@/lib/api";

/* ── Booking timing ───────────────────────────────────────────────────────────
   `status` is what the vendor set (pending / confirmed / active / cancelled);
   timing is where the stay sits on the calendar. Showing only the date-derived
   label meant a cancelled booking still read "Upcoming"; showing only status
   meant you couldn't tell a confirmed stay that ends tomorrow from one that
   starts in March. Both are surfaced — status as the badge, timing beside it. */

export type BookingTiming = { key: string; label: string; bar: string; text: string };

export const timingOf = (b: BookingDetailDTO): BookingTiming => {
  if (b.status === "cancelled")
    return {
      key: "cancelled",
      label: "Cancelled",
      bar: "bg-red-400",
      text: "text-red-600 dark:text-red-400",
    };
  if (isFuture(new Date(b.checkIn)))
    return {
      key: "upcoming",
      label: "Upcoming",
      bar: "bg-blue-400",
      text: "text-blue-600 dark:text-blue-400",
    };
  if (isPast(new Date(b.checkOut)))
    return {
      key: "completed",
      label: "Completed",
      bar: "bg-emerald-400",
      text: "text-emerald-600 dark:text-emerald-400",
    };
  return {
    key: "ongoing",
    label: "Ongoing",
    bar: "bg-amber-400",
    text: "text-amber-600 dark:text-amber-400",
  };
};

/** Stable per-name avatar tint — one definition for every list that shows guests. */
const AVATAR_TINTS = [
  "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
  "bg-pink-100 text-pink-700 dark:bg-pink-500/20 dark:text-pink-300",
] as const;

export const avatarTint = (name: string) =>
  AVATAR_TINTS[(name.charCodeAt(0) || 0) % AVATAR_TINTS.length];

/** Short, stable reference a vendor can read out on the phone. */
export const bookingRef = (b: BookingDetailDTO) => `#${(b.id ?? "").slice(-6).toUpperCase()}`;

/** Nights between check-in and check-out; 0 for same-day or unparseable dates. */
const nightsBetween = (checkIn: string, checkOut: string) => {
  const a = new Date(checkIn).getTime();
  const z = new Date(checkOut).getTime();
  if (Number.isNaN(a) || Number.isNaN(z)) return 0;
  return Math.max(0, Math.round((z - a) / 86_400_000));
};

/**
 * The one booking inspector for the vendor console.
 *
 * The dashboard used to open a centred `Dialog` and `/bookings` navigated away
 * to an edit form — so "look at this booking" cost the list you were reading in
 * one place and the whole page in the other. Both now open the same right-hand
 * drawer the rest of the console uses, which keeps the rows on screen (the
 * context that makes one booking mean anything: is this the only pending one,
 * or the fourth today) and supports walking the filtered set with prev/next.
 *
 * Read-only by design. Editing a booking is a form with validation and a
 * mutation behind it; that stays at `/bookings/:id/edit`, one click away in the
 * footer, rather than being rebuilt inside a 540px rail.
 */
export const BookingDrawer = ({
  booking,
  open,
  onClose,
  position,
  onPrev,
  onNext,
}: {
  booking: BookingDetailDTO | null;
  open: boolean;
  onClose: () => void;
  position?: { index: number; total: number };
  onPrev?: () => void;
  onNext?: () => void;
}) => {
  const navigate = useNavigate();
  if (!booking) return null;

  const timing = timingOf(booking);
  const nights = nightsBetween(booking.checkIn, booking.checkOut);
  const amount = toAmount(booking.servicePrice);

  return (
    <AdminDetailDrawer
      open={open}
      onClose={onClose}
      portalScope="vendor"
      eyebrow="Booking"
      title={booking.clientName || "Guest"}
      subtitle={`${bookingRef(booking)} · ${booking.serviceName ?? "—"}`}
      position={position}
      onPrev={onPrev}
      onNext={onNext}
      media={
        <span
          className={cn(
            "grid place-items-center w-11 h-11 rounded-full text-[14px] font-bold",
            avatarTint(booking.clientName ?? "?"),
          )}
          aria-hidden
        >
          {getInitials(booking.clientName || "?")}
        </span>
      }
      status={
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={booking.status} size="sm" />
          <span className={cn("text-[11.5px] font-semibold", timing.text)}>{timing.label}</span>
          <span className="text-[11.5px] font-semibold tabular-nums text-foreground/70">
            {currencyINR(amount)}
          </span>
        </div>
      }
      footer={
        <>
          <button onClick={onClose} className={`${BTN_RAW} ${BTN_NEUTRAL}`}>
            Close
          </button>
          {(booking.contactEmail || booking.contactPhone) && (
            <button
              onClick={() => navigate("/vendor-chat")}
              className={`${BTN_RAW} ${BTN_SOFT}`}
            >
              <MessageSquare size={14} strokeWidth={2.2} />
              Message guest
            </button>
          )}
          <button
            onClick={() => navigate(`/bookings/${booking.id}/edit`)}
            className={`${BTN_RAW} ${BTN_PRIMARY}`}
          >
            <Pencil size={14} strokeWidth={2.2} />
            Edit booking
          </button>
        </>
      }
    >
      <DetailSection title="Stay" columns={2}>
        <DetailField label="Check in" value={formatDate(new Date(booking.checkIn), "dd MMM yyyy")} />
        <DetailField
          label="Check out"
          value={formatDate(new Date(booking.checkOut), "dd MMM yyyy")}
        />
        <DetailField label="Nights" value={nights > 0 ? `${nights}` : "Same day"} />
        <DetailField label="Guests" value={String(booking.guests ?? "—")} />
        <DetailField label="Offering" value={booking.serviceName} full />
        <DetailField label="Location" value={booking.location} full />
      </DetailSection>

      <DetailSection title="Payment" columns={2}>
        <DetailField label="Amount" value={currencyINR(amount)} />
        <DetailField
          label="Per night"
          value={nights > 0 ? currencyINR(Math.round(amount / nights)) : "—"}
        />
        <DetailField label="Booking status" value={<StatusBadge status={booking.status} size="sm" />} />
        <DetailField
          label="Booked by"
          value={booking.createdBy === "vendor" ? "You (manual)" : "Guest"}
        />
      </DetailSection>

      <DetailSection title="Guest" columns={2}>
        <DetailField label="Name" value={booking.clientName} />
        <DetailField label="Phone" value={booking.contactPhone} />
        <DetailField label="Email" value={booking.contactEmail} full />
        {booking.pickupLocation && <DetailNote>Pickup: {booking.pickupLocation}</DetailNote>}
      </DetailSection>

      <DetailSection title="Reference" columns={2}>
        <DetailField label="Booking ref" value={bookingRef(booking)} />
        <DetailField label="Type" value={booking.serviceType} />
        {booking.attachmentUrl && (
          <DetailField
            full
            label="Attachment"
            value={
              <a
                href={booking.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-brand font-semibold hover:underline"
              >
                Open file
                <ArrowRight size={12} strokeWidth={2.4} />
              </a>
            }
          />
        )}
      </DetailSection>
    </AdminDetailDrawer>
  );
};

export default BookingDrawer;
