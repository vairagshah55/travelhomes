import React from "react";
import { cn } from "@/lib/utils";
import { inputSurfaceClass, inputFocusClass } from "./StyledInput";

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
        "w-full h-[54px] pl-4 pr-10 text-[15px] rounded-[12px] outline-none appearance-none font-normal",
        disabled
          ? cn(
              "border border-th-warm-border bg-th-warm-surface text-th-warm-text-muted",
              "cursor-not-allowed",
            )
          : cn(
              inputSurfaceClass,
              "cursor-pointer",
              value ? "text-th-text-primary" : "text-th-warm-text-muted",
            ),
        !error && !disabled && inputFocusClass,
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
      aria-hidden="true"
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
