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
  GripVertical,
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

/**
 * Drag-and-drop wiring for the upload targets.
 *
 * CONVENTIONS Rule 2 says visual state comes from CSS, not React state — this is
 * the documented exception: there is no CSS selector for "a file is hovering over
 * this element", so the highlight has to be driven by the drag events. The copy
 * promises drag & drop, so the handlers have to be real.
 */
function useDropzone(onFiles: (files: FileList | null) => void) {
  const [isDragging, setIsDragging] = React.useState(false);
  const depth = React.useRef(0);

  return {
    isDragging,
    handlers: {
      onDragEnter: (e: React.DragEvent) => {
        e.preventDefault();
        depth.current += 1;
        setIsDragging(true);
      },
      onDragOver: (e: React.DragEvent) => e.preventDefault(),
      // Fires for every child element too, hence the depth counter.
      onDragLeave: (e: React.DragEvent) => {
        e.preventDefault();
        depth.current -= 1;
        if (depth.current <= 0) {
          depth.current = 0;
          setIsDragging(false);
        }
      },
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        depth.current = 0;
        setIsDragging(false);
        if (e.dataTransfer?.files?.length) onFiles(e.dataTransfer.files);
      },
    },
  };
}

// Sub-heading for the blocks inside the Photos card. These aren't wrapped in
// <Field>, so they carry the required marker themselves — same asterisk
// treatment as Field so mandatory reads identically across the whole step.
const SubLabel: React.FC<{ children: React.ReactNode; required?: boolean }> = ({
  children,
  required,
}) => (
  <p className="text-[11.5px] font-bold text-th-warm-text-dark uppercase tracking-[0.06em]">
    {children}
    {required && (
      <>
        <span aria-hidden="true" className="text-th-error-bright ml-[3px]">
          *
        </span>
        <span className="sr-only"> (required)</span>
      </>
    )}
  </p>
);

