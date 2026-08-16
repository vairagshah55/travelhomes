/**
 * Dialogs for /user-trips.
 *
 * These used to be declared *inside* the page component, which meant React saw
 * a brand-new component type on every parent render and remounted them — the
 * review form's rating and text were one parent state change away from being
 * wiped. Hoisting them out fixes that; `ModalShell` then adds the behaviour
 * hand-rolled overlays always forget: Escape to close, a locked background,
 * and a backdrop that is only a backdrop where it isn't the panel.
 */
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Download, X, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import LogoWebsite from "@/components/ui/LogoWebsite";
import { getImageUrl } from "@/lib/utils";
import { testimonialsApi } from "@/lib/testimonials";
import type { BookingDTO } from "@/lib/api";
import {
  formatAmount,
  formatFullDate,
  nightsBetween,
  statusMeta,
  tripLocation,
  tripTitle,
} from "./tripHelpers";

interface ModalProps {
  trip: BookingDTO;
  onClose: () => void;
}

/* ── Shell ───────────────────────────────────────────────────────────────── */

function ModalShell({
  title,
  onClose,
  children,
  footer,
  size = "lg",
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "lg" | "xl";
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    // Without this the page behind keeps scrolling under the dialog.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-th-overlay p-4 backdrop-blur-sm"
      // Only a click that started *and* ended on the backdrop closes — dragging
      // a text selection out of the panel shouldn't dismiss the dialog.
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`flex max-h-[90vh] w-full flex-col overflow-hidden rounded-th-2xl border border-th-border bg-th-surface-raised shadow-th-2xl ${
          size === "xl" ? "max-w-4xl" : "max-w-2xl"
        }`}
      >
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-th-border px-5 py-4 sm:px-6">
          <h2 className="text-lg font-semibold tracking-[-0.015em] text-th-text-primary sm:text-xl">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-th-full p-1.5 text-th-text-muted transition-colors hover:bg-th-surface-2 hover:text-th-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-th-border-focus"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>

        {footer && (
          <footer className="shrink-0 border-t border-th-border px-5 py-4 sm:px-6">{footer}</footer>
        )}
      </div>
    </div>
  );
}

/** Label/value pair — the dialogs are mostly these. */
function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <dt className="text-[13px] text-th-text-muted">{label}</dt>
      <dd className="text-right text-[13px] font-medium text-th-text-primary">{value}</dd>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-th-text-muted">
        {title}
      </h3>
      <dl className="divide-y divide-th-border rounded-th-lg border border-th-border px-3.5">
        {children}
      </dl>
    </section>
  );
}

/* ── Cancel ──────────────────────────────────────────────────────────────── */

