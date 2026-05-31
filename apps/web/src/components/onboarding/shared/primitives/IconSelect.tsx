import React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

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
      "group flex items-center rounded-[13px] overflow-hidden border-[1.5px] transition-all duration-150",
      "bg-th-warm-surface border-transparent",
      disabled && "opacity-60",
      !error && !disabled && "focus-within:bg-th-surface-0 focus-within:border-th-brand focus-within:shadow-[0_0_0_4px_var(--th-ring),0_1px_4px_rgba(0,0,0,0.06)]",
      error && "border-th-error-bright-soft bg-th-error-bright-bg shadow-[0_0_0_3px_var(--th-error-bright-ring)]",
    )}
  >
    <div
      className={cn(
        "flex items-center px-3 h-[52px] border-r-[1.5px] shrink-0 transition-all duration-150",
        "bg-th-warm-surface border-th-warm-border text-th-warm-text-muted",
        !disabled && "group-focus-within:bg-th-brand-soft group-focus-within:border-th-brand-border-soft group-focus-within:text-th-brand",
      )}
    >
      {icon}
    </div>
    <div className="relative flex-1">
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className={cn(
          "w-full h-[52px] pl-[14px] pr-9 text-sm bg-transparent border-none outline-none appearance-none font-normal",
          disabled
            ? "text-th-warm-text-muted cursor-not-allowed"
            : value ? "text-th-text-primary cursor-pointer" : "text-th-warm-text-muted cursor-pointer",
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
