import React from "react";
import {
  BLACK,
  TEAL,
  TEAL_FOCUS,
  WHITE,
  SURFACE,
  ERROR,
  ERROR_RING,
} from "./tokens";

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
}) => {
  const [focused, setFocused] = React.useState(false);
  const active = focused && !error;
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder={placeholder}
      maxLength={maxLength}
      rows={rows}
      style={{
        width: "100%",
        padding: "14px 16px",
        fontSize: 14.5,
        color: BLACK,
        backgroundColor: focused ? WHITE : SURFACE,
        border: `1.5px solid ${error ? ERROR : focused ? TEAL : "transparent"}`,
        borderRadius: 13,
        outline: "none",
        resize: "none",
        boxShadow: active
          ? `0 0 0 4px ${TEAL_FOCUS}, 0 1px 4px rgba(0,0,0,0.06)`
          : error
            ? `0 0 0 3px ${ERROR_RING}`
            : "none",
        transition: "background-color 0.15s, border-color 0.15s, box-shadow 0.2s",
        lineHeight: 1.65,
        fontWeight: 450,
        letterSpacing: "-0.005em",
      }}
    />
  );
};

export default StyledTextarea;
