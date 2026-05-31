import React from "react";
import { Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchableOption {
  label: string;
  value: string;
}

interface SearchableSelectProps {
  value: string;
  onChange: (v: string) => void;
  options: SearchableOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  error?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select",
  searchPlaceholder = "Search…",
  emptyMessage = "No matches",
  disabled,
  error,
}) => {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIdx, setActiveIdx] = React.useState(0);

  const wrapRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const selectedLabel = React.useMemo(
    () => options.find((o) => o.value === value)?.label ?? "",
    [options, value],
  );

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  React.useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIdx(Math.max(0, options.findIndex((o) => o.value === value)));
      // Focus the search input on next frame so the panel is mounted first.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open, options, value]);

  React.useEffect(() => {
    if (activeIdx >= filtered.length) setActiveIdx(0);
  }, [filtered.length, activeIdx]);

  // Keep the active row scrolled into view as the user arrows through.
  React.useEffect(() => {
    if (!open || !listRef.current) return;
    const row = listRef.current.querySelector<HTMLElement>(`[data-idx="${activeIdx}"]`);
    row?.scrollIntoView({ block: "nearest" });
  }, [activeIdx, open]);

  const commit = (idx: number) => {
    const opt = filtered[idx];
    if (!opt) return;
    onChange(opt.value);
    setOpen(false);
    setQuery("");
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      commit(activeIdx);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      setQuery("");
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={cn(
          "w-full h-[52px] pl-4 pr-10 text-left text-sm rounded-[13px] border-[1.5px] outline-none font-normal tracking-[-0.005em]",
          "transition-[background-color,border-color,box-shadow] duration-150",
          "border-transparent",
          disabled
            ? "bg-th-warm-surface text-th-warm-text-muted cursor-not-allowed"
            : "cursor-pointer bg-th-warm-surface focus:bg-th-surface-0",
          !disabled && (selectedLabel ? "text-th-text-primary" : "text-th-warm-text-muted"),
          open && !error && "bg-th-surface-0 border-th-brand shadow-[0_0_0_4px_var(--th-ring),0_1px_4px_rgba(0,0,0,0.06)]",
          !open && !disabled && !error && "focus:border-th-brand focus:shadow-[0_0_0_4px_var(--th-ring),0_1px_4px_rgba(0,0,0,0.06)]",
          error && "border-th-error-bright-soft",
        )}
      >
        {selectedLabel || placeholder}
      </button>

      <svg
        className={cn(
          "absolute right-[14px] top-[26px] -translate-y-1/2 pointer-events-none transition-transform duration-150 text-th-warm-text-muted",
          open && "rotate-180",
        )}
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
      >
        <path
          d="M4 6l4 4 4-4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {open && (
        <div className="absolute top-[calc(100%+6px)] left-0 right-0 z-30 bg-th-surface-0 border-[1.5px] border-th-warm-border rounded-[13px] overflow-hidden shadow-[0_10px_28px_rgba(0,0,0,0.10),0_2px_6px_rgba(0,0,0,0.04)]">
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-th-warm-border bg-th-warm-surface">
            <Search size={14} className="text-th-warm-text-muted" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIdx(0);
              }}
              onKeyDown={onKeyDown}
              placeholder={searchPlaceholder}
              className="flex-1 h-7 text-[13.5px] text-th-text-primary bg-transparent border-none outline-none font-normal placeholder:text-th-warm-text-muted"
            />
          </div>

          <div ref={listRef} className="max-h-60 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <div className="px-4 py-3.5 text-[13px] text-th-warm-text-muted text-center">
                {emptyMessage}
              </div>
            ) : (
              filtered.map((opt, idx) => {
                const selected = opt.value === value;
                const active = idx === activeIdx;
                return (
                  <div
                    key={opt.value}
                    data-idx={idx}
                    onMouseEnter={() => setActiveIdx(idx)}
                    onMouseDown={(e) => {
                      // Prevent the trigger button from blurring before click registers.
                      e.preventDefault();
                      commit(idx);
                    }}
                    className={cn(
                      "flex items-center justify-between px-3.5 py-[9px] text-[13.5px] text-th-text-primary cursor-pointer",
                      selected ? "font-semibold" : "font-normal",
                      active && "bg-th-brand-soft",
                    )}
                  >
                    <span>{opt.label}</span>
                    {selected && <Check size={14} strokeWidth={2.5} className="text-th-brand" />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
