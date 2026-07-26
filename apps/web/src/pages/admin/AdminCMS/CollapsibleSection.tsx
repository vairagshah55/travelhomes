import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface CollapsibleSectionProps {
  title: string;
  children?: React.ReactNode;
  defaultExpanded?: boolean;
  isActive?: boolean;
  showToggle?: boolean;
  onToggleStatus?: (e: React.MouseEvent) => void;
  isSectionActive?: boolean;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  defaultExpanded = false,
  isActive = false,
  showToggle = false,
  onToggleStatus,
  isSectionActive = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  // Sections used purely as a visibility switch have no body — don't offer
  // (or hint at) an expand affordance that does nothing.
  const expandable = Boolean(children);

  return (
    <div
      className={`border border-dashboard-stroke rounded-xl bg-white ${
        isActive ? "border-dashboard-primary bg-dashboard-primary/[0.12]" : ""
      }`}
    >
      <div
        className={`flex items-center justify-between p-4 ${expandable ? "cursor-pointer" : ""}`}
        onClick={expandable ? () => setIsExpanded((prev) => !prev) : undefined}
      >
        <h3 className="text-dashboard-title font-plus-jakarta text-sm font-bold">{title}</h3>
        <div className="flex items-center gap-3">
          {showToggle && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleStatus?.(e);
              }}
              aria-label={`${isSectionActive ? "Hide" : "Show"} ${title}`}
              className={`w-9 h-5 rounded-full transition-colors relative ${
                isSectionActive ? "bg-dashboard-blue-600" : "bg-gray-300"
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full shadow transition-transform absolute top-0.5 ${
                  isSectionActive ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </button>
          )}
          {expandable &&
            (isExpanded ? (
              <ChevronUp size={18} className="text-dashboard-body" />
            ) : (
              <ChevronDown size={18} className="text-dashboard-body" />
            ))}
        </div>
      </div>
      {isExpanded && expandable && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
};

export default CollapsibleSection;
