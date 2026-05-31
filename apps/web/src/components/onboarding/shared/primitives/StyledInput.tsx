import React from "react";
import { cn } from "@/lib/utils";

interface StyledInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  type?: string;
  error?: boolean;
  // Opt-in bolder border for error cards / contexts that need extra emphasis.
  hardErrorBorder?: boolean;
  // Font sizing presets — matches the 14 / 14.5 split between sibling files.
  fontSize?: number;
  // No-op retained for call-site compatibility; the bg/ring it used to enable
  // produced a "blast red" effect we've retired. Safe to delete once unused.
  softErrorBg?: boolean;
}

const StyledInput: React.FC<StyledInputProps> = ({
  value,
  onChange,
  placeholder,
  maxLength,
  inputMode,
  type = "text",
  error,
  hardErrorBorder,
  fontSize = 14.5,
}) => (
  <input
    type={type}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    maxLength={maxLength}
    inputMode={inputMode}
    className={cn(
      "w-full h-[52px] px-4 rounded-[13px] border-[1.5px] outline-none font-normal tracking-[-0.005em]",
      "transition-[background-color,border-color,box-shadow] duration-150",
      "bg-th-warm-surface border-transparent",
      "placeholder:text-th-warm-text-muted",
      value ? "text-th-text-primary" : "text-th-warm-text-muted",
      !error && "focus:bg-th-surface-0 focus:border-th-brand focus:shadow-[0_0_0_4px_var(--th-ring),0_1px_4px_rgba(0,0,0,0.06)]",
      error && (hardErrorBorder ? "border-th-error-bright" : "border-th-error-bright-soft"),
    )}
    style={{ fontSize }}
  />
);

export default StyledInput;
