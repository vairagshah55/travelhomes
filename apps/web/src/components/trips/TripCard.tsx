/**
 * Trip cards for /user-trips.
 *
 * Two shapes, one idea: a trip is a moment in time before it is a row in a
 * list. `NextTripPass` gives the single nearest upcoming trip the structure of
 * a travel document — a stub carrying the countdown, a perforated divider,
 * then the details. `TripCard` is the quiet grid card everything else uses.
 *
 * The pass appears exactly once per page. That restraint is the point: it
 * reads as an accent rather than a theme.
 */
import React from "react";
import { MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getImageUrl } from "@/lib/utils";
import type { BookingDTO } from "@/lib/api";
import {
  countdown,
  formatAmount,
  formatDayMonth,
  formatStayRange,
  nightsBetween,
  relativeDayLabel,
  serviceLabel,
  statusMeta,
  tripLocation,
  tripTitle,
} from "./tripHelpers";

export interface TripCardActions {
  onCancel: (trip: BookingDTO) => void;
  onView: (trip: BookingDTO) => void;
  onReview: (trip: BookingDTO) => void;
  onGetInvoice: (trip: BookingDTO) => void;
}

const MICRO_LABEL = "text-[10.5px] font-semibold uppercase tracking-[0.09em] text-th-text-muted";

/* ── Actions ─────────────────────────────────────────────────────────────── */

function TripActions({
  trip,
  isPrevious,
  actions,
  size = "sm",
}: {
  trip: BookingDTO;
  isPrevious: boolean;
  actions: TripCardActions;
  size?: "sm" | "default";
}) {
  const cancelled = trip.bookingStatus === "cancelled";

  if (isPrevious) {
    return (
      <>
        <Button
          onClick={() => actions.onGetInvoice(trip)}
          variant="outline"
          size={size}
          className="rounded-full border-th-border bg-transparent text-th-text-primary hover:border-th-border-hover hover:bg-th-surface-2 hover:text-th-text-primary"
        >
          Invoice
        </Button>
        <Button
          onClick={() => actions.onView(trip)}
          variant="outline"
          size={size}
          className="rounded-full border-th-border bg-transparent text-th-text-primary hover:border-th-border-hover hover:bg-th-surface-2 hover:text-th-text-primary"
        >
          Details
        </Button>
        {!cancelled && (
          <Button
            onClick={() => actions.onReview(trip)}
            size={size}
            className="rounded-full bg-th-brand text-th-brand-fg hover:bg-th-brand-hover"
          >
            Write a review
          </Button>
        )}
      </>
    );
  }

  return (
    <>
      {!cancelled && (
        <Button
          onClick={() => actions.onCancel(trip)}
          variant="outline"
          size={size}
          className="rounded-full border-th-border bg-transparent text-th-text-muted hover:border-th-error hover:bg-th-error-bg hover:text-th-error-text"
        >
          Cancel trip
        </Button>
      )}
      <Button
        onClick={() => actions.onView(trip)}
        size={size}
        className="rounded-full bg-th-brand text-th-brand-fg hover:bg-th-brand-hover"
      >
        View details
      </Button>
    </>
  );
}

/* ── The signature: next trip as a travel pass ───────────────────────────── */

