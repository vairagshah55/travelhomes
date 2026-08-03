import React from "react";
import { cn, getImageUrl } from "@/lib/utils";

interface ActivityType {
  id: string;
  name: string;
  icon: string;
}

interface TypeStepProps {
  selectedActivities: string[];
  activityTypes: ActivityType[];
  onToggle: (id: string) => void;
}

const TypeStep: React.FC<TypeStepProps> = ({ selectedActivities, activityTypes, onToggle }) => {
  const selectedCount = selectedActivities.length;

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-2xl">
      {/* ── Header ── */}
      <div className="text-center space-y-2 pb-1">
        <div className="flex items-center justify-center gap-2.5 mb-3">
          <div className="w-6 h-[3px] rounded-full bg-th-brand" />
          <span className="text-[10.5px] font-bold tracking-[0.13em] uppercase text-th-warm-text-muted">
            Activity Types
          </span>
          <div className="w-6 h-[3px] rounded-full bg-th-brand" />
        </div>
        <h1 className="font-serif text-[clamp(24px,3.6vw,32px)] font-normal text-[#0d4548] tracking-[-0.015em] leading-[1.15]">
          Types of Activity
        </h1>
        <p className="text-[14px] text-th-warm-text-dark leading-[1.6]">
          Select all activity types that apply to your listing.
        </p>
      </div>

      {/* ── Activity grid ── */}
      <div className="w-full bg-th-surface-0 border-[1.5px] border-th-warm-border rounded-[20px] px-[22px] py-5 shadow-[0_2px_12px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.03)]">
        {/* Selected count badge */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-[12px] font-bold text-th-warm-text-dark uppercase tracking-[0.03em]">
            Activities
          </p>
          {selectedCount > 0 && (
            <span className="text-[11px] font-bold text-th-brand bg-th-brand-soft border border-th-brand-border-soft rounded-full px-[10px] py-[2px]">
              {selectedCount} selected
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2.5">
          {activityTypes.map((activity) => {
            const selected = selectedActivities.includes(activity.id);
            return (
              <button
                key={activity.id}
                type="button"
                onClick={() => onToggle(activity.id)}
                className={cn(
                  "flex items-center gap-2 px-[14px] py-2 rounded-full border-[1.5px] cursor-pointer transition-all duration-150",
                  selected
                    ? "border-th-brand bg-th-brand-soft shadow-[0_0_0_3px_rgba(59, 217, 218, 0.4)] text-th-brand"
                    : "border-th-warm-border bg-th-warm-surface text-th-warm-text-dark hover:border-th-brand hover:bg-th-brand-soft",
                )}
              >
                <span
                  className={cn(
                    "w-5 h-5 flex items-center justify-center flex-shrink-0 transition-opacity duration-150",
                    selected ? "opacity-100" : "opacity-70",
                  )}
                >
                  <img
                    src={getImageUrl(activity.icon)}
                    alt={activity.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                </span>
                <span className="text-[13px] font-semibold tracking-[-0.01em]">
                  {activity.name}
                </span>
              </button>
            );
          })}
        </div>

        {activityTypes.length === 0 && (
          <p className="text-[13px] text-th-warm-text-muted text-center py-5">
            No activity types available.
          </p>
        )}
      </div>
    </div>
  );
};

export default TypeStep;
