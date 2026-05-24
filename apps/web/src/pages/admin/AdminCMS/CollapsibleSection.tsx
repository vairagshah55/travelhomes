import React, { useState } from "react";

interface CollapsibleSectionProps {
  title: string;
  children?: React.ReactNode;
  defaultExpanded?: boolean;
  hasContent?: boolean;
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

  const handleToggle = () => {
    setIsExpanded((prev) => !prev);
  };

  return (
    <div
      className={`border border-dashboard-stroke rounded-xl bg-white ${isActive ? "border-dashboard-primary bg-dashboard-primary/[0.12]" : ""}`}
    >
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={handleToggle}
      >
        <h3 className="text-dashboard-title font-plus-jakarta text-sm font-bold">
          {title}
        </h3>
        <div className="flex items-center gap-3">
          {showToggle && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleStatus?.(e);
              }}
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
          <div className="flex flex-col items-center gap-0.5" />
        </div>
      </div>
      {isExpanded && children && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
};

export default CollapsibleSection;
