import React from "react";
import { Plus, X, ChevronDown, Check, ImagePlus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

// ─── Token constants kept for consumers that import them directly ──────────
// These are the raw hex values; Tailwind classes are used in this file.
export const TEAL = "#117479";
export const TEAL_BG = "rgba(59, 217, 218, 0.14)";
export const TEAL_FOCUS = "rgba(59, 217, 218, 0.3)";
export const BLACK = "#0a1c1c";
export const GRAY_500 = "#6b6b6b";
export const GRAY_400 = "#888780";
export const GRAY_200 = "#D3D1C7";
export const WHITE = "#ffffff";
export const SURFACE = "#F7F8FA";
export const ERROR = "#ef4444";
export const ERROR_BG = "rgba(239,68,68,0.04)";
export const ERROR_RING = "rgba(239,68,68,0.1)";

/* ─── Section card ────────────────────────────────────────────────────────── */
export const SectionCard = ({
  icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) => (
  <div className="bg-th-surface-0 border border-[#EBEBEB] rounded-[20px] px-[22px] py-5 shadow-[0_2px_12px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.03)]">
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-[11px] bg-th-brand-soft border border-th-brand-border-soft flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-[13px] font-bold text-th-text-primary tracking-[-0.01em]">{title}</p>
        {subtitle && <p className="text-[11px] text-th-warm-text-muted mt-[1px]">{subtitle}</p>}
      </div>
    </div>
    <div className="flex flex-col gap-4">{children}</div>
  </div>
);

/* ─── Field wrapper ───────────────────────────────────────────────────────── */
export const Field = ({
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
    <label
      className={cn(
        "text-[12px] font-semibold uppercase tracking-[0.03em]",
        error ? "text-th-error-bright" : "text-th-warm-text-dark",
      )}
    >
      {label}
      {required && <span className="text-th-error-bright ml-[3px]">*</span>}
    </label>
    {children}
    {error && (
      <div className="flex items-center gap-1.5">
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="5.25" className="stroke-th-error-bright" strokeWidth="1.5" />
          <path
            d="M6 3.5v3M6 8.25v.25"
            className="stroke-th-error-bright"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <p className="text-[11.5px] text-th-error-bright">{error}</p>
      </div>
    )}
  </div>
);

/* ─── Styled input ────────────────────────────────────────────────────────── */
export const StyledInput = ({
  value,
  onChange,
  placeholder,
  type = "text",
  error,
  ...rest
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  error?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "type">) => (
  <input
    type={type}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    className={cn(
      "w-full h-12 px-4 text-[14px] text-th-text-primary font-[450]",
      "rounded-[13px] outline-none transition-all duration-150 border-[1.5px]",
      "bg-th-warm-surface focus:bg-th-surface-0",
      error
        ? "bg-th-error-bright-bg border-th-error-bright-soft focus:shadow-[0_0_0_3px_var(--th-error-bright-ring)]"
        : "border-transparent focus:border-th-brand focus:shadow-[0_0_0_4px_var(--th-ring),0_1px_4px_rgba(0,0,0,0.06)]",
    )}
    {...rest}
  />
);

/* ─── Styled textarea ─────────────────────────────────────────────────────── */
export const StyledTextarea = ({
  value,
  onChange,
  placeholder,
  error,
  maxLength,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: boolean;
  maxLength?: number;
}) => (
  <textarea
    value={value}
    onChange={(e) => onChange(e.target.value)}
    placeholder={placeholder}
    maxLength={maxLength}
    className={cn(
      "w-full min-h-[100px] px-4 py-3 text-[14px] text-th-text-primary font-[450]",
      "rounded-[13px] outline-none resize-none transition-all duration-150 border-[1.5px]",
      "bg-th-warm-surface focus:bg-th-surface-0",
      error
        ? "bg-th-error-bright-bg border-th-error-bright-soft focus:shadow-[0_0_0_3px_var(--th-error-bright-ring)]"
        : "border-transparent focus:border-th-brand focus:shadow-[0_0_0_4px_var(--th-ring),0_1px_4px_rgba(0,0,0,0.06)]",
    )}
  />
);

/* ─── Styled select ───────────────────────────────────────────────────────── */
export const StyledSelect = ({
  value,
  onChange,
  children,
  error,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  error?: boolean;
  placeholder?: string;
}) => (
  <div className="relative">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "w-full h-12 pl-4 pr-10 text-[14px] font-[450]",
        "rounded-[13px] outline-none appearance-none cursor-pointer transition-all duration-150 border-[1.5px]",
        value ? "text-th-text-primary" : "text-th-warm-text-muted",
        error
          ? "bg-th-error-bright-bg border-th-error-bright-soft focus:shadow-[0_0_0_3px_var(--th-error-bright-ring)]"
          : "bg-th-warm-surface border-transparent focus:bg-th-surface-0 focus:border-th-brand focus:shadow-[0_0_0_4px_var(--th-ring)]",
      )}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {children}
    </select>
    <ChevronDown
      size={15}
      className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-th-warm-text-muted"
    />
  </div>
);

/* ─── Rules list ──────────────────────────────────────────────────────────── */
export const RulesList = ({
  rules,
  onChange,
  onAdd,
  onRemove,
}: {
  rules: string[];
  onChange: (i: number, v: string) => void;
  onAdd: () => void;
  onRemove: (i: number) => void;
}) => (
  <div className="flex flex-col gap-2.5">
    {rules.map((rule, i) => (
      <div key={i} className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-full bg-th-warm-surface border border-th-warm-border flex items-center justify-center flex-shrink-0">
          <span className="text-[10px] font-bold text-th-warm-text-muted">{i + 1}</span>
        </div>
        <input
          value={rule}
          onChange={(e) => onChange(i, e.target.value)}
          placeholder="Add a rule…"
          className="flex-1 h-[42px] px-3.5 text-[13px] text-th-text-primary font-[450] bg-th-warm-surface border-[1.5px] border-transparent rounded-[11px] outline-none transition-all duration-150 focus:border-th-brand focus:bg-th-surface-0 focus:shadow-[0_0_0_4px_var(--th-ring)]"
        />
        <button
          type="button"
          onClick={() => onRemove(i)}
          className="w-7 h-7 rounded-full bg-transparent border-none flex items-center justify-center cursor-pointer"
        >
          <X size={13} className="text-th-warm-text-muted" />
        </button>
      </div>
    ))}
    <button
      type="button"
      onClick={onAdd}
      className="flex items-center gap-1.5 text-[12px] font-bold text-th-brand bg-transparent border-none cursor-pointer pl-[34px]"
    >
      <Plus size={13} /> Add rule
    </button>
  </div>
);

/* ─── Photo upload grid ───────────────────────────────────────────────────── */
export const PhotoGrid = ({
  coverPreview,
  galleryPreviews,
  onCoverSelect,
  onGallerySelect,
  idPrefix,
  error,
}: {
  coverPreview: string;
  galleryPreviews: string[];
  onCoverSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGallerySelect: (e: React.ChangeEvent<HTMLInputElement>, i: number) => void;
  idPrefix: string;
  error?: string;
}) => (
  <div className="flex flex-col gap-3">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      <label
        htmlFor={`${idPrefix}-cover`}
        className={cn(
          "col-span-1 relative h-[190px] rounded-[16px] overflow-hidden border-2 border-dashed bg-th-warm-surface flex flex-col items-center justify-center gap-2 cursor-pointer transition-all",
          error ? "border-th-error-bright-soft" : "border-th-warm-border",
        )}
      >
        {coverPreview ? (
          <img
            src={coverPreview}
            alt="Cover"
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <>
            <ImagePlus size={24} className="text-th-warm-text-muted" />
            <span className="text-[13px] font-semibold text-th-warm-text-dark">Cover Photo</span>
          </>
        )}
        <input
          id={`${idPrefix}-cover`}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={onCoverSelect}
        />
      </label>
      <div className="lg:col-span-2 grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <label
            key={i}
            htmlFor={`${idPrefix}-gallery-${i}`}
            className="relative h-[190px] rounded-[16px] overflow-hidden border-2 border-dashed border-th-warm-border bg-th-warm-surface flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all"
          >
            {galleryPreviews[i] ? (
              <img
                src={galleryPreviews[i]}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <>
                <Plus size={20} className="text-th-warm-text-muted" />
                <span className="text-[12px] text-th-warm-text-muted">Photo {i + 1}</span>
              </>
            )}
            <input
              id={`${idPrefix}-gallery-${i}`}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onGallerySelect(e, i)}
            />
          </label>
        ))}
      </div>
    </div>
    {error && (
      <div className="flex items-center gap-1.5">
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="5.25" className="stroke-th-error-bright" strokeWidth="1.5" />
          <path
            d="M6 3.5v3M6 8.25v.25"
            className="stroke-th-error-bright"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <p className="text-[11.5px] text-th-error-bright">{error}</p>
      </div>
    )}
  </div>
);

