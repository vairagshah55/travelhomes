import React from "react";
import { Plus, Minus, X, ChevronDown, ChevronUp, ImagePlus, IndianRupee, Users, BedDouble, Bath } from "lucide-react";

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
const GREEN      = "#22c55e";

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

interface IndividualRoomFormProps {
  rooms: Room[];
  expandedRoom: string;
  setExpandedRoom: (id: string) => void;
  addRoom: () => void;
  removeRoom: () => void;
  updateRoom: (id: string, field: keyof Room, value: any) => void;
  coverImage: string | null;
  handleCoverImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeCoverImage: () => void;
  renderImageSrc: (src: string | null) => string;
  handleRoomImageUpload: (event: React.ChangeEvent<HTMLInputElement>, roomId: string) => void;
  removeRoomImage: (roomId: string, index: number) => void;
  roomRules: Record<string, string[]>;
  addRoomRule: (roomId: string) => void;
  removeRoomRule: (roomId: string, index: number) => void;
  updateRoomRule: (roomId: string, index: number, value: string) => void;
  errors: Record<string, string>;
  clearError: (field: string) => void;
}

const MIN_PHOTOS = 5;

/* ─── Counter row ────────────────────────────────────────────────────────── */
const RoomCounter = ({
  icon, label, value, onDecrement, onIncrement,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "10px 0",
    }}
  >
    <div className="flex items-center gap-2.5">
      <span style={{ color: GRAY_400 }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 500, color: GRAY_500 }}>{label}</span>
    </div>
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onDecrement}
        style={{
          width: 28, height: 28, borderRadius: "50%",
          border: `1.5px solid ${GRAY_200}`, backgroundColor: WHITE,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", transition: "all 0.15s",
        }}
      >
        <Minus size={11} color={GRAY_400} />
      </button>
      <span style={{ fontSize: 14, fontWeight: 700, color: BLACK, minWidth: 22, textAlign: "center" as const }}>{value}</span>
      <button
        type="button"
        onClick={onIncrement}
        style={{
          width: 28, height: 28, borderRadius: "50%",
          border: `1.5px solid ${GRAY_200}`, backgroundColor: WHITE,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", transition: "all 0.15s",
        }}
      >
        <Plus size={11} color={GRAY_400} />
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

const isRoomComplete = (room: Room, index: number, errors: Record<string, string>): boolean => {
  return !!(
    room.name?.trim() &&
    room.description?.trim() &&
    room.guestCapacity > 0 &&
    room.beds > 0 &&
    room.bathrooms > 0 &&
    room.price > 0 &&
    (room.photos || []).length >= MIN_PHOTOS &&
    !errors[`room_${index}_name`] &&
    !errors[`room_${index}_description`] &&
    !errors[`room_${index}_photos`] &&
    !errors[`room_${index}_price`]
  );
};

