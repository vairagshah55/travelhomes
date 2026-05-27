import React, { useEffect, useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type FilterValue = string | string[];

export interface FilterDefinition {
  key: string;
  label: string;
  type: "select" | "multi-select" | "date-range";
  options?: Array<{ value: string; label: string }>;
}

export type ActiveFilters = Record<string, FilterValue>;

interface AdminFilterBarProps {
  filters: FilterDefinition[];
  activeFilters: ActiveFilters;
  onApply: (filters: ActiveFilters) => void;
  onClear: () => void;
  className?: string;
}

function isEmpty(v: FilterValue | undefined): boolean {
  if (v == null) return true;
  if (Array.isArray(v)) return v.length === 0 || v.every((x) => !x);
  return v.trim() === "";
}

function activeCount(filters: FilterDefinition[], active: ActiveFilters): number {
  return filters.reduce((n, f) => (isEmpty(active[f.key]) ? n : n + 1), 0);
}

/**
 * Unified filter control: a Popover panel driven by a `FilterDefinition[]` plus
 * a row of dismissible active-filter pills. Replaces FiltersPopup,
 * ListingFilterPopup, and FilterModal. The parent owns `activeFilters` (so it
 * can feed them into a query); the popover edits a local draft and commits on
 * Apply.
 */
export function AdminFilterBar({
  filters,
  activeFilters,
  onApply,
  onClear,
  className = "",
}: AdminFilterBarProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ActiveFilters>(activeFilters);
  const count = activeCount(filters, activeFilters);

  // Re-sync the draft to committed filters each time the panel opens.
  useEffect(() => {
    if (open) setDraft(activeFilters);
  }, [open, activeFilters]);

  const setDraftValue = (key: string, value: FilterValue) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const toggleMulti = (key: string, value: string) =>
    setDraft((d) => {
      const cur = Array.isArray(d[key]) ? (d[key] as string[]) : [];
      return { ...d, [key]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value] };
    });

  const apply = () => {
    onApply(draft);
    setOpen(false);
  };

  const removePill = (def: FilterDefinition, value?: string) => {
    const next = { ...activeFilters };
    if (def.type === "multi-select" && value) {
      next[def.key] = (next[def.key] as string[]).filter((v) => v !== value);
      if ((next[def.key] as string[]).length === 0) delete next[def.key];
    } else {
      delete next[def.key];
    }
    onApply(next);
  };

  // Build pills from committed filters.
  const pills: Array<{ def: FilterDefinition; label: string; value?: string }> = [];
  for (const def of filters) {
    const v = activeFilters[def.key];
    if (isEmpty(v)) continue;
    if (def.type === "multi-select" && Array.isArray(v)) {
      for (const val of v) {
        const opt = def.options?.find((o) => o.value === val);
        pills.push({ def, label: `${def.label}: ${opt?.label ?? val}`, value: val });
      }
    } else if (def.type === "date-range" && Array.isArray(v)) {
      const [from, to] = v;
      pills.push({ def, label: `${def.label}: ${from || "…"} – ${to || "…"}` });
    } else if (def.type === "select") {
      const opt = def.options?.find((o) => o.value === v);
      pills.push({ def, label: `${def.label}: ${opt?.label ?? String(v)}` });
    }
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className="relative inline-flex items-center gap-2 h-10 px-4 rounded-full border border-app-border bg-app-surface-2 text-[13px] font-medium text-app-fg hover:opacity-80 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-app-accent focus-visible:ring-offset-2"
            aria-label={count > 0 ? `Filters, ${count} active` : "Filters"}
          >
            <SlidersHorizontal size={15} />
            Filters
            {count > 0 && (
              <span className="grid place-items-center min-w-[18px] h-[18px] px-1 rounded-full bg-app-accent text-app-accent-fg text-[10px] font-bold leading-none">
                {count}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80 p-0">
          <div className="px-4 py-3 border-b border-app-border">
            <h4 className="text-[14px] font-semibold text-app-fg">Filters</h4>
          </div>
          <div className="max-h-[340px] overflow-y-auto px-4 py-3 space-y-4">
            {filters.map((def) => (
              <div key={def.key} className="space-y-1.5">
                <label className="text-[12px] font-semibold text-app-fg-muted">
                  {def.label}
                </label>

                {def.type === "select" && (
                  <Select
                    value={(draft[def.key] as string) || ""}
                    onValueChange={(v) => setDraftValue(def.key, v)}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue placeholder={`Any ${def.label.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {def.options?.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {def.type === "multi-select" && (
                  <div className="space-y-1.5">
                    {def.options?.map((o) => {
                      const checked = Array.isArray(draft[def.key]) && (draft[def.key] as string[]).includes(o.value);
                      return (
                        <label key={o.value} className="flex items-center gap-2 cursor-pointer">
                          <Checkbox checked={checked} onCheckedChange={() => toggleMulti(def.key, o.value)} />
                          <span className="text-[13px] text-app-fg">{o.label}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {def.type === "date-range" && (
                  <div className="flex items-center gap-2">
                    <input
                      type="date"
                      value={(draft[def.key] as string[])?.[0] || ""}
                      onChange={(e) =>
                        setDraftValue(def.key, [e.target.value, (draft[def.key] as string[])?.[1] || ""])
                      }
                      className="h-9 flex-1 rounded-md border border-app-border bg-transparent px-2 text-[13px] text-app-fg"
                      aria-label={`${def.label} from`}
                    />
                    <span className="text-app-fg-subtle">–</span>
                    <input
                      type="date"
                      value={(draft[def.key] as string[])?.[1] || ""}
                      onChange={(e) =>
                        setDraftValue(def.key, [(draft[def.key] as string[])?.[0] || "", e.target.value])
                      }
                      className="h-9 flex-1 rounded-md border border-app-border bg-transparent px-2 text-[13px] text-app-fg"
                      aria-label={`${def.label} to`}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-app-border">
            <button
              onClick={() => setDraft({})}
              className="text-[13px] font-medium text-app-fg-muted hover:text-app-fg"
            >
              Reset
            </button>
            <button
              onClick={apply}
              className="rounded-full bg-app-accent px-4 h-9 text-[13px] font-semibold text-app-accent-fg hover:bg-app-accent-hover transition-colors"
            >
              Apply filters
            </button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Active filter pills */}
      {pills.map((pill, i) => (
        <span
          key={`${pill.def.key}-${pill.value ?? i}`}
          className="inline-flex items-center gap-1.5 rounded-full bg-app-accent-soft text-app-accent px-3 h-8 text-[12px] font-medium"
        >
          {pill.label}
          <button
            onClick={() => removePill(pill.def, pill.value)}
            className="hover:text-app-fg"
            aria-label={`Remove ${pill.label}`}
          >
            <X size={13} />
          </button>
        </span>
      ))}

      {count > 0 && (
        <button
          onClick={onClear}
          className="text-[12px] font-medium text-app-fg-muted hover:text-app-fg underline-offset-2 hover:underline"
        >
          Clear all
        </button>
      )}
    </div>
  );
}

export default AdminFilterBar;
