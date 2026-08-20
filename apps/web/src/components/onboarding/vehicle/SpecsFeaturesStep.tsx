import React from "react";
import { Fuel, Settings2, Snowflake } from "lucide-react";
import { Field, SectionCard, StepHeader, StyledSelect } from "../shared/primitives";
import FeaturesStep from "../caravan/FeaturesStep";
import { cn } from "@/lib/utils";
import {
  FALLBACK_VEHICLE_FEATURES,
  FUEL_TYPES,
  TRANSMISSIONS,
  type FuelType,
  type Transmission,
} from "./vehicleConfig";

interface SpecsFeaturesStepProps {
  fuelType: FuelType | "";
  transmission: Transmission | "";
  airConditioned: boolean;
  features: string[];
  dynamicFeatures?: any[];
  featuresLoading?: boolean;
  customFeatures: { name: string; icon: any }[];
  showCustomFeaturesInput: boolean;
  customFeatureInput: string;
  errors: Record<string, string>;
  onFuelTypeChange: (value: FuelType) => void;
  onTransmissionChange: (value: Transmission) => void;
  onAirConditionedChange: (value: boolean) => void;
  onToggleFeature: (feature: string) => void;
  onRemoveCustomFeature: (index: number) => void;
  onToggleCustomInput: () => void;
  onCustomFeatureInputChange: (value: string) => void;
  onAddCustomFeature: () => void;
  clearError: (field: string) => void;
  embedded?: boolean;
}

/**
 * Specs + amenities.
 *
 * Fuel, transmission and AC live here as their own controls rather than as
 * entries in the `features` chip list, because the guest search page filters on
 * them. A filter can't reliably match "Automatic" inside a free-form string
 * array that also holds amenity names, so these three are structured fields all
 * the way down to the Offer document.
 */
const SpecsFeaturesStep: React.FC<SpecsFeaturesStepProps> = ({
  fuelType,
  transmission,
  airConditioned,
  features,
  dynamicFeatures,
  featuresLoading,
  customFeatures,
  showCustomFeaturesInput,
  customFeatureInput,
  errors,
  onFuelTypeChange,
  onTransmissionChange,
  onAirConditionedChange,
  onToggleFeature,
  onRemoveCustomFeature,
  onToggleCustomInput,
  onCustomFeatureInputChange,
  onAddCustomFeature,
  clearError,
  embedded,
}) => {
  const body = (
    <div className="w-full flex flex-col gap-4">
      <SectionCard
        icon={<Fuel size={16} />}
        title="Specifications"
        subtitle="Guests filter on these, so they have to be exact."
        required
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Fuel type" required error={errors.fuelType}>
            <StyledSelect
              value={fuelType}
              onChange={(v) => {
                onFuelTypeChange(v as FuelType);
                clearError("fuelType");
              }}
              error={!!errors.fuelType}
            >
              <option value="">Select fuel type</option>
              {FUEL_TYPES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </StyledSelect>
          </Field>

          <Field label="Transmission" required error={errors.transmission}>
            <div className="flex gap-2">
              {TRANSMISSIONS.map((t) => {
                const selected = transmission === t;
                return (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      onTransmissionChange(t);
                      clearError("transmission");
                    }}
                    className={cn(
                      "flex-1 h-[46px] rounded-[12px] border-[1.5px] text-[13.5px] font-semibold cursor-pointer transition-all duration-150",
                      selected
                        ? "border-th-brand bg-th-brand-soft text-th-brand shadow-[0_0_0_3px_var(--th-ring)]"
                        : "border-th-warm-border bg-th-surface-0 text-th-text-primary hover:border-th-brand hover:bg-th-brand-soft",
                    )}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </Field>
        </div>

        <button
          type="button"
          aria-pressed={airConditioned}
          onClick={() => onAirConditionedChange(!airConditioned)}
          className={cn(
            "mt-1 w-full flex items-center gap-3 px-4 py-3.5 rounded-[14px] border-[1.5px] cursor-pointer text-left transition-all duration-150",
            airConditioned
              ? "border-th-brand bg-th-brand-soft"
              : "border-th-warm-border bg-th-surface-0 hover:border-th-brand hover:bg-th-brand-soft",
          )}
        >
          <div
            className={cn(
              "w-9 h-9 rounded-[11px] border-[1.5px] flex items-center justify-center shrink-0 transition-all duration-150",
              airConditioned
                ? "bg-th-brand-soft border-th-brand-border-soft text-th-brand"
                : "bg-th-warm-surface border-th-warm-border text-th-warm-text-dark",
            )}
          >
            <Snowflake size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                "text-[13.5px] font-bold tracking-[-0.01em]",
                airConditioned ? "text-th-brand" : "text-th-text-primary",
              )}
            >
              Air conditioned
            </p>
            <p className="text-[12px] text-th-warm-text-dark leading-[1.5]">
              One of the most-used filters on the search page.
            </p>
          </div>
          <div
            className={cn(
              "w-[42px] h-[24px] rounded-full border-[1.5px] flex items-center px-[2px] shrink-0 transition-all duration-150",
              airConditioned
                ? "bg-th-brand border-th-brand justify-end"
                : "bg-th-warm-surface border-th-warm-border justify-start",
            )}
          >
            <span className="w-[18px] h-[18px] rounded-full bg-th-surface-0 shadow-[0_1px_2px_rgba(0,0,0,0.15)]" />
          </div>
        </button>
      </SectionCard>

      <SectionCard
        icon={<Settings2 size={16} />}
        title="Amenities"
        subtitle="Everything else this vehicle comes with."
        required
      >
        {/* Same CMS contract as the caravan amenity grid (name + uploaded icon),
            so this reuses that step in embedded mode rather than restating it. */}
        <FeaturesStep
          embedded
          fallbackFeatures={FALLBACK_VEHICLE_FEATURES}
          features={features}
          dynamicFeatures={dynamicFeatures}
          featuresLoading={featuresLoading}
          customFeatures={customFeatures}
          showCustomFeaturesInput={showCustomFeaturesInput}
          customFeatureInput={customFeatureInput}
          onToggleFeature={onToggleFeature}
          onRemoveCustomFeature={onRemoveCustomFeature}
          onToggleCustomInput={onToggleCustomInput}
          onCustomFeatureInputChange={onCustomFeatureInputChange}
          onAddCustomFeature={onAddCustomFeature}
        />
      </SectionCard>
    </div>
  );

  if (embedded) return body;

  return (
    <div className="w-full flex flex-col gap-6">
      <StepHeader
        kicker="Specs & Amenities"
        subtitle="The details guests search by, and what's on board."
      />
      {body}
    </div>
  );
};

export default SpecsFeaturesStep;
