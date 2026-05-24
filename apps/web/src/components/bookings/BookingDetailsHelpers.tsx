import React from "react";
import type { BookingDetailDTO } from "@/lib/api";
import {
  TEAL,
  TEAL_FOCUS,
  BLACK,
  GRAY_500,
  GRAY_400,
  WHITE,
  SURFACE,
  ERROR,
} from "@/components/offering";

export const GREEN = "#16a34a";
export const AMBER = "#d97706";
export const BLUE = "#2563eb";

/** Styled text input used in the slide-out edit panel. */
export const PanelInput = ({
  label,
  required,
  value,
  onChange,
  type = "text",
  placeholder,
  error,
  ...rest
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  error?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "type">) => {
  const [focused, setFocused] = React.useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: error ? ERROR : GRAY_500,
          textTransform: "uppercase",
          letterSpacing: "0.03em",
        }}
      >
        {label}
        {required && <span style={{ color: ERROR, marginLeft: 3 }}>*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        style={{
          width: "100%",
          height: 44,
          padding: "0 14px",
          fontSize: 13,
          color: BLACK,
          fontWeight: 450,
          backgroundColor: error ? "rgba(239,68,68,0.04)" : focused ? WHITE : SURFACE,
          border: `1.5px solid ${error ? "#fca5a5" : focused ? TEAL : "transparent"}`,
          borderRadius: 11,
          outline: "none",
          boxShadow:
            focused && !error
              ? `0 0 0 3px ${TEAL_FOCUS}`
              : error
                ? "0 0 0 3px rgba(239,68,68,0.1)"
                : "none",
          transition: "all 0.15s",
        }}
        {...rest}
      />
      {error && <p style={{ fontSize: 11, color: ERROR }}>{error}</p>}
    </div>
  );
};

/** Styled select used in the slide-out edit panel. */
export const PanelSelect = ({
  label,
  required,
  value,
  onChange,
  children,
  error,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  error?: string;
}) => (
  <div className="flex flex-col gap-1.5">
    <label
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: error ? ERROR : GRAY_500,
        textTransform: "uppercase",
        letterSpacing: "0.03em",
      }}
    >
      {label}
      {required && <span style={{ color: ERROR, marginLeft: 3 }}>*</span>}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        height: 44,
        padding: "0 14px",
        fontSize: 13,
        color: value ? BLACK : GRAY_400,
        fontWeight: 450,
        backgroundColor: error ? "rgba(239,68,68,0.04)" : SURFACE,
        border: `1.5px solid ${error ? "#fca5a5" : "transparent"}`,
        borderRadius: 11,
        outline: "none",
        appearance: "none",
        cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      {children}
    </select>
    {error && <p style={{ fontSize: 11, color: ERROR }}>{error}</p>}
  </div>
);

/** Read-only row in the detail panel: icon + label + value. */
export const InfoRow = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <div
    className="flex items-center gap-3"
    style={{ padding: "10px 0", borderBottom: `1px solid #EBEBEB` }}
  >
    <span style={{ color: TEAL, flexShrink: 0 }}>{icon}</span>
    <div style={{ flex: 1 }}>
      <p
        style={{
          fontSize: 11,
          color: GRAY_400,
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.03em",
        }}
      >
        {label}
      </p>
      <p style={{ fontSize: 14, fontWeight: 600, color: BLACK, marginTop: 1 }}>{value || "—"}</p>
    </div>
  </div>
);

export const STATUS_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  pending: { bg: "#fffbeb", color: AMBER, border: `${AMBER}25` },
  confirmed: { bg: "#eff6ff", color: BLUE, border: `${BLUE}25` },
  active: { bg: "#f0fdf4", color: GREEN, border: `${GREEN}25` },
  cancelled: { bg: "#fef2f2", color: ERROR, border: `${ERROR}25` },
};

/** Colored pill badge for a booking status (pending/confirmed/active/cancelled). */
export const StatusBadge = ({ status }: { status: string }) => {
  const s = STATUS_STYLES[status] || STATUS_STYLES.pending;
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 11,
        fontWeight: 700,
        padding: "3px 10px",
        borderRadius: 99,
        backgroundColor: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        textTransform: "capitalize",
      }}
    >
      {status}
    </span>
  );
};

/**
 * Best-effort parser for the booking `checkIn` field, which may arrive as
 * "DD/MM/YYYY, HH:MM AM/PM", an ISO "YYYY-MM-DDTHH:MM" string, or a Date-parseable
 * string. Returns `new Date()` if nothing matches.
 */
export const parseBookingDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  try {
    if (dateStr.includes("/")) {
      const [datePart, timePart] = dateStr.split(", ");
      const [day, month, year] = datePart.split("/");
      if (timePart) {
        const [time, period] = timePart.split(" ");
        const [hours, minutes] = time.split(":");
        let h = parseInt(hours);
        if (period?.toLowerCase() === "pm" && h !== 12) h += 12;
        if (period?.toLowerCase() === "am" && h === 12) h = 0;
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), h, parseInt(minutes));
      }
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
    const [ymd, hm] = dateStr.split(/[T ]/);
    if (/\d{4}-\d{2}-\d{2}/.test(ymd)) {
      const [y, m, d] = ymd.split("-");
      if (hm && /\d{2}:\d{2}/.test(hm)) {
        const [h, min] = hm.split(":");
        return new Date(+y, +m - 1, +d, +h, +min);
      }
      return new Date(+y, +m - 1, +d);
    }
    return new Date(dateStr);
  } catch {
    return new Date();
  }
};

/** True if `date` falls within `range` (today / week / month / all). */
export const isDateInRange = (date: Date, range: string) => {
  if (range === "all") return true;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  if (range === "today") return date >= today && date < tomorrow;
  if (range === "week") {
    const ws = new Date(today);
    ws.setDate(today.getDate() - today.getDay());
    const we = new Date(ws);
    we.setDate(ws.getDate() + 7);
    return date >= ws && date < we;
  }
  if (range === "month") {
    const ms = new Date(now.getFullYear(), now.getMonth(), 1);
    const me = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    return date >= ms && date < me;
  }
  return true;
};

/** Bucket a booking into upcoming / past / cancelled based on status + checkIn. */
export const categorizeBooking = (b: BookingDetailDTO): "upcoming" | "past" | "cancelled" => {
  if (b.status === "cancelled") return "cancelled";
  const d = parseBookingDate(b.checkIn);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const bd = new Date(d);
  bd.setHours(0, 0, 0, 0);
  return bd >= today ? "upcoming" : "past";
};

export const LOCATIONS = [
  "Jamshedpur",
  "Delhi",
  "Mumbai",
  "Bangalore",
  "Chennai",
  "Kolkata",
  "Hyderabad",
  "Pune",
  "Goa",
  "Kerala",
];
