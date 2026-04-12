import React from "react";
import { Plus, Minus, X, ImagePlus, IndianRupee, ShieldCheck, Users, DoorClosed, BedDouble, Bath } from "lucide-react";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";

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

const Counter: React.FC<{
  icon: React.ReactNode;
  label: string;
  desc: string;
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  error?: string;
}> = ({ icon, label, desc, value, onDecrement, onIncrement, error }) => (
  <div className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${error ? "border-red-300 bg-red-50 dark:bg-red-900/10" : "border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50"}`}>
    <div className="flex items-center gap-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${error ? "bg-red-100 dark:bg-red-900/20" : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"}`}>
        {icon}
      </div>
      <div>
        <p className={`text-sm font-semibold ${error ? "text-red-600 dark:text-red-400" : "text-black dark:text-white"}`}>{label}</p>
        <p className={`text-xs mt-0.5 ${error ? "text-red-500" : "text-gray-500 dark:text-gray-400"}`}>{error || desc}</p>
      </div>
    </div>
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onDecrement}
        className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition-all flex items-center justify-center"
      >
        <Minus size={13} className="text-gray-500" />
      </button>
      <span className={`text-base font-bold min-w-[28px] text-center tabular-nums ${error ? "text-red-500" : "text-black dark:text-white"}`}>{value}</span>
      <button
        type="button"
        onClick={onIncrement}
        className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition-all flex items-center justify-center"
      >
        <Plus size={13} className="text-gray-500" />
      </button>
    </div>
  </div>
);

