import React from "react";
import { IndianRupee, Percent, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { type DiscountOffer } from "./types";
import {
  ErrorMsg,
  StepHeader,
} from "./primitives";

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

const OFFER_CONFIG: Record<
  OfferKey,
  { emoji: string; label: string; description: string; color: string; bg: string }
> = {
  firstUser: {
    emoji: "🎖️",
    label: "First 5 Guests",
    description: "Welcome discount for your very first 5 bookings",
    color: "#8b5cf6",
    bg: "rgba(139,92,246,0.06)",
  },
  festival: {
    emoji: "🎉",
    label: "Festival Offer",
    description: "Seasonal promotions tied to holidays & festivals",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.06)",
  },
  weekly: {
    emoji: "📅",
    label: "Weekly / Monthly",
    description: "Savings for guests who stay longer",
    color: "#10b981",
    bg: "rgba(16,185,129,0.06)",
  },
  special: {
    emoji: "⭐",
    label: "Special Offer",
    description: "Custom promotion for any occasion",
    color: "#f43f5e",
    bg: "rgba(244,63,94,0.06)",
  },
};

const Toggle = ({
  enabled,
  onToggle,
  color,
}: {
  enabled: boolean;
  onToggle: () => void;
  color: string;
}) => (
  <button
    type="button"
    onClick={onToggle}
    role="switch"
    aria-checked={enabled}
    style={{
      backgroundColor: enabled ? color : undefined,
      boxShadow: enabled ? `0 0 0 3px ${color}22` : "none",
    }}
    className={cn(
      "relative w-[44px] h-[24px] rounded-full border-none cursor-pointer flex-shrink-0 transition-colors duration-[250ms]",
      !enabled && "bg-th-warm-border",
    )}
  >
    <span
      style={{
        transform: enabled ? "translateX(20px)" : "translateX(0)",
        transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1)",
      }}
      className="absolute top-[3px] left-[3px] w-[18px] h-[18px] rounded-full bg-th-surface-0 shadow-[0_1px_4px_rgba(0,0,0,0.2)] block"
    />
  </button>
);

const TypeSegment = ({
  value,
  onChange,
  color,
}: {
  value: string;
  onChange: (v: string) => void;
  color: string;
}) => (
  <div className="flex rounded-[11px] bg-th-warm-surface p-[3px] gap-[3px]">
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
          style={{
            ...(active
              ? { border: `1.5px solid ${color}30`, color, boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }
              : { border: "1.5px solid transparent" }),
          }}
          className={cn(
            "flex-1 flex items-center justify-center gap-[6px] h-[36px] rounded-[9px]",
            "text-[12px] font-bold cursor-pointer tracking-[0.01em]",
            "transition-[background-color,color,border-color,box-shadow] duration-150",
            active ? "bg-th-surface-0" : "bg-transparent text-th-warm-text-muted",
          )}
        >
          <Icon size={12} />
          {label}
        </button>
      );
    })}
  </div>
);

