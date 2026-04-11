import React, { useEffect, useState } from "react";
import { cmsPublicApi } from "../lib/api";
import { getImageUrl } from "@/lib/utils";

interface GalleryProps {
  page?: string;
}

function ShimmerImage({ src, alt, className }: { src: string; alt: string; className: string }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`}>
      {/* Skeleton shimmer */}
      {!loaded && !error && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 animate-pulse">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 dark:via-white/10 to-transparent animate-[shimmer_1.5s_infinite]"
            style={{ transform: 'translateX(-100%)', animation: 'shimmer 1.5s infinite' }}
          />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-all duration-500 ${loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        draggable={false}
      />
      {/* Subtle hover overlay */}
      <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-300" />
    </div>
  );
}

const Gallery: React.FC<GalleryProps> = ({ page = "Login" }) => {
  const [images, setImages] = useState<string[]>([
    "https://api.builder.io/api/v1/image/assets/TEMP/b85a174d73e23c66bc3315c90718740d54f6a815?width=641",
    "https://api.builder.io/api/v1/image/assets/TEMP/c3d61f456ed7d675a05311cbee859a54922fae15?width=641",
    "https://api.builder.io/api/v1/image/assets/TEMP/35e201b656cfa241c03e3280e3bf67ec0b0f6d87?width=641",
    "https://api.builder.io/api/v1/image/assets/TEMP/b9c3c4635b522e51c991a0b4dc045218d6d9168a?width=641",
    "https://api.builder.io/api/v1/image/assets/TEMP/76e92c1f16f6a4fc58280175233debd228ea6fb4?width=641",
  ]);

  const fetchImages = React.useCallback(async () => {
    try {
      const response = await cmsPublicApi.listMedia({ page });
      if (response.success && response.data.length > 0) {
        const sortedMedia = [...response.data].sort((a, b) => (a.position || 0) - (b.position || 0));
        const urls = sortedMedia.map(item => {
          const separator = item.url.includes('?') ? '&' : '?';
          return `${item.url}${separator}t=${Date.now()}`;
        });
        if (urls.length > 0) {
          const defaults = [
            "https://api.builder.io/api/v1/image/assets/TEMP/b85a174d73e23c66bc3315c90718740d54f6a815?width=641",
            "https://api.builder.io/api/v1/image/assets/TEMP/c3d61f456ed7d675a05311cbee859a54922fae15?width=641",
            "https://api.builder.io/api/v1/image/assets/TEMP/35e201b656cfa241c03e3280e3bf67ec0b0f6d87?width=641",
            "https://api.builder.io/api/v1/image/assets/TEMP/b9c3c4635b522e51c991a0b4dc045218d6d9168a?width=641",
            "https://api.builder.io/api/v1/image/assets/TEMP/76e92c1f16f6a4fc58280175233debd228ea6fb4?width=641",
          ];
          const finalImages = [...urls];
          while (finalImages.length < 5) {
            finalImages.push(defaults[finalImages.length]);
          }
          setImages(finalImages.slice(0, 5));
        }
      }
    }
     catch (error) {
      console.error("Failed to fetch gallery images:", error);
    }
  }, [page]);

  useEffect(() => {
    fetchImages();
    const interval = setInterval(fetchImages, 5000);
    return () => clearInterval(interval);
  }, [page, fetchImages]);

  return (
    <div className="hidden lg:flex w-1/2 gap-4 mt-6">
      {/* Left column */}
      <div className="flex flex-col gap-4 w-1/2">
        {images.slice(0, 3).map((img, i) => (
          <ShimmerImage
            key={`left-${i}-${img}`}
            src={getImageUrl(img)}
            alt="Travel"
            className="h-[170px] w-full shadow-sm"
          />
        ))}
      </div>

      {/* Right column */}
      <div className="flex flex-col gap-4 w-1/2">
        {images.slice(3).map((img, i) => (
          <ShimmerImage
            key={`right-${i}-${img}`}
            src={getImageUrl(img)}
            alt="Travel"
            className="h-[260px] w-full shadow-sm"
          />
        ))}
      </div>
    </div>
  );
};

export default Gallery;
