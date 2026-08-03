import React from "react";
import {
  Plus,
  Minus,
  X,
  ImagePlus,
  IndianRupee,
  Users,
  DoorClosed,
  BedDouble,
  Bath,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EntireStayFormProps {
  guestCapacity: number;
  numberOfRooms: number;
  numberOfBeds: number;
  numberOfBathrooms: number;
  regularPrice: string;
  setRegularPrice: (val: string) => void;
  incrementValue: (value: number, setter: (val: number) => void, max?: number) => void;
  decrementValue: (value: number, setter: (val: number) => void, min?: number) => void;
  setGuestCapacity: (val: number) => void;
  setNumberOfRooms: (val: number) => void;
  setNumberOfBeds: (val: number) => void;
  setNumberOfBathrooms: (val: number) => void;
  entireStayRules: string[];
  addEntireStayRule: () => void;
  removeEntireStayRule: (index: number) => void;
  updateEntireStayRule: (index: number, value: string) => void;
  coverImage: string | null;
  handleCoverImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeCoverImage: () => void;
  renderImageSrc: (src: string | null) => string;
  entireStayImages: string[];
  setEntireStayImages: React.Dispatch<React.SetStateAction<string[]>>;
  removeEntireStayImage: (index: number) => void;
  sliderRef: React.RefObject<HTMLDivElement>;
  errors: Record<string, string>;
  clearError: (field: string) => void;
}

/* ─── Section card ────────────────────────────────────────────────────────── */
const SectionCard = ({
  icon,
  title,
  subtitle,
  trailing,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="bg-th-surface-0 border-[1.5px] border-th-warm-border rounded-[20px] p-[20px_22px_22px] shadow-[0_2px_12px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.03)]">
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-[11px] bg-th-brand-soft border-[1.5px] border-[rgba(59, 217, 218, 0.5)] flex items-center justify-center shrink-0 text-th-brand">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-[13px] font-bold text-th-text-primary tracking-[-0.01em]">{title}</p>
        {subtitle && <p className="text-[11px] text-th-warm-text-muted mt-[1px]">{subtitle}</p>}
      </div>
      {trailing}
    </div>
    <div className="flex flex-col gap-4">{children}</div>
  </div>
);

/* ─── Counter row ────────────────────────────────────────────────────────── */
const Counter = ({
  icon,
  label,
  desc,
  value,
  onDecrement,
  onIncrement,
  error,
}: {
  icon: React.ReactNode;
  label: string;
  desc: string;
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  error?: string;
}) => (
  <div
    className={cn(
      "flex items-center justify-between px-[14px] py-3 rounded-[13px] border-[1.5px] transition-all duration-150",
      error
        ? "border-th-error-bright-soft bg-th-error-bright-bg shadow-[0_0_0_3px_var(--th-error-bright-ring)]"
        : "border-th-warm-border bg-th-warm-surface",
    )}
  >
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "w-8 h-8 rounded-[9px] border-[1.5px] flex items-center justify-center shrink-0",
          error
            ? "bg-[rgba(239,68,68,0.08)] border-th-error-bright-soft"
            : "bg-th-surface-0 border-th-warm-border",
        )}
      >
        <span className={error ? "text-th-error-bright" : "text-th-warm-text-muted"}>{icon}</span>
      </div>
      <div>
        <p
          className={cn(
            "text-[13px] font-semibold",
            error ? "text-th-error-bright" : "text-th-text-primary",
          )}
        >
          {label}
        </p>
        <p
          className={cn(
            "text-[11px] mt-[1px]",
            error ? "text-th-error-bright" : "text-th-warm-text-muted",
          )}
        >
          {error || desc}
        </p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onDecrement}
        className="w-[30px] h-[30px] rounded-full border-[1.5px] border-th-warm-border bg-th-surface-0 flex items-center justify-center cursor-pointer transition-all duration-150"
      >
        <Minus size={12} className="text-th-warm-text-muted" />
      </button>
      <span
        className={cn(
          "text-[15px] font-bold min-w-6 text-center",
          error ? "text-th-error-bright" : "text-th-text-primary",
        )}
      >
        {isFinite(value) ? value : 0}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        className="w-[30px] h-[30px] rounded-full border-[1.5px] border-th-warm-border bg-th-surface-0 flex items-center justify-center cursor-pointer transition-all duration-150"
      >
        <Plus size={12} className="text-th-warm-text-muted" />
      </button>
    </div>
  </div>
);

