// Skeleton screen shown while a lazy-loaded route chunk is downloading.
// Mirrors the product-detail page layout so the transition feels seamless.
const Sk = ({ className = "", style }: { className?: string; style?: React.CSSProperties }) => (
  <div className={`animate-pulse rounded-xl bg-ds-sky ${className}`} style={style} />
);

const RouteFallback = () => (
  <div className="min-h-screen bg-ds-linen font-sans">
    {/* ── Nav skeleton ──────────────────────────────────────── */}
    <div className="sticky top-0 z-50 bg-white border-b border-ds-pebble">
      <div className="max-w-[1280px] mx-auto px-6 h-16 flex items-center justify-between">
        <Sk className="h-7 w-36 rounded-lg" />
        <div className="hidden md:flex items-center gap-6">
          <Sk className="h-4 w-20" />
          <Sk className="h-4 w-24" />
          <Sk className="h-4 w-16" />
        </div>
        <div className="flex items-center gap-3">
          <Sk className="h-9 w-32 rounded-full" />
          <Sk className="h-9 w-20 rounded-full" />
        </div>
      </div>
    </div>

    <div className="max-w-[1280px] mx-auto px-6 py-8">
      {/* ── Breadcrumb ────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-6">
        <Sk className="h-4 w-12 rounded" />
        <Sk className="h-4 w-3 rounded" />
        <Sk className="h-4 w-24 rounded" />
        <Sk className="h-4 w-3 rounded" />
        <Sk className="h-4 w-32 rounded" />
      </div>

      {/* ── Title + actions ───────────────────────────────────── */}
      <div className="flex items-start justify-between mb-5">
        <div className="space-y-2 flex-1 max-w-lg">
          <Sk className="h-8 w-3/4 rounded-lg" />
          <div className="flex items-center gap-4 pt-1">
            <Sk className="h-4 w-28" />
            <Sk className="h-4 w-20" />
            <Sk className="h-4 w-24" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Sk className="h-9 w-20 rounded-full" />
          <Sk className="h-9 w-20 rounded-full" />
        </div>
      </div>

      {/* ── Image gallery skeleton — 1 large + 4 thumbnails ──── */}
      <div
        className="grid grid-cols-2 gap-2 rounded-2xl overflow-hidden mb-8"
        style={{ height: 420 }}
      >
        <Sk className="rounded-none h-full w-full row-span-2 rounded-l-2xl" />
        <div className="grid grid-cols-2 gap-2">
          <Sk className="rounded-none h-full rounded-tr-2xl" style={{ height: 206 }} />
          <Sk className="rounded-none h-full" style={{ height: 206 }} />
          <Sk className="rounded-none h-full" style={{ height: 206 }} />
          <Sk className="rounded-none h-full rounded-br-2xl" style={{ height: 206 }} />
        </div>
      </div>

      {/* ── Two-column: content left + booking widget right ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-10">
        {/* Left — property info */}
        <div className="space-y-8">
          {/* Host row */}
          <div className="flex items-center justify-between pb-6 border-b border-ds-pebble">
            <div className="space-y-2">
              <Sk className="h-6 w-56 rounded-lg" />
              <Sk className="h-4 w-40" />
            </div>
            <Sk className="h-14 w-14 rounded-full" />
          </div>

          {/* Highlights pills */}
          <div className="flex flex-wrap gap-3 pb-6 border-b border-ds-pebble">
            {[80, 64, 96, 72].map((w, i) => (
              <Sk key={i} className="h-10 rounded-xl" style={{ width: w }} />
            ))}
          </div>

          {/* Description */}
          <div className="space-y-2 pb-6 border-b border-ds-pebble">
            <Sk className="h-4 w-full" />
            <Sk className="h-4 w-full" />
            <Sk className="h-4 w-5/6" />
            <Sk className="h-4 w-4/5" />
            <Sk className="h-4 w-full" />
            <Sk className="h-4 w-3/4" />
          </div>

          {/* Amenities grid */}
          <div className="pb-6 border-b border-ds-pebble">
            <Sk className="h-6 w-40 rounded-lg mb-4" />
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Sk className="h-5 w-5 rounded" />
                  <Sk className="h-4 w-24 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Reviews */}
          <div>
            <Sk className="h-6 w-32 rounded-lg mb-5" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-4 border border-ds-pebble space-y-3">
                  <div className="flex items-center gap-3">
                    <Sk className="h-10 w-10 rounded-full" />
                    <div className="space-y-1.5">
                      <Sk className="h-4 w-28 rounded" />
                      <Sk className="h-3 w-20 rounded" />
                    </div>
                  </div>
                  <Sk className="h-3 w-full rounded" />
                  <Sk className="h-3 w-5/6 rounded" />
                  <Sk className="h-3 w-4/5 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — booking widget */}
        <div className="hidden lg:block">
          <div
            className="sticky top-24 bg-white border border-ds-pebble rounded-2xl p-6 space-y-4"
            style={{ boxShadow: "var(--ds-shadow-card)" }}
          >
            <div className="flex items-end gap-2">
              <Sk className="h-8 w-28 rounded-lg" />
              <Sk className="h-4 w-16 rounded mb-1" />
            </div>
            <Sk className="h-4 w-32 rounded" />
            <div className="grid grid-cols-2 gap-2">
              <Sk className="h-16 rounded-xl" />
              <Sk className="h-16 rounded-xl" />
            </div>
            <Sk className="h-16 rounded-xl" />
            <Sk className="h-13 rounded-xl" style={{ height: 52 }} />
            <Sk className="h-3 w-40 mx-auto rounded" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default RouteFallback;
