import React from "react";
import { Bus, Car, FileText, Truck } from "lucide-react";
import { Field, SectionCard, StepHeader, StyledInput, StyledSelect } from "../shared/primitives";
import CategoryStep from "../caravan/CategoryStep";
import { cn } from "@/lib/utils";
import {
  vehicleCategoriesFor,
  vehicleModelsFor,
  vehicleAllowsOtherModel,
  brandFromModel,
  VEHICLE_MODEL_OTHER,
  MANUFACTURE_YEARS,
  VEHICLE_CLASSES,
  type VehicleClass,
} from "./vehicleConfig";

interface VehicleClassStepProps {
  vehicleClass: VehicleClass | null;
  category: string | null;
  brand: string;
  model: string;
  manufactureYear: string;
  registrationNumber: string;
  /**
   * "Vehicle Rental" `type: "category"` rows from CMS → Features → Categories.
   * Passed straight through to the shared CategoryStep, which already handles
   * the empty / still-loading / renamed-category cases.
   */
  dynamicCategories?: any[];
  categoriesLoading?: boolean;
  errors: Record<string, string>;
  onVehicleClassChange: (value: VehicleClass) => void;
  onCategoryChange: (value: string) => void;
  onBrandChange: (value: string) => void;
  onModelChange: (value: string) => void;
  onManufactureYearChange: (value: string) => void;
  onRegistrationNumberChange: (value: string) => void;
  clearError: (field: string) => void;
  embedded?: boolean;
}

const CLASS_ICON: Record<VehicleClass, React.ElementType> = {
  car: Car,
  van: Truck,
  bus: Bus,
};

/**
 * Class + identity.
 *
 * The class picker is a three-up row rather than the vertical card list the
 * caravan category step uses: there are only ever three options, they're
 * mutually exclusive, and the choice narrows everything below it (which CMS
 * categories apply, what seat count is plausible). Putting it above the
 * category list makes that dependency read in the right order.
 */
