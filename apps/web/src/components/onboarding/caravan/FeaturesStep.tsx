import React from "react";
import {
  Accessibility,
  Archive,
  Armchair,
  Bandage,
  Bath,
  BatteryCharging,
  Bed,
  BedDouble,
  BedSingle,
  Bike,
  Cable,
  Camera,
  Cctv,
  CookingPot,
  Droplets,
  Fan,
  FireExtinguisher,
  Flame,
  GlassWater,
  Layers,
  Lightbulb,
  LocateFixed,
  Microwave,
  MoreHorizontal,
  PawPrint,
  Plus,
  RectangleVertical,
  Refrigerator,
  Shirt,
  Sofa,
  Sparkles,
  Speaker,
  Sun,
  Table,
  Thermometer,
  Toilet,
  Tv2,
  Umbrella,
  UtensilsCrossed,
  Wifi,
  Wind,
  X,
  Zap,
} from "lucide-react";
import { StepHeader } from "../shared/primitives";
import { sortFeatureRows } from "@/lib/cmsFeatures";
import { cn, getImageUrl } from "@/lib/utils";

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
}

const ICON_SIZE = 17;

/**
 * Glyph per amenity name, used when the CMS row has no uploaded icon (and for
 * the whole fallback list). Keys are lowercased names. Anything unmatched gets
 * `Sparkles`, so an admin can add an amenity we've never heard of and it still
 * renders as a proper pill.
 */
const ICON_BY_NAME: Record<string, React.ReactNode> = {
  // Climate
  "air conditioning": <Wind size={ICON_SIZE} />,
  heating: <Flame size={ICON_SIZE} />,
  insulation: <Thermometer size={ICON_SIZE} />,
  fan: <Fan size={ICON_SIZE} />,

  // Seating & storage
  "sofa / lounge seating": <Sofa size={ICON_SIZE} />,
  "recliner seats": <Armchair size={ICON_SIZE} />,
  "storage cabinets": <Archive size={ICON_SIZE} />,

  // Sleeping
  "double bed": <BedDouble size={ICON_SIZE} />,
  "single beds": <BedSingle size={ICON_SIZE} />,
  "bunk beds": <Layers size={ICON_SIZE} />,
  "sofa cum bed": <Sofa size={ICON_SIZE} />,
  "sleeping beds": <BedDouble size={ICON_SIZE} />,
  pillows: <Bed size={ICON_SIZE} />,
  blankets: <Shirt size={ICON_SIZE} />,

  // Kitchen
  "induction stove / gas stove": <CookingPot size={ICON_SIZE} />,
  microwave: <Microwave size={ICON_SIZE} />,
  refrigerator: <Refrigerator size={ICON_SIZE} />,
  "basic kitchen utensils": <UtensilsCrossed size={ICON_SIZE} />,
  "kitchen / cooking area": <UtensilsCrossed size={ICON_SIZE} />,

  // Bathroom
  bathroom: <Bath size={ICON_SIZE} />,
  toilet: <Toilet size={ICON_SIZE} />,
  "bathroom / toilet": <Bath size={ICON_SIZE} />,
  "hot water / geyser": <Droplets size={ICON_SIZE} />,
  shower: <Droplets size={ICON_SIZE} />,
  "wash basin": <Droplets size={ICON_SIZE} />,
  mirror: <RectangleVertical size={ICON_SIZE} />,
  toiletries: <Bandage size={ICON_SIZE} />,

  // Entertainment & connectivity
  tv: <Tv2 size={ICON_SIZE} />,
  "tv / entertainment": <Tv2 size={ICON_SIZE} />,
  "wi-fi": <Wifi size={ICON_SIZE} />,
  "wi-fi / internet": <Wifi size={ICON_SIZE} />,
  speaker: <Speaker size={ICON_SIZE} />,

  // Power
  "charging points": <Cable size={ICON_SIZE} />,
  generator: <Zap size={ICON_SIZE} />,
  "power backup": <BatteryCharging size={ICON_SIZE} />,
  "solar power": <Sun size={ICON_SIZE} />,
  "exterior lights": <Lightbulb size={ICON_SIZE} />,
  lighting: <Lightbulb size={ICON_SIZE} />,

  // Safety
  "drinking water facility": <GlassWater size={ICON_SIZE} />,
  "fire extinguisher": <FireExtinguisher size={ICON_SIZE} />,
  "first aid kit": <Bandage size={ICON_SIZE} />,
  cctv: <Cctv size={ICON_SIZE} />,
  "gps tracking": <LocateFixed size={ICON_SIZE} />,

  // Outdoor
  awning: <Umbrella size={ICON_SIZE} />,
  "outdoor kitchen": <CookingPot size={ICON_SIZE} />,
  bbq: <Flame size={ICON_SIZE} />,
  "rooftop terrace": <Sun size={ICON_SIZE} />,
  "camping chairs": <Armchair size={ICON_SIZE} />,
  "camping table": <Table size={ICON_SIZE} />,
  "bike rack": <Bike size={ICON_SIZE} />,

  // Access & policies
  "wheelchair accessible": <Accessibility size={ICON_SIZE} />,
  "pet friendly": <PawPrint size={ICON_SIZE} />,
  "photo / video shoot allowed": <Camera size={ICON_SIZE} />,
};

