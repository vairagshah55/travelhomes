import React from "react";
import { cn } from "@/lib/utils";

interface CharCountProps {
  value: number;
  max: number;
}

/**
 * Deliberately low-priority: plain tabular digits aligned to the label baseline.
 * This used to be a bordered pill, which gave a passive counter the same visual
 * weight as a status badge and cluttered every field header in the flow.
 */
const CharCount: React.FC<CharCountProps> = ({ value, max }) => {
  const pct = value / max;
  const nearLimit = pct >= 0.9;
  return (
    <span
      className={cn(
        "text-[11px] font-medium tabular-nums tracking-[0.01em] transition-colors duration-200",
        nearLimit ? "text-th-warn-bright font-semibold" : "text-th-warm-text-muted",
      )}
    >
      {value}
      <span className="opacity-50">/{max}</span>
    </span>
  );
};

export default CharCount;
