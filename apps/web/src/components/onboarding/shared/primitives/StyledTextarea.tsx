import React from "react";
import { cn } from "@/lib/utils";
import { inputSurfaceClass, inputFocusClass } from "./StyledInput";

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
      "w-full min-h-[140px] px-4 py-[14px] text-[15px] rounded-[12px] outline-none resize-none",
      "font-normal tracking-[-0.005em] leading-[1.65]",
      inputSurfaceClass,
      "text-th-text-primary placeholder:text-th-warm-text-muted",
      !error && inputFocusClass,
      error &&
        "border-th-error-bright-soft focus:border-th-error-bright focus:shadow-[0_0_0_3px_var(--th-error-bright-ring)]",
    )}
  />
);

export default StyledTextarea;