const glyphFor = (name: string) =>
  ICON_BY_NAME[name.trim().toLowerCase()] ?? <Sparkles size={ICON_SIZE} />;

/**
 * Fallback amenity list — used only until an admin adds Camper Van features in
 * CMS. Order and wording match the canonical list seeded by
 * Server/scripts/seed-caravan-features.js.
 */
const FALLBACK_FEATURES: string[] = [
  "Air Conditioning",
  "Heating",
  "Sofa / Lounge Seating",
  "Recliner Seats",
  "Storage Cabinets",
  "Double Bed",
  "Single Beds",
  "Bunk Beds",
  "Sofa Cum Bed",
  "Pillows",
  "Blankets",
  "Induction Stove / Gas Stove",
  "Microwave",
  "Refrigerator",
  "Basic Kitchen Utensils",
  "Bathroom",
  "Toilet",
  "Hot Water / Geyser",
  "Wash Basin",
  "Mirror",
  "Toiletries",
  "TV",
  "Wi-Fi",
  "Speaker",
  "Charging Points",
  "Generator",
  "Power Backup",
  "Exterior Lights",
  "Drinking Water Facility",
  "Fire Extinguisher",
  "First Aid Kit",
  "CCTV",
  "GPS Tracking",
  "Awning",
  "Outdoor Kitchen",
  "BBQ",
  "Rooftop Terrace",
  "Camping Chairs",
  "Camping Table",
  "Wheelchair Accessible",
];

interface Amenity {
  key: string;
  name: string;
  /** Uploaded icon path/URL from the CMS — takes precedence over the glyph. */
  icon?: string;
}

/** CMS rows → pills, in the admin-defined display order (see sortFeatureRows). */
function fromCms(rows: any[]): Amenity[] {
  return sortFeatureRows(rows.filter((r) => r && r.name && (r.status ? r.status === "enable" : true)))
    .map((r) => ({
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
}) => {
  const selectedCount = features.length + customFeatures.length;

  const amenities = React.useMemo<Amenity[]>(() => {
    const fromAdmin = fromCms(dynamicFeatures || []);
    const base = fromAdmin.length > 0 ? fromAdmin : FALLBACK_FEATURES.map((name) => ({ key: name, name }));

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
                  {amenity.icon ? (
                    <>
                      <img
                        src={getImageUrl(amenity.icon)}
                        alt=""
                        className="w-[17px] h-[17px] object-contain"
                        onError={(e) => {
                          const el = e.currentTarget;
                          el.style.display = "none";
                          const sib = el.nextElementSibling as HTMLElement | null;
                          if (sib) sib.style.display = "";
                        }}
                      />
                      <span style={{ display: "none" }}>{glyphFor(amenity.name)}</span>
                    </>
                  ) : (
                    glyphFor(amenity.name)
                  )}
                </span>
                <span className="text-[13px] font-semibold tracking-[-0.01em]">{amenity.name}</span>
              </button>
            );
          })}

          {/* Custom features (added by user) */}
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
