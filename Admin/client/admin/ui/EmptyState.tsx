import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center mb-4">
        <Icon size={28} className="text-gray-400" />
      </div>
      <p className="text-sm font-medium text-gray-900 mb-1.5">{title}</p>
      <p className="text-xs text-gray-500 max-w-xs leading-relaxed mb-5">{description}</p>
      <div className="flex items-center gap-2">
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="px-4 py-2 text-xs bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
          >
            {actionLabel}
          </button>
        )}
        {secondaryLabel && onSecondary && (
          <button
            onClick={onSecondary}
            className="px-4 py-2 text-xs text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {secondaryLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export default EmptyState;
