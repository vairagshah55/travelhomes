import React from "react";

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
  <div className="bg-th-surface-0 border-[1.5px] border-th-warm-border rounded-[20px] px-[22px] pt-5 pb-[22px] shadow-[0_2px_12px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.03)]">
    <div className={`flex ${action ? "items-start" : "items-center"} justify-between mb-5`}>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-[11px] bg-th-brand-soft border-[1.5px] border-th-brand-border-soft flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div>
          <p className="text-[13px] font-bold text-th-text-primary tracking-[-0.01em]">
            {title}
          </p>
          {subtitle && <p className="text-[11px] text-th-warm-text-muted mt-px">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
    {bodyGap ? <div className="flex flex-col gap-4">{children}</div> : children}
  </div>
);

export default SectionCard;
