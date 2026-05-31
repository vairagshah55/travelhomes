import React from "react";
import { Plus, X, Check, IndianRupee, Car, Calendar } from "lucide-react";
import { ErrorMsg, StepHeader } from "../shared/primitives";
import { cn } from "@/lib/utils";

type PriceField = "perKmIncludes" | "perKmExcludes" | "perDayIncludes" | "perDayExcludes";

interface PricingStepProps {
  perKmCharge: string;
  perDayCharge: string;
  perKmIncludes: string[];
  perKmExcludes: string[];
  perDayIncludes: string[];
  perDayExcludes: string[];
  errors: Record<string, string>;
  onPerKmChargeChange: (value: string) => void;
  onPerDayChargeChange: (value: string) => void;
  onAddPriceItem: (field: PriceField) => void;
  onUpdatePriceItem: (field: PriceField, index: number, value: string) => void;
  onRemovePriceItem: (field: PriceField, index: number) => void;
  clearError: (field: string) => void;
  // Render without StepHeader + centered wrapper when used inside an existing
  // scrollable form (e.g. edit page).
  embedded?: boolean;
}

const PriceInput = ({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: boolean;
}) => (
  <div
    className={cn(
      "group flex items-center rounded-[13px] overflow-hidden border-[1.5px] transition-all duration-150",
      error
        ? "border-th-error-bright-soft bg-th-error-bright-bg shadow-[0_0_0_3px_var(--th-error-bright-ring)]"
        : "border-transparent bg-th-warm-surface focus-within:border-th-brand focus-within:bg-th-surface-0 focus-within:shadow-[0_0_0_4px_var(--th-ring),0_1px_4px_rgba(0,0,0,0.06)]",
    )}
  >
    <div className="flex items-center gap-1 px-3 h-[52px] border-r-[1.5px] border-th-warm-border bg-th-warm-surface group-focus-within:border-th-brand-border-soft group-focus-within:bg-th-brand-soft transition-all duration-150 flex-shrink-0">
      <IndianRupee size={13} className="text-th-warm-text-muted group-focus-within:text-th-brand" />
      <span className="text-[12px] font-bold text-th-warm-text-muted group-focus-within:text-th-brand">INR</span>
    </div>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="0"
      min="0"
      className={cn(
        "flex-1 h-[52px] px-4 text-[18px] font-bold tracking-[-0.02em] bg-transparent border-none outline-none",
        value ? "text-th-text-primary" : "text-th-warm-text-muted",
      )}
    />
    {value && Number(value) > 0 && (
      <span className="text-[11px] font-semibold text-th-brand pr-[14px] flex-shrink-0">
        / unit
      </span>
    )}
  </div>
);

const ItemRow = ({
  value,
  type,
  field,
  onUpdate,
  onRemove,
  index,
}: {
  value: string;
  index: number;
  type: "include" | "exclude";
  field: PriceField;
  onUpdate: (field: PriceField, index: number, value: string) => void;
  onRemove: (field: PriceField, index: number) => void;
}) => {
  const isInclude = type === "include";
  return (
    <div className="flex items-center gap-2.5 rounded-[11px] px-[10px] py-[5px] pr-2 border-[1.5px] border-transparent bg-th-warm-surface focus-within:border-th-brand focus-within:bg-th-surface-0 focus-within:shadow-[0_0_0_3px_var(--th-ring)] transition-all duration-150">
      <div
        className={cn(
          "w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0",
          isInclude ? "bg-th-success-bright-bg" : "bg-th-error-bright-bg",
        )}
      >
        {isInclude ? (
          <Check size={11} className="text-th-success-bright" strokeWidth={2.5} />
        ) : (
          <X size={11} color="#f87171" strokeWidth={2.5} />
        )}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onUpdate(field, index, e.target.value)}
        placeholder={isInclude ? "e.g. Driver allowance" : "e.g. Fuel charges"}
        maxLength={250}
        className="flex-1 h-[34px] px-1 text-[13px] text-th-text-primary font-[450] bg-transparent border-none outline-none"
      />
      <button
        type="button"
        onClick={() => onRemove(field, index)}
        className="w-[26px] h-[26px] rounded-[7px] flex items-center justify-center flex-shrink-0 cursor-pointer bg-transparent hover:bg-red-50 transition-colors duration-150"
      >
        <X size={12} className="text-th-warm-text-muted" />
      </button>
    </div>
  );
};

