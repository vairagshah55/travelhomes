import React from "react";
import { ChevronDown } from "lucide-react";
import {
  BLACK,
  TEAL,
  TEAL_BG,
  TEAL_BORDER,
  TEAL_FOCUS,
  WHITE,
  SURFACE,
  ERROR_SOFT,
  ERROR_BG,
  ERROR_RING,
  GRAY_400,
  GRAY_200,
} from "./tokens";

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
}) => {
  const [focused, setFocused] = React.useState(false);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        borderRadius: 13,
        overflow: "hidden",
        border: `1.5px solid ${error ? ERROR_SOFT : focused ? TEAL : "transparent"}`,
        backgroundColor: disabled ? SURFACE : error ? ERROR_BG : focused ? WHITE : SURFACE,
        boxShadow:
          focused && !error
            ? `0 0 0 4px ${TEAL_FOCUS}, 0 1px 4px rgba(0,0,0,0.06)`
            : error
              ? `0 0 0 3px ${ERROR_RING}`
              : "none",
        transition: "all 0.15s",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          height: 52,
          borderRight: `1.5px solid ${focused ? TEAL_BORDER : GRAY_200}`,
          backgroundColor: focused && !disabled ? TEAL_BG : SURFACE,
          flexShrink: 0,
          transition: "all 0.15s",
        }}
      >
        <span style={{ color: focused && !disabled ? TEAL : GRAY_400 }}>{icon}</span>
      </div>
      <div style={{ position: "relative", flex: 1 }}>
        <select
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          disabled={disabled}
          style={{
            width: "100%",
            height: 52,
            padding: "0 36px 0 14px",
            fontSize: 14,
            color: value ? (disabled ? GRAY_400 : BLACK) : GRAY_400,
            backgroundColor: "transparent",
            border: "none",
            outline: "none",
            appearance: "none",
            cursor: disabled ? "not-allowed" : "pointer",
            fontWeight: 450,
          }}
        >
          {children}
        </select>
        <ChevronDown
          size={15}
          style={{
            position: "absolute",
            right: 12,
            top: "50%",
            transform: "translateY(-50%)",
            pointerEvents: "none",
            color: GRAY_400,
          }}
        />
      </div>
    </div>
  );
};

export default IconSelect;
