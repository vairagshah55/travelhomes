import React, { useState } from "react";
import { Plus, X, Check, AlertCircle, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface InclusionExclusionStepProps {
  priceIncludes: string[];
  priceExcludes: string[];
  expectations: string[];
  onAddListItem: (key: "priceIncludes" | "priceExcludes" | "expectations", value: string) => void;
  onRemoveListItem: (
    key: "priceIncludes" | "priceExcludes" | "expectations",
    index: number,
  ) => void;
}

type ListKey = "priceIncludes" | "priceExcludes" | "expectations";

/* ─── Section card ────────────────────────────────────────────────────────── */
const SectionCard = ({
  icon,
  title,
  subtitle,
  badge,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="bg-th-surface-0 border-[1.5px] border-th-warm-border rounded-[20px] px-[22px] pt-5 pb-[22px] shadow-[0_2px_12px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.03)]">
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-[11px] bg-th-brand-soft border-[1.5px] border-[rgba(15,92,138,0.25)] flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-[13px] font-bold text-th-text-primary tracking-[-0.01em]">{title}</p>
        {subtitle && <p className="text-[11px] text-th-warm-text-muted mt-[1px]">{subtitle}</p>}
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
          className="flex items-center gap-1.5 pl-3 pr-[6px] py-[5px] rounded-full text-[13px] font-medium"
          style={{
            border: `1.5px solid ${accentColor}25`,
            backgroundColor: chipBg,
            color: accentColor,
          }}
        >
          <span>{item}</span>
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="w-5 h-5 rounded-full flex items-center justify-center bg-transparent border-none cursor-pointer transition-colors duration-150 hover:bg-black/10"
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

  const handleAdd = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue("");
  };

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            handleAdd();
          }
        }}
        placeholder={placeholder}
        className={cn(
          "flex-1 h-12 px-4 text-[14px] text-th-text-primary bg-th-warm-surface",
          "border-[1.5px] border-transparent rounded-[13px] outline-none font-[450]",
          "transition-[background-color,border-color,box-shadow] duration-150",
          "focus:bg-th-surface-0 focus:border-th-brand focus:shadow-[0_0_0_4px_var(--th-ring),0_1px_4px_rgba(0,0,0,0.06)]",
        )}
      />
      <button
        type="button"
        onClick={handleAdd}
        disabled={!value.trim()}
        className="h-12 px-[18px] flex items-center gap-1.5 rounded-[13px] border-[1.5px] text-[13px] font-semibold transition-all duration-150 flex-shrink-0"
        style={{
          borderColor: value.trim() ? accentColor : undefined,
          backgroundColor: value.trim() ? `${accentColor}10` : undefined,
          color: value.trim() ? accentColor : undefined,
        }}
        // When value is empty, fall back to muted styles via className
        {...(!value.trim() && {
          className:
            "h-12 px-[18px] flex items-center gap-1.5 rounded-[13px] border-[1.5px] border-th-warm-border bg-transparent text-th-warm-text-muted text-[13px] font-semibold transition-all duration-150 flex-shrink-0 cursor-not-allowed",
        })}
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
    icon: <Check size={16} className="text-th-brand" strokeWidth={2.5} />,
    accentColor: "#16a34a",
    chipBg: "#f0fdf4",
    placeholder: "e.g. Equipment, Guide, Meals…",
  },
  {
    key: "priceExcludes",
    title: "What's Not Included",
    subtitle: "Things guests need to arrange or pay separately",
    icon: <AlertCircle size={16} className="text-th-brand" strokeWidth={2.5} />,
    accentColor: "#dc2626",
    chipBg: "#fef2f2",
    placeholder: "e.g. Flights, Travel insurance…",
  },
  {
    key: "expectations",
    title: "What We Expect from Guests",
    subtitle: "Requirements or things guests should bring/do",
    icon: <Lightbulb size={16} className="text-th-brand" strokeWidth={2.5} />,
    accentColor: "#d97706",
    chipBg: "#fffbeb",
    placeholder: "e.g. Wear comfortable shoes, Arrive 15 min early…",
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
          <div className="w-6 h-[3px] rounded-full bg-th-brand" />
          <span className="text-[10.5px] font-bold tracking-[0.13em] uppercase text-th-warm-text-muted">
            Transparency
          </span>
          <div className="w-6 h-[3px] rounded-full bg-th-brand" />
        </div>
        <h1
          className="font-serif text-[clamp(24px,3.6vw,32px)] font-normal text-[#0A4670] tracking-[-0.015em] leading-[1.15]"
        >
          Inclusions &amp; Exclusions
        </h1>
        <p className="text-[14px] text-th-warm-text-dark leading-[1.6]">
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
                    className="text-[11px] font-bold rounded-full px-[10px] py-[2px] border-[1.5px]"
                    style={{
                      color: section.accentColor,
                      backgroundColor: section.chipBg,
                      borderColor: `${section.accentColor}25`,
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
