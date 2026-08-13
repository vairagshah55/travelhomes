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

/**
 * Shared shell for the icon-prefixed input/select pair. The leading icon sits
 * on the same white surface as the field with only a hairline divider — the old
 * grey-filled chip read as a disabled segment bolted onto the control.
 */
export const iconShellClass = cn(
  "group flex items-center rounded-[12px] overflow-hidden border bg-th-surface-0",
  "border-th-warm-border-strong transition-[border-color,box-shadow] duration-150",
);

export const iconShellFocusClass = cn(
  "hover:border-[color:var(--onb-border-hover,#a9c5c2)]",
  "focus-within:border-th-brand focus-within:shadow-[0_0_0_3px_var(--th-ring)]",
);

export const iconSlotClass = cn(
  "flex items-center px-3.5 h-[54px] border-r shrink-0 transition-colors duration-150",
  "border-th-warm-border text-th-warm-text-muted",
  "group-focus-within:text-th-brand group-focus-within:border-th-brand-border-soft",
);

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
      iconShellClass,
      !error && iconShellFocusClass,
      error && "border-th-error-bright-soft focus-within:shadow-[0_0_0_3px_var(--th-error-bright-ring)]",
    )}
  >
    <div className={iconSlotClass}>{icon}</div>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      inputMode={inputMode}
      className={cn(
        "flex-1 h-[54px] px-[14px] text-[15px] bg-transparent border-none outline-none font-normal",
        "text-th-text-primary placeholder:text-th-warm-text-muted",
        mono ? "font-mono tracking-[0.08em]" : "tracking-[-0.005em]",
      )}
    />
    {suffix}
  </div>
);

export default IconInput;
