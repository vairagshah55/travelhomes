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
  children: React.ReactNode;
}

const Field: React.FC<FieldProps> = ({
  label,
  required,
  optional,
  error,
  right,
  help,
  children,
}) => (
  <div className="flex flex-col gap-1.5">
    <div className={`flex items-center ${right ? "justify-between" : "gap-2"} mb-0.5`}>
      <label className="text-xs font-semibold text-th-warm-text-dark tracking-[0.03em] uppercase">
        {label}
        {required && <span className="text-th-error-bright ml-[3px]">*</span>}
      </label>
      {optional && !right && (
        <span className="text-[10px] font-semibold text-th-warm-text-muted bg-th-warm-surface border border-th-warm-border rounded-full px-[7px] py-px">
          Optional
        </span>
      )}
      {right}
    </div>
    {children}
    {help && <div className="text-[11px] text-th-warm-text-muted mt-[5px]">{help}</div>}
    <ErrorMsg message={error} marginTop={2} />
  </div>
);

export default Field;
