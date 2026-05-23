import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getImageUrl } from "@/lib/utils";

function CardImageCarousel({ images, alt }: { images: string[]; alt: string }) {
  const display = Array.isArray(images)
    ? images.filter(Boolean).slice(0, 5)
    : [];
  const list = display.length > 0 ? display : ["/placeholder.svg"];
  const [index, setIndex] = useState(0);

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => (i - 1 + list.length) % list.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIndex((i) => (i + 1) % list.length);
  };

  return (
    <div className="relative w-full aspect-[4/3] overflow-hidden rounded-xl group cursor-pointer img-shimmer-wrap">
      {/* Image with hover zoom */}
      <img
        src={getImageUrl(list[index])}
        alt={alt}
        className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
      />

      {/* Shimmer sweep overlay — lives inside overflow:hidden container */}
      <div className="img-shimmer-sweep" />

      {list.length > 1 && (
        <>
          {/* Left arrow */}
          <button
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full
              flex items-center justify-center backdrop-blur-md
              bg-white/80 text-gray-700
              opacity-0 group-hover:opacity-100
              hover:bg-white hover:scale-110
              active:scale-95
              transition-all duration-200 ease-out shadow-sm z-10"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Right arrow */}
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full
              flex items-center justify-center backdrop-blur-md
              bg-white/80 text-gray-700
              opacity-0 group-hover:opacity-100
              hover:bg-white hover:scale-110
              active:scale-95
              transition-all duration-200 ease-out shadow-sm z-10"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Dot indicators */}
      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
        {list.map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-300 ${
              i === index
                ? "w-[7px] h-[7px] bg-white shadow-sm"
                : "w-1.5 h-1.5 bg-white/50"
            }`}
          />
        ))}
      </div>

      {/* Image counter on hover */}
      {list.length > 1 && (
        <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-medium
          bg-black/40 text-white/90 backdrop-blur-sm
          opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          {index + 1}/{list.length}
        </div>
      )}
    </div>
  );
}

export default CardImageCarousel;
