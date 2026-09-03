import React from "react";
import EntireStayForm from "./EntireStayForm";
import IndividualRoomForm from "./IndividualRoomForm";
import { StepHeader } from "../shared/primitives";
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
  checkInTime: string;
  setCheckInTime: (val: string) => void;
  checkOutTime: string;
  setCheckOutTime: (val: string) => void;
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

const STAY_OPTIONS: { key: "entire" | "individual"; title: string; desc: string; emoji: string }[] =
  [
    { key: "entire", title: "Entire Stay", desc: "Guests book the whole property", emoji: "🏡" },
    {
      key: "individual",
      title: "Individual Room",
      desc: "Guests book specific rooms",
      emoji: "🛏️",
    },
  ];

const StayDetailsStep: React.FC<StayDetailsStepProps> = (props) => {
  const { stayType, setStayType } = props;

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Shared StepHeader — see the note in PropertyTypeStep. */}
      <StepHeader kicker="Listing Setup" subtitle="Configure your property listing details." />

      <div className="w-full flex flex-col gap-5">
        {/* ── Stay Type Selection ── */}
        <div className="bg-th-surface-0 border-[1.5px] border-th-warm-border rounded-[20px] p-[20px_22px_22px] shadow-[0_2px_12px_rgba(0,0,0,0.04),0_1px_3px_rgba(0,0,0,0.03)]">
          <p className="text-[12px] font-bold text-th-warm-text-dark uppercase tracking-[0.03em] mb-[14px]">
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
                  className={cn(
                    "relative flex flex-col items-center gap-2 px-[14px] py-5 rounded-[16px] border-[1.5px] cursor-pointer transition-all duration-150 text-center",
                    selected
                      ? "border-th-brand bg-th-brand-soft shadow-[0_0_0_3px_var(--th-ring)]"
                      : "border-th-warm-border bg-th-warm-surface hover:border-th-brand hover:bg-th-brand-soft",
                  )}
                >
                  {/* Selection check */}
                  {selected && (
                    <div className="absolute top-2.5 right-2.5 w-[18px] h-[18px] rounded-full bg-th-brand flex items-center justify-center">
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
                  )}
                  <span className="text-[24px]">{opt.emoji}</span>
                  <div>
                    <p
                      className={cn(
                        "text-[13.5px] font-bold tracking-[-0.01em] transition-colors duration-150",
                        selected ? "text-th-brand" : "text-th-text-primary",
                      )}
                    >
                      {opt.title}
                    </p>
                    <p className="text-[11.5px] text-th-warm-text-dark mt-[3px]">{opt.desc}</p>
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
            checkInTime={props.checkInTime}
            setCheckInTime={props.setCheckInTime}
            checkOutTime={props.checkOutTime}
            setCheckOutTime={props.setCheckOutTime}
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
