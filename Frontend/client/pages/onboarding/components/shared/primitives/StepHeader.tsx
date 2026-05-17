import React from "react";
import { TEAL, NAVY, GRAY_400, GRAY_500 } from "./tokens";

interface StepHeaderProps {
  kicker: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  extra?: React.ReactNode;
}

const StepHeader: React.FC<StepHeaderProps> = ({ kicker, title, subtitle, extra }) => (
  <div className="text-center space-y-2 pb-1">
    <div className="flex items-center justify-center gap-2.5 mb-3">
      <div style={{ width: 24, height: 3, borderRadius: 99, backgroundColor: TEAL }} />
      <span
        style={{
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: "0.13em",
          textTransform: "uppercase",
          color: GRAY_400,
        }}
      >
        {kicker}
      </span>
      <div style={{ width: 24, height: 3, borderRadius: 99, backgroundColor: TEAL }} />
    </div>
    <h1
      className="font-serif"
      style={{
        fontSize: "clamp(24px, 3.6vw, 32px)",
        fontWeight: 400,
        color: NAVY,
        letterSpacing: "-0.015em",
        lineHeight: 1.15,
      }}
    >
      {title}
    </h1>
    {subtitle && (
      <p style={{ fontSize: 14, color: GRAY_500, lineHeight: 1.6 }}>{subtitle}</p>
    )}
    {extra}
  </div>
);

export default StepHeader;
