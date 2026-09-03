import React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { inputSurfaceClass, inputFocusClass } from "./StyledInput";

interface TimeInputProps {
  /** 24-hour `"HH:mm"` — what `<input type="time">` emits and what we store. */
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
  id?: string;
  disabled?: boolean;
  /** Earliest selectable time, `"HH:mm"`. */
  min?: string;
  /** Latest selectable time, `"HH:mm"`. */
  max?: string;
}

/**
 * A time of day.
 *
 * Native `<input type="time">` rather than a hand-rolled picker: it brings the
 * platform's own clock UI, the 12/24-hour display follows the device locale
 * while the value stays a stable 24-hour `"HH:mm"`, and it is keyboard- and
 * screen-reader-accessible for free. The same reasoning as the `type="date"`
 * inputs in `VehicleComplianceStep` — this flow has no picker library and
 * should not gain one for two fields.
 *
 * Styling is `StyledInput`'s surface and focus classes, imported rather than
 * copied, so the affordance ladder (white + grey border → teal border → teal +
 * ring) and the error treatment stay identical across every input in the flow.
 * The clock glyph sits inside the field on the left, matching `IconInput`.
 */
const TimeInput: React.FC<TimeInputProps> = ({
  value,
  onChange,
  error,
  id,
  disabled,
  min,
  max,
}) => (
  <div className="relative">
    <span
      aria-hidden="true"
      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-th-warm-text-muted"
    >
      <Clock size={15} />
    </span>
    <input
      id={id}
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      min={min}
      max={max}
      className={cn(
        "w-full h-[54px] pl-[42px] pr-3 rounded-[12px] outline-none font-normal tracking-[-0.005em]",
        "text-[15px] text-th-text-primary",
        inputSurfaceClass,
        !error && inputFocusClass,
        error &&
          cn(
            "border-th-error-bright-soft",
            "focus:border-th-error-bright focus:shadow-[0_0_0_3px_var(--th-error-bright-ring)]",
          ),
        disabled && "opacity-60 cursor-not-allowed",
      )}
    />
  </div>
);

export default TimeInput;
