import React from "react";
import {
  Plus,
  Minus,
  X,
  ChevronDown,
  ChevronUp,
  ImagePlus,
  IndianRupee,
  Users,
  BedDouble,
  Bath,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  icon,
  label,
  value,
  onDecrement,
  onIncrement,
  required,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  // validateStaysStep requires each of these to be >= 1. Marked per row because
  // the enclosing "Stats" block has no heading to carry a section-level
  // asterisk, unlike EntireStayForm's "Property Details" card.
  required?: boolean;
}) => (
  <div className="flex items-center justify-between py-2.5">
    <div className="flex items-center gap-2.5">
      <span className="text-th-warm-text-muted">{icon}</span>
      <span className="text-[13px] font-medium text-th-warm-text-dark">
        {label}
        {required && (
          <>
            <span aria-hidden="true" className="text-th-error-bright ml-[3px]">
              *
            </span>
            <span className="sr-only"> (required)</span>
          </>
        )}
      </span>
    </div>
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onDecrement}
        className="w-7 h-7 rounded-full border-[1.5px] border-th-warm-border bg-th-surface-0 flex items-center justify-center cursor-pointer transition-all duration-150"
      >
        <Minus size={11} className="text-th-warm-text-muted" />
      </button>
      <span className="text-[14px] font-bold text-th-text-primary min-w-[22px] text-center">
        {isFinite(value) ? value : 0}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        className="w-7 h-7 rounded-full border-[1.5px] border-th-warm-border bg-th-surface-0 flex items-center justify-center cursor-pointer transition-all duration-150"
      >
        <Plus size={11} className="text-th-warm-text-muted" />
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
  rooms,
  expandedRoom,
  setExpandedRoom,
  addRoom,
  removeRoom,
  updateRoom,
  coverImage,
  handleCoverImageUpload,
  removeCoverImage,
  renderImageSrc,
  handleRoomImageUpload,
  removeRoomImage,
  roomRules,
  addRoomRule,
  removeRoomRule,
  updateRoomRule,
  errors,
  clearError,
}) => {
  return (
    <div className="flex flex-col gap-4 w-full">
      {/* ── Cover Photo ── */}
      <div className="bg-th-surface-0 border-[1.5px] border-[#EBEBEB] rounded-[20px] p-[20px_22px_22px] shadow-[0_2px_12px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-[11px] bg-th-brand-soft border-[1.5px] border-th-brand-border-soft flex items-center justify-center shrink-0 text-th-brand">
            <ImagePlus size={16} strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-bold text-th-text-primary tracking-[-0.01em]">
              Property Cover Photo
            </p>
            <p className="text-[11px] text-th-warm-text-muted mt-[1px]">
              Shown as the main property image
            </p>
          </div>
          {errors.coverImage && (
            <span className="text-[11px] font-semibold text-th-error-bright">
              {errors.coverImage}
            </span>
          )}
        </div>

        <div
          className={cn(
            "relative w-full h-[190px] rounded-[16px] overflow-hidden border-2",
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
                  onChange={handleCoverImageUpload}
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
                  Shown as the main property image
                </p>
              </div>
              <input
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={handleCoverImageUpload}
              />
            </label>
          )}
        </div>
      </div>

      {/* ── Room count control ── */}
      <div className="bg-th-surface-0 border-[1.5px] border-[#EBEBEB] rounded-[20px] px-[22px] py-4 shadow-[0_2px_12px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.03)] flex items-center justify-between">
        <div>
          <p className="text-[13px] font-bold text-th-text-primary">Rooms</p>
          <p className="text-[11px] text-th-warm-text-muted mt-[1px]">
            Configure each room individually
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={removeRoom}
            className="w-[30px] h-[30px] rounded-full border-[1.5px] border-th-warm-border bg-th-surface-0 flex items-center justify-center cursor-pointer"
          >
            <Minus size={12} className="text-th-warm-text-muted" />
          </button>
          <span className="text-[15px] font-bold text-th-text-primary min-w-6 text-center">
            {rooms.length}
          </span>
          <button
            type="button"
            onClick={addRoom}
            className="w-[30px] h-[30px] rounded-full border-[1.5px] border-th-warm-border bg-th-surface-0 flex items-center justify-center cursor-pointer"
          >
            <Plus size={12} className="text-th-warm-text-muted" />
          </button>
        </div>
      </div>

      {/* ── Room cards ── */}
      {rooms.map((room, index) => {
        const isExpanded = expandedRoom === room.id;
        const isComplete = isRoomComplete(room, index, errors);
        const photoCount = (room.photos || []).length;
        const hasError = Object.keys(errors).some((k) => k.startsWith(`room_${index}_`));

        return (
          <div
            key={room.id}
            className={cn(
              "bg-th-surface-0 rounded-[20px] overflow-hidden transition-all duration-200",
              hasError
                ? "border-[1.5px] border-th-error-bright-soft shadow-[0_0_0_3px_var(--th-error-bright-ring)]"
                : isComplete
                  ? "border-[1.5px] border-[#86efac] shadow-[0_0_0_3px_rgba(34,197,94,0.1)]"
                  : "border-[1.5px] border-th-warm-border shadow-[0_2px_12px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.03)]",
            )}
          >
            {/* Card header */}
            <button
              type="button"
              onClick={() => setExpandedRoom(isExpanded ? "" : room.id)}
              className="w-full flex items-center justify-between px-5 py-4 bg-th-surface-0 border-none cursor-pointer transition-colors duration-150 hover:bg-th-warm-surface"
            >
              <div className="flex items-center gap-3">
                {isComplete ? (
                  <div className="w-5 h-5 rounded-full bg-th-success-bright flex items-center justify-center shrink-0">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path
                        d="M2 5l2.5 2.5L8 3"
                        stroke="white"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                ) : (
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border-2 shrink-0",
                      hasError ? "border-th-error-bright-soft" : "border-th-warm-border",
                    )}
                  />
                )}
                <div className="text-left">
                  <p className="text-[13px] font-bold text-th-text-primary">
                    {room.name?.trim() || `Room ${index + 1}`}
                  </p>
                  <p
                    className={cn(
                      "text-[11px] mt-0.5",
                      isComplete
                        ? "text-th-success-bright"
                        : hasError
                          ? "text-th-error-bright"
                          : "text-th-warm-text-muted",
                    )}
                  >
                    {isComplete
                      ? `${room.guestCapacity} guests · ${room.beds} beds · ₹${room.price}/night`
                      : hasError
                        ? "Needs attention"
                        : `${photoCount}/${MIN_PHOTOS} photos · fill in details`}
                  </p>
                </div>
              </div>
              {isExpanded ? (
                <ChevronUp size={16} className="text-th-warm-text-muted" />
              ) : (
                <ChevronDown size={16} className="text-th-warm-text-muted" />
              )}
            </button>

            {/* Expanded body */}
            {isExpanded && (
              <div className="px-5 pb-5 border-t-[1.5px] border-th-warm-border">
                <div className="flex flex-col gap-5 pt-[18px]">
                  {/* Name */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      className={cn(
                        "text-[12px] font-semibold uppercase tracking-[0.03em]",
                        errors[`room_${index}_name`]
                          ? "text-th-error-bright"
                          : "text-th-warm-text-dark",
                      )}
                    >
                      Room Name <span className="text-th-error-bright">*</span>
                    </label>
                    <input
                      placeholder="e.g. Master Bedroom, Deluxe Suite…"
                      value={room.name}
                      onChange={(e) => {
                        updateRoom(room.id, "name", e.target.value);
                        clearError(`room_${index}_name`);
                      }}
                      className={cn(
                        "w-full h-12 px-[14px] text-[14px] text-th-text-primary font-[450] rounded-[13px] outline-none transition-all duration-150",
                        "focus:border-th-brand focus:bg-th-surface-0 focus:shadow-[0_0_0_4px_var(--th-ring)]",
                        errors[`room_${index}_name`]
                          ? "bg-th-error-bright-bg border-[1.5px] border-th-error-bright-soft"
                          : "bg-th-surface-0 border-[1.5px] border-th-warm-border-strong hover:border-[color:var(--onb-border-hover,#a9c5c2)]",
                      )}
                    />
                    <ErrorMsg message={errors[`room_${index}_name`]} />
                  </div>

                  {/* Description */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      className={cn(
                        "text-[12px] font-semibold uppercase tracking-[0.03em]",
                        errors[`room_${index}_description`]
                          ? "text-th-error-bright"
                          : "text-th-warm-text-dark",
                      )}
                    >
                      Description <span className="text-th-error-bright">*</span>
                    </label>
                    <textarea
                      placeholder="Describe the room — size, view, unique features…"
                      maxLength={200}
                      value={room.description}
                      onChange={(e) => {
                        updateRoom(room.id, "description", e.target.value);
                        clearError(`room_${index}_description`);
                      }}
                      className={cn(
                        "w-full min-h-[88px] px-[14px] py-3 text-[14px] text-th-text-primary font-[450] rounded-[13px] outline-none resize-none transition-all duration-150",
                        "focus:border-th-brand focus:bg-th-surface-0 focus:shadow-[0_0_0_4px_var(--th-ring)]",
                        errors[`room_${index}_description`]
                          ? "bg-th-error-bright-bg border-[1.5px] border-th-error-bright-soft"
                          : "bg-th-surface-0 border-[1.5px] border-th-warm-border-strong hover:border-[color:var(--onb-border-hover,#a9c5c2)]",
                      )}
                    />
                    <div className="flex justify-between">
                      <ErrorMsg message={errors[`room_${index}_description`]} />
                      <p className="text-[11px] text-th-warm-text-muted">
                        {room.description?.length || 0}/200
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="rounded-[13px] border-[1.5px] border-th-warm-border px-[14px] py-1 bg-th-warm-surface">
                    <RoomCounter
                      icon={<Users size={14} />}
                      label="Guest Capacity"
                      required
                      value={room.guestCapacity}
                      onDecrement={() =>
                        updateRoom(
                          room.id,
                          "guestCapacity",
                          Math.max(1, (isFinite(room.guestCapacity) ? room.guestCapacity : 1) - 1),
                        )
                      }
                      onIncrement={() =>
                        updateRoom(
                          room.id,
                          "guestCapacity",
                          (isFinite(room.guestCapacity) ? room.guestCapacity : 0) + 1,
                        )
                      }
                    />
                    <div className="h-px bg-th-warm-border" />
                    <RoomCounter
                      icon={<BedDouble size={14} />}
                      label="Beds"
                      required
                      value={room.beds}
                      onDecrement={() =>
                        updateRoom(
                          room.id,
                          "beds",
                          Math.max(1, (isFinite(room.beds) ? room.beds : 1) - 1),
                        )
                      }
                      onIncrement={() =>
                        updateRoom(room.id, "beds", (isFinite(room.beds) ? room.beds : 0) + 1)
                      }
                    />
                    <div className="h-px bg-th-warm-border" />
                    <RoomCounter
                      icon={<Bath size={14} />}
                      label="Bathrooms"
                      required
                      value={room.bathrooms}
                      onDecrement={() =>
                        updateRoom(
                          room.id,
                          "bathrooms",
                          Math.max(1, (isFinite(room.bathrooms) ? room.bathrooms : 1) - 1),
                        )
                      }
                      onIncrement={() =>
                        updateRoom(
                          room.id,
                          "bathrooms",
                          (isFinite(room.bathrooms) ? room.bathrooms : 0) + 1,
                        )
                      }
                    />
                  </div>

                  {/* Price */}
                  <div className="flex flex-col gap-1.5">
                    <label
                      className={cn(
                        "text-[12px] font-semibold uppercase tracking-[0.03em]",
                        errors[`room_${index}_price`]
                          ? "text-th-error-bright"
                          : "text-th-warm-text-dark",
                      )}
                    >
                      Price per Night <span className="text-th-error-bright">*</span>
                    </label>
                    <div
                      className={cn(
                        "flex items-center rounded-[13px] overflow-hidden border-[1.5px] transition-all duration-150",
                        errors[`room_${index}_price`]
                          ? "border-th-error-bright-soft bg-th-error-bright-bg shadow-[0_0_0_3px_var(--th-error-bright-ring)]"
                          : "border-th-warm-border-strong bg-th-surface-0 hover:border-[color:var(--onb-border-hover,#a9c5c2)]",
                      )}
                    >
                      <div className="flex items-center px-3 h-12 border-r-[1.5px] border-th-warm-border bg-th-surface-0 shrink-0">
                        <IndianRupee size={13} className="text-th-warm-text-muted" />
                      </div>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={room.price || ""}
                        onChange={(e) => {
                          updateRoom(room.id, "price", Number(e.target.value));
                          clearError(`room_${index}_price`);
                        }}
                        className="flex-1 h-12 px-[14px] text-[14px] font-semibold text-th-text-primary bg-transparent border-none outline-none"
                      />
                    </div>
                    <ErrorMsg message={errors[`room_${index}_price`]} />
                  </div>

                  {/* Room Photos */}
                  <div className="flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <label
                        className={cn(
                          "text-[12px] font-semibold uppercase tracking-[0.03em]",
                          errors[`room_${index}_photos`]
                            ? "text-th-error-bright"
                            : "text-th-warm-text-dark",
                        )}
                      >
                        Photos <span className="text-th-error-bright">*</span>
                      </label>
                      <span
                        className={cn(
                          "text-[11px] font-bold",
                          photoCount >= MIN_PHOTOS
                            ? "text-th-success-bright"
                            : errors[`room_${index}_photos`]
                              ? "text-th-error-bright"
                              : "text-th-warm-text-muted",
                        )}
                      >
                        {photoCount}/{MIN_PHOTOS} required
                      </span>
                    </div>

                    {/* Progress */}
                    <div className="w-full h-[3px] bg-th-warm-surface rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-[width] [transition-duration:400ms] ease-out",
                          photoCount >= MIN_PHOTOS ? "bg-th-success-bright" : "bg-th-brand",
                        )}
                        style={{
                          width: `${(Math.min(photoCount, MIN_PHOTOS) / MIN_PHOTOS) * 100}%`,
                        }}
                      />
                    </div>

                    <label
                      className={cn(
                        "flex h-[72px] items-center justify-center gap-2.5 rounded-[13px] border-2 border-dashed cursor-pointer transition-all duration-150",
                        errors[`room_${index}_photos`]
                          ? "border-th-error-bright-soft bg-th-error-bright-bg"
                          : "border-th-warm-border bg-th-warm-surface",
                      )}
                    >
                      <ImagePlus
                        size={16}
                        className={
                          errors[`room_${index}_photos`]
                            ? "text-th-error-bright"
                            : "text-th-warm-text-muted"
                        }
                      />
                      <span
                        className={cn(
                          "text-[13px] font-semibold",
                          errors[`room_${index}_photos`]
                            ? "text-th-error-bright"
                            : "text-th-warm-text-dark",
                        )}
                      >
                        {errors[`room_${index}_photos`] || "Add room photos"}
                      </span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          handleRoomImageUpload(e, room.id);
                          clearError(`room_${index}_photos`);
                        }}
                      />
                    </label>

                    {photoCount > 0 && (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {room.photos.map((photo, photoIndex) => (
                          <div
                            key={photoIndex}
                            className="relative aspect-square rounded-[10px] overflow-hidden border-[1.5px] border-th-warm-border group"
                          >
                            <img
                              src={renderImageSrc(photo)}
                              alt={`Room photo ${photoIndex + 1}`}
                              className="w-full h-full object-cover"
                            />
                            {photoIndex < MIN_PHOTOS && (
                              <div className="absolute top-1 left-1 w-[14px] h-[14px] rounded-full bg-th-success-bright flex items-center justify-center">
                                <svg width="7" height="7" viewBox="0 0 12 12" fill="none">
                                  <path
                                    d="M2.5 6L5 8.5L9.5 3.5"
                                    stroke="white"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </div>
                            )}
                            <button
                              onClick={() => removeRoomImage(room.id, photoIndex)}
                              className="absolute top-1 right-1 w-[18px] h-[18px] rounded-full bg-black/55 border-none flex items-center justify-center cursor-pointer opacity-0 transition-opacity duration-150 group-hover:!opacity-100"
                            >
                              <X size={9} className="text-white" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Rules */}
                  <div className="flex flex-col gap-2.5">
                    <label className="text-[12px] font-semibold text-th-warm-text-dark uppercase tracking-[0.03em]">
                      Room Rules
                    </label>
                    {(roomRules[room.id] || [""]).map((rule, ruleIndex) => (
                      <div key={ruleIndex} className="flex items-center gap-2">
                        <div className="w-[22px] h-[22px] rounded-full bg-th-warm-surface border-[1.5px] border-th-warm-border flex items-center justify-center shrink-0">
                          <span className="text-[9px] font-bold text-th-warm-text-muted">
                            {ruleIndex + 1}
                          </span>
                        </div>
                        <input
                          placeholder="Add a rule…"
                          value={rule}
                          onChange={(e) => updateRoomRule(room.id, ruleIndex, e.target.value)}
                          className={cn(
                            "flex-1 h-10 px-3 text-[13px] text-th-text-primary font-[450] bg-th-surface-0 border-[1.5px] border-th-warm-border-strong hover:border-[color:var(--onb-border-hover,#a9c5c2)] rounded-[11px] outline-none transition-all duration-150",
                            "focus:border-th-brand focus:bg-th-surface-0 focus:shadow-[0_0_0_4px_var(--th-ring)]",
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => removeRoomRule(room.id, ruleIndex)}
                          className="w-[26px] h-[26px] rounded-full bg-transparent border-none flex items-center justify-center cursor-pointer shrink-0"
                        >
                          <X size={12} className="text-th-warm-text-muted" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addRoomRule(room.id)}
                      className="flex items-center gap-1.5 text-[12px] font-bold text-th-brand bg-transparent border-none cursor-pointer pl-[30px]"
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
        className="flex items-center justify-center gap-2 w-full py-[14px] rounded-[16px] border-2 border-dashed border-th-warm-border bg-transparent text-[13px] font-bold text-th-brand cursor-pointer transition-all duration-150 hover:border-th-brand hover:bg-th-brand-soft"
      >
        <Plus size={15} />
        Add another room
      </button>
    </div>
  );
};

export default IndividualRoomForm;
