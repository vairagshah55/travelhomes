import React from "react";
import { Shield } from "lucide-react";

interface InclusionsSectionProps {
  items: string[];
}

/**
 * Emerald-tinted "Inclusions" panel. Renders the list joined by newlines
 * (whitespace-pre-line preserves them).
 */
export function InclusionsSection({ items }: InclusionsSectionProps) {
  if (items.length === 0) return null;
  return (
    <div id="inclusions" className="scroll-mt-36">
      <div className="h-px bg-gray-100 dark:bg-gray-800 mb-8" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Inclusions</h3>
      <div className="rounded-2xl border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/30 dark:bg-emerald-950/10 p-5">
        <div className="text-sm text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-line">
          {items.join("\n")}
        </div>
      </div>
    </div>
  );
}

interface ExclusionsSectionProps {
  items: string[];
}

/** Grey-tinted "Exclusions" panel. */
export function ExclusionsSection({ items }: ExclusionsSectionProps) {
  if (items.length === 0) return null;
  return (
    <div id="exclusions" className="scroll-mt-36">
      <div className="h-px bg-gray-100 dark:bg-gray-800 mb-8" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Exclusions</h3>
      <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 p-5">
        <div className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed whitespace-pre-line">
          {items.join("\n")}
        </div>
      </div>
    </div>
  );
}

interface HouseRulesSectionProps {
  rules: string[];
  /** UniqueStay uses gap-2, CamperVan uses gap-2.5 — passed through for visual parity. */
  headerGap?: "tight" | "normal";
}

/** Numbered list of house rules with a Shield icon header. */
export function HouseRulesSection({ rules, headerGap = "tight" }: HouseRulesSectionProps) {
  if (rules.length === 0) return null;
  const gapClass = headerGap === "normal" ? "gap-2.5" : "gap-2";
  return (
    <div id="policies" className="scroll-mt-36">
      <div className="h-px bg-gray-100 dark:bg-gray-800 mb-8" />
      <div className={`flex items-center ${gapClass} mb-5`}>
        <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">House Rules</h3>
      </div>
      <div className="rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        {rules.map((rule, i) => (
          <div
            key={i}
            className={`flex items-center gap-4 px-5 py-4 ${
              i !== rules.length - 1 ? "border-b border-gray-50 dark:border-gray-700/50" : ""
            } hover:bg-gray-50 dark:hover:bg-[#128086]/30 transition-colors`}
          >
            <span className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-400 flex-shrink-0">
              {i + 1}
            </span>
            <span className="text-sm text-gray-700 dark:text-gray-300">{rule}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
