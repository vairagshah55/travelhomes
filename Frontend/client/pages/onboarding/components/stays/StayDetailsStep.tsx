import React from "react";
import EntireStayForm from "./EntireStayForm";
import IndividualRoomForm from "./IndividualRoomForm";

// ─── Brand tokens ─────────────────────────────────────────────────────────────
const TEAL      = "#07e4e4";
const TEAL_BG   = "rgba(7, 228, 228, 0.07)";
const TEAL_RING = "rgba(7, 228, 228, 0.2)";
const BLACK     = "#131313";
const GRAY_500  = "#6b6b6b";
const GRAY_400  = "#9a9a9a";
const GRAY_200  = "#e4e4e4";
const WHITE     = "#ffffff";
const SURFACE   = "#F7F8FA";

interface Room {
  id: string;
  name: string;
  description: string;
  photos: string[];
  guestCapacity: number;
  beds: number;
  bathrooms: number;
  price: number;
}

interface StayDetailsStepProps {
  stayType: "entire" | "individual";
  setStayType: (type: "entire" | "individual") => void;
  // Entire stay fields
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
  // Rules
  entireStayRules: string[];
  addEntireStayRule: () => void;
  removeEntireStayRule: (index: number) => void;
  updateEntireStayRule: (index: number, value: string) => void;
  roomRules: Record<string, string[]>;
  addRoomRule: (roomId: string) => void;
  removeRoomRule: (roomId: string, index: number) => void;
  updateRoomRule: (roomId: string, index: number, value: string) => void;
  // Cover image
  coverImage: string | null;
  handleCoverImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeCoverImage: () => void;
  renderImageSrc: (src: string | null) => string;
  // Entire stay images
  entireStayImages: string[];
  setEntireStayImages: React.Dispatch<React.SetStateAction<string[]>>;
  removeEntireStayImage: (index: number) => void;
  sliderRef: React.RefObject<HTMLDivElement>;
  // Individual rooms
  rooms: Room[];
  expandedRoom: string;
  setExpandedRoom: (id: string) => void;
  addRoom: () => void;
  removeRoom: () => void;
  updateRoom: (id: string, field: keyof Room, value: any) => void;
  handleRoomImageUpload: (event: React.ChangeEvent<HTMLInputElement>, roomId: string) => void;
  removeRoomImage: (roomId: string, index: number) => void;
  // Errors
  errors: Record<string, string>;
  clearError: (field: string) => void;
}

const STAY_OPTIONS: { key: "entire" | "individual"; title: string; desc: string; emoji: string }[] = [
  { key: "entire", title: "Entire Stay", desc: "Guests book the whole property", emoji: "🏡" },
  { key: "individual", title: "Individual Room", desc: "Guests book specific rooms", emoji: "🛏️" },
];

const StayDetailsStep: React.FC<StayDetailsStepProps> = (props) => {
  const { stayType, setStayType } = props;

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
            Listing Setup
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
          Stay Details
        </h1>
        <p style={{ fontSize: 14, color: GRAY_500, lineHeight: 1.6 }}>
          Configure your property listing details.
        </p>
      </div>

      <div className="w-full flex flex-col gap-5">

        {/* ── Stay Type Selection ── */}
        <div
          style={{
            backgroundColor: WHITE,
            border: "1.5px solid #EBEBEB",
            borderRadius: 20,
            padding: "20px 22px 22px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)",
          }}
        >
          <p
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: GRAY_500,
              textTransform: "uppercase",
              letterSpacing: "0.03em",
              marginBottom: 14,
            }}
          >
            How would you like to list?
          </p>
          <div className="grid grid-cols-2 gap-3">
            {STAY_OPTIONS.map((opt) => {
              const selected = stayType === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setStayType(opt.key)}
                  style={{
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 8,
                    padding: "20px 14px",
                    borderRadius: 16,
                    border: `1.5px solid ${selected ? TEAL : GRAY_200}`,
                    backgroundColor: selected ? TEAL_BG : SURFACE,
                    boxShadow: selected ? `0 0 0 3px ${TEAL_RING}` : "none",
                    cursor: "pointer",
                    transition: "all 0.15s",
                    textAlign: "center",
                  }}
                  onMouseEnter={(e) => {
                    if (!selected) {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = TEAL;
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = TEAL_BG;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!selected) {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = GRAY_200;
                      (e.currentTarget as HTMLButtonElement).style.backgroundColor = SURFACE;
                    }
                  }}
                >
                  {/* Selection check */}
                  {selected && (
                    <div
                      style={{
                        position: "absolute",
                        top: 10,
                        right: 10,
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        backgroundColor: TEAL,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M2 5l2.5 2.5L8 3" stroke={BLACK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  )}
                  <span style={{ fontSize: 24 }}>{opt.emoji}</span>
                  <div>
                    <p
                      style={{
                        fontSize: 13.5,
                        fontWeight: 700,
                        color: selected ? TEAL : BLACK,
                        letterSpacing: "-0.01em",
                        transition: "color 0.15s",
                      }}
                    >
                      {opt.title}
                    </p>
                    <p style={{ fontSize: 11.5, color: GRAY_500, marginTop: 3 }}>{opt.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Form ── */}
        {stayType === "entire" && (
          <EntireStayForm
            guestCapacity={props.guestCapacity}
            numberOfRooms={props.numberOfRooms}
            numberOfBeds={props.numberOfBeds}
            numberOfBathrooms={props.numberOfBathrooms}
            regularPrice={props.regularPrice}
            setRegularPrice={props.setRegularPrice}
            incrementValue={props.incrementValue}
            decrementValue={props.decrementValue}
            setGuestCapacity={props.setGuestCapacity}
            setNumberOfRooms={props.setNumberOfRooms}
            setNumberOfBeds={props.setNumberOfBeds}
            setNumberOfBathrooms={props.setNumberOfBathrooms}
            entireStayRules={props.entireStayRules}
            addEntireStayRule={props.addEntireStayRule}
            removeEntireStayRule={props.removeEntireStayRule}
            updateEntireStayRule={props.updateEntireStayRule}
            coverImage={props.coverImage}
            handleCoverImageUpload={props.handleCoverImageUpload}
            removeCoverImage={props.removeCoverImage}
            renderImageSrc={props.renderImageSrc}
            entireStayImages={props.entireStayImages}
            setEntireStayImages={props.setEntireStayImages}
            removeEntireStayImage={props.removeEntireStayImage}
            sliderRef={props.sliderRef}
            errors={props.errors}
            clearError={props.clearError}
          />
        )}

        {stayType === "individual" && (
          <IndividualRoomForm
            rooms={props.rooms}
            expandedRoom={props.expandedRoom}
            setExpandedRoom={props.setExpandedRoom}
            addRoom={props.addRoom}
            removeRoom={props.removeRoom}
            updateRoom={props.updateRoom}
            coverImage={props.coverImage}
            handleCoverImageUpload={props.handleCoverImageUpload}
            removeCoverImage={props.removeCoverImage}
            renderImageSrc={props.renderImageSrc}
            handleRoomImageUpload={props.handleRoomImageUpload}
            removeRoomImage={props.removeRoomImage}
            roomRules={props.roomRules}
            addRoomRule={props.addRoomRule}
            removeRoomRule={props.removeRoomRule}
            updateRoomRule={props.updateRoomRule}
            errors={props.errors}
            clearError={props.clearError}
          />
        )}
      </div>
    </div>
  );
};

export default StayDetailsStep;