/* ─── Main component ──────────────────────────────────────────────────────── */
const IndividualRoomForm: React.FC<IndividualRoomFormProps> = ({
  rooms, expandedRoom, setExpandedRoom, addRoom, removeRoom, updateRoom,
  coverImage, handleCoverImageUpload, removeCoverImage, renderImageSrc,
  handleRoomImageUpload, removeRoomImage,
  roomRules, addRoomRule, removeRoomRule, updateRoomRule,
  errors, clearError,
}) => {
  return (
    <div className="flex flex-col gap-4 w-full">

      {/* ── Cover Photo ── */}
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
            <ImagePlus size={16} color={TEAL} strokeWidth={2.5} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: BLACK, letterSpacing: "-0.01em" }}>Property Cover Photo</p>
            <p style={{ fontSize: 11, color: GRAY_400, marginTop: 1 }}>Shown as the main property image</p>
          </div>
          {errors.coverImage && <span style={{ fontSize: 11, fontWeight: 600, color: ERROR }}>{errors.coverImage}</span>}
        </div>

        <div
          style={{
            position: "relative",
            width: "100%",
            height: 190,
            borderRadius: 16,
            overflow: "hidden",
            border: `2px solid ${errors.coverImage ? "#fca5a5" : GRAY_200}`,
            boxShadow: errors.coverImage ? `0 0 0 3px ${ERROR_RING}` : "none",
          }}
        >
          {coverImage ? (
            <>
              <img src={renderImageSrc(coverImage)} alt="Cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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
                <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleCoverImageUpload} />
              </label>
            </>
          ) : (
            <label
              style={{
                width: "100%", height: "100%",
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 10,
                cursor: "pointer", backgroundColor: SURFACE, transition: "background-color 0.15s",
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
                <p style={{ fontSize: 11, color: GRAY_400, marginTop: 2 }}>Shown as the main property image</p>
              </div>
              <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleCoverImageUpload} />
            </label>
          )}
        </div>
      </div>

      {/* ── Room count control ── */}
      <div
        style={{
          backgroundColor: WHITE,
          border: "1.5px solid #EBEBEB",
          borderRadius: 20,
          padding: "16px 22px",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: BLACK }}>Rooms</p>
          <p style={{ fontSize: 11, color: GRAY_400, marginTop: 1 }}>Configure each room individually</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={removeRoom}
            style={{
              width: 30, height: 30, borderRadius: "50%",
              border: `1.5px solid ${GRAY_200}`, backgroundColor: WHITE,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <Minus size={12} color={GRAY_400} />
          </button>
          <span style={{ fontSize: 15, fontWeight: 700, color: BLACK, minWidth: 24, textAlign: "center" as const }}>{rooms.length}</span>
          <button
            type="button"
            onClick={addRoom}
            style={{
              width: 30, height: 30, borderRadius: "50%",
              border: `1.5px solid ${GRAY_200}`, backgroundColor: WHITE,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <Plus size={12} color={GRAY_400} />
          </button>
        </div>
      </div>

      {/* ── Room cards ── */}
      {rooms.map((room, index) => {
        const isExpanded = expandedRoom === room.id;
        const isComplete = isRoomComplete(room, index, errors);
        const photoCount = (room.photos || []).length;
        const hasError = Object.keys(errors).some(k => k.startsWith(`room_${index}_`));

        return (
          <div
            key={room.id}
            style={{
              backgroundColor: WHITE,
              border: `1.5px solid ${hasError ? "#fca5a5" : isComplete ? "#86efac" : "#EBEBEB"}`,
              borderRadius: 20,
              overflow: "hidden",
              boxShadow: hasError
                ? `0 0 0 3px ${ERROR_RING}`
                : isComplete
                ? "0 0 0 3px rgba(34,197,94,0.1)"
                : "0 2px 12px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.03)",
              transition: "all 0.2s",
            }}
          >
            {/* Card header */}
            <button
              type="button"
              onClick={() => setExpandedRoom(isExpanded ? "" : room.id)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 20px",
                backgroundColor: WHITE,
                border: "none",
                cursor: "pointer",
                transition: "background-color 0.15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = SURFACE; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = WHITE; }}
            >
              <div className="flex items-center gap-3">
                {isComplete ? (
                  <div
                    style={{
                      width: 20, height: 20, borderRadius: "50%",
                      backgroundColor: GREEN,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                ) : (
                  <div
                    style={{
                      width: 20, height: 20, borderRadius: "50%",
                      border: `2px solid ${hasError ? "#fca5a5" : GRAY_200}`,
                      flexShrink: 0,
                    }}
                  />
                )}
                <div style={{ textAlign: "left" }}>
                  <p style={{ fontSize: 13, fontWeight: 700, color: BLACK }}>
                    {room.name?.trim() || `Room ${index + 1}`}
                  </p>
                  <p style={{ fontSize: 11, color: isComplete ? GREEN : hasError ? ERROR : GRAY_400, marginTop: 2 }}>
                    {isComplete
                      ? `${room.guestCapacity} guests · ${room.beds} beds · \u20B9${room.price}/night`
                      : hasError
                      ? "Needs attention"
                      : `${photoCount}/${MIN_PHOTOS} photos · fill in details`}
                  </p>
                </div>
              </div>
              {isExpanded
                ? <ChevronUp size={16} color={GRAY_400} />
                : <ChevronDown size={16} color={GRAY_400} />}
            </button>

            {/* Expanded body */}
            {isExpanded && (
              <div style={{ padding: "0 20px 20px", borderTop: `1.5px solid ${GRAY_200}` }}>
                <div className="flex flex-col gap-5" style={{ paddingTop: 18 }}>

                  {/* Name */}
                  <div className="flex flex-col gap-1.5">
                    <label style={{ fontSize: 12, fontWeight: 600, color: errors[`room_${index}_name`] ? ERROR : GRAY_500, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                      Room Name <span style={{ color: ERROR }}>*</span>
                    </label>
                    <input
                      placeholder="e.g. Master Bedroom, Deluxe Suite\u2026"
                      value={room.name}
                      onChange={(e) => { updateRoom(room.id, "name", e.target.value); clearError(`room_${index}_name`); }}
                      style={{
                        width: "100%", height: 48, padding: "0 14px",
                        fontSize: 14, color: BLACK, fontWeight: 450,
                        backgroundColor: errors[`room_${index}_name`] ? ERROR_BG : SURFACE,
                        border: `1.5px solid ${errors[`room_${index}_name`] ? "#fca5a5" : "transparent"}`,
                        borderRadius: 13, outline: "none",
                        transition: "all 0.15s",
                      }}
                      onFocus={(e) => { e.target.style.borderColor = TEAL; e.target.style.backgroundColor = WHITE; e.target.style.boxShadow = `0 0 0 4px ${TEAL_FOCUS}`; }}
                      onBlur={(e) => { e.target.style.borderColor = errors[`room_${index}_name`] ? "#fca5a5" : "transparent"; e.target.style.backgroundColor = errors[`room_${index}_name`] ? ERROR_BG : SURFACE; e.target.style.boxShadow = "none"; }}
                    />
                    <ErrorMsg message={errors[`room_${index}_name`]} />
                  </div>

                  {/* Description */}
                  <div className="flex flex-col gap-1.5">
                    <label style={{ fontSize: 12, fontWeight: 600, color: errors[`room_${index}_description`] ? ERROR : GRAY_500, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                      Description <span style={{ color: ERROR }}>*</span>
                    </label>
                    <textarea
                      placeholder="Describe the room \u2014 size, view, unique features\u2026"
                      maxLength={200}
                      value={room.description}
                      onChange={(e) => { updateRoom(room.id, "description", e.target.value); clearError(`room_${index}_description`); }}
                      style={{
                        width: "100%", minHeight: 88, padding: "12px 14px",
                        fontSize: 14, color: BLACK, fontWeight: 450,
                        backgroundColor: errors[`room_${index}_description`] ? ERROR_BG : SURFACE,
                        border: `1.5px solid ${errors[`room_${index}_description`] ? "#fca5a5" : "transparent"}`,
                        borderRadius: 13, outline: "none", resize: "none",
                        transition: "all 0.15s",
                      }}
                      onFocus={(e) => { e.target.style.borderColor = TEAL; e.target.style.backgroundColor = WHITE; e.target.style.boxShadow = `0 0 0 4px ${TEAL_FOCUS}`; }}
                      onBlur={(e) => { e.target.style.borderColor = errors[`room_${index}_description`] ? "#fca5a5" : "transparent"; e.target.style.backgroundColor = errors[`room_${index}_description`] ? ERROR_BG : SURFACE; e.target.style.boxShadow = "none"; }}
                    />
                    <div className="flex justify-between">
                      <ErrorMsg message={errors[`room_${index}_description`]} />
                      <p style={{ fontSize: 11, color: GRAY_400 }}>{room.description?.length || 0}/200</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div
                    style={{
                      borderRadius: 13,
                      border: `1.5px solid ${GRAY_200}`,
                      padding: "4px 14px",
                      backgroundColor: SURFACE,
                    }}
                  >
                    <RoomCounter icon={<Users size={14} />} label="Guest Capacity" value={room.guestCapacity}
                      onDecrement={() => updateRoom(room.id, "guestCapacity", Math.max(1, room.guestCapacity - 1))}
                      onIncrement={() => updateRoom(room.id, "guestCapacity", room.guestCapacity + 1)} />
                    <div style={{ height: 1, backgroundColor: GRAY_200 }} />
                    <RoomCounter icon={<BedDouble size={14} />} label="Beds" value={room.beds}
                      onDecrement={() => updateRoom(room.id, "beds", Math.max(1, room.beds - 1))}
                      onIncrement={() => updateRoom(room.id, "beds", room.beds + 1)} />
                    <div style={{ height: 1, backgroundColor: GRAY_200 }} />
                    <RoomCounter icon={<Bath size={14} />} label="Bathrooms" value={room.bathrooms}
                      onDecrement={() => updateRoom(room.id, "bathrooms", Math.max(1, room.bathrooms - 1))}
                      onIncrement={() => updateRoom(room.id, "bathrooms", room.bathrooms + 1)} />
                  </div>

                  {/* Price */}
                  <div className="flex flex-col gap-1.5">
                    <label style={{ fontSize: 12, fontWeight: 600, color: errors[`room_${index}_price`] ? ERROR : GRAY_500, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                      Price per Night <span style={{ color: ERROR }}>*</span>
                    </label>
                    <div
                      style={{
                        display: "flex", alignItems: "center",
                        borderRadius: 13, overflow: "hidden",
                        border: `1.5px solid ${errors[`room_${index}_price`] ? "#fca5a5" : "transparent"}`,
                        backgroundColor: errors[`room_${index}_price`] ? ERROR_BG : SURFACE,
                        boxShadow: errors[`room_${index}_price`] ? `0 0 0 3px ${ERROR_RING}` : "none",
                        transition: "all 0.15s",
                      }}
                    >
                      <div
                        style={{
                          display: "flex", alignItems: "center",
                          padding: "0 12px", height: 48,
                          borderRight: `1.5px solid ${GRAY_200}`,
                          backgroundColor: SURFACE, flexShrink: 0,
                        }}
                      >
                        <IndianRupee size={13} color={GRAY_400} />
                      </div>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={room.price || ""}
                        onChange={(e) => { updateRoom(room.id, "price", Number(e.target.value)); clearError(`room_${index}_price`); }}
                        style={{
                          flex: 1, height: 48, padding: "0 14px",
                          fontSize: 14, fontWeight: 600, color: BLACK,
                          backgroundColor: "transparent", border: "none", outline: "none",
                        }}
                      />
                    </div>
                    <ErrorMsg message={errors[`room_${index}_price`]} />
                  </div>

                  {/* Room Photos */}
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <label style={{ fontSize: 12, fontWeight: 600, color: errors[`room_${index}_photos`] ? ERROR : GRAY_500, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                        Photos <span style={{ color: ERROR }}>*</span>
                      </label>
                      <span
                        style={{
                          fontSize: 11, fontWeight: 700,
                          color: photoCount >= MIN_PHOTOS ? GREEN : errors[`room_${index}_photos`] ? ERROR : GRAY_400,
                        }}
                      >
                        {photoCount}/{MIN_PHOTOS} required
                      </span>
                    </div>

                    {/* Progress */}
                    <div style={{ width: "100%", height: 3, backgroundColor: SURFACE, borderRadius: 99, overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%", borderRadius: 99,
                          width: `${(Math.min(photoCount, MIN_PHOTOS) / MIN_PHOTOS) * 100}%`,
                          backgroundColor: photoCount >= MIN_PHOTOS ? GREEN : TEAL,
                          transition: "width 0.4s ease",
                        }}
                      />
                    </div>

                    <label
                      style={{
                        display: "flex", height: 72,
                        alignItems: "center", justifyContent: "center", gap: 10,
                        borderRadius: 13,
                        border: `2px dashed ${errors[`room_${index}_photos`] ? "#fca5a5" : GRAY_200}`,
                        backgroundColor: errors[`room_${index}_photos`] ? ERROR_BG : SURFACE,
                        cursor: "pointer", transition: "all 0.15s",
                      }}
                    >
                      <ImagePlus size={16} color={errors[`room_${index}_photos`] ? ERROR : GRAY_400} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: errors[`room_${index}_photos`] ? ERROR : GRAY_500 }}>
                        {errors[`room_${index}_photos`] || "Add room photos"}
                      </span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg"
                        multiple
                        className="hidden"
                        onChange={(e) => { handleRoomImageUpload(e, room.id); clearError(`room_${index}_photos`); }}
                      />
                    </label>

                    {photoCount > 0 && (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {room.photos.map((photo, photoIndex) => (
                          <div
                            key={photoIndex}
                            style={{
                              position: "relative",
                              aspectRatio: "1",
                              borderRadius: 10,
                              overflow: "hidden",
                              border: `1.5px solid ${GRAY_200}`,
                            }}
                            className="group"
                          >
                            <img src={renderImageSrc(photo)} alt={`Room photo ${photoIndex + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            {photoIndex < MIN_PHOTOS && (
                              <div
                                style={{
                                  position: "absolute", top: 4, left: 4,
                                  width: 14, height: 14, borderRadius: "50%",
                                  backgroundColor: GREEN,
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                }}
                              >
                                <svg width="7" height="7" viewBox="0 0 12 12" fill="none">
                                  <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              </div>
                            )}
                            <button
                              onClick={() => removeRoomImage(room.id, photoIndex)}
                              style={{
                                position: "absolute", top: 4, right: 4,
                                width: 18, height: 18, borderRadius: "50%",
                                backgroundColor: "rgba(0,0,0,0.55)", border: "none",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                cursor: "pointer", opacity: 0, transition: "opacity 0.15s",
                              }}
                              className="group-hover:!opacity-100"
                            >
                              <X size={9} color="white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Rules */}
                  <div className="flex flex-col gap-2.5">
                    <label style={{ fontSize: 12, fontWeight: 600, color: GRAY_500, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                      Room Rules
                    </label>
                    {(roomRules[room.id] || [""]).map((rule, ruleIndex) => (
                      <div key={ruleIndex} className="flex items-center gap-2">
                        <div
                          style={{
                            width: 22, height: 22, borderRadius: "50%",
                            backgroundColor: SURFACE, border: `1.5px solid ${GRAY_200}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <span style={{ fontSize: 9, fontWeight: 700, color: GRAY_400 }}>{ruleIndex + 1}</span>
                        </div>
                        <input
                          placeholder="Add a rule\u2026"
                          value={rule}
                          onChange={(e) => updateRoomRule(room.id, ruleIndex, e.target.value)}
                          style={{
                            flex: 1, height: 40, padding: "0 12px",
                            fontSize: 13, color: BLACK, fontWeight: 450,
                            backgroundColor: SURFACE,
                            border: "1.5px solid transparent",
                            borderRadius: 11, outline: "none",
                            transition: "all 0.15s",
                          }}
                          onFocus={(e) => { e.target.style.borderColor = TEAL; e.target.style.backgroundColor = WHITE; e.target.style.boxShadow = `0 0 0 4px ${TEAL_FOCUS}`; }}
                          onBlur={(e) => { e.target.style.borderColor = "transparent"; e.target.style.backgroundColor = SURFACE; e.target.style.boxShadow = "none"; }}
                        />
                        <button
                          type="button"
                          onClick={() => removeRoomRule(room.id, ruleIndex)}
                          style={{
                            width: 26, height: 26, borderRadius: "50%",
                            backgroundColor: "transparent", border: "none",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer", flexShrink: 0,
                          }}
                        >
                          <X size={12} color={GRAY_400} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addRoomRule(room.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        fontSize: 12, fontWeight: 700, color: TEAL,
                        backgroundColor: "transparent", border: "none",
                        cursor: "pointer", paddingLeft: 30,
                      }}
                    >
                      <Plus size={11} />
                      Add rule
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Add room CTA */}
      <button
        type="button"
        onClick={addRoom}
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          width: "100%", padding: "14px 0",
          borderRadius: 16,
          border: `2px dashed ${GRAY_200}`,
          backgroundColor: "transparent",
          fontSize: 13, fontWeight: 700, color: TEAL,
          cursor: "pointer", transition: "all 0.15s",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = TEAL; (e.currentTarget as HTMLButtonElement).style.backgroundColor = TEAL_BG; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = GRAY_200; (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent"; }}
      >
        <Plus size={15} />
        Add another room
      </button>
    </div>
  );
};

export default IndividualRoomForm;