const MIN_IMAGES = 5;

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

  return (
    <div className="flex flex-col gap-6 w-full">

      {/* ── Property Details Card ── */}
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
          Property Details
        </p>
        <div className="flex flex-col gap-2">
          <Counter
            icon={<Users size={15} className={errors.guestCapacity ? "text-red-500" : "text-gray-500 dark:text-gray-400"} />}
            label="Guest Capacity"
            desc="Max guests allowed"
            value={guestCapacity}
            onDecrement={() => { decrementValue(guestCapacity, setGuestCapacity); clearError("guestCapacity"); }}
            onIncrement={() => { incrementValue(guestCapacity, setGuestCapacity); clearError("guestCapacity"); }}
            error={errors.guestCapacity}
          />
          <Counter
            icon={<DoorClosed size={15} className={errors.numberOfRooms ? "text-red-500" : "text-gray-500 dark:text-gray-400"} />}
            label="Rooms"
            desc="Total rooms for guests"
            value={numberOfRooms}
            onDecrement={() => { decrementValue(numberOfRooms, setNumberOfRooms); clearError("numberOfRooms"); }}
            onIncrement={() => { incrementValue(numberOfRooms, setNumberOfRooms); clearError("numberOfRooms"); }}
            error={errors.numberOfRooms}
          />
          <Counter
            icon={<BedDouble size={15} className={errors.numberOfBeds ? "text-red-500" : "text-gray-500 dark:text-gray-400"} />}
            label="Beds"
            desc="Total beds across all rooms"
            value={numberOfBeds}
            onDecrement={() => { decrementValue(numberOfBeds, setNumberOfBeds); clearError("numberOfBeds"); }}
            onIncrement={() => { incrementValue(numberOfBeds, setNumberOfBeds); clearError("numberOfBeds"); }}
            error={errors.numberOfBeds}
          />
          <Counter
            icon={<Bath size={15} className={errors.numberOfBathrooms ? "text-red-500" : "text-gray-500 dark:text-gray-400"} />}
            label="Bathrooms"
            desc="Total bathrooms"
            value={numberOfBathrooms}
            onDecrement={() => { decrementValue(numberOfBathrooms, setNumberOfBathrooms); clearError("numberOfBathrooms"); }}
            onIncrement={() => { incrementValue(numberOfBathrooms, setNumberOfBathrooms); clearError("numberOfBathrooms"); }}
            error={errors.numberOfBathrooms}
          />
        </div>
      </div>

      {/* ── Price ── */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
          Pricing
        </p>
        <div className={`flex items-center gap-0 border rounded-xl overflow-hidden transition-colors ${errors.regularPrice ? "border-red-400" : "border-gray-200 dark:border-gray-700 focus-within:border-black dark:focus-within:border-white"}`}>
          <div className="flex items-center gap-1.5 px-4 py-3 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
            <IndianRupee size={15} className="text-gray-500 dark:text-gray-400" />
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">INR</span>
          </div>
          <input
            type="number"
            placeholder="0.00"
            value={regularPrice}
            onChange={(e) => { setRegularPrice(e.target.value); clearError("regularPrice"); }}
            className="flex-1 px-4 py-3 text-sm font-medium bg-white dark:bg-gray-900 text-black dark:text-white outline-none placeholder:text-gray-300 dark:placeholder:text-gray-600"
          />
          <span className="px-4 text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">per night</span>
        </div>
        {errors.regularPrice && (
          <p className="text-xs text-red-500 pl-1">{errors.regularPrice}</p>
        )}
      </div>

      {/* ── Rules ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            House Rules
          </p>
          {errors.entireStayRules && (
            <span className="text-xs text-red-500">{errors.entireStayRules}</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {entireStayRules.map((rule, index) => (
            <div key={index} className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] font-bold text-gray-400">{index + 1}</span>
              </div>
              <input
                placeholder={index === 0 ? "e.g. No smoking indoors" : index === 1 ? "e.g. No pets allowed" : "Add a rule..."}
                value={rule}
                onChange={(e) => { updateEntireStayRule(index, e.target.value); clearError("entireStayRules"); }}
                className={`flex-1 h-10 px-3 rounded-lg border text-sm bg-white dark:bg-gray-800 dark:text-white outline-none transition-colors ${errors.entireStayRules ? "border-red-300 focus:border-red-400" : "border-gray-200 dark:border-gray-700 focus:border-black dark:focus:border-white"}`}
              />
              <button
                type="button"
                onClick={() => removeEntireStayRule(index)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 transition-all flex items-center justify-center flex-shrink-0"
              >
                <X size={14} className="text-gray-400" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addEntireStayRule}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors w-fit pl-8"
        >
          <Plus size={13} />
          Add another rule
        </button>
      </div>

      {/* ── Cover Photo ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            Cover Photo
          </p>
          {errors.coverImage && (
            <span className="text-xs text-red-500">{errors.coverImage}</span>
          )}
        </div>

        <div className={`relative w-full h-56 rounded-2xl overflow-hidden border-2 transition-colors ${errors.coverImage ? "border-red-400" : "border-gray-200 dark:border-gray-700"}`}>
          {coverImage ? (
            <>
              <img src={renderImageSrc(coverImage)} alt="Cover" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              <button
                onClick={removeCoverImage}
                className="absolute top-3 right-3 w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all active:scale-95"
              >
                <X size={14} className="text-gray-700" />
              </button>
              <label className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-white/90 hover:bg-white rounded-full text-xs font-semibold text-gray-700 cursor-pointer shadow transition-all">
                <ImagePlus size={12} />
                Change
                <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={(e) => { handleCoverImageUpload(e); clearError("coverImage"); }} />
              </label>
            </>
          ) : (
            <label className="w-full h-full flex flex-col items-center justify-center gap-3 cursor-pointer bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group">
              <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center group-hover:border-gray-400 transition-colors shadow-sm">
                <ImagePlus size={20} className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Upload cover photo</p>
                <p className="text-xs text-gray-400 mt-0.5">JPG or PNG · First impression matters</p>
              </div>
              <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={(e) => { handleCoverImageUpload(e); clearError("coverImage"); }} />
            </label>
          )}
        </div>
      </div>

      {/* ── Property Gallery ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            Property Gallery
          </p>
          <span className={`text-xs font-medium ${entireStayImages.length >= MIN_IMAGES ? "text-green-600 dark:text-green-400" : errors.entireStayImages ? "text-red-500" : "text-gray-400"}`}>
            {entireStayImages.length}/{MIN_IMAGES} required
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(imageProgress / MIN_IMAGES) * 100}%`,
              backgroundColor: imageProgress >= MIN_IMAGES ? "#22c55e" : "var(--th-accent)",
            }}
          />
        </div>

        {/* Upload zone */}
        <label className={`flex h-24 items-center justify-center gap-3 w-full rounded-xl border-2 border-dashed cursor-pointer transition-colors ${errors.entireStayImages ? "border-red-300 bg-red-50 dark:bg-red-900/10" : "border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 bg-gray-50 dark:bg-gray-800/50"}`}>
          <ImagePlus size={18} className={errors.entireStayImages ? "text-red-400" : "text-gray-400"} />
          <div>
            <p className={`text-sm font-medium ${errors.entireStayImages ? "text-red-500" : "text-gray-600 dark:text-gray-300"}`}>
              {errors.entireStayImages || "Add photos"}
            </p>
            <p className="text-xs text-gray-400">Select multiple · JPG, PNG</p>
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
              <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 group">
                <img src={renderImageSrc(photo)} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                {index < MIN_IMAGES && (
                  <div className="absolute top-1.5 left-1.5 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
                    <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
                <button
                  onClick={() => removeEntireStayImage(index)}
                  className="absolute top-1.5 right-1.5 w-5 h-5 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={10} className="text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EntireStayForm;
