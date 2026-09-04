import React from "react";
import { MoreHorizontal, Plus, X } from "lucide-react";
import { StepHeader } from "../shared/primitives";
import { sortFeatureRows } from "@/lib/cmsFeatures";
import { cn } from "@/lib/utils";
import { FeatureIcon } from "@/components/features/featureIcons";
import { FALLBACK_CARAVAN_FEATURES } from "./caravanConfig";

interface CustomFeature {
  name: string;
  icon: any;
}

interface FeaturesStepProps {
  features: string[];
  /**
   * Camper Van feature rows from CMS → Features → Camper Van → Features.
   * When empty (admin hasn't added any) the built-in list below is used so the
   * step is never blank.
   */
  dynamicFeatures?: any[];
  /** Suppresses the fallback list while the CMS query is still in flight. */
  featuresLoading?: boolean;
  customFeatures: CustomFeature[];
  showCustomFeaturesInput: boolean;
  customFeatureInput: string;
  onToggleFeature: (feature: string) => void;
  onRemoveCustomFeature: (index: number) => void;
  onToggleCustomInput: () => void;
  onCustomFeatureInputChange: (value: string) => void;
  onAddCustomFeature: () => void;
  // Hide the kicker/title/subtitle and centered wrapper when used inside an
  // existing scrollable form (e.g. edit page).
  embedded?: boolean;
  // Overrides the built-in list used when the CMS has no rows yet. Without it
  // a vehicle-rental vendor is offered caravan amenities — bunk beds, a geyser,
  // a gas stove — none of which belong in a car.
  fallbackFeatures?: string[];
}

const ICON_SIZE = 17;

/**
 * Fallback amenity list — used only until an admin adds Camper Van features in
 * CMS. Order and wording match the canonical list seeded by
 * Server/scripts/seed-caravan-features.js.
 */
const FALLBACK_FEATURES: string[] = FALLBACK_CARAVAN_FEATURES;

interface Amenity {
  key: string;
  name: string;
  /** Uploaded icon path/URL from the CMS — takes precedence over the glyph. */
  icon?: string;
}

/** CMS rows → pills, in the admin-defined display order (see sortFeatureRows). */
function fromCms(rows: any[]): Amenity[] {
  return sortFeatureRows(
    rows.filter((r) => r && r.name && (r.status ? r.status === "enable" : true)),
  ).map((r) => ({
    key: String(r.id || r._id || r.name),
    name: String(r.name),
    icon: r.icon || "",
  }));
}

