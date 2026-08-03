import React from "react";
import {
  ImagePlus,
  X,
  Plus,
  Check,
  Type,
  ShieldCheck,
  Camera,
  UploadCloud,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SectionCard,
  Field,
  ErrorMsg,
  StyledInput,
  StyledTextarea,
  CharCount,
  StepHeader,
  useObjectURL,
} from "../shared/primitives";

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
  // When rendered inside an existing scrollable form (e.g. edit page) instead
  // of the onboarding wizard, drop the StepHeader and the centered max-width
  // wrapper so the section blends with the host page chrome.
  embedded?: boolean;
  // Optional overrides so this step can also stand in for unique-stay /
  // activity edit, where the name field reads as "Property Name" / "Activity
  // Name" instead of "Caravan Name".
  nameLabel?: string;
  namePlaceholder?: string;
}

const GALLERY_TARGET = 5;
const GALLERY_MAX = 10;

// Shared teal pill CTA — every "Add ___" action in this step uses the same
// shape so they read as one design family instead of three different buttons.
const PillCTA: React.FC<{
  icon?: React.ReactNode;
  label: string;
  as?: "button" | "label";
  onClick?: () => void;
  children?: React.ReactNode;
  size?: "sm" | "md";
}> = ({ icon, label, as = "button", onClick, children, size = "sm" }) => {
  const padY = size === "md" ? "py-2" : "py-1.5";
  const padX = size === "md" ? "px-4" : "px-[14px]";
  const fontSize = size === "md" ? "text-[12.5px]" : "text-[12px]";

  const baseClass = cn(
    "inline-flex items-center gap-1.5 font-bold text-th-brand bg-th-brand-soft border-[1.5px] border-th-brand-border-soft rounded-full cursor-pointer tracking-[0.01em] transition-colors duration-150 whitespace-nowrap",
    "hover:bg-[rgba(59, 217, 218, 0.28)]",
    padY,
    padX,
    fontSize,
  );

  if (as === "label") {
    return (
      <label className={baseClass}>
        {icon}
        {label}
        {children}
      </label>
    );
  }
  return (
    <button type="button" onClick={onClick} className={baseClass}>
      {icon}
      {label}
    </button>
  );
};

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
  embedded,
  nameLabel = "Caravan Name",
  namePlaceholder = "e.g. Cozy Mountain Camper",
}) => {
  const sections = (
    <>
      <SectionCard
        icon={<Type size={16} className="text-th-brand" strokeWidth={2.5} />}
        title="Identity"
        subtitle="How your listing appears to guests"
      >
        <div className="flex flex-col gap-5">
          <Field
            label={nameLabel}
            required
            error={errors.name || errors.activityName}
            right={<CharCount value={name.length} max={50} />}
          >
            <StyledInput
              value={name}
              onChange={(v) => {
                onNameChange(v);
                if (errors.name) clearError("name");
                if (errors.activityName) clearError("activityName");
              }}
              placeholder={namePlaceholder}
              maxLength={50}
              error={!!(errors.name || errors.activityName)}
              hardErrorBorder
            />
          </Field>

          <Field
            label="Description"
            required
            error={errors.description}
            right={<CharCount value={description.length} max={200} />}
            help="What makes your caravan unique? Mention the vibe, standout features, and ideal guests."
          >
            <StyledTextarea
              value={description}
              onChange={(v) => {
                onDescriptionChange(v);
                if (errors.description) clearError("description");
              }}
              placeholder="Describe the vibe, features, and what makes it special for travellers…"
              maxLength={200}
              rows={4}
              error={!!errors.description}
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard
        icon={<ShieldCheck size={16} className="text-th-brand" strokeWidth={2.5} />}
        title="Rules & Regulations"
        subtitle="Guidelines guests must follow"
        action={
          <PillCTA
            icon={<Plus size={12} strokeWidth={2.5} />}
            label="Add Rule"
            onClick={onAddRule}
          />
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

          {rules.length === 0 && <RulesEmptyState onAdd={onAddRule} />}
        </div>
      </SectionCard>

      <SectionCard
        icon={<Camera size={16} className="text-th-brand" strokeWidth={2.5} />}
        title="Photos"
        subtitle="High quality photos get more bookings"
      >
        <div className="flex flex-col gap-7">
          <CoverPhotoBlock
            file={coverImage?.[0]}
            error={errors.coverImage}
            onUpload={(files) => {
              onCoverUpload(files);
              if (errors.coverImage) clearError("coverImage");
            }}
            onRemove={() => onRemoveCover(0)}
          />

          <div className="h-px bg-[#F0F0F0]" />

          <GalleryBlock
            photos={photos}
            error={errors.photos}
            onUpload={(files) => {
              onPhotoUpload(files);
              if (errors.photos) clearError("photos");
            }}
            onRemove={onRemovePhoto}
          />
        </div>
      </SectionCard>
    </>
  );

  if (embedded) {
    return <div className="w-full flex flex-col gap-4">{sections}</div>;
  }
  return (
    <div className="flex flex-col items-center gap-7 w-full max-w-2xl">
      <StepHeader
        kicker="Caravan Details"
        title="Tell guests about your caravan"
        subtitle="Great photos and a clear description help guests choose you."
      />
      <div className="w-full flex flex-col gap-4">{sections}</div>
    </div>
  );
};

// ============================================================================
// Rules
// ============================================================================

const RulesEmptyState: React.FC<{ onAdd: () => void }> = ({ onAdd }) => (
  <div
    className={cn(
      "flex flex-col items-center justify-center gap-3",
      "px-5 py-[26px] border-[1.5px] border-dashed border-th-brand-border-soft rounded-[14px]",
      // Subtle teal-tinted background so the empty state feels intentional /
      // inviting rather than a "you forgot something" grey panel.
      "bg-th-brand-soft",
    )}
  >
    <div className="w-[42px] h-[42px] rounded-[13px] bg-th-surface-0 border-[1.5px] border-th-brand-border-soft flex items-center justify-center shadow-[0_2px_8px_rgba(59, 217, 218, 0.16)]">
      <ShieldCheck size={18} className="text-th-brand" strokeWidth={2.2} />
    </div>
    <div className="text-center">
      <p className="text-[13px] font-bold text-th-text-primary tracking-[-0.01em]">
        No house rules yet
      </p>
      <p className="text-[11.5px] text-th-warm-text-muted mt-0.5">
        Add a few so guests know what to expect.
      </p>
    </div>
    <PillCTA
      icon={<Plus size={12} strokeWidth={2.5} />}
      label="Add your first rule"
      onClick={onAdd}
    />
  </div>
);

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
}) => (
  <div
    className={cn(
      "flex items-center gap-2.5 rounded-[13px] px-[10px] py-[6px] transition-all duration-150",
      "bg-th-warm-surface border-[1.5px] border-transparent",
      "focus-within:bg-th-surface-0 focus-within:border-th-brand focus-within:shadow-[0_0_0_4px_var(--th-ring)]",
    )}
  >
    <span
      className={cn(
        "w-6 h-6 rounded-full border-[1.5px] text-[10.5px] font-extrabold flex items-center justify-center shrink-0 transition-all duration-150",
        "bg-th-warm-border border-transparent text-th-warm-text-muted",
        "group-focus-within:bg-th-brand-soft group-focus-within:border-th-brand-border-soft group-focus-within:text-th-brand",
      )}
    >
      {index + 1}
    </span>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={`Rule ${index + 1}…`}
      maxLength={250}
      className="flex-1 h-9 px-1 text-[13.5px] text-th-text-primary bg-transparent border-none outline-none font-[450]"
    />
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Remove rule ${index + 1}`}
      className="w-7 h-7 rounded-[8px] border-none bg-transparent flex items-center justify-center cursor-pointer transition-all duration-150 shrink-0 hover:bg-[#fef2f2]"
    >
      <X size={13} className="text-th-warm-text-muted" />
    </button>
  </div>
);

// ============================================================================
// Cover photo
// ============================================================================

const CoverPhotoBlock: React.FC<{
  file?: string | File;
  error?: string;
  onUpload: (files: FileList | null) => void;
  onRemove: () => void;
}> = ({ file, error, onUpload, onRemove }) => (
  <div className="flex flex-col gap-3">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-[12px] font-bold text-th-warm-text-dark uppercase tracking-[0.04em]">
          Cover Photo
        </p>
        <p className="text-[11.5px] text-th-warm-text-muted mt-0.5">
          First image guests see — make it count
        </p>
      </div>
      {file ? (
        <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-th-success-bright bg-th-success-bright-bg border border-th-success-bright-border rounded-full px-[9px] py-[2px] pl-[7px]">
          <Check size={10} strokeWidth={3} />
          Set
        </span>
      ) : null}
    </div>

    {file ? (
      <CoverPreview file={file} onUpload={onUpload} onRemove={onRemove} />
    ) : (
      <CoverDropzone error={error} onUpload={onUpload} />
    )}
  </div>
);

const CoverPreview: React.FC<{
  file: string | File;
  onUpload: (files: FileList | null) => void;
  onRemove: () => void;
}> = ({ file, onUpload, onRemove }) => {
  const src = useObjectURL(file);
  return (
    <div className="group relative w-full h-[260px] overflow-hidden bg-gray-100 rounded-[16px] shadow-[0_4px_20px_rgba(0,0,0,0.10)]">
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover opacity-[0.55] blur-[28px] scale-[1.15]"
      />
      <img src={src} alt="Cover" className="absolute inset-0 w-full h-full object-contain" />
      <div className="absolute inset-0 flex items-center justify-center transition-all [transition-duration:250ms] bg-[linear-gradient(to_top,rgba(0,0,0,0.12),transparent_55%)] group-hover:bg-[linear-gradient(to_top,rgba(0,0,0,0.42),transparent_55%)]">
        <label className="opacity-0 translate-y-[6px] group-hover:opacity-100 group-hover:translate-y-0 transition-[opacity,transform] duration-200 inline-flex items-center gap-1.5 bg-[rgba(255,255,255,0.96)] backdrop-blur-[8px] text-th-text-primary text-[12.5px] font-bold px-[18px] py-[9px] rounded-full cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.18)] tracking-[0.01em]">
          <ImagePlus size={13} strokeWidth={2.5} />
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
        aria-label="Remove cover photo"
        className="absolute top-[10px] right-[10px] w-[30px] h-[30px] rounded-full bg-[rgba(255,255,255,0.94)] backdrop-blur-[6px] border-none flex items-center justify-center cursor-pointer shadow-[0_2px_10px_rgba(0,0,0,0.15)]"
      >
        <X size={12} className="text-th-text-primary" />
      </button>
    </div>
  );
};

const CoverDropzone: React.FC<{
  error?: string;
  onUpload: (files: FileList | null) => void;
}> = ({ error, onUpload }) => (
  <div className="flex flex-col gap-1.5">
    <label
      className={cn(
        "w-full flex flex-col items-center justify-center gap-3 cursor-pointer",
        "h-[200px] rounded-[18px] border-2 border-dashed transition-all duration-200",
        // Subtle radial highlight so the empty dropzone reads as a
        // "drop here" target rather than a flat grey card.
        "bg-th-warm-surface [background-image:radial-gradient(circle_at_50%_30%,rgba(59, 217, 218, 0.1),transparent_60%)]",
        error
          ? "border-th-error-bright-soft"
          : "border-th-warm-border hover:border-th-brand hover:bg-th-brand-soft",
      )}
    >
      <div
        className={cn(
          "w-14 h-14 rounded-[17px] bg-th-surface-0 border-[1.5px] flex items-center justify-center shadow-[0_4px_14px_rgba(0,0,0,0.06)] transition-all duration-200",
          error
            ? "border-th-warm-border"
            : "border-th-warm-border group-hover:border-th-brand-border-soft",
        )}
      >
        <UploadCloud
          size={24}
          strokeWidth={2}
          className={cn(
            error
              ? "text-th-warm-text-muted"
              : "text-th-warm-text-muted [label:hover_&]:text-th-brand",
          )}
        />
      </div>
      <div className="text-center">
        <p className="text-[13.5px] font-bold text-th-text-primary tracking-[-0.01em]">
          Drop a photo here, or click to browse
        </p>
        <p className="text-[11px] text-th-warm-text-muted mt-[3px]">
          JPG, PNG or WEBP · landscape orientation works best
        </p>
      </div>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => onUpload(e.target.files)}
        className="hidden"
      />
    </label>
    <ErrorMsg message={error} />
  </div>
);

// ============================================================================
// Gallery — 5-slot grid that doubles as the progress visualization
// ============================================================================

const GalleryBlock: React.FC<{
  photos: (string | File)[];
  error?: string;
  onUpload: (files: FileList | null) => void;
  onRemove: (index: number) => void;
}> = ({ photos, error, onUpload, onRemove }) => {
  const filled = Math.min(photos.length, GALLERY_TARGET);
  const complete = filled >= GALLERY_TARGET;
  const remainingMin = Math.max(0, GALLERY_TARGET - filled);
  const bonusPhotos = photos.slice(GALLERY_TARGET);
  const canAddBonus = photos.length < GALLERY_MAX;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[12px] font-bold text-th-warm-text-dark uppercase tracking-[0.04em]">
            Gallery Photos
          </p>
          <p
            className={cn(
              "text-[11.5px] mt-0.5",
              complete
                ? "text-th-success-bright font-semibold"
                : "text-th-warm-text-muted font-normal",
            )}
          >
            {complete ? (
              <>
                <Sparkles size={11} strokeWidth={2.5} className="inline align-[-1px] mr-1" />
                Minimum reached — add more for a richer listing
              </>
            ) : (
              <>
                <strong className="text-th-text-primary font-bold">
                  {filled}/{GALLERY_TARGET}
                </strong>{" "}
                photos · {remainingMin} more recommended
              </>
            )}
          </p>
        </div>
        {photos.length > 0 && canAddBonus && (
          <PillCTA as="label" icon={<Plus size={12} strokeWidth={2.5} />} label="Add More">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => onUpload(e.target.files)}
              className="hidden"
            />
          </PillCTA>
        )}
      </div>

      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: GALLERY_TARGET }).map((_, idx) => {
          const photo = photos[idx];
          if (photo) {
            return (
              <GalleryThumb
                key={`slot-${idx}`}
                photo={photo}
                index={idx}
                showIndex
                onRemove={() => onRemove(idx)}
              />
            );
          }
          return <EmptySlot key={`slot-${idx}`} index={idx} error={!!error} onUpload={onUpload} />;
        })}
      </div>

      {bonusPhotos.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[10.5px] font-bold text-th-warm-text-muted uppercase tracking-[0.06em]">
            Bonus Photos · {bonusPhotos.length}
          </p>
          <div className="grid grid-cols-5 gap-2">
            {bonusPhotos.map((photo, i) => {
              const absoluteIdx = GALLERY_TARGET + i;
              return (
                <GalleryThumb
                  key={`bonus-${absoluteIdx}`}
                  photo={photo}
                  index={absoluteIdx}
                  onRemove={() => onRemove(absoluteIdx)}
                />
              );
            })}
            {canAddBonus && <BonusAddTile onUpload={onUpload} />}
          </div>
        </div>
      )}

      <ErrorMsg message={error} />
    </div>
  );
};

const EmptySlot: React.FC<{
  index: number;
  error: boolean;
  onUpload: (files: FileList | null) => void;
}> = ({ index, error, onUpload }) => (
  <label
    className={cn(
      "relative aspect-square flex flex-col items-center justify-center gap-1.5 cursor-pointer",
      "border-[1.5px] border-dashed rounded-[12px] transition-all duration-150",
      error
        ? "border-th-error-bright-soft bg-th-warm-surface"
        : "border-th-warm-border bg-th-warm-surface hover:border-th-brand hover:bg-th-brand-soft",
    )}
  >
    <span className="absolute top-1.5 left-1.5 w-[17px] h-[17px] rounded-full bg-th-surface-0 border border-th-warm-border text-th-warm-text-muted text-[9.5px] font-extrabold flex items-center justify-center">
      {index + 1}
    </span>
    <Plus
      size={16}
      strokeWidth={2.5}
      className={cn(
        error ? "text-th-warm-text-muted" : "text-th-warm-text-muted [label:hover_&]:text-th-brand",
      )}
    />
    <span
      className={cn(
        "text-[9.5px] font-bold tracking-[0.06em]",
        error ? "text-th-warm-text-muted" : "text-th-warm-text-muted [label:hover_&]:text-th-brand",
      )}
    >
      ADD
    </span>
    <input
      type="file"
      multiple
      accept="image/*"
      onChange={(e) => onUpload(e.target.files)}
      className="hidden"
    />
  </label>
);

const BonusAddTile: React.FC<{ onUpload: (files: FileList | null) => void }> = ({ onUpload }) => (
  <label className="aspect-square flex items-center justify-center cursor-pointer border-[1.5px] border-dashed border-th-warm-border bg-th-warm-surface rounded-[12px] transition-all duration-150 hover:border-th-brand hover:bg-th-brand-soft">
    <Plus size={18} strokeWidth={2.5} className="text-th-warm-text-muted" />
    <input
      type="file"
      multiple
      accept="image/*"
      onChange={(e) => onUpload(e.target.files)}
      className="hidden"
    />
  </label>
);

const GalleryThumb: React.FC<{
  photo: string | File;
  index: number;
  showIndex?: boolean;
  onRemove: () => void;
}> = ({ photo, index, showIndex, onRemove }) => {
  const src = useObjectURL(photo);
  return (
    <div className="group relative aspect-square overflow-hidden rounded-[12px] transition-[box-shadow,transform] duration-150 shadow-[0_1px_4px_rgba(0,0,0,0.08)] hover:shadow-[0_6px_18px_rgba(0,0,0,0.16)] hover:scale-[1.02]">
      <img src={src} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />

      {showIndex && (
        <span className="absolute top-1.5 left-1.5 min-w-[19px] h-[19px] px-[5px] rounded-full bg-[rgba(0,0,0,0.62)] backdrop-blur-[4px] text-th-text-inverse text-[10px] font-extrabold flex items-center justify-center tracking-[0.02em]">
          {index + 1}
        </span>
      )}

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove photo ${index + 1}`}
        className="absolute top-[5px] right-[5px] w-[22px] h-[22px] rounded-full bg-[rgba(0,0,0,0.62)] backdrop-blur-[4px] border-none flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity duration-150"
      >
        <X size={10} className="text-th-text-inverse" />
      </button>
    </div>
  );
};

export default DescriptionStep;
