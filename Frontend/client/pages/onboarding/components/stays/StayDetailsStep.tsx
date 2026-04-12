import React from "react";
import EntireStayForm from "./EntireStayForm";
import IndividualRoomForm from "./IndividualRoomForm";

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

const StayDetailsStep: React.FC<StayDetailsStepProps> = (props) => {
  const { stayType, setStayType } = props;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-3xl">
      <div className="text-center space-y-2">
        <h1 className="text-2xl lg:text-[32px] font-bold text-black dark:text-white leading-tight">
          Stay Details
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Configure your property listing details
        </p>
      </div>

      <div className="w-full flex flex-col gap-6">
        {/* Stay Type Selection */}
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold text-black dark:text-white">
            How would you like to list?
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {([
              { key: "entire" as const, title: "Entire Stay", desc: "Guests book the whole property" },
              { key: "individual" as const, title: "Individual Room", desc: "Guests book specific rooms" },
            ]).map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setStayType(opt.key)}
                className={`relative flex flex-col gap-1 p-4 rounded-xl border-2 text-left onb-card
                  ${stayType === opt.key
                    ? "onb-card-selected"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500"
                  }`}
              >
                {stayType === opt.key && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center" style={{backgroundColor: 'var(--th-accent)'}}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6L5 8.5L9.5 3.5" stroke="var(--th-accent-fg)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
                <span className={`text-sm font-semibold transition-colors ${stayType === opt.key ? "text-black dark:text-white" : "text-gray-700 dark:text-gray-300"}`}>
                  {opt.title}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

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
