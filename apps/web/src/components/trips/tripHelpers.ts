/**
 * Derived facts about a booking that the raw DTO doesn't carry.
 *
 * The trips page used to render `new Date(x).toLocaleDateString()` twice per
 * card and stop there — which throws away the one thing a traveller actually
 * opens this page for: *when*. Everything here exists to put time back at the
 * centre of the page.
 */
import type { BookingDTO } from "@/lib/api";

const DAY_MS = 86_400_000;

/** Midnight local. Comparing raw timestamps makes "today" flip at the wrong hour. */
function startOfDay(value: string | Date): number {
  const d = new Date(value);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/** Whole days from today to `date`. Negative once the date has passed. */
export function daysUntil(date: string): number {
  return Math.round((startOfDay(date) - startOfDay(new Date())) / DAY_MS);
}

export function nightsBetween(checkIn: string, checkOut: string): number {
  return Math.max(0, Math.round((startOfDay(checkOut) - startOfDay(checkIn)) / DAY_MS));
}

const DAY_MONTH = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" });
const FULL_DATE = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export const formatDayMonth = (date: string) => DAY_MONTH.format(new Date(date));
export const formatFullDate = (date: string) => FULL_DATE.format(new Date(date));

/** "14 – 17 Mar" when the month is shared, "28 Feb – 3 Mar" when it isn't. */
export function formatStayRange(checkIn: string, checkOut: string): string {
  const from = new Date(checkIn);
  const to = new Date(checkOut);
  if (from.getMonth() === to.getMonth() && from.getFullYear() === to.getFullYear()) {
    return `${from.getDate()} – ${DAY_MONTH.format(to)}`;
  }
  return `${DAY_MONTH.format(from)} – ${DAY_MONTH.format(to)}`;
}

/** ₹12,400 rather than ₹12400 — Indian grouping, no stray decimals. */
export function formatAmount(amount: number): string {
  return `₹${Number(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

/**
 * Short time-distance for a chip: "Today", "Tomorrow", "In 12 days", "2 days ago".
 * Deliberately not a library — four cases, and a date lib would be a new
 * dependency for the sake of them.
 */
export function relativeDayLabel(date: string): string {
  const days = daysUntil(date);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  if (days > 1) return `In ${days} days`;
  return `${Math.abs(days)} days ago`;
}

/**
 * The countdown as a numeral plus its unit, so the feature card can set them
 * at different sizes. Past and same-day trips have no number to show — the
 * word carries it alone.
 */
export function countdown(date: string): { value: string | null; unit: string } {
  const days = daysUntil(date);
  if (days === 0) return { value: null, unit: "Today" };
  if (days === 1) return { value: null, unit: "Tomorrow" };
  if (days < 0) return { value: null, unit: "Under way" };
  if (days < 14) return { value: String(days), unit: days === 1 ? "day" : "days" };
  if (days < 60) {
    const weeks = Math.round(days / 7);
    return { value: String(weeks), unit: weeks === 1 ? "week" : "weeks" };
  }
  const months = Math.round(days / 30);
  return { value: String(months), unit: months === 1 ? "month" : "months" };
}

export interface StatusMeta {
  label: string;
  /** Background + text, both from semantic tokens so dark mode comes free. */
  chip: string;
  /** Solid dot for the same status, used where a full chip would be noise. */
  dot: string;
}

/**
 * One place that decides what a booking status looks like. Previously the page
 * spelled these as raw hex in two different functions that had already drifted
 * apart.
 */
export function statusMeta(status?: string): StatusMeta {
  switch ((status || "").toLowerCase()) {
    case "cancelled":
      return { label: "Cancelled", chip: "bg-th-error-bg text-th-error-text", dot: "bg-th-error" };
    case "pending":
      return {
        label: "Awaiting confirmation",
        chip: "bg-th-warning-bg text-th-warning-text",
        dot: "bg-th-warning",
      };
    case "active":
    case "checked-in":
      return {
        label: "Checked in",
        chip: "bg-th-success-bg text-th-success-text",
        dot: "bg-th-success",
      };
    case "completed":
    case "checked-out":
      return {
        label: "Completed",
        chip: "bg-th-surface-2 text-th-text-muted",
        dot: "bg-th-text-muted",
      };
    default:
      return { label: "Confirmed", chip: "bg-th-info-bg text-th-info-text", dot: "bg-th-info" };
  }
}

/** Human name for the three service types the DTO uses. */
export function serviceLabel(serviceName?: BookingDTO["serviceName"]): string {
  if (serviceName === "camper-van") return "Camper van";
  if (serviceName === "activity") return "Activity";
  return "Stay";
}

export const isPastStatus = (status?: string) =>
  ["completed", "checked-out", "cancelled"].includes((status || "").toLowerCase());

/** Best display name available — brand name, then listing name, then the type. */
export function tripTitle(trip: BookingDTO): string {
  return (
    trip.serviceDetails?.brandName ||
    trip.serviceDetails?.name ||
    trip.serviceDetails?.serviceName ||
    serviceLabel(trip.serviceName)
  );
}

/** Where it is, if the booking or the listing knows. */
export function tripLocation(trip: BookingDTO): string {
  const details = trip.serviceDetails || {};
  const cityState = [details.city, details.state].filter(Boolean).join(", ");
  return trip.location || cityState || details.address || "";
}
