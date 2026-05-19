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

export function TabStrip({ tabs, activeKey, onChange, className = "" }: TabStripProps) {
  return (
    <div className={`flex border-b border-gray-200 overflow-x-auto scrollbar-hide ${className}`}>
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`
              relative px-4 py-2.5 text-xs font-medium whitespace-nowrap cursor-pointer
              select-none transition-colors duration-150
              ${isActive ? "text-brand-600" : "text-gray-500 hover:text-gray-800"}
            `}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`
                ml-1.5 text-[10px] px-1.5 py-0.5 rounded-full
                ${isActive
                  ? "bg-brand-100 text-brand-700"
                  : "bg-gray-100 text-gray-500"
                }
              `}>
                {tab.count}
              </span>
            )}
            {isActive && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 rounded-t" />
            )}
          </button>
        );
      })}
    </div>
  );
}

export default TabStrip;
