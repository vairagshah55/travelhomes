import React from "react";
import { Search, Check } from "lucide-react";
import {
  BLACK,
  TEAL,
  TEAL_BG,
  TEAL_FOCUS,
  WHITE,
  SURFACE,
  ERROR_SOFT,
  GRAY_400,
  GRAY_200,
} from "./tokens";

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
  const [focused, setFocused] = React.useState(false);
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
        setFocused(false);
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
    setFocused(false);
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
      setFocused(false);
      setQuery("");
    }
  };

  const triggerActive = open || focused;

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          height: 52,
          padding: "0 40px 0 16px",
          textAlign: "left",
          fontSize: 14,
          color: selectedLabel ? (disabled ? GRAY_400 : BLACK) : GRAY_400,
          backgroundColor: disabled ? SURFACE : triggerActive ? WHITE : SURFACE,
          border: `1.5px solid ${error ? ERROR_SOFT : triggerActive ? TEAL : "transparent"}`,
          borderRadius: 13,
          outline: "none",
          boxShadow:
            triggerActive && !error
              ? `0 0 0 4px ${TEAL_FOCUS}, 0 1px 4px rgba(0,0,0,0.06)`
              : "none",
          transition: "background-color 0.15s, border-color 0.15s, box-shadow 0.2s",
          cursor: disabled ? "not-allowed" : "pointer",
          fontWeight: 450,
          letterSpacing: "-0.005em",
        }}
      >
        {selectedLabel || placeholder}
      </button>

      <svg
        style={{
          position: "absolute",
          right: 14,
          top: 26,
          transform: "translateY(-50%)",
          pointerEvents: "none",
          transition: "transform 0.15s",
          ...(open ? { transform: "translateY(-50%) rotate(180deg)" } : {}),
        }}
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
      >
        <path
          d="M4 6l4 4 4-4"
          stroke={GRAY_400}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            right: 0,
            zIndex: 30,
            backgroundColor: WHITE,
            border: `1.5px solid ${GRAY_200}`,
            borderRadius: 13,
            boxShadow: "0 10px 28px rgba(0,0,0,0.10), 0 2px 6px rgba(0,0,0,0.04)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 12px",
              borderBottom: `1px solid ${GRAY_200}`,
              backgroundColor: SURFACE,
            }}
          >
            <Search size={14} color={GRAY_400} />
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
              style={{
                flex: 1,
                height: 28,
                fontSize: 13.5,
                color: BLACK,
                backgroundColor: "transparent",
                border: "none",
                outline: "none",
                fontWeight: 450,
              }}
            />
          </div>

          <div
            ref={listRef}
            style={{
              maxHeight: 240,
              overflowY: "auto",
              padding: "4px 0",
            }}
          >
            {filtered.length === 0 ? (
              <div
                style={{
                  padding: "14px 16px",
                  fontSize: 13,
                  color: GRAY_400,
                  textAlign: "center",
                }}
              >
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
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "9px 14px",
                      fontSize: 13.5,
                      color: BLACK,
                      backgroundColor: active ? TEAL_BG : "transparent",
                      cursor: "pointer",
                      fontWeight: selected ? 600 : 450,
                    }}
                  >
                    <span>{opt.label}</span>
                    {selected && <Check size={14} color={TEAL} strokeWidth={2.5} />}
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