/* ─── Error message ──────────────────────────────────────────────────────── */
const ErrorMsg = ({ message }: { message?: string }) =>
  message ? (
    <div className="flex items-center gap-1.5 mt-0.5">
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none" className="text-th-error-bright">
        <circle cx="6" cy="6" r="5.25" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M6 3.5v3M6 8.25v.25"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <p className="text-[11.5px] text-th-error-bright">{message}</p>
    </div>
  ) : null;

const MIN_IMAGES = 5;

/* ─── Main component ──────────────────────────────────────────────────────── */
const EntireStayForm: React.FC<EntireStayFormProps> = ({
  guestCapacity,
  numberOfRooms,
  numberOfBeds,
  numberOfBathrooms,
  regularPrice,
  setRegularPrice,
  incrementValue,
  decrementValue,
  setGuestCapacity,
  setNumberOfRooms,
  setNumberOfBeds,
  setNumberOfBathrooms,
  entireStayRules,
  addEntireStayRule,
  removeEntireStayRule,
  updateEntireStayRule,
  coverImage,
  handleCoverImageUpload,
  removeCoverImage,
  renderImageSrc,
  entireStayImages,
  setEntireStayImages,
  removeEntireStayImage,
  sliderRef,
  errors,
  clearError,
}) => {
  const imageProgress = Math.min(entireStayImages.length, MIN_IMAGES);

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* ── Property Details ── */}
      <SectionCard
        icon={<Users size={16} strokeWidth={2.5} />}
        title="Property Details"
        subtitle="Capacity and room configuration"
      >
        <div className="flex flex-col gap-2.5">
          <Counter
            icon={<Users size={14} />}
            label="Guest Capacity"
            desc="Max guests allowed"
            value={guestCapacity}
            onDecrement={() => {
              decrementValue(guestCapacity, setGuestCapacity);
              clearError("guestCapacity");
            }}
            onIncrement={() => {
              incrementValue(guestCapacity, setGuestCapacity);
              clearError("guestCapacity");
            }}
            error={errors.guestCapacity}
          />
          <Counter
            icon={<DoorClosed size={14} />}
            label="Rooms"
            desc="Total rooms for guests"
            value={numberOfRooms}
            onDecrement={() => {
              decrementValue(numberOfRooms, setNumberOfRooms);
              clearError("numberOfRooms");
            }}
            onIncrement={() => {
              incrementValue(numberOfRooms, setNumberOfRooms);
              clearError("numberOfRooms");
            }}
            error={errors.numberOfRooms}
          />
          <Counter
            icon={<BedDouble size={14} />}
            label="Beds"
            desc="Total beds across all rooms"
            value={numberOfBeds}
            onDecrement={() => {
              decrementValue(numberOfBeds, setNumberOfBeds);
              clearError("numberOfBeds");
            }}
            onIncrement={() => {
              incrementValue(numberOfBeds, setNumberOfBeds);
              clearError("numberOfBeds");
            }}
            error={errors.numberOfBeds}
          />
          <Counter
            icon={<Bath size={14} />}
            label="Bathrooms"
            desc="Total bathrooms"
            value={numberOfBathrooms}
            onDecrement={() => {
              decrementValue(numberOfBathrooms, setNumberOfBathrooms);
              clearError("numberOfBathrooms");
            }}
            onIncrement={() => {
              incrementValue(numberOfBathrooms, setNumberOfBathrooms);
              clearError("numberOfBathrooms");
            }}
            error={errors.numberOfBathrooms}
          />
        </div>
      </SectionCard>

      {/* ── Pricing ── */}
      <SectionCard
        icon={<IndianRupee size={16} strokeWidth={2.5} />}
        title="Pricing"
        subtitle="How much guests pay per night"
      >
        <div className="flex flex-col gap-1.5">
          <label
            className={cn(
              "text-[12px] font-semibold uppercase tracking-[0.03em]",
              errors.regularPrice ? "text-th-error-bright" : "text-th-warm-text-dark",
            )}
          >
            Price per Night <span className="text-th-error-bright">*</span>
          </label>
          <div
            className={cn(
              "flex items-center rounded-[13px] overflow-hidden border-[1.5px] transition-all duration-150",
              "focus-within:border-th-brand focus-within:bg-th-surface-0",
              "focus-within:shadow-[0_0_0_4px_var(--th-ring),0_1px_4px_rgba(0,0,0,0.06)]",
              errors.regularPrice
                ? "border-th-error-bright-soft bg-th-error-bright-bg shadow-[0_0_0_3px_var(--th-error-bright-ring)]"
                : "border-transparent bg-th-warm-surface",
            )}
          >
            <div
              className={cn(
                "flex items-center gap-1 px-[14px] h-[52px] border-r-[1.5px] shrink-0 transition-all duration-150",
                "focus-within:border-r-[rgba(59, 217, 218, 0.5)] focus-within:bg-th-brand-soft",
                "border-r-th-warm-border bg-th-warm-surface",
              )}
            >
              <IndianRupee size={13} className="text-th-warm-text-muted" />
              <span className="text-[12px] font-semibold text-th-warm-text-muted">INR</span>
            </div>
            <input
              type="number"
              placeholder="0.00"
              value={regularPrice}
              onChange={(e) => {
                setRegularPrice(e.target.value);
                clearError("regularPrice");
              }}
              className="flex-1 h-[52px] px-[14px] text-[14px] font-semibold text-th-text-primary bg-transparent border-none outline-none"
            />
            <span className="pr-[14px] text-[11px] font-semibold text-th-warm-text-muted">
              per night
            </span>
          </div>
          <ErrorMsg message={errors.regularPrice} />
        </div>
      </SectionCard>

      {/* ── House Rules ── */}
      <SectionCard
        icon={<ShieldCheck size={16} strokeWidth={2.5} />}
        title="House Rules"
        subtitle="Set expectations for your guests"
        trailing={
          errors.entireStayRules ? (
            <span className="text-[11px] font-semibold text-th-error-bright">
              {errors.entireStayRules}
            </span>
          ) : undefined
        }
      >
        <div className="flex flex-col gap-2.5">
          {entireStayRules.map((rule, index) => (
            <div key={index} className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-th-warm-surface border-[1.5px] border-th-warm-border flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-th-warm-text-muted">{index + 1}</span>
              </div>
              <input
                placeholder={
                  index === 0
                    ? "e.g. No smoking indoors"
                    : index === 1
                      ? "e.g. No pets allowed"
                      : "Add a rule…"
                }
                value={rule}
                onChange={(e) => {
                  updateEntireStayRule(index, e.target.value);
                  clearError("entireStayRules");
                }}
                className={cn(
                  "flex-1 h-11 px-[14px] text-[13px] text-th-text-primary bg-th-warm-surface rounded-[11px] outline-none font-[450] transition-all duration-150",
                  "focus:border-th-brand focus:bg-th-surface-0 focus:shadow-[0_0_0_4px_var(--th-ring)]",
                  errors.entireStayRules
                    ? "border-[1.5px] border-th-error-bright-soft"
                    : "border-[1.5px] border-transparent",
                )}
              />
              <button
                type="button"
                onClick={() => removeEntireStayRule(index)}
                className="w-7 h-7 rounded-full bg-transparent border-none flex items-center justify-center cursor-pointer shrink-0 transition-colors duration-150 hover:bg-th-warm-surface"
              >
                <X size={13} className="text-th-warm-text-muted" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addEntireStayRule}
            className="flex items-center gap-1.5 text-[12px] font-bold text-th-brand bg-transparent border-none cursor-pointer pl-[34px] mt-0.5"
          >
            <Plus size={13} />
            Add another rule
          </button>
        </div>
      </SectionCard>

      {/* ── Cover Photo ── */}
      <SectionCard
        icon={<ImagePlus size={16} strokeWidth={2.5} />}
        title="Cover Photo"
        subtitle="First impression for guests"
        trailing={
          errors.coverImage ? (
            <span className="text-[11px] font-semibold text-th-error-bright">
              {errors.coverImage}
            </span>
          ) : undefined
        }
      >
        <div
          className={cn(
            "relative w-full h-[220px] rounded-[16px] overflow-hidden border-2 transition-all duration-150",
            errors.coverImage
              ? "border-th-error-bright-soft shadow-[0_0_0_3px_var(--th-error-bright-ring)]"
              : "border-th-warm-border",
          )}
        >
          {coverImage ? (
            <>
              <img
                src={renderImageSrc(coverImage)}
                alt="Cover"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
              <button
                onClick={removeCoverImage}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 border-none flex items-center justify-center cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
              >
                <X size={14} className="text-th-warm-text-dark" />
              </button>
              <label className="absolute bottom-3 right-3 flex items-center gap-1.5 px-[14px] py-1.5 rounded-full bg-white/90 text-[12px] font-bold text-th-warm-text-dark cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
                <ImagePlus size={12} />
                Change
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  className="hidden"
                  onChange={(e) => {
                    handleCoverImageUpload(e);
                    clearError("coverImage");
                  }}
                />
              </label>
            </>
          ) : (
            <label className="w-full h-full flex flex-col items-center justify-center gap-2.5 cursor-pointer bg-th-warm-surface transition-colors duration-150 hover:bg-th-brand-soft">
              <div className="w-12 h-12 rounded-full bg-th-surface-0 border-[1.5px] border-th-warm-border flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                <ImagePlus size={20} className="text-th-warm-text-muted" />
              </div>
              <div className="text-center">
                <p className="text-[13px] font-bold text-th-warm-text-dark">Upload cover photo</p>
                <p className="text-[11px] text-th-warm-text-muted mt-0.5">
                  JPG or PNG · First impression matters
                </p>
              </div>
              <input
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={(e) => {
                  handleCoverImageUpload(e);
                  clearError("coverImage");
                }}
              />
            </label>
          )}
        </div>
      </SectionCard>

      {/* ── Property Gallery ── */}
      <SectionCard
        icon={<ImagePlus size={16} strokeWidth={2.5} />}
        title="Property Gallery"
        subtitle="Showcase your property"
        trailing={
          <span
            className={cn(
              "text-[11px] font-bold rounded-full px-2.5 py-[2px] border",
              entireStayImages.length >= MIN_IMAGES
                ? "text-th-success-bright bg-th-success-bright-bg border-th-success-bright-border"
                : errors.entireStayImages
                  ? "text-th-error-bright bg-th-error-bright-bg border-th-error-bright-soft"
                  : "text-th-warm-text-muted bg-th-warm-surface border-th-warm-border",
            )}
          >
            {entireStayImages.length}/{MIN_IMAGES} required
          </span>
        }
      >
        {/* Progress bar */}
        <div className="w-full h-1 bg-th-warm-surface rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-[width] [transition-duration:400ms] ease-out",
              imageProgress >= MIN_IMAGES ? "bg-th-success-bright" : "bg-th-brand",
            )}
            style={{ width: `${(imageProgress / MIN_IMAGES) * 100}%` }}
          />
        </div>

        {/* Upload zone */}
        <label
          className={cn(
            "flex h-[88px] items-center justify-center gap-3 rounded-[13px] border-2 border-dashed cursor-pointer transition-all duration-150",
            errors.entireStayImages
              ? "border-th-error-bright-soft bg-th-error-bright-bg"
              : "border-th-warm-border bg-th-warm-surface hover:border-th-brand hover:bg-th-brand-soft",
          )}
        >
          <ImagePlus
            size={18}
            className={errors.entireStayImages ? "text-th-error-bright" : "text-th-warm-text-muted"}
          />
          <div>
            <p
              className={cn(
                "text-[13px] font-semibold",
                errors.entireStayImages ? "text-th-error-bright" : "text-th-warm-text-dark",
              )}
            >
              {errors.entireStayImages || "Add photos"}
            </p>
            <p className="text-[11px] text-th-warm-text-muted">Select multiple · JPG, PNG</p>
          </div>
          <input
            type="file"
            accept="image/png,image/jpeg"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = e.target.files;
              if (!files || files.length === 0) return;
              const validFiles = Array.from(files).filter((f) =>
                ["image/jpeg", "image/jpg", "image/png"].includes(f.type),
              );
              if (!validFiles.length) return;
              Promise.all(
                validFiles.map(
                  (file) =>
                    new Promise<string>((resolve) => {
                      const reader = new FileReader();
                      reader.onload = () => resolve(reader.result as string);
                      reader.readAsDataURL(file);
                    }),
                ),
              ).then((base64Images) => {
                setEntireStayImages((prev) => [...prev, ...base64Images]);
                clearError("entireStayImages");
              });
            }}
          />
        </label>

        {/* Image grid */}
        {entireStayImages.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {entireStayImages.map((photo, index) => (
              <div
                key={index}
                className="relative aspect-square rounded-[12px] overflow-hidden border-[1.5px] border-th-warm-border group"
              >
                <img
                  src={renderImageSrc(photo)}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {index < MIN_IMAGES && (
                  <div className="absolute top-1.5 left-1.5 w-4 h-4 rounded-full bg-th-success-bright flex items-center justify-center">
                    <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                      <path
                        d="M2.5 6L5 8.5L9.5 3.5"
                        stroke="white"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
                <button
                  onClick={() => removeEntireStayImage(index)}
                  className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/55 border-none flex items-center justify-center cursor-pointer opacity-0 transition-opacity duration-150 group-hover:!opacity-100"
                >
                  <X size={10} className="text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  );
};

export default EntireStayForm;
