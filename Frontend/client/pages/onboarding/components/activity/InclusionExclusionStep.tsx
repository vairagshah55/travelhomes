import React, { useState } from "react";
import { Plus, X, Check, AlertCircle, Lightbulb } from "lucide-react";

interface InclusionExclusionStepProps {
  priceIncludes: string[];
  priceExcludes: string[];
  expectations: string[];
  onAddListItem: (key: "priceIncludes" | "priceExcludes" | "expectations", value: string) => void;
  onRemoveListItem: (key: "priceIncludes" | "priceExcludes" | "expectations", index: number) => void;
}

type ListKey = "priceIncludes" | "priceExcludes" | "expectations";

interface ListSectionProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  accentColor: string;
  chipBg: string;
  items: string[];
  listKey: ListKey;
  placeholder: string;
  onAdd: (key: ListKey, value: string) => void;
  onRemove: (key: ListKey, index: number) => void;
}

const ListSection: React.FC<ListSectionProps> = ({
  title,
  subtitle,
  icon,
  accentColor,
  chipBg,
  items,
  listKey,
  placeholder,
  onAdd,
  onRemove,
}) => {
  const [inputValue, setInputValue] = useState("");

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    onAdd(listKey, trimmed);
    setInputValue("");
  };

  return (
    <div className="flex flex-col gap-3 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
      {/* Section header */}
      <div className="flex items-center gap-2.5">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: chipBg }}
        >
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800 dark:text-white">{title}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>
        </div>
        {items.length > 0 && (
          <span
            className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: chipBg, color: accentColor }}
          >
            {items.length}
          </span>
        )}
      </div>

      {/* Chips */}
      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {items.map((item, index) => (
            <div
              key={index}
              className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full border text-xs font-medium"
              style={{
                borderColor: `${accentColor}30`,
                backgroundColor: chipBg,
                color: accentColor,
              }}
            >
              <span>{item}</span>
              <button
                type="button"
                onClick={() => onRemove(listKey, index)}
                className="w-4 h-4 rounded-full hover:bg-black/10 flex items-center justify-center transition-colors"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder={placeholder}
          className="flex-1 h-9 px-3 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:border-[var(--th-accent)] transition-colors"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          className="h-9 px-3 rounded-xl border text-xs font-medium flex items-center gap-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ borderColor: accentColor, color: accentColor }}
        >
          <Plus size={12} />
          Add
        </button>
      </div>
    </div>
  );
};

const InclusionExclusionStep: React.FC<InclusionExclusionStepProps> = ({
  priceIncludes,
  priceExcludes,
  expectations,
  onAddListItem,
  onRemoveListItem,
}) => {
  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-3xl">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl lg:text-[32px] font-bold text-black dark:text-white leading-tight">
          Inclusions &amp; Exclusions
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Be transparent with guests about what's covered and what isn't
        </p>
      </div>

      <div className="w-full flex flex-col gap-4">
        <ListSection
          title="What's Included"
          subtitle="Items or services covered in the price"
          icon={<Check size={15} style={{ color: "#16a34a" }} />}
          accentColor="#16a34a"
          chipBg="#f0fdf4"
          items={priceIncludes}
          listKey="priceIncludes"
          placeholder="e.g. Equipment, Guide, Meals…"
          onAdd={onAddListItem}
          onRemove={onRemoveListItem}
        />

        <ListSection
          title="What's Not Included"
          subtitle="Things guests need to arrange or pay separately"
          icon={<AlertCircle size={15} style={{ color: "#dc2626" }} />}
          accentColor="#dc2626"
          chipBg="#fef2f2"
          items={priceExcludes}
          listKey="priceExcludes"
          placeholder="e.g. Flights, Travel insurance…"
          onAdd={onAddListItem}
          onRemove={onRemoveListItem}
        />

        <ListSection
          title="What We Expect from Guests"
          subtitle="Requirements or things guests should bring/do"
          icon={<Lightbulb size={15} style={{ color: "#d97706" }} />}
          accentColor="#d97706"
          chipBg="#fffbeb"
          items={expectations}
          listKey="expectations"
          placeholder="e.g. Wear comfortable shoes, Arrive 15 min early…"
          onAdd={onAddListItem}
          onRemove={onRemoveListItem}
        />
      </div>
    </div>
  );
};

export default InclusionExclusionStep;
