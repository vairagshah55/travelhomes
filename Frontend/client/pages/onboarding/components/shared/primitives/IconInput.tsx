import React from "react";
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
        backgroundColor: error ? ERROR_BG : focused ? WHITE : SURFACE,
        boxShadow:
          focused && !error
            ? `0 0 0 4px ${TEAL_FOCUS}, 0 1px 4px rgba(0,0,0,0.06)`
            : error
              ? `0 0 0 3px ${ERROR_RING}`
              : "none",
        transition: "all 0.15s",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          height: 52,
          borderRight: `1.5px solid ${focused ? TEAL_BORDER : GRAY_200}`,
          backgroundColor: focused ? TEAL_BG : SURFACE,
          flexShrink: 0,
          transition: "all 0.15s",
        }}
      >
        <span style={{ color: focused ? TEAL : GRAY_400 }}>{icon}</span>
      </div>
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
          flex: 1,
          height: 52,
          padding: "0 14px",
          fontSize: 14,
          color: value ? BLACK : GRAY_400,
          backgroundColor: "transparent",
          border: "none",
          outline: "none",
          fontWeight: 450,
          letterSpacing: mono ? "0.08em" : "-0.005em",
          fontFamily: mono ? "monospace" : "inherit",
        }}
      />
      {suffix}
    </div>
  );
};

export default IconInput;
