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
import {
  TEAL,
  TEAL_BG,
  TEAL_BORDER,
  TEAL_FOCUS,
  BLACK,
  WHITE,
  SURFACE,
  GRAY_400,
  GRAY_700,
  GRAY_200,
  ERROR_SOFT,
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
  const padY = size === "md" ? 8 : 6;
  const padX = size === "md" ? 16 : 14;
  const fontSize = size === "md" ? 12.5 : 12;
  const baseStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    fontSize,
    fontWeight: 700,
    color: TEAL,
    backgroundColor: TEAL_BG,
    border: `1.5px solid ${TEAL_BORDER}`,
    borderRadius: 999,
    padding: `${padY}px ${padX}px`,
    cursor: "pointer",
    letterSpacing: "0.01em",
    transition: "background-color 0.15s",
    whiteSpace: "nowrap",
  };
  const hoverIn = (e: React.SyntheticEvent<HTMLElement>) => {
    (e.currentTarget as HTMLElement).style.backgroundColor = "rgba(15, 92, 138, 0.14)";
  };
  const hoverOut = (e: React.SyntheticEvent<HTMLElement>) => {
    (e.currentTarget as HTMLElement).style.backgroundColor = TEAL_BG;
  };

  if (as === "label") {
    return (
      <label style={baseStyle} onMouseEnter={hoverIn} onMouseLeave={hoverOut}>
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
      style={baseStyle}
      onMouseEnter={hoverIn}
      onMouseLeave={hoverOut}
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
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
    embedded ? (
      <div className="w-full flex flex-col gap-4">{children}</div>
    ) : (
      <div className="flex flex-col items-center gap-7 w-full max-w-2xl">
        <StepHeader
          kicker="Caravan Details"
          title="Tell guests about your caravan"
          subtitle="Great photos and a clear description help guests choose you."
        />
        <div className="w-full flex flex-col gap-4">{children}</div>
      </div>
    );

  return (
    <Wrapper>
        <SectionCard
          icon={<Type size={16} color={TEAL} strokeWidth={2.5} />}
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
          icon={<ShieldCheck size={16} color={TEAL} strokeWidth={2.5} />}
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
          icon={<Camera size={16} color={TEAL} strokeWidth={2.5} />}
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

            <div style={{ height: 1, backgroundColor: "#F0F0F0" }} />

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
    </Wrapper>
  );
};

// ============================================================================
// Rules
// ============================================================================

const RulesEmptyState: React.FC<{ onAdd: () => void }> = ({ onAdd }) => (
  <div
    className="flex flex-col items-center justify-center gap-3"
    style={{
      padding: "26px 20px",
      border: `1.5px dashed ${TEAL_BORDER}`,
      borderRadius: 14,
      // Subtle teal-tinted background so the empty state feels intentional /
      // inviting rather than a "you forgot something" grey panel.
      backgroundColor: TEAL_BG,
    }}
  >
    <div
      style={{
        width: 42,
        height: 42,
        borderRadius: 13,
        backgroundColor: WHITE,
        border: `1.5px solid ${TEAL_BORDER}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 2px 8px rgba(15, 92, 138, 0.08)",
      }}
    >
      <ShieldCheck size={18} color={TEAL} strokeWidth={2.2} />
    </div>
    <div className="text-center">
      <p style={{ fontSize: 13, fontWeight: 700, color: BLACK, letterSpacing: "-0.01em" }}>
        No house rules yet
      </p>
      <p style={{ fontSize: 11.5, color: GRAY_400, marginTop: 2 }}>
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
          border: `1.5px solid ${focused ? TEAL_BORDER : "transparent"}`,
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
        aria-label={`Remove rule ${index + 1}`}
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
        <p
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: GRAY_700,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          Cover Photo
        </p>
        <p style={{ fontSize: 11.5, color: GRAY_400, marginTop: 2 }}>
          First image guests see — make it count
        </p>
      </div>
      {file ? (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            fontSize: 10.5,
            fontWeight: 700,
            color: SUCCESS,
            backgroundColor: SUCCESS_BG,
            border: `1px solid ${SUCCESS_BORDER}`,
            borderRadius: 99,
            padding: "2px 9px 2px 7px",
          }}
        >
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
  const [hovered, setHovered] = React.useState(false);
  const src = useObjectURL(file);
  return (
    <div
      className="relative w-full overflow-hidden bg-gray-100"
      // Taller box (260) plus the dual-layer image strategy keeps portrait
      // covers visible without cropping. The blurred backdrop fills the
      // letterbox gutters so the card still feels like a photo, not a thumbnail
      // floating on a flat color.
      style={{ height: 260, borderRadius: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.10)" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <img
        src={src}
        alt=""
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          filter: "blur(28px)",
          transform: "scale(1.15)",
          opacity: 0.55,
        }}
      />
      <img
        src={src}
        alt="Cover"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(to top, rgba(0,0,0,${hovered ? 0.42 : 0.12}), transparent 55%)`,
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
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            backgroundColor: "rgba(255,255,255,0.96)",
            backdropFilter: "blur(8px)",
            color: BLACK,
            fontSize: 12.5,
            fontWeight: 700,
            padding: "9px 18px",
            borderRadius: 99,
            cursor: "pointer",
            boxShadow: "0 4px 16px rgba(0,0,0,0.18)",
            letterSpacing: "0.01em",
          }}
        >
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
        style={{
          position: "absolute",
          top: 10,
          right: 10,
          width: 30,
          height: 30,
          borderRadius: "50%",
          backgroundColor: "rgba(255,255,255,0.94)",
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
};

const CoverDropzone: React.FC<{
  error?: string;
  onUpload: (files: FileList | null) => void;
}> = ({ error, onUpload }) => {
  const [hovered, setHovered] = React.useState(false);
  const borderColor = error ? ERROR_SOFT : hovered ? TEAL : GRAY_200;
  const bgColor = !error && hovered ? TEAL_BG : SURFACE;
  return (
    <div className="flex flex-col gap-1.5">
      <label
        className="w-full flex flex-col items-center justify-center gap-3 cursor-pointer"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          height: 200,
          // Subtle radial highlight so the empty dropzone reads as a
          // "drop here" target rather than a flat grey card.
          backgroundImage: `radial-gradient(circle at 50% 30%, rgba(15, 92, 138, 0.05), transparent 60%)`,
          backgroundColor: bgColor,
          border: `2px dashed ${borderColor}`,
          borderRadius: 18,
          transition: "all 0.2s",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 17,
            backgroundColor: WHITE,
            border: `1.5px solid ${hovered && !error ? TEAL_BORDER : GRAY_200}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
            transition: "all 0.2s",
          }}
        >
          <UploadCloud
            size={24}
            color={hovered && !error ? TEAL : GRAY_400}
            strokeWidth={2}
          />
        </div>
        <div className="text-center">
          <p style={{ fontSize: 13.5, fontWeight: 700, color: BLACK, letterSpacing: "-0.01em" }}>
            Drop a photo here, or click to browse
          </p>
          <p style={{ fontSize: 11, color: GRAY_400, marginTop: 3 }}>
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
};

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
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: GRAY_700,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Gallery Photos
          </p>
          <p
            style={{
              fontSize: 11.5,
              color: complete ? SUCCESS : GRAY_400,
              marginTop: 2,
              fontWeight: complete ? 600 : 400,
            }}
          >
            {complete ? (
              <>
                <Sparkles
                  size={11}
                  strokeWidth={2.5}
                  style={{ display: "inline", verticalAlign: "-1px", marginRight: 4 }}
                />
                Minimum reached — add more for a richer listing
              </>
            ) : (
              <>
                <strong style={{ color: BLACK, fontWeight: 700 }}>
                  {filled}/{GALLERY_TARGET}
                </strong>{" "}
                photos · {remainingMin} more recommended
              </>
            )}
          </p>
        </div>
        {photos.length > 0 && canAddBonus && (
          <PillCTA
            as="label"
            icon={<Plus size={12} strokeWidth={2.5} />}
            label="Add More"
          >
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
          return (
            <EmptySlot
              key={`slot-${idx}`}
              index={idx}
              error={!!error}
              onUpload={onUpload}
            />
          );
        })}
      </div>

      {bonusPhotos.length > 0 && (
        <div className="flex flex-col gap-2">
          <p
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: GRAY_400,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
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
}> = ({ index, error, onUpload }) => {
  const [hovered, setHovered] = React.useState(false);
  const borderColor = error ? ERROR_SOFT : hovered ? TEAL : GRAY_200;
  const bgColor = !error && hovered ? TEAL_BG : SURFACE;
  return (
    <label
      className="relative aspect-square flex flex-col items-center justify-center gap-1.5 cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: `1.5px dashed ${borderColor}`,
        borderRadius: 12,
        backgroundColor: bgColor,
        transition: "all 0.15s",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 6,
          left: 6,
          width: 17,
          height: 17,
          borderRadius: "50%",
          backgroundColor: WHITE,
          border: `1px solid ${GRAY_200}`,
          color: GRAY_400,
          fontSize: 9.5,
          fontWeight: 800,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {index + 1}
      </span>
      <Plus size={16} color={hovered && !error ? TEAL : GRAY_400} strokeWidth={2.5} />
      <span
        style={{
          fontSize: 9.5,
          color: hovered && !error ? TEAL : GRAY_400,
          fontWeight: 700,
          letterSpacing: "0.06em",
        }}
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
};

const BonusAddTile: React.FC<{ onUpload: (files: FileList | null) => void }> = ({ onUpload }) => (
  <label
    className="aspect-square flex items-center justify-center cursor-pointer"
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
    <Plus size={18} color={GRAY_400} strokeWidth={2.5} />
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
  const [hovered, setHovered] = React.useState(false);
  const src = useObjectURL(photo);
  return (
    <div
      className="relative aspect-square overflow-hidden"
      style={{
        borderRadius: 12,
        boxShadow: hovered ? "0 6px 18px rgba(0,0,0,0.16)" : "0 1px 4px rgba(0,0,0,0.08)",
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

      {showIndex && (
        <span
          style={{
            position: "absolute",
            top: 6,
            left: 6,
            minWidth: 19,
            height: 19,
            padding: "0 5px",
            borderRadius: 99,
            backgroundColor: "rgba(0,0,0,0.62)",
            backdropFilter: "blur(4px)",
            color: WHITE,
            fontSize: 10,
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            letterSpacing: "0.02em",
          }}
        >
          {index + 1}
        </span>
      )}

      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove photo ${index + 1}`}
        style={{
          position: "absolute",
          top: 5,
          right: 5,
          width: 22,
          height: 22,
          borderRadius: "50%",
          backgroundColor: "rgba(0,0,0,0.62)",
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

export default DescriptionStep;
