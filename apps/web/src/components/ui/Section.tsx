import React from 'react'

function Section({
  title,
  subtitle,
  children,
  className = "",
  rightContent,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  rightContent?: React.ReactNode;
}) {
  return (
    <section className={`px-4 md:px-20 ${className}`}>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
        <div className="space-y-2">
          <h2 className="text-xl md:text-4xl font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
          {subtitle && (
            <p className="text-gray-600 dark:text-gray-300">{subtitle}</p>
          )}
        </div>
        {rightContent && <div className="flex-shrink-0">{rightContent}</div>}
      </div>
      {children}
    </section>
  );
}

export default Section
