import React from "react";
import { Plus, X, ChevronDown, Check, ImagePlus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

// ─── Brand tokens ─────────────────────────────────────────────────────────────
export const TEAL       = "#07e4e4";
export const TEAL_BG    = "rgba(7, 228, 228, 0.07)";
export const TEAL_FOCUS = "rgba(7, 228, 228, 0.15)";
export const BLACK      = "#131313";
export const GRAY_500   = "#6b6b6b";
export const GRAY_400   = "#9a9a9a";
export const GRAY_200   = "#e4e4e4";
export const WHITE      = "#ffffff";
export const SURFACE    = "#F7F8FA";
export const ERROR      = "#ef4444";
export const ERROR_BG   = "rgba(239,68,68,0.04)";
export const ERROR_RING = "rgba(239,68,68,0.1)";

/* ─── Section card ────────────────────────────────────────────────────────── */
export const SectionCard = ({ icon, title, subtitle, children }: {
  icon: React.ReactNode; title: string; subtitle?: string; children: React.ReactNode;
}) => (
  <div style={{ backgroundColor: WHITE, border: "1.5px solid #EBEBEB", borderRadius: 20, padding: "20px 22px 22px", boxShadow: "0 2px 12px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)" }}>
    <div className="flex items-center gap-3 mb-5">
      <div style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: TEAL_BG, border: "1.5px solid rgba(7,228,228,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{icon}</div>
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: BLACK, letterSpacing: "-0.01em" }}>{title}</p>
        {subtitle && <p style={{ fontSize: 11, color: GRAY_400, marginTop: 1 }}>{subtitle}</p>}
      </div>
    </div>
    <div className="flex flex-col gap-4">{children}</div>
  </div>
);

/* ─── Field wrapper ───────────────────────────────────────────────────────── */
export const Field = ({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1.5">
    <label style={{ fontSize: 12, fontWeight: 600, color: error ? ERROR : GRAY_500, textTransform: "uppercase", letterSpacing: "0.03em" }}>
      {label}{required && <span style={{ color: ERROR, marginLeft: 3 }}>*</span>}
    </label>
    {children}
    {error && (
      <div className="flex items-center gap-1.5">
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5.25" stroke={ERROR} strokeWidth="1.5" /><path d="M6 3.5v3M6 8.25v.25" stroke={ERROR} strokeWidth="1.5" strokeLinecap="round" /></svg>
        <p style={{ fontSize: 11.5, color: ERROR }}>{error}</p>
      </div>
    )}
  </div>
);

/* ─── Styled input ────────────────────────────────────────────────────────── */
export const StyledInput = ({ value, onChange, placeholder, type = "text", error, ...rest }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; error?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "type">) => {
  const [focused, setFocused] = React.useState(false);
  return (
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder={placeholder}
      style={{ width: "100%", height: 48, padding: "0 16px", fontSize: 14, color: BLACK, fontWeight: 450, backgroundColor: error ? ERROR_BG : focused ? WHITE : SURFACE, border: `1.5px solid ${error ? "#fca5a5" : focused ? TEAL : "transparent"}`, borderRadius: 13, outline: "none", boxShadow: focused && !error ? `0 0 0 4px ${TEAL_FOCUS}, 0 1px 4px rgba(0,0,0,0.06)` : error ? `0 0 0 3px ${ERROR_RING}` : "none", transition: "all 0.15s" }}
      {...rest}
    />
  );
};

/* ─── Styled textarea ─────────────────────────────────────────────────────── */
export const StyledTextarea = ({ value, onChange, placeholder, error, maxLength }: {
  value: string; onChange: (v: string) => void; placeholder?: string; error?: boolean; maxLength?: number;
}) => {
  const [focused, setFocused] = React.useState(false);
  return (
    <textarea value={value} onChange={(e) => onChange(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} placeholder={placeholder} maxLength={maxLength}
      style={{ width: "100%", minHeight: 100, padding: "12px 16px", fontSize: 14, color: BLACK, fontWeight: 450, backgroundColor: error ? ERROR_BG : focused ? WHITE : SURFACE, border: `1.5px solid ${error ? "#fca5a5" : focused ? TEAL : "transparent"}`, borderRadius: 13, outline: "none", resize: "none", boxShadow: focused && !error ? `0 0 0 4px ${TEAL_FOCUS}, 0 1px 4px rgba(0,0,0,0.06)` : error ? `0 0 0 3px ${ERROR_RING}` : "none", transition: "all 0.15s" }}
    />
  );
};

/* ─── Styled select ───────────────────────────────────────────────────────── */
export const StyledSelect = ({ value, onChange, children, error, placeholder }: {
  value: string; onChange: (v: string) => void; children: React.ReactNode; error?: boolean; placeholder?: string;
}) => {
  const [focused, setFocused] = React.useState(false);
  return (
    <div style={{ position: "relative" }}>
      <select value={value} onChange={(e) => onChange(e.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ width: "100%", height: 48, padding: "0 40px 0 16px", fontSize: 14, color: value ? BLACK : GRAY_400, fontWeight: 450, backgroundColor: error ? ERROR_BG : focused ? WHITE : SURFACE, border: `1.5px solid ${error ? "#fca5a5" : focused ? TEAL : "transparent"}`, borderRadius: 13, outline: "none", appearance: "none", boxShadow: focused && !error ? `0 0 0 4px ${TEAL_FOCUS}` : error ? `0 0 0 3px ${ERROR_RING}` : "none", transition: "all 0.15s", cursor: "pointer" }}>
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {children}
      </select>
      <ChevronDown size={15} style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: GRAY_400 }} />
    </div>
  );
};

