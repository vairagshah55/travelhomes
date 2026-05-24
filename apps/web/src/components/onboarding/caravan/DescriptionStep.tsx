import React from "react";
import { ImagePlus, X, Plus, Check, FileImage, Type, ShieldCheck, Camera } from "lucide-react";
import {
  TEAL,
  TEAL_BG,
  TEAL_FOCUS,
  BLACK,
  WHITE,
  SURFACE,
  GRAY_400,
  GRAY_700,
  GRAY_200,
  ERROR,
  ERROR_SOFT,
  ERROR_BG,
  ERROR_RING,
  SUCCESS,
  SUCCESS_BG,
  SUCCESS_BORDER,
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
}

const GALLERY_TARGET = 5;

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
  const galleryPct = (galleryFilled / GALLERY_TARGET) * 100;

  return (
    <div className="flex flex-col items-center gap-7 w-full max-w-2xl">
      <StepHeader
        kicker="Caravan Details"
        title="Tell guests about your caravan"
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
              label="Caravan Name"
              required
              error={errors.name}
              right={<CharCount value={name.length} max={50} />}
            >
              <StyledInput
                value={name}
                onChange={(v) => {
                  onNameChange(v);
                  if (errors.name) clearError("name");
                }}
                placeholder="e.g. Cozy Mountain Camper"
                maxLength={50}
                error={!!errors.name}
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
                border: `1.5px solid rgba(24, 95, 165, 0.35)`,
                borderRadius: 9,
                padding: "6px 14px",
                cursor: "pointer",
                letterSpacing: "0.01em",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                  "rgba(24, 95, 165, 0.14)";
              }}
              onMouseLeave={(e) => {
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
                    <path
                      d="M2 4h12M2 8h8M2 12h5"
                      stroke={GRAY_400}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <p style={{ fontSize: 12.5, color: GRAY_400 }}>No rules yet — add one above</p>
              </div>
            )}
          </div>
        </SectionCard>

        <SectionCard
          icon={<Camera size={16} color={TEAL} strokeWidth={2.5} />}
          title="Photos"
          subtitle="High quality photos get more bookings"
        >
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div>
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: GRAY_700,
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                    }}
                  >
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
                      color: SUCCESS,
                      backgroundColor: SUCCESS_BG,
                      border: `1px solid ${SUCCESS_BORDER}`,
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
                onUpload={(files) => {
                  onCoverUpload(files);
                  if (errors.coverImage) clearError("coverImage");
                }}
                onRemove={() => onRemoveCover(0)}
                error={errors.coverImage}
              />
            </div>

            <div style={{ height: 1, backgroundColor: "#F0F0F0" }} />

            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: GRAY_700,
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                    }}
                  >
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
                    color: errors.photos ? ERROR : GRAY_700,
                    border: `1.5px solid ${errors.photos ? ERROR : GRAY_200}`,
                    borderRadius: 9,
                    padding: "6px 14px",
                    cursor: "pointer",
                    backgroundColor: WHITE,
                    transition: "all 0.15s",
                    letterSpacing: "0.01em",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLLabelElement).style.borderColor = TEAL;
                    (e.currentTarget as HTMLLabelElement).style.color = TEAL;
                    (e.currentTarget as HTMLLabelElement).style.backgroundColor = TEAL_BG;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLLabelElement).style.borderColor = errors.photos
                      ? ERROR
                      : GRAY_200;
                    (e.currentTarget as HTMLLabelElement).style.color = errors.photos
                      ? ERROR
                      : GRAY_700;
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
                          : `linear-gradient(90deg, ${TEAL}, rgba(24, 95, 165, 0.60))`,
                      transition: "width 0.5s cubic-bezier(0.16,1,0.3,1)",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: galleryFilled >= GALLERY_TARGET ? SUCCESS : GRAY_700,
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
                        photo={photo}
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
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLLabelElement).style.borderColor = TEAL;
                          (e.currentTarget as HTMLLabelElement).style.backgroundColor = TEAL_BG;
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLLabelElement).style.borderColor = GRAY_200;
                          (e.currentTarget as HTMLLabelElement).style.backgroundColor = SURFACE;
                        }}
                      >
                        <Plus size={15} color={GRAY_400} />
                        <span
                          style={{
                            fontSize: 9,
                            color: GRAY_400,
                            fontWeight: 700,
                            letterSpacing: "0.05em",
                          }}
                        >
                          ADD
                        </span>
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
                  <ErrorMsg message={errors.photos} />
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
          border: `1.5px solid ${focused ? "rgba(24, 95, 165, 0.40)" : "transparent"}`,
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
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "#fef2f2";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
        }}
      >
        <X size={13} color={GRAY_400} />
      </button>
    </div>
  );
};

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
  const src = useObjectURL(file);

  if (file) {
    return (
      <div
        className="relative w-full overflow-hidden"
        style={{ height: 220, borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <img
          src={src}
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
          border: `2px dashed ${error ? ERROR_SOFT : GRAY_200}`,
          borderRadius: 16,
          backgroundColor: error ? ERROR_BG : SURFACE,
          boxShadow: error ? `0 0 0 3px ${ERROR_RING}` : "none",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLLabelElement).style.borderColor = error ? ERROR : TEAL;
          (e.currentTarget as HTMLLabelElement).style.backgroundColor = error
            ? "rgba(239,68,68,0.07)"
            : TEAL_BG;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLLabelElement).style.borderColor = error ? ERROR_SOFT : GRAY_200;
          (e.currentTarget as HTMLLabelElement).style.backgroundColor = error ? ERROR_BG : SURFACE;
        }}
      >
        <div
          style={{
            width: 50,
            height: 50,
            borderRadius: 15,
            backgroundColor: WHITE,
            border: `1.5px solid ${error ? ERROR_SOFT : GRAY_200}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
          }}
        >
          <ImagePlus size={22} color={error ? "#f87171" : GRAY_400} />
        </div>
        <div className="text-center">
          <p style={{ fontSize: 13.5, fontWeight: 700, color: error ? ERROR : BLACK }}>
            Upload cover photo
          </p>
          <p style={{ fontSize: 11, color: GRAY_400, marginTop: 3 }}>
            Click to browse · JPG, PNG, WEBP
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
};

const GalleryThumb = ({
  photo,
  index,
  isRecommended,
  onRemove,
}: {
  photo: string | File;
  index: number;
  isRecommended: boolean;
  onRemove: () => void;
}) => {
  const [hovered, setHovered] = React.useState(false);
  const src = useObjectURL(photo);
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
            backgroundColor: SUCCESS,
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
        border: `2px dashed ${error ? ERROR_SOFT : GRAY_200}`,
        borderRadius: 16,
        backgroundColor: error ? ERROR_BG : SURFACE,
        boxShadow: error ? `0 0 0 3px ${ERROR_RING}` : "none",
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLLabelElement).style.borderColor = error ? ERROR : TEAL;
        (e.currentTarget as HTMLLabelElement).style.backgroundColor = error
          ? "rgba(239,68,68,0.07)"
          : TEAL_BG;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLLabelElement).style.borderColor = error ? ERROR_SOFT : GRAY_200;
        (e.currentTarget as HTMLLabelElement).style.backgroundColor = error ? ERROR_BG : SURFACE;
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 15,
          backgroundColor: WHITE,
          border: `1.5px solid ${error ? ERROR_SOFT : GRAY_200}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
        }}
      >
        <FileImage size={24} color={error ? "#f87171" : GRAY_400} />
      </div>
      <div className="text-center">
        <p style={{ fontSize: 13.5, fontWeight: 700, color: error ? ERROR : BLACK }}>
          Add gallery photos
        </p>
        <p style={{ fontSize: 11, color: GRAY_400, marginTop: 3 }}>
          Listings with 5+ photos get 40% more bookings
        </p>
      </div>
      <span
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: error ? ERROR : TEAL,
          border: `1.5px solid ${error ? "rgba(239,68,68,0.40)" : "rgba(24, 95, 165, 0.40)"}`,
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
    <ErrorMsg message={error} />
  </div>
);

export default DescriptionStep;
