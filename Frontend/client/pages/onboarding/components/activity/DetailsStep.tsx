import React from "react";
import { Label } from "@/components/ui/label";
import { Plus, X } from "lucide-react";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";

interface DetailsStepProps {
  activityName: string;
  description: string;
  coverImage: File | string | null;
  photos: (File | string)[];
  rulesAndRegulations: string[];
  ruleInput: string;
  errors: Record<string, string>;
  photoCarouselRef: React.RefObject<HTMLDivElement>;
  onUpdateFormData: (field: string, value: any) => void;
  onCoverImageUpload: (files: FileList | null) => void;
  onPhotoUpload: (files: FileList | null) => void;
  onRemoveFile: (field: "photos" | "idPhotos" | "coverImage", index?: number) => void;
  onSetRuleInput: (value: string) => void;
  onAddRule: (value: string) => void;
  onRemoveRule: (index: number) => void;
  renderImageSrc: (fileOrUrl: any) => string;
  setErrors: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
}

const DetailsStep: React.FC<DetailsStepProps> = ({
  activityName,
  description,
  coverImage,
  photos,
  rulesAndRegulations,
  ruleInput,
  errors,
  photoCarouselRef,
  onUpdateFormData,
  onCoverImageUpload,
  onPhotoUpload,
  onRemoveFile,
  onSetRuleInput,
  onAddRule,
  onRemoveRule,
  renderImageSrc,
  setErrors,
}) => {
  return (
    <div className="w-full flex flex-col gap-9">
      <div className="flex flex-col items-center gap-5 max-sm:gap-3">
        <h1 className="text-3xl font-bold text-black dark:text-white text-center">
          Activity Details
        </h1>

        <div className="max-w-4xl mx-auto w-full space-y-6">
          {/* Name */}
          <div className="flex flex-col gap-2 w-full">
            <div className="flex items-center gap-2 pl-1">
              <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans']">
                Name
              </label>
            </div>

            <div className="relative w-full">
              <input
                type="text"
                value={activityName}
                onChange={(e) => {
                  onUpdateFormData("activityName", e.target.value);

                  if (errors.activityName) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.activityName;
                      return newErrors;
                    });
                  }
                }}
                placeholder="Name of the Activity"
                required
                maxLength={50}
                className={`w-full h-[50px] px-3 py-4 border ${
                  errors.activityName ? "border-red-500" : "border-[#EAECF0]"
                } rounded-lg text-sm text-[#121213] font-['Plus_Jakarta_Sans']
                focus:outline-none focus:border-[var(--th-accent)]
                dark:bg-gray-800 dark:border-gray-600 dark:text-white`}
              />

              <div className="flex justify-between w-full">
                <div>
                  {errors.activityName && (
                    <span className="text-xs text-red-500">
                      {errors.activityName}
                    </span>
                  )}
                </div>

                <div className="text-right text-xs text-[#334054] dark:text-gray-400 mt-1 px-[6px]">
                  {activityName.length}/50
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-3 w-full">
            <div className="flex items-center gap-2 pl-1">
              <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans']">
                Descriptions
              </label>
            </div>

            <div className="relative w-full">
              <textarea
                value={description}
                onChange={(e) => {
                  onUpdateFormData("description", e.target.value);

                  if (errors.description) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.description;
                      return newErrors;
                    });
                  }
                }}
                placeholder="Write here..."
                maxLength={200}
                className={`w-full h-24 px-3 py-4 border ${
                  errors.description ? "border-red-500" : "border-[#EAECF0]"
                } rounded-lg text-sm text-[#121213] font-['Plus_Jakarta_Sans']
                resize-none focus:outline-none focus:border-[var(--th-accent)]
                dark:bg-gray-800 dark:border-gray-600 dark:text-white`}
              />

              <div className="flex justify-between w-full">
                <div>
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

          {/* Upload Photos */}
          <div className="space-y-4 w-full bg-white">
            {/* COVER PHOTO */}
            <div className="flex items-center justify-between">
              <Label className="text-base text-[#334054] flex flex-col">
                Upload Cover Photo
                <span className="text-[10px] text-gray-500">
                  Please upload a thumbnail image that highlights your services and features.
                </span>
              </Label>

              <div
                className={`relative w-60 h-10 border ${
                  errors.coverImage ? "border-red-500" : "border-gray-200"
                } rounded-lg flex items-center justify-center cursor-pointer`}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onCoverImageUpload(e.target.files)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Plus className="w-5 h-5 text-gray-500" />
                <span className="text-gray-500 text-sm font-medium">
                  Cover Photo
                </span>
              </div>
            </div>

            {errors.coverImage && (
              <span className="text-xs text-red-500">
                {errors.coverImage}
              </span>
            )}

            {/* Cover Preview */}
            <div className="w-full relative h-64 max-w-xl border border-gray-200 rounded-xl overflow-hidden">
              {coverImage ? (
                <img
                  src={renderImageSrc(coverImage)}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                  No image selected
                </div>
              )}

              {coverImage && (
                <button
                  onClick={() => onRemoveFile("coverImage")}
                  className="absolute top-2 right-2 w-7 h-7 bg-white shadow-md hover:bg-gray-100 rounded-full flex items-center justify-center transition"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              )}
            </div>

            {/* ADDITIONAL PHOTOS */}
            <div className="flex items-center justify-between">
              <Label className="text-base text-[#334054] flex flex-col">
                Upload Photos
                <span className="text-[10px] text-gray-500">
                  Please upload photos that best highlight your services and features
                </span>
              </Label>

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
                      setErrors((prev) => {
                        const newErrors = { ...prev };
                        delete newErrors.photos;
                        return newErrors;
                      });
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

            {/* PHOTO CAROUSEL */}
            {photos.length > 0 && (
              <div className="relative">
                {photos.length > 5 && (
                  <button
                    onClick={() =>
                      photoCarouselRef.current?.scrollBy({ left: -300, behavior: "smooth" })
                    }
                    className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white shadow p-2 rounded-full"
                  >
                    <IoIosArrowBack />
                  </button>
                )}

                <div
                  ref={photoCarouselRef}
                  className="flex max-md:w-[350px] gap-3 overflow-x-auto scrollbar-hide scroll-smooth"
                >
                  {photos.map((photo, index) => (
                    <div
                      key={index}
                      className="relative w-44 h-52 border border-gray-200 rounded-lg overflow-hidden flex-shrink-0"
                    >
                      <img
                        src={renderImageSrc(photo)}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-full object-cover"
                      />

                      <button
                        onClick={() => onRemoveFile("photos", index)}
                        className="absolute top-2 right-2 w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center"
                      >
                        <X className="w-4 h-4 text-gray-700" />
                      </button>
                    </div>
                  ))}
                </div>

                {photos.length > 5 && (
                  <button
                    onClick={() =>
                      photoCarouselRef.current?.scrollBy({ left: 300, behavior: "smooth" })
                    }
                    className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white shadow p-2 rounded-full"
                  >
                    <IoIosArrowForward />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Rules and Regulations */}
          <div className="space-y-4 border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between">
              <Label className="text-base text-[#334054]">
                Rules & Regulations
                <span className="text-sm text-gray-500 ml-2">
                  (Optional)
                </span>
              </Label>
            </div>

            <div className="space-y-2">
              {rulesAndRegulations.map((rule, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <span className="text-sm text-[#4B4B4B] dark:text-gray-300 flex-1 break-words">
                    {rule}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveRule(index)}
                    className="text-red-500 hover:text-red-700 font-bold px-2 flex-shrink-0 mt-0.5"
                    title="Remove rule"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a rule or regulation..."
                maxLength={100}
                value={ruleInput}
                onChange={(e) => onSetRuleInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const value = ruleInput.trim();
                    if (value) {
                      onAddRule(value);
                      onSetRuleInput("");
                    }
                  }
                }}
                className="flex-1 h-[38px] px-3 py-2 border border-gray-200 rounded-lg text-sm text-[#121213] focus:outline-none focus:border-[var(--th-accent)] dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              />
              <button
                type="button"
                onClick={() => {
                  const value = ruleInput.trim();
                  if (value) {
                    onAddRule(value);
                    onSetRuleInput("");
                  }
                }}
                className="px-4 py-2 rounded-lg text-sm font-medium onb-btn-primary"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailsStep;
