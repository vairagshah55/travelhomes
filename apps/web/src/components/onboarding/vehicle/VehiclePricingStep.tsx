import React from "react";
import { Car, Check, IndianRupee, Info, Plus, ShieldCheck, UserRound, X } from "lucide-react";
import { ErrorMsg, Field, SectionCard, StepHeader, StyledSelect } from "../shared/primitives";
import { iconShellClass, iconShellFocusClass, iconSlotClass } from "../shared/primitives/IconInput";
import { cn } from "@/lib/utils";
import { FUEL_POLICIES, TOLLS_POLICIES, type FuelPolicy, type TollsPolicy } from "./vehicleConfig";

export type VehicleListField =
  | "selfDriveIncludes"
  | "selfDriveExcludes"
  | "withDriverIncludes"
  | "withDriverExcludes";

interface VehiclePricingStepProps {
  selfDriveEnabled: boolean;
  selfDrivePerDay: string;
  selfDrivePerKm: string;
  freeKmPerDay: string;
  extraKmCharge: string;
  minRentalHours: string;
  selfDriveIncludes: string[];
  selfDriveExcludes: string[];

  withDriverEnabled: boolean;
  withDriverPerKm: string;
  driverAllowancePerDay: string;
  withDriverOneWay: boolean;
  withDriverTwoWay: boolean;
  onToggleTripDirection: (which: "oneWay" | "twoWay") => void;
  withDriverIncludes: string[];
  withDriverExcludes: string[];

  fuelPolicy: FuelPolicy;
  tollsAndParking: TollsPolicy;
  cancellationWindowHours: string;

  errors: Record<string, string>;
  onToggleMode: (mode: "selfDrive" | "withDriver") => void;
  onFieldChange: (field: string, value: string) => void;
  onAddListItem: (field: VehicleListField) => void;
  onUpdateListItem: (field: VehicleListField, index: number, value: string) => void;
  onRemoveListItem: (field: VehicleListField, index: number) => void;
  clearError: (field: string) => void;
  embedded?: boolean;
}

/** Rupee-prefixed number input with an optional trailing unit. */
const PriceInput = ({
  value,
  onChange,
  unit,
  placeholder = "0",
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  unit?: string;
  placeholder?: string;
  error?: boolean;
}) => (
  <div
    className={cn(
      iconShellClass,
      !error && iconShellFocusClass,
      error &&
        "border-th-error-bright-soft focus-within:shadow-[0_0_0_3px_var(--th-error-bright-ring)]",
    )}
  >
    <div className={cn(iconSlotClass, "gap-1")}>
      <IndianRupee size={13} />
      <span className="text-[12px] font-bold">INR</span>
    </div>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      min="0"
      aria-label="Amount in rupees"
      className="flex-1 h-[54px] px-4 text-[17px] font-bold tracking-[-0.02em] text-th-text-primary placeholder:text-th-warm-text-muted placeholder:font-normal bg-transparent border-none outline-none"
    />
    {unit && value && Number(value) > 0 && (
      <span className="text-[11px] font-semibold text-th-brand pr-[14px] flex-shrink-0">
        {unit}
      </span>
    )}
  </div>
);

