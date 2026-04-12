import React from "react";
import { ImagePlus, X, Plus, Check, FileImage, Type, ShieldCheck, Camera } from "lucide-react";
import { getImageUrl } from "@/lib/utils";

// ─── Brand tokens ────────────────────────────────────────────────────────────
const TEAL        = "#07e4e4";
const TEAL_BG     = "rgba(7, 228, 228, 0.07)";
const TEAL_FOCUS  = "rgba(7, 228, 228, 0.15)";
const BLACK       = "#131313";
const GRAY_700    = "#444444";
const GRAY_500    = "#6b6b6b";
const GRAY_400    = "#9a9a9a";
const GRAY_200    = "#e4e4e4";
const SURFACE     = "#F7F8FA";
const WHITE       = "#ffffff";

interface DescriptionStepProps {
  name: string;
  description: string;
  rules: string[];
  photos: (string | File)[];
  coverImage: (string | File)[];
  errors: Record<string, string>;
  sliderRef?: React.RefObject<HTMLDivElement>;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onAddRule: () => void;
  onRemoveRule: (index: number) => void;
  onUpdateRule: (index: number, value: string) => void;
  onPhotoUpload: (files: FileList | null) => void;
  onCoverUpload: (files: FileList | null) => void;
  onRemovePhoto: (index: number) => void;
  onRemoveCover: (index: number) => void;
  clearError: (field: string) => void;
}

const renderImageSrc = (fileOrUrl: any): string => {
  if (!fileOrUrl) return "";
  if (typeof fileOrUrl === "string") return getImageUrl(fileOrUrl);
  return URL.createObjectURL(fileOrUrl);
};

const GALLERY_TARGET = 5;

