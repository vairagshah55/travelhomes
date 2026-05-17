import React from "react";
import {
  BLACK,
  TEAL,
  TEAL_FOCUS,
  WHITE,
  SURFACE,
  ERROR,
  ERROR_SOFT,
  ERROR_BG,
  ERROR_RING,
  GRAY_400,
} from "./tokens";

interface StyledInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  type?: string;
  error?: boolean;
  // The original DescriptionStep used a softer red border (#ef4444) for inline
  // text fields, while CapacityAddress used a paler red (#fca5a5). Default to
  // the paler shade so error fields don't scream; set `hardErrorBorder` to use
  // the bolder color for fields embedded inside header-level error cards.
  hardErrorBorder?: boolean;
  // The original DescriptionStep StyledInput did not fill the background red
  // on error. Pass `softErrorBg` to opt into the lighter pink background used
  // by CapacityAddress / PricingStep.
  softErrorBg?: boolean;
  // Font sizing presets — matches the 14 / 14.5 split between sibling files.
  fontSize?: number;
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
  softErrorBg,
  fontSize = 14.5,
}) => {
  const [focused, setFocused] = React.useState(false);
  const active = focused && !error;
  const borderColor = error
    ? hardErrorBorder
      ? ERROR
      : ERROR_SOFT
    : focused
      ? TEAL
      : "transparent";
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder={placeholder}
      maxLength={maxLength}
      inputMode={inputMode}
      style={{
        width: "100%",
        height: 52,
        padding: "0 16px",
        fontSize,
        color: value ? BLACK : GRAY_400,
        backgroundColor: error && softErrorBg ? ERROR_BG : focused ? WHITE : SURFACE,
        border: `1.5px solid ${borderColor}`,
        borderRadius: 13,
        outline: "none",
        boxShadow: active
          ? `0 0 0 4px ${TEAL_FOCUS}, 0 1px 4px rgba(0,0,0,0.06)`
          : error
            ? `0 0 0 3px ${ERROR_RING}`
            : "none",
        transition: "background-color 0.15s, border-color 0.15s, box-shadow 0.2s",
        fontWeight: 450,
        letterSpacing: "-0.005em",
      }}
    />
  );
};

export default StyledInput;
