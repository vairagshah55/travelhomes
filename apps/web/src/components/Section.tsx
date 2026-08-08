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
      {/* No extra mobile inset here: the page container already supplies the
          16px gutter, and the card rails bleed to it. An extra max-md:px-3
          left the heading 12px out of line with the cards below it. */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-4 md:mb-6 lg:short:mb-3 gap-2 md:gap-3">
        <div className="space-y-0.5 min-w-0">
          <h2 className="text-[20px] md:text-[26px] font-semibold text-[#0a1c1c] tracking-tight leading-tight text-balance">
            {title}
          </h2>
          {subtitle && (
            <p className="text-[#717171] text-[13px] md:text-[15px] leading-snug">{subtitle}</p>
          )}
        </div>
        {rightContent && <div className="flex-shrink-0">{rightContent}</div>}
      </div>
      {children}
    </section>
  );
}

export default Section;
