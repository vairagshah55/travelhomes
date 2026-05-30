import React from "react";
import {
  BLACK,
  TEAL,
  TEAL_FOCUS,
  WHITE,
  SURFACE,
  ERROR,
  ERROR_SOFT,
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
  // Opt-in bolder border for error cards / contexts that need extra emphasis.
  // Default error treatment is now subtle (border only — no bg fill, no ring),
  // matching the UserProfileEdit pattern. `hardErrorBorder` keeps the previous
  // saturated red border available for the rare case it's still wanted.
  hardErrorBorder?: boolean;
  // Font sizing presets — matches the 14 / 14.5 split between sibling files.
  fontSize?: number;
  // Kept as a no-op prop so existing call-sites compile; the bg + ring
  // treatments it used to enable were producing a "blast red" effect we've
  // explicitly retired. Safe to delete once all call-sites stop passing it.
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
        // Background never tints red — keep it neutral whether the field has
        // an error or not. The border + inline ErrorMsg carry the signal.
        backgroundColor: focused ? WHITE : SURFACE,
        border: `1.5px solid ${borderColor}`,
        borderRadius: 13,
        outline: "none",
        boxShadow: active
          ? `0 0 0 4px ${TEAL_FOCUS}, 0 1px 4px rgba(0,0,0,0.06)`
          : "none",
        transition: "background-color 0.15s, border-color 0.15s, box-shadow 0.2s",
        fontWeight: 450,
        letterSpacing: "-0.005em",
      }}
    />
  );
};

export default StyledInput;
