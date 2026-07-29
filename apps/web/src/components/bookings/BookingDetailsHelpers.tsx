import React from "react";
import { ChevronDown } from "lucide-react";
import type { BookingDetailDTO } from "@/lib/api";
import { CONTROL, CONTROL_ERROR } from "@/components/shared";
import { cn } from "@/lib/utils";

export const GREEN = "#16a34a";
export const AMBER = "#d97706";
export const BLUE = "#2563eb";

/* These render inside SlidePanel, which carries `BRAND_VARS`, so the kit's
   CONTROL token resolves teal here the same way it does inside a Panel. */

const FIELD_LABEL = "text-[12.5px] font-semibold text-foreground/85";
const FIELD_ERROR = "text-[11.5px] font-medium text-red-600 dark:text-red-400";

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
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "type">) => (
  <div className="flex flex-col gap-1.5">
    <label className={FIELD_LABEL}>
      {label}
      {required && <span className="ml-[3px] text-red-500">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-invalid={!!error}
      className={cn(
        "w-full h-11 px-3.5 border text-foreground outline-none",
        CONTROL,
        error && CONTROL_ERROR,
      )}
      {...rest}
    />
    {error && <p className={FIELD_ERROR}>{error}</p>}
  </div>
);

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
    <label className={FIELD_LABEL}>
      {label}
      {required && <span className="ml-[3px] text-red-500">*</span>}
    </label>
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        className={cn(
          "w-full h-11 pl-3.5 pr-9 border outline-none appearance-none cursor-pointer",
          CONTROL,
          value ? "text-foreground" : "text-muted-foreground",
          error && CONTROL_ERROR,
        )}
      >
        {children}
      </select>
      <ChevronDown
        size={14}
        strokeWidth={2.3}
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
      />
    </div>
    {error && <p className={FIELD_ERROR}>{error}</p>}
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
  <div className="flex items-start gap-3 py-3 border-b border-border/70 last:border-b-0">
    <span className="grid place-items-center w-8 h-8 rounded-[10px] bg-muted text-muted-foreground shrink-0">
      {icon}
    </span>
    <div className="min-w-0 flex-1">
      <p className="text-[11.5px] font-semibold text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-0.5 text-[13.5px] font-medium break-words",
          value ? "text-foreground" : "text-muted-foreground/60",
        )}
      >
        {value || "Not provided"}
      </p>
    </div>
  </div>
);

export const STATUS_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  pending: { bg: "#fffbeb", color: AMBER, border: `${AMBER}25` },
  confirmed: { bg: "#eff6ff", color: BLUE, border: `${BLUE}25` },
  active: { bg: "#f0fdf4", color: GREEN, border: `${GREEN}25` },
  cancelled: { bg: "#fef2f2", color: "#ef4444", border: `#ef444425` },
};

/** Colored pill badge for a booking status (pending/confirmed/active/cancelled). */
export const StatusBadge = ({ status }: { status: string }) => {
  const s = STATUS_STYLES[status] || STATUS_STYLES.pending;
  return (
    <span
      className="inline-block text-[11px] font-bold px-2.5 py-[3px] rounded-full capitalize"
      style={{
        backgroundColor: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
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
