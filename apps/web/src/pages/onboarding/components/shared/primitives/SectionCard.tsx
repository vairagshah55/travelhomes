import React from "react";
import { WHITE, TEAL_BG, TEAL_BORDER, BLACK, GRAY_400, GRAY_200 } from "./tokens";

interface SectionCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  // Whether the card's body is rendered with a default vertical-gap wrapper.
  // Used by shared/* steps which historically wrap children in `flex flex-col gap-4`.
  bodyGap?: boolean;
}

const SectionCard: React.FC<SectionCardProps> = ({
  icon,
  title,
  subtitle,
  action,
  children,
  bodyGap,
}) => (
  <div
    style={{
      backgroundColor: WHITE,
      border: `1.5px solid ${GRAY_200}`,
      borderRadius: 20,
      padding: "20px 22px 22px",
      boxShadow: "0 2px 12px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)",
    }}
  >
    <div className={`flex ${action ? "items-start" : "items-center"} justify-between mb-5`}>
      <div className="flex items-center gap-3">
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 11,
            backgroundColor: TEAL_BG,
            border: `1.5px solid ${TEAL_BORDER}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: BLACK, letterSpacing: "-0.01em" }}>
            {title}
          </p>
          {subtitle && <p style={{ fontSize: 11, color: GRAY_400, marginTop: 1 }}>{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
    {bodyGap ? <div className="flex flex-col gap-4">{children}</div> : children}
  </div>
);

export default SectionCard;
