import SiteHeader from "@/components/SiteHeader";

/**
 * Suspense fallback for /search and /search-results (App.tsx).
 *
 * SearchResults is code-split, and the route previously fell back to the
 * global `<Suspense fallback={null}>` — a blank white screen for however
 * long the chunk + first data fetch took. Renders the real SiteHeader (no
 * chrome pop-in) plus a skeleton that mirrors the actual layout: filter
 * pills → results header → card grid, matching ProductDetailsSkeleton's
 * pattern for the detail routes.
 */

type SkProps = { className?: string };

const SkBlock = ({ className = "" }: SkProps) => (
  <div className={`motion-skeleton rounded-lg ${className}`} />
);

const SkPill = ({ className = "" }: SkProps) => (
  <div className={`motion-skeleton rounded-full ${className}`} />
);

/** Mirrors ResultCard's layout: image → heart dot → title/rating → location → price. */
export const CardSkeleton = () => (
  <div className="space-y-2 p-1.5">
    <div className="relative">
      <SkBlock className="aspect-[4/3] rounded-2xl" />
      <div className="absolute top-2 right-2 w-9 h-9 rounded-full bg-white/40" />
    </div>
    <div className="pt-1.5 space-y-1.5">
      <div className="flex justify-between items-center gap-2">
        <SkBlock className="h-4 w-2/3" />
        <SkBlock className="h-4 w-8 shrink-0" />
      </div>
      <SkBlock className="h-3 w-1/2" />
      <SkBlock className="h-4 w-16" />
    </div>
  </div>
);

const SearchResultsSkeleton = () => (
  <div className="min-h-screen flex flex-col bg-white">
    <div className="fixed top-0 left-0 right-0 z-50">
      <SiteHeader />
    </div>

    {/* Hidden below md — the real page hides this hero widget on mobile too,
        so the skeleton must match or it flashes taller than the real page. */}
    <section className="mt-20 py-6 pt-8 max-md:py-0">
      <div className="flex items-center gap-4 justify-center px-4 max-md:hidden">
        <SkPill className="h-10 w-32" />
        <SkPill className="h-10 w-32" />
        <SkPill className="h-10 w-32" />
      </div>
    </section>

    <div className="px-4 py-8">
      <div className="flex md:px-10 gap-8 max-w-7xl mx-auto">
        <div className="hidden lg:block w-80 flex-shrink-0 space-y-4">
          <SkBlock className="h-6 w-24" />
          <SkBlock className="h-24 w-full" />
          <SkBlock className="h-24 w-full" />
          <SkBlock className="h-24 w-full" />
        </div>

        <div className="flex-1 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <SkBlock className="h-7 w-32" />
            <SkPill className="h-9 w-24 lg:hidden" />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default SearchResultsSkeleton;
