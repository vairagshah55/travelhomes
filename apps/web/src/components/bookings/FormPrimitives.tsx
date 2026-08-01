/**
 * Shared form primitives for the booking forms.
 *
 * Lifted out of BookingModals.tsx when New Booking moved from a right-side
 * SlidePanel to its own page (pages/NewBooking.tsx) — the edit panel and the
 * new-booking page both need these, so neither can own them.
 */
import React, { useState } from "react";
import { format } from "date-fns";
import { AlertCircle, Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

/** Sentinel value emitted by the bookings pages when the vendor has no services yet. */
export const NO_SERVICE_SENTINEL = "No Service Available";

/**
 * Highlight styling for dropdown items.
 *
 * shadcn's SelectItem defaults to `focus:bg-accent focus:text-accent-foreground`,
 * but `--accent` is defined as a hex (`#5750f1`, global.css) while Tailwind wraps
 * it as `hsl(var(--accent))` — that's invalid, so the background silently drops to
 * transparent while `--accent-foreground` still resolves and paints the text
 * white. The highlighted row ends up white-on-white and unreadable.
 *
 * Until that token is fixed globally, spell the highlight out — the same
 * treatment the bookings filter menus already use (FILTER_ITEM_CLASS).
 */
export const SELECT_ITEM_CLASS =
  "cursor-pointer text-[#131313] " +
  "focus:bg-[rgba(17, 116, 121,0.10)] focus:text-[#117479] " +
  "data-[highlighted]:bg-[rgba(17, 116, 121,0.10)] data-[highlighted]:text-[#117479]";

/* ─── Section header ──────────────────────────────────────────────────────── */
export const SectionHeader = ({
  icon,
  title,
  hint,
}: {
  icon?: React.ReactNode;
  title: string;
  hint?: string;
}) => (
  <div className="flex items-center gap-2 mt-1 mb-1">
    {icon && (
      <span className="inline-flex items-center justify-center w-[26px] h-[26px] rounded-lg bg-brand/[0.09] border border-brand/20">
        {icon}
      </span>
    )}
    <p className="text-[11px] font-extrabold text-foreground uppercase tracking-[0.06em]">
      {title}
    </p>
    {hint && <p className="text-[11px] text-muted-foreground ml-1">{hint}</p>}
    <div className="flex-1 h-px bg-border ml-1.5" />
  </div>
);

/* ─── Field wrapper with error ────────────────────────────────────────────── */
export const PanelField = ({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[12.5px] font-semibold text-foreground/85">
      {label}
      {required && <span className="ml-[3px] text-red-500">*</span>}
    </label>
    {children}
    {error && (
      <p className="flex items-center gap-1.5 text-[11.5px] font-medium text-red-600 dark:text-red-400">
        <AlertCircle size={12} strokeWidth={2.4} className="shrink-0" />
        {error}
      </p>
    )}
  </div>
);

/* ─── Styled input ───────────────────────────────────────────────────────── */
export const PanelInput = ({
  value,
  onChange,
  onBlur,
  placeholder,
  type = "text",
  error,
  ...rest
}: {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  type?: string;
  error?: boolean;
} & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "value" | "type" | "onBlur"
>) => (
  <input
    type={type}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    onBlur={onBlur}
    placeholder={placeholder}
    className={cn(
      "w-full h-11 px-3.5 text-[13.5px] text-foreground border rounded-xl outline-none",
      "bg-muted/50 dark:bg-white/5 focus:bg-card placeholder:text-muted-foreground/60",
      "transition-[background-color,border-color,box-shadow] duration-150",
      error
        ? "border-red-400 focus:border-red-500 focus:ring-4 focus:ring-red-500/15"
        : "border-border focus:border-brand focus:ring-4 focus:ring-brand/15",
    )}
    {...rest}
  />
);

/* ─── Buttons ────────────────────────────────────────────────────────────── */
export const tealBtn = (
  onClick: () => void,
  icon: React.ReactNode,
  label: string,
  disabled?: boolean,
) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={cn(
      // Kit BTN_PRIMARY geometry + teal glow. The old shadow was still keyed to
      // the navy public brand (rgba(17, 116, 121,…)) inside a teal console.
      "inline-flex items-center gap-1.5 h-10 px-5 rounded-xl border-0 bg-brand hover:bg-brand-hover",
      "text-[13px] font-semibold text-brand-fg transition-[background-color,box-shadow] duration-150",
      "shadow-[0_1px_2px_rgba(17, 116, 121,0.24),0_6px_16px_-6px_rgba(17, 116, 121,0.45)]",
      disabled ? "cursor-not-allowed opacity-45 shadow-none" : "cursor-pointer",
    )}
  >
    {icon} {label}
  </button>
);

export const ghostBtn = (onClick: () => void, label: string) => (
  <button
    type="button"
    onClick={onClick}
    className="h-10 px-4 rounded-xl bg-muted text-[13px] font-semibold text-foreground/80 hover:bg-muted/70 transition-colors duration-150 cursor-pointer"
  >
    {label}
  </button>
);

/* ─── Date picker (Popover + Calendar) ────────────────────────────────────── */
export const DatePickerField = ({
  value,
  onChange,
  onBlur,
  error,
  placeholder = "Pick a date",
  minDate,
}: {
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: boolean;
  placeholder?: string;
  minDate?: Date;
}) => {
  const [open, setOpen] = useState(false);
  const selected = value ? new Date(`${value}T00:00:00`) : undefined;
  const hasValue = !!selected && !Number.isNaN(selected.getTime());

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) onBlur?.();
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "w-full h-11 px-3.5 flex items-center gap-2.5 text-[13.5px] rounded-xl border outline-none cursor-pointer text-left",
            "transition-[background-color,border-color,box-shadow] duration-150",
            hasValue ? "text-foreground" : "text-muted-foreground",
            open ? "bg-card" : "bg-muted/50 dark:bg-white/5",
            error
              ? "border-red-400 ring-4 ring-red-500/15"
              : open
                ? "border-brand ring-4 ring-brand/15"
                : "border-border",
          )}
        >
          <CalendarIcon size={14} className={open ? "text-brand" : "text-muted-foreground"} />
          <span className="flex-1">
            {hasValue ? format(selected!, "EEE, MMM d, yyyy") : placeholder}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0 z-[60]">
        {/* Quick-pick shortcuts */}
        <div className="flex flex-wrap gap-1.5 p-2 border-b border-border">
          {[
            { label: "Today", offset: 0 },
            { label: "Tomorrow", offset: 1 },
            { label: "+2 days", offset: 2 },
            { label: "+1 week", offset: 7 },
            { label: "+2 weeks", offset: 14 },
          ].map(({ label, offset }) => {
            const target = new Date();
            target.setHours(0, 0, 0, 0);
            target.setDate(target.getDate() + offset);
            const disabled = !!minDate && target < minDate;
            return (
              <button
                key={label}
                type="button"
                disabled={disabled}
                onClick={() => {
                  onChange(format(target, "yyyy-MM-dd"));
                  setOpen(false);
                }}
                className={cn(
                  "text-[11px] font-semibold px-2.5 py-[5px] rounded-full border border-border transition-all duration-150",
                  disabled
                    ? "bg-transparent text-muted-foreground cursor-not-allowed opacity-50"
                    : "bg-card text-foreground cursor-pointer hover:bg-brand/[0.09] hover:border-brand hover:text-brand",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
        <Calendar
          mode="single"
          selected={selected}
          onSelect={(d) => {
            if (!d) return;
            onChange(format(d, "yyyy-MM-dd"));
            setOpen(false);
          }}
          disabled={minDate ? { before: minDate } : undefined}
          initialFocus
          className="p-2"
          classNames={{
            months: "flex flex-col",
            month: "space-y-2",
            caption: "flex justify-center pt-1 pb-1 relative items-center",
            caption_label: "text-sm font-semibold",
            nav: "space-x-1 flex items-center",
            nav_button:
              "h-7 w-7 bg-transparent p-0 opacity-60 hover:opacity-100 inline-flex items-center justify-center rounded-md border border-gray-200",
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse",
            head_row: "flex",
            head_cell:
              "text-gray-400 rounded-md w-8 font-medium text-[11px] uppercase tracking-wide",
            row: "flex w-full mt-1",
            cell: "h-8 w-8 text-center text-[12.5px] p-0 relative focus-within:relative focus-within:z-20",
            day: "h-8 w-8 p-0 font-normal rounded-md hover:bg-gray-100 aria-selected:opacity-100 inline-flex items-center justify-center",
            day_selected:
              "bg-[#117479] text-white hover:bg-[#117479] hover:text-white focus:bg-[#117479] focus:text-white",
            day_today: "bg-gray-100 font-semibold text-[#117479]",
            day_outside: "text-gray-300 opacity-50",
            day_disabled: "text-gray-300 opacity-50 cursor-not-allowed",
            day_hidden: "invisible",
          }}
        />
      </PopoverContent>
    </Popover>
  );
};
