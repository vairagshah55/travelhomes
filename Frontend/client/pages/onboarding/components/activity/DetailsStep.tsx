import React from "react";
import { ImagePlus, Plus, X, Check } from "lucide-react";
import { getImageUrl } from "@/lib/utils";

interface DetailsStepProps {
  activityName: string;
  description: string;
  coverImage: File | string | null;
  photos: (File | string)[];
  rulesAndRegulations: string[];
  ruleInput: string;
  errors: Record<string, string>;
  photoCarouselRef?: React.RefObject<HTMLDivElement>;
  onUpdateFormData: (field: string, value: any) => void;
  onCoverImageUpload: (files: FileList | null) => void;
  onPhotoUpload: (files: FileList | null) => void;
  onRemoveFile: (field: "photos" | "idPhotos" | "coverImage", index?: number) => void;
  onSetRuleInput: (value: string) => void;
  onAddRule: (value: string) => void;
  onRemoveRule: (index: number) => void;
  renderImageSrc?: (fileOrUrl: any) => string;
  setErrors: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
}

const localRenderSrc = (fileOrUrl: any): string => {
  if (!fileOrUrl) return "";
  if (typeof fileOrUrl === "string") return getImageUrl(fileOrUrl);
  return URL.createObjectURL(fileOrUrl);
};

const GALLERY_TARGET = 5;

