import React, { useState } from "react";
import { Plus, X, Check, AlertCircle, Lightbulb } from "lucide-react";

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const TEAL       = "#07e4e4";
const TEAL_BG    = "rgba(7, 228, 228, 0.07)";
const TEAL_FOCUS = "rgba(7, 228, 228, 0.15)";
const BLACK      = "#131313";
const GRAY_500   = "#6b6b6b";
const GRAY_400   = "#9a9a9a";
const GRAY_200   = "#e4e4e4";
const WHITE      = "#ffffff";
const SURFACE    = "#F7F8FA";

interface InclusionExclusionStepProps {
  priceIncludes: string[];
  priceExcludes: string[];
  expectations: string[];
  onAddListItem: (key: "priceIncludes" | "priceExcludes" | "expectations", value: string) => void;
  onRemoveListItem: (key: "priceIncludes" | "priceExcludes" | "expectations", index: number) => void;
}

type ListKey = "priceIncludes" | "priceExcludes" | "expectations";

/* ─── Section card ────────────────────────────────────────────────────────── */
const SectionCard = ({
  icon, title, subtitle, badge, children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div
    style={{
      backgroundColor: WHITE,
      border: "1.5px solid #EBEBEB",
      borderRadius: 20,
      padding: "20px 22px 22px",
      boxShadow: "0 2px 12px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)",
    }}
  >
    <div className="flex items-center gap-3 mb-5">
      <div
        style={{
          width: 36, height: 36, borderRadius: 11,
          backgroundColor: TEAL_BG,
          border: "1.5px solid rgba(7,228,228,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: BLACK, letterSpacing: "-0.01em" }}>{title}</p>
        {subtitle && <p style={{ fontSize: 11, color: GRAY_400, marginTop: 1 }}>{subtitle}</p>}
      </div>
      {badge}
    </div>
    <div className="flex flex-col gap-4">{children}</div>
  </div>
);

/* ─── Chip list ──────────────────────────────────────────────────────────── */
const ChipList = ({
  items,
  accentColor,
  chipBg,
  onRemove,
}: {
  items: string[];
  accentColor: string;
  chipBg: string;
  onRemove: (index: number) => void;
}) => {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, index) => (
        <div
          key={index}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "5px 6px 5px 12px",
            borderRadius: 99,
            border: `1.5px solid ${accentColor}25`,
            backgroundColor: chipBg,
            fontSize: 13, fontWeight: 500,
            color: accentColor,
          }}
        >
          <span>{item}</span>
          <button
            type="button"
            onClick={() => onRemove(index)}
            style={{
              width: 20, height: 20, borderRadius: "50%",
              display: "flex", alignItems: "center", justifyContent: "center",
              backgroundColor: "transparent",
              border: "none", cursor: "pointer",
              transition: "background-color 0.15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = `${accentColor}18`; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
          >
            <X size={11} />
          </button>
        </div>
      ))}
    </div>
  );
};

/* ─── Add input row ──────────────────────────────────────────────────────── */
const AddInput = ({
  placeholder,
  accentColor,
  onAdd,
}: {
  placeholder: string;
  accentColor: string;
  onAdd: (value: string) => void;
}) => {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);

  const handleAdd = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue("");
  };

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") { e.preventDefault(); handleAdd(); }
        }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        style={{
          flex: 1, height: 48, padding: "0 16px",
          fontSize: 14, color: BLACK,
          backgroundColor: focused ? WHITE : SURFACE,
          border: `1.5px solid ${focused ? TEAL : "transparent"}`,
          borderRadius: 13, outline: "none",
          boxShadow: focused
            ? `0 0 0 4px ${TEAL_FOCUS}, 0 1px 4px rgba(0,0,0,0.06)`
            : "none",
          transition: "background-color 0.15s, border-color 0.15s, box-shadow 0.2s",
          fontWeight: 450,
        }}
      />
      <button
        type="button"
        onClick={handleAdd}
        disabled={!value.trim()}
        style={{
          height: 48, padding: "0 18px",
          display: "flex", alignItems: "center", gap: 6,
          borderRadius: 13,
          border: `1.5px solid ${value.trim() ? accentColor : GRAY_200}`,
          backgroundColor: value.trim() ? `${accentColor}10` : "transparent",
          color: value.trim() ? accentColor : GRAY_400,
          fontSize: 13, fontWeight: 600,
          cursor: value.trim() ? "pointer" : "not-allowed",
          transition: "all 0.15s",
          flexShrink: 0,
        }}
      >
        <Plus size={14} />
        Add
      </button>
    </div>
  );
};

