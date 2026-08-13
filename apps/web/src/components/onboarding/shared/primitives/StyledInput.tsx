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

/**
 * Resting state is WHITE with a visible border — a filled grey field reads as
 * `disabled` to most users, which is why this flow felt inert. The affordance
 * ladder is: white+grey border (editable) → teal border (hover) → teal border
 * + soft ring (focused).
 */
export const inputSurfaceClass = cn(
  "bg-th-surface-0 border border-th-warm-border-strong",
  "hover:border-[color:var(--onb-border-hover,#a9c5c2)]",
  "transition-[background-color,border-color,box-shadow] duration-150",
);

export const inputFocusClass =
  "focus:border-th-brand focus:shadow-[0_0_0_3px_var(--th-ring)]";

const StyledInput: React.FC<StyledInputProps> = ({
  value,
  onChange,
  placeholder,
  maxLength,
  inputMode,
  type = "text",
  error,
  hardErrorBorder,
  fontSize = 15,
}) => (
  <input
    type={type}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    maxLength={maxLength}
    inputMode={inputMode}
    className={cn(
      "w-full h-[54px] px-4 rounded-[12px] outline-none font-normal tracking-[-0.005em]",
      inputSurfaceClass,
      "text-th-text-primary placeholder:text-th-warm-text-muted placeholder:font-normal",
      !error && inputFocusClass,
      error &&
        cn(
          hardErrorBorder ? "border-th-error-bright" : "border-th-error-bright-soft",
          "focus:border-th-error-bright focus:shadow-[0_0_0_3px_var(--th-error-bright-ring)]",
        ),
    )}
    style={{ fontSize }}
  />
);

export default StyledInput;
