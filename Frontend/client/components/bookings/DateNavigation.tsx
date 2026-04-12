import React from "react";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MONTH_NAMES } from "./api";

const TEAL    = "#07e4e4";
const TEAL_BG = "rgba(7, 228, 228, 0.07)";
const BLACK   = "#131313";
const GRAY_400 = "#9a9a9a";
const GRAY_200 = "#e4e4e4";
const WHITE   = "#ffffff";
const SURFACE = "#F7F8FA";

export const DateNavigation = ({ currentMonth, currentYear, onMonthChange, onYearChange }: {
  currentMonth: number; currentYear: number;
  onMonthChange: (m: number) => void; onYearChange: (y: number) => void;
}) => {
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  const prev = () => { if (currentMonth === 0) { onMonthChange(11); onYearChange(currentYear - 1); } else onMonthChange(currentMonth - 1); };
  const next = () => { if (currentMonth === 11) { onMonthChange(0); onYearChange(currentYear + 1); } else onMonthChange(currentMonth + 1); };

  const navBtn = (onClick: () => void, icon: React.ReactNode) => (
    <button type="button" onClick={onClick}
      style={{ width: 34, height: 34, borderRadius: 10, border: `1.5px solid ${GRAY_200}`, backgroundColor: WHITE, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", transition: "all 0.15s" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = TEAL; (e.currentTarget as HTMLButtonElement).style.backgroundColor = TEAL_BG; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = GRAY_200; (e.currentTarget as HTMLButtonElement).style.backgroundColor = WHITE; }}>
      {icon}
    </button>
  );

  return (
    <div className="flex items-center gap-3">
      {navBtn(prev, <ChevronLeft size={16} color={GRAY_400} />)}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", borderRadius: 12, backgroundColor: "transparent", border: "none", cursor: "pointer" }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: BLACK, letterSpacing: "-0.02em" }}>
              {MONTH_NAMES[currentMonth]}, {currentYear}
            </span>
            <ChevronDown size={18} color={GRAY_400} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56 p-3">
          <p style={{ fontSize: 11, fontWeight: 700, color: GRAY_400, textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 6 }}>Month</p>
          <div className="grid grid-cols-3 gap-1 mb-3">
            {MONTH_NAMES.map((m, i) => (
              <button key={m} type="button" onClick={() => onMonthChange(i)}
                style={{ padding: "6px 0", borderRadius: 8, border: "none", fontSize: 12, fontWeight: i === currentMonth ? 700 : 500, backgroundColor: i === currentMonth ? TEAL : "transparent", color: i === currentMonth ? BLACK : GRAY_400, cursor: "pointer", transition: "all 0.15s" }}>
                {m.slice(0, 3)}
              </button>
            ))}
          </div>
          <p style={{ fontSize: 11, fontWeight: 700, color: GRAY_400, textTransform: "uppercase", letterSpacing: "0.03em", marginBottom: 6 }}>Year</p>
          <div className="grid grid-cols-2 gap-1">
            {years.map((y) => (
              <button key={y} type="button" onClick={() => onYearChange(y)}
                style={{ padding: "6px 0", borderRadius: 8, border: "none", fontSize: 12, fontWeight: y === currentYear ? 700 : 500, backgroundColor: y === currentYear ? TEAL : "transparent", color: y === currentYear ? BLACK : GRAY_400, cursor: "pointer", transition: "all 0.15s" }}>
                {y}
              </button>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {navBtn(next, <ChevronRight size={16} color={GRAY_400} />)}
    </div>
  );
};
