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
    <section className={`md:px-2 lg:px-4 scroll-mt-24 ${className}`} data-section-id={sectionId}>
      <div className="max-md:px-3 flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-3">
        <div className="space-y-1">
          <h2 className="text-2xl md:text-[28px] font-semibold text-gray-900 dark:text-white tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base">
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