const VehicleClassStep: React.FC<VehicleClassStepProps> = ({
  vehicleClass,
  category,
  brand,
  model,
  manufactureYear,
  registrationNumber,
  dynamicCategories,
  categoriesLoading,
  errors,
  onVehicleClassChange,
  onCategoryChange,
  onBrandChange,
  onModelChange,
  onManufactureYearChange,
  onRegistrationNumberChange,
  clearError,
  embedded,
}) => {
  const listedModels = vehicleModelsFor(vehicleClass, category);
  const allowsOther = vehicleAllowsOtherModel(vehicleClass, category);

  /**
   * Whether the vendor picked "Other" and is typing a model in.
   *
   * Local, because it isn't derivable from `model` alone: the moment "Other" is
   * chosen the model is cleared, so an `!listedModels.includes(model)` test
   * would read as "nothing selected" and snap the select back to its
   * placeholder mid-edit. A model already off-list (a draft saved before this
   * category had a picklist) counts as manual too.
   */
  const [modelIsManual, setModelIsManual] = React.useState(false);
  const modelIsListed = !!model && listedModels.includes(model);
  const showManualModel = modelIsManual || (!!model && !modelIsListed);
  const modelSelectValue = modelIsListed ? model : showManualModel ? VEHICLE_MODEL_OTHER : "";

  const body = (
    <div className="w-full flex flex-col gap-4">
      <SectionCard
        icon={<Car size={16} />}
        /**
         * Labelled "Category" / "Sub-category" to match the taxonomy document,
         * where Car/Van/Bus are the categories and Budget / Small Car, Sedans,
         * SUVs … are their sub-categories.
         *
         * The FIELD names stay `vehicleClass` and `category`: `category` is
         * what Offer stores and what the guest search sidebar filters on, so
         * renaming it would mean migrating every listing and the filter with
         * it. Only the copy changed. Read as: vehicleClass = category,
         * category = sub-category.
         */
        title="Category"
        subtitle="Car, van or bus. This decides which sub-categories and seat counts guests can filter by."
        required
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {VEHICLE_CLASSES.map((option) => {
            const Icon = CLASS_ICON[option.value];
            const selected = vehicleClass === option.value;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  onVehicleClassChange(option.value);
                  clearError("vehicleClass");
                }}
                className={cn(
                  "flex flex-col items-start gap-2 px-4 py-4 rounded-[16px] border-[1.5px] cursor-pointer text-left transition-all duration-150",
                  selected
                    ? "border-th-brand bg-th-brand-soft shadow-[0_0_0_3px_var(--th-ring),0_2px_12px_rgba(0,0,0,0.04)]"
                    : "border-th-warm-border bg-th-surface-0 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-th-brand hover:bg-th-brand-soft",
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-[12px] border-[1.5px] flex items-center justify-center shrink-0 transition-all duration-150",
                    selected
                      ? "bg-th-brand-soft border-th-brand-border-soft text-th-brand"
                      : "bg-th-warm-surface border-th-warm-border text-th-warm-text-dark",
                  )}
                >
                  <Icon size={18} />
                </div>
                <p
                  className={cn(
                    "text-[14px] font-bold tracking-[-0.01em]",
                    selected ? "text-th-brand" : "text-th-text-primary",
                  )}
                >
                  {option.label}
                </p>
                <p className="text-[12.5px] text-th-warm-text-dark leading-[1.5]">{option.blurb}</p>
              </button>
            );
          })}
        </div>
        {errors.vehicleClass && (
          <p className="mt-2 text-[12px] font-medium text-th-error-bright">{errors.vehicleClass}</p>
        )}
      </SectionCard>

      {/**
       * Categories for the CHOSEN CLASS only.
       *
       * The list used to be flat and class-independent, so someone listing a
       * hatchback was offered "Coach Bus". `dynamicCategories` is passed empty
       * on purpose: the CMS rows are a flat name/description pair with no
       * class and no model list, so they cannot express this taxonomy — see
       * VEHICLE_TAXONOMY, which is the source of truth for all three of the
       * category cards, the model picker below, and the guest search filter.
       */}
      <SectionCard
        icon={<FileText size={16} />}
        title="Sub-category"
        subtitle={
          vehicleClass
            ? "Pick the sub-category that best describes this vehicle."
            : "Choose a category first."
        }
        required
      >
        {vehicleClass ? (
          <CategoryStep
            embedded
            fallbackCategories={vehicleCategoriesFor(vehicleClass)}
            category={category}
            dynamicCategories={[]}
            categoriesLoading={false}
            onSelect={(name) => {
              onCategoryChange(name);
              clearError("category");
            }}
          />
        ) : (
          <p className="text-[13px] text-th-warm-text-dark">
            Select car, van or bus above and the matching sub-categories appear here.
          </p>
        )}
      </SectionCard>

      {/**
       * The third level of the taxonomy — Category (car/van/bus) →
       * Sub-category (Budget / Small Car) → Model (Maruti Swift).
       *
       * Its own card, directly under its parent, rather than sharing the
       * "Make & registration" grid with the registration plate. Nesting is the
       * whole point of this step, and burying the last level among the
       * verification fields hid it. Brand still lives below because the model
       * prefills it, so the order the vendor works down the page is now
       * category → sub-category → model → the brand it filled in.
       */}
      <SectionCard
        icon={<Car size={16} />}
        title="Model"
        subtitle={
          category ? `Which ${category.toLowerCase()} is it?` : "Pick a sub-category first."
        }
        required
      >
        <Field
          label="Model"
          required
          error={errors.model}
          help={
            listedModels.length > 0 && allowsOther
              ? "Not listed? Choose Other and type it in."
              : undefined
          }
        >
          {listedModels.length === 0 ? (
            // Bus categories are defined by seat count, not by model, so
            // there is no list to pick from.
            <StyledInput
              value={model}
              onChange={(v) => {
                onModelChange(v);
                clearError("model");
              }}
              placeholder="e.g. Volvo 9600"
              maxLength={60}
              error={!!errors.model}
            />
          ) : (
            <div className="flex flex-col gap-2">
              <StyledSelect
                value={modelSelectValue}
                onChange={(v) => {
                  if (v === VEHICLE_MODEL_OTHER) {
                    // Clear both, so the previous pick's brand doesn't linger
                    // on a vehicle the vendor is about to name themselves.
                    setModelIsManual(true);
                    onModelChange("");
                    onBrandChange("");
                  } else {
                    setModelIsManual(false);
                    onModelChange(v);
                    // Prefilled, not locked — the field stays editable for the
                    // marques whose leading word isn't the whole brand.
                    onBrandChange(brandFromModel(v));
                  }
                  clearError("model");
                  clearError("brand");
                }}
                error={!!errors.model}
              >
                <option value="">Select model</option>
                {listedModels.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
                {/* Closed lists — 7-Seater / Premium Car, Budget Vans and
                    Premium Vans — omit this by spec. See allowOther. */}
                {allowsOther && <option value={VEHICLE_MODEL_OTHER}>Other (type it in)</option>}
              </StyledSelect>

              {showManualModel && (
                <StyledInput
                  value={model}
                  onChange={(v) => {
                    onModelChange(v);
                    clearError("model");
                  }}
                  placeholder="e.g. Innova Crysta"
                  maxLength={60}
                  error={!!errors.model}
                />
              )}
            </div>
          )}
        </Field>
      </SectionCard>

      <SectionCard
        icon={<FileText size={16} />}
        title="Make & registration"
        subtitle="Shown on the listing and used to verify the vehicle at handover."
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Brand" required error={errors.brand}>
            <StyledInput
              value={brand}
              onChange={(v) => {
                onBrandChange(v);
                clearError("brand");
              }}
              placeholder="e.g. Toyota"
              maxLength={60}
              error={!!errors.brand}
            />
          </Field>
          <Field label="Manufacture year" required error={errors.manufactureYear}>
            <StyledSelect
              value={manufactureYear}
              onChange={(v) => {
                onManufactureYearChange(v);
                clearError("manufactureYear");
              }}
              error={!!errors.manufactureYear}
            >
              <option value="">Select year</option>
              {MANUFACTURE_YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </StyledSelect>
          </Field>
          <Field
            label="Registration number"
            required
            error={errors.registrationNumber}
            help="As printed on the RC — e.g. MH12AB1234."
          >
            <StyledInput
              // Uppercased as the vendor types: plate numbers are compared as
              // strings against the RC at handover, and a lowercase entry here
              // reads as a mismatch to whoever is checking.
              value={registrationNumber}
              onChange={(v) => {
                onRegistrationNumberChange(v.toUpperCase());
                clearError("registrationNumber");
              }}
              placeholder="MH12AB1234"
              maxLength={16}
              error={!!errors.registrationNumber}
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
        kicker="Vehicle Type"
        subtitle="Tell guests what they're booking, and give us the details we need to verify it."
      />
      {body}
    </div>
  );
};

export default VehicleClassStep;
