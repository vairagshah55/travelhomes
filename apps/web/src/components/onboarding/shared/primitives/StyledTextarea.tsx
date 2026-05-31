import React from "react";
import { cn } from "@/lib/utils";

interface StyledTextareaProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  error?: boolean;
}

const StyledTextarea: React.FC<StyledTextareaProps> = ({
  value,
  onChange,
  placeholder,
  maxLength,
  rows = 4,
  error,
}) => (
  <textarea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    maxLength={maxLength}
    rows={rows}
    className={cn(
      "w-full px-4 py-[14px] text-[14.5px] rounded-[13px] border-[1.5px] outline-none resize-none font-normal tracking-[-0.005em] leading-[1.65]",
      "transition-[background-color,border-color,box-shadow] duration-150",
      "bg-th-warm-surface border-transparent text-th-text-primary",
      "placeholder:text-th-warm-text-muted",
      !error && "focus:bg-th-surface-0 focus:border-th-brand focus:shadow-[0_0_0_4px_var(--th-ring),0_1px_4px_rgba(0,0,0,0.06)]",
      error && "border-th-error-bright shadow-[0_0_0_3px_var(--th-error-bright-ring)]",
    )}
  />
);

export default StyledTextarea;