const DetailsStep: React.FC<DetailsStepProps> = ({
  activityName,
  description,
  coverImage,
  photos,
  rulesAndRegulations,
  ruleInput,
  errors,
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
  const getImgSrc = renderImageSrc ?? localRenderSrc;
  const galleryFilled = Math.min(photos.length, GALLERY_TARGET);
  const galleryPct = (galleryFilled / GALLERY_TARGET) * 100;

  const clearError = (field: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleAddRule = () => {
    const value = ruleInput.trim();
    if (value) {
      onAddRule(value);
      onSetRuleInput("");
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-3xl">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl lg:text-[32px] font-bold text-black dark:text-white leading-tight">
          Activity Details
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Tell guests about your activity
        </p>
      </div>

      <div className="w-full flex flex-col gap-7">
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Activity Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={activityName}
            onChange={(e) => {
              onUpdateFormData("activityName", e.target.value);
              if (errors.activityName) clearError("activityName");
            }}
            placeholder="e.g. Sunrise Trek to Triund"
            maxLength={50}
            className={`w-full h-11 px-3.5 border rounded-xl text-sm bg-white dark:bg-gray-800 dark:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--th-accent)]/20 ${
              errors.activityName
                ? "border-red-400 focus:border-red-400"
                : "border-gray-200 dark:border-gray-600 focus:border-[var(--th-accent)]"
            }`}
          />
          <div className="flex justify-between items-center">
            {errors.activityName ? (
              <p className="text-xs text-red-500">{errors.activityName}</p>
            ) : (
              <span />
            )}
            <span className="text-xs text-gray-400 ml-auto">{activityName.length}/50</span>
          </div>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => {
              onUpdateFormData("description", e.target.value);
              if (errors.description) clearError("description");
            }}
            placeholder="Describe your activity — the experience, highlights, what to expect…"
            maxLength={200}
            rows={3}
            className={`w-full px-3.5 py-3 border rounded-xl text-sm bg-white dark:bg-gray-800 dark:text-white resize-none transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--th-accent)]/20 ${
              errors.description
                ? "border-red-400 focus:border-red-400"
                : "border-gray-200 dark:border-gray-600 focus:border-[var(--th-accent)]"
            }`}
          />
          <div className="flex justify-between items-center">
            {errors.description ? (
              <p className="text-xs text-red-500">{errors.description}</p>
            ) : (
              <span />
            )}
            <span className="text-xs text-gray-400 ml-auto">{description.length}/200</span>
          </div>
        </div>

        {/* Cover Photo */}
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Cover Photo
            </label>
            <p className="text-xs text-gray-400 mt-0.5">Main image shown to guests</p>
          </div>

          <div
            className={`relative w-full h-56 rounded-2xl overflow-hidden border-2 border-dashed bg-gray-50 dark:bg-gray-800/50 group ${
              errors.coverImage
                ? "border-red-400"
                : "border-gray-200 dark:border-gray-700"
            }`}
          >
            {coverImage ? (
              <>
                <img
                  src={getImgSrc(coverImage)}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center">
                  <label className="cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 text-gray-800 text-xs font-semibold px-4 py-2 rounded-full shadow">
                    Change Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => onCoverImageUpload(e.target.files)}
                      className="hidden"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveFile("coverImage")}
                  className="absolute top-2.5 right-2.5 w-7 h-7 bg-white/90 hover:bg-white rounded-full shadow flex items-center justify-center transition-all"
                >
                  <X size={13} className="text-gray-600" />
                </button>
              </>
            ) : (
              <label className="w-full h-full flex flex-col items-center justify-center gap-2 cursor-pointer">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <ImagePlus size={22} className="text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Upload cover photo</p>
                <p className="text-xs text-gray-400">Click to browse</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => onCoverImageUpload(e.target.files)}
                  className="hidden"
                />
              </label>
            )}
          </div>
          {errors.coverImage && (
            <p className="text-xs text-red-500">{errors.coverImage}</p>
          )}
        </div>

        {/* Gallery */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Gallery Photos
              </label>
              <p className="text-xs text-gray-400 mt-0.5">
                {photos.length} photo{photos.length !== 1 ? "s" : ""} added
                {photos.length < GALLERY_TARGET && ` · ${GALLERY_TARGET - photos.length} more recommended`}
              </p>
            </div>
            <label
              className={`relative flex items-center gap-1.5 px-3 h-8 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                errors.photos
                  ? "border-red-400 text-red-500"
                  : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400"
              }`}
            >
              <Plus size={13} />
              Add Photos
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  onPhotoUpload(e.target.files);
                  if (errors.photos) clearError("photos");
                }}
                className="hidden"
              />
            </label>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${galleryPct}%`,
                  backgroundColor: galleryFilled >= GALLERY_TARGET ? "#22c55e" : "var(--th-accent)",
                }}
              />
            </div>
            <span className="text-xs font-medium text-gray-500 whitespace-nowrap">
              {galleryFilled}/{GALLERY_TARGET}
            </span>
          </div>

          {errors.photos && <p className="text-xs text-red-500">{errors.photos}</p>}

          {photos.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {photos.map((photo, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 group"
                >
                  <img
                    src={getImgSrc(photo)}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {index < GALLERY_TARGET && (
                    <div className="absolute top-1.5 left-1.5 w-4.5 h-4.5 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
                      <Check size={9} className="text-white" strokeWidth={2.5} />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => onRemoveFile("photos", index)}
                    className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={11} className="text-white" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center gap-2">
              <ImagePlus size={24} className="text-gray-300" />
              <p className="text-sm text-gray-400">No gallery photos yet</p>
            </div>
          )}
        </div>

        {/* Rules */}
        <div className="flex flex-col gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Rules &amp; Regulations
              </label>
              <p className="text-xs text-gray-400 mt-0.5">Optional</p>
            </div>
          </div>

          {rulesAndRegulations.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {rulesAndRegulations.map((rule, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2.5 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl"
                >
                  <span className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                    {index + 1}
                  </span>
                  <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 break-words">
                    {rule}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveRule(index)}
                    className="w-6 h-6 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center transition-colors flex-shrink-0"
                  >
                    <X size={12} className="text-gray-400 hover:text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={ruleInput}
              onChange={(e) => onSetRuleInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddRule();
                }
              }}
              placeholder="Add a rule… press Enter to add"
              maxLength={100}
              className="flex-1 h-10 px-3.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:border-[var(--th-accent)] transition-colors"
            />
            <button
              type="button"
              onClick={handleAddRule}
              className="h-10 px-4 rounded-xl text-sm font-medium onb-btn-primary"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailsStep;
