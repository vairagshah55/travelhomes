import React from "react";
import ErrorMsg from "./ErrorMsg";

interface FieldProps {
  label: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
  // Trailing content rendered on the right of the label (e.g. CharCount).
  right?: React.ReactNode;
  // Helper text shown below the input.
  help?: React.ReactNode;
  // Associates the label with its control. Optional because most call sites
  // render uncontrolled primitives that don't yet accept an id — pass it where
  // the child does so screen readers announce the label on focus.
  htmlFor?: string;
  children: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({
  label,
  required,
  optional,
  error,
  right,
  help,
  htmlFor,
  children,
}) => (
  <div className="flex flex-col gap-2">
    <div className={`flex items-baseline ${right ? "justify-between" : "gap-2"} gap-3`}>
      <label
        htmlFor={htmlFor}
        /* Sentence case, as written. This used to force `uppercase`, which
           overrode every label in the app: "Fuel policy" rendered as FUEL
           POLICY and "Per km" as PER KM, so no amount of fixing the source
           strings changed what a vendor actually read. Size and weight are
           bumped a little to hold the hierarchy the shouting used to. */
        className="text-[12.5px] font-semibold text-th-warm-text-dark tracking-[0.01em]"
      >
        {label}
        {required && (
          <>
            <span aria-hidden="true" className="text-th-error-bright ml-[3px]">
              *
            </span>
            {/* The asterisk alone is colour-only signalling; this keeps the
                requirement audible to screen readers. */}
            <span className="sr-only"> (required)</span>
          </>
        )}
      </label>
      {optional && !right && (
        <span className="text-[10.5px] font-medium text-th-warm-text-muted tracking-[0.01em]">
          Optional
        </span>
      )}
      {right}
    </div>
    {children}
    {help && (
      <div className="text-[12px] leading-[1.55] text-[color:var(--onb-text-secondary,#657477)]">
        {help}
      </div>
    )}
    <ErrorMsg message={error} marginTop={0} />
  </div>
);

export default Field;
