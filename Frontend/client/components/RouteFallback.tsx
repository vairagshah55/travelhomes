import React from "react";
import { Loader } from "@/components/ui/Loader";

/**
 * Suspense fallback for lazy-loaded routes.
 *
 * Centred + minimal-height so it doesn't shift layout while a chunk loads.
 * Routes that need a richer skeleton can render their own loading state on
 * mount; this is a generic last-resort.
 */
const RouteFallback: React.FC = () => (
  <div role="status" aria-label="Loading" className="min-h-[60vh] flex items-center justify-center">
    <Loader size="lg" />
  </div>
);

export default RouteFallback;
