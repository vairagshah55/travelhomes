import React, { useState } from "react";
import { Calendar, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { type BookingData, getDaysInMonth, formatDateRange, isDateBooked } from "./api";

/* Status hues match `shared/StatusBadge` so a booking reads the same colour in
   the calendar, the list and the detail panel. */
export const STATUS_COLORS: Record<
  string,
  { bg: string; text: string; border: string; barBg: string }
> = {
  Confirmed: { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe", barBg: "#dbeafe" },
  "Checked-in": { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0", barBg: "#dcfce7" },
  "Checked-out": { bg: "#f8fafc", text: "#475467", border: "#e2e8f0", barBg: "#f1f5f9" },
  Cancelled: { bg: "#fef2f2", text: "#b91c1c", border: "#fecaca", barBg: "#fee2e2" },
};

const getColor = (status: string) => STATUS_COLORS[status] || STATUS_COLORS.Confirmed;

const COL = 60; // px per day column
const ROW = 60; // px per resource row
const RAIL = 300; // px for the sticky service-name column

/* ─── Booking block (overlay bar) ─────────────────────────────────────────── */
const BookingBlock = ({
  booking,
  span,
  onClick,
  onDragStart,
  onDragEnd,
}: {
  booking: BookingData;
  span: number;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}) => {
  const c = getColor(booking.status);
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      title={`${booking.guestName} · ${booking.status}`}
      className={cn(
        "flex items-center gap-2 m-1 px-3 rounded-[10px] border cursor-grab active:cursor-grabbing",
        "transition-[transform,box-shadow] duration-150",
        "hover:-translate-y-px hover:shadow-[0_8px_20px_-8px_rgba(16,24,40,0.35)]",
      )}
      style={{
        width: span * COL - 8,
        minHeight: 44,
        backgroundColor: c.barBg,
        borderColor: c.border,
      }}
    >
      <div className="flex items-center justify-between w-full gap-2 text-[12px]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-bold truncate max-w-[120px]" style={{ color: c.text }}>
            {booking.guestName}
          </span>
          <span
            className="shrink-0 rounded-full border px-2 py-[2px] text-[10px] font-bold"
            style={{ backgroundColor: c.bg, color: c.text, borderColor: c.border }}
          >
            {booking.status}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0 opacity-80" style={{ color: c.text }}>
          <Calendar size={11} />
          <span className="whitespace-nowrap tabular-nums">
            {formatDateRange(booking.startDate, booking.endDate)}
          </span>
        </div>
      </div>
    </div>
  );
};

/* ─── Main calendar grid ──────────────────────────────────────────────────── */
export const CalendarGrid = ({
  currentMonth,
  currentYear,
  bookings,
  onBookingClick,
  onBookingDrag,
  onDateClick,
  onNewBooking,
  selectedDate,
  vehicleNames,
}: {
  currentMonth: number;
  currentYear: number;
  bookings: BookingData[];
  onBookingClick: (b: BookingData) => void;
  onBookingDrag: (id: string, start: Date, end: Date) => void;
  onDateClick: (date: number, resource: string) => void;
  /** Start a booking for a whole service, without picking a day first. */
  onNewBooking?: (resource: string) => void;
  selectedDate: { date: number; resource: string } | null;
  vehicleNames: string[];
}) => {
  const [draggedBooking, setDraggedBooking] = useState<BookingData | null>(null);
  const [dragOverDate, setDragOverDate] = useState<{ date: number; resource: string } | null>(null);

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const days = Array.from({ length: Math.min(daysInMonth, 30) }, (_, i) => i + 1);

  /** Today only counts when the grid is actually showing this month. */
  const now = new Date();
  const todayDate =
    now.getMonth() === currentMonth && now.getFullYear() === currentYear ? now.getDate() : null;

  const isWeekend = (day: number) => {
    const d = new Date(currentYear, currentMonth, day).getDay();
    return d === 0 || d === 6;
  };

  const monthlyBookings = bookings.filter((b) => {
    const sm = b.startDate.getMonth(),
      sy = b.startDate.getFullYear();
    const em = b.endDate.getMonth(),
      ey = b.endDate.getFullYear();
    return (
      (sm === currentMonth && sy === currentYear) ||
      (em === currentMonth && ey === currentYear) ||
      ((sy < currentYear || (sy === currentYear && sm < currentMonth)) &&
        (ey > currentYear || (ey === currentYear && em > currentMonth)))
    );
  });

  const getBookingPosition = (booking: BookingData, vehicleIndex: number) => {
    let startDay = 1,
      endDay = daysInMonth;
    if (
      booking.startDate.getMonth() === currentMonth &&
      booking.startDate.getFullYear() === currentYear
    )
      startDay = booking.startDate.getDate();
    if (
      booking.endDate.getMonth() === currentMonth &&
      booking.endDate.getFullYear() === currentYear
    )
      endDay = booking.endDate.getDate();
    startDay = Math.max(1, Math.min(startDay, daysInMonth));
    endDay = Math.max(1, Math.min(endDay, daysInMonth));
    return {
      startCol: startDay,
      span: Math.max(1, endDay - startDay + 1),
      top: vehicleIndex * ROW + 8,
      left: (startDay - 1) * COL + RAIL,
    };
  };

  const handleDragStart = (b: BookingData) => (e: React.DragEvent) => {
    setDraggedBooking(b);
    e.dataTransfer.effectAllowed = "move";
  };
  const handleDragEnd = () => {
    setDraggedBooking(null);
    setDragOverDate(null);
  };
  const handleDragOver = (date: number, res: string) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverDate({ date, resource: res });
  };
  const handleDrop = (date: number, res: string) => (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedBooking) return;
    const days = Number(draggedBooking.totalDays || 1);
    onBookingDrag(
      draggedBooking._id,
      new Date(currentYear, currentMonth, date),
      new Date(currentYear, currentMonth, date + days - 1),
    );
    setDraggedBooking(null);
    setDragOverDate(null);
  };

  return (
    <div className="overflow-auto rounded-[14px] border border-border/70 bg-card">
      {/* Header row — sticks while the body scrolls vertically. */}
      <div className="flex min-w-max sticky top-0 z-30 bg-muted border-b border-border/70">
        <div
          className="shrink-0 sticky left-0 z-10 px-4 py-3 border-r border-border/70 bg-muted text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground"
          style={{ width: RAIL }}
        >
          Service
        </div>
        {days.map((d) => {
          const today = d === todayDate;
          return (
            <div
              key={d}
              className={cn(
                "shrink-0 py-3 text-center border-r border-border/70 text-[12px] font-bold tabular-nums",
                today
                  ? "text-brand"
                  : isWeekend(d)
                    ? "text-muted-foreground/60"
                    : "text-muted-foreground",
              )}
              style={{ width: COL }}
            >
              {today ? (
                <span className="inline-grid place-items-center w-6 h-6 rounded-full bg-brand text-brand-fg">
                  {d}
                </span>
              ) : (
                d.toString().padStart(2, "0")
              )}
            </div>
          );
        })}
      </div>

      {/* Body */}
      <div className="relative">
        {vehicleNames.map((vehicle, vi) => (
          <div
            key={vi}
            className={cn(
              "group/row flex min-w-max border-b border-border/70 last:border-b-0",
              "transition-colors duration-100 hover:bg-brand/[0.035]",
              vi % 2 === 1 && "bg-muted/30 dark:bg-white/[0.015]",
            )}
            style={{ height: ROW }}
          >
            <div
              // Stays opaque `bg-card` even on row hover — the booking bars
              // scroll underneath it, and a translucent rail would show them.
              className="shrink-0 sticky left-0 z-20 flex items-center gap-2 pl-4 pr-2 border-r border-border/70 bg-card"
              style={{ width: RAIL }}
            >
              <span className="min-w-0 flex-1 text-[13px] font-semibold text-foreground truncate">
                {vehicle}
              </span>
              {onNewBooking && (
                <button
                  type="button"
                  onClick={() => onNewBooking(vehicle)}
                  aria-label={`New booking for ${vehicle}`}
                  title={`New booking for ${vehicle}`}
                  className={cn(
                    "grid place-items-center w-7 h-7 rounded-lg shrink-0 outline-none",
                    "bg-brand/[0.09] text-brand hover:bg-brand hover:text-brand-fg",
                    "focus-visible:ring-2 focus-visible:ring-brand/40",
                    // Always reachable on touch; reveals on hover on desktop.
                    "opacity-70 lg:opacity-0 lg:group-hover/row:opacity-100 focus-visible:opacity-100",
                    "transition-[opacity,background-color,color] duration-150",
                  )}
                >
                  <Plus size={14} strokeWidth={2.6} />
                </button>
              )}
            </div>
            {days.map((day) => {
              const booked = isDateBooked(day, currentMonth, currentYear, bookings, vehicle);
              const isDragOver = dragOverDate?.date === day && dragOverDate?.resource === vehicle;
              const isSelected = selectedDate?.date === day && selectedDate?.resource === vehicle;
              const currentBooking = booked
                ? bookings.find((b) => {
                    const d = new Date(currentYear, currentMonth, day);
                    d.setHours(0, 0, 0, 0);
                    const s = new Date(b.startDate);
                    s.setHours(0, 0, 0, 0);
                    const e = new Date(b.endDate);
                    e.setHours(0, 0, 0, 0);
                    return (
                      b.resourceName === vehicle && d >= s && d <= e && b.status !== "Cancelled"
                    );
                  })
                : null;

              return (
                <div
                  key={day}
                  title={
                    booked
                      ? `${currentBooking?.guestName} · booked`
                      : `Create a booking on ${day} for ${vehicle}`
                  }
                  className={cn(
                    "shrink-0 relative flex items-center justify-center border-r border-border/70",
                    "cursor-pointer transition-colors duration-100",
                    // The overlay bar already names the guest — a booked cell
                    // only needs to read as unavailable, not repeat the name in
                    // 8px type (which is what it used to do).
                    booked
                      ? "bg-red-50/70 dark:bg-red-500/10"
                      : isWeekend(day)
                        ? "bg-muted/40 dark:bg-white/[0.02] hover:bg-brand/[0.08]"
                        : "hover:bg-brand/[0.08]",
                    isDragOver && "bg-brand/20 ring-1 ring-inset ring-brand",
                    isSelected && "ring-1 ring-inset ring-brand/60",
                    day === todayDate && "shadow-[inset_1px_0_0_0_hsl(var(--brand)/0.35)]",
                  )}
                  style={{ width: COL }}
                  onClick={() =>
                    currentBooking ? onBookingClick(currentBooking) : onDateClick(day, vehicle)
                  }
                  onDragOver={handleDragOver(day, vehicle)}
                  onDrop={handleDrop(day, vehicle)}
                >
                  {!booked && (
                    <span className="text-[11px] font-medium tabular-nums text-muted-foreground/50">
                      {day.toString().padStart(2, "0")}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {/* Overlay booking bars */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {monthlyBookings.map((b) => {
            const vi = vehicleNames.indexOf(b.resourceName);
            if (vi === -1) return null;
            const pos = getBookingPosition(b, vi);
            if (pos.startCol < 1 || pos.startCol > daysInMonth) return null;
            return (
              <div
                key={b._id}
                className="absolute z-10 pointer-events-auto"
                style={{ top: pos.top, left: pos.left }}
              >
                <BookingBlock
                  booking={b}
                  span={pos.span}
                  onClick={() => onBookingClick(b)}
                  onDragStart={handleDragStart(b)}
                  onDragEnd={handleDragEnd}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
