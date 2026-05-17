import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface ImageGalleryProps {
  images: string[];
  alt?: string;
  onShowAll?: () => void;
  className?: string;
}

/** Fills an array up to `count` length with `fill`. */
function padArray<T>(arr: T[], count: number, fill: T): T[] {
  if (arr.length >= count) return arr.slice(0, count);
  return [...arr, ...Array(count - arr.length).fill(fill)];
}

const PLACEHOLDER = '__placeholder__';

export default function ImageGallery({
  images,
  alt = 'Property image',
  onShowAll,
  className = '',
}: ImageGalleryProps) {
  const [mobileIndex, setMobileIndex] = useState(0);

  // Ensure we always have exactly 5 slots (1 large + 4 thumbnails)
  const slots = padArray(images, 5, PLACEHOLDER);
  const [mainImg, ...thumbImgs] = slots;

  const totalMobile = images.length;

  function goPrev() {
    setMobileIndex((i) => (i - 1 + totalMobile) % totalMobile);
  }

  function goNext() {
    setMobileIndex((i) => (i + 1) % totalMobile);
  }

  return (
    <div className={`relative ${className}`}>
      {/* ── DESKTOP GRID (md+) ────────────────────────────────── */}
      <div className="hidden md:grid grid-cols-2 gap-2 rounded-[16px] overflow-hidden">
        {/* Large left image */}
        <div className="row-span-2 overflow-hidden rounded-l-2xl">
          {mainImg === PLACEHOLDER ? (
            <div className="w-full h-full bg-ds-sky" aria-hidden="true" />
          ) : (
            <img
              src={mainImg}
              alt={`${alt} 1`}
              loading="lazy"
              className="object-cover w-full h-full"
            />
          )}
        </div>

        {/* 2×2 right thumbnails */}
        <div className="grid grid-cols-2 gap-2 row-span-2">
          {thumbImgs.map((src, idx) => {
            // Assign corner rounding only to exposed outer corners
            const isTopRight = idx === 1;
            const isBottomRight = idx === 3;
            const cornerClass = isTopRight
              ? 'rounded-tr-2xl'
              : isBottomRight
              ? 'rounded-br-2xl'
              : '';

            return (
              <div
                key={idx}
                className={`overflow-hidden h-48 md:h-auto ${cornerClass}`}
              >
                {src === PLACEHOLDER ? (
                  <div className="w-full h-full bg-ds-sky" aria-hidden="true" />
                ) : (
                  <img
                    src={src}
                    alt={`${alt} ${idx + 2}`}
                    loading="lazy"
                    className="object-cover w-full h-full"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* "Show all photos" button — desktop only */}
      {onShowAll && (
        <button
          type="button"
          onClick={onShowAll}
          className={[
            'hidden md:flex items-center gap-1.5',
            'absolute bottom-3 right-3',
            'bg-white/90 backdrop-blur-sm',
            'border border-ds-pebble',
            'text-ds-charcoal text-sm font-medium font-sans',
            'rounded-lg px-3 py-1.5',
            'transition-colors duration-150 hover:bg-white',
          ].join(' ')}
        >
          <span aria-hidden="true">☰</span>
          Show all photos
        </button>
      )}

      {/* ── MOBILE CAROUSEL (< md) ────────────────────────────── */}
      <div className="md:hidden relative">
        <div className="overflow-hidden rounded-xl aspect-[4/3] w-full">
          {images.length === 0 ? (
            <div className="w-full h-full bg-ds-sky" aria-hidden="true" />
          ) : (
            <img
              src={images[mobileIndex]}
              alt={`${alt} ${mobileIndex + 1}`}
              loading="lazy"
              className="object-cover w-full h-full"
            />
          )}
        </div>

        {/* Prev / Next arrows */}
        {totalMobile > 1 && (
          <>
            <button
              type="button"
              onClick={goPrev}
              aria-label="Previous image"
              className={[
                'absolute left-2 top-1/2 -translate-y-1/2',
                'w-8 h-8 flex items-center justify-center',
                'bg-white/80 backdrop-blur-sm rounded-full',
                'shadow-sm transition-colors duration-150 hover:bg-white',
              ].join(' ')}
            >
              <ChevronLeft size={18} className="text-ds-charcoal" />
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label="Next image"
              className={[
                'absolute right-2 top-1/2 -translate-y-1/2',
                'w-8 h-8 flex items-center justify-center',
                'bg-white/80 backdrop-blur-sm rounded-full',
                'shadow-sm transition-colors duration-150 hover:bg-white',
              ].join(' ')}
            >
              <ChevronRight size={18} className="text-ds-charcoal" />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {totalMobile > 1 && (
          <div className="flex justify-center gap-1.5 mt-2.5" role="tablist" aria-label="Image navigation">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === mobileIndex}
                aria-label={`Image ${i + 1}`}
                onClick={() => setMobileIndex(i)}
                className={[
                  'w-1.5 h-1.5 rounded-full transition-colors duration-150',
                  i === mobileIndex ? 'bg-ds-deep' : 'bg-ds-pebble',
                ].join(' ')}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
