import React from "react";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { getImageUrl } from "@/lib/utils";

interface DescriptionStepProps {
  name: string;
  description: string;
  rules: string[];
  photos: (string | File)[];
  coverImage: (string | File)[];
  errors: Record<string, string>;
  sliderRef: React.RefObject<HTMLDivElement>;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onAddRule: () => void;
  onRemoveRule: (index: number) => void;
  onUpdateRule: (index: number, value: string) => void;
  onPhotoUpload: (files: FileList | null) => void;
  onCoverUpload: (files: FileList | null) => void;
  onRemovePhoto: (index: number) => void;
  onRemoveCover: (index: number) => void;
  clearError: (field: string) => void;
}

const renderImageSrc = (fileOrUrl: any) => {
  if (!fileOrUrl) return "";
  if (typeof fileOrUrl === "string") return getImageUrl(fileOrUrl);
  return URL.createObjectURL(fileOrUrl);
};

const DescriptionStep: React.FC<DescriptionStepProps> = ({
  name,
  description,
  rules,
  photos,
  coverImage,
  errors,
  sliderRef,
  onNameChange,
  onDescriptionChange,
  onAddRule,
  onRemoveRule,
  onUpdateRule,
  onPhotoUpload,
  onCoverUpload,
  onRemovePhoto,
  onRemoveCover,
  clearError,
}) => {
  return (
    <div className="w-full flex flex-col gap-9">
      <div className="flex flex-col items-center gap-5 max-sm:gap-3">
        <h1 className="text-[32px] max-sm:text-xl font-semibold text-black dark:text-white font-sanse text-center">
          Caravan Descriptions
        </h1>

        <div className="w-full max-w-4xl mx-auto flex flex-col gap-5">
          {/* Name */}
          <div className="flex flex-col gap-2 w-full">
            <div className="flex items-center gap-2 pl-1">
              <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans']">
                Name
              </label>
            </div>
            <div className="relative w-full ">
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  onNameChange(e.target.value);
                  if (errors.name) {
                    clearError("name");
                  }
                }}
                placeholder="Name"
                required
                maxLength={50}
                className={`w-full h-[50px] px-3 py-4 border ${
                  errors.name ? "border-red-500" : "border-[#EAECF0]"
                } rounded-lg text-sm text-[#121213] font-['Plus_Jakarta_Sans'] focus:outline-none focus:border-[var(--th-accent)] dark:bg-gray-800 dark:border-gray-600 dark:text-white`}
              />
            <div className="flex justify-between w-full">
               <div> {errors.name && <span className="text-xs text-red-500">{errors.name}</span>}
            </div>
                <div className="text-right text-xs text-[#334054] dark:text-gray-400 mt-1 px-[6px]">
                {name.length}/50
              </div>

            </div>
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 pl-1">
              <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans']">
                Descriptions
              </label>
            </div>
            <div className="relative">
              <textarea
                value={description}
                onChange={(e) => {
                  onDescriptionChange(e.target.value);
                  if (errors.description) {
                    clearError("description");
                  }
                }}
                placeholder="Write here..."
                maxLength={200}
                className={`w-full h-24 px-3 py-4 border ${
                  errors.description ? "border-red-500" : "border-[#EAECF0]"
                } rounded-lg text-sm text-[#121213] font-['Plus_Jakarta_Sans'] resize-none focus:outline-none focus:border-[var(--th-accent)] dark:bg-gray-800 dark:border-gray-600 dark:text-white`}
              />
              <div className="flex justify-between w-full">
                <div>
                  {" "}
                  {errors.description && (
                    <span className="text-xs text-red-500">
                      {errors.description}
                    </span>
                  )}
                </div>
                <div className="text-right text-xs text-[#334054] dark:text-gray-400 mt-1 px-[6px]">
                  {description.length}/200
                </div>
              </div>
            </div>
          </div>

          {/* Rules & Regulation */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 pl-1">
                <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans']">
                  Rules & Regulation
                </label>
              </div>
            </div>
            <div className="flex flex-col gap-4">
              {rules.map((rule, index) => (
                <div className="w-full flex items-center gap-2" key={index}>
                  <input
                    type="text"
                    value={rule}
                    onChange={(e) => onUpdateRule(index, e.target.value)}
                    placeholder="Add rules..."
                    maxLength={250}
                    className="w-full h-[50px] px-3 py-4 border border-[#EAECF0] rounded-lg text-sm text-[#121213] font-['Plus_Jakarta_Sans'] focus:outline-none focus:border-[var(--th-accent)] dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  />
                  <button
                    onClick={() => onRemoveRule(index)}
                    className="w-[50px] h-[50px] p-3 bg-gray-200 rounded-lg flex items-center justify-center"
                  >
                    <X className="w-8 h-8" />
                  </button>
                </div>
              ))}
              <button
                onClick={onAddRule}
                className="flex items-center gap-2 px-3 py-0 rounded-[60px]"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M0.75 6H11.25"
                    stroke="var(--th-accent)"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6 11.25L6 0.75"
                    stroke="var(--th-accent)"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-xs text-[var(--th-accent)] font-sanse font-normal tracking-[-0.24px] leading-[160%]">
                  Add More
                </span>
              </button>
            </div>
          </div>

          {/* Upload Photos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base text-[#334054] flex flex-col">
                Upload Cover Photo
                <span className="text-[10px] text-gray-500">
Please upload a thumbnail image that   highlights your services and features. </span>
              </Label>
               {/* Add Cover Photo */}
              <div className="relative w-60 h-10 border border-gray-200 rounded-lg flex items-center justify-center cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => onCoverUpload(e.target.files)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Plus className="w-5 h-5 text-gray-500" />
                <span className="text-gray-500 text-sm font-medium">
                  Cover Photo
                </span>
              </div>
            </div>
             { /* ------------------ COVER IMAGE (FIRST IMAGE) ------------------ */}
    <div className="w-full relative h-64 max-w-xl border border-gray-200 rounded-xl overflow-hidden">
  {coverImage?.[0] ? (
    <img
      src={renderImageSrc(coverImage[0])}
      alt="Cover"
      className="w-full h-full object-cover"
    />
  ) : (
    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
      No image selected
    </div>
  )}

  {coverImage?.[0] && (
    <button
      onClick={() => onRemoveCover(0)}
      className="absolute top-2 right-2 w-7 h-7 bg-white shadow-md hover:bg-gray-100 rounded-full flex items-center justify-center transition"
    >
      <X className="w-4 h-4 text-gray-600" />
    </button>
  )}
</div>


            <div className="flex items-center justify-between">
              <Label className="text-base text-[#334054] flex flex-col">
                Upload Photos
                <span className="text-[10px] text-gray-500">
                  Please upload photos that best highlight your services
                  and features{" "}
                </span>
              </Label>
              {/* Add Cover Photo */}
              <div
                className={`relative w-60 h-10 border ${
                  errors.photos ? "border-red-500" : "border-gray-200"
                } rounded-lg flex items-center justify-center cursor-pointer`}
              >
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    onPhotoUpload(e.target.files);
                    if (errors.photos) {
                      clearError("photos");
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Plus className="w-5 h-5 text-gray-500" />
                <span className="text-gray-500 text-sm font-medium">
                  Add Photos
                </span>
              </div>
            </div>
            {errors.photos && (
              <span className="text-xs text-red-500">
                {errors.photos}
              </span>
            )}

<div className="flex items-start gap-6 flex-wrap max-sm:flex-col">

                     {/* Photo Grid */}
                      <div className="flex-1 space-y-3">
    {/* Carousel Container */}
    <div className="relative">
      {/* Left Arrow */}
      {photos.length > 5 && (
        <button
          onClick={() => (sliderRef.current as any)?.scrollBy({ left: -300, behavior: "smooth" })}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white shadow p-2 rounded-full"
        >
        <IoIosArrowBack />
        </button>
      )}

      {/* Images Scrollable Row */}
      <div
        ref={sliderRef}
        className="flex max-w-4xl max-md:w-[400px] items-start gap-3 overflow-x-auto scrollbar-hide scroll-smooth"
      >
        {photos.slice(0, photos.length).map((photo, index) => (
          <div
            key={index}
            className="relative w-44 h-52 max-sm:w-24 max-md:h- 24 border border-gray-200 rounded-lg overflow-hidden flex-shrink-0"
          >
            <img
              src={renderImageSrc(photo)}
              alt={`Upload ${index + 1}`}
              className="w-full h-full object-cover"
            />

            <button
              onClick={() => onRemovePhoto(index)}
              className="absolute top-2 right-2 w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Right Arrow */}
      {photos.length > 5 && (
        <button
          onClick={() => (sliderRef.current as any)?.scrollBy({ left: 300, behavior: "smooth" })}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white shadow p-2 rounded-full"
        >
        <IoIosArrowForward />

        </button>
      )}
    </div>
                      </div>

                      </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DescriptionStep;
