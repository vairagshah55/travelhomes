import React from "react";

interface StepHeaderProps {
  kicker: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  extra?: React.ReactNode;
}

const StepHeader: React.FC<StepHeaderProps> = ({ kicker, title, subtitle, extra }) => (
  <div className="text-center space-y-2 pb-1">
    <div className="flex items-center justify-center gap-2.5 mb-3">
      <div className="w-6 h-[3px] rounded-full bg-th-brand" />
      <span className="text-[10.5px] font-bold tracking-[0.13em] uppercase text-th-warm-text-muted">
        {kicker}
      </span>
      <div className="w-6 h-[3px] rounded-full bg-th-brand" />
    </div>
    <h1 className="font-serif text-[clamp(24px,3.6vw,32px)] font-normal text-[#0A4670] tracking-[-0.015em] leading-[1.15]">
      {title}
    </h1>
    {subtitle && (
      <p className="text-sm text-th-warm-text-dark leading-[1.6]">{subtitle}</p>
    )}
    {extra}
  </div>
);

export default StepHeader;
