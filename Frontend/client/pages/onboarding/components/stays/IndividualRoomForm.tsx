import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronUp, ChevronDown, Plus, Minus, X } from "lucide-react";

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
  const roomCounters = [
    { field: "guestCapacity" as const, label: "Guest Capacity", desc: "Maximum guests for this room" },
    { field: "beds" as const, label: "Number of Beds", desc: "Beds available in this room" },
    { field: "bathrooms" as const, label: "Number of Bathrooms", desc: "Attached bathrooms for this room" },
  ];

  return (
    <>
      {/* Number of Rooms */}
      <div className="flex items-center justify-between py-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-semibold text-black dark:text-white">Number of Rooms</span>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Add or remove rooms to configure individually
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={removeRoom}
            className="w-9 h-9 rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition-all flex items-center justify-center"
          >
            <Minus size={14} className="text-gray-600 dark:text-gray-400" />
          </button>
          <span className="text-sm font-semibold text-black dark:text-white min-w-[28px] text-center">
            {rooms.length}
          </span>
          <button
            onClick={addRoom}
            className="w-9 h-9 rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition-all flex items-center justify-center"
          >
            <Plus size={14} className="text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {/* Room Cards */}
      {rooms.map((room, index) => (
        <div
          key={room.id}
          className="flex flex-col gap-3 p-5 rounded-xl border border-[#EAECF0] bg-white dark:bg-gray-800"
        >
          <div className="flex items-start justify-between">
            <h3 className="text-base font-semibold text-black dark:text-white font-plus-jakarta flex-1">
              Room {index + 1}
            </h3>
            <button
              onClick={() => setExpandedRoom(expandedRoom === room.id ? "" : room.id)}
              className="flex items-center justify-center w-[18px] h-[18px]"
            >
              {expandedRoom === room.id ? (
                <ChevronUp size={18} className="text-[#292D32]" />
              ) : (
                <ChevronDown size={18} className="text-[#292D32]" />
              )}
            </button>
          </div>

          {expandedRoom === room.id && (
            <>
              <div className="w-full h-px bg-[#EAECF0] border-dashed" />

              <div className="flex flex-col gap-5">
                {/* Room Name */}
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-semibold text-black dark:text-white">Name</Label>
                  <Input
                    placeholder="Room name"
                    value={room.name}
                    onChange={(e) => { updateRoom(room.id, "name", e.target.value); clearError(`room_${index}_name`); }}
                    className={`h-10 text-sm ${errors[`room_${index}_name`] ? "border-red-500 focus:border-red-500" : "border-gray-200 dark:border-gray-600"}`}
                  />
                  {errors[`room_${index}_name`] && (
                    <span className="text-xs text-red-500">{errors[`room_${index}_name`]}</span>
                  )}
                </div>

                {/* Description */}
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-semibold text-black dark:text-white">Description</Label>
                  <div className="flex flex-col gap-1">
                    <textarea
                      placeholder="Write here..."
                      maxLength={200}
                      value={room.description}
                      onChange={(e) => { updateRoom(room.id, "description", e.target.value); clearError(`room_${index}_description`); }}
                      className={`min-h-[96px] border rounded-lg px-3 py-3 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none focus:outline-none transition-all duration-200 ${errors[`room_${index}_description`] ? "border-red-500 focus:border-red-500" : "border-gray-200 dark:border-gray-600 focus:border-black dark:focus:border-white"}`}
                    />
                    <div className="flex justify-between px-1">
                      {errors[`room_${index}_description`] ? (
                        <span className="text-xs text-red-500">{errors[`room_${index}_description`]}</span>
                      ) : <span />}
                      <span className="text-xs text-gray-400">{room.description?.length || 0}/200</span>
                    </div>
                  </div>
                </div>

                {/* Cover Photo */}
                <div className="flex flex-col gap-5 p-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-semibold text-black dark:text-white font-plus-jakarta">Cover Photo</h3>
                  </div>

                  <div className="w-full relative h-64 max-w-xl border border-gray-200 rounded-xl overflow-hidden">
                    {coverImage ? (
                      <img src={renderImageSrc(coverImage)} alt="Cover" className="w-full h-full object-cover" />
                    ) : (
                      <label className="w-full h-full flex items-center justify-center text-gray-400 text-sm cursor-pointer bg-[#F9FAFB] dark:bg-gray-700 hover:bg-gray-100 transition-colors">
                        <div className="flex flex-col items-center gap-2">
                          <Plus size={24} />
                          <span>Add Cover Photo</span>
                        </div>
                        <input
                          type="file"
                          accept="image/jpeg,image/png"
                          className="hidden"
                          onChange={handleCoverImageUpload}
                        />
                      </label>
                    )}

                    {coverImage && (
                      <button
                        onClick={removeCoverImage}
                        className="absolute top-2 right-2 w-7 h-7 bg-white shadow-md hover:bg-gray-100 rounded-full flex items-center justify-center transition"
                      >
                        <X className="w-4 h-4 text-gray-600" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Room Photos */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold text-black dark:text-white">Room Photos</Label>
                    <span className={`text-xs ${errors[`room_${index}_photos`] ? "text-red-500" : "text-gray-500 dark:text-gray-400"}`}>
                      {errors[`room_${index}_photos`] || `${(room.photos || []).length} uploaded (min 5)`}
                    </span>
                  </div>

                  <label className={`flex h-32 flex-col items-center justify-center w-full p-6 text-sm bg-gray-50 dark:bg-gray-700 rounded-xl border-2 border-dashed ${errors[`room_${index}_photos`] ? "border-red-500" : "border-gray-300 dark:border-gray-600 hover:border-gray-400"} transition-colors cursor-pointer`}>
                    <div className="flex items-center gap-2">
                      <Plus size={24} className="text-black" />
                      <span className="text-base text-black font-plus-jakarta">Add Photos</span>
                    </div>
                    <input
                      type="file"
                      accept="image/png,image/jpeg"
                      multiple
                      className="hidden"
                      onChange={(e) => { handleRoomImageUpload(e, room.id); clearError(`room_${index}_photos`); }}
                    />
                  </label>

                  {(room.photos || []).length > 0 && (
                    <div className="flex relative items-center w-full mx-auto">
                      <div className="relative w-full">
                        <div className="flex w-full items-start gap-3 overflow-x-auto scrollbar-hide scroll-smooth">
                          {room.photos.map((photo, photoIndex) => (
                            <div
                              key={photoIndex}
                              className="relative w-44 h-52 max-sm:w-24 max-md:h- 24 border border-gray-200 rounded-lg overflow-hidden flex-shrink-0"
                            >
                              <img src={renderImageSrc(photo)} alt={`Upload ${photoIndex + 1}`} className="w-full h-full object-cover" />
                              <button
                                onClick={() => removeRoomImage(room.id, photoIndex)}
                                className="absolute top-2 right-2 w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Room Stats */}
                <div className="flex flex-col gap-1">
                  {roomCounters.map((counter, cIdx) => (
                    <React.Fragment key={counter.field}>
                      <div className="flex items-center justify-between py-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-semibold text-black dark:text-white">{counter.label}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{counter.desc}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => updateRoom(room.id, counter.field, Math.max(1, (room[counter.field] as number) - 1))}
                            className="w-9 h-9 rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition-all flex items-center justify-center"
                          >
                            <Minus size={14} className="text-gray-600 dark:text-gray-400" />
                          </button>
                          <span className="text-sm font-semibold text-black dark:text-white min-w-[28px] text-center">
                            {room[counter.field]}
                          </span>
                          <button
                            onClick={() => updateRoom(room.id, counter.field, (room[counter.field] as number) + 1)}
                            className="w-9 h-9 rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition-all flex items-center justify-center"
                          >
                            <Plus size={14} className="text-gray-600 dark:text-gray-400" />
                          </button>
                        </div>
                      </div>
                      {cIdx < roomCounters.length - 1 && <div className="w-full h-px bg-gray-100 dark:bg-gray-800" />}
                    </React.Fragment>
                  ))}

                  {/* Regular Price */}
                  <div className="flex flex-col gap-2">
                    <Label className="text-sm font-semibold text-black dark:text-white">
                      Regular Price (in Rupees)
                    </Label>
                    <Input
                      type="number"
                      name="regularPrice"
                      placeholder="Enter regular price"
                      value={room.price}
                      onChange={(e) => {
                        updateRoom(room.id, "price", Number(e.target.value));
                        clearError(`room_${index}_price`);
                      }}
                      className={`h-10 text-sm ${errors[`room_${index}_price`] ? "border-red-500 focus:border-red-500" : "border-gray-200 dark:border-gray-600"}`}
                    />
                    {errors[`room_${index}_price`] && (
                      <span className="text-xs text-red-500">{errors[`room_${index}_price`]}</span>
                    )}
                  </div>

                  {/* Room Rules */}
                  <div className="flex flex-col gap-3">
                    <span className="text-sm font-semibold text-black dark:text-white">
                      Room Rules and Regulations
                    </span>

                    {(roomRules[room.id] || [""]).map((rule, ruleIndex) => (
                      <div key={ruleIndex} className="flex items-center gap-2">
                        <Input
                          placeholder="Add room rule and regulations..."
                          value={rule}
                          onChange={(e) => updateRoomRule(room.id, ruleIndex, e.target.value)}
                          className="flex-1 h-10 text-sm border-gray-200 dark:border-gray-600"
                        />
                        <button
                          onClick={() => removeRoomRule(room.id, ruleIndex)}
                          className="w-9 h-9 rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition-all flex items-center justify-center flex-shrink-0"
                        >
                          <X size={14} className="text-gray-500" />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => addRoomRule(room.id)}
                      className="flex items-center gap-2 text-sm font-medium text-black dark:text-white hover:opacity-70 transition-opacity w-fit"
                    >
                      <Plus size={14} />
                      <span>Add More Room Rules</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      ))}
    </>
  );
};

export default IndividualRoomForm;
