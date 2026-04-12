import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Minus, X } from "lucide-react";
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

const EntireStayForm: React.FC<EntireStayFormProps> = ({
  guestCapacity,
  numberOfRooms,
  numberOfBeds,
  numberOfBathrooms,
  regularPrice,
  setRegularPrice,
  incrementValue,
  decrementValue,
  setGuestCapacity,
  setNumberOfRooms,
  setNumberOfBeds,
  setNumberOfBathrooms,
  entireStayRules,
  addEntireStayRule,
  removeEntireStayRule,
  updateEntireStayRule,
  coverImage,
  handleCoverImageUpload,
  removeCoverImage,
  renderImageSrc,
  entireStayImages,
  setEntireStayImages,
  removeEntireStayImage,
  sliderRef,
  errors,
  clearError,
}) => {
  const counters = [
    { label: "Guest Capacity", desc: "Maximum number of guests allowed", value: guestCapacity, setter: setGuestCapacity, errorKey: "guestCapacity" },
    { label: "Number of Rooms", desc: "Total rooms available for guests", value: numberOfRooms, setter: setNumberOfRooms, errorKey: "numberOfRooms" },
    { label: "Number of Beds", desc: "Total beds across all rooms", value: numberOfBeds, setter: setNumberOfBeds, errorKey: "numberOfBeds" },
    { label: "Number of Bathrooms", desc: "Total bathrooms in the property", value: numberOfBathrooms, setter: setNumberOfBathrooms, errorKey: "numberOfBathrooms" },
  ];

  return (
    <>
      {/* Capacity Counters */}
      {counters.map((counter, idx) => (
        <React.Fragment key={counter.errorKey}>
          <div className="flex items-center justify-between py-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-black dark:text-white">
                {counter.label}
              </span>
              <span className={`text-xs ${errors[counter.errorKey] ? "text-red-500" : "text-gray-500 dark:text-gray-400"}`}>
                {errors[counter.errorKey] || counter.desc}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { decrementValue(counter.value, counter.setter); clearError(counter.errorKey); }}
                className="w-9 h-9 rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition-all flex items-center justify-center"
              >
                <Minus size={14} className="text-gray-600 dark:text-gray-400" />
              </button>
              <span className={`text-sm font-semibold min-w-[28px] text-center ${errors[counter.errorKey] ? "text-red-500" : "text-black dark:text-white"}`}>
                {counter.value}
              </span>
              <button
                onClick={() => { incrementValue(counter.value, counter.setter); clearError(counter.errorKey); }}
                className="w-9 h-9 rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition-all flex items-center justify-center"
              >
                <Plus size={14} className="text-gray-600 dark:text-gray-400" />
              </button>
            </div>
          </div>
          {idx < counters.length - 1 && <div className="w-full h-px bg-gray-100 dark:bg-gray-800" />}
        </React.Fragment>
      ))}

      <div className="w-full h-px bg-gray-100 dark:bg-gray-800" />

      {/* Regular Price */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-semibold text-black dark:text-white">
          Regular Price (in Rupees)
        </Label>
        <Input
          type="number"
          name="regularPrice"
          placeholder="Enter regular price"
          value={regularPrice}
          onChange={(e) => { setRegularPrice(e.target.value); clearError("regularPrice"); }}
          className={`h-10 text-sm ${errors.regularPrice ? "border-red-500 focus:border-red-500" : "border-gray-200 dark:border-gray-600"}`}
        />
        {errors.regularPrice && (
          <span className="text-xs text-red-500">{errors.regularPrice}</span>
        )}
      </div>

      {/* Rules and Regulations */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-black dark:text-white">
            Rules and Regulations
          </span>
          {errors.entireStayRules && (
            <span className="text-xs text-red-500">{errors.entireStayRules}</span>
          )}
        </div>

        {entireStayRules.map((rule, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              placeholder="Add rule and regulations..."
              value={rule}
              onChange={(e) => { updateEntireStayRule(index, e.target.value); clearError("entireStayRules"); }}
              className={`flex-1 h-10 text-sm ${errors.entireStayRules ? "border-red-500 focus:border-red-500" : "border-gray-200 dark:border-gray-600"}`}
            />
            <button
              onClick={() => removeEntireStayRule(index)}
              className="w-9 h-9 rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 active:scale-95 transition-all flex items-center justify-center flex-shrink-0"
            >
              <X size={14} className="text-gray-500" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addEntireStayRule}
          className="flex items-center gap-2 text-sm font-medium text-black dark:text-white hover:opacity-70 transition-opacity w-fit"
        >
          <Plus size={14} />
          <span>Add More Rules</span>
        </button>
      </div>

      {/* Cover Photo */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-black dark:text-white">Cover Photo</span>
          {errors.coverImage && (
            <span className="text-xs text-red-500">{errors.coverImage}</span>
          )}
        </div>

        <div className={`w-full relative h-64 max-w-xl rounded-xl overflow-hidden border-2 ${errors.coverImage ? "border-red-500" : "border-gray-200 dark:border-gray-700"}`}>
          {coverImage ? (
            <img src={renderImageSrc(coverImage)} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <label className="w-full h-full flex items-center justify-center text-gray-400 text-sm cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
              <div className="flex flex-col items-center gap-2">
                <Plus size={24} />
                <span>Add Cover Photo</span>
              </div>
              <input
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={(e) => { handleCoverImageUpload(e); clearError("coverImage"); }}
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

      {/* Property Images */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-black dark:text-white">Property Images</span>
          <span className={`text-xs ${errors.entireStayImages ? "text-red-500" : "text-gray-500 dark:text-gray-400"}`}>
            {errors.entireStayImages || `${entireStayImages.length} uploaded (min 5)`}
          </span>
        </div>

        <label className={`flex h-32 flex-col items-center justify-center w-full p-6 text-sm bg-gray-50 dark:bg-gray-700 rounded-xl border-2 border-dashed ${errors.entireStayImages ? "border-red-500" : "border-gray-300 dark:border-gray-600 hover:border-gray-400"} transition-colors cursor-pointer`}>
          <div className="flex items-center gap-2">
            <Plus size={24} className="text-black" />
            <span className="text-base text-black font-plus-jakarta">Add Photos</span>
          </div>
          <input
            type="file"
            accept="image/png,image/jpeg"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = e.target.files;
              if (!files || files.length === 0) return;

              const validFiles: File[] = [];
              for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
                  validFiles.push(file);
                }
              }

              if (validFiles.length === 0) return;

              const readPromises = validFiles.map(file => {
                return new Promise<string>((resolve) => {
                  const reader = new FileReader();
                  reader.onload = () => resolve(reader.result as string);
                  reader.readAsDataURL(file);
                });
              });

              Promise.all(readPromises).then(base64Images => {
                setEntireStayImages(prev => [...prev, ...base64Images]);
                clearError("entireStayImages");
              });
            }}
          />
        </label>

        {entireStayImages.length > 0 && (
          <div className="flex relative items-center max-w-4xl mx-auto">
            <div className="relative">
              {entireStayImages.length > 5 && (
                <button
                  onClick={() => (sliderRef.current as any)?.scrollBy({ left: -300, behavior: "smooth" })}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white shadow p-2 rounded-full"
                >
                  <IoIosArrowBack />
                </button>
              )}

              <div
                ref={sliderRef}
                className="flex max-w-4xl max-md:w-[400px] items-start gap-3 overflow-x-auto scrollbar-hide scroll-smooth"
              >
                {entireStayImages.map((photo, index) => (
                  <div
                    key={index}
                    className="relative w-44 h-52 max-sm:w-24 max-md:h- 24 border border-gray-200 rounded-lg overflow-hidden flex-shrink-0"
                  >
                    <img src={renderImageSrc(photo)} alt={`Upload ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeEntireStayImage(index)}
                      className="absolute top-2 right-2 w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {entireStayImages.length > 5 && (
                <button
                  onClick={() => (sliderRef.current as any)?.scrollBy({ left: 300, behavior: "smooth" })}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white shadow p-2 rounded-full"
                >
                  <IoIosArrowForward />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default EntireStayForm;