const ItemList = ({
  items,
  field,
  type,
  onUpdate,
  onRemove,
  onAdd,
  error,
}: {
  items: string[];
  field: PriceField;
  type: "include" | "exclude";
  onUpdate: (field: PriceField, index: number, value: string) => void;
  onRemove: (field: PriceField, index: number) => void;
  onAdd: (field: PriceField) => void;
  error?: string;
}) => {
  const isInclude = type === "include";
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p
          className={cn(
            "text-[11px] font-bold uppercase tracking-[0.04em]",
            error ? "text-th-error-bright" : isInclude ? "text-th-success-bright" : "text-[#f87171]",
          )}
        >
          {isInclude ? "✓ Included" : "✕ Excluded"}
        </p>
        <button
          type="button"
          onClick={() => onAdd(field)}
          className="flex items-center gap-1 text-[11px] font-bold text-th-brand bg-transparent border-none cursor-pointer py-0.5"
        >
          <Plus size={11} strokeWidth={2.5} />
          Add
        </button>
      </div>

      {items.length === 0 ? (
        <div
          className={cn(
            "px-[14px] py-[10px] rounded-[10px] border-[1.5px] border-dashed",
            error
              ? "bg-th-error-bright-bg border-th-error-bright-soft"
              : "bg-th-warm-surface border-th-warm-border",
          )}
        >
          <p className={cn("text-[12px]", error ? "text-th-error-bright" : "text-th-warm-text-muted")}>
            {error ?? `No items yet — click Add`}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {items.map((item, index) => (
            <ItemRow
              key={index}
              value={item}
              index={index}
              type={type}
              field={field}
              onUpdate={onUpdate}
              onRemove={onRemove}
            />
          ))}
          <ErrorMsg message={error} marginTop={2} />
        </div>
      )}
    </div>
  );
};

