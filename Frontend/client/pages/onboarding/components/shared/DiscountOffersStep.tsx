import React from "react";
import { IndianRupee, Percent, Tag } from "lucide-react";
import { type DiscountOffer } from "./types";

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const TEAL      = "#07e4e4";
const TEAL_BG   = "rgba(7, 228, 228, 0.07)";
const BLACK     = "#131313";
const GRAY_500  = "#6b6b6b";
const GRAY_400  = "#9a9a9a";
const GRAY_200  = "#e4e4e4";
const WHITE     = "#ffffff";
const SURFACE   = "#F7F8FA";
const ERROR     = "#ef4444";

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

/* ─── iOS Toggle ──────────────────────────────────────────────────────────── */
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
      position: "relative",
      width: 44,
      height: 24,
      borderRadius: 99,
      backgroundColor: enabled ? color : GRAY_200,
      border: "none",
      cursor: "pointer",
      flexShrink: 0,
      transition: "background-color 0.25s",
      boxShadow: enabled ? `0 0 0 3px ${color}22` : "none",
    }}
  >
    <span
      style={{
        position: "absolute",
        top: 3,
        left: 3,
        width: 18,
        height: 18,
        borderRadius: "50%",
        backgroundColor: WHITE,
        boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
        transform: enabled ? "translateX(20px)" : "translateX(0)",
        transition: "transform 0.25s cubic-bezier(0.34,1.56,0.64,1)",
        display: "block",
      }}
    />
  </button>
);

/* ─── Segmented type selector ─────────────────────────────────────────────── */
const TypeSegment = ({
  value,
  onChange,
  color,
}: {
  value: string;
  onChange: (v: string) => void;
  color: string;
}) => (
  <div
    style={{
      display: "flex",
      borderRadius: 11,
      backgroundColor: SURFACE,
      padding: 3,
      gap: 3,
    }}
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
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            height: 36,
            borderRadius: 9,
            border: `1.5px solid ${active ? `${color}30` : "transparent"}`,
            backgroundColor: active ? WHITE : "transparent",
            color: active ? color : GRAY_400,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            transition: "background-color 0.15s, color 0.15s, border-color 0.15s, box-shadow 0.15s",
            boxShadow: active ? "0 1px 4px rgba(0,0,0,0.08)" : "0 1px 4px transparent",
            letterSpacing: "0.01em",
          }}
        >
          <Icon size={12} />
          {label}
        </button>
      );
    })}
  </div>
);

/* ─── Amount input ────────────────────────────────────────────────────────── */
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
  const [focused, setFocused] = React.useState(false);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        borderRadius: 12,
        overflow: "hidden",
        border: `1.5px solid ${error ? "#fca5a5" : focused ? color : "transparent"}`,
        backgroundColor: error ? "rgba(239,68,68,0.04)" : focused ? WHITE : SURFACE,
        boxShadow: focused && !error
          ? `0 0 0 3px ${color}22, 0 1px 4px rgba(0,0,0,0.06)`
          : error
          ? "0 0 0 3px rgba(239,68,68,0.1)"
          : "none",
        transition: "all 0.15s",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0 10px",
          height: 46,
          borderRight: `1.5px solid ${focused ? `${color}30` : GRAY_200}`,
          backgroundColor: focused ? `${color}12` : SURFACE,
          flexShrink: 0,
          transition: "all 0.15s",
        }}
      >
        {isPercent
          ? <Percent size={12} color={focused ? color : GRAY_400} />
          : <IndianRupee size={12} color={focused ? color : GRAY_400} />
        }
      </div>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        style={{
          flex: 1,
          height: 46,
          padding: "0 12px",
          fontSize: 15,
          fontWeight: 600,
          color: value ? BLACK : GRAY_400,
          backgroundColor: "transparent",
          border: "none",
          outline: "none",
          letterSpacing: "-0.01em",
          minWidth: 0,
        }}
      />
      {isPercent && (
        <span style={{ paddingRight: 12, fontSize: 12, color: GRAY_400, fontWeight: 600, opacity: value ? 1 : 0, transition: "opacity 0.15s" }}>%</span>
      )}
    </div>
  );
};

/* ─── Error message ───────────────────────────────────────────────────────── */
const ErrorMsg = ({ message }: { message?: string }) =>
  message ? (
    <div className="flex items-center gap-1.5 mt-0.5">
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
        <circle cx="6" cy="6" r="5.25" stroke={ERROR} strokeWidth="1.5" />
        <path d="M6 3.5v3M6 8.25v.25" stroke={ERROR} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <p style={{ fontSize: 11, color: ERROR }}>{message}</p>
    </div>
  ) : null;

