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
    <div className="relative w-full max-md:h-44 h-44 overflow-hidden rounded-xl group">
      <div className="z-10">
        <img
          src={getImageUrl(list[index])}
          alt={alt}
          className="z-10 w-full max-md:h-44 h-44 object-cover transition-transform duration-100 group-hover:scale-105"
        />
      </div>

      {list.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-1 top-1/2 -translate-y-1/2 
          bg-white/30 text-black/30 p-1 rounded-lg
              hover:bg-black/60 hover:text-white
              transition font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={handleNext}
            className="absolute right-1 top-1/2 -translate-y-1/2 
              bg-white/30 text-black/30 p-1 rounded-lg
              hover:bg-black/60 hover:text-white
              transition font-medium"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </>
      )}

      <div className="absolute bottom-3 z-10 left-1/2 transform -translate-x-1/2 flex gap-2">
        {list.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === index ? "bg-white scale-110" : "bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default CardImageCarousel;
