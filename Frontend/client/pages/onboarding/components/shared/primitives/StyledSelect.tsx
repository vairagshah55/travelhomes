import React from "react";
import {
  BLACK,
  TEAL,
  TEAL_FOCUS,
  WHITE,
  SURFACE,
  ERROR_SOFT,
  ERROR_BG,
  ERROR_RING,
  GRAY_400,
} from "./tokens";

interface StyledSelectProps {
  value: string;
  onChange?: (v: string) => void;
  disabled?: boolean;
  error?: boolean;
  children: React.ReactNode;
}

const StyledSelect: React.FC<StyledSelectProps> = ({
  value,
  onChange,
  disabled,
  error,
  children,
}) => {
  const [focused, setFocused] = React.useState(false);
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        disabled={disabled}
        style={{
          width: "100%",
          height: 52,
          padding: "0 40px 0 16px",
          fontSize: 14,
          color: value ? (disabled ? GRAY_400 : BLACK) : GRAY_400,
          backgroundColor: disabled ? SURFACE : error ? ERROR_BG : focused ? WHITE : SURFACE,
          border: `1.5px solid ${error ? ERROR_SOFT : focused ? TEAL : "transparent"}`,
          borderRadius: 13,
          outline: "none",
          appearance: "none",
          boxShadow:
            focused && !error
              ? `0 0 0 4px ${TEAL_FOCUS}, 0 1px 4px rgba(0,0,0,0.06)`
              : error
                ? `0 0 0 3px ${ERROR_RING}`
                : "none",
          transition: "background-color 0.15s, border-color 0.15s, box-shadow 0.2s",
          cursor: disabled ? "not-allowed" : "pointer",
          fontWeight: 450,
        }}
      >
        {children}
      </select>
      <svg
        style={{
          position: "absolute",
          right: 14,
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
        }}
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
      >
        <path
          d="M4 6l4 4 4-4"
          stroke={GRAY_400}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

export default StyledSelect;
