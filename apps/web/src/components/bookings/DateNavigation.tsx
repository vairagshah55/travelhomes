import React from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MONTH_NAMES } from "./api";
import { cn } from "@/lib/utils";

export const DateNavigation = ({ currentMonth, currentYear, onMonthChange, onYearChange }: {
  currentMonth: number; currentYear: number;
  onMonthChange: (m: number) => void; onYearChange: (y: number) => void;
}) => {
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  const prev = () => { if (currentMonth === 0) { onMonthChange(11); onYearChange(currentYear - 1); } else onMonthChange(currentMonth - 1); };
  const next = () => { if (currentMonth === 11) { onMonthChange(0); onYearChange(currentYear + 1); } else onMonthChange(currentMonth + 1); };

  const navBtn = (onClick: () => void, icon: React.ReactNode) => (
    <button
      type="button"
      onClick={onClick}
      className="w-[34px] h-[34px] rounded-[10px] border border-th-warm-border bg-th-surface-0 flex items-center justify-center cursor-pointer transition-all hover:border-th-brand hover:bg-th-brand-soft"
    >
      {icon}
    </button>
  );

  return (
    <div className="flex items-center gap-3">
      {navBtn(prev, <ChevronLeft size={16} className="text-th-warm-text-muted" />)}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className="flex items-center gap-2 px-3.5 py-1.5 rounded-[12px] bg-transparent border-none cursor-pointer">
            <span className="text-[20px] font-extrabold text-th-text-primary tracking-[-0.02em]">
              {MONTH_NAMES[currentMonth]}, {currentYear}
            </span>
            <ChevronDown size={18} className="text-th-warm-text-muted" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56 p-3">
          <p className="text-[11px] font-bold text-th-warm-text-muted uppercase tracking-[0.03em] mb-1.5">Month</p>
          <div className="grid grid-cols-3 gap-1 mb-3">
            {MONTH_NAMES.map((m, i) => (
              <button key={m} type="button" onClick={() => onMonthChange(i)}
                className={cn(
                  "py-1.5 rounded-lg border-none text-[12px] cursor-pointer transition-all",
                  i === currentMonth
                    ? "font-bold bg-th-brand text-th-text-primary"
                    : "font-medium bg-transparent text-th-warm-text-muted"
                )}>
                {m.slice(0, 3)}
              </button>
            ))}
          </div>
          <p className="text-[11px] font-bold text-th-warm-text-muted uppercase tracking-[0.03em] mb-1.5">Year</p>
          <div className="grid grid-cols-2 gap-1">
            {years.map((y) => (
              <button key={y} type="button" onClick={() => onYearChange(y)}
                className={cn(
                  "py-1.5 rounded-lg border-none text-[12px] cursor-pointer transition-all",
                  y === currentYear
                    ? "font-bold bg-th-brand text-th-text-primary"
                    : "font-medium bg-transparent text-th-warm-text-muted"
                )}>
                {y}
              </button>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {navBtn(next, <ChevronRight size={16} className="text-th-warm-text-muted" />)}
    </div>
  );
};
