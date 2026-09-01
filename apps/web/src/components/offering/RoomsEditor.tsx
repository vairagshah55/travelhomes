import React from "react";
import { BedDouble, Bath, IndianRupee, Images, Plus, Trash2, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  BTN_ICON_SM,
  BTN_NEUTRAL,
  BTN_RAW,
  BTN_SM,
  CONTROL,
  Field,
  INSET,
} from "@/components/shared";
import { cn, getImageUrl } from "@/lib/utils";
import type { OfferRoom } from "@/lib/api";

/* ── Per-room editor for unique-stay listings ─────────────────────────────────
   A stay saved through onboarding as `stayType: "individual"` keeps its real
   capacity, price and photos on each room; the top-level guestCapacity /
   numberOfRooms / regularPrice are a rollup of them. The edit wizard used to
   seed `rooms: []` and render nothing, so a vendor opening Edit saw a listing
   with no rooms — and the whole breakdown was invisible and uneditable.       */

/** Blank room, in the shape Server RoomSchema declares. */
const blankRoom = (index: number): OfferRoom => ({
  id: String(index + 1),
  name: "",
  description: "",
  guestCapacity: 1,
  beds: 1,
  bathrooms: 1,
  price: 0,
  photos: [],
});

const Counter = ({
  icon,
  label,
  value,
  min = 0,
  max = 30,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (next: number) => void;
}) => (
  <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-muted/60 dark:bg-white/[0.03]">
    <span className="flex items-center gap-2 text-[12.5px] font-semibold text-foreground/85">
      <span className="text-muted-foreground" aria-hidden>
        {icon}
      </span>
      {label}
    </span>
    <span className="flex items-center gap-1.5">
      <button
        type="button"
        aria-label={`Decrease ${label}`}
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className={cn(BTN_RAW, BTN_ICON_SM, BTN_NEUTRAL, "rounded-lg disabled:opacity-40")}
      >
        –
      </button>
      <span className="w-7 text-center text-[13px] font-bold tabular-nums text-foreground">
        {value}
      </span>
      <button
        type="button"
        aria-label={`Increase ${label}`}
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className={cn(BTN_RAW, BTN_ICON_SM, BTN_NEUTRAL, "rounded-lg disabled:opacity-40")}
      >
        +
      </button>
    </span>
  </div>
);

