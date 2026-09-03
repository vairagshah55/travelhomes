// Date only: 01 Jan 2024
export const formatDate = (dateString?: string) => {
  if (!dateString) return "-";

  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// Date + time: 01 Jan 2024, 05:30 AM
export const formatDateTime = (dateString?: string) => {
  if (!dateString) return "-";

  return new Date(dateString).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

// Date only without timezone shift (safe for UTC Z dates)
export const formatDateOnlyUTC = (dateString?: string) => {
  if (!dateString) return "-";

  const [date] = dateString.split("T");
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/**
 * A time of day on its own, with no date attached: "14:00" → "2:00 PM".
 *
 * Property check-in / check-out are stored as a bare `"HH:mm"` 24-hour string
 * — the shape `<input type="time">` emits and the one `Booking.pickupTime` and
 * the legacy `Management.checkInTime` already use. The date formatters above
 * cannot help: `new Date("14:00")` is Invalid Date, so routing a clock time
 * through them renders "-" or, worse, today's date at that hour in the
 * viewer's timezone.
 */
export const formatTimeOfDay = (value?: string | null) => {
  if (!value) return "-";
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(value).trim());
  if (!match) return "-";

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return "-";

  // 0 and 12 both map to 12 — midnight is 12 AM, noon is 12 PM.
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${String(minutes).padStart(2, "0")} ${hours < 12 ? "AM" : "PM"}`;
};

/** True when `value` is a well-formed 24-hour `"HH:mm"` clock time. */
export const isValidTimeOfDay = (value?: string | null): boolean =>
  !!value && formatTimeOfDay(value) !== "-";
