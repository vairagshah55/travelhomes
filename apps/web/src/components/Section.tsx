import React from "react";

function Section({
  title,
  subtitle,
  children,
  className = "",
  rightContent,
  sectionId,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  rightContent?: React.ReactNode;
  sectionId?: string;
}) {
  return (
    <section className={`scroll-mt-24 ${className}`} data-section-id={sectionId}>
      <div className="max-md:px-3 flex flex-col md:flex-row justify-between items-start md:items-end mb-5 md:mb-6 gap-2 md:gap-3">
        <div className="space-y-0.5">
          <h2 className="text-[22px] md:text-[26px] font-semibold text-[#222222] tracking-tight leading-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[#717171] text-[14px] md:text-[15px] leading-snug">
              {subtitle}
            </p>
          )}
        </div>
        {rightContent && <div className="flex-shrink-0">{rightContent}</div>}
      </div>
      {children}
    </section>
  );
}

export default Section;