/* ─── Section card ────────────────────────────────────────────────────────── */
const SectionCard = ({
  icon,
  title,
  subtitle,
  action,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div
    style={{
      backgroundColor: WHITE,
      border: "1.5px solid #EBEBEB",
      borderRadius: 20,
      padding: "20px 22px 22px",
      boxShadow: "0 2px 12px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)",
    }}
  >
    <div className="flex items-start justify-between mb-5">
      <div className="flex items-center gap-3">
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 11,
            backgroundColor: TEAL_BG,
            border: `1.5px solid rgba(7,228,228,0.25)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: BLACK, letterSpacing: "-0.01em" }}>{title}</p>
          {subtitle && <p style={{ fontSize: 11, color: GRAY_400, marginTop: 1 }}>{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
    {children}
  </div>
);

/* ─── Field wrapper ───────────────────────────────────────────────────────── */
const Field = ({
  label,
  required,
  error,
  right,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-1.5">
    <div className="flex items-center justify-between mb-0.5">
      <label
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: error ? "#ef4444" : GRAY_500,
          letterSpacing: "0.03em",
          textTransform: "uppercase",
        }}
      >
        {label}
        {required && <span style={{ color: "#ef4444", marginLeft: 3 }}>*</span>}
      </label>
      {right}
    </div>
    {children}
    {error && (
      <div className="flex items-center gap-1.5 mt-0.5">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="5.25" stroke="#ef4444" strokeWidth="1.5" />
          <path d="M6 3.5v3M6 8.25v.25" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <p style={{ fontSize: 11.5, color: "#ef4444" }}>{error}</p>
      </div>
    )}
  </div>
);

/* ─── Styled input ────────────────────────────────────────────────────────── */
const StyledInput = ({
  value,
  onChange,
  placeholder,
  maxLength,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  error?: boolean;
}) => {
  const [focused, setFocused] = React.useState(false);
  const active = focused && !error;
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder={placeholder}
      maxLength={maxLength}
      style={{
        width: "100%",
        height: 52,
        padding: "0 16px",
        fontSize: 14.5,
        color: BLACK,
        backgroundColor: focused ? WHITE : SURFACE,
        border: `1.5px solid ${error ? "#ef4444" : focused ? TEAL : "transparent"}`,
        borderRadius: 13,
        outline: "none",
        boxShadow: active
          ? `0 0 0 4px ${TEAL_FOCUS}, 0 1px 4px rgba(0,0,0,0.06)`
          : error
          ? "0 0 0 3px rgba(239,68,68,0.1)"
          : "none",
        transition: "background-color 0.15s, border-color 0.15s, box-shadow 0.2s",
        fontWeight: 450,
        letterSpacing: "-0.005em",
      }}
    />
  );
};

/* ─── Styled textarea ─────────────────────────────────────────────────────── */
const StyledTextarea = ({
  value,
  onChange,
  placeholder,
  maxLength,
  rows = 4,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  maxLength?: number;
  rows?: number;
  error?: boolean;
}) => {
  const [focused, setFocused] = React.useState(false);
  const active = focused && !error;
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder={placeholder}
      maxLength={maxLength}
      rows={rows}
      style={{
        width: "100%",
        padding: "14px 16px",
        fontSize: 14.5,
        color: BLACK,
        backgroundColor: focused ? WHITE : SURFACE,
        border: `1.5px solid ${error ? "#ef4444" : focused ? TEAL : "transparent"}`,
        borderRadius: 13,
        outline: "none",
        resize: "none",
        boxShadow: active
          ? `0 0 0 4px ${TEAL_FOCUS}, 0 1px 4px rgba(0,0,0,0.06)`
          : error
          ? "0 0 0 3px rgba(239,68,68,0.1)"
          : "none",
        transition: "background-color 0.15s, border-color 0.15s, box-shadow 0.2s",
        lineHeight: 1.65,
        fontWeight: 450,
        letterSpacing: "-0.005em",
      }}
    />
  );
};

/* ─── Character count pill ────────────────────────────────────────────────── */
const CharCount = ({ value, max }: { value: number; max: number }) => {
  const pct = value / max;
  const color = pct >= 0.9 ? "#f59e0b" : pct >= 0.7 ? GRAY_500 : GRAY_400;
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        color,
        backgroundColor: pct >= 0.9 ? "rgba(245,158,11,0.1)" : SURFACE,
        borderRadius: 99,
        padding: "2px 8px",
        border: `1px solid ${pct >= 0.9 ? "rgba(245,158,11,0.25)" : GRAY_200}`,
        transition: "all 0.2s",
      }}
    >
      {value}/{max}
    </span>
  );
};

/* ─── Main component ──────────────────────────────────────────────────────── */
const DescriptionStep: React.FC<DescriptionStepProps> = ({
  name,
  description,
  rules,
  photos,
  coverImage,
  errors,
  onNameChange,
  onDescriptionChange,
  onAddRule,
  onRemoveRule,
  onUpdateRule,
  onPhotoUpload,
  onCoverUpload,
  onRemovePhoto,
  onRemoveCover,
  clearError,
}) => {
  const galleryFilled = Math.min(photos.length, GALLERY_TARGET);
  const galleryPct    = (galleryFilled / GALLERY_TARGET) * 100;

  return (
    <div className="flex flex-col items-center gap-7 w-full max-w-2xl">

      {/* ── Header ── */}
      <div className="text-center space-y-2 pb-1">
        <div className="flex items-center justify-center gap-2.5 mb-3">
          <div style={{ width: 24, height: 3, borderRadius: 99, backgroundColor: TEAL }} />
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: "0.13em",
              textTransform: "uppercase",
              color: GRAY_400,
            }}
          >
            Caravan Details
          </span>
          <div style={{ width: 24, height: 3, borderRadius: 99, backgroundColor: TEAL }} />
        </div>
        <h1
          style={{
            fontSize: "clamp(22px, 3.5vw, 30px)",
            fontWeight: 800,
            color: BLACK,
            letterSpacing: "-0.03em",
            lineHeight: 1.15,
          }}
        >
          Tell guests about your caravan
        </h1>
        <p style={{ fontSize: 14, color: GRAY_500, lineHeight: 1.6 }}>
          Great photos and a clear description help guests choose you.
        </p>
      </div>

      <div className="w-full flex flex-col gap-4">

        {/* ── Identity card (Name + Description) ── */}
        <SectionCard
          icon={<Type size={16} color={TEAL} strokeWidth={2.5} />}
          title="Identity"
          subtitle="How your listing appears to guests"
        >
          <div className="flex flex-col gap-5">
            <Field
              label="Caravan Name"
              required
              error={errors.name}
              right={<CharCount value={name.length} max={50} />}
            >
              <StyledInput
                value={name}
                onChange={(v) => { onNameChange(v); if (errors.name) clearError("name"); }}
                placeholder="e.g. Cozy Mountain Camper"
                maxLength={50}
                error={!!errors.name}
              />
            </Field>

            <Field
              label="Description"
              required
              error={errors.description}
              right={<CharCount value={description.length} max={200} />}
            >
              <StyledTextarea
                value={description}
                onChange={(v) => { onDescriptionChange(v); if (errors.description) clearError("description"); }}
                placeholder="Describe the vibe, features, and what makes it special for travellers…"
                maxLength={200}
                rows={4}
                error={!!errors.description}
              />
              <p style={{ fontSize: 11, color: GRAY_400, marginTop: 5 }}>
                What makes your caravan unique? Mention the vibe, standout features, and ideal guests.
              </p>
            </Field>
          </div>
        </SectionCard>

        {/* ── Rules card ── */}
        <SectionCard
          icon={<ShieldCheck size={16} color={TEAL} strokeWidth={2.5} />}
          title="Rules &amp; Regulations"
          subtitle="Guidelines guests must follow"
          action={
            <button
              type="button"
              onClick={onAddRule}
              className="flex items-center gap-1.5 transition-all"
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: TEAL,
                background: TEAL_BG,
                border: `1.5px solid rgba(7,228,228,0.35)`,
                borderRadius: 9,
                padding: "6px 14px",
                cursor: "pointer",
                letterSpacing: "0.01em",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(7,228,228,0.14)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor = TEAL_BG;
              }}
            >
              <Plus size={12} strokeWidth={2.5} />
              Add Rule
            </button>
          }
        >
          <div className="flex flex-col gap-2">
            {rules.map((rule, index) => (
              <RuleRow
                key={index}
                index={index}
                value={rule}
                onChange={(v) => onUpdateRule(index, v)}
                onRemove={() => onRemoveRule(index)}
              />
            ))}

            {rules.length === 0 && (
              <div
                className="flex flex-col items-center justify-center py-7 gap-2"
                style={{
                  border: `1.5px dashed ${GRAY_200}`,
                  borderRadius: 13,
                  backgroundColor: SURFACE,
                }}
              >
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 10,
                    backgroundColor: GRAY_200,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                    <path d="M2 4h12M2 8h8M2 12h5" stroke={GRAY_400} strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <p style={{ fontSize: 12.5, color: GRAY_400 }}>No rules yet — add one above</p>
              </div>
            )}
          </div>
        </SectionCard>

        {/* ── Photos card (Cover + Gallery) ── */}
        <SectionCard
          icon={<Camera size={16} color={TEAL} strokeWidth={2.5} />}
          title="Photos"
          subtitle="High quality photos get more bookings"
        >
          <div className="flex flex-col gap-6">

            {/* Cover photo */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: GRAY_500, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                    Cover Photo
                  </p>
                  <p style={{ fontSize: 11, color: GRAY_400, marginTop: 1 }}>
                    First image guests see — make it count
                  </p>
                </div>
                {coverImage?.[0] ? (
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      color: "#22c55e",
                      backgroundColor: "rgba(34,197,94,0.08)",
                      border: "1px solid rgba(34,197,94,0.2)",
                      borderRadius: 99,
                      padding: "2px 10px",
                    }}
                  >
                    ✓ Set
                  </span>
                ) : null}
              </div>
              <CoverUpload
                file={coverImage?.[0]}
                onUpload={(files) => { onCoverUpload(files); if (errors.coverImage) clearError("coverImage"); }}
                onRemove={() => onRemoveCover(0)}
                error={errors.coverImage}
              />
            </div>

            {/* Divider */}
            <div style={{ height: 1, backgroundColor: "#F0F0F0" }} />

            {/* Gallery */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: GRAY_500, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                    Gallery Photos
                  </p>
                  <p style={{ fontSize: 11, color: GRAY_400, marginTop: 1 }}>
                    {photos.length > 0
                      ? `${photos.length} photo${photos.length !== 1 ? "s" : ""} added${photos.length < GALLERY_TARGET ? ` · ${GALLERY_TARGET - photos.length} more recommended` : " · Looking great!"}`
                      : `Add up to ${GALLERY_TARGET}+ photos`}
                  </p>
                </div>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    fontWeight: 700,
                    color: errors.photos ? "#ef4444" : GRAY_700,
                    border: `1.5px solid ${errors.photos ? "#ef4444" : GRAY_200}`,
                    borderRadius: 9,
                    padding: "6px 14px",
                    cursor: "pointer",
                    backgroundColor: WHITE,
                    transition: "all 0.15s",
                    letterSpacing: "0.01em",
                  }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLLabelElement).style.borderColor = TEAL;
                    (e.currentTarget as HTMLLabelElement).style.color = TEAL;
                    (e.currentTarget as HTMLLabelElement).style.backgroundColor = TEAL_BG;
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLLabelElement).style.borderColor = errors.photos ? "#ef4444" : GRAY_200;
                    (e.currentTarget as HTMLLabelElement).style.color = errors.photos ? "#ef4444" : GRAY_700;
                    (e.currentTarget as HTMLLabelElement).style.backgroundColor = WHITE;
                  }}
                >
                  <Plus size={12} strokeWidth={2.5} />
                  Add Photos
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      onPhotoUpload(e.target.files);
                      if (errors.photos) clearError("photos");
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Progress bar */}
              <div className="flex items-center gap-3">
                <div
                  style={{
                    flex: 1,
                    height: 6,
                    backgroundColor: "#F0F0F0",
                    borderRadius: 99,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${galleryPct}%`,
                      borderRadius: 99,
                      background:
                        galleryFilled >= GALLERY_TARGET
                          ? "linear-gradient(90deg, #22c55e, #16a34a)"
                          : `linear-gradient(90deg, ${TEAL}, rgba(7,228,228,0.6))`,
                      transition: "width 0.5s cubic-bezier(0.16,1,0.3,1)",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: galleryFilled >= GALLERY_TARGET ? "#22c55e" : GRAY_500,
                    minWidth: 28,
                    textAlign: "right",
                  }}
                >
                  {galleryFilled}/{GALLERY_TARGET}
                </span>
              </div>

              {photos.length > 0 ? (
                <>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {photos.map((photo, index) => (
                      <GalleryThumb
                        key={index}
                        src={renderImageSrc(photo)}
                        index={index}
                        isRecommended={index < GALLERY_TARGET}
                        onRemove={() => onRemovePhoto(index)}
                      />
                    ))}
                    {photos.length < 10 && (
                      <label
                        className="aspect-square flex flex-col items-center justify-center gap-1 cursor-pointer"
                        style={{
                          border: `1.5px dashed ${GRAY_200}`,
                          borderRadius: 12,
                          backgroundColor: SURFACE,
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLLabelElement).style.borderColor = TEAL;
                          (e.currentTarget as HTMLLabelElement).style.backgroundColor = TEAL_BG;
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLLabelElement).style.borderColor = GRAY_200;
                          (e.currentTarget as HTMLLabelElement).style.backgroundColor = SURFACE;
                        }}
                      >
                        <Plus size={15} color={GRAY_400} />
                        <span style={{ fontSize: 9, color: GRAY_400, fontWeight: 700, letterSpacing: "0.05em" }}>ADD</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => onPhotoUpload(e.target.files)}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                  {errors.photos && (
                    <div className="flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <circle cx="6" cy="6" r="5.25" stroke="#ef4444" strokeWidth="1.5" />
                        <path d="M6 3.5v3M6 8.25v.25" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                      <p style={{ fontSize: 11.5, color: "#ef4444" }}>{errors.photos}</p>
                    </div>
                  )}
                </>
              ) : (
                <GalleryEmptyState onUpload={onPhotoUpload} error={errors.photos} />
              )}
            </div>

          </div>
        </SectionCard>

      </div>
    </div>
  );
};

