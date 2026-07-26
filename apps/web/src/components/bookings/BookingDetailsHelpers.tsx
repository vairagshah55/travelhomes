import React from "react";
import type { BookingDetailDTO } from "@/lib/api";
import { cn } from "@/lib/utils";

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
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "type">) => (
  <div className="flex flex-col gap-1.5">
    <label
      className={cn(
        "text-[11px] font-bold uppercase tracking-[0.03em]",
        error ? "text-th-error-bright" : "text-th-warm-text-dark",
      )}
    >
      {label}
      {required && <span className="text-th-error-bright ml-[3px]">*</span>}
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "w-full h-11 px-3.5 text-[13px] text-th-text-primary font-[450]",
        "rounded-[11px] outline-none transition-all duration-150 border-[1.5px]",
        "bg-th-warm-surface focus:bg-th-surface-0",
        error
          ? "bg-th-error-bright-bg border-th-error-bright-soft focus:shadow-[0_0_0_3px_var(--th-error-bright-ring)]"
          : "border-transparent focus:border-th-brand focus:shadow-[0_0_0_3px_var(--th-ring)]",
      )}
      {...rest}
    />
    {error && <p className="text-[11px] text-th-error-bright">{error}</p>}
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
    <label
      className={cn(
        "text-[11px] font-bold uppercase tracking-[0.03em]",
        error ? "text-th-error-bright" : "text-th-warm-text-dark",
      )}
    >
      {label}
      {required && <span className="text-th-error-bright ml-[3px]">*</span>}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "w-full h-11 px-3.5 text-[13px] font-[450]",
        "rounded-[11px] outline-none appearance-none cursor-pointer transition-all duration-150 border-[1.5px]",
        value ? "text-th-text-primary" : "text-th-warm-text-muted",
        error
          ? "bg-th-error-bright-bg border-th-error-bright-soft"
          : "bg-th-warm-surface border-transparent",
      )}
    >
      {children}
    </select>
    {error && <p className="text-[11px] text-th-error-bright">{error}</p>}
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
  <div className="flex items-center gap-3 py-2.5 border-b border-[#EBEBEB]">
    <span className="text-th-brand flex-shrink-0">{icon}</span>
    <div className="flex-1">
      <p className="text-[11px] text-th-warm-text-muted font-semibold uppercase tracking-[0.03em]">
        {label}
      </p>
      <p className="text-[14px] font-semibold text-th-text-primary mt-[1px]">{value || "—"}</p>
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
