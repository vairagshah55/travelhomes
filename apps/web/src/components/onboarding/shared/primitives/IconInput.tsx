import React from "react";
import { cn } from "@/lib/utils";

interface IconInputProps {
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  type?: string;
  mono?: boolean;
  suffix?: React.ReactNode;
  error?: boolean;
}

const IconInput: React.FC<IconInputProps> = ({
  icon,
  value,
  onChange,
  placeholder,
  maxLength,
  inputMode,
  type = "text",
  mono,
  suffix,
  error,
}) => (
  <div
    className={cn(
      "group flex items-center rounded-[13px] overflow-hidden border-[1.5px] transition-all duration-150",
      "bg-th-warm-surface border-transparent",
      !error && "focus-within:bg-th-surface-0 focus-within:border-th-brand focus-within:shadow-[0_0_0_4px_var(--th-ring),0_1px_4px_rgba(0,0,0,0.06)]",
      error && "border-th-error-bright-soft bg-th-error-bright-bg shadow-[0_0_0_3px_var(--th-error-bright-ring)]",
    )}
  >
    <div
      className={cn(
        "flex items-center px-3 h-[52px] border-r-[1.5px] shrink-0 transition-all duration-150",
        "bg-th-warm-surface border-th-warm-border text-th-warm-text-muted",
        "group-focus-within:bg-th-brand-soft group-focus-within:border-th-brand-border-soft group-focus-within:text-th-brand",
      )}
    >
      {icon}
    </div>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      inputMode={inputMode}
      className={cn(
        "flex-1 h-[52px] px-[14px] text-sm bg-transparent border-none outline-none font-normal",
        "placeholder:text-th-warm-text-muted",
        value ? "text-th-text-primary" : "text-th-warm-text-muted",
        mono ? "font-mono tracking-[0.08em]" : "tracking-[-0.005em]",
      )}
    />
    {suffix}
  </div>
);

export default IconInput;
