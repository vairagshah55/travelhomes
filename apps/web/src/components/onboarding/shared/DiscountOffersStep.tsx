import React from "react";
import {
  IndianRupee,
  Percent,
  Tag,
  Award,
  PartyPopper,
  CalendarRange,
  Sparkles,
  Check,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type DiscountOffer } from "./types";
import { ErrorMsg, StepHeader } from "./primitives";
import { iconShellClass, iconShellFocusClass, iconSlotClass } from "./primitives/IconInput";

type OfferKey = "firstUser" | "festival" | "weekly" | "special";

interface DiscountOffersStepProps {
  offers: {
    firstUser: DiscountOffer;
    festival: DiscountOffer;
    weekly: DiscountOffer;
    special: DiscountOffer;
  };
  onToggle: (key: OfferKey) => void;
  onOfferChange: (key: OfferKey, field: keyof DiscountOffer, value: string) => void;
  errors: Record<string, string>;
  weeklyLabel?: string;
  // Hide the StepHeader + centered max-width wrapper when used inside an
  // existing scrollable form (e.g. edit page).
  embedded?: boolean;
}

/**
 * Each offer used to carry its own accent hex — purple / amber / green / rose —
 * and enabling one repainted its border, background, title, icon chip, savings
 * pill and toggle in that colour. Four unrelated saturated hues, none of them
 * brand, which is what made this step look like a different product.
 *
 * Selection state is now the brand teal for all four; per-offer identity is
 * carried by the icon alone. That is also what let the inline styles and the
 * `useState(focused)` below go away — they only existed because the accent was a
 * runtime value that couldn't be written as a Tailwind class.
 *
 * Icons are Lucide, matching the rest of the flow. The emoji they replace
 * rendered as OS-specific colour glyphs that sat oddly beside line icons.
 */
const OFFER_CONFIG: Record<
  OfferKey,
  { Icon: LucideIcon; label: string; description: string }
> = {
  firstUser: {
    Icon: Award,
    label: "First 5 Guests",
    description: "Welcome discount for your very first 5 bookings",
  },
  festival: {
    Icon: PartyPopper,
    label: "Festival Offer",
    description: "Seasonal promotions tied to holidays & festivals",
  },
  weekly: {
    Icon: CalendarRange,
    label: "Weekly / Monthly",
    description: "Savings for guests who stay longer",
  },
  special: {
    Icon: Sparkles,
    label: "Special Offer",
    description: "Custom promotion for any occasion",
  },
};

const Toggle = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
  <button
    type="button"
    onClick={onToggle}
    role="switch"
    aria-checked={enabled}
    className={cn(
      "relative w-[44px] h-[24px] rounded-full border-none cursor-pointer shrink-0",
      "transition-colors duration-200",
      "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[color:var(--th-ring)]",
      enabled ? "bg-th-brand" : "bg-th-warm-border-strong",
    )}
  >
    <span
      className={cn(
        "absolute top-[3px] left-[3px] w-[18px] h-[18px] rounded-full bg-th-surface-0 block",
        "shadow-[0_1px_4px_rgba(10,28,28,0.25)]",
        "transition-transform duration-200 ease-th-spring",
        enabled ? "translate-x-[20px]" : "translate-x-0",
      )}
    />
  </button>
);

const TypeSegment = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <div
    role="group"
    className="flex rounded-[11px] bg-th-warm-surface border border-th-warm-border p-[3px] gap-[3px]"
  >
    {[
      { label: "Percentage", val: "percentage", Icon: Percent },
      { label: "Fixed Amount", val: "fixed", Icon: IndianRupee },
    ].map(({ label, val, Icon }) => {
      const active = value === val;
      return (
        <button
          key={val}
          type="button"
          onClick={() => onChange(val)}
          aria-pressed={active}
          className={cn(
            "flex-1 flex items-center justify-center gap-[6px] h-[36px] rounded-[9px] border",
            "text-[12px] font-bold cursor-pointer tracking-[0.01em]",
            "transition-[background-color,color,border-color,box-shadow] duration-150",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--th-ring)]",
            active
              ? "bg-th-surface-0 border-th-brand-border-soft text-th-brand shadow-[0_1px_3px_rgba(10,28,28,0.08)]"
              : "bg-transparent border-transparent text-th-warm-text-muted hover:text-th-warm-text-dark",
          )}
        >
          <Icon size={12} />
          {label}
        </button>
      );
    })}
  </div>
);

