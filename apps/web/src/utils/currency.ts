/**
 * Rupee formatting.
 *
 * Six pages each declared a byte-identical `currencyINR`, and two of them
 * declared it *inside* the component body — so a new `Intl.NumberFormat` was
 * constructed on every render. Intl constructors are among the most expensive
 * objects in the JS runtime (locale resolution + ICU data lookup), and a table
 * of bookings would build one per render for no reason.
 *
 * The formatter is created once, at module scope, and reused.
 */
const INR_WHOLE = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** `1234` → `"₹1,234"`. Non-numeric input formats as ₹0 rather than "₹NaN". */
export function currencyINR(n: number): string {
  return INR_WHOLE.format(Number.isFinite(Number(n)) ? Number(n) : 0);
}

const INR_PRECISE = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

/** `1234.5` → `"₹1,234.5"`. For invoice / payment lines that need paise. */
export function currencyINRPrecise(n: number): string {
  return INR_PRECISE.format(Number.isFinite(Number(n)) ? Number(n) : 0);
}

/**
 * Coerce a money value to a number, whatever shape the API sent.
 *
 * `servicePrice` genuinely arrives as BOTH types from the same endpoint:
 * `GET /api/bookingDetails` returns raw BookingDetail documents (where the
 * schema declares `servicePrice: Number`) concatenated with Booking rows mapped
 * through `mapBookingToRow`, which formats it as the string `"₹ 5000"` — see
 * Server/modules/booking-details/booking-details.service.js. Anything consuming
 * that field has to handle both, which is what crashed BookingDetails with
 * "(b.servicePrice || '').replace is not a function".
 *
 * Strips currency symbols, spaces and grouping commas; returns 0 for anything
 * unparseable rather than NaN.
 */
export function toAmount(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const n = Number(String(v ?? "").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}