/* ─── Rule row ────────────────────────────────────────────────────────────── */
const RuleRow = ({
  index,
  value,
  onChange,
  onRemove,
}: {
  index: number;
  value: string;
  onChange: (v: string) => void;
  onRemove: () => void;
}) => {
  const [focused, setFocused] = React.useState(false);
  return (
    <div
      className="flex items-center gap-2.5"
      style={{
        backgroundColor: focused ? WHITE : SURFACE,
        border: `1.5px solid ${focused ? TEAL : "transparent"}`,
        borderRadius: 13,
        padding: "6px 8px 6px 10px",
        boxShadow: focused ? `0 0 0 4px ${TEAL_FOCUS}` : "none",
        transition: "all 0.15s",
      }}
    >
      <span
        style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          backgroundColor: focused ? TEAL_BG : GRAY_200,
          border: `1.5px solid ${focused ? "rgba(7,228,228,0.4)" : "transparent"}`,
          color: focused ? TEAL : GRAY_400,
          fontSize: 10.5,
          fontWeight: 800,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "all 0.15s",
        }}
      >
        {index + 1}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={`Rule ${index + 1}…`}
        maxLength={250}
        style={{
          flex: 1,
          height: 36,
          padding: "0 4px",
          fontSize: 13.5,
          color: BLACK,
          backgroundColor: "transparent",
          border: "none",
          outline: "none",
          fontWeight: 450,
        }}
      />
      <button
        type="button"
        onClick={onRemove}
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          border: "none",
          backgroundColor: "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "all 0.15s",
          flexShrink: 0,
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#fef2f2";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
        }}
      >
        <X size={13} color={GRAY_400} />
      </button>
    </div>
  );
};