export function CancelTripModal({
  trip,
  onClose,
  onConfirm,
  busy,
}: ModalProps & { onConfirm: () => void; busy?: boolean }) {
  return (
    <ModalShell
      title="Cancel this trip?"
      onClose={onClose}
      footer={
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 rounded-th-full border-th-border bg-transparent text-th-text-primary hover:bg-th-surface-2 hover:text-th-text-primary"
          >
            Keep my trip
          </Button>
          <Button
            onClick={onConfirm}
            disabled={busy}
            className="flex-1 rounded-th-full bg-th-error text-white hover:opacity-90"
          >
            {busy ? "Cancelling…" : "Cancel trip"}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <p className="text-[14px] leading-relaxed text-th-text-secondary">
          You're cancelling <strong className="text-th-text-primary">{tripTitle(trip)}</strong>,{" "}
          {formatFullDate(trip.checkInDate)} to {formatFullDate(trip.checkOutDate)}. Your refund
          depends on how close the check-in date is.
        </p>

        <Group title="Refund you can expect">
          <Row label="7 or more days before check-in" value="Full refund" />
          <Row label="3 to 7 days before" value="50% refund" />
          <Row label="Under 72 hours" value="No refund" />
          <Row label="Money reaches you in" value="5–7 business days" />
        </Group>

        <Group title="This booking">
          <Row label="Booking ID" value={`#${trip.bookingId}`} />
          <Row label="Amount paid" value={formatAmount(trip.totalAmount)} />
        </Group>

        <p className="text-[12.5px] leading-relaxed text-th-text-muted">
          Refunds go back to the card or account you paid with. Cancellations caused by events
          outside your control are reviewed individually — contact support if that applies.
        </p>
      </div>
    </ModalShell>
  );
}

/* ── Details ─────────────────────────────────────────────────────────────── */

export function TripDetailsModal({
  trip,
  onClose,
  guestName,
  guestEmail,
}: ModalProps & { guestName: string; guestEmail?: string }) {
  const status = statusMeta(trip.bookingStatus);
  const nights = nightsBetween(trip.checkInDate, trip.checkOutDate);
  const place = tripLocation(trip);

  return (
    <ModalShell
      title="Trip details"
      onClose={onClose}
      footer={
        <Button
          onClick={onClose}
          className="w-full rounded-th-full bg-th-brand text-th-brand-fg hover:bg-th-brand-hover sm:w-auto sm:min-w-[120px] sm:float-right"
        >
          Close
        </Button>
      }
    >
      <div className="space-y-5">
        <div className="flex gap-4">
          <img
            src={getImageUrl(trip.serviceDetails?.photos?.coverUrl)}
            alt=""
            className="h-24 w-24 shrink-0 rounded-th-xl object-cover"
          />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-semibold tracking-[-0.015em] text-th-text-primary">
              {tripTitle(trip)}
            </h3>
            {place && <p className="mt-0.5 truncate text-[13px] text-th-text-muted">{place}</p>}
            <span
              className={`mt-2 inline-block rounded-th-full px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.06em] ${status.chip}`}
            >
              {status.label}
            </span>
          </div>
        </div>

        <Group title="Your stay">
          <Row label="Check in" value={formatFullDate(trip.checkInDate)} />
          <Row label="Check out" value={formatFullDate(trip.checkOutDate)} />
          <Row label="Length" value={`${nights} ${nights === 1 ? "night" : "nights"}`} />
          <Row label="Guests" value={trip.numberOfGuests} />
        </Group>

        <Group title="Booking">
          <Row label="Booking ID" value={`#${trip.bookingId}`} />
          <Row label="Booked on" value={formatFullDate(trip.createdAt)} />
          <Row label="Total paid" value={formatAmount(trip.totalAmount)} />
        </Group>

        <Group title="Guest">
          <Row label="Name" value={guestName || "—"} />
          <Row label="Email" value={guestEmail || "—"} />
          <Row label="Phone" value={trip.clientPhone || "—"} />
        </Group>

        <p className="text-[12.5px] leading-relaxed text-th-text-muted">
          Check in from 3:00 PM. If you'll arrive later than that, message your host through the
          booking so they can arrange access.
        </p>
      </div>
    </ModalShell>
  );
}

/* ── Review ──────────────────────────────────────────────────────────────── */

export function ReviewTripModal({
  trip,
  onClose,
  reviewerName,
  reviewerEmail,
  reviewerAvatar,
}: ModalProps & { reviewerName: string; reviewerEmail?: string; reviewerAvatar?: string }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [review, setReview] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const shown = hovered || rating;
  const RATING_WORDS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

  const submit = async () => {
    setSubmitting(true);
    try {
      await testimonialsApi.create({
        userName: reviewerName || "Guest",
        rating,
        content: review.trim(),
        avatar: reviewerAvatar,
        email: reviewerEmail,
      });
      toast.success("Review posted. Thanks for sharing.");
      onClose();
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Couldn't post your review. Try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      title="Write a review"
      onClose={onClose}
      footer={
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1 rounded-th-full border-th-border bg-transparent text-th-text-primary hover:bg-th-surface-2 hover:text-th-text-primary"
          >
            Not now
          </Button>
          <Button
            onClick={submit}
            disabled={rating === 0 || review.trim() === "" || submitting}
            className="flex-1 rounded-th-full bg-th-brand text-th-brand-fg hover:bg-th-brand-hover"
          >
            {submitting ? "Posting…" : "Post review"}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="flex items-center gap-3.5 rounded-th-lg border border-th-border p-3">
          <img
            src={getImageUrl(trip.serviceDetails?.photos?.coverUrl)}
            alt=""
            className="h-14 w-14 shrink-0 rounded-th-md object-cover"
          />
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold text-th-text-primary">
              {tripTitle(trip)}
            </p>
            <p className="mt-0.5 truncate text-[12.5px] tabular-nums text-th-text-muted">
              {formatFullDate(trip.checkInDate)} – {formatFullDate(trip.checkOutDate)}
            </p>
          </div>
        </div>

        <fieldset>
          <legend className="mb-2 text-[13px] font-medium text-th-text-secondary">
            How was it?
          </legend>
          <div className="flex items-center gap-3" onMouseLeave={() => setHovered(0)}>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  aria-label={`${star} out of 5`}
                  aria-pressed={rating === star}
                  className={`rounded transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-th-border-focus ${
                    star <= shown ? "text-th-warning" : "text-th-border"
                  }`}
                >
                  <Star className="h-7 w-7 fill-current" />
                </button>
              ))}
            </div>
            {shown > 0 && (
              <span className="text-[13px] font-medium text-th-text-muted">
                {RATING_WORDS[shown]}
              </span>
            )}
          </div>
        </fieldset>

        <div>
          <label
            htmlFor="trip-review"
            className="mb-2 block text-[13px] font-medium text-th-text-secondary"
          >
            What should other travellers know?
          </label>
          <textarea
            id="trip-review"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            rows={5}
            maxLength={1000}
            placeholder="The location, the host, how it compared to the photos…"
            className="w-full resize-y rounded-th-lg border border-th-border bg-th-surface-0 p-3 text-[14px] text-th-text-primary placeholder:text-th-text-placeholder focus:border-th-border-focus focus:outline-none focus:ring-2 focus:ring-th-ring"
          />
          <p className="mt-1.5 text-right text-[11.5px] tabular-nums text-th-text-muted">
            {review.length}/1000
          </p>
        </div>
      </div>
    </ModalShell>
  );
}

