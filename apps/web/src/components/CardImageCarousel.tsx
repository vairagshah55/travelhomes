import React, { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { getImageUrl } from "@/lib/utils";

/** Horizontal travel (px) before a drag counts as a swipe rather than a tap. */
const SWIPE_THRESHOLD = 40;

function CardImageCarousel({ images, alt }: { images: string[]; alt: string }) {
  const display = Array.isArray(images) ? images.filter(Boolean).slice(0, 5) : [];
  const list = display.length > 0 ? display : ["/placeholder.svg"];
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState<Record<number, boolean>>({});
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const step = (delta: number) => setIndex((i) => (i + delta + list.length) % list.length);

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    step(-1);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    step(1);
  };

  /* Touch: swipe through the gallery. The card sits in a horizontal rail, so
     only act on a gesture that is clearly horizontal *and* clearly a drag —
     otherwise let the rail scroll or the link fire. */
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStart.current;
    touchStart.current = null;
    if (!start || list.length < 2) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    e.preventDefault();
    e.stopPropagation();
    step(dx < 0 ? 1 : -1);
  };

  return (
    <div
      // Tried 16:9 to save vertical space on the landing page, but the
      // shorter, wider crop looked off on card thumbnails — reverted to 4:3.
      className="relative w-full aspect-[4/3] overflow-hidden rounded-xl group cursor-pointer img-shimmer-wrap"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Image with hover zoom. A dead URL used to leave a card-sized white
          void with alt text in it — on a phone that reads as a broken page,
          so a failed load falls back to a branded tile instead. */}
      {failed[index] ? (
        <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#e6fafa] to-[#cfeff0]">
          <ImageOff className="w-6 h-6 text-[#117479]/50" />
          <span className="px-4 text-[11px] font-medium text-[#117479]/70 text-center line-clamp-2">
            {alt}
          </span>
        </div>
      ) : (
        <img
          src={getImageUrl(list[index])}
          alt={alt}
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={() => setFailed((f) => ({ ...f, [index]: true }))}
          className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
        />
      )}

      {/* Shimmer sweep overlay — lives inside overflow:hidden container */}
      <div className="img-shimmer-sweep" />

      {list.length > 1 && (
        <>
          {/* Arrows are a pointer affordance; touch users swipe instead, so
              they stay hidden below md rather than covering the photo. */}
          <button
            onClick={handlePrev}
            aria-label="Previous photo"
            className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full
              items-center justify-center backdrop-blur-md
              bg-white/80 text-gray-700
              opacity-0 group-hover:opacity-100
              hover:bg-white hover:scale-110
              active:scale-95
              transition-all duration-200 ease-out shadow-sm z-10"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={handleNext}
            aria-label="Next photo"
            className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full
              items-center justify-center backdrop-blur-md
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
              i === index ? "w-[7px] h-[7px] bg-white shadow-sm" : "w-1.5 h-1.5 bg-white/50"
            }`}
          />
        ))}
      </div>

      {/* Image counter on hover */}
      {list.length > 1 && (
        <div
          className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-[10px] font-medium
          bg-black/40 text-white/90 backdrop-blur-sm
          opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
        >
          {index + 1}/{list.length}
        </div>
      )}
    </div>
  );
}

export default CardImageCarousel;
