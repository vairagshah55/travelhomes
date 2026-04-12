import React from "react";
import { IndianRupee, Percent } from "lucide-react";
import { type DiscountOffer } from "./types";

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
}

// Per-offer visual config
const OFFER_CONFIG: Record<
  OfferKey,
  { emoji: string; label: string; description: string; color: string; bg: string; darkBg: string }
> = {
  firstUser: {
    emoji: "🎖️",
    label: "First 5 Guests",
    description: "Welcome discount for your very first 5 bookings",
    color: "#8b5cf6",
    bg: "#f5f3ff",
    darkBg: "rgba(139,92,246,0.08)",
  },
  festival: {
    emoji: "🎉",
    label: "Festival Offer",
    description: "Seasonal promotions tied to holidays & festivals",
    color: "#f59e0b",
    bg: "#fffbeb",
    darkBg: "rgba(245,158,11,0.08)",
  },
  weekly: {
    emoji: "📅",
    label: "Weekly / Monthly",
    description: "Savings for guests who stay longer",
    color: "#10b981",
    bg: "#f0fdf4",
    darkBg: "rgba(16,185,129,0.08)",
  },
  special: {
    emoji: "⭐",
    label: "Special Offer",
    description: "Custom promotion for any occasion",
    color: "#ef4444",
    bg: "#fef2f2",
    darkBg: "rgba(239,68,68,0.08)",
  },
};

// Smooth iOS-style toggle
const Toggle: React.FC<{ enabled: boolean; onToggle: () => void; color: string }> = ({
  enabled,
  onToggle,
  color,
}) => (
  <button
    type="button"
    onClick={onToggle}
    className="relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-300 focus:outline-none"
    style={{ backgroundColor: enabled ? color : "#D1D5DB" }}
    aria-checked={enabled}
    role="switch"
  >
    <span
      className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300"
      style={{ transform: enabled ? "translateX(20px)" : "translateX(0)" }}
    />
  </button>
);

// Segmented control for discount type
const TypeSegment: React.FC<{
  value: string;
  onChange: (v: string) => void;
  color: string;
}> = ({ value, onChange, color }) => (
  <div className="flex rounded-xl border border-gray-200 dark:border-gray-600 overflow-hidden">
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
          className="flex-1 flex items-center justify-center gap-1.5 h-9 px-3 text-xs font-semibold transition-all duration-150"
          style={
            active
              ? { backgroundColor: color, color: "#fff" }
              : { backgroundColor: "transparent", color: "#6b7280" }
          }
        >
          <Icon size={11} />
          {label}
        </button>
      );
    })}
  </div>
);

