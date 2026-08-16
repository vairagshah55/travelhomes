import React from "react";
import { motion } from "framer-motion";

interface Tab {
  key: string;
  label: string;
  count?: number;
}

interface TabStripProps {
  tabs: Tab[];
  activeKey: string;
  onChange: (key: string) => void;
  /**
   * "flush" drops the strip's own bottom border, for when it sits on the
   * bottom edge of a page-header band that already draws one — two hairlines a
   * pixel apart read as a rendering bug.
   */
  variant?: "default" | "flush";
  className?: string;
}

/**
 * Tabbed strip with an underline indicator. Active state uses `text-brand`, so
 * it resolves per route group — cyan on the public/vendor side, blue inside the
 * admin shell.
 *
 * The indicator is a single shared element animated by `layoutId`, so switching
 * tabs slides one underline rather than cross-fading two. Each strip needs its
 * own id — two strips sharing one would animate the bar between them across the
 * page — so the id is derived from the tab keys.
 */
export function TabStrip({
  tabs,
  activeKey,
  onChange,
  variant = "default",
  className = "",
}: TabStripProps) {
  const indicatorId = React.useMemo(() => `tabstrip-${tabs.map((t) => t.key).join("-")}`, [tabs]);

  return (
    <div
      role="tablist"
      className={`flex items-center gap-0.5 overflow-x-auto scrollbar-hide ${
        variant === "flush" ? "" : "border-b border-border"
      } ${className}`}
    >
      {tabs.map((tab) => {
        const active = tab.key === activeKey;
        return (
          <button
            key={tab.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.key)}
            className={`relative flex items-center gap-2 px-3.5 py-2.5 text-[13px] font-semibold whitespace-nowrap
              rounded-t-lg transition-colors duration-150 outline-none
              focus-visible:ring-4 focus-visible:ring-brand/20 ${
                active
                  ? "text-brand"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              }`}
          >
            <span>{tab.label}</span>
            {typeof tab.count === "number" && (
              <span
                className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold tabular-nums transition-colors ${
                  active ? "bg-brand/10 text-brand" : "bg-muted text-muted-foreground"
                }`}
              >
                {tab.count}
              </span>
            )}
            {active && (
              <motion.span
                layoutId={indicatorId}
                transition={{ type: "spring", stiffness: 520, damping: 42 }}
                className="absolute left-2 right-2 -bottom-px h-[2px] bg-brand rounded-full"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

export default TabStrip;
