import React, { useMemo, useState } from "react";
import { Check, Search, Sparkles, Upload, X } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  FeatureIcon,
  ICON_GROUPS,
  ICON_LIBRARY,
  ICON_NAMES,
  inferIconName,
  isLucideIcon,
  LUCIDE_PREFIX,
} from "./featureIcons";

/**
 * Searchable icon library for the CMS feature modal.
 *
 * Replaces upload-only. The admin has no icon assets to upload — which is why
 * all 50 features in the database have an empty `icon` — so asking them to
 * source and upload a PNG per feature was never going to produce icons. Picking
 * from a bundled set takes one click and stores a `lucide:wifi` token.
 *
 * Uploading is still offered underneath, because an admin with real brand
 * artwork should be able to use it.
 */
export const IconPicker = ({
  value,
  featureName,
  onChange,
  onUploadClick,
  uploading,
}: {
  /** Current stored value: a `lucide:` token, an upload path, or empty. */
  value: string;
  /** Drives the "Suggested" chip — the icon this feature would get for free. */
  featureName: string;
  onChange: (value: string) => void;
  onUploadClick: () => void;
  uploading?: boolean;
}) => {
  const [query, setQuery] = useState("");

  const selectedToken = isLucideIcon(value) ? value.slice(LUCIDE_PREFIX.length) : null;
  const suggested = useMemo(() => inferIconName(featureName), [featureName]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ICON_NAMES;
    return ICON_NAMES.filter((name) => {
      const entry = ICON_LIBRARY[name];
      return (
        name.includes(q) ||
        entry.label.toLowerCase().includes(q) ||
        entry.group.toLowerCase().includes(q) ||
        entry.keywords.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [query]);

  /* Grouped only when browsing. Search results stay a flat relevance list —
     re-grouping four hits under four headings is just noise. */
  const grouped = useMemo(() => {
    if (query.trim()) return null;
    return ICON_GROUPS.map((g) => ({ group: g, names: matches.filter((n) => ICON_LIBRARY[n].group === g) }))
      .filter((g) => g.names.length);
  }, [matches, query]);

  const Tile = ({ name }: { name: string }) => {
    const entry = ICON_LIBRARY[name];
    const active = selectedToken === name;
    return (
      <button
        type="button"
        title={entry.label}
        aria-label={entry.label}
        aria-pressed={active}
        onClick={() => onChange(active ? "" : `${LUCIDE_PREFIX}${name}`)}
        className={cn(
          "relative grid h-11 w-11 place-items-center rounded-xl border transition-colors outline-none",
          "focus-visible:ring-4 focus-visible:ring-app-accent/20",
          active
            ? "border-app-accent bg-app-accent-soft text-app-accent"
            : "border-app-border bg-app-surface-2 text-app-fg-muted hover:border-app-accent hover:text-app-accent",
        )}
      >
        <entry.Icon size={18} />
        {active && (
          <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-app-accent text-white">
            <Check size={10} strokeWidth={3} />
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-3">
      {/* Current selection, stated plainly — including the "nothing picked, so
          here's what we'll infer" case, which is the default for every row. */}
      <div className="flex items-center gap-3 rounded-xl border border-app-border bg-app-surface-2 px-3.5 py-2.5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-app-border bg-app-surface-1 text-app-accent">
          <FeatureIcon icon={value} name={featureName} size={19} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] font-semibold text-app-fg">
            {selectedToken
              ? ICON_LIBRARY[selectedToken]?.label || selectedToken
              : value
                ? "Uploaded image"
                : suggested
                  ? `Auto: ${ICON_LIBRARY[suggested].label}`
                  : "No icon yet"}
          </p>
          <p className="mt-0.5 text-[11.5px] text-app-fg-muted">
            {selectedToken || value
              ? "Chosen for this feature."
              : suggested
                ? "Matched from the name. Pick one below to override."
                : "Pick one below, or it shows a neutral mark."}
          </p>
        </div>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="shrink-0 rounded-lg p-1.5 text-app-fg-muted transition-colors hover:bg-app-surface-3 hover:text-app-fg"
            aria-label="Clear icon"
          >
            <X size={14} strokeWidth={2.4} />
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-app-fg-subtle"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search icons — wifi, parking, breakfast…"
          className="h-10 w-full rounded-xl border border-app-border bg-app-surface-1 pl-9 pr-3 text-[13px] text-app-fg outline-none transition-colors placeholder:text-app-fg-subtle focus:border-app-accent focus:ring-4 focus:ring-app-accent/20"
        />
      </div>

      <div className="max-h-[240px] overflow-y-auto rounded-xl border border-app-border p-3">
        {/* One-click accept of the inferred icon. */}
        {!query.trim() && suggested && selectedToken !== suggested && (
          <div className="mb-3 flex items-center gap-2 border-b border-app-border pb-3">
            <Sparkles size={13} className="shrink-0 text-app-accent" />
            <span className="text-[11.5px] font-semibold uppercase tracking-wide text-app-fg-muted">
              Suggested
            </span>
            <Tile name={suggested} />
          </div>
        )}

        {matches.length === 0 ? (
          <p className="py-8 text-center text-[12.5px] text-app-fg-muted">
            No icon matches “{query.trim()}”. Try a plainer word, or upload your own below.
          </p>
        ) : grouped ? (
          <div className="space-y-3">
            {grouped.map(({ group, names }) => (
              <div key={group}>
                <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-app-fg-subtle">
                  {group}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {names.map((n) => (
                    <Tile key={n} name={n} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {matches.map((n) => (
              <Tile key={n} name={n} />
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onUploadClick}
        disabled={uploading}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-app-border bg-app-surface-2 px-4 py-2.5 text-[12.5px] font-semibold text-app-fg-muted transition-colors hover:border-app-accent hover:text-app-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-app-accent/20 disabled:opacity-60"
      >
        <Upload size={14} />
        {uploading ? "Uploading…" : "Or upload your own image"}
      </button>
    </div>
  );
};

export default IconPicker;