const OfferCard: React.FC<{
  offerKey: OfferKey;
  customLabel?: string;
  offer: DiscountOffer;
  onToggle: () => void;
  onOfferChange: (field: keyof DiscountOffer, value: string) => void;
  errors: Record<string, string>;
}> = ({ offerKey, customLabel, offer, onToggle, onOfferChange, errors }) => {
  const cfg = OFFER_CONFIG[offerKey];
  const label = customLabel ?? cfg.label;

  // Savings hint
  const savingsHint =
    offer.enabled && offer.value
      ? offer.type === "percentage"
        ? `Guests save ${offer.value}%`
        : `Guests save ₹${offer.value}`
      : null;

  const valueError = errors[`${offerKey}Value`] ?? (offerKey === "firstUser" ? errors.discountPercentage : undefined);
  const finalPriceError = errors[`${offerKey}FinalPrice`] ?? (offerKey === "firstUser" ? errors.finalPrice : undefined);

  return (
    <div
      className="rounded-2xl border-2 transition-all duration-300 overflow-hidden"
      style={{
        borderColor: offer.enabled ? cfg.color : "transparent",
        boxShadow: offer.enabled ? `0 0 0 1px ${cfg.color}20` : undefined,
        backgroundColor: offer.enabled ? cfg.bg : undefined,
        // dark mode handled via class below
      }}
    >
      {/* Inner wrapper to allow bg override in dark */}
      <div className={`${offer.enabled ? "dark:bg-transparent" : "bg-white dark:bg-gray-800"} rounded-2xl`}
        style={{ backgroundColor: offer.enabled ? cfg.bg : undefined }}
      >
        {/* Card header row */}
        <div className="flex items-center justify-between p-5">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ backgroundColor: offer.enabled ? `${cfg.color}20` : "#f3f4f6" }}
            >
              {cfg.emoji}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-white">{label}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{cfg.description}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0 ml-4">
            {savingsHint && (
              <span
                className="hidden sm:inline text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${cfg.color}18`, color: cfg.color }}
              >
                {savingsHint}
              </span>
            )}
            <Toggle enabled={offer.enabled} onToggle={onToggle} color={cfg.color} />
          </div>
        </div>

        {/* Expanded form */}
        {offer.enabled && (
          <div className="px-5 pb-5 flex flex-col gap-4">
            <div className="w-full h-px" style={{ backgroundColor: `${cfg.color}30` }} />

            {/* Discount Type segmented control */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Discount Type
              </label>
              <TypeSegment
                value={offer.type}
                onChange={(v) => onOfferChange("type", v)}
                color={cfg.color}
              />
            </div>

            {/* Value + Final Price side by side */}
            <div className="grid grid-cols-2 gap-3">
              {/* Discount Value */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {offer.type === "percentage" ? "Percentage" : "Fixed Amount"}
                </label>
                <div
                  className={`flex items-center border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-offset-1 transition-all ${
                    valueError ? "border-red-400" : "border-gray-200 dark:border-gray-600"
                  }`}
                  style={{ "--tw-ring-color": `${cfg.color}40` } as React.CSSProperties}
                >
                  <div className="flex items-center px-2.5 h-10 border-r border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 flex-shrink-0">
                    {offer.type === "percentage" ? (
                      <Percent size={12} className="text-gray-400" />
                    ) : (
                      <IndianRupee size={12} className="text-gray-400" />
                    )}
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={offer.value}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^0-9.]/g, "");
                      if (offer.type === "percentage" && Number(v) > 99) return;
                      onOfferChange("value", v);
                    }}
                    placeholder={offer.type === "percentage" ? "e.g. 20" : "e.g. 500"}
                    className="flex-1 h-10 px-2.5 text-sm bg-transparent text-gray-800 dark:text-white focus:outline-none min-w-0"
                  />
                  {offer.type === "percentage" && (
                    <span className="pr-3 text-xs text-gray-400">%</span>
                  )}
                </div>
                {valueError && (
                  <p className="text-xs text-red-500">{valueError}</p>
                )}
              </div>

              {/* Final Price */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Final Price
                </label>
                <div
                  className={`flex items-center border rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-offset-1 transition-all ${
                    finalPriceError ? "border-red-400" : "border-gray-200 dark:border-gray-600"
                  }`}
                  style={{ "--tw-ring-color": `${cfg.color}40` } as React.CSSProperties}
                >
                  <div className="flex items-center gap-0.5 px-2.5 h-10 border-r border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 flex-shrink-0">
                    <IndianRupee size={12} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={offer.finalPrice}
                    onChange={(e) => onOfferChange("finalPrice", e.target.value.replace(/[^0-9.]/g, ""))}
                    placeholder="e.g. 1200"
                    className="flex-1 h-10 px-2.5 text-sm bg-transparent text-gray-800 dark:text-white focus:outline-none min-w-0"
                  />
                </div>
                {finalPriceError && (
                  <p className="text-xs text-red-500">{finalPriceError}</p>
                )}
              </div>
            </div>

            {/* Mobile savings hint */}
            {savingsHint && (
              <div
                className="sm:hidden flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
                style={{ backgroundColor: `${cfg.color}12`, color: cfg.color }}
              >
                <span>✓</span>
                <span>{savingsHint}</span>
                {offer.finalPrice && <span className="ml-auto opacity-70">Final: ₹{offer.finalPrice}</span>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const DiscountOffersStep: React.FC<DiscountOffersStepProps> = ({
  offers,
  onToggle,
  onOfferChange,
  errors,
  weeklyLabel,
}) => {
  const activeCount = Object.values(offers).filter((o) => o.enabled).length;

  const offerEntries: { offerKey: OfferKey; customLabel?: string }[] = [
    { offerKey: "firstUser" },
    { offerKey: "festival" },
    { offerKey: "weekly", customLabel: weeklyLabel },
    { offerKey: "special" },
  ];

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-3xl">
      {/* Header */}
      <div className="text-center space-y-2.5">
        <h1 className="text-2xl lg:text-[32px] font-bold text-black dark:text-white leading-tight">
          Discount Offers
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Set up promotional offers to attract more bookings
        </p>
        {activeCount > 0 && (
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
            style={{ backgroundColor: "var(--th-accent)", color: "var(--th-accent-fg)" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
            {activeCount} offer{activeCount > 1 ? "s" : ""} active
          </span>
        )}
      </div>

      {/* Offer cards */}
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

      {/* Bottom tip */}
      {activeCount === 0 && (
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
          Toggle any offer above to enable it — discounts help your listing get discovered faster.
        </p>
      )}
    </div>
  );
};

export default DiscountOffersStep;
