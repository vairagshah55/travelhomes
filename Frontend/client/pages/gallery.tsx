import React, { useEffect, useState } from "react";
import { cmsPublicApi } from "../lib/api";
import { getImageUrl } from "@/lib/utils";

interface GalleryProps {
  page?: string;
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
      {/* Left */}
      <div className="flex flex-col gap-4 w-1/2">
        {images.slice(0, 3).map((img, i) => (
          <img
            key={i}
            src={getImageUrl(img)}
            alt="Travel"
            className="h-[170px] w-full rounded-2xl object-cover shadow-sm"
          />
        ))}
      </div>

      {/* Right */}
      <div className="flex flex-col gap-4 w-1/2">
        {images.slice(3).map((img, i) => (
          <img
            key={i}
            src={getImageUrl(img)}
            alt="Travel"
            className="h-[260px] w-full rounded-2xl object-cover shadow-sm "
          />
        ))}
      </div>
    </div>
  );
};

export default Gallery;