const AmountInput = ({
  value,
  onChange,
  placeholder,
  isPercent,
  color,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  isPercent?: boolean;
  color: string;
  error?: boolean;
}) => {
  // focused state is kept because border/bg/shadow use the dynamic `color` prop
  // which can't be expressed as a static Tailwind class
  const [focused, setFocused] = React.useState(false);
  return (
    <div
      style={
        error
          ? {}
          : {
              border: `1.5px solid ${focused ? color : "transparent"}`,
              backgroundColor: focused ? "#ffffff" : undefined,
              boxShadow: focused
                ? `0 0 0 3px ${color}22, 0 1px 4px rgba(0,0,0,0.06)`
                : undefined,
            }
      }
      className={cn(
        "flex items-center rounded-[12px] overflow-hidden transition-all duration-150",
        error
          ? "border-[1.5px] border-th-error-bright-soft bg-th-error-bright-bg shadow-[0_0_0_3px_var(--th-error-bright-ring)]"
          : !focused
            ? "bg-th-warm-surface"
            : undefined,
      )}
    >
      <div
        style={
          focused
            ? { borderRight: `1.5px solid ${color}30`, backgroundColor: `${color}12` }
            : {}
        }
        className={cn(
          "flex items-center px-[10px] h-[46px] flex-shrink-0 transition-all duration-150",
          !focused && "border-r border-th-warm-border bg-th-warm-surface",
        )}
      >
        {isPercent ? (
          <Percent
            size={12}
            style={{ color: focused ? color : undefined }}
            className={cn(!focused && "text-th-warm-text-muted")}
          />
        ) : (
          <IndianRupee
            size={12}
            style={{ color: focused ? color : undefined }}
            className={cn(!focused && "text-th-warm-text-muted")}
          />
        )}
      </div>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className={cn(
          "flex-1 h-[46px] px-3 text-[15px] font-semibold bg-transparent border-none outline-none tracking-[-0.01em] min-w-0",
          value ? "text-th-text-primary" : "text-th-warm-text-muted",
        )}
      />
      {isPercent && (
        <span
          className="pr-3 text-[12px] text-th-warm-text-muted font-semibold transition-opacity duration-150"
          style={{ opacity: value ? 1 : 0 }}
        >
          %
        </span>
      )}
    </div>
  );
};

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

  return (
    <div
      style={{
        ...(offer.enabled ? { border: `1.5px solid ${cfg.color}` } : {}),
        boxShadow: offer.enabled
          ? `0 0 0 3px ${cfg.color}18, 0 2px 12px rgba(0,0,0,0.04)`
          : "0 2px 12px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)",
      }}
      className={cn(
        "bg-th-surface-0 rounded-[20px] overflow-hidden transition-all duration-200",
        !offer.enabled && "border-[1.5px] border-th-warm-border",
      )}
    >
      <div
        style={{ backgroundColor: offer.enabled ? cfg.bg : undefined }}
        className={cn(
          "flex items-center justify-between px-5 py-4 transition-colors duration-200",
          !offer.enabled && "bg-th-surface-0",
        )}
      >
        <div className="flex items-center gap-3">
          <div
            style={
              offer.enabled
                ? { backgroundColor: `${cfg.color}18`, border: `1.5px solid ${cfg.color}30` }
                : {}
            }
            className={cn(
              "w-[42px] h-[42px] rounded-[13px] flex items-center justify-center text-[20px] flex-shrink-0 transition-all duration-200",
              !offer.enabled && "bg-th-warm-surface border-[1.5px] border-th-warm-border",
            )}
          >
            {cfg.emoji}
          </div>
          <div>
            <p
              style={{ color: offer.enabled ? cfg.color : undefined }}
              className={cn(
                "text-[13.5px] font-bold tracking-[-0.01em] transition-colors duration-200",
                !offer.enabled && "text-th-text-primary",
              )}
            >
              {label}
            </p>
            <p className="text-[11.5px] text-th-warm-text-dark mt-[2px]">{cfg.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
          {savingsHint && (
            <span
              style={{
                color: cfg.color,
                backgroundColor: `${cfg.color}14`,
                border: `1px solid ${cfg.color}30`,
              }}
              className="text-[11px] font-bold rounded-full px-[10px] py-[3px] whitespace-nowrap"
            >
              {savingsHint}
            </span>
          )}
          <Toggle enabled={offer.enabled} onToggle={onToggle} color={cfg.color} />
        </div>
      </div>

      {offer.enabled && (
        <div
          style={{ backgroundColor: cfg.bg }}
          className="px-5 pb-5"
        >
          <div
            style={{ backgroundColor: `${cfg.color}25` }}
            className="h-px mb-[18px]"
          />

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-th-warm-text-dark uppercase tracking-[0.04em]">
                Discount Type
              </label>
              <TypeSegment
                value={offer.type}
                onChange={(v) => onOfferChange("type", v)}
                color={cfg.color}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-th-warm-text-dark uppercase tracking-[0.04em]">
                  {offer.type === "percentage" ? "Percentage" : "Fixed Amount"}
                </label>
                <AmountInput
                  value={offer.value}
                  onChange={(v) => {
                    if (offer.type === "percentage" && Number(v) > 99) return;
                    onOfferChange("value", v);
                  }}
                  placeholder={offer.type === "percentage" ? "e.g. 20" : "e.g. 500"}
                  isPercent={offer.type === "percentage"}
                  color={cfg.color}
                  error={!!valueError}
                />
                <ErrorMsg message={valueError} size={11} iconSize={11} marginTop={2} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-th-warm-text-dark uppercase tracking-[0.04em]">
                  Final Price
                </label>
                <AmountInput
                  value={offer.finalPrice}
                  onChange={(v) => onOfferChange("finalPrice", v)}
                  placeholder="e.g. 1200"
                  color={cfg.color}
                  error={!!finalPriceError}
                />
                <ErrorMsg message={finalPriceError} size={11} iconSize={11} marginTop={2} />
              </div>
            </div>

            {offer.value && offer.finalPrice && (
              <div
                style={{
                  backgroundColor: `${cfg.color}10`,
                  border: `1px solid ${cfg.color}25`,
                }}
                className="flex items-center gap-2 px-[14px] py-[10px] rounded-[11px]"
              >
                <span className="text-[16px]">✓</span>
                <span
                  style={{ color: cfg.color }}
                  className="text-[12.5px] font-semibold"
                >
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
        kicker="Promotions"
        title="Discount Offers"
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
