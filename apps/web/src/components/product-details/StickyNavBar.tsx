import React from "react";
import { motion } from "framer-motion";

export interface NavTab {
  id: string;
  label: string;
}

interface StickyNavBarProps {
  tabs: NavTab[];
  activeTab: string;
  setActiveTab: (id: string) => void;
  /** Unique layoutId namespace so multiple instances don't share the same motion indicator. */
  layoutIdPrefix?: string;
}

/**
 * Sticky section nav bar shown on product detail pages. Clicking a tab scrolls
 * the page to the section with that DOM id. The active tab is highlighted with
 * a sliding motion underline.
 */
export function StickyNavBar({
  tabs,
  activeTab,
  setActiveTab,
  layoutIdPrefix = "details-tab",
}: StickyNavBarProps) {
  return (
    <div className="sticky top-[72px] z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm mb-8">
      <div className="flex overflow-x-auto scrollbar-hide gap-1 relative">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              const el = document.getElementById(tab.id);
              if (el) {
                const y = el.getBoundingClientRect().top + window.scrollY - 130;
                window.scrollTo({ top: y, behavior: "smooth" });
              }
            }}
            className={`relative px-4 sm:px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
              activeTab === tab.id
                ? "text-gray-900 dark:text-white"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <motion.div
                layoutId={`${layoutIdPrefix}-indicator`}
                className="absolute bottom-0 left-2 right-2 h-0.5 bg-gray-900 dark:bg-white rounded-full"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </button>
        ))}
      </div>
      <div className="h-px bg-gray-200 dark:bg-gray-700" />
    </div>
  );
}

export default StickyNavBar;
