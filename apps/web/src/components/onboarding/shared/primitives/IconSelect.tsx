import React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { iconShellClass, iconShellFocusClass, iconSlotClass } from "./IconInput";

interface IconSelectProps {
  icon: React.ReactNode;
  value: string;
  onChange?: (v: string) => void;
  disabled?: boolean;
  error?: boolean;
  children: React.ReactNode;
}

const IconSelect: React.FC<IconSelectProps> = ({
  icon,
  value,
  onChange,
  disabled,
  error,
  children,
}) => (
  <div
    className={cn(
      iconShellClass,
      // A genuinely disabled control is the ONE place the grey fill is correct.
      disabled && "bg-th-warm-surface border-th-warm-border opacity-70",
      !error && !disabled && iconShellFocusClass,
      error && "border-th-error-bright-soft focus-within:shadow-[0_0_0_3px_var(--th-error-bright-ring)]",
    )}
  >
    <div className={iconSlotClass}>{icon}</div>
    <div className="relative flex-1">
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className={cn(
          "w-full h-[54px] pl-[14px] pr-9 text-[15px] bg-transparent border-none outline-none appearance-none font-normal",
          disabled
            ? "text-th-warm-text-muted cursor-not-allowed"
            : cn("cursor-pointer", value ? "text-th-text-primary" : "text-th-warm-text-muted"),
        )}
      >
        {children}
      </select>
      <ChevronDown
        size={15}
        className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-th-warm-text-muted"
      />
    </div>
  </div>
);

export default IconSelect;
