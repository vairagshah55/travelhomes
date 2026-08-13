import React from "react";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepperProps {
  value: number;
  onDecrease: () => void;
  onIncrease: () => void;
  min?: number;
  max?: number;
  // Increment button uses teal-filled variant by default. Pass `outlined` to
  // render both buttons as neutral outlined circles (used in activity/PricingStep).
  outlined?: boolean;
}

const buttonBase =
  "w-[34px] h-[34px] rounded-full border-[1.5px] flex items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-all duration-150 enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-[0.35]";

const Stepper: React.FC<StepperProps> = ({
  value,
  onDecrease,
  onIncrease,
  min = 0,
  max = 99,
  outlined,
}) => (
  <div className="flex items-center gap-3">
    <button
      type="button"
      onClick={onDecrease}
      disabled={value <= min}
      className={cn(
        buttonBase,
        "bg-th-surface-0 border-th-warm-border text-th-text-primary",
        "enabled:hover:border-th-error-bright enabled:hover:text-th-error-bright",
      )}
    >
      <Minus size={14} />
    </button>

    <span
      className={cn(
        "w-9 text-center text-[17px] font-bold tracking-[-0.02em]",
        value > 0 ? "text-th-text-primary" : "text-th-warm-text-muted",
      )}
    >
      {value}
    </span>

    <button
      type="button"
      onClick={onIncrease}
      disabled={value >= max}
      className={cn(
        buttonBase,
        outlined
          ? "bg-th-surface-0 border-th-warm-border text-th-text-primary enabled:hover:border-th-brand enabled:hover:text-th-brand"
          : "bg-th-brand-soft border-th-brand text-th-brand enabled:hover:bg-th-brand enabled:hover:text-th-brand-fg",
      )}
    >
      <Plus size={14} />
    </button>
  </div>
);

export default Stepper;
