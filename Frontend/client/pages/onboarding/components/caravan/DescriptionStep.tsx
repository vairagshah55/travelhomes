import React from "react";
import { ImagePlus, X, Plus, Check } from "lucide-react";
import { getImageUrl } from "@/lib/utils";

interface DescriptionStepProps {
  name: string;
  description: string;
  rules: string[];
  photos: (string | File)[];
  coverImage: (string | File)[];
  errors: Record<string, string>;
  sliderRef?: React.RefObject<HTMLDivElement>;
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

const renderImageSrc = (fileOrUrl: any): string => {
  if (!fileOrUrl) return "";
  if (typeof fileOrUrl === "string") return getImageUrl(fileOrUrl);
  return URL.createObjectURL(fileOrUrl);
};

const GALLERY_TARGET = 5;

const DescriptionStep: React.FC<DescriptionStepProps> = ({
  name,
  description,
  rules,
  photos,
  coverImage,
  errors,
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
  const galleryFilled = Math.min(photos.length, GALLERY_TARGET);
  const galleryPct = (galleryFilled / GALLERY_TARGET) * 100;

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-3xl">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl lg:text-[32px] font-bold text-black dark:text-white leading-tight">
          Caravan Details
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Tell guests about your caravan
        </p>
      </div>

      <div className="w-full flex flex-col gap-7">
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => {
              onNameChange(e.target.value);
              if (errors.name) clearError("name");
            }}
            placeholder="e.g. Cozy Mountain Camper"
            maxLength={50}
            className={`w-full h-11 px-3.5 border rounded-xl text-sm bg-white dark:bg-gray-800 dark:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--th-accent)]/20 ${
              errors.name
                ? "border-red-400 focus:border-red-400"
                : "border-gray-200 dark:border-gray-600 focus:border-[var(--th-accent)]"
            }`}
          />
          <div className="flex justify-between items-center">
            {errors.name ? (
              <p className="text-xs text-red-500">{errors.name}</p>
            ) : (
              <span />
            )}
            <span className="text-xs text-gray-400 ml-auto">{name.length}/50</span>
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
              onDescriptionChange(e.target.value);
              if (errors.description) clearError("description");
            }}
            placeholder="Describe your caravan — features, vibe, what makes it special…"
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

        {/* Rules */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Rules &amp; Regulations
            </label>
            <button
              type="button"
              onClick={onAddRule}
              className="flex items-center gap-1 text-xs font-medium transition-colors"
              style={{ color: "var(--th-accent)" }}
            >
              <Plus size={13} />
              Add rule
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {rules.map((rule, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-xs font-semibold flex items-center justify-center flex-shrink-0">
                  {index + 1}
                </span>
                <input
                  type="text"
                  value={rule}
                  onChange={(e) => onUpdateRule(index, e.target.value)}
                  placeholder={`Rule ${index + 1}…`}
                  maxLength={250}
                  className="flex-1 h-10 px-3 border border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 dark:text-white focus:outline-none focus:border-[var(--th-accent)] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => onRemoveRule(index)}
                  className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center justify-center transition-colors"
                >
                  <X size={14} className="text-gray-400 hover:text-red-500" />
                </button>
              </div>
            ))}

            {rules.length === 0 && (
              <div className="py-6 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex items-center justify-center">
                <p className="text-sm text-gray-400">No rules yet — click "Add rule" above</p>
              </div>
            )}
          </div>
        </div>

        {/* Cover Photo */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Cover Photo
              </label>
              <p className="text-xs text-gray-400 mt-0.5">Main image shown to guests</p>
            </div>
          </div>

          <div className="relative w-full h-56 rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 group">
            {coverImage?.[0] ? (
              <>
                <img
                  src={renderImageSrc(coverImage[0])}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center">
                  <label className="cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 text-gray-800 text-xs font-semibold px-4 py-2 rounded-full shadow">
                    Change Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => onCoverUpload(e.target.files)}
                      className="hidden"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  onClick={() => onRemoveCover(0)}
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
                  onChange={(e) => onCoverUpload(e.target.files)}
                  className="hidden"
                />
              </label>
            )}
          </div>
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
            <label className={`relative flex items-center gap-1.5 px-3 h-8 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
              errors.photos
                ? "border-red-400 text-red-500"
                : "border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400"
            }`}>
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

          {errors.photos && (
            <p className="text-xs text-red-500">{errors.photos}</p>
          )}

          {photos.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {photos.map((photo, index) => (
                <div
                  key={index}
                  className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 group"
                >
                  <img
                    src={renderImageSrc(photo)}
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
                    onClick={() => onRemovePhoto(index)}
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
      </div>
    </div>
  );
};

export default DescriptionStep;
