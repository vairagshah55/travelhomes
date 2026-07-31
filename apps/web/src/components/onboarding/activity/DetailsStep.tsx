import React from "react";
import { ImagePlus, X, Plus, Check, Type, Camera, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SectionCard,
  Field,
  StyledInput,
  StyledTextarea,
  CharCount,
  StepHeader,
  useObjectURL,
} from "../shared/primitives";

interface DetailsStepProps {
  activityName: string;
  description: string;
  coverImage: File | string | null;
  photos: (File | string)[];
  rulesAndRegulations: string[];
  ruleInput: string;
  errors: Record<string, string>;
  photoCarouselRef?: React.RefObject<HTMLDivElement>;
  onUpdateFormData: (field: string, value: any) => void;
  onCoverImageUpload: (files: FileList | null) => void;
  onPhotoUpload: (files: FileList | null) => void;
  onRemoveFile: (field: "photos" | "idPhotos" | "coverImage", index?: number) => void;
  onSetRuleInput: (value: string) => void;
  onAddRule: (value: string) => void;
  onRemoveRule: (index: number) => void;
  renderImageSrc?: (fileOrUrl: any) => string;
  setErrors: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
}

const GALLERY_TARGET = 5;

const CoverPreview = ({
  file,
  onUpload,
  onRemove,
}: {
  file: File | string;
  onUpload: (files: FileList | null) => void;
  onRemove: () => void;
}) => {
  const src = useObjectURL(file);
  return (
    <>
      <img src={src} alt="Cover" className="w-full h-full object-cover" />
      {/* Rule 2: hover overlay via CSS group-hover instead of onMouseEnter/Leave */}
      <div className="absolute inset-0 bg-black/0 hover:bg-black/[0.28] transition-colors duration-200 flex items-center justify-center group/overlay">
        <label className="cursor-pointer bg-white/[0.92] text-th-text-primary text-[12px] font-bold px-[18px] py-[6px] rounded-full shadow-[0_2px_8px_rgba(0,0,0,0.15)] opacity-0 group-hover/overlay:opacity-100 transition-opacity duration-200">
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
        className="absolute top-[10px] right-[10px] w-[28px] h-[28px] rounded-full bg-white/90 border-none cursor-pointer flex items-center justify-center shadow-[0_1px_4px_rgba(0,0,0,0.15)]"
      >
        <X size={13} className="text-th-warm-text-muted" />
      </button>
    </>
  );
};

const PhotoThumb = ({
  photo,
  index,
  onRemove,
}: {
  photo: File | string;
  index: number;
  onRemove: () => void;
}) => {
  const src = useObjectURL(photo);
  return (
    <div className="relative aspect-square rounded-[11px] overflow-hidden border-[1.5px] border-th-warm-border group">
      <img src={src} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
      {index < GALLERY_TARGET && (
        <div className="absolute top-[6px] left-[6px] w-[18px] h-[18px] rounded-full bg-th-success-bright flex items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,0.2)]">
          <Check size={9} strokeWidth={2.5} className="text-th-text-inverse" />
        </div>
      )}
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-[6px] right-[6px] w-[22px] h-[22px] rounded-full bg-black/50 border-none cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150"
      >
        <X size={11} className="text-th-text-inverse" />
      </button>
    </div>
  );
};

