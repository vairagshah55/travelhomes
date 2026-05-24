import React from "react";
import { motion } from "framer-motion";
import { getImageUrl } from "@/lib/utils";

interface ImageGalleryHeroProps {
  coverUrl?: string;
  galleryUrls?: string[];
  name?: string;
  /** Fallback alt text when `name` is empty, e.g. "Stay" | "Van" | "Activity". */
  altFallback: string;
  /** Used in the "View all N photos" label. */
  totalPhotoCount: number;
  onPhotoClick: (index: number) => void;
  /** UniqueStay shows a row of photo dots on the mobile hero; the others don't. */
  showMobileDots?: boolean;
}

/**
 * Mobile hero + desktop 4-up grid that opens the PhotoGallery modal on click.
 * Used on all three product detail pages.
 */
export function ImageGalleryHero({
  coverUrl,
  galleryUrls,
  name,
  altFallback,
  totalPhotoCount,
  onPhotoClick,
  showMobileDots = false,
}: ImageGalleryHeroProps) {
  const altName = name || altFallback;
  const heroSrc = getImageUrl(coverUrl) || getImageUrl(galleryUrls?.[0]);
  const coverOffset = coverUrl ? 1 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
      className="mb-4 w-full max-w-[1280px]"
    >
      {/* Mobile hero */}
      <div
        className="md:hidden relative rounded-2xl overflow-hidden aspect-[16/10]"
        onClick={() => onPhotoClick(0)}
      >
        <img
          src={heroSrc}
          alt={altName}
          className="w-full h-full object-cover"
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
        {showMobileDots ? (
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <div className="flex gap-1.5">
              {Array.from({ length: Math.min(totalPhotoCount, 5) }).map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${i === 0 ? "bg-white" : "bg-white/40"}`}
                />
              ))}
            </div>
            <button className="bg-white/90 backdrop-blur-sm text-black text-xs font-medium px-3 py-1.5 rounded-full shadow-sm">
              {totalPhotoCount} photos
            </button>
          </div>
        ) : (
          <div className="absolute bottom-3 right-3">
            <button className="bg-white/90 backdrop-blur-sm text-black text-xs font-medium px-3 py-1.5 rounded-full shadow-sm">
              {totalPhotoCount} photos
            </button>
          </div>
        )}
      </div>

      {/* Desktop 4-up grid */}
      <div className="hidden md:grid grid-cols-4 gap-2 lg:gap-3 h-[340px] lg:h-[420px]">
        <div className="col-span-2 row-span-2 relative overflow-hidden rounded-xl cursor-pointer group">
          <img
            src={heroSrc}
            onClick={() => onPhotoClick(0)}
            alt={`${altName} Main`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
          />
        </div>
        {[1, 2].map((i) => (
          <div key={i} className="relative overflow-hidden rounded-xl cursor-pointer group">
            <img
              src={getImageUrl(galleryUrls?.[i])}
              onClick={() => onPhotoClick(i + coverOffset)}
              alt={`${altName} ${i}`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              draggable={false}
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>
        ))}
        <div className="col-span-2 relative overflow-hidden rounded-xl cursor-pointer group">
          <img
            src={getImageUrl(galleryUrls?.[3])}
            onClick={() => onPhotoClick(3 + coverOffset)}
            alt={altName}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            draggable={false}
            onContextMenu={(e) => e.preventDefault()}
          />
          <button
            onClick={() => onPhotoClick(0)}
            className="absolute bottom-3 right-3 bg-white/90 backdrop-blur-sm text-black text-sm font-medium px-4 py-2 rounded-full shadow-sm hover:bg-white hover:shadow-md transition-all duration-200"
          >
            View all {totalPhotoCount} photos
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export default ImageGalleryHero;
