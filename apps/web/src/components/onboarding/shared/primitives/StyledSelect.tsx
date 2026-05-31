import React from "react";
import { cn } from "@/lib/utils";

interface StyledSelectProps {
  value: string;
  onChange?: (v: string) => void;
  disabled?: boolean;
  error?: boolean;
  children: React.ReactNode;
}

const StyledSelect: React.FC<StyledSelectProps> = ({
  value,
  onChange,
  disabled,
  error,
  children,
}) => (
  <div className="relative">
    <select
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      className={cn(
        "w-full h-[52px] pl-4 pr-10 text-sm rounded-[13px] border-[1.5px] outline-none appearance-none font-normal",
        "transition-[background-color,border-color,box-shadow] duration-150",
        "border-transparent",
        disabled
          ? "bg-th-warm-surface text-th-warm-text-muted cursor-not-allowed"
          : "cursor-pointer bg-th-warm-surface focus:bg-th-surface-0",
        !disabled && (value ? "text-th-text-primary" : "text-th-warm-text-muted"),
        !error && !disabled && "focus:border-th-brand focus:shadow-[0_0_0_4px_var(--th-ring),0_1px_4px_rgba(0,0,0,0.06)]",
        error && "border-th-error-bright-soft",
      )}
    >
      {children}
    </select>
    <svg
      className="absolute right-[14px] top-1/2 -translate-y-1/2 pointer-events-none text-th-warm-text-muted"
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
    >
      <path
        d="M4 6l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);

export default StyledSelect;