export const RoomsEditor = ({
  rooms,
  onChange,
  onUploadPhotos,
  perRoomPricing,
}: {
  rooms: OfferRoom[];
  onChange: (next: OfferRoom[]) => void;
  /** Resolves to the uploaded URLs; the caller owns the upload endpoint. */
  onUploadPhotos: (files: FileList | null) => Promise<string[]>;
  /**
   * `stayType === "individual"` — price is charged per room, so each room needs
   * its own. Entire-stay listings price the whole property once and the per-room
   * field would contradict the top-level one.
   */
  perRoomPricing: boolean;
}) => {
  const update = (index: number, patch: Partial<OfferRoom>) =>
    onChange(rooms.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  const addRoom = () => onChange([...rooms, blankRoom(rooms.length)]);
  const removeRoom = (index: number) => onChange(rooms.filter((_, i) => i !== index));

  const addPhotos = async (index: number, files: FileList | null) => {
    const urls = await onUploadPhotos(files);
    if (!urls.length) return;
    update(index, { photos: [...(rooms[index]?.photos || []), ...urls] });
  };

  return (
    <div className="space-y-3">
      {rooms.length === 0 && (
        <p className="text-[12.5px] text-muted-foreground">
          No rooms recorded for this listing yet.
        </p>
      )}

      {rooms.map((room, index) => (
        <div key={room.id || index} className={INSET}>
          <header className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border bg-muted/50 dark:bg-white/[0.02]">
            <p className="text-[12.5px] font-bold text-foreground truncate">
              {room.name?.trim() || `Room ${index + 1}`}
            </p>
            <button
              type="button"
              onClick={() => removeRoom(index)}
              aria-label={`Remove ${room.name?.trim() || `room ${index + 1}`}`}
              className={cn(
                BTN_RAW,
                BTN_ICON_SM,
                "rounded-lg text-muted-foreground hover:text-destructive",
                "hover:bg-muted transition-colors duration-150",
              )}
            >
              <Trash2 size={14} strokeWidth={2.1} />
            </button>
          </header>

          <div className="p-4 space-y-3.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <Field label="Room name" htmlFor={`room-name-${index}`}>
                <Input
                  id={`room-name-${index}`}
                  value={room.name || ""}
                  onChange={(e) => update(index, { name: e.target.value })}
                  placeholder="e.g. Garden Suite"
                  className={cn("h-11", CONTROL)}
                />
              </Field>
              {perRoomPricing && (
                <Field label="Price per night" htmlFor={`room-price-${index}`}>
                  <div className="relative">
                    <IndianRupee
                      size={14}
                      strokeWidth={2.2}
                      aria-hidden
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      id={`room-price-${index}`}
                      value={String(room.price ?? "")}
                      onChange={(e) =>
                        update(index, { price: Number(e.target.value.replace(/\D/g, "")) || 0 })
                      }
                      inputMode="numeric"
                      placeholder="0"
                      className={cn("h-11 pl-8", CONTROL)}
                    />
                  </div>
                </Field>
              )}
            </div>

            <Field label="Description" htmlFor={`room-desc-${index}`}>
              <Input
                id={`room-desc-${index}`}
                value={room.description || ""}
                onChange={(e) => update(index, { description: e.target.value })}
                placeholder="What makes this room different?"
                className={cn("h-11", CONTROL)}
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <Counter
                icon={<Users size={13} strokeWidth={2.2} />}
                label="Guests"
                value={Number(room.guestCapacity) || 1}
                min={1}
                onChange={(guestCapacity) => update(index, { guestCapacity })}
              />
              <Counter
                icon={<BedDouble size={13} strokeWidth={2.2} />}
                label="Beds"
                value={Number(room.beds) || 1}
                min={1}
                onChange={(beds) => update(index, { beds })}
              />
              <Counter
                icon={<Bath size={13} strokeWidth={2.2} />}
                label="Bathrooms"
                value={Number(room.bathrooms) || 0}
                onChange={(bathrooms) => update(index, { bathrooms })}
              />
            </div>

            {/* Room photos. For an individual-room listing these are the only
                photos guests see for that room, so they have to be editable
                here rather than only through the gallery on step 2. */}
            <div className="space-y-2">
              <p className="text-[11.5px] font-semibold text-muted-foreground">
                Photos ({room.photos?.length || 0})
              </p>
              <div className="flex flex-wrap gap-2">
                {(room.photos || []).map((photo, photoIndex) => (
                  <span key={`${photo}-${photoIndex}`} className="relative group">
                    <img
                      src={getImageUrl(photo)}
                      alt=""
                      className="w-16 h-16 rounded-lg object-cover border border-border"
                    />
                    <button
                      type="button"
                      aria-label="Remove photo"
                      onClick={() =>
                        update(index, {
                          photos: (room.photos || []).filter((_, i) => i !== photoIndex),
                        })
                      }
                      className="absolute -top-1.5 -right-1.5 grid place-items-center w-5 h-5 rounded-full bg-destructive text-white text-[11px] leading-none shadow"
                    >
                      ×
                    </button>
                  </span>
                ))}
                <label
                  className={cn(
                    "grid place-items-center w-16 h-16 rounded-lg border border-dashed border-border",
                    "cursor-pointer text-muted-foreground hover:border-brand/40 hover:text-brand",
                    "transition-colors duration-150",
                  )}
                >
                  <Images size={16} strokeWidth={2} aria-hidden />
                  <span className="sr-only">Add photos to this room</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      void addPhotos(index, e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={addRoom}
        className={cn(BTN_RAW, BTN_NEUTRAL, BTN_SM, "gap-1.5")}
      >
        <Plus size={13} strokeWidth={2.4} aria-hidden />
        Add room
      </button>
    </div>
  );
};

export default RoomsEditor;