// Shared secondary CTA — every "Add ___" action in this step uses the same shape
// so they read as one design family. Deliberately quiet: these sit next to the
// primary Continue button, so an outlined teal pill, not a filled one.
const PillCTA: React.FC<{
  icon?: React.ReactNode;
  label: string;
  as?: "button" | "label";
  onClick?: () => void;
  children?: React.ReactNode;
  size?: "sm" | "md";
}> = ({ icon, label, as = "button", onClick, children, size = "sm" }) => {
  const baseClass = cn(
    "inline-flex items-center gap-1.5 font-bold text-th-brand tracking-[0.01em] whitespace-nowrap",
    "bg-th-surface-0 border border-th-brand-border-soft rounded-full cursor-pointer",
    "transition-[background-color,border-color,box-shadow] duration-150",
    "hover:bg-th-brand-soft hover:border-th-brand",
    "focus-within:ring-[3px] focus-within:ring-[color:var(--th-ring)]",
    size === "md" ? "py-2 px-4 text-[12.5px]" : "py-[7px] px-3.5 text-[12px]",
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
    <button
      type="button"
      onClick={onClick}
      className={cn(
        baseClass,
        "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[color:var(--th-ring)]",
      )}
    >
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
        icon={<Type size={17} className="text-th-brand" strokeWidth={2.2} />}
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
        icon={<ShieldCheck size={17} className="text-th-brand" strokeWidth={2.2} />}
        title="Rules & Regulations"
        subtitle="Guidelines guests must follow"
        action={
          rules.length > 0 ? (
            <PillCTA
              icon={<Plus size={12} strokeWidth={2.5} />}
              label="Add Rule"
              onClick={onAddRule}
            />
          ) : undefined
        }
      >
        {rules.length === 0 ? (
          <RulesEmptyState onAdd={onAddRule} />
        ) : (
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
          </div>
        )}
      </SectionCard>

      <SectionCard
        icon={<Camera size={17} className="text-th-brand" strokeWidth={2.2} />}
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

          <div className="h-px bg-th-warm-border" />

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
    // data-onboarding scopes the deep-teal form palette to this subtree so the
    // component looks identical wherever it's hosted (see global.css).
    return (
      <div data-onboarding className="w-full flex flex-col gap-4">
        {sections}
      </div>
    );
  }
  return (
    <div className="w-full flex flex-col gap-6">
      <StepHeader
        kicker="Caravan Details"
        subtitle="A great first impression starts with the story of your stay — add the details that help travellers picture it."
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
      "flex flex-col items-center justify-center gap-3 text-center",
      // Neutral at rest, matching the other empty states in this step
      // (CoverDropzone, EmptySlot) — teal is reserved for hover/active, so a
      // static panel that's never interacted with shouldn't sit in that color.
      "px-5 py-8 border border-dashed border-th-warm-border-strong rounded-[14px]",
      "bg-th-warm-surface",
    )}
  >
    <div className="w-11 h-11 rounded-[13px] bg-th-surface-0 border border-th-warm-border flex items-center justify-center shadow-[0_2px_8px_rgba(23,54,56,0.05)]">
      <ShieldCheck size={19} className="text-th-brand" strokeWidth={2} />
    </div>
    <div>
      <p className="text-[13.5px] font-bold text-th-text-primary tracking-[-0.01em]">
        Set expectations early
      </p>
      <p className="text-[12.5px] leading-[1.55] text-[color:var(--onb-text-secondary,#657477)] mt-1 max-w-[34ch] mx-auto">
        Add a few simple house rules so guests know what to expect before booking.
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
      // `group` is required for the group-focus-within: rules on the children
      // below — without it they silently never applied.
      "group flex items-center gap-2 rounded-[12px] pl-2.5 pr-1.5 py-1",
      "bg-th-surface-0 border border-th-warm-border",
      "transition-[border-color,box-shadow] duration-150",
      "hover:border-[color:var(--onb-border-hover,#a9c5c2)]",
      "focus-within:border-th-brand focus-within:shadow-[0_0_0_3px_var(--th-ring)]",
    )}
  >
    <GripVertical
      size={13}
      aria-hidden="true"
      className="shrink-0 text-th-warm-border-strong opacity-0 sm:opacity-100 transition-colors duration-150"
    />
    <span
      className={cn(
        "w-[22px] h-[22px] rounded-full text-[10.5px] font-extrabold shrink-0",
        "flex items-center justify-center tabular-nums transition-colors duration-150",
        "bg-th-warm-surface text-th-warm-text-muted",
        "group-focus-within:bg-th-brand-soft group-focus-within:text-th-brand",
      )}
    >
      {index + 1}
    </span>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={`Rule ${index + 1} — e.g. No smoking inside`}
      maxLength={250}
      aria-label={`Rule ${index + 1}`}
      className="flex-1 h-10 px-1 text-[14px] text-th-text-primary placeholder:text-th-warm-text-muted bg-transparent border-none outline-none font-normal"
    />
    <button
      type="button"
      onClick={onRemove}
      aria-label={`Remove rule ${index + 1}`}
      className={cn(
        "w-8 h-8 rounded-[9px] shrink-0 flex items-center justify-center cursor-pointer",
        "bg-transparent border-none transition-colors duration-150",
        "text-th-warm-text-muted hover:bg-th-error-bright-bg hover:text-th-error-bright",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-th-error-bright-soft",
      )}
    >
      <X size={14} />
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
    <div className="flex items-start justify-between gap-3">
      <div>
        <SubLabel required>Cover Photo</SubLabel>
        <p className="text-[12px] text-[color:var(--onb-text-secondary,#657477)] mt-0.5">
          The first image guests see — make it count
        </p>
      </div>
      {file ? (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.06em] text-th-success-bright bg-th-success-bright-bg border border-th-success-bright-border rounded-full pl-1.5 pr-2 py-[3px] shrink-0">
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
    <div className="group relative w-full h-[260px] overflow-hidden bg-th-warm-surface rounded-[16px] border border-th-warm-border">
      {/* Blurred copy fills the letterbox so portrait shots don't sit on grey. */}
      <img
        src={src}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full object-cover opacity-[0.5] blur-[28px] scale-[1.15]"
      />
      <img src={src} alt="Cover" className="absolute inset-0 w-full h-full object-contain" />
      <div className="absolute inset-0 flex items-center justify-center transition-colors duration-200 bg-[linear-gradient(to_top,rgba(10,28,28,0.14),transparent_55%)] group-hover:bg-[linear-gradient(to_top,rgba(10,28,28,0.44),transparent_55%)]">
        <label className="opacity-0 translate-y-[6px] group-hover:opacity-100 group-hover:translate-y-0 focus-within:opacity-100 focus-within:translate-y-0 transition-[opacity,transform] duration-200 inline-flex items-center gap-1.5 bg-white/96 backdrop-blur-[8px] text-th-text-primary text-[12.5px] font-bold px-[18px] py-[9px] rounded-full cursor-pointer shadow-[0_4px_16px_rgba(10,28,28,0.18)] tracking-[0.01em]">
          <ImagePlus size={13} strokeWidth={2.5} />
          Change Photo
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onUpload(e.target.files)}
            className="sr-only"
          />
        </label>
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove cover photo"
        className="absolute top-2.5 right-2.5 w-[30px] h-[30px] rounded-full bg-white/94 backdrop-blur-[6px] border-none flex items-center justify-center cursor-pointer shadow-[0_2px_10px_rgba(10,28,28,0.16)] transition-colors hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-th-brand"
      >
        <X size={12} className="text-th-text-primary" />
      </button>
    </div>
  );
};

