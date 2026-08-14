import React from "react";
import { StepHeader } from "../shared/primitives";
import { sortFeatureRows } from "@/lib/cmsFeatures";
import { cn, getImageUrl } from "@/lib/utils";

interface CategoryStepProps {
  category: string | null;
  /**
   * Camper Van `type: "category"` rows from CMS → Features → Categories.
   * When empty (admin hasn't added any yet) the built-in list below is used so
   * onboarding is never a dead end.
   */
  dynamicCategories?: any[];
  /** Suppresses the fallback list while the CMS query is still in flight. */
  categoriesLoading?: boolean;
  onSelect: (categoryName: string) => void;
  // Hide the kicker/title/subtitle and centered wrapper when used inside
  // an existing scrollable form (e.g. edit page).
  embedded?: boolean;
}

interface VehicleType {
  key: string;
  name: string;
  description: string;
  /** Uploaded icon path/URL from the CMS — takes precedence over the emoji. */
  icon?: string;
  emoji: string;
}

/**
 * Used until an admin adds Camper Van categories, and to supply an emoji for a
 * CMS category that has no icon uploaded yet (matched on name, case-insensitive).
 */
const FALLBACK_CATEGORIES: Omit<VehicleType, "key">[] = [
  {
    name: "Motorhome",
    emoji: "🏠",
    description:
      "A large vehicle with everything you need to travel, sleep, cook, and relax inside.",
  },
  {
    name: "Campervan / Caravan",
    emoji: "🚐",
    description:
      "A compact travel vehicle with basic facilities for sleeping, sitting, and enjoying road trips.",
  },
  {
    name: "Travel Trailer",
    emoji: "🚋",
    description:
      "A caravan without an engine that is attached to another vehicle and towed during travel.",
  },
  {
    name: "Off Road Caravan",
    emoji: "🚙",
    description:
      "A strong and durable caravan designed for travelling on rough roads and adventurous destinations.",
  },
  {
    name: "Mini Caravan",
    emoji: "🚕",
    description:
      "A small and easy-to-handle caravan, perfect for couples or small families and short trips.",
  },
];

// Emoji lookup for CMS categories with no uploaded icon. Covers the fallback
// names plus the older hardcoded taxonomy, so listings created before this step
// went CMS-driven still show a sensible glyph.
const EMOJI_BY_NAME: Record<string, string> = {
  ...Object.fromEntries(FALLBACK_CATEGORIES.map((c) => [c.name.toLowerCase(), c.emoji])),
  "panel van": "🚐",
  "cargo van": "🚚",
  rv: "🚌",
  "camper trailer": "⛺",
  campervan: "🚐",
  caravan: "🚋",
};

const DEFAULT_EMOJI = "🚐";

const emojiFor = (name: string) => EMOJI_BY_NAME[name.trim().toLowerCase()] || DEFAULT_EMOJI;

/**
 * CMS rows → the shape this step renders, in the admin-defined display order
 * (see sortFeatureRows).
 */
function fromCms(rows: any[]): VehicleType[] {
  return sortFeatureRows(rows.filter((r) => r && r.name && (r.status ? r.status === "enable" : true)))
    .map((r) => ({
      key: String(r.id || r._id || r.name),
      name: String(r.name),
      description: r.description || "",
      icon: r.icon || "",
      emoji: emojiFor(String(r.name)),
    }));
}

const CategoryStep: React.FC<CategoryStepProps> = ({
  category,
  dynamicCategories,
  categoriesLoading,
  onSelect,
  embedded,
}) => {
  const categories = React.useMemo<VehicleType[]>(() => {
    const fromAdmin = fromCms(dynamicCategories || []);
    const base =
      fromAdmin.length > 0
        ? fromAdmin
        : FALLBACK_CATEGORIES.map((c) => ({ ...c, key: c.name }));

    // A listing saved under a category the admin has since renamed, disabled or
    // deleted would otherwise render as "nothing selected" — and silently lose
    // its category the moment the vendor saves. Keep it in the list instead.
    if (category && !base.some((c) => c.name === category)) {
      return [
        ...base,
        { key: `current:${category}`, name: category, description: "", emoji: emojiFor(category) },
      ];
    }
    return base;
  }, [dynamicCategories, category]);

  const showSkeleton = categoriesLoading && !(dynamicCategories && dynamicCategories.length > 0);

  const list = showSkeleton ? (
    <div className="w-full flex flex-col gap-3">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="h-[86px] rounded-[16px] border-[1.5px] border-th-warm-border bg-th-warm-surface animate-pulse"
        />
      ))}
    </div>
  ) : (
    <div className="w-full flex flex-col gap-3">
      {categories.map((cat) => {
        const selected = category === cat.name;
        return (
          <button
            key={cat.key}
            type="button"
            onClick={() => onSelect(cat.name)}
            className={cn(
              "w-full flex items-center gap-4 px-[18px] py-4 rounded-[16px] border-[1.5px] cursor-pointer text-left transition-all duration-150",
              selected
                ? "border-th-brand bg-th-brand-soft shadow-[0_0_0_3px_var(--th-ring),0_2px_12px_rgba(0,0,0,0.04)]"
                : "border-th-warm-border bg-th-surface-0 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:border-th-brand hover:bg-th-brand-soft",
            )}
          >
            {/* Icon — admin-uploaded image when there is one, emoji otherwise.
                A broken image URL falls back to the emoji rather than showing
                the browser's broken-image glyph. */}
            <div
              className={cn(
                "w-12 h-12 rounded-[14px] border-[1.5px] flex items-center justify-center text-[22px] shrink-0 transition-all duration-150 overflow-hidden",
                selected
                  ? "bg-th-brand-soft border-th-brand-border-soft"
                  : "bg-th-warm-surface border-th-warm-border",
              )}
            >
              {cat.icon ? (
                <img
                  src={getImageUrl(cat.icon)}
                  alt=""
                  className="w-7 h-7 object-contain"
                  onError={(e) => {
                    const el = e.currentTarget;
                    el.style.display = "none";
                    const sib = el.nextElementSibling as HTMLElement | null;
                    if (sib) sib.style.display = "";
                  }}
                />
              ) : null}
              <span style={cat.icon ? { display: "none" } : undefined} aria-hidden="true">
                {cat.emoji}
              </span>
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
              <p
                className={cn(
                  "text-[14px] font-bold tracking-[-0.01em] transition-colors duration-150",
                  cat.description && "mb-[3px]",
                  selected ? "text-th-brand" : "text-th-text-primary",
                )}
              >
                {cat.name}
              </p>
              {cat.description && (
                <p className="text-[12.5px] text-th-warm-text-dark leading-[1.55] font-normal">
                  {cat.description}
                </p>
              )}
            </div>

            {/* Selection indicator */}
            <div
              className={cn(
                "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-150",
                selected ? "border-th-brand bg-th-brand" : "border-th-warm-border bg-transparent",
              )}
            >
              {selected && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M2 5l2.5 2.5L8 3"
                    stroke="currentColor"
                    className="text-th-text-inverse"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );

  if (embedded) return list;

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Uses the shared StepHeader so this step matches the rest of the flow.
          It previously hand-rolled a centred, dash-flanked heading with its own
          inline clamp() font-size — which is why it kept the old look after the
          shared header was reworked. */}
      <StepHeader kicker="Vehicle Type" subtitle="Select the type that best describes your vehicle." />
      {list}
    </div>
  );
};

export default CategoryStep;