/* ─── Offer card ──────────────────────────────────────────────────────────── */
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

  const valueError = errors[`${offerKey}Value`] ?? (offerKey === "firstUser" ? errors.discountPercentage : undefined);
  const finalPriceError = errors[`${offerKey}FinalPrice`] ?? (offerKey === "firstUser" ? errors.finalPrice : undefined);

  const savingsHint =
    offer.enabled && offer.value
      ? offer.type === "percentage"
        ? `Guests save ${offer.value}%`
        : `Guests save ₹${offer.value}`
      : null;

  return (
    <div
      style={{
        backgroundColor: WHITE,
        border: `1.5px solid ${offer.enabled ? cfg.color : "#EBEBEB"}`,
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: offer.enabled
          ? `0 0 0 3px ${cfg.color}18, 0 2px 12px rgba(0,0,0,0.04)`
          : "0 2px 12px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)",
        transition: "all 0.2s",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 20px",
          backgroundColor: offer.enabled ? cfg.bg : WHITE,
          transition: "background-color 0.2s",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 13,
              backgroundColor: offer.enabled ? `${cfg.color}18` : SURFACE,
              border: `1.5px solid ${offer.enabled ? `${cfg.color}30` : GRAY_200}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
              flexShrink: 0,
              transition: "all 0.2s",
            }}
          >
            {cfg.emoji}
          </div>
          <div>
            <p style={{ fontSize: 13.5, fontWeight: 700, color: offer.enabled ? cfg.color : BLACK, letterSpacing: "-0.01em", transition: "color 0.2s" }}>
              {label}
            </p>
            <p style={{ fontSize: 11.5, color: GRAY_500, marginTop: 2 }}>{cfg.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
          {savingsHint && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: cfg.color,
                backgroundColor: `${cfg.color}14`,
                border: `1px solid ${cfg.color}30`,
                borderRadius: 99,
                padding: "3px 10px",
                whiteSpace: "nowrap",
              }}
            >
              {savingsHint}
            </span>
          )}
          <Toggle enabled={offer.enabled} onToggle={onToggle} color={cfg.color} />
        </div>
      </div>

      {/* Expanded form */}
      {offer.enabled && (
        <div
          style={{
            padding: "0 20px 20px",
            backgroundColor: offer.enabled ? cfg.bg : WHITE,
          }}
        >
          <div style={{ height: 1, backgroundColor: `${cfg.color}25`, marginBottom: 18 }} />

          <div className="flex flex-col gap-4">
            {/* Discount type */}
            <div className="flex flex-col gap-1.5">
              <label
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: GRAY_500,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                }}
              >
                Discount Type
              </label>
              <TypeSegment
                value={offer.type}
                onChange={(v) => onOfferChange("type", v)}
                color={cfg.color}
              />
            </div>

            {/* Value + Final Price */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: valueError ? ERROR : GRAY_500,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
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
                <ErrorMsg message={valueError} />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: finalPriceError ? ERROR : GRAY_500,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  Final Price
                </label>
                <AmountInput
                  value={offer.finalPrice}
                  onChange={(v) => onOfferChange("finalPrice", v)}
                  placeholder="e.g. 1200"
                  color={cfg.color}
                  error={!!finalPriceError}
                />
                <ErrorMsg message={finalPriceError} />
              </div>
            </div>

            {/* Final price hint */}
            {offer.value && offer.finalPrice && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 14px",
                  borderRadius: 11,
                  backgroundColor: `${cfg.color}10`,
                  border: `1px solid ${cfg.color}25`,
                }}
              >
                <span style={{ fontSize: 16 }}>✓</span>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: cfg.color }}>
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

/* ─── Main component ──────────────────────────────────────────────────────── */
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
            Promotions
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
          Discount Offers
        </h1>
        <p style={{ fontSize: 14, color: GRAY_500, lineHeight: 1.6 }}>
          Set up promotional offers to attract more bookings. All optional.
        </p>

        {activeCount > 0 && (
          <div className="flex justify-center mt-1">
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                fontWeight: 700,
                color: TEAL,
                backgroundColor: TEAL_BG,
                border: "1px solid rgba(7,228,228,0.3)",
                borderRadius: 99,
                padding: "4px 14px",
              }}
            >
              <Tag size={11} strokeWidth={2.5} />
              {activeCount} offer{activeCount > 1 ? "s" : ""} active
            </span>
          </div>
        )}
      </div>

      {/* ── Offer cards ── */}
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

      {activeCount === 0 && (
        <p style={{ fontSize: 12, color: GRAY_400, textAlign: "center" }}>
          Toggle any offer above to enable it — discounts help your listing get discovered faster.
        </p>
      )}
    </div>
  );
};

export default DiscountOffersStep;
