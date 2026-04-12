import React from "react";
import { Plus, Minus, X, ImagePlus, IndianRupee, Users, DoorClosed, BedDouble, Bath, ShieldCheck } from "lucide-react";

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const TEAL       = "#07e4e4";
const TEAL_BG    = "rgba(7, 228, 228, 0.07)";
const TEAL_FOCUS = "rgba(7, 228, 228, 0.15)";
const BLACK      = "#131313";
const GRAY_500   = "#6b6b6b";
const GRAY_400   = "#9a9a9a";
const GRAY_200   = "#e4e4e4";
const WHITE      = "#ffffff";
const SURFACE    = "#F7F8FA";
const ERROR      = "#ef4444";
const ERROR_BG   = "rgba(239,68,68,0.04)";
const ERROR_RING = "rgba(239,68,68,0.1)";

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
  icon, title, subtitle, trailing, children,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
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
    <div className="flex items-center gap-3 mb-5">
      <div
        style={{
          width: 36, height: 36, borderRadius: 11,
          backgroundColor: TEAL_BG,
          border: "1.5px solid rgba(7,228,228,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: BLACK, letterSpacing: "-0.01em" }}>{title}</p>
        {subtitle && <p style={{ fontSize: 11, color: GRAY_400, marginTop: 1 }}>{subtitle}</p>}
      </div>
      {trailing}
    </div>
    <div className="flex flex-col gap-4">{children}</div>
  </div>
);

/* ─── Counter row ────────────────────────────────────────────────────────── */
const Counter = ({
  icon, label, desc, value, onDecrement, onIncrement, error,
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
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "12px 14px",
      borderRadius: 13,
      border: `1.5px solid ${error ? "#fca5a5" : GRAY_200}`,
      backgroundColor: error ? ERROR_BG : SURFACE,
      boxShadow: error ? `0 0 0 3px ${ERROR_RING}` : "none",
      transition: "all 0.15s",
    }}
  >
    <div className="flex items-center gap-3">
      <div
        style={{
          width: 32, height: 32, borderRadius: 9,
          backgroundColor: error ? "rgba(239,68,68,0.08)" : WHITE,
          border: `1.5px solid ${error ? "#fca5a5" : GRAY_200}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <span style={{ color: error ? ERROR : GRAY_400 }}>{icon}</span>
      </div>
      <div>
        <p style={{ fontSize: 13, fontWeight: 600, color: error ? ERROR : BLACK }}>{label}</p>
        <p style={{ fontSize: 11, color: error ? ERROR : GRAY_400, marginTop: 1 }}>{error || desc}</p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onDecrement}
        style={{
          width: 30, height: 30, borderRadius: "50%",
          border: `1.5px solid ${GRAY_200}`, backgroundColor: WHITE,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", transition: "all 0.15s",
        }}
      >
        <Minus size={12} color={GRAY_400} />
      </button>
      <span style={{ fontSize: 15, fontWeight: 700, color: error ? ERROR : BLACK, minWidth: 24, textAlign: "center" as const }}>{value}</span>
      <button
        type="button"
        onClick={onIncrement}
        style={{
          width: 30, height: 30, borderRadius: "50%",
          border: `1.5px solid ${GRAY_200}`, backgroundColor: WHITE,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", transition: "all 0.15s",
        }}
      >
        <Plus size={12} color={GRAY_400} />
      </button>
    </div>
  </div>
);

/* ─── Error message ──────────────────────────────────────────────────────── */
const ErrorMsg = ({ message }: { message?: string }) =>
  message ? (
    <div className="flex items-center gap-1.5 mt-0.5">
      <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
        <circle cx="6" cy="6" r="5.25" stroke={ERROR} strokeWidth="1.5" />
        <path d="M6 3.5v3M6 8.25v.25" stroke={ERROR} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      <p style={{ fontSize: 11.5, color: ERROR }}>{message}</p>
    </div>
  ) : null;

const MIN_IMAGES = 5;

/* ─── Main component ──────────────────────────────────────────────────────── */
const EntireStayForm: React.FC<EntireStayFormProps> = ({
  guestCapacity, numberOfRooms, numberOfBeds, numberOfBathrooms,
  regularPrice, setRegularPrice,
  incrementValue, decrementValue,
  setGuestCapacity, setNumberOfRooms, setNumberOfBeds, setNumberOfBathrooms,
  entireStayRules, addEntireStayRule, removeEntireStayRule, updateEntireStayRule,
  coverImage, handleCoverImageUpload, removeCoverImage, renderImageSrc,
  entireStayImages, setEntireStayImages, removeEntireStayImage, sliderRef,
  errors, clearError,
}) => {
  const imageProgress = Math.min(entireStayImages.length, MIN_IMAGES);
  const [priceFocused, setPriceFocused] = React.useState(false);

  return (
    <div className="flex flex-col gap-4 w-full">

      {/* ── Property Details ── */}
      <SectionCard
        icon={<Users size={16} color={TEAL} strokeWidth={2.5} />}
        title="Property Details"
        subtitle="Capacity and room configuration"
      >
        <div className="flex flex-col gap-2.5">
          <Counter
            icon={<Users size={14} />}
            label="Guest Capacity"
            desc="Max guests allowed"
            value={guestCapacity}
            onDecrement={() => { decrementValue(guestCapacity, setGuestCapacity); clearError("guestCapacity"); }}
            onIncrement={() => { incrementValue(guestCapacity, setGuestCapacity); clearError("guestCapacity"); }}
            error={errors.guestCapacity}
          />
          <Counter
            icon={<DoorClosed size={14} />}
            label="Rooms"
            desc="Total rooms for guests"
            value={numberOfRooms}
            onDecrement={() => { decrementValue(numberOfRooms, setNumberOfRooms); clearError("numberOfRooms"); }}
            onIncrement={() => { incrementValue(numberOfRooms, setNumberOfRooms); clearError("numberOfRooms"); }}
            error={errors.numberOfRooms}
          />
          <Counter
            icon={<BedDouble size={14} />}
            label="Beds"
            desc="Total beds across all rooms"
            value={numberOfBeds}
            onDecrement={() => { decrementValue(numberOfBeds, setNumberOfBeds); clearError("numberOfBeds"); }}
            onIncrement={() => { incrementValue(numberOfBeds, setNumberOfBeds); clearError("numberOfBeds"); }}
            error={errors.numberOfBeds}
          />
          <Counter
            icon={<Bath size={14} />}
            label="Bathrooms"
            desc="Total bathrooms"
            value={numberOfBathrooms}
            onDecrement={() => { decrementValue(numberOfBathrooms, setNumberOfBathrooms); clearError("numberOfBathrooms"); }}
            onIncrement={() => { incrementValue(numberOfBathrooms, setNumberOfBathrooms); clearError("numberOfBathrooms"); }}
            error={errors.numberOfBathrooms}
          />
        </div>
      </SectionCard>

      {/* ── Pricing ── */}
      <SectionCard
        icon={<IndianRupee size={16} color={TEAL} strokeWidth={2.5} />}
        title="Pricing"
        subtitle="How much guests pay per night"
      >
        <div className="flex flex-col gap-1.5">
          <label
            style={{
              fontSize: 12, fontWeight: 600,
              color: errors.regularPrice ? ERROR : GRAY_500,
              textTransform: "uppercase", letterSpacing: "0.03em",
            }}
          >
            Price per Night <span style={{ color: ERROR }}>*</span>
          </label>
          <div
            style={{
              display: "flex", alignItems: "center",
              borderRadius: 13, overflow: "hidden",
              border: `1.5px solid ${errors.regularPrice ? "#fca5a5" : priceFocused ? TEAL : "transparent"}`,
              backgroundColor: errors.regularPrice ? ERROR_BG : priceFocused ? WHITE : SURFACE,
              boxShadow: priceFocused && !errors.regularPrice
                ? `0 0 0 4px ${TEAL_FOCUS}, 0 1px 4px rgba(0,0,0,0.06)`
                : errors.regularPrice ? `0 0 0 3px ${ERROR_RING}` : "none",
              transition: "all 0.15s",
            }}
          >
            <div
              style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "0 14px", height: 52,
                borderRight: `1.5px solid ${priceFocused ? "rgba(7,228,228,0.25)" : GRAY_200}`,
                backgroundColor: priceFocused ? TEAL_BG : SURFACE,
                flexShrink: 0, transition: "all 0.15s",
              }}
            >
              <IndianRupee size={13} color={priceFocused ? TEAL : GRAY_400} />
              <span style={{ fontSize: 12, fontWeight: 600, color: priceFocused ? TEAL : GRAY_400 }}>INR</span>
            </div>
            <input
              type="number"
              placeholder="0.00"
              value={regularPrice}
              onChange={(e) => { setRegularPrice(e.target.value); clearError("regularPrice"); }}
              onFocus={() => setPriceFocused(true)}
              onBlur={() => setPriceFocused(false)}
              style={{
                flex: 1, height: 52, padding: "0 14px",
                fontSize: 14, fontWeight: 600, color: BLACK,
                backgroundColor: "transparent", border: "none", outline: "none",
              }}
            />
            <span style={{ paddingRight: 14, fontSize: 11, fontWeight: 600, color: GRAY_400 }}>per night</span>
          </div>
          <ErrorMsg message={errors.regularPrice} />
        </div>
      </SectionCard>

      {/* ── House Rules ── */}
      <SectionCard
        icon={<ShieldCheck size={16} color={TEAL} strokeWidth={2.5} />}
        title="House Rules"
        subtitle="Set expectations for your guests"
        trailing={
          errors.entireStayRules ? (
            <span style={{ fontSize: 11, fontWeight: 600, color: ERROR }}>{errors.entireStayRules}</span>
          ) : undefined
        }
      >
        <div className="flex flex-col gap-2.5">
          {entireStayRules.map((rule, index) => (
            <div key={index} className="flex items-center gap-2.5">
              <div
                style={{
                  width: 24, height: 24, borderRadius: "50%",
                  backgroundColor: SURFACE, border: `1.5px solid ${GRAY_200}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: 10, fontWeight: 700, color: GRAY_400 }}>{index + 1}</span>
              </div>
              <input
                placeholder={index === 0 ? "e.g. No smoking indoors" : index === 1 ? "e.g. No pets allowed" : "Add a rule\u2026"}
                value={rule}
                onChange={(e) => { updateEntireStayRule(index, e.target.value); clearError("entireStayRules"); }}
                style={{
                  flex: 1, height: 44, padding: "0 14px",
                  fontSize: 13, color: BLACK,
                  backgroundColor: SURFACE,
                  border: `1.5px solid ${errors.entireStayRules ? "#fca5a5" : "transparent"}`,
                  borderRadius: 11, outline: "none",
                  fontWeight: 450, transition: "all 0.15s",
                }}
                onFocus={(e) => { e.target.style.borderColor = TEAL; e.target.style.backgroundColor = WHITE; e.target.style.boxShadow = `0 0 0 4px ${TEAL_FOCUS}`; }}
                onBlur={(e) => { e.target.style.borderColor = errors.entireStayRules ? "#fca5a5" : "transparent"; e.target.style.backgroundColor = SURFACE; e.target.style.boxShadow = "none"; }}
              />
              <button
                type="button"
                onClick={() => removeEntireStayRule(index)}
                style={{
                  width: 28, height: 28, borderRadius: "50%",
                  backgroundColor: "transparent", border: "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", flexShrink: 0, transition: "background-color 0.15s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = SURFACE; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
              >
                <X size={13} color={GRAY_400} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addEntireStayRule}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              fontSize: 12, fontWeight: 700, color: TEAL,
              backgroundColor: "transparent", border: "none",
              cursor: "pointer", paddingLeft: 34, marginTop: 2,
            }}
          >
            <Plus size={13} />
            Add another rule
          </button>
        </div>
      </SectionCard>

      {/* ── Cover Photo ── */}
      <SectionCard
        icon={<ImagePlus size={16} color={TEAL} strokeWidth={2.5} />}
        title="Cover Photo"
        subtitle="First impression for guests"
        trailing={errors.coverImage ? <span style={{ fontSize: 11, fontWeight: 600, color: ERROR }}>{errors.coverImage}</span> : undefined}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            height: 220,
            borderRadius: 16,
            overflow: "hidden",
            border: `2px solid ${errors.coverImage ? "#fca5a5" : GRAY_200}`,
            boxShadow: errors.coverImage ? `0 0 0 3px ${ERROR_RING}` : "none",
            transition: "all 0.15s",
          }}
        >
          {coverImage ? (
            <>
              <img src={renderImageSrc(coverImage)} alt="Cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.25), transparent)" }} />
              <button
                onClick={removeCoverImage}
                style={{
                  position: "absolute", top: 12, right: 12,
                  width: 32, height: 32, borderRadius: "50%",
                  backgroundColor: "rgba(255,255,255,0.9)", border: "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}
              >
                <X size={14} color={GRAY_500} />
              </button>
              <label
                style={{
                  position: "absolute", bottom: 12, right: 12,
                  display: "flex", alignItems: "center", gap: 6,
                  padding: "6px 14px", borderRadius: 99,
                  backgroundColor: "rgba(255,255,255,0.9)",
                  fontSize: 12, fontWeight: 700, color: GRAY_500,
                  cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                }}
              >
                <ImagePlus size={12} />
                Change
                <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={(e) => { handleCoverImageUpload(e); clearError("coverImage"); }} />
              </label>
            </>
          ) : (
            <label
              style={{
                width: "100%", height: "100%",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 10,
                cursor: "pointer", backgroundColor: SURFACE,
                transition: "background-color 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLLabelElement).style.backgroundColor = TEAL_BG; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLLabelElement).style.backgroundColor = SURFACE; }}
            >
              <div
                style={{
                  width: 48, height: 48, borderRadius: "50%",
                  backgroundColor: WHITE, border: `1.5px solid ${GRAY_200}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                }}
              >
                <ImagePlus size={20} color={GRAY_400} />
              </div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: GRAY_500 }}>Upload cover photo</p>
                <p style={{ fontSize: 11, color: GRAY_400, marginTop: 2 }}>JPG or PNG · First impression matters</p>
              </div>
              <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={(e) => { handleCoverImageUpload(e); clearError("coverImage"); }} />
            </label>
          )}
        </div>
      </SectionCard>

      {/* ── Property Gallery ── */}
      <SectionCard
        icon={<ImagePlus size={16} color={TEAL} strokeWidth={2.5} />}
        title="Property Gallery"
        subtitle="Showcase your property"
        trailing={
          <span
            style={{
              fontSize: 11, fontWeight: 700,
              color: entireStayImages.length >= MIN_IMAGES ? "#16a34a" : errors.entireStayImages ? ERROR : GRAY_400,
              backgroundColor: entireStayImages.length >= MIN_IMAGES ? "#f0fdf4" : errors.entireStayImages ? ERROR_BG : SURFACE,
              border: `1px solid ${entireStayImages.length >= MIN_IMAGES ? "#16a34a25" : errors.entireStayImages ? "#fca5a525" : GRAY_200}`,
              borderRadius: 99, padding: "2px 10px",
            }}
          >
            {entireStayImages.length}/{MIN_IMAGES} required
          </span>
        }
      >
        {/* Progress bar */}
        <div style={{ width: "100%", height: 4, backgroundColor: SURFACE, borderRadius: 99, overflow: "hidden" }}>
          <div
            style={{
              height: "100%", borderRadius: 99,
              width: `${(imageProgress / MIN_IMAGES) * 100}%`,
              backgroundColor: imageProgress >= MIN_IMAGES ? "#22c55e" : TEAL,
              transition: "width 0.4s ease",
            }}
          />
        </div>

        {/* Upload zone */}
        <label
          style={{
            display: "flex", height: 88,
            alignItems: "center", justifyContent: "center", gap: 12,
            borderRadius: 13,
            border: `2px dashed ${errors.entireStayImages ? "#fca5a5" : GRAY_200}`,
            backgroundColor: errors.entireStayImages ? ERROR_BG : SURFACE,
            cursor: "pointer", transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            if (!errors.entireStayImages) {
              (e.currentTarget as HTMLLabelElement).style.borderColor = TEAL;
              (e.currentTarget as HTMLLabelElement).style.backgroundColor = TEAL_BG;
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLLabelElement).style.borderColor = errors.entireStayImages ? "#fca5a5" : GRAY_200;
            (e.currentTarget as HTMLLabelElement).style.backgroundColor = errors.entireStayImages ? ERROR_BG : SURFACE;
          }}
        >
          <ImagePlus size={18} color={errors.entireStayImages ? ERROR : GRAY_400} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: errors.entireStayImages ? ERROR : GRAY_500 }}>
              {errors.entireStayImages || "Add photos"}
            </p>
            <p style={{ fontSize: 11, color: GRAY_400 }}>Select multiple · JPG, PNG</p>
          </div>
          <input
            type="file"
            accept="image/png,image/jpeg"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = e.target.files;
              if (!files || files.length === 0) return;
              const validFiles = Array.from(files).filter(f => ["image/jpeg", "image/jpg", "image/png"].includes(f.type));
              if (!validFiles.length) return;
              Promise.all(
                validFiles.map(file => new Promise<string>((resolve) => {
                  const reader = new FileReader();
                  reader.onload = () => resolve(reader.result as string);
                  reader.readAsDataURL(file);
                }))
              ).then(base64Images => {
                setEntireStayImages(prev => [...prev, ...base64Images]);
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
                style={{
                  position: "relative",
                  aspectRatio: "1",
                  borderRadius: 12,
                  overflow: "hidden",
                  border: `1.5px solid ${GRAY_200}`,
                }}
                className="group"
              >
                <img src={renderImageSrc(photo)} alt={`Photo ${index + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                {index < MIN_IMAGES && (
                  <div
                    style={{
                      position: "absolute", top: 6, left: 6,
                      width: 16, height: 16, borderRadius: "50%",
                      backgroundColor: "#22c55e",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
                <button
                  onClick={() => removeEntireStayImage(index)}
                  style={{
                    position: "absolute", top: 6, right: 6,
                    width: 20, height: 20, borderRadius: "50%",
                    backgroundColor: "rgba(0,0,0,0.55)", border: "none",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    cursor: "pointer", opacity: 0, transition: "opacity 0.15s",
                  }}
                  className="group-hover:!opacity-100"
                >
                  <X size={10} color="white" />
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