/* ─── Section configs ────────────────────────────────────────────────────── */
const SECTIONS: {
  key: ListKey;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  accentColor: string;
  chipBg: string;
  placeholder: string;
}[] = [
  {
    key: "priceIncludes",
    title: "What's Included",
    subtitle: "Items or services covered in the price",
    icon: <Check size={16} color={TEAL} strokeWidth={2.5} />,
    accentColor: "#16a34a",
    chipBg: "#f0fdf4",
    placeholder: "e.g. Equipment, Guide, Meals\u2026",
  },
  {
    key: "priceExcludes",
    title: "What's Not Included",
    subtitle: "Things guests need to arrange or pay separately",
    icon: <AlertCircle size={16} color={TEAL} strokeWidth={2.5} />,
    accentColor: "#dc2626",
    chipBg: "#fef2f2",
    placeholder: "e.g. Flights, Travel insurance\u2026",
  },
  {
    key: "expectations",
    title: "What We Expect from Guests",
    subtitle: "Requirements or things guests should bring/do",
    icon: <Lightbulb size={16} color={TEAL} strokeWidth={2.5} />,
    accentColor: "#d97706",
    chipBg: "#fffbeb",
    placeholder: "e.g. Wear comfortable shoes, Arrive 15 min early\u2026",
  },
];

/* ─── Main component ──────────────────────────────────────────────────────── */
const InclusionExclusionStep: React.FC<InclusionExclusionStepProps> = ({
  priceIncludes,
  priceExcludes,
  expectations,
  onAddListItem,
  onRemoveListItem,
}) => {
  const itemsMap: Record<ListKey, string[]> = {
    priceIncludes,
    priceExcludes,
    expectations,
  };

  return (
    <div className="flex flex-col items-center gap-7 w-full max-w-2xl">

      {/* ── Header ── */}
      <div className="text-center space-y-2 pb-1">
        <div className="flex items-center justify-center gap-2.5 mb-3">
          <div style={{ width: 24, height: 3, borderRadius: 99, backgroundColor: TEAL }} />
          <span
            style={{
              fontSize: 10.5, fontWeight: 700,
              letterSpacing: "0.13em", textTransform: "uppercase", color: GRAY_400,
            }}
          >
            Transparency
          </span>
          <div style={{ width: 24, height: 3, borderRadius: 99, backgroundColor: TEAL }} />
        </div>
        <h1
          style={{
            fontSize: "clamp(22px, 3.5vw, 30px)",
            fontWeight: 800, color: BLACK,
            letterSpacing: "-0.03em", lineHeight: 1.15,
          }}
        >
          Inclusions &amp; Exclusions
        </h1>
        <p style={{ fontSize: 14, color: GRAY_500, lineHeight: 1.6 }}>
          Be transparent with guests about what's covered and what isn't.
        </p>
      </div>

      <div className="w-full flex flex-col gap-4">
        {SECTIONS.map((section) => {
          const items = itemsMap[section.key];
          return (
            <SectionCard
              key={section.key}
              icon={section.icon}
              title={section.title}
              subtitle={section.subtitle}
              badge={
                items.length > 0 ? (
                  <span
                    style={{
                      fontSize: 11, fontWeight: 700,
                      color: section.accentColor,
                      backgroundColor: section.chipBg,
                      border: `1.5px solid ${section.accentColor}25`,
                      borderRadius: 99, padding: "2px 10px",
                    }}
                  >
                    {items.length}
                  </span>
                ) : undefined
              }
            >
              <ChipList
                items={items}
                accentColor={section.accentColor}
                chipBg={section.chipBg}
                onRemove={(index) => onRemoveListItem(section.key, index)}
              />
              <AddInput
                placeholder={section.placeholder}
                accentColor={section.accentColor}
                onAdd={(value) => onAddListItem(section.key, value)}
              />
            </SectionCard>
          );
        })}
      </div>
    </div>
  );
};

export default InclusionExclusionStep;
