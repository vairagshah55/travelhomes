import Header from "@/components/Header";
import Footer from "@/components/Footer";

/**
 * Unified loading skeleton for /campervan/:id, /unique-stay/:id, /activity/:id.
 *
 * Renders the real Header + Footer chrome so navigation doesn't pop in when
 * data resolves. Skeleton blocks between mirror the actual page layout:
 * Back link → TitleMetaHeader → badge chips → ImageGalleryHero (hero+thumbs)
 * → 2-col (StickyNavBar + sections + BookingWidget) → related items teaser.
 *
 * Used both as:
 *   - the Suspense fallback for product-detail routes (App.tsx)
 *   - the in-component loading state while react-query fetches stay/vendor
 * So cold-visit loads as ONE uninterrupted skeleton, not two flashing ones.
 */

type SkProps = { className?: string; style?: React.CSSProperties };

const SkBlock = ({ className = "", style }: SkProps) => (
  <div className={`bg-ocean-100 rounded-lg animate-pulse ${className}`} style={style} />
);

const SkPill = ({ className = "", style }: SkProps) => (
  <div className={`bg-ocean-100 rounded-full animate-pulse ${className}`} style={style} />
);

const Section = ({ children }: { children: React.ReactNode }) => (
  <div className="space-y-3 pb-8 border-b border-th-border">{children}</div>
);

export const ProductDetailsSkeleton = () => (
  <div className="min-h-screen flex flex-col bg-th-surface-1">
    {/* Real header — no skeleton, no chrome pop-in */}
    <Header callbackFun={() => {}} onNavigate={() => {}} />

    <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 py-5">
      {/* Back link */}
      <SkBlock className="h-4 w-14 mb-4" />

      {/* TitleMetaHeader: category badge, name, location/rating/price, actions */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-5">
        <div className="flex-1 space-y-3">
          <SkPill className="h-5 w-24" />
          <SkBlock className="h-8 w-3/4 max-w-lg" />
          <div className="flex flex-wrap items-center gap-4 pt-1">
            <SkBlock className="h-4 w-40" />
            <SkBlock className="h-4 w-32" />
            <SkBlock className="h-4 w-28" />
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <SkPill className="h-10 w-24" />
          <SkPill className="h-10 w-20" />
          <SkPill className="h-10 w-10" />
        </div>
      </div>

      {/* Badge chip row */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <SkPill className="h-7 w-28" />
        <SkPill className="h-7 w-24" />
        <SkPill className="h-7 w-20" />
        <SkPill className="h-7 w-24" />
        <SkPill className="h-7 w-32" />
      </div>

      {/* ImageGalleryHero: hero left (2 cols, 2 rows) + 4 thumbs right */}
      <div
        className="grid grid-cols-4 grid-rows-2 gap-2 sm:gap-3 mb-8 rounded-2xl overflow-hidden"
        style={{ height: 420 }}
      >
        <SkBlock className="col-span-2 row-span-2 rounded-l-2xl rounded-r-none !rounded-l-2xl h-full" />
        <SkBlock className="rounded-none h-full" />
        <SkBlock className="rounded-none rounded-tr-2xl h-full" />
        <SkBlock className="rounded-none h-full" />
        <SkBlock className="rounded-none rounded-br-2xl h-full" />
      </div>

      {/* 2-col: content + booking widget */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-3">
        {/* LEFT — sections */}
        <div className="lg:col-span-2 space-y-10">
          {/* StickyNavBar — 6 tabs with underline indicator */}
          <div className="flex items-center gap-6 border-b border-th-border pb-3">
            {[64, 56, 72, 60, 80, 52].map((w, i) => (
              <SkBlock key={i} className="h-4" style={{ width: w }} />
            ))}
          </div>

          {/* Overview */}
          <Section>
            <SkBlock className="h-6 w-44 mb-2" />
            <SkBlock className="h-4 w-full" />
            <SkBlock className="h-4 w-full" />
            <SkBlock className="h-4 w-11/12" />
            <SkBlock className="h-4 w-3/4" />
          </Section>

          {/* Amenities — heading + 6 icon/label rows */}
          <Section>
            <SkBlock className="h-6 w-32 mb-3" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <SkBlock className="h-10 w-10 rounded-xl shrink-0" />
                  <SkBlock className="h-4 w-24" />
                </div>
              ))}
            </div>
          </Section>

          {/* Inclusions / Exclusions teaser */}
          <Section>
            <SkBlock className="h-6 w-28 mb-3" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <SkBlock className="h-4 w-4 rounded-full shrink-0" />
                <SkBlock className="h-4" style={{ width: 200 + ((i * 37) % 120) }} />
              </div>
            ))}
          </Section>

          {/* Reviews */}
          <Section>
            <SkBlock className="h-6 w-28 mb-3" />
            <div className="flex items-center gap-8">
              <SkBlock className="h-14 w-14 rounded-xl shrink-0" />
              <div className="flex-1 space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <SkBlock className="h-3 w-20 shrink-0" />
                    <SkBlock className="h-2 flex-1 rounded-full" />
                  </div>
                ))}
              </div>
            </div>
          </Section>

          {/* HostedByCard */}
          <div className="flex items-center gap-4">
            <SkBlock className="h-14 w-14 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <SkBlock className="h-4 w-40" />
              <SkBlock className="h-3 w-28" />
            </div>
            <SkPill className="h-10 w-28 shrink-0" />
          </div>
        </div>

        {/* RIGHT — BookingWidget */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 border border-th-border rounded-2xl p-6 bg-th-surface-raised shadow-th-md space-y-4">
            <div className="flex items-end gap-2">
              <SkBlock className="h-8 w-28" />
              <SkBlock className="h-4 w-12 mb-1" />
            </div>
            <SkBlock className="h-4 w-32" />
            <div className="grid grid-cols-2 gap-2 pt-2">
              <SkBlock className="h-14 rounded-xl" />
              <SkBlock className="h-14 rounded-xl" />
            </div>
            <SkBlock className="h-14 rounded-xl" />
            <SkBlock className="h-12 rounded-xl bg-ocean-200" />
            <div className="pt-2 space-y-2">
              <div className="flex justify-between">
                <SkBlock className="h-3 w-28" />
                <SkBlock className="h-3 w-12" />
              </div>
              <div className="flex justify-between">
                <SkBlock className="h-3 w-20" />
                <SkBlock className="h-3 w-10" />
              </div>
              <div className="flex justify-between pt-1 border-t border-th-border">
                <SkBlock className="h-4 w-16" />
                <SkBlock className="h-4 w-16" />
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Related items teaser */}
      <div className="mt-14">
        <div className="flex items-center justify-between mb-5">
          <SkBlock className="h-6 w-48" />
          <SkBlock className="h-4 w-16" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <SkBlock className="aspect-[4/3] rounded-2xl" />
              <SkBlock className="h-4 w-3/4 mt-2" />
              <SkBlock className="h-3 w-1/2" />
              <SkBlock className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </main>

    {/* Real footer — no skeleton, no chrome pop-in */}
    <div className="mt-10">
      <Footer />
    </div>
  </div>
);

export default ProductDetailsSkeleton;