export function NextTripPass({ trip, actions }: { trip: BookingDTO; actions: TripCardActions }) {
  const { value, unit } = countdown(trip.checkInDate);
  const status = statusMeta(trip.bookingStatus);
  const nights = nightsBetween(trip.checkInDate, trip.checkOutDate);
  const place = tripLocation(trip);

  return (
    <article className="relative flex flex-col overflow-hidden rounded-th-3xl border border-th-border bg-th-surface-raised shadow-th-md md:flex-row">
      {/* Stub — the countdown lives here and nowhere else on the page. */}
      <div className="relative flex shrink-0 items-center gap-5 bg-th-brand px-6 py-5 text-th-brand-fg md:w-[200px] md:flex-col md:items-start md:justify-center md:gap-1 md:py-8">
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.16em] opacity-75">
          Next trip
        </span>
        <div className="flex items-baseline gap-2 md:mt-1 md:flex-col md:gap-0">
          {value && (
            <span className="text-5xl font-bold leading-none tabular-nums tracking-[-0.03em] md:text-6xl">
              {value}
            </span>
          )}
          <span
            className={
              value
                ? "text-base font-medium opacity-85 md:mt-1.5"
                : "text-3xl font-bold leading-none tracking-[-0.02em] md:text-4xl"
            }
          >
            {unit}
          </span>
        </div>
        <span className="ml-auto text-[11px] font-semibold uppercase tracking-[0.08em] opacity-85 md:ml-0 md:mt-4">
          {status.label}
        </span>
      </div>

      {/* Perforation. Two notches punched out of the card edges, in the page's
          own colour, with a dashed rule between them. */}
      <div className="relative hidden w-0 md:block" aria-hidden>
        <span className="absolute -top-2.5 -left-2.5 h-5 w-5 rounded-full bg-th-surface-1" />
        <span className="absolute -bottom-2.5 -left-2.5 h-5 w-5 rounded-full bg-th-surface-1" />
        <span className="absolute inset-y-3 left-0 border-l-2 border-dashed border-th-border" />
      </div>

      {/* Details */}
      <div className="flex min-w-0 flex-1 flex-col gap-5 p-5 sm:p-6">
        <div className="flex min-w-0 gap-4">
          <img
            src={getImageUrl(trip.serviceDetails?.photos?.coverUrl)}
            alt=""
            className="h-20 w-20 shrink-0 rounded-th-xl object-cover sm:h-24 sm:w-24"
          />
          <div className="min-w-0 flex-1">
            <p className={MICRO_LABEL}>{serviceLabel(trip.serviceName)}</p>
            <h2 className="mt-1 truncate text-xl font-semibold tracking-[-0.015em] text-th-text-primary sm:text-2xl">
              {tripTitle(trip)}
            </h2>
            {place && (
              <p className="mt-1 flex items-center gap-1.5 truncate text-[13px] text-th-text-muted">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{place}</span>
              </p>
            )}
          </div>
        </div>

        {/* The trip's own numbers, on one rail. */}
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 border-y border-th-border py-4 sm:grid-cols-4">
          <div>
            <dt className={MICRO_LABEL}>Check in</dt>
            <dd className="mt-1 text-[15px] font-semibold tabular-nums text-th-text-primary">
              {formatDayMonth(trip.checkInDate)}
            </dd>
          </div>
          <div>
            <dt className={MICRO_LABEL}>Check out</dt>
            <dd className="mt-1 text-[15px] font-semibold tabular-nums text-th-text-primary">
              {formatDayMonth(trip.checkOutDate)}
            </dd>
          </div>
          <div>
            <dt className={MICRO_LABEL}>{nights === 1 ? "Night" : "Nights"}</dt>
            <dd className="mt-1 text-[15px] font-semibold tabular-nums text-th-text-primary">
              {nights}
            </dd>
          </div>
          <div>
            <dt className={MICRO_LABEL}>Guests</dt>
            <dd className="mt-1 text-[15px] font-semibold tabular-nums text-th-text-primary">
              {trip.numberOfGuests}
            </dd>
          </div>
        </dl>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xl font-semibold tabular-nums tracking-[-0.015em] text-th-text-primary">
            {formatAmount(trip.totalAmount)}
            <span className="ml-1.5 text-[13px] font-normal text-th-text-muted">paid</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <TripActions trip={trip} isPrevious={false} actions={actions} />
          </div>
        </div>
      </div>
    </article>
  );
}

/* ── Grid card ───────────────────────────────────────────────────────────── */

