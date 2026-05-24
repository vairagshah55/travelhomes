// Default fallback for lazy-loaded route chunks. Minimal centered spinner —
// no fake layout that misrepresents the destination page.
//
// Product-detail routes opt in to the richer <RouteFallback /> (gallery +
// booking widget shape) by wrapping themselves in their own Suspense.

const GenericRouteFallback = () => (
  <div className="min-h-screen bg-th-surface-1 flex items-center justify-center">
    <div className="h-7 w-7 rounded-full border-2 border-ocean-100 border-t-[#1E3A8A] animate-spin" />
  </div>
);

export default GenericRouteFallback;