/* ─── Rules list ──────────────────────────────────────────────────────────── */
export const RulesList = ({ rules, onChange, onAdd, onRemove }: {
  rules: string[]; onChange: (i: number, v: string) => void; onAdd: () => void; onRemove: (i: number) => void;
}) => (
  <div className="flex flex-col gap-2.5">
    {rules.map((rule, i) => (
      <div key={i} className="flex items-center gap-2.5">
        <div style={{ width: 24, height: 24, borderRadius: "50%", backgroundColor: SURFACE, border: `1.5px solid ${GRAY_200}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: GRAY_400 }}>{i + 1}</span>
        </div>
        <input value={rule} onChange={(e) => onChange(i, e.target.value)} placeholder="Add a rule\u2026"
          style={{ flex: 1, height: 42, padding: "0 14px", fontSize: 13, color: BLACK, fontWeight: 450, backgroundColor: SURFACE, border: "1.5px solid transparent", borderRadius: 11, outline: "none", transition: "all 0.15s" }}
          onFocus={(e) => { e.target.style.borderColor = TEAL; e.target.style.backgroundColor = WHITE; e.target.style.boxShadow = `0 0 0 4px ${TEAL_FOCUS}`; }}
          onBlur={(e) => { e.target.style.borderColor = "transparent"; e.target.style.backgroundColor = SURFACE; e.target.style.boxShadow = "none"; }}
        />
        <button type="button" onClick={() => onRemove(i)} style={{ width: 28, height: 28, borderRadius: "50%", backgroundColor: "transparent", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <X size={13} color={GRAY_400} />
        </button>
      </div>
    ))}
    <button type="button" onClick={onAdd} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: TEAL, backgroundColor: "transparent", border: "none", cursor: "pointer", paddingLeft: 34 }}>
      <Plus size={13} /> Add rule
    </button>
  </div>
);

/* ─── Photo upload grid ───────────────────────────────────────────────────── */
export const PhotoGrid = ({ coverPreview, galleryPreviews, onCoverSelect, onGallerySelect, idPrefix, error }: {
  coverPreview: string; galleryPreviews: string[]; onCoverSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGallerySelect: (e: React.ChangeEvent<HTMLInputElement>, i: number) => void; idPrefix: string; error?: string;
}) => (
  <div className="flex flex-col gap-3">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
      <label htmlFor={`${idPrefix}-cover`} style={{ gridColumn: "span 1", position: "relative", height: 190, borderRadius: 16, overflow: "hidden", border: `2px dashed ${error ? "#fca5a5" : GRAY_200}`, backgroundColor: SURFACE, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", transition: "all 0.15s" }}>
        {coverPreview ? (
          <img src={coverPreview} alt="Cover" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <><ImagePlus size={24} color={GRAY_400} /><span style={{ fontSize: 13, fontWeight: 600, color: GRAY_500 }}>Cover Photo</span></>
        )}
        <input id={`${idPrefix}-cover`} type="file" accept="image/*" className="hidden" onChange={onCoverSelect} />
      </label>
      <div className="lg:col-span-2 grid grid-cols-2 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <label key={i} htmlFor={`${idPrefix}-gallery-${i}`} style={{ position: "relative", height: 190, borderRadius: 16, overflow: "hidden", border: `2px dashed ${GRAY_200}`, backgroundColor: SURFACE, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer", transition: "all 0.15s" }}>
            {galleryPreviews[i] ? (
              <img src={galleryPreviews[i]} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <><Plus size={20} color={GRAY_400} /><span style={{ fontSize: 12, color: GRAY_400 }}>Photo {i + 1}</span></>
            )}
            <input id={`${idPrefix}-gallery-${i}`} type="file" accept="image/*" className="hidden" onChange={(e) => onGallerySelect(e, i)} />
          </label>
        ))}
      </div>
    </div>
    {error && (
      <div className="flex items-center gap-1.5">
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5.25" stroke={ERROR} strokeWidth="1.5" /><path d="M6 3.5v3M6 8.25v.25" stroke={ERROR} strokeWidth="1.5" strokeLinecap="round" /></svg>
        <p style={{ fontSize: 11.5, color: ERROR }}>{error}</p>
      </div>
    )}
  </div>
);

/* ─── Feature pill ────────────────────────────────────────────────────────── */
export const FeaturePill = ({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) => (
  <button type="button" onClick={onClick}
    style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 99, border: `1.5px solid ${selected ? TEAL : GRAY_200}`, backgroundColor: selected ? TEAL_BG : SURFACE, boxShadow: selected ? "0 0 0 3px rgba(7,228,228,0.2)" : "none", cursor: "pointer", transition: "all 0.15s", color: selected ? TEAL : GRAY_500, fontSize: 13, fontWeight: 600 }}
    onMouseEnter={(e) => { if (!selected) { (e.currentTarget as HTMLButtonElement).style.borderColor = TEAL; (e.currentTarget as HTMLButtonElement).style.backgroundColor = TEAL_BG; } }}
    onMouseLeave={(e) => { if (!selected) { (e.currentTarget as HTMLButtonElement).style.borderColor = GRAY_200; (e.currentTarget as HTMLButtonElement).style.backgroundColor = SURFACE; } }}>
    {label}
    {selected && <Check size={12} strokeWidth={2.5} />}
  </button>
);

/* ─── Discount row ────────────────────────────────────────────────────────── */
export const DiscountRow = ({ label, enabled, onToggle, type, value, onTypeChange, onValueChange }: {
  label: string; enabled: boolean; onToggle: (v: boolean) => void;
  type: string; value: string; onTypeChange: (v: string) => void; onValueChange: (v: string) => void;
}) => (
  <div style={{ padding: "14px 16px", borderRadius: 13, border: `1.5px solid ${enabled ? TEAL : GRAY_200}`, backgroundColor: enabled ? TEAL_BG : SURFACE, transition: "all 0.15s" }}>
    <div className="flex items-center gap-3">
      <Checkbox checked={enabled} onCheckedChange={onToggle} />
      <span style={{ fontSize: 13, fontWeight: 600, color: enabled ? TEAL : GRAY_500 }}>{label}</span>
    </div>
    {enabled && (
      <div className="grid grid-cols-2 gap-3 mt-3 pl-7">
        <StyledSelect value={type} onChange={onTypeChange}>
          <option value="percentage">Percentage (%)</option>
          <option value="fixed">Fixed Amount (\u20B9)</option>
        </StyledSelect>
        <StyledInput value={value} onChange={onValueChange} placeholder={type === "percentage" ? "e.g. 20" : "e.g. 500"} />
      </div>
    )}
  </div>
);
