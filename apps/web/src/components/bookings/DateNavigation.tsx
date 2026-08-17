import React from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BRAND_VARS } from "@/components/shared";
import { MONTH_NAMES } from "./api";
import { cn } from "@/lib/utils";

/**
 * Month/year stepper for the bookings calendar. Sized to sit inside the page
 * toolbar (40px row), so the label is toolbar-scale rather than a page title —
 * the month already reads as a heading on the calendar panel itself.
 */
export const DateNavigation = ({
  currentMonth,
  currentYear,
  onMonthChange,
  onYearChange,
}: {
  currentMonth: number;
  currentYear: number;
  onMonthChange: (m: number) => void;
  onYearChange: (y: number) => void;
}) => {
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  const prev = () => {
    if (currentMonth === 0) {
      onMonthChange(11);
      onYearChange(currentYear - 1);
    } else onMonthChange(currentMonth - 1);
  };
  const next = () => {
    if (currentMonth === 11) {
      onMonthChange(0);
      onYearChange(currentYear + 1);
    } else onMonthChange(currentMonth + 1);
  };

  const navBtn = (onClick: () => void, label: string, icon: React.ReactNode) => (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "grid place-items-center w-7 h-7 rounded-lg shrink-0 text-muted-foreground outline-none",
        "transition-colors duration-150 hover:bg-brand/[0.09] hover:text-brand",
        "focus-visible:ring-2 focus-visible:ring-brand/40",
      )}
    >
      {icon}
    </button>
  );

  const gridBtn = (selected: boolean) =>
    cn(
      "py-1.5 rounded-lg text-[12px] outline-none transition-colors duration-150",
      "focus-visible:ring-2 focus-visible:ring-brand/40",
      selected
        ? "font-bold bg-brand text-brand-fg"
        : "font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
    );

  return (
    <div className="flex items-center gap-0.5">
      {navBtn(prev, "Previous month", <ChevronLeft size={15} strokeWidth={2.3} />)}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "flex items-center gap-1.5 px-2 h-8 rounded-lg outline-none whitespace-nowrap",
              "text-[13px] font-semibold text-foreground tabular-nums",
              "transition-colors duration-150 hover:bg-muted focus-visible:ring-2 focus-visible:ring-brand/40",
            )}
          >
            {MONTH_NAMES[currentMonth]} {currentYear}
            <ChevronDown size={14} className="text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" style={BRAND_VARS} data-console-portal="" className="w-56 p-3">
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
            Month
          </p>
          <div className="grid grid-cols-3 gap-1 mb-3">
            {MONTH_NAMES.map((m, i) => (
              <button
                key={m}
                type="button"
                onClick={() => onMonthChange(i)}
                className={gridBtn(i === currentMonth)}
              >
                {m.slice(0, 3)}
              </button>
            ))}
          </div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
            Year
          </p>
          <div className="grid grid-cols-2 gap-1">
            {years.map((y) => (
              <button
                key={y}
                type="button"
                onClick={() => onYearChange(y)}
                className={cn(gridBtn(y === currentYear), "tabular-nums")}
              >
                {y}
              </button>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {navBtn(next, "Next month", <ChevronRight size={15} strokeWidth={2.3} />)}
    </div>
  );
};