const CoverDropzone: React.FC<{
  error?: string;
  onUpload: (files: FileList | null) => void;
}> = ({ error, onUpload }) => {
  const { isDragging, handlers } = useDropzone(onUpload);
  return (
    <div className="flex flex-col gap-1.5">
      <label
        {...handlers}
        className={cn(
          "group w-full flex flex-col items-center justify-center gap-3.5 cursor-pointer text-center",
          "h-[220px] px-6 rounded-[16px] border border-dashed transition-all duration-200",
          "focus-within:ring-[3px] focus-within:ring-[color:var(--th-ring)]",
          error
            ? "border-th-error-bright-soft bg-th-error-bright-bg"
            : isDragging
              ? "border-th-brand bg-th-brand-soft scale-[1.005]"
              : "border-th-warm-border-strong bg-th-warm-surface hover:border-th-brand hover:bg-th-brand-soft",
        )}
      >
        <div
          className={cn(
            "w-14 h-14 rounded-[16px] bg-th-surface-0 border flex items-center justify-center",
            "shadow-[0_2px_10px_rgba(23,54,56,0.06)] transition-all duration-200",
            isDragging
              ? "border-th-brand-border-soft -translate-y-1"
              : "border-th-warm-border group-hover:border-th-brand-border-soft group-hover:-translate-y-0.5",
          )}
        >
          <UploadCloud
            size={24}
            strokeWidth={1.9}
            className={cn(
              "transition-colors duration-200",
              isDragging ? "text-th-brand" : "text-th-warm-text-muted group-hover:text-th-brand",
            )}
          />
        </div>
        <div>
          <p className="text-[14px] font-bold text-th-text-primary tracking-[-0.01em]">
            {isDragging ? "Drop to upload" : "Add your best caravan photo"}
          </p>
          <p className="text-[12.5px] text-[color:var(--onb-text-secondary,#657477)] mt-1">
            Drag &amp; drop, or click to browse your device
          </p>
          <p className="text-[11px] text-th-warm-text-muted mt-2">
            JPG, PNG or WEBP · landscape orientation works best
          </p>
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => onUpload(e.target.files)}
          className="sr-only"
        />
      </label>
      <ErrorMsg message={error} />
    </div>
  );
};

