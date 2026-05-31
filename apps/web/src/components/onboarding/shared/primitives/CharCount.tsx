import React from "react";
import { cn } from "@/lib/utils";

interface CharCountProps {
  value: number;
  max: number;
}

const CharCount: React.FC<CharCountProps> = ({ value, max }) => {
  const pct = value / max;
  const tone = pct >= 0.9 ? "danger" : pct >= 0.7 ? "warn" : "normal";
  return (
    <span
      className={cn(
        "text-[11px] font-semibold rounded-full px-2 py-0.5 border-[1px] transition-all duration-200",
        tone === "danger" && "text-th-warn-bright bg-th-warn-bright-bg border-th-warn-bright-border",
        tone === "warn" && "text-th-warm-text-dark bg-th-warm-surface border-th-warm-border",
        tone === "normal" && "text-th-warm-text-muted bg-th-warm-surface border-th-warm-border",
      )}
    >
      {value}/{max}
    </span>
  );
};

export default CharCount;
