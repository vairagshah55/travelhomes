import React from "react";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  className?: string;
}

/**
 * Primary CTA uses `bg-brand` — auto-themes per route group.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
  className = "",
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-14 px-6 ${className}`}>
      <div className="w-14 h-14 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center mb-4">
        <Icon size={24} strokeWidth={1.6} className="text-gray-400 dark:text-gray-500" />
      </div>
      <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1.5">{title}</h3>
      {description && (
        <p className="text-[13px] text-gray-500 dark:text-gray-400 max-w-md mb-5 leading-relaxed">
          {description}
        </p>
      )}
      {(actionLabel || secondaryLabel) && (
        <div className="flex items-center gap-2">
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className="bg-brand hover:bg-brand-hover text-brand-fg rounded-full px-5 h-9 text-[13px] font-semibold transition-colors duration-150 shadow-sm hover:shadow-md"
            >
              {actionLabel}
            </button>
          )}
          {secondaryLabel && onSecondary && (
            <button
              onClick={onSecondary}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#14709F] rounded-full px-5 h-9 text-[13px] font-semibold transition-colors duration-150"
            >
              {secondaryLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default EmptyState;