const DetailsStep: React.FC<DetailsStepProps> = ({
  activityName,
  description,
  coverImage,
  photos,
  rulesAndRegulations,
  ruleInput,
  errors,
  onUpdateFormData,
  onCoverImageUpload,
  onPhotoUpload,
  onRemoveFile,
  onSetRuleInput,
  onAddRule,
  onRemoveRule,
  setErrors,
}) => {
  const galleryFilled = Math.min(photos.length, GALLERY_TARGET);
  const galleryPct = (galleryFilled / GALLERY_TARGET) * 100;

  const clearError = (field: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleAddRule = () => {
    const value = ruleInput.trim();
    if (value) {
      onAddRule(value);
      onSetRuleInput("");
    }
  };

  return (
    <div className="flex flex-col items-center gap-7 w-full max-w-2xl">
      <StepHeader
        kicker="Activity Details"
        title="Tell guests about your activity"
        subtitle="Great photos and a clear description help guests choose you."
      />

      <div className="w-full flex flex-col gap-4">
        <SectionCard
          icon={<Type size={16} strokeWidth={2.5} className="text-th-brand" />}
          title="Identity"
          subtitle="How your listing appears to guests"
        >
          <div className="flex flex-col gap-5">
            <Field
              label="Activity Name"
              required
              error={errors.activityName}
              right={<CharCount value={activityName.length} max={50} />}
            >
              <StyledInput
                value={activityName}
                onChange={(v) => {
                  onUpdateFormData("activityName", v);
                  if (errors.activityName) clearError("activityName");
                }}
                placeholder="e.g. Sunrise Trek to Triund"
                maxLength={50}
                error={!!errors.activityName}
                hardErrorBorder
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
                onChange={(v) => {
                  onUpdateFormData("description", v);
                  if (errors.description) clearError("description");
                }}
                placeholder="Describe your activity — the experience, highlights, what to expect…"
                maxLength={200}
                rows={3}
                error={!!errors.description}
              />
            </Field>
          </div>
        </SectionCard>

        <SectionCard
          icon={<Camera size={16} strokeWidth={2.5} className="text-th-brand" />}
          title="Photos"
          subtitle="Cover photo + gallery shown to guests"
        >
          <div className="flex flex-col gap-6">
            <Field label="Cover Photo" required error={errors.coverImage}>
              <div
                className={cn(
                  "relative w-full h-[200px] rounded-[14px] overflow-hidden border-2 border-dashed bg-th-warm-surface cursor-pointer",
                  errors.coverImage ? "border-th-error-bright" : "border-th-warm-border",
                )}
              >
                {coverImage ? (
                  <CoverPreview
                    file={coverImage}
                    onUpload={(files) => {
                      onCoverImageUpload(files);
                      if (errors.coverImage) clearError("coverImage");
                    }}
                    onRemove={() => onRemoveFile("coverImage")}
                  />
                ) : (
                  <label className="w-full h-full flex flex-col items-center justify-center gap-2 cursor-pointer">
                    <div className="w-[44px] h-[44px] rounded-[13px] bg-th-warm-border flex items-center justify-center">
                      <ImagePlus size={20} className="text-th-warm-text-muted" />
                    </div>
                    <p className="text-[13px] font-semibold text-th-text-primary">
                      Upload cover photo
                    </p>
                    <p className="text-[12px] text-th-warm-text-muted">Click to browse</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        onCoverImageUpload(e.target.files);
                        if (errors.coverImage) clearError("coverImage");
                      }}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </Field>

            <Field
              label="Gallery Photos"
              error={errors.photos}
              right={
                <label
                  className={cn(
                    "flex items-center gap-[5px] text-[11px] font-bold cursor-pointer px-[10px] py-[3px] rounded-full border",
                    errors.photos
                      ? "text-th-error-bright border-th-error-bright bg-th-error-bright-bg"
                      : "text-th-brand border-th-brand-border-soft bg-th-brand-soft",
                  )}
                >
                  <Plus size={11} strokeWidth={2.5} />
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
              }
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="flex-1 h-[5px] rounded-full bg-th-warm-border overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-[width] [transition-duration:400ms] ease-out",
                      galleryFilled >= GALLERY_TARGET ? "bg-th-success-bright" : "bg-th-brand",
                    )}
                    style={{ width: `${galleryPct}%` }}
                  />
                </div>
                <span
                  className={cn(
                    "text-[11px] font-bold whitespace-nowrap",
                    galleryFilled >= GALLERY_TARGET
                      ? "text-th-success-bright"
                      : "text-th-warm-text-muted",
                  )}
                >
                  {galleryFilled}/{GALLERY_TARGET}
                </span>
              </div>

              {photos.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {photos.map((photo, index) => (
                    <PhotoThumb
                      key={index}
                      photo={photo}
                      index={index}
                      onRemove={() => onRemoveFile("photos", index)}
                    />
                  ))}
                </div>
              ) : (
                <div
                  className={cn(
                    "py-[28px] rounded-[13px] border-2 border-dashed flex flex-col items-center justify-center gap-2",
                    errors.photos
                      ? "border-th-error-bright bg-th-error-bright-bg"
                      : "border-th-warm-border bg-th-warm-surface",
                  )}
                >
                  <ImagePlus
                    size={22}
                    className={errors.photos ? "text-th-error-bright" : "text-th-warm-text-muted"}
                  />
                  <p
                    className={cn(
                      "text-[13px]",
                      errors.photos ? "text-th-error-bright" : "text-th-warm-text-muted",
                    )}
                  >
                    {errors.photos ?? "No gallery photos yet"}
                  </p>
                </div>
              )}
            </Field>
          </div>
        </SectionCard>

        <SectionCard
          icon={<ShieldCheck size={16} strokeWidth={2.5} className="text-th-brand" />}
          title="Rules & Regulations"
          subtitle="Optional — house rules guests must follow"
        >
          <div className="flex flex-col gap-3">
            {rulesAndRegulations.length > 0 && (
              <div className="flex flex-col gap-2">
                {rulesAndRegulations.map((rule, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-[10px] px-3 py-[10px] bg-th-warm-surface rounded-[11px] border-[1.5px] border-transparent"
                  >
                    <span className="w-[22px] h-[22px] rounded-full bg-th-brand-soft border-[1.5px] border-th-brand-border-soft text-th-brand text-[10px] font-extrabold flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <span className="flex-1 text-[13px] text-th-text-primary font-[450] leading-[1.5]">
                      {rule}
                    </span>
                    {/* Rule 2: hover background via CSS :hover instead of onMouseEnter/Leave */}
                    <button
                      type="button"
                      onClick={() => onRemoveRule(index)}
                      className="w-[26px] h-[26px] rounded-[7px] border-none bg-transparent hover:bg-red-50 flex items-center justify-center cursor-pointer shrink-0 transition-colors duration-150"
                    >
                      <X size={12} className="text-th-warm-text-muted" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              {/* Rule 2: focus styles via CSS :focus instead of onFocus/onBlur */}
              <input
                type="text"
                value={ruleInput}
                onChange={(e) => onSetRuleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddRule();
                  }
                }}
                placeholder="Add a rule… press Enter to add"
                maxLength={100}
                className={cn(
                  "flex-1 h-[46px] px-[14px] rounded-[11px] outline-none",
                  "border-[1.5px] border-transparent bg-th-warm-surface",
                  "text-[13px] text-th-text-primary font-[450]",
                  "transition-all duration-150",
                  "focus:border-th-brand focus:bg-th-surface-0",
                  "focus:shadow-[0_0_0_3px_var(--th-ring)]",
                )}
              />
              <button
                type="button"
                onClick={handleAddRule}
                disabled={!ruleInput.trim()}
                className={cn(
                  "h-[46px] px-5 rounded-[11px] border-none text-[13px] font-bold shrink-0 transition-all duration-150",
                  ruleInput.trim()
                    ? "bg-th-brand text-th-text-inverse cursor-pointer"
                    : "bg-th-warm-border text-th-warm-text-muted cursor-not-allowed",
                )}
              >
                Add
              </button>
            </div>
          </div>
        </SectionCard>
      </div>
    </div>
  );
};

export default DetailsStep;