const FeaturesStep: React.FC<FeaturesStepProps> = ({
  features,
  dynamicFeatures,
  featuresLoading,
  customFeatures,
  showCustomFeaturesInput,
  customFeatureInput,
  onToggleFeature,
  onRemoveCustomFeature,
  onToggleCustomInput,
  onCustomFeatureInputChange,
  onAddCustomFeature,
  embedded,
  fallbackFeatures,
}) => {
  const selectedCount = features.length + customFeatures.length;

  const amenities = React.useMemo<Amenity[]>(() => {
    const fromAdmin = fromCms(dynamicFeatures || []);
    const fallback = fallbackFeatures ?? FALLBACK_FEATURES;
    const base = fromAdmin.length > 0 ? fromAdmin : fallback.map((name) => ({ key: name, name }));

    // An amenity saved on the listing that the admin has since renamed,
    // disabled or deleted would otherwise disappear from the grid — and get
    // dropped from the listing the next time the vendor saves. Keep it.
    const known = new Set(base.map((a) => a.name));
    const orphans = features
      .filter((f) => f && !known.has(f))
      .map((name) => ({ key: `saved:${name}`, name }));

    return orphans.length ? [...base, ...orphans] : base;
  }, [dynamicFeatures, features]);

  const showSkeleton = featuresLoading && !(dynamicFeatures && dynamicFeatures.length > 0);

  const grid = (
    <div className="w-full bg-th-surface-0 border-[1.5px] border-th-warm-border rounded-[20px] px-[22px] pt-5 pb-[22px] shadow-[0_2px_12px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.03)]">
      {/* Selected count badge */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px] font-bold text-th-warm-text-dark uppercase tracking-[0.03em]">
          Features
        </p>
        {selectedCount > 0 && (
          <span className="text-[11px] font-bold text-th-brand bg-th-brand-soft border border-th-brand-border-soft rounded-full px-[10px] py-[2px]">
            {selectedCount} selected
          </span>
        )}
      </div>

      {showSkeleton ? (
        <div className="flex flex-wrap gap-2.5">
          {Array.from({ length: 14 }, (_, i) => (
            <div
              key={i}
              className="h-[38px] rounded-full border-[1.5px] border-th-warm-border bg-th-warm-surface animate-pulse"
              style={{ width: `${90 + ((i * 37) % 80)}px` }}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2.5">
          {amenities.map((amenity) => {
            const selected = features.includes(amenity.name);
            return (
              <button
                key={amenity.key}
                type="button"
                onClick={() => onToggleFeature(amenity.name)}
                className={cn(
                  "flex items-center gap-2 px-[14px] py-2 rounded-full border-[1.5px] cursor-pointer transition-all duration-150",
                  selected
                    ? "border-th-brand bg-th-brand-soft text-th-brand shadow-[0_0_0_3px_var(--th-ring)]"
                    : "border-th-warm-border bg-th-warm-surface text-th-warm-text-dark hover:border-th-brand hover:bg-th-brand-soft hover:text-th-brand",
                )}
              >
                {/* Admin-uploaded icon when there is one, glyph otherwise. A
                    broken image URL falls back to the glyph rather than showing
                    the browser's broken-image marker. */}
                <span
                  className={cn(
                    "flex items-center",
                    selected ? "text-th-brand" : "text-th-warm-text-muted",
                  )}
                >
                  {/* The local ICON_BY_NAME map that used to back `glyphFor`
                      moved to `components/features/featureIcons` so the stays
                      and activity steps get the same fallback — they had none,
                      and rendered an empty box for every pill. FeatureIcon also
                      handles the img-failed case that the old inline
                      `onError` + hidden-sibling dance covered here. */}
                  <FeatureIcon icon={amenity.icon} name={amenity.name} size={ICON_SIZE} />
                </span>
                <span className="text-[13px] font-semibold tracking-[-0.01em]">{amenity.name}</span>
              </button>
            );
          })}

          {/* Others button — the "Other (can add manually)" affordance */}
          <button
            type="button"
            onClick={onToggleCustomInput}
            className={cn(
              "flex items-center gap-2 px-[14px] py-2 rounded-full border-[1.5px] cursor-pointer transition-all duration-150",
              showCustomFeaturesInput
                ? "border-th-brand bg-th-brand-soft text-th-brand shadow-[0_0_0_3px_var(--th-ring)]"
                : "border-th-warm-border bg-th-warm-surface text-th-warm-text-dark hover:border-th-brand hover:bg-th-brand-soft hover:text-th-brand",
            )}
          >
            <Plus
              size={15}
              className={showCustomFeaturesInput ? "text-th-brand" : "text-th-warm-text-muted"}
            />
            <span className="text-[13px] font-semibold tracking-[-0.01em]">Others</span>
          </button>
          {/* Custom features, AFTER the Others button that creates them.
              They used to sit before it, so a vendor who added one watched it
              appear in the middle of the row rather than where they were
              looking. Newest-last also keeps the list stable: the add
              affordance no longer shifts right with every addition. */}
          {customFeatures.map((cf, idx) => (
            <button
              key={`custom-${idx}`}
              type="button"
              onClick={() => onRemoveCustomFeature(idx)}
              className="flex items-center gap-2 px-[14px] py-2 rounded-full border-[1.5px] border-th-brand bg-th-brand-soft shadow-[0_0_0_3px_var(--th-ring)] cursor-pointer text-th-brand"
            >
              <MoreHorizontal size={15} />
              <span className="text-[13px] font-semibold tracking-[-0.01em]">{cf.name}</span>
              <X size={13} className="ml-0.5 opacity-70" />
            </button>
          ))}
        </div>
      )}

      {/* Custom feature input */}
      {showCustomFeaturesInput && (
        <div className="flex gap-2 mt-4">
          <input
            type="text"
            value={customFeatureInput}
            onChange={(e) => onCustomFeatureInputChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && onAddCustomFeature()}
            placeholder="e.g. Roof Rack, Outdoor Shower…"
            maxLength={50}
            className={cn(
              "flex-1 h-[46px] px-[14px] text-[13.5px] text-th-text-primary",
              "bg-th-warm-surface border-[1.5px] border-th-warm-border rounded-[12px]",
              "outline-none transition-[border-color,box-shadow,background-color] duration-150",
              "focus:border-th-brand focus:shadow-[0_0_0_3px_var(--th-ring)] focus:bg-th-surface-0",
            )}
          />
          <button
            type="button"
            onClick={onAddCustomFeature}
            disabled={!customFeatureInput.trim() || customFeatures.length >= 20}
            className={cn(
              "h-[46px] px-5 rounded-[12px] border-none text-[13px] font-bold tracking-[0.01em] transition-all duration-150",
              !customFeatureInput.trim()
                ? "bg-th-warm-border text-th-warm-text-muted cursor-not-allowed"
                : "bg-th-brand text-th-text-inverse cursor-pointer",
            )}
          >
            Add
          </button>
        </div>
      )}
    </div>
  );

  if (embedded) return grid;

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Shared StepHeader — see the note in CategoryStep; this file carried a
          byte-identical copy of the same hand-rolled centred heading. */}
      <StepHeader
        kicker="Amenities"
        subtitle="Select all features and amenities available to guests."
      />
      {grid}
    </div>
  );
};

export default FeaturesStep;