/* ─── Feature pill ────────────────────────────────────────────────────────── */
export const FeaturePill = ({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "flex items-center gap-2 px-3.5 py-2 rounded-full border-[1.5px] cursor-pointer transition-all text-[13px] font-semibold",
      selected
        ? "border-th-brand bg-th-brand-soft text-th-brand shadow-[0_0_0_3px_rgba(7,228,228,0.2)]"
        : "border-th-warm-border bg-th-warm-surface text-th-warm-text-dark hover:border-th-brand hover:bg-th-brand-soft",
    )}
  >
    {label}
    {selected && <Check size={12} strokeWidth={2.5} />}
  </button>
);

/* ─── Discount row ────────────────────────────────────────────────────────── */
export const DiscountRow = ({
  label,
  enabled,
  onToggle,
  type,
  value,
  onTypeChange,
  onValueChange,
}: {
  label: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
  type: string;
  value: string;
  onTypeChange: (v: string) => void;
  onValueChange: (v: string) => void;
}) => (
  <div
    className={cn(
      "px-4 py-3.5 rounded-[13px] border-[1.5px] transition-all",
      enabled ? "border-th-brand bg-th-brand-soft" : "border-th-warm-border bg-th-warm-surface",
    )}
  >
    <div className="flex items-center gap-3">
      <Checkbox checked={enabled} onCheckedChange={onToggle} />
      <span
        className={cn(
          "text-[13px] font-semibold",
          enabled ? "text-th-brand" : "text-th-warm-text-dark",
        )}
      >
        {label}
      </span>
    </div>
    {enabled && (
      <div className="grid grid-cols-2 gap-3 mt-3 pl-7">
        <StyledSelect value={type} onChange={onTypeChange}>
          <option value="percentage">Percentage (%)</option>
          <option value="fixed">Fixed Amount (₹)</option>
        </StyledSelect>
        <StyledInput
          value={value}
          onChange={onValueChange}
          placeholder={type === "percentage" ? "e.g. 20" : "e.g. 500"}
        />
      </div>
    )}
  </div>
);
