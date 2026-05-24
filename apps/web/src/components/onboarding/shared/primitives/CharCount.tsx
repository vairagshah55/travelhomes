import React from "react";
import {
  GRAY_500,
  GRAY_400,
  GRAY_200,
  SURFACE,
  WARN,
  WARN_BG,
  WARN_BORDER,
} from "./tokens";

interface CharCountProps {
  value: number;
  max: number;
}

const CharCount: React.FC<CharCountProps> = ({ value, max }) => {
  const pct = value / max;
  const color = pct >= 0.9 ? WARN : pct >= 0.7 ? GRAY_500 : GRAY_400;
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        color,
        backgroundColor: pct >= 0.9 ? WARN_BG : SURFACE,
        borderRadius: 99,
        padding: "2px 8px",
        border: `1px solid ${pct >= 0.9 ? WARN_BORDER : GRAY_200}`,
        transition: "all 0.2s",
      }}
    >
      {value}/{max}
    </span>
  );
};

export default CharCount;
