import React from "react";
import { Plus, Minus, X, ChevronDown, ChevronUp, ImagePlus, IndianRupee, Users, BedDouble, Bath, CheckCircle2 } from "lucide-react";

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

const RoomCounter: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
}> = ({ icon, label, value, onDecrement, onIncrement }) => (
  <div className="flex items-center justify-between py-3">
    <div className="flex items-center gap-2.5">
      <span className="text-gray-400">{icon}</span>
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
    </div>
    <div className="flex items-center gap-3">
      <button type="button" onClick={onDecrement}
        className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 transition-all flex items-center justify-center">
        <Minus size={12} className="text-gray-500" />
      </button>
      <span className="text-sm font-bold text-black dark:text-white min-w-[24px] text-center tabular-nums">{value}</span>
      <button type="button" onClick={onIncrement}
        className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 transition-all flex items-center justify-center">
        <Plus size={12} className="text-gray-500" />
      </button>
    </div>
  </div>
);

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

const IndividualRoomForm: React.FC<IndividualRoomFormProps> = ({
  rooms, expandedRoom, setExpandedRoom, addRoom, removeRoom, updateRoom,
  coverImage, handleCoverImageUpload, removeCoverImage, renderImageSrc,
  handleRoomImageUpload, removeRoomImage,
  roomRules, addRoomRule, removeRoomRule, updateRoomRule,
  errors, clearError,
}) => {
  return (
    <div className="flex flex-col gap-4 w-full">

      {/* Cover Photo - shared across all rooms */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
          Property Cover Photo
        </p>
        <div className={`relative w-full h-48 rounded-2xl overflow-hidden border-2 transition-colors ${errors.coverImage ? "border-red-400" : "border-gray-200 dark:border-gray-700"}`}>
          {coverImage ? (
            <>
              <img src={renderImageSrc(coverImage)} alt="Cover" className="w-full h-full object-cover" />
              <button
                onClick={removeCoverImage}
                className="absolute top-3 right-3 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all active:scale-95"
              >
                <X size={14} className="text-gray-700" />
              </button>
              <label className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-white/90 hover:bg-white rounded-full text-xs font-semibold text-gray-700 cursor-pointer shadow transition-all">
                <ImagePlus size={12} />
                Change
                <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleCoverImageUpload} />
              </label>
            </>
          ) : (
            <label className="w-full h-full flex flex-col items-center justify-center gap-3 cursor-pointer bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group">
              <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center group-hover:border-gray-400 transition-colors shadow-sm">
                <ImagePlus size={20} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Upload cover photo</p>
                <p className="text-xs text-gray-400 mt-0.5">Shown as the main property image</p>
              </div>
              <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={handleCoverImageUpload} />
            </label>
          )}
        </div>
        {errors.coverImage && <p className="text-xs text-red-500 pl-1">{errors.coverImage}</p>}
      </div>

      {/* Room count control */}
      <div className="flex items-center justify-between py-1">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Rooms</p>
          <p className="text-xs text-gray-400 mt-0.5">Configure each room individually</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={removeRoom}
            className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 transition-all flex items-center justify-center">
            <Minus size={13} className="text-gray-500" />
          </button>
          <span className="text-sm font-bold text-black dark:text-white min-w-[24px] text-center">{rooms.length}</span>
          <button type="button" onClick={addRoom}
            className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 active:scale-95 transition-all flex items-center justify-center">
            <Plus size={13} className="text-gray-500" />
          </button>
        </div>
      </div>

      {/* Room cards */}
      {rooms.map((room, index) => {
        const isExpanded = expandedRoom === room.id;
        const isComplete = isRoomComplete(room, index, errors);
        const photoCount = (room.photos || []).length;
        const hasError = Object.keys(errors).some(k => k.startsWith(`room_${index}_`));

        return (
          <div key={room.id}
            className={`rounded-2xl border overflow-hidden transition-all duration-200 ${
              hasError ? "border-red-300 dark:border-red-800" :
              isComplete ? "border-green-200 dark:border-green-800" :
              "border-gray-200 dark:border-gray-700"
            }`}
          >
            {/* Card header */}
            <button
              type="button"
              onClick={() => setExpandedRoom(isExpanded ? "" : room.id)}
              className="w-full flex items-center justify-between px-5 py-4 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {isComplete ? (
                  <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" />
                ) : (
                  <div className={`w-[18px] h-[18px] rounded-full border-2 flex-shrink-0 ${hasError ? "border-red-400" : "border-gray-300 dark:border-gray-600"}`} />
                )}
                <div className="text-left">
                  <p className="text-sm font-semibold text-black dark:text-white">
                    {room.name?.trim() || `Room ${index + 1}`}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {isComplete
                      ? `${room.guestCapacity} guests · ${room.beds} beds · ₹${room.price}/night`
                      : hasError ? "Needs attention"
                      : `${photoCount}/${MIN_PHOTOS} photos · fill in details`}
                  </p>
                </div>
              </div>
              {isExpanded ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
            </button>

            {/* Expanded body */}
            {isExpanded && (
              <div className="px-5 pb-5 pt-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex flex-col gap-5">

                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Room Name</label>
                  <input
                    placeholder="e.g. Master Bedroom, Deluxe Suite..."
                    value={room.name}
                    onChange={(e) => { updateRoom(room.id, "name", e.target.value); clearError(`room_${index}_name`); }}
                    className={`h-10 px-3 rounded-xl border text-sm bg-white dark:bg-gray-900 dark:text-white outline-none transition-colors ${errors[`room_${index}_name`] ? "border-red-300 focus:border-red-400" : "border-gray-200 dark:border-gray-700 focus:border-black dark:focus:border-white"}`}
                  />
                  {errors[`room_${index}_name`] && <p className="text-xs text-red-500">{errors[`room_${index}_name`]}</p>}
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Description</label>
                  <textarea
                    placeholder="Describe the room — size, view, unique features..."
                    maxLength={200}
                    value={room.description}
                    onChange={(e) => { updateRoom(room.id, "description", e.target.value); clearError(`room_${index}_description`); }}
                    className={`min-h-[88px] px-3 py-2.5 rounded-xl border text-sm bg-white dark:bg-gray-900 dark:text-white outline-none resize-none transition-colors ${errors[`room_${index}_description`] ? "border-red-300 focus:border-red-400" : "border-gray-200 dark:border-gray-700 focus:border-black dark:focus:border-white"}`}
                  />
                  <div className="flex justify-between">
                    {errors[`room_${index}_description`]
                      ? <p className="text-xs text-red-500">{errors[`room_${index}_description`]}</p>
                      : <span />}
                    <p className="text-xs text-gray-400">{room.description?.length || 0}/200</p>
                  </div>
                </div>

                {/* Stats */}
                <div className="rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden divide-y divide-gray-100 dark:divide-gray-700">
                  <RoomCounter
                    icon={<Users size={14} />}
                    label="Guest Capacity"
                    value={room.guestCapacity}
                    onDecrement={() => updateRoom(room.id, "guestCapacity", Math.max(1, room.guestCapacity - 1))}
                    onIncrement={() => updateRoom(room.id, "guestCapacity", room.guestCapacity + 1)}
                  />
                  <RoomCounter
                    icon={<BedDouble size={14} />}
                    label="Beds"
                    value={room.beds}
                    onDecrement={() => updateRoom(room.id, "beds", Math.max(1, room.beds - 1))}
                    onIncrement={() => updateRoom(room.id, "beds", room.beds + 1)}
                  />
                  <RoomCounter
                    icon={<Bath size={14} />}
                    label="Bathrooms"
                    value={room.bathrooms}
                    onDecrement={() => updateRoom(room.id, "bathrooms", Math.max(1, room.bathrooms - 1))}
                    onIncrement={() => updateRoom(room.id, "bathrooms", room.bathrooms + 1)}
                  />
                </div>

                {/* Price */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Price per Night</label>
                  <div className={`flex items-center border rounded-xl overflow-hidden transition-colors ${errors[`room_${index}_price`] ? "border-red-400" : "border-gray-200 dark:border-gray-700 focus-within:border-black dark:focus-within:border-white"}`}>
                    <div className="flex items-center gap-1 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
                      <IndianRupee size={13} className="text-gray-400" />
                    </div>
                    <input
                      type="number"
                      placeholder="0.00"
                      value={room.price || ""}
                      onChange={(e) => { updateRoom(room.id, "price", Number(e.target.value)); clearError(`room_${index}_price`); }}
                      className="flex-1 px-3 py-2.5 text-sm font-medium bg-white dark:bg-gray-900 dark:text-white outline-none placeholder:text-gray-300"
                    />
                  </div>
                  {errors[`room_${index}_price`] && <p className="text-xs text-red-500">{errors[`room_${index}_price`]}</p>}
                </div>

                {/* Room Photos */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Photos</label>
                    <span className={`text-xs font-medium ${photoCount >= MIN_PHOTOS ? "text-green-600 dark:text-green-400" : errors[`room_${index}_photos`] ? "text-red-500" : "text-gray-400"}`}>
                      {photoCount}/{MIN_PHOTOS} required
                    </span>
                  </div>

                  {/* Progress */}
                  <div className="w-full h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(Math.min(photoCount, MIN_PHOTOS) / MIN_PHOTOS) * 100}%`,
                        backgroundColor: photoCount >= MIN_PHOTOS ? "#22c55e" : "var(--th-accent)",
                      }}
                    />
                  </div>

                  <label className={`flex h-20 items-center justify-center gap-2.5 rounded-xl border-2 border-dashed cursor-pointer transition-colors ${errors[`room_${index}_photos`] ? "border-red-300 bg-red-50 dark:bg-red-900/10" : "border-gray-200 dark:border-gray-700 hover:border-gray-400 bg-gray-50 dark:bg-gray-800/50"}`}>
                    <ImagePlus size={16} className={errors[`room_${index}_photos`] ? "text-red-400" : "text-gray-400"} />
                    <span className={`text-sm font-medium ${errors[`room_${index}_photos`] ? "text-red-500" : "text-gray-500 dark:text-gray-400"}`}>
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
                        <div key={photoIndex} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 group">
                          <img src={renderImageSrc(photo)} alt={`Room photo ${photoIndex + 1}`} className="w-full h-full object-cover" />
                          {photoIndex < MIN_PHOTOS && (
                            <div className="absolute top-1 left-1 w-3.5 h-3.5 rounded-full bg-green-500 flex items-center justify-center">
                              <svg width="7" height="7" viewBox="0 0 12 12" fill="none">
                                <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                          )}
                          <button
                            onClick={() => removeRoomImage(room.id, photoIndex)}
                            className="absolute top-1 right-1 w-5 h-5 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
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
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Room Rules</label>
                  {(roomRules[room.id] || [""]).map((rule, ruleIndex) => (
                    <div key={ruleIndex} className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                        <span className="text-[9px] font-bold text-gray-400">{ruleIndex + 1}</span>
                      </div>
                      <input
                        placeholder="Add a rule..."
                        value={rule}
                        onChange={(e) => updateRoomRule(room.id, ruleIndex, e.target.value)}
                        className="flex-1 h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-900 dark:text-white outline-none focus:border-black dark:focus:border-white transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => removeRoomRule(room.id, ruleIndex)}
                        className="w-7 h-7 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center transition-colors flex-shrink-0"
                      >
                        <X size={12} className="text-gray-400" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => addRoomRule(room.id)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-black dark:hover:text-white transition-colors w-fit pl-7"
                  >
                    <Plus size={11} />
                    Add rule
                  </button>
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
        className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
      >
        <Plus size={15} />
        Add another room
      </button>
    </div>
  );
};

export default IndividualRoomForm;
