import React, { useState } from "react";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { type BookingData, getDaysInMonth, formatDateRange, isDateBooked } from "./api";

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string; barBg: string }> = {
  Confirmed:    { bg: "#eff6ff", text: "#1d4ed8", border: "#bfdbfe", barBg: "#93c5fd" },
  "Checked-in": { bg: "#f0fdf4", text: "#16a34a", border: "#bbf7d0", barBg: "#86efac" },
  "Checked-out":{ bg: "#F7F8FA",   text: "#6b6b6b", border: "#e4e4e4", barBg: "#d1d5db" },
  Cancelled:    { bg: "#fef2f2", text: "#dc2626", border: "#fecaca", barBg: "#fca5a5" },
};

const getColor = (status: string) => STATUS_COLORS[status] || STATUS_COLORS.Confirmed;

/* ─── Booking block (overlay bar) ─────────────────────────────────────────── */
const BookingBlock = ({ booking, span, onClick, onDragStart, onDragEnd }: {
  booking: BookingData; span: number; onClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void; onDragEnd?: (e: React.DragEvent) => void;
}) => {
  const c = getColor(booking.status);
  return (
    <div
      draggable onDragStart={onDragStart} onDragEnd={onDragEnd} onClick={onClick}
      className="flex items-center rounded-[10px] cursor-pointer transition-all hover:scale-[1.02] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] z-10"
      style={{
        width: span * 60 - 8,
        minHeight: 44,
        margin: 4,
        padding: "0 12px",
        backgroundColor: c.barBg,
        border: `1.5px solid ${c.border}`,
      }}
    >
      <div className="flex items-center justify-between w-full text-[12px]">
        <div className="flex items-center gap-2">
          <span style={{ fontWeight: 700, color: c.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 120 }}>{booking.guestName}</span>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}`, whiteSpace: "nowrap" }}>{booking.status}</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0" style={{ color: c.text, opacity: 0.8 }}>
          <Calendar size={11} />
          <span style={{ whiteSpace: "nowrap" }}>{formatDateRange(booking.startDate, booking.endDate)}</span>
        </div>
      </div>
    </div>
  );
};

/* ─── Main calendar grid ──────────────────────────────────────────────────── */
export const CalendarGrid = ({ currentMonth, currentYear, bookings, onBookingClick, onBookingDrag, onDateClick, selectedDate, vehicleNames }: {
  currentMonth: number; currentYear: number; bookings: BookingData[];
  onBookingClick: (b: BookingData) => void;
  onBookingDrag: (id: string, start: Date, end: Date) => void;
  onDateClick: (date: number, resource: string) => void;
  selectedDate: { date: number; resource: string } | null;
  vehicleNames: string[];
}) => {
  const [draggedBooking, setDraggedBooking] = useState<BookingData | null>(null);
  const [dragOverDate, setDragOverDate] = useState<{ date: number; resource: string } | null>(null);

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const days = Array.from({ length: Math.min(daysInMonth, 30) }, (_, i) => i + 1);

  const monthlyBookings = bookings.filter((b) => {
    const sm = b.startDate.getMonth(), sy = b.startDate.getFullYear();
    const em = b.endDate.getMonth(), ey = b.endDate.getFullYear();
    return (sm === currentMonth && sy === currentYear) || (em === currentMonth && ey === currentYear) ||
      ((sy < currentYear || (sy === currentYear && sm < currentMonth)) && (ey > currentYear || (ey === currentYear && em > currentMonth)));
  });

  const getBookingPosition = (booking: BookingData, vehicleIndex: number) => {
    let startDay = 1, endDay = daysInMonth;
    if (booking.startDate.getMonth() === currentMonth && booking.startDate.getFullYear() === currentYear) startDay = booking.startDate.getDate();
    if (booking.endDate.getMonth() === currentMonth && booking.endDate.getFullYear() === currentYear) endDay = booking.endDate.getDate();
    startDay = Math.max(1, Math.min(startDay, daysInMonth));
    endDay = Math.max(1, Math.min(endDay, daysInMonth));
    return { startCol: startDay, span: Math.max(1, endDay - startDay + 1), top: vehicleIndex * 60 + 8, left: (startDay - 1) * 60 + 300 };
  };

  const handleDragStart = (b: BookingData) => (e: React.DragEvent) => { setDraggedBooking(b); e.dataTransfer.effectAllowed = "move"; };
  const handleDragEnd = () => { setDraggedBooking(null); setDragOverDate(null); };
  const handleDragOver = (date: number, res: string) => (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; setDragOverDate({ date, resource: res }); };
  const handleDrop = (date: number, res: string) => (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedBooking) return;
    const days = Number(draggedBooking.totalDays || 1);
    onBookingDrag(draggedBooking._id, new Date(currentYear, currentMonth, date), new Date(currentYear, currentMonth, date + days - 1));
    setDraggedBooking(null); setDragOverDate(null);
  };

  return (
    <div className="border border-[#EBEBEB] rounded-[16px] bg-th-surface-0 overflow-auto shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
      {/* Header row */}
      <div className="flex min-w-max bg-th-warm-surface border-b border-[#EBEBEB]">
        <div className="w-[300px] flex-shrink-0 px-4 py-3 border-r border-[#EBEBEB] text-[12px] font-bold text-th-warm-text-dark uppercase tracking-[0.03em]">
          Service Name
        </div>
        {days.map((d) => (
          <div key={d} className="w-[60px] flex-shrink-0 py-3 text-center border-r border-[#EBEBEB] text-[12px] font-bold text-th-warm-text-dark">
            {d.toString().padStart(2, "0")}
          </div>
        ))}
      </div>

      {/* Body */}
      <div className="relative">
        {vehicleNames.map((vehicle, vi) => (
          <div
            key={vi}
            className="flex min-w-max border-b border-[#EBEBEB] transition-colors duration-100 hover:bg-th-brand-soft"
            style={{
              height: 60,
              backgroundColor: vi % 2 === 1 ? "#F7F8FA" : "#ffffff",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = "rgba(15,92,138,0.07)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.backgroundColor = vi % 2 === 1 ? "#F7F8FA" : "#ffffff"; }}
          >
            <div className="w-[300px] flex-shrink-0 px-4 border-r border-[#EBEBEB] flex items-center text-[13px] font-semibold text-th-text-primary overflow-hidden text-ellipsis whitespace-nowrap">
              {vehicle}
            </div>
            {days.map((day) => {
              const booked = isDateBooked(day, currentMonth, currentYear, bookings, vehicle);
              const isDragOver = dragOverDate?.date === day && dragOverDate?.resource === vehicle;
              const currentBooking = booked ? bookings.find((b) => {
                const d = new Date(currentYear, currentMonth, day); d.setHours(0, 0, 0, 0);
                const s = new Date(b.startDate); s.setHours(0, 0, 0, 0);
                const e = new Date(b.endDate); e.setHours(0, 0, 0, 0);
                return b.resourceName === vehicle && d >= s && d <= e && b.status !== "Cancelled";
              }) : null;

              return (
                <div key={day}
                  className="w-[60px] flex-shrink-0 flex items-center justify-center border-r border-[#EBEBEB] cursor-pointer relative transition-colors duration-100"
                  style={{
                    backgroundColor: isDragOver ? "#bfdbfe" : booked ? "#fef2f2" : "transparent",
                  }}
                  onClick={() => currentBooking ? onBookingClick(currentBooking) : onDateClick(day, vehicle)}
                  onDragOver={handleDragOver(day, vehicle)} onDrop={handleDrop(day, vehicle)}>
                  <span style={{ fontSize: booked ? 8 : 11, fontWeight: booked ? 700 : 500, color: booked ? "#dc2626" : "#9a9a9a", zIndex: 1, lineHeight: 1.2, textAlign: "center", wordBreak: "break-all" }}>
                    {booked ? currentBooking?.guestName : day.toString().padStart(2, "0")}
                  </span>
                  {booked && <div className="absolute inset-0 bg-[rgba(254,202,202,0.25)] rounded-[2px]" />}
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
              <div key={b._id} className="absolute z-10 pointer-events-auto" style={{ top: pos.top, left: pos.left }}>
                <BookingBlock booking={b} span={pos.span} onClick={() => onBookingClick(b)} onDragStart={handleDragStart(b)} onDragEnd={handleDragEnd} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