const PriceCard = ({
  icon,
  title,
  subtitle,
  value,
  onChange,
  error,
  includes,
  excludes,
  includesField,
  excludesField,
  includesError,
  excludesError,
  onUpdate,
  onRemove,
  onAdd,
  clearError,
  errorKey,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  includes: string[];
  excludes: string[];
  includesField: PriceField;
  excludesField: PriceField;
  includesError?: string;
  excludesError?: string;
  onUpdate: (field: PriceField, index: number, value: string) => void;
  onRemove: (field: PriceField, index: number) => void;
  onAdd: (field: PriceField) => void;
  clearError: (field: string) => void;
  errorKey: string;
}) => {
  const hasValue = value && Number(value) > 0;
  return (
    <div
      className={cn(
        "bg-th-surface-0 rounded-[20px] px-[22px] pt-5 pb-[22px] border-[1.5px] transition-all duration-150",
        error
          ? "border-th-error-bright-soft shadow-[0_0_0_3px_var(--th-error-bright-ring),0_2px_12px_rgba(0,0,0,0.04)]"
          : "border-th-warm-border shadow-[0_2px_12px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.03)]",
      )}
    >
      <div className="flex items-center gap-3 mb-5">
        <div
          className={cn(
            "w-9 h-9 rounded-[11px] border-[1.5px] flex items-center justify-center flex-shrink-0 transition-all duration-200",
            hasValue
              ? "bg-th-brand-soft border-th-brand-border-soft"
              : "bg-th-warm-surface border-th-warm-border",
          )}
        >
          {icon}
        </div>
        <div className="flex-1">
          <p className="text-[13px] font-bold text-th-text-primary tracking-[-0.01em]">
            {title}
          </p>
          <p className="text-[11px] text-th-warm-text-muted mt-px">{subtitle}</p>
        </div>
        {hasValue && (
          <span className="text-[10.5px] font-bold text-th-success-bright bg-th-success-bright-bg border border-th-success-bright-border rounded-full px-[10px] py-0.5">
            ✓ Set
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1 mb-1">
        <label className="text-[11px] font-semibold text-th-warm-text-dark uppercase tracking-[0.04em]">
          Charge amount{" "}
          {error ? (
            ""
          ) : (
            <span className="text-th-warm-text-muted font-normal normal-case">
              — optional if other mode is set
            </span>
          )}
        </label>
        <PriceInput
          value={value}
          onChange={(v) => {
            onChange(v);
            if (error) clearError(errorKey);
          }}
          error={!!error}
        />
        <ErrorMsg message={error} marginTop={2} />
      </div>

      {hasValue && (
        <>
          <div style={{ height: 1, backgroundColor: "#F0F0F0", margin: "18px 0" }} />
          <div className="flex flex-col gap-4">
            <ItemList
              items={includes}
              field={includesField}
              type="include"
              onUpdate={onUpdate}
              onRemove={onRemove}
              onAdd={onAdd}
              error={includesError}
            />
            <ItemList
              items={excludes}
              field={excludesField}
              type="exclude"
              onUpdate={onUpdate}
              onRemove={onRemove}
              onAdd={onAdd}
              error={excludesError}
            />
          </div>
        </>
      )}
    </div>
  );
};

const PricingStep: React.FC<PricingStepProps> = ({
  perKmCharge,
  perDayCharge,
  perKmIncludes,
  perKmExcludes,
  perDayIncludes,
  perDayExcludes,
  errors,
  onPerKmChargeChange,
  onPerDayChargeChange,
  onAddPriceItem,
  onUpdatePriceItem,
  onRemovePriceItem,
  clearError,
  embedded,
}) => {
  const content = (
    <>
      {errors.pricing && (
        <div className="flex items-center gap-2 w-full px-4 py-3 rounded-xl bg-th-error-bright-bg border-[1.5px] border-[rgba(239,68,68,0.25)] shadow-[0_0_0_3px_var(--th-error-bright-ring)] text-th-error-bright">
          <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="5.25" stroke="currentColor" strokeWidth="1.5" />
            <path d="M6 3.5v3M6 8.25v.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <p className="text-[13px] font-medium">{errors.pricing}</p>
        </div>
      )}

      <div className="w-full flex flex-col gap-4">
        <PriceCard
          icon={
            <Car
              size={16}
              className={perKmCharge && Number(perKmCharge) > 0 ? "text-th-brand" : "text-th-warm-text-muted"}
              strokeWidth={2}
            />
          }
          title="Per Kilometer (KM)"
          subtitle="Charge per km traveled"
          value={perKmCharge}
          onChange={onPerKmChargeChange}
          error={errors.perKmCharge}
          includes={perKmIncludes}
          excludes={perKmExcludes}
          includesField="perKmIncludes"
          excludesField="perKmExcludes"
          includesError={errors.perKmIncludes}
          excludesError={errors.perKmExcludes}
          onUpdate={onUpdatePriceItem}
          onRemove={onRemovePriceItem}
          onAdd={onAddPriceItem}
          clearError={clearError}
          errorKey="perKmCharge"
        />

        <PriceCard
          icon={
            <Calendar
              size={16}
              className={perDayCharge && Number(perDayCharge) > 0 ? "text-th-brand" : "text-th-warm-text-muted"}
              strokeWidth={2}
            />
          }
          title="Per Day"
          subtitle="Flat daily rental charge"
          value={perDayCharge}
          onChange={onPerDayChargeChange}
          error={errors.perDayCharge}
          includes={perDayIncludes}
          excludes={perDayExcludes}
          includesField="perDayIncludes"
          excludesField="perDayExcludes"
          includesError={errors.perDayIncludes}
          excludesError={errors.perDayExcludes}
          onUpdate={onUpdatePriceItem}
          onRemove={onRemovePriceItem}
          onAdd={onAddPriceItem}
          clearError={clearError}
          errorKey="perDayCharge"
        />
      </div>
    </>
  );

  if (embedded) {
    return <div className="w-full flex flex-col gap-4">{content}</div>;
  }

  return (
    <div className="flex flex-col items-center gap-7 w-full max-w-2xl">
      <StepHeader
        kicker="Pricing"
        title="Pricing Details"
        subtitle="Set your pricing for different travel modes. At least one is required."
      />
      {content}
    </div>
  );
};

export default PricingStep;