/* ── Invoice ─────────────────────────────────────────────────────────────── */

export function InvoiceModal({
  trip,
  onClose,
  guestName,
  guestEmail,
}: ModalProps & { guestName: string; guestEmail?: string }) {
  const nights = nightsBetween(trip.checkInDate, trip.checkOutDate);

  return (
    <ModalShell
      title="Invoice"
      onClose={onClose}
      size="xl"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[12.5px] text-th-text-muted">
            Questions about this invoice? Contact support with booking #{trip.bookingId}.
          </p>
          <Button
            onClick={() =>
              toast("PDF download isn't wired up yet — the invoice above has every detail.")
            }
            variant="outline"
            className="gap-2 rounded-th-full border-th-border bg-transparent text-th-text-primary hover:bg-th-surface-2 hover:text-th-text-primary"
          >
            <Download className="h-4 w-4" />
            Download PDF
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-col justify-between gap-5 border-b border-th-border pb-5 sm:flex-row">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center">
              <LogoWebsite />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-[-0.015em] text-th-text-primary">
                TravelHomes
              </p>
              <p className="text-[12.5px] text-th-text-muted">support@travelhomes.com</p>
            </div>
          </div>
          <dl className="sm:text-right">
            <Row label="Invoice" value={`INV-${trip.bookingId}`} />
            <Row label="Issued" value={formatFullDate(trip.createdAt)} />
            <Row label="Status" value={<span className="text-th-success-text">Paid</span>} />
          </dl>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Group title="Billed to">
            <Row label="Name" value={guestName || "—"} />
            <Row label="Email" value={guestEmail || "—"} />
            <Row label="Phone" value={trip.clientPhone || "—"} />
          </Group>
          <Group title="Booking">
            <Row label="Booking ID" value={`#${trip.bookingId}`} />
            <Row label="Property" value={tripTitle(trip)} />
            <Row label="Guests" value={trip.numberOfGuests} />
          </Group>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] border-collapse text-left">
            <thead>
              <tr className="border-b border-th-border">
                {["Description", "Check in", "Check out", "Nights", "Amount"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-3 pb-2.5 text-[10.5px] font-semibold uppercase tracking-[0.09em] text-th-text-muted ${
                      i === 4 ? "text-right" : ""
                    }`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-th-border">
                <td className="px-3 py-3 text-[13px] text-th-text-primary">{tripTitle(trip)}</td>
                <td className="px-3 py-3 text-[13px] tabular-nums text-th-text-secondary">
                  {formatFullDate(trip.checkInDate)}
                </td>
                <td className="px-3 py-3 text-[13px] tabular-nums text-th-text-secondary">
                  {formatFullDate(trip.checkOutDate)}
                </td>
                <td className="px-3 py-3 text-[13px] tabular-nums text-th-text-secondary">
                  {nights}
                </td>
                <td className="px-3 py-3 text-right text-[13px] tabular-nums text-th-text-primary">
                  {formatAmount(trip.totalAmount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="flex justify-end">
          <dl className="w-full max-w-[260px] divide-y divide-th-border rounded-th-lg border border-th-border px-3.5">
            <Row label="Subtotal" value={formatAmount(trip.totalAmount)} />
            <Row label="Service fee" value={formatAmount(0)} />
            <Row label="Taxes" value={formatAmount(0)} />
            <div className="flex items-baseline justify-between gap-4 py-2.5">
              <dt className="text-[13px] font-semibold text-th-text-primary">Total</dt>
              <dd className="text-[15px] font-semibold tabular-nums text-th-text-primary">
                {formatAmount(trip.totalAmount)}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </ModalShell>
  );
}