/**
 * Reuses the shared icon-shell classes, so this matches every other field in the
 * flow: white at rest with a visible edge → teal on hover → teal + ring on focus.
 * It previously rested on a grey fill with a transparent border, which is the
 * combination that reads as `disabled`.
 *
 * The `useState(focused)` this used to need is gone with the dynamic colour — CSS
 * :focus-within does the work now (CONVENTIONS Rule 2).
 */
const AmountInput = ({
  value,
  onChange,
  placeholder,
  isPercent,
  error,
  ariaLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  isPercent?: boolean;
  error?: boolean;
  ariaLabel?: string;
}) => (
  <div
    className={cn(
      iconShellClass,
      !error && iconShellFocusClass,
      error &&
        "border-th-error-bright-soft focus-within:shadow-[0_0_0_3px_var(--th-error-bright-ring)]",
    )}
  >
    <div className={cn(iconSlotClass, "px-3 h-[48px]")}>
      {isPercent ? <Percent size={12} /> : <IndianRupee size={12} />}
    </div>
    <input
      type="text"
      inputMode="numeric"
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className="flex-1 h-[48px] px-3 text-[15px] font-semibold text-th-text-primary placeholder:text-th-warm-text-muted placeholder:font-normal bg-transparent border-none outline-none tracking-[-0.01em] min-w-0"
    />
    {isPercent && value && (
      <span className="pr-3 text-[12px] text-th-warm-text-muted font-semibold">%</span>
    )}
  </div>
);

/**
 * Label for the fields revealed when an offer is switched on. Both of those
 * fields are hard-required once enabled (see validateCaravanStep — an enabled
 * offer with a blank value or final price blocks the step), so they carry the
 * same red asterisk as every other mandatory field in the flow. Discount Type is
 * never blank — it defaults to "percentage" — so it isn't marked.
 */
