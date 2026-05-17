import React from "react";
import { ImagePlus, X, Plus, Check, Type, Camera, ShieldCheck } from "lucide-react";
import {
  TEAL,
  TEAL_BG,
  TEAL_BORDER,
  TEAL_FOCUS,
  BLACK,
  WHITE,
  SURFACE,
  GRAY_400,
  GRAY_200,
  ERROR,
  ERROR_BG,
  SUCCESS,
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
      <img
        src={src}
        alt="Cover"
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0)",
          transition: "background-color 0.2s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.backgroundColor = "rgba(0,0,0,0.28)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.backgroundColor = "rgba(0,0,0,0)";
        }}
      >
        <label
          style={{
            cursor: "pointer",
            backgroundColor: "rgba(255,255,255,0.92)",
            color: BLACK,
            fontSize: 12,
            fontWeight: 700,
            padding: "6px 18px",
            borderRadius: 99,
            boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
            opacity: 0,
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLLabelElement).style.opacity = "1";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLLabelElement).style.opacity = "0";
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
          width: 28,
          height: 28,
          borderRadius: "50%",
          backgroundColor: "rgba(255,255,255,0.9)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
        }}
      >
        <X size={13} color={GRAY_400} />
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
    <div
      style={{
        position: "relative",
        aspectRatio: "1",
        borderRadius: 11,
        overflow: "hidden",
        border: `1.5px solid ${GRAY_200}`,
      }}
      className="group"
    >
      <img
        src={src}
        alt={`Photo ${index + 1}`}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      {index < GALLERY_TARGET && (
        <div
          style={{
            position: "absolute",
            top: 6,
            left: 6,
            width: 18,
            height: 18,
            borderRadius: "50%",
            backgroundColor: SUCCESS,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
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
          top: 6,
          right: 6,
          width: 22,
          height: 22,
          borderRadius: "50%",
          backgroundColor: "rgba(0,0,0,0.5)",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          opacity: 0,
          transition: "opacity 0.15s",
        }}
        className="group-hover:!opacity-100"
      >
        <X size={11} color={WHITE} />
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
          icon={<Type size={16} color={TEAL} strokeWidth={2.5} />}
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
          icon={<Camera size={16} color={TEAL} strokeWidth={2.5} />}
          title="Photos"
          subtitle="Cover photo + gallery shown to guests"
        >
          <div className="flex flex-col gap-6">
            <Field label="Cover Photo" required error={errors.coverImage}>
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: 200,
                  borderRadius: 14,
                  overflow: "hidden",
                  border: `2px dashed ${errors.coverImage ? ERROR : GRAY_200}`,
                  backgroundColor: SURFACE,
                  cursor: "pointer",
                }}
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
                  <label
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      cursor: "pointer",
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 13,
                        backgroundColor: GRAY_200,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ImagePlus size={20} color={GRAY_400} />
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: BLACK }}>
                      Upload cover photo
                    </p>
                    <p style={{ fontSize: 12, color: GRAY_400 }}>Click to browse</p>
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
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 11,
                    fontWeight: 700,
                    color: errors.photos ? ERROR : TEAL,
                    cursor: "pointer",
                    padding: "3px 10px",
                    borderRadius: 99,
                    border: `1px solid ${errors.photos ? ERROR : TEAL_BORDER}`,
                    backgroundColor: errors.photos ? ERROR_BG : TEAL_BG,
                  }}
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
                <div
                  style={{
                    flex: 1,
                    height: 5,
                    borderRadius: 99,
                    backgroundColor: GRAY_200,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      borderRadius: 99,
                      width: `${galleryPct}%`,
                      backgroundColor: galleryFilled >= GALLERY_TARGET ? SUCCESS : TEAL,
                      transition: "width 0.4s ease",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: galleryFilled >= GALLERY_TARGET ? SUCCESS : GRAY_400,
                    whiteSpace: "nowrap",
                  }}
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
                  style={{
                    padding: "28px 0",
                    borderRadius: 13,
                    border: `2px dashed ${errors.photos ? ERROR : GRAY_200}`,
                    backgroundColor: errors.photos ? ERROR_BG : SURFACE,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <ImagePlus size={22} color={errors.photos ? ERROR : GRAY_400} />
                  <p style={{ fontSize: 13, color: errors.photos ? ERROR : GRAY_400 }}>
                    {errors.photos ?? "No gallery photos yet"}
                  </p>
                </div>
              )}
            </Field>
          </div>
        </SectionCard>

        <SectionCard
          icon={<ShieldCheck size={16} color={TEAL} strokeWidth={2.5} />}
          title="Rules & Regulations"
          subtitle="Optional — house rules guests must follow"
        >
          <div className="flex flex-col gap-3">
            {rulesAndRegulations.length > 0 && (
              <div className="flex flex-col gap-2">
                {rulesAndRegulations.map((rule, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      backgroundColor: SURFACE,
                      borderRadius: 11,
                      border: "1.5px solid transparent",
                    }}
                  >
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        backgroundColor: TEAL_BG,
                        border: `1.5px solid ${TEAL_BORDER}`,
                        color: TEAL,
                        fontSize: 10,
                        fontWeight: 800,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {index + 1}
                    </span>
                    <span
                      style={{
                        flex: 1,
                        fontSize: 13,
                        color: BLACK,
                        fontWeight: 450,
                        lineHeight: 1.5,
                      }}
                    >
                      {rule}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveRule(index)}
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 7,
                        border: "none",
                        backgroundColor: "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        flexShrink: 0,
                        transition: "background-color 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#fef2f2";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                          "transparent";
                      }}
                    >
                      <X size={12} color={GRAY_400} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 8 }}>
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
                style={{
                  flex: 1,
                  height: 46,
                  padding: "0 14px",
                  borderRadius: 11,
                  outline: "none",
                  border: "1.5px solid transparent",
                  backgroundColor: SURFACE,
                  fontSize: 13,
                  color: BLACK,
                  fontWeight: 450,
                  transition: "all 0.15s",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.border = `1.5px solid ${TEAL}`;
                  e.currentTarget.style.backgroundColor = WHITE;
                  e.currentTarget.style.boxShadow = `0 0 0 3px ${TEAL_FOCUS}`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.border = "1.5px solid transparent";
                  e.currentTarget.style.backgroundColor = SURFACE;
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              <button
                type="button"
                onClick={handleAddRule}
                disabled={!ruleInput.trim()}
                style={{
                  height: 46,
                  padding: "0 20px",
                  borderRadius: 11,
                  border: "none",
                  backgroundColor: ruleInput.trim() ? TEAL : GRAY_200,
                  color: ruleInput.trim() ? WHITE : GRAY_400,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: ruleInput.trim() ? "pointer" : "not-allowed",
                  transition: "all 0.15s",
                  flexShrink: 0,
                }}
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
