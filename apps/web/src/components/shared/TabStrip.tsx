import React from "react";

interface Tab {
  key: string;
  label: string;
  count?: number;
}

interface TabStripProps {
  tabs: Tab[];
  activeKey: string;
  onChange: (key: string) => void;
  className?: string;
}

/**
 * Tabbed strip with underline indicator. Active state uses `text-brand`
 * so it resolves to coral on Frontend routes and admin-blue on /admin/*.
 */
export function TabStrip({ tabs, activeKey, onChange, className = "" }: TabStripProps) {
  return (
    <div
      role="tablist"
      className={`flex items-center gap-1 border-b border-gray-200 dark:border-gray-800 overflow-x-auto scrollbar-hide ${className}`}
    >
      {tabs.map((tab) => {
        const active = tab.key === activeKey;
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.key)}
            className={`relative flex items-center gap-2 px-3.5 py-2.5 text-[13px] font-semibold whitespace-nowrap transition-colors duration-150 ${
              active
                ? "text-brand"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            <span>{tab.label}</span>
            {typeof tab.count === "number" && (
              <span
                className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold ${
                  active
                    ? "bg-brand/10 text-brand"
                    : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                }`}
              >
                {tab.count}
              </span>
            )}
            {active && (
              <span className="absolute left-0 right-0 -bottom-px h-0.5 bg-brand rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
}

export default TabStrip;
