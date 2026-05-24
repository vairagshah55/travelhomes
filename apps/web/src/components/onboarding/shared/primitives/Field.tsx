import React from "react";
import { GRAY_500, GRAY_400, GRAY_200, ERROR, SURFACE } from "./tokens";
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
      <label
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: GRAY_500,
          letterSpacing: "0.03em",
          textTransform: "uppercase",
        }}
      >
        {label}
        {required && <span style={{ color: ERROR, marginLeft: 3 }}>*</span>}
      </label>
      {optional && !right && (
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: GRAY_400,
            backgroundColor: SURFACE,
            border: `1px solid ${GRAY_200}`,
            borderRadius: 99,
            padding: "1px 7px",
          }}
        >
          Optional
        </span>
      )}
      {right}
    </div>
    {children}
    {help && <div style={{ fontSize: 11, color: GRAY_400, marginTop: 5 }}>{help}</div>}
    <ErrorMsg message={error} marginTop={2} />
  </div>
);

export default Field;