/* ─── Cover upload ────────────────────────────────────────────────────────── */
const CoverUpload = ({
  file,
  onUpload,
  onRemove,
  error,
}: {
  file?: string | File;
  onUpload: (files: FileList | null) => void;
  onRemove: () => void;
  error?: string;
}) => {
  const [hovered, setHovered] = React.useState(false);

  if (file) {
    return (
      <div
        className="relative w-full overflow-hidden"
        style={{ height: 220, borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <img
          src={typeof file === "string" ? getImageUrl(file) : URL.createObjectURL(file)}
          alt="Cover"
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(to top, rgba(0,0,0,${hovered ? 0.4 : 0.1}), transparent)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.25s",
          }}
        >
          <label
            style={{
              opacity: hovered ? 1 : 0,
              transform: hovered ? "translateY(0)" : "translateY(6px)",
              transition: "opacity 0.2s, transform 0.2s",
              backgroundColor: "rgba(255,255,255,0.95)",
              backdropFilter: "blur(8px)",
              color: BLACK,
              fontSize: 12.5,
              fontWeight: 700,
              padding: "9px 20px",
              borderRadius: 99,
              cursor: "pointer",
              boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
              letterSpacing: "0.01em",
            }}
          >
            Change Photo
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onUpload(e.target.files)}
              className="hidden"
            />
          </label>
        </div>
        <button
          type="button"
          onClick={onRemove}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            width: 30,
            height: 30,
            borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(6px)",
            border: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
          }}
        >
          <X size={12} color={BLACK} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label
        className="w-full flex flex-col items-center justify-center gap-3 cursor-pointer"
        style={{
          height: 170,
          border: `2px dashed ${error ? "#fca5a5" : GRAY_200}`,
          borderRadius: 16,
          backgroundColor: error ? "rgba(239,68,68,0.04)" : SURFACE,
          boxShadow: error ? "0 0 0 3px rgba(239,68,68,0.08)" : "none",
          transition: "all 0.2s",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLLabelElement).style.borderColor = error ? "#ef4444" : TEAL;
          (e.currentTarget as HTMLLabelElement).style.backgroundColor = error ? "rgba(239,68,68,0.07)" : TEAL_BG;
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLLabelElement).style.borderColor = error ? "#fca5a5" : GRAY_200;
          (e.currentTarget as HTMLLabelElement).style.backgroundColor = error ? "rgba(239,68,68,0.04)" : SURFACE;
        }}
      >
        <div
          style={{
            width: 50,
            height: 50,
            borderRadius: 15,
            backgroundColor: WHITE,
            border: `1.5px solid ${error ? "#fca5a5" : GRAY_200}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
          }}
        >
          <ImagePlus size={22} color={error ? "#f87171" : GRAY_400} />
        </div>
        <div className="text-center">
          <p style={{ fontSize: 13.5, fontWeight: 700, color: error ? "#ef4444" : BLACK }}>Upload cover photo</p>
          <p style={{ fontSize: 11, color: GRAY_400, marginTop: 3 }}>Click to browse · JPG, PNG, WEBP</p>
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => onUpload(e.target.files)}
          className="hidden"
        />
      </label>
      {error && (
        <div className="flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="5.25" stroke="#ef4444" strokeWidth="1.5" />
            <path d="M6 3.5v3M6 8.25v.25" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <p style={{ fontSize: 11.5, color: "#ef4444" }}>{error}</p>
        </div>
      )}
    </div>
  );
};

/* ─── Gallery thumbnail ───────────────────────────────────────────────────── */
const GalleryThumb = ({
  src,
  index,
  isRecommended,
  onRemove,
}: {
  src: string;
  index: number;
  isRecommended: boolean;
  onRemove: () => void;
}) => {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      className="relative aspect-square overflow-hidden"
      style={{
        borderRadius: 12,
        boxShadow: hovered ? "0 4px 16px rgba(0,0,0,0.15)" : "0 1px 4px rgba(0,0,0,0.08)",
        transform: hovered ? "scale(1.02)" : "scale(1)",
        transition: "box-shadow 0.15s, transform 0.15s",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img
        src={src}
        alt={`Photo ${index + 1}`}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />

      {isRecommended && (
        <div
          style={{
            position: "absolute",
            top: 5,
            left: 5,
            width: 18,
            height: 18,
            borderRadius: "50%",
            backgroundColor: "#22c55e",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
          }}
        >
          <Check size={9} color={WHITE} strokeWidth={2.5} />
        </div>
      )}

      <button
        type="button"
        onClick={onRemove}
        style={{
          position: "absolute",
          top: 5,
          right: 5,
          width: 22,
          height: 22,
          borderRadius: "50%",
          backgroundColor: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.15s",
        }}
      >
        <X size={10} color={WHITE} />
      </button>
    </div>
  );
};

/* ─── Gallery empty state ─────────────────────────────────────────────────── */
const GalleryEmptyState = ({
  onUpload,
  error,
}: {
  onUpload: (files: FileList | null) => void;
  error?: string;
}) => (
  <div className="flex flex-col gap-1.5">
  <label
    className="w-full flex flex-col items-center justify-center gap-3 cursor-pointer"
    style={{
      padding: "36px 24px",
      border: `2px dashed ${error ? "#fca5a5" : GRAY_200}`,
      borderRadius: 16,
      backgroundColor: error ? "rgba(239,68,68,0.04)" : SURFACE,
      boxShadow: error ? "0 0 0 3px rgba(239,68,68,0.08)" : "none",
      transition: "all 0.2s",
    }}
    onMouseEnter={e => {
      (e.currentTarget as HTMLLabelElement).style.borderColor = error ? "#ef4444" : TEAL;
      (e.currentTarget as HTMLLabelElement).style.backgroundColor = error ? "rgba(239,68,68,0.07)" : TEAL_BG;
    }}
    onMouseLeave={e => {
      (e.currentTarget as HTMLLabelElement).style.borderColor = error ? "#fca5a5" : GRAY_200;
      (e.currentTarget as HTMLLabelElement).style.backgroundColor = error ? "rgba(239,68,68,0.04)" : SURFACE;
    }}
  >
    <div
      style={{
        width: 52,
        height: 52,
        borderRadius: 15,
        backgroundColor: WHITE,
        border: `1.5px solid ${error ? "#fca5a5" : GRAY_200}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
      }}
    >
      <FileImage size={24} color={error ? "#f87171" : GRAY_400} />
    </div>
    <div className="text-center">
      <p style={{ fontSize: 13.5, fontWeight: 700, color: error ? "#ef4444" : BLACK }}>Add gallery photos</p>
      <p style={{ fontSize: 11, color: GRAY_400, marginTop: 3 }}>
        Listings with 5+ photos get 40% more bookings
      </p>
    </div>
    <span
      style={{
        fontSize: 12,
        fontWeight: 700,
        color: error ? "#ef4444" : TEAL,
        border: `1.5px solid ${error ? "rgba(239,68,68,0.4)" : "rgba(7,228,228,0.4)"}`,
        borderRadius: 9,
        padding: "7px 18px",
        backgroundColor: error ? "rgba(239,68,68,0.07)" : TEAL_BG,
        letterSpacing: "0.01em",
      }}
    >
      Browse Photos
    </span>
    <input
      type="file"
      multiple
      accept="image/*"
      onChange={(e) => onUpload(e.target.files)}
      className="hidden"
    />
  </label>
  {error && (
    <div className="flex items-center gap-1.5">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <circle cx="6" cy="6" r="5.25" stroke="#ef4444" strokeWidth="1.5" />
        <path d="M6 3.5v3M6 8.25v.25" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <p style={{ fontSize: 11.5, color: "#ef4444" }}>{error}</p>
    </div>
  )}
  </div>
);

export default DescriptionStep;