export function TripCard({
  trip,
  isPrevious = false,
  actions,
  selectable = false,
  selected = false,
  onSelect,
}: {
  trip: BookingDTO;
  isPrevious?: boolean;
  actions: TripCardActions;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const status = statusMeta(trip.bookingStatus);
  const nights = nightsBetween(trip.checkInDate, trip.checkOutDate);
  const place = tripLocation(trip);

  return (
    <article
      className={`group flex h-full flex-col overflow-hidden rounded-th-2xl border bg-th-surface-raised transition-all duration-th-normal ${
        selected
          ? "border-th-brand shadow-th-ring"
          : "border-th-border hover:border-th-border-hover hover:shadow-th-md"
      }`}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-th-surface-2">
        <img
          src={getImageUrl(trip.serviceDetails?.photos?.coverUrl)}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-th-slow group-hover:scale-[1.03]"
        />

        {selectable && (
          <label className="absolute left-3 top-3 z-10 flex cursor-pointer items-center rounded-th-md bg-th-surface-raised p-1.5 shadow-th-sm">
            <input
              type="checkbox"
              checked={selected}
              onChange={onSelect}
              className="h-4 w-4 cursor-pointer accent-th-brand"
              aria-label={`Select ${tripTitle(trip)}`}
            />
          </label>
        )}

        <span
          className={`absolute right-3 top-3 rounded-th-full px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-[0.06em] shadow-th-sm backdrop-blur-sm ${status.chip}`}
        >
          {status.label}
        </span>

        {!isPrevious && (
          <span className="absolute bottom-3 left-3 rounded-th-full bg-th-surface-raised px-2.5 py-1 text-[11.5px] font-semibold tabular-nums text-th-text-primary shadow-th-sm">
            {relativeDayLabel(trip.checkInDate)}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div className="min-w-0">
          <p className={MICRO_LABEL}>{serviceLabel(trip.serviceName)}</p>
          <h3
            className="mt-1 truncate text-[17px] font-semibold tracking-[-0.012em] text-th-text-primary"
            title={tripTitle(trip)}
          >
            {tripTitle(trip)}
          </h3>
          {place && (
            <p className="mt-1 flex items-center gap-1.5 truncate text-[13px] text-th-text-muted">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{place}</span>
            </p>
          )}
        </div>

        {/* One line of dates instead of a labelled grid — same information,
            a quarter of the chrome. */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-th-text-secondary">
          <span className="font-medium tabular-nums">
            {formatStayRange(trip.checkInDate, trip.checkOutDate)}
          </span>
          <span className="text-th-border">·</span>
          <span className="tabular-nums">
            {nights} {nights === 1 ? "night" : "nights"}
          </span>
          <span className="text-th-border">·</span>
          <span className="flex items-center gap-1 tabular-nums">
            <Users className="h-3.5 w-3.5" />
            {trip.numberOfGuests}
          </span>
        </div>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-th-border pt-3.5">
          <p className="text-[17px] font-semibold tabular-nums tracking-[-0.012em] text-th-text-primary">
            {formatAmount(trip.totalAmount)}
          </p>
          <div className="flex flex-wrap gap-1.5">
            <TripActions trip={trip} isPrevious={isPrevious} actions={actions} />
          </div>
        </div>
      </div>
    </article>
  );
}

/** Matches the grid card's proportions so the layout doesn't jump on load. */
export function TripCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-th-2xl border border-th-border bg-th-surface-raised">
      <div className="aspect-[16/10] motion-skeleton" />
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="h-2.5 w-16 rounded motion-skeleton" />
        <div className="h-4 w-3/4 rounded motion-skeleton" />
        <div className="h-3 w-1/2 rounded motion-skeleton" />
        <div className="mt-auto flex items-center justify-between border-t border-th-border pt-3.5">
          <div className="h-4 w-20 rounded motion-skeleton" />
          <div className="h-8 w-28 rounded-th-full motion-skeleton" />
        </div>
      </div>
    </div>
  );
}
