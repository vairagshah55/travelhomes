import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import {
  BTN_PRIMARY,
  BTN_SM,
  COUNT_BUBBLE,
  FOCUS_RING,
  INPUT_SM,
  LABEL,
  PORTAL_VARS,
  SELECT_ITEM,
} from "./adminUI";

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
      return {
        ...d,
        [key]: cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value],
      };
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
            className={`relative inline-flex items-center gap-2 h-10 px-3.5 rounded-xl border bg-app-surface text-[13px] font-medium transition-[background-color,border-color] duration-150 ${FOCUS_RING} ${
              count > 0
                ? "border-app-accent/40 text-app-accent"
                : "border-app-border text-app-fg hover:bg-app-surface-2 hover:border-app-fg-subtle/40"
            }`}
            aria-label={count > 0 ? `Filters, ${count} active` : "Filters"}
          >
            <SlidersHorizontal size={15} />
            Filters
            {count > 0 && (
              <span className={`${COUNT_BUBBLE} bg-app-accent text-app-accent-fg`}>{count}</span>
            )}
          </button>
        </PopoverTrigger>
        {/* Radix portals popovers to <body>, outside the admin root — without
            these vars every `app-*` class inside falls back to the global
            (cyan) values. */}
        <PopoverContent
          align="start"
          sideOffset={8}
          style={PORTAL_VARS}
          className="w-[340px] p-0 rounded-2xl border-app-border bg-app-surface shadow-[0_2px_4px_rgba(18,25,38,0.04),0_16px_32px_-12px_rgba(18,25,38,0.18)]"
        >
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-app-border">
            <h4 className="text-[13.5px] font-bold text-app-fg">Filters</h4>
            {count > 0 && (
              <span className="text-[11.5px] font-semibold text-app-accent">{count} active</span>
            )}
          </div>

          <div className="max-h-[360px] overflow-y-auto px-4 py-4 space-y-4">
            {filters.map((def) => (
              <div key={def.key} className="space-y-1.5">
                <label className={LABEL}>{def.label}</label>

                {def.type === "select" && (
                  <Select
                    value={(draft[def.key] as string) || ""}
                    onValueChange={(v) => setDraftValue(def.key, v)}
                  >
                    <SelectTrigger className={`${INPUT_SM} justify-between`}>
                      <SelectValue placeholder={`Any ${def.label.toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent style={PORTAL_VARS} className="rounded-xl border-app-border">
                      {def.options?.map((o) => (
                        <SelectItem key={o.value} value={o.value} className={SELECT_ITEM}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {def.type === "multi-select" && (
                  <div className="space-y-0.5">
                    {def.options?.map((o) => {
                      const checked =
                        Array.isArray(draft[def.key]) &&
                        (draft[def.key] as string[]).includes(o.value);
                      return (
                        <label
                          key={o.value}
                          className="flex items-center gap-2.5 cursor-pointer rounded-lg -mx-2 px-2 py-1.5 hover:bg-app-surface-2 transition-colors"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleMulti(def.key, o.value)}
                          />
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
                        setDraftValue(def.key, [
                          e.target.value,
                          (draft[def.key] as string[])?.[1] || "",
                        ])
                      }
                      className={`${INPUT_SM} flex-1`}
                      aria-label={`${def.label} from`}
                    />
                    <span className="text-app-fg-subtle shrink-0">–</span>
                    <input
                      type="date"
                      value={(draft[def.key] as string[])?.[1] || ""}
                      onChange={(e) =>
                        setDraftValue(def.key, [
                          (draft[def.key] as string[])?.[0] || "",
                          e.target.value,
                        ])
                      }
                      className={`${INPUT_SM} flex-1`}
                      aria-label={`${def.label} to`}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-app-border bg-app-surface-2/60 rounded-b-2xl">
            <button
              onClick={() => setDraft({})}
              className={`rounded-lg px-2 h-9 text-[12.5px] font-semibold text-app-fg-muted hover:text-app-fg transition-colors ${FOCUS_RING}`}
            >
              Reset
            </button>
            <button onClick={apply} className={`${BTN_PRIMARY} ${BTN_SM}`}>
              Apply filters
            </button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Active filter pills — each removable on its own, so narrowing a search
          doesn't mean clearing everything and starting again. */}
      <AnimatePresence initial={false}>
        {pills.map((pill, i) => (
          <motion.span
            key={`${pill.def.key}-${pill.value ?? i}`}
            layout
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.13, ease: "easeOut" }}
            className="inline-flex items-center gap-1 rounded-full bg-app-accent-soft text-app-accent pl-3 pr-1 h-8 text-[12px] font-semibold"
          >
            {pill.label}
            <button
              onClick={() => removePill(pill.def, pill.value)}
              className={`grid place-items-center w-5 h-5 rounded-full hover:bg-app-accent/20 transition-colors ${FOCUS_RING}`}
              aria-label={`Remove filter ${pill.label}`}
            >
              <X size={12} strokeWidth={2.6} />
            </button>
          </motion.span>
        ))}
      </AnimatePresence>

      {count > 1 && (
        <button
          onClick={onClear}
          className={`rounded-lg px-1.5 h-8 text-[12px] font-semibold text-app-fg-muted hover:text-app-fg underline-offset-2 hover:underline transition-colors ${FOCUS_RING}`}
        >
          Clear all
        </button>
      )}
    </div>
  );
}

export default AdminFilterBar;