// ============================================================================
// Gallery — cover-led asymmetric grid that doubles as the progress visualization
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
  const { isDragging, handlers } = useDropzone(onUpload);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <SubLabel required>Gallery Photos</SubLabel>
          <p
            className={cn(
              "text-[12px] mt-0.5",
              complete
                ? "text-th-success-bright font-semibold"
                : "text-[color:var(--onb-text-secondary,#657477)]",
            )}
          >
            {complete ? (
              <>
                <Sparkles size={11} strokeWidth={2.5} className="inline align-[-1px] mr-1" />
                Minimum reached — add more for a richer listing
              </>
            ) : (
              <>
                <strong className="text-th-text-primary font-bold tabular-nums">
                  {filled}/{GALLERY_TARGET}
                </strong>{" "}
                added · {remainingMin} more required
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
              className="sr-only"
            />
          </PillCTA>
        )}
      </div>

      {/* Slot 1 is a 2×2 hero so the grid reads as a photo layout rather than
          five identical database boxes. */}
      <div
        {...handlers}
        className={cn(
          "grid grid-cols-4 grid-rows-2 gap-2 rounded-[14px] transition-all duration-200",
          isDragging && "ring-[3px] ring-th-brand ring-offset-4 ring-offset-th-surface-0",
        )}
      >
        {Array.from({ length: GALLERY_TARGET }).map((_, idx) => {
          const photo = photos[idx];
          const hero = idx === 0;
          const spanClass = hero ? "col-span-2 row-span-2" : "";
          if (photo) {
            return (
              <GalleryThumb
                key={`slot-${idx}`}
                photo={photo}
                index={idx}
                showIndex
                className={spanClass}
                onRemove={() => onRemove(idx)}
              />
            );
          }
          return (
            <EmptySlot
              key={`slot-${idx}`}
              index={idx}
              hero={hero}
              error={!!error}
              className={spanClass}
              onUpload={onUpload}
            />
          );
        })}
      </div>

      {bonusPhotos.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[10.5px] font-bold text-th-warm-text-muted uppercase tracking-[0.08em]">
            Bonus Photos · {bonusPhotos.length}
          </p>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
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
  hero?: boolean;
  error: boolean;
  className?: string;
  onUpload: (files: FileList | null) => void;
}> = ({ index, hero, error, className, onUpload }) => (
  <label
    className={cn(
      "group relative flex flex-col items-center justify-center gap-1.5 cursor-pointer",
      hero ? "aspect-auto" : "aspect-square",
      "border border-dashed rounded-[12px] transition-all duration-150",
      "focus-within:ring-[3px] focus-within:ring-[color:var(--th-ring)]",
      error
        ? "border-th-error-bright-soft bg-th-error-bright-bg"
        : "border-th-warm-border-strong bg-th-warm-surface hover:border-th-brand hover:bg-th-brand-soft",
      className,
    )}
  >
    <span className="absolute top-1.5 left-1.5 w-[18px] h-[18px] rounded-full bg-th-surface-0 border border-th-warm-border text-th-warm-text-muted text-[9.5px] font-extrabold flex items-center justify-center tabular-nums">
      {index + 1}
    </span>
    <Plus
      size={hero ? 22 : 16}
      strokeWidth={2.5}
      className={cn(
        "transition-colors duration-150",
        error ? "text-th-warm-text-muted" : "text-th-warm-text-muted group-hover:text-th-brand",
      )}
    />
    <span
      className={cn(
        "text-[9.5px] font-bold tracking-[0.08em] transition-colors duration-150",
        // The four small tiles are ~78px wide on a phone — the label would crowd
        // the icon, so it only shows on the hero slot there.
        hero ? "block" : "hidden sm:block",
        error ? "text-th-warm-text-muted" : "text-th-warm-text-muted group-hover:text-th-brand",
      )}
    >
      {hero ? "ADD PHOTOS" : "ADD"}
    </span>
    <input
      type="file"
      multiple
      accept="image/*"
      onChange={(e) => onUpload(e.target.files)}
      className="sr-only"
    />
  </label>
);

const BonusAddTile: React.FC<{ onUpload: (files: FileList | null) => void }> = ({ onUpload }) => (
  <label
    className={cn(
      "group aspect-square flex items-center justify-center cursor-pointer rounded-[12px]",
      "border border-dashed border-th-warm-border-strong bg-th-warm-surface",
      "transition-all duration-150 hover:border-th-brand hover:bg-th-brand-soft",
      "focus-within:ring-[3px] focus-within:ring-[color:var(--th-ring)]",
    )}
  >
    <Plus
      size={18}
      strokeWidth={2.5}
      className="text-th-warm-text-muted transition-colors duration-150 group-hover:text-th-brand"
    />
    <input
      type="file"
      multiple
      accept="image/*"
      onChange={(e) => onUpload(e.target.files)}
      className="sr-only"
    />
  </label>
);

const GalleryThumb: React.FC<{
  photo: string | File;
  index: number;
  showIndex?: boolean;
  className?: string;
  onRemove: () => void;
}> = ({ photo, index, showIndex, className, onRemove }) => {
  const src = useObjectURL(photo);
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-[12px] bg-th-warm-surface",
        "transition-[box-shadow,transform] duration-150",
        "shadow-[0_1px_4px_rgba(23,54,56,0.07)] hover:shadow-[0_6px_18px_rgba(23,54,56,0.14)]",
        className || "aspect-square",
      )}
    >
      <img src={src} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />

      {showIndex && (
        <span className="absolute top-1.5 left-1.5 min-w-[19px] h-[19px] px-[5px] rounded-full bg-black/55 backdrop-blur-[4px] text-white text-[10px] font-extrabold flex items-center justify-center tracking-[0.02em] tabular-nums">
          {index + 1}
        </span>
      )}

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove photo ${index + 1}`}
        className={cn(
          "absolute top-1 right-1 w-[24px] h-[24px] rounded-full bg-black/55 backdrop-blur-[4px]",
          "border-none flex items-center justify-center cursor-pointer",
          // Always reachable by keyboard / on touch, where there is no hover.
          "opacity-0 group-hover:opacity-100 focus-visible:opacity-100 max-sm:opacity-100",
          "transition-opacity duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
        )}
      >
        <X size={11} className="text-white" />
      </button>
    </div>
  );
};

export default DescriptionStep;
