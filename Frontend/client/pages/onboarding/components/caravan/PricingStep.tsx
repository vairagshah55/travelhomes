import React from "react";
import { Plus, X, Check, IndianRupee, Car, Calendar } from "lucide-react";

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const TEAL       = "#07e4e4";
const TEAL_BG    = "rgba(7, 228, 228, 0.07)";
const TEAL_FOCUS = "rgba(7, 228, 228, 0.15)";
const BLACK      = "#131313";
const GRAY_500   = "#6b6b6b";
const GRAY_400   = "#9a9a9a";
const GRAY_200   = "#e4e4e4";
const WHITE      = "#ffffff";
const SURFACE    = "#F7F8FA";
const ERROR      = "#ef4444";
const ERROR_BG   = "rgba(239,68,68,0.04)";
const ERROR_RING = "rgba(239,68,68,0.1)";

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

/* ─── Error message ───────────────────────────────────────────────────────── */
const ErrorMsg = ({ message }: { message?: string }) =>
  message ? (
    <div className="flex items-center gap-1.5 mt-0.5">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <circle cx="6" cy="6" r="5.25" stroke={ERROR} strokeWidth="1.5" />
        <path d="M6 3.5v3M6 8.25v.25" stroke={ERROR} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <p style={{ fontSize: 11.5, color: ERROR }}>{message}</p>
    </div>
  ) : null;

/* ─── Price input ─────────────────────────────────────────────────────────── */
const PriceInput = ({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: boolean;
}) => {
  const [focused, setFocused] = React.useState(false);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        borderRadius: 13,
        overflow: "hidden",
        border: `1.5px solid ${error ? "#fca5a5" : focused ? TEAL : "transparent"}`,
        backgroundColor: error ? ERROR_BG : focused ? WHITE : SURFACE,
        boxShadow: focused && !error
          ? `0 0 0 4px ${TEAL_FOCUS}, 0 1px 4px rgba(0,0,0,0.06)`
          : error
          ? `0 0 0 3px ${ERROR_RING}`
          : "none",
        transition: "all 0.15s",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          padding: "0 12px",
          height: 52,
          borderRight: `1.5px solid ${focused ? "rgba(7,228,228,0.3)" : GRAY_200}`,
          backgroundColor: focused ? TEAL_BG : SURFACE,
          transition: "all 0.15s",
          flexShrink: 0,
        }}
      >
        <IndianRupee size={13} color={focused ? TEAL : GRAY_400} />
        <span style={{ fontSize: 12, fontWeight: 700, color: focused ? TEAL : GRAY_400 }}>INR</span>
      </div>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="0"
        min="0"
        style={{
          flex: 1,
          height: 52,
          padding: "0 16px",
          fontSize: 18,
          fontWeight: 700,
          color: value ? BLACK : GRAY_400,
          backgroundColor: "transparent",
          border: "none",
          outline: "none",
          letterSpacing: "-0.02em",
        }}
      />
      {value && Number(value) > 0 && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: TEAL,
            paddingRight: 14,
            flexShrink: 0,
          }}
        >
          / unit
        </span>
      )}
    </div>
  );
};

/* ─── Item row (include / exclude) ───────────────────────────────────────── */
const ItemRow = ({
  value,
  index,
  type,
  field,
  onUpdate,
  onRemove,
}: {
  value: string;
  index: number;
  type: "include" | "exclude";
  field: PriceField;
  onUpdate: (field: PriceField, index: number, value: string) => void;
  onRemove: (field: PriceField, index: number) => void;
}) => {
  const [focused, setFocused] = React.useState(false);
  const isInclude = type === "include";
  return (
    <div
      className="flex items-center gap-2.5"
      style={{
        backgroundColor: focused ? WHITE : SURFACE,
        border: `1.5px solid ${focused ? TEAL : "transparent"}`,
        borderRadius: 11,
        padding: "5px 8px 5px 10px",
        boxShadow: focused ? `0 0 0 3px ${TEAL_FOCUS}` : "none",
        transition: "all 0.15s",
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          backgroundColor: isInclude ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {isInclude
          ? <Check size={11} color="#22c55e" strokeWidth={2.5} />
          : <X size={11} color="#f87171" strokeWidth={2.5} />
        }
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onUpdate(field, index, e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={isInclude ? "e.g. Driver allowance" : "e.g. Fuel charges"}
        maxLength={250}
        style={{
          flex: 1,
          height: 34,
          padding: "0 4px",
          fontSize: 13,
          color: BLACK,
          backgroundColor: "transparent",
          border: "none",
          outline: "none",
          fontWeight: 450,
        }}
      />
      <button
        type="button"
        onClick={() => onRemove(field, index)}
        style={{
          width: 26,
          height: 26,
          borderRadius: 7,
          border: "none",
          backgroundColor: "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          flexShrink: 0,
          transition: "background-color 0.15s",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#fef2f2"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
      >
        <X size={12} color={GRAY_400} />
      </button>
    </div>
  );
};

/* ─── Include / Exclude list ──────────────────────────────────────────────── */
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
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: error ? ERROR : isInclude ? "#22c55e" : "#f87171",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {isInclude ? "✓ Included" : "✕ Excluded"}
        </p>
        <button
          type="button"
          onClick={() => onAdd(field)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontSize: 11,
            fontWeight: 700,
            color: TEAL,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "2px 0",
          }}
        >
          <Plus size={11} strokeWidth={2.5} />
          Add
        </button>
      </div>

      {items.length === 0 ? (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: 10,
            backgroundColor: error ? ERROR_BG : SURFACE,
            border: `1.5px dashed ${error ? "#fca5a5" : GRAY_200}`,
          }}
        >
          <p style={{ fontSize: 12, color: error ? ERROR : GRAY_400 }}>
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
          {error && <ErrorMsg message={error} />}
        </div>
      )}
    </div>
  );
};