const FieldLabel = ({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) => (
  <label className="text-[11.5px] font-bold text-th-warm-text-dark uppercase tracking-[0.06em]">
    {children}
    {required && (
      <>
        <span aria-hidden="true" className="text-th-error-bright ml-[3px]">
          *
        </span>
        <span className="sr-only"> (required)</span>
      </>
    )}
  </label>
);

const OfferCard = ({
  offerKey,
  customLabel,
  offer,
  onToggle,
  onOfferChange,
  errors,
}: {
  offerKey: OfferKey;
  customLabel?: string;
  offer: DiscountOffer;
  onToggle: () => void;
  onOfferChange: (field: keyof DiscountOffer, value: string) => void;
  errors: Record<string, string>;
}) => {
  const cfg = OFFER_CONFIG[offerKey];
  const label = customLabel ?? cfg.label;

  const valueError =
    errors[`${offerKey}Value`] ??
    (offerKey === "firstUser" ? errors.discountPercentage : undefined);
  const finalPriceError =
    errors[`${offerKey}FinalPrice`] ?? (offerKey === "firstUser" ? errors.finalPrice : undefined);

  const savingsHint =
    offer.enabled && offer.value
      ? offer.type === "percentage"
        ? `Guests save ${offer.value}%`
        : `Guests save ₹${offer.value}`
      : null;

  const { Icon } = cfg;

  return (
    <div
      className={cn(
        "bg-th-surface-0 rounded-[18px] overflow-hidden transition-[border-color,box-shadow] duration-200",
        "border",
        offer.enabled
          ? "border-th-brand shadow-[0_0_0_3px_var(--th-ring)]"
          : "border-[color:var(--onb-card-border)] shadow-[var(--onb-card-shadow)]",
      )}
    >
      <div className="flex items-center justify-between px-5 py-4 gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={cn(
              "w-[42px] h-[42px] rounded-[12px] flex items-center justify-center shrink-0 border",
              "transition-colors duration-200",
              offer.enabled
                ? "bg-th-brand-soft border-th-brand-border-soft text-th-brand"
                : "bg-th-warm-surface border-th-warm-border text-th-warm-text-muted",
            )}
          >
            <Icon size={19} strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p className="text-[13.5px] font-bold tracking-[-0.01em] text-th-text-primary">
              {label}
            </p>
            <p className="text-[11.5px] text-[color:var(--onb-text-secondary,#657477)] mt-[2px]">
              {cfg.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {savingsHint && (
            <span className="hidden sm:inline-block text-[11px] font-bold rounded-full px-[10px] py-[3px] whitespace-nowrap text-th-brand bg-th-brand-soft border border-th-brand-border-soft">
              {savingsHint}
            </span>
          )}
          <Toggle enabled={offer.enabled} onToggle={onToggle} />
        </div>
      </div>

      {offer.enabled && (
        <div className="px-5 pb-5">
          <div className="h-px mb-[18px] bg-th-warm-border" />

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <FieldLabel>Discount Type</FieldLabel>
              <TypeSegment value={offer.type} onChange={(v) => onOfferChange("type", v)} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <FieldLabel required>
                  {offer.type === "percentage" ? "Percentage" : "Fixed Amount"}
                </FieldLabel>
                <AmountInput
                  value={offer.value}
                  onChange={(v) => {
                    if (offer.type === "percentage" && Number(v) > 99) return;
                    onOfferChange("value", v);
                  }}
                  placeholder={offer.type === "percentage" ? "e.g. 20" : "e.g. 500"}
                  isPercent={offer.type === "percentage"}
                  error={!!valueError}
                  ariaLabel={offer.type === "percentage" ? "Discount percentage" : "Discount amount"}
                />
                <ErrorMsg message={valueError} size={11} iconSize={11} marginTop={2} />
              </div>

              <div className="flex flex-col gap-1.5">
                <FieldLabel required>Final Price</FieldLabel>
                <AmountInput
                  value={offer.finalPrice}
                  onChange={(v) => onOfferChange("finalPrice", v)}
                  placeholder="e.g. 1200"
                  error={!!finalPriceError}
                  ariaLabel="Final price after discount"
                />
                <ErrorMsg message={finalPriceError} size={11} iconSize={11} marginTop={2} />
              </div>
            </div>

            {offer.value && offer.finalPrice && (
              <div className="flex items-center gap-2 px-[14px] py-[10px] rounded-[11px] bg-th-success-bright-bg border border-th-success-bright-border">
                {/* Lucide Check, not a ✓ text glyph — the glyph rendered at a
                    different weight and baseline to every other icon here. */}
                <Check
                  size={14}
                  strokeWidth={3}
                  aria-hidden="true"
                  className="shrink-0 text-th-success-bright"
                />
                <span className="text-[12.5px] font-semibold text-th-success-bright">
                  {savingsHint} · Final price ₹{offer.finalPrice}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const DiscountOffersStep: React.FC<DiscountOffersStepProps> = ({
  offers,
  onToggle,
  onOfferChange,
  errors,
  weeklyLabel,
  embedded,
}) => {
  const activeCount = Object.values(offers).filter((o) => o.enabled).length;

  const offerEntries: { offerKey: OfferKey; customLabel?: string }[] = [
    { offerKey: "firstUser" },
    { offerKey: "festival" },
    { offerKey: "weekly", customLabel: weeklyLabel },
    { offerKey: "special" },
  ];

  const cards = (
    <div className="w-full flex flex-col gap-3">
      {offerEntries.map(({ offerKey, customLabel }) => (
        <OfferCard
          key={offerKey}
          offerKey={offerKey}
          customLabel={customLabel}
          offer={offers[offerKey]}
          onToggle={() => onToggle(offerKey)}
          onOfferChange={(field, value) => onOfferChange(offerKey, field, value)}
          errors={errors}
        />
      ))}
    </div>
  );

  const emptyHint = activeCount === 0 && (
    <p className="text-[12px] text-th-warm-text-muted text-center">
      Toggle any offer above to enable it — discounts help your listing get discovered faster.
    </p>
  );

  if (embedded) {
    return (
      <div className="w-full flex flex-col gap-4">
        {cards}
        {emptyHint}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-7 w-full max-w-2xl">
      <StepHeader
        kicker="Discount Offers"
        subtitle="Set up promotional offers to attract more bookings. All optional."
        extra={
          activeCount > 0 ? (
            <div className="flex justify-center mt-1">
              <span className="inline-flex items-center gap-[6px] text-[12px] font-bold text-th-brand bg-th-brand-soft border border-th-brand-border-soft rounded-full px-[14px] py-1">
                <Tag size={11} strokeWidth={2.5} />
                {activeCount} offer{activeCount > 1 ? "s" : ""} active
              </span>
            </div>
          ) : null
        }
      />
      {cards}
      {emptyHint}
    </div>
  );
};

export default DiscountOffersStep;
