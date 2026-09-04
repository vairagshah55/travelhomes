import React from "react";
import { Field, RulesList, StyledInput, StyledSelect, StyledTextarea } from "./ui";
import { cn } from "@/lib/utils";
import type { FieldSpec } from "@/lib/offeringFields";

/**
 * Renders registry fields on the vendor wizards.
 *
 * The vendor create and edit pages are hand-built out of the onboarding step
 * components, and each one collects a curated slice of the listing. Everything
 * else on the `Offer` used to have no input at all on those screens — a vendor
 * could not set a stay's room counts on /offering/add, or its check-in times,
 * because nobody had written the JSX twice.
 *
 * `vendorFieldsFor()` returns that remainder and this renders it, using the same
 * primitives the surrounding steps use so it does not read as a bolted-on
 * section. Nothing here is marked required: the wizards' own step validation is
 * unchanged, and these are the fields it never gated on.
 */

const ToggleRow: React.FC<{
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}> = ({ label, checked, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={cn(
      "flex items-center justify-between w-full h-12 px-4 rounded-[13px] border-[1.5px] cursor-pointer",
      "text-[14px] font-[450] text-left transition-all duration-150",
      checked
        ? "bg-th-surface-0 border-th-brand text-th-text-primary"
        : "bg-th-warm-surface border-transparent text-th-warm-text-muted",
    )}
  >
    <span>{label}</span>
    <span
      className={cn(
        "relative w-9 h-5 rounded-full transition-colors duration-150 shrink-0",
        checked ? "bg-th-brand" : "bg-th-warm-border",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-150",
          checked && "translate-x-4",
        )}
      />
    </span>
  </button>
);

export interface RegistryFieldsProps {
  fields: FieldSpec[];
  values: Record<string, any>;
  onChange: (name: string, value: any) => void;
  errors?: Record<string, string>;
}

export const RegistryFields: React.FC<RegistryFieldsProps> = ({
  fields,
  values,
  onChange,
  errors = {},
}) => {
  if (fields.length === 0) return null;

  const renderControl = (f: FieldSpec) => {
    const raw = values[f.name];
    const error = !!errors[f.name];

    switch (f.control) {
      case "switch":
        return <ToggleRow label={f.label} checked={!!raw} onChange={(v) => onChange(f.name, v)} />;

      case "tags":
        /* Held as an array everywhere else on the form, so a value containing a
           comma survives the round trip that a comma-separated string loses. */
        return (
          <RulesList
            rules={Array.isArray(raw) ? raw : raw ? String(raw).split(",") : []}
            onChange={(i, v) => {
              const next = [...(Array.isArray(raw) ? raw : [])];
              next[i] = v;
              onChange(f.name, next);
            }}
            onAdd={() => onChange(f.name, [...(Array.isArray(raw) ? raw : []), ""])}
            onRemove={(i) =>
              onChange(
                f.name,
                (Array.isArray(raw) ? raw : []).filter((_: string, idx: number) => idx !== i),
              )
            }
          />
        );

      case "textarea":
        return (
          <StyledTextarea
            value={raw ?? ""}
            onChange={(v) => onChange(f.name, v)}
            placeholder={f.placeholder}
            error={error}
          />
        );

      case "select":
        return (
          <StyledSelect
            value={raw ?? ""}
            onChange={(v) => onChange(f.name, v)}
            placeholder={`Select ${f.label.toLowerCase()}`}
            error={error}
          >
            {(f.options ?? []).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </StyledSelect>
        );

      case "time":
        return (
          <StyledInput
            type="time"
            value={raw ?? ""}
            onChange={(v) => onChange(f.name, v)}
            error={error}
          />
        );

      case "number":
        return (
          <StyledInput
            type="number"
            min={0}
            value={raw === undefined || raw === null ? "" : String(raw)}
            onChange={(v) => onChange(f.name, v)}
            placeholder={f.placeholder ?? (f.prefix ? "0" : undefined)}
            error={error}
          />
        );

      default:
        return (
          <StyledInput
            value={raw ?? ""}
            onChange={(v) => onChange(f.name, v)}
            placeholder={f.placeholder}
            error={error}
          />
        );
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {fields.map((f) => {
        const wide = f.wide || f.control === "textarea" || f.control === "tags";
        return (
          <div key={f.name} className={cn("min-w-0", wide && "md:col-span-2")}>
            {f.control === "switch" ? (
              <div className="flex flex-col gap-1.5">
                {renderControl(f)}
                {f.help && <p className="text-[11.5px] text-th-warm-text-muted">{f.help}</p>}
              </div>
            ) : (
              <Field label={f.label} error={errors[f.name]}>
                {renderControl(f)}
                {f.help && !errors[f.name] && (
                  <p className="text-[11.5px] text-th-warm-text-muted">{f.help}</p>
                )}
              </Field>
            )}
          </div>
        );
      })}
    </div>
  );
};