/* ─── Price card ──────────────────────────────────────────────────────────── */
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
      style={{
        backgroundColor: WHITE,
        border: `1.5px solid ${error ? "#fca5a5" : "#EBEBEB"}`,
        borderRadius: 20,
        padding: "20px 22px 22px",
        boxShadow: error
          ? `0 0 0 3px ${ERROR_RING}, 0 2px 12px rgba(0,0,0,0.04)`
          : "0 2px 12px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)",
        transition: "all 0.15s",
      }}
    >
      {/* Card header */}
      <div className="flex items-center gap-3 mb-5">
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 11,
            backgroundColor: hasValue ? TEAL_BG : SURFACE,
            border: `1.5px solid ${hasValue ? "rgba(7,228,228,0.25)" : GRAY_200}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            transition: "all 0.2s",
          }}
        >
          {icon}
        </div>
        <div className="flex-1">
          <p style={{ fontSize: 13, fontWeight: 700, color: BLACK, letterSpacing: "-0.01em" }}>{title}</p>
          <p style={{ fontSize: 11, color: GRAY_400, marginTop: 1 }}>{subtitle}</p>
        </div>
        {hasValue && (
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: "#22c55e",
              backgroundColor: "rgba(34,197,94,0.08)",
              border: "1px solid rgba(34,197,94,0.2)",
              borderRadius: 99,
              padding: "2px 10px",
            }}
          >
            ✓ Set
          </span>
        )}
      </div>

      {/* Price input */}
      <div className="flex flex-col gap-1 mb-1">
        <label
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: error ? ERROR : GRAY_500,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          Charge amount {error ? "" : <span style={{ color: GRAY_400, fontWeight: 400, textTransform: "none" }}>— optional if other mode is set</span>}
        </label>
        <PriceInput
          value={value}
          onChange={(v) => { onChange(v); if (error) clearError(errorKey); }}
          error={!!error}
        />
        {error && <ErrorMsg message={error} />}
      </div>

      {/* Only show includes/excludes if a value is entered */}
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

/* ─── Main component ──────────────────────────────────────────────────────── */
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
    <div className="flex flex-col items-center gap-7 w-full max-w-2xl">

      {/* ── Header ── */}
      <div className="text-center space-y-2 pb-1">
        <div className="flex items-center justify-center gap-2.5 mb-3">
          <div style={{ width: 24, height: 3, borderRadius: 99, backgroundColor: TEAL }} />
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: "0.13em",
              textTransform: "uppercase",
              color: GRAY_400,
            }}
          >
            Pricing
          </span>
          <div style={{ width: 24, height: 3, borderRadius: 99, backgroundColor: TEAL }} />
        </div>
        <h1
          style={{
            fontSize: "clamp(22px, 3.5vw, 30px)",
            fontWeight: 800,
            color: BLACK,
            letterSpacing: "-0.03em",
            lineHeight: 1.15,
          }}
        >
          Pricing Details
        </h1>
        <p style={{ fontSize: 14, color: GRAY_500, lineHeight: 1.6 }}>
          Set your pricing for different travel modes. At least one is required.
        </p>
      </div>

      {/* Top-level "at least one price" error */}
      {errors.pricing && (
        <div
          className="flex items-center gap-2 w-full"
          style={{
            padding: "12px 16px",
            borderRadius: 12,
            backgroundColor: ERROR_BG,
            border: `1.5px solid rgba(239,68,68,0.25)`,
            boxShadow: `0 0 0 3px ${ERROR_RING}`,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="5.25" stroke={ERROR} strokeWidth="1.5" />
            <path d="M6 3.5v3M6 8.25v.25" stroke={ERROR} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <p style={{ fontSize: 13, color: ERROR, fontWeight: 500 }}>{errors.pricing}</p>
        </div>
      )}

      <div className="w-full flex flex-col gap-4">
        <PriceCard
          icon={<Car size={16} color={perKmCharge && Number(perKmCharge) > 0 ? TEAL : GRAY_400} strokeWidth={2} />}
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
          icon={<Calendar size={16} color={perDayCharge && Number(perDayCharge) > 0 ? TEAL : GRAY_400} strokeWidth={2} />}
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
