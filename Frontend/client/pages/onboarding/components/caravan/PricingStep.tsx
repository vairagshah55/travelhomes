import React from "react";
import { Plus, X, Check, IndianRupee, Car, Calendar } from "lucide-react";

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
}

interface IncludeExcludeListProps {
  items: string[];
  field: PriceField;
  type: "include" | "exclude";
  onUpdate: (field: PriceField, index: number, value: string) => void;
  onRemove: (field: PriceField, index: number) => void;
  onAdd: (field: PriceField) => void;
  error?: string;
}

const IncludeExcludeList: React.FC<IncludeExcludeListProps> = ({
  items,
  field,
  type,
  onUpdate,
  onRemove,
  onAdd,
  error,
}) => {
  const isInclude = type === "include";
  const iconColor = isInclude ? "text-green-500" : "text-red-400";
  const label = isInclude ? "Included in price" : "Excluded from price";

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </p>

      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className={`w-4 h-4 flex-shrink-0 ${iconColor}`}>
            {isInclude ? <Check size={14} /> : <X size={14} />}
          </div>
          <input
            type="text"
            value={item}
            onChange={(e) => onUpdate(field, index, e.target.value)}
            placeholder={isInclude ? "e.g. Driver allowance" : "e.g. Fuel charges"}
            maxLength={250}
            className="flex-1 h-9 px-3 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:border-[var(--th-accent)] transition-colors"
          />
          <button
            type="button"
            onClick={() => onRemove(field, index)}
            className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center transition-colors flex-shrink-0"
          >
            <X size={12} className="text-gray-400 hover:text-red-500" />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onAdd(field)}
        className="flex items-center gap-1.5 text-xs font-medium mt-1 transition-colors w-fit"
        style={{ color: "var(--th-accent)" }}
      >
        <Plus size={12} />
        Add item
      </button>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};

interface PriceCardProps {
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
}

const PriceCard: React.FC<PriceCardProps> = ({
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
}) => (
  <div className="flex flex-col gap-5 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
    {/* Card header */}
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-800 dark:text-white">{title}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>
      </div>
    </div>

    {/* Price input */}
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Charge amount</label>
      <div
        className={`flex items-center border rounded-xl overflow-hidden focus-within:border-[var(--th-accent)] transition-colors ${
          error ? "border-red-400" : "border-gray-200 dark:border-gray-600"
        }`}
      >
        <div className="flex items-center gap-1 px-3 h-11 border-r border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
          <IndianRupee size={13} className="text-gray-400" />
          <span className="text-xs text-gray-400">INR</span>
        </div>
        <input
          type="number"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (error) clearError(errorKey);
          }}
          placeholder="0"
          className="flex-1 h-11 px-3 text-sm bg-transparent text-gray-800 dark:text-white focus:outline-none"
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>

    {/* Divider */}
    <div className="w-full h-px bg-gray-100 dark:bg-gray-700" />

    {/* Includes & Excludes */}
    <div className="flex flex-col gap-4">
      <IncludeExcludeList
        items={includes}
        field={includesField}
        type="include"
        onUpdate={onUpdate}
        onRemove={onRemove}
        onAdd={onAdd}
        error={includesError}
      />
      <IncludeExcludeList
        items={excludes}
        field={excludesField}
        type="exclude"
        onUpdate={onUpdate}
        onRemove={onRemove}
        onAdd={onAdd}
        error={excludesError}
      />
    </div>
  </div>
);

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
}) => {
  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-3xl">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl lg:text-[32px] font-bold text-black dark:text-white leading-tight">
          Pricing Details
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Set your pricing for different travel modes
        </p>
      </div>

      <div className="w-full flex flex-col gap-5">
        <PriceCard
          icon={<Car size={17} className="text-gray-500 dark:text-gray-400" />}
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
          icon={<Calendar size={17} className="text-gray-500 dark:text-gray-400" />}
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
    </div>
  );
};

export default PricingStep;