/** Plain number input for non-currency quantities (km, hours). */
const UnitInput = ({
  value,
  onChange,
  unit,
  placeholder = "0",
  max,
}: {
  value: string;
  onChange: (v: string) => void;
  unit: string;
  placeholder?: string;
  max?: number;
}) => (
  <div className={cn(iconShellClass, iconShellFocusClass)}>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      min="0"
      max={max}
      className="flex-1 h-[54px] px-4 text-[17px] font-bold tracking-[-0.02em] text-th-text-primary placeholder:text-th-warm-text-muted placeholder:font-normal bg-transparent border-none outline-none"
    />
    <span className="text-[11px] font-semibold text-th-warm-text-dark pr-[14px] flex-shrink-0">
      {unit}
    </span>
  </div>
);

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
  field: VehicleListField;
  onUpdate: (field: VehicleListField, index: number, value: string) => void;
  onRemove: (field: VehicleListField, index: number) => void;
}) => {
  const isInclude = type === "include";
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-[12px] px-[10px] py-[5px] pr-2",
        "bg-th-surface-0 border border-th-warm-border",
        "transition-[border-color,box-shadow] duration-150",
        "hover:border-[color:var(--onb-border-hover,#a9c5c2)]",
        "focus-within:border-th-brand focus-within:shadow-[0_0_0_3px_var(--th-ring)]",
      )}
    >
      <div
        className={cn(
          "w-[22px] h-[22px] rounded-full flex items-center justify-center flex-shrink-0",
          isInclude ? "bg-th-success-bright-bg" : "bg-th-error-bright-bg",
        )}
      >
        {isInclude ? (
          <Check size={11} className="text-th-success-bright" strokeWidth={2.5} />
        ) : (
          <X size={11} className="text-th-error-bright" strokeWidth={2.5} />
        )}
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onUpdate(field, index, e.target.value)}
        placeholder={isInclude ? "e.g. Unlimited kilometres" : "e.g. Fuel charges"}
        maxLength={250}
        className="flex-1 h-[34px] px-1 text-[13px] text-th-text-primary font-[450] bg-transparent border-none outline-none"
      />
      <button
        type="button"
        onClick={() => onRemove(field, index)}
        aria-label={isInclude ? "Remove inclusion" : "Remove exclusion"}
        className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-th-warm-text-muted cursor-pointer transition-all duration-150 hover:bg-th-error-bright-bg hover:text-th-error-bright"
      >
        <X size={13} />
      </button>
    </div>
  );
};

const ItemList = ({
  label,
  type,
  field,
  items,
  error,
  onAdd,
  onUpdate,
  onRemove,
}: {
  label: string;
  type: "include" | "exclude";
  field: VehicleListField;
  items: string[];
  error?: string;
  onAdd: (field: VehicleListField) => void;
  onUpdate: (field: VehicleListField, index: number, value: string) => void;
  onRemove: (field: VehicleListField, index: number) => void;
}) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <p className="text-[12.5px] font-bold text-th-text-primary tracking-[-0.01em]">
        {label}
        <span className="text-th-error-bright ml-0.5">*</span>
      </p>
      <button
        type="button"
        onClick={() => onAdd(field)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-th-warm-border bg-th-surface-0 text-[11.5px] font-semibold text-th-text-primary cursor-pointer transition-all duration-150 hover:border-th-brand hover:text-th-brand"
      >
        <Plus size={12} />
        Add
      </button>
    </div>
    {items.length === 0 ? (
      <button
        type="button"
        onClick={() => onAdd(field)}
        className="w-full py-3.5 rounded-[12px] border border-dashed border-th-warm-border bg-th-warm-surface text-[12.5px] font-medium text-th-warm-text-dark cursor-pointer transition-all duration-150 hover:border-th-brand hover:text-th-brand"
      >
        Add at least one line
      </button>
    ) : (
      <div className="flex flex-col gap-2">
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
      </div>
    )}
    <ErrorMsg message={error} />
  </div>
);

/** Header row that turns a whole rate card on or off. */
/**
 * The compact switch that sits in a mode card's header.
 *
 * Replaces ModeToggle, a full-width row that carried its own title and subtitle
 * — which meant each mode rendered two headings, the card's and the toggle's,
 * saying the same thing. The label survives for screen readers only; sighted
 * users read the card title beside it.
 */
const ModeSwitch = ({
  enabled,
  label,
  onToggle,
}: {
  enabled: boolean;
  label: string;
  onToggle: () => void;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={enabled}
    aria-label={label}
    onClick={onToggle}
    className={cn(
      "relative w-[46px] h-[26px] rounded-full border-[1.5px] shrink-0 cursor-pointer transition-colors duration-150",
      enabled
        ? "bg-th-brand border-th-brand"
        : "bg-th-warm-surface border-th-warm-border hover:border-th-brand",
    )}
  >
    <span
      className={cn(
        "absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-all duration-150",
        enabled ? "left-[23px]" : "left-[2px]",
      )}
    />
  </button>
)

/**
 * Rental modes and pricing.
 *
 * Two independent rate cards rather than one set of numbers with a mode
 * dropdown: a vendor who offers both self-drive and chauffeur-driven charges
 * genuinely different amounts for each, and the extras don't overlap at all
 * (self-drive has a security deposit and a free-km allowance; chauffeur has a
 * driver allowance and a night charge). At least one has to be on — that's
 * enforced in validateVehicleStep, which also requires an inclusion and an
 * exclusion for whichever cards are enabled.
 */
const VehiclePricingStep: React.FC<VehiclePricingStepProps> = ({
  selfDriveEnabled,
  selfDrivePerDay,
  selfDrivePerKm,
  freeKmPerDay,
  extraKmCharge,
  minRentalHours,
  selfDriveIncludes,
  selfDriveExcludes,
  withDriverEnabled,
  withDriverPerKm,
  driverAllowancePerDay,
  withDriverOneWay,
  withDriverTwoWay,
  onToggleTripDirection,
  withDriverIncludes,
  withDriverExcludes,
  fuelPolicy,
  tollsAndParking,
  cancellationWindowHours,
  errors,
  onToggleMode,
  onFieldChange,
  onAddListItem,
  onUpdateListItem,
  onRemoveListItem,
  clearError,
  embedded,
}) => {
  const set = (field: string) => (v: string) => {
    onFieldChange(field, v);
    clearError(field);
    clearError("pricing");
  };

  const body = (
    <div className="w-full flex flex-col gap-4">
      {errors.pricing && (
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-[12px] border-[1.5px] border-th-error-bright-soft bg-th-error-bright-bg">
          <Info size={14} className="text-th-error-bright mt-0.5 shrink-0" />
          <p className="text-[12.5px] font-medium text-th-error-bright">{errors.pricing}</p>
        </div>
      )}

      {/* ─── Self-drive ─────────────────────────────────────────────────── */}
      <SectionCard
        icon={<Car size={16} className="text-th-brand" strokeWidth={2.5} />}
        title="Self-drive"
        subtitle="The guest drives it themselves. A valid driving licence is collected at booking."
        /* The switch sits beside the title rather than in a row below it. The
           old ModeToggle restated the card's own heading to carry the control,
           so every mode read as two headings stacked on each other. */
        action={
          <ModeSwitch
            enabled={selfDriveEnabled}
            label="Offer this vehicle for self-drive"
            onToggle={() => {
              onToggleMode("selfDrive");
              clearError("pricing");
            }}
          />
        }
      >
        <div className="flex flex-col gap-4">

          {selfDriveEnabled && (
            <div className="flex flex-col gap-4 pl-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Per day" required error={errors.selfDrivePerDay}>
                  <PriceInput
                    value={selfDrivePerDay}
                    onChange={set("selfDrivePerDay")}
                    unit="/ day"
                    error={!!errors.selfDrivePerDay}
                  />
                </Field>
                <Field label="Per km" optional>
                  <PriceInput value={selfDrivePerKm} onChange={set("selfDrivePerKm")} unit="/ km" />
                </Field>
                <Field
                  label="Max kilometres per day"
                  optional
                  help="Distance included in the daily rate."
                >
                  <UnitInput value={freeKmPerDay} onChange={set("freeKmPerDay")} unit="km" />
                </Field>
                <Field label="Extra km charge" optional help="Charged beyond the daily maximum.">
                  <PriceInput value={extraKmCharge} onChange={set("extraKmCharge")} unit="/ km" />
                </Field>
                <Field label="Minimum rental" optional>
                  <UnitInput value={minRentalHours} onChange={set("minRentalHours")} unit="hours" />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ItemList
                  label="Self-drive rate includes"
                  type="include"
                  field="selfDriveIncludes"
                  items={selfDriveIncludes}
                  error={errors.selfDriveIncludes}
                  onAdd={onAddListItem}
                  onUpdate={onUpdateListItem}
                  onRemove={onRemoveListItem}
                />
                <ItemList
                  label="Self-drive rate excludes"
                  type="exclude"
                  field="selfDriveExcludes"
                  items={selfDriveExcludes}
                  error={errors.selfDriveExcludes}
                  onAdd={onAddListItem}
                  onUpdate={onUpdateListItem}
                  onRemove={onRemoveListItem}
                />
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {/* ─── With driver ────────────────────────────────────────────────── */}
      <SectionCard
        icon={<UserRound size={16} className="text-th-brand" strokeWidth={2.5} />}
        title="With driver"
        subtitle="You provide a chauffeur. Driver details are collected on the next steps."
        action={
          <ModeSwitch
            enabled={withDriverEnabled}
            label="Offer this vehicle with a driver"
            onToggle={() => {
              onToggleMode("withDriver");
              clearError("pricing");
            }}
          />
        }
      >
        <div className="flex flex-col gap-4">

          {withDriverEnabled && (
            <div className="flex flex-col gap-4 pl-1">
              {/* Which trips the chauffeur takes. Both are on by default —
                  most operators do both, and a mode accepting neither
                  direction is bookable by nobody, which validation blocks. */}
              <Field label="Trips offered" required error={errors.withDriverTrip}>
                <div className="flex flex-wrap gap-2.5">
                  {(
                    [
                      ["oneWay", "One way", withDriverOneWay],
                      ["twoWay", "Two way (round trip)", withDriverTwoWay],
                    ] as const
                  ).map(([key, label, on]) => (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={on}
                      onClick={() => {
                        onToggleTripDirection(key);
                        clearError("withDriverTrip");
                      }}
                      className={cn(
                        "flex items-center gap-2 px-[14px] py-2 rounded-full border-[1.5px] cursor-pointer transition-all duration-150",
                        on
                          ? "border-th-brand bg-th-brand-soft text-th-brand shadow-[0_0_0_3px_var(--th-ring)]"
                          : "border-th-warm-border bg-th-warm-surface text-th-warm-text-dark hover:border-th-brand hover:bg-th-brand-soft hover:text-th-brand",
                      )}
                    >
                      <span className="text-[13px] font-semibold tracking-[-0.01em]">{label}</span>
                    </button>
                  ))}
                </div>
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Per km" required error={errors.withDriverPerKm}>
                  <PriceInput
                    error={!!errors.withDriverPerKm}
                    value={withDriverPerKm}
                    onChange={set("withDriverPerKm")}
                    unit="/ km"
                  />
                </Field>
                <Field label="Driver allowance" optional help="Charged per day of the trip.">
                  <PriceInput
                    value={driverAllowancePerDay}
                    onChange={set("driverAllowancePerDay")}
                    unit="/ day"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ItemList
                  label="Chauffeur rate includes"
                  type="include"
                  field="withDriverIncludes"
                  items={withDriverIncludes}
                  error={errors.withDriverIncludes}
                  onAdd={onAddListItem}
                  onUpdate={onUpdateListItem}
                  onRemove={onRemoveListItem}
                />
                <ItemList
                  label="Chauffeur rate excludes"
                  type="exclude"
                  field="withDriverExcludes"
                  items={withDriverExcludes}
                  error={errors.withDriverExcludes}
                  onAdd={onAddListItem}
                  onUpdate={onUpdateListItem}
                  onRemove={onRemoveListItem}
                />
              </div>
            </div>
          )}
        </div>
      </SectionCard>

      {/* ─── Shared terms ───────────────────────────────────────────────── */}
      <SectionCard
        icon={<ShieldCheck size={16} className="text-th-brand" strokeWidth={2.5} />}
        title="Rental terms"
        subtitle="These apply to both modes and are shown on the listing."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Fuel policy" required>
            <StyledSelect value={fuelPolicy} onChange={set("fuelPolicy")}>
              {FUEL_POLICIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </StyledSelect>
          </Field>
          <Field label="Tolls & parking" required>
            <StyledSelect value={tollsAndParking} onChange={set("tollsAndParking")}>
              {TOLLS_POLICIES.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </StyledSelect>
          </Field>
          <Field
            label="Free cancellation window"
            optional
            help="Hours before pickup that a guest can cancel free."
          >
            <UnitInput
              value={cancellationWindowHours}
              onChange={set("cancellationWindowHours")}
              unit="hours"
            />
          </Field>
        </div>
      </SectionCard>
    </div>
  );

  if (embedded) return body;

  return (
    <div className="w-full flex flex-col gap-6">
      <StepHeader
        kicker="Rental Modes & Pricing"
        subtitle="Turn on the modes you offer and price each one. At least one is required."
      />
      {body}
    </div>
  );
};

export default VehiclePricingStep;
