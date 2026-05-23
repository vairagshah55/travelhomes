import React, { createContext, Suspense, useContext, useLayoutEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/Navigation";
import { DashboardHeader } from "@/components/Header";
import MobileVendorNav from "@/components/MobileVendorNav";

/** Tiny content-area placeholder for lazy chunk loads — keeps the shell visible. */
const ContentLoader = () => (
  <div className="flex-1 flex items-center justify-center">
    <div className="h-6 w-6 rounded-full border-2 border-gray-200 border-t-[#185FA5] animate-spin" />
  </div>
);

/**
 * Layout context — set by DashboardLayoutShell (route-level) so that
 * page-level <DashboardLayout title="..." /> wrappers can detect they
 * are already inside a mounted shell and avoid rendering a duplicate.
 *
 * This is the fix for the "sidebar reloads on every navigation" bug:
 * the shell is mounted ONCE for all vendor routes, the Outlet swaps
 * just the page content, and each page's existing DashboardLayout
 * wrapper becomes a thin pass-through that only propagates the title.
 */
interface LayoutContextValue {
  setTitle: (title: string) => void;
}
const LayoutContext = createContext<LayoutContextValue | null>(null);

/* ── Route-level shell ────────────────────────────────────────────────────── */
/** Renders the persistent sidebar + header + mobile nav. Pages render via <Outlet />. */
export const DashboardLayoutShell: React.FC = () => {
  const [title, setTitle] = useState("Dashboard");

  return (
    <LayoutContext.Provider value={{ setTitle }}>
      <div className="flex h-screen bg-dashboard-bg dark:bg-gray-900 font-plus-jakarta overflow-hidden">
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader Headtitle={title} />
          {/* Inner Suspense catches lazy-chunk loads for vendor pages so the
              shell stays mounted. Without this, the outer App-level Suspense
              fallback (RouteFallback) replaces the entire UI including the
              sidebar while a chunk downloads. */}
          <Suspense fallback={<ContentLoader />}>
            <Outlet />
          </Suspense>
        </div>

        <div className="lg:hidden fixed bottom-0 w-full z-50">
          <MobileVendorNav />
        </div>
      </div>
    </LayoutContext.Provider>
  );
};

/* ── Page-level wrapper (backwards-compatible) ────────────────────────────── */
interface DashboardLayoutProps {
  title: string;
  children: React.ReactNode;
  outerClassName?: string;
  contentClassName?: string;
}

const DashboardLayout = ({
  title,
  children,
  outerClassName = "",
  contentClassName = "flex-1 overflow-y-auto scrollbar-hide",
}: DashboardLayoutProps) => {
  const ctx = useContext(LayoutContext);

  // Hooks must be called unconditionally. useLayoutEffect (instead of
  // useEffect) updates the title in the shell BEFORE the browser paints,
  // so the header never flashes the previous page's title.
  useLayoutEffect(() => {
    if (ctx) ctx.setTitle(title);
  }, [title, ctx]);

  // Pass-through mode: a parent DashboardLayoutShell is already mounted.
  // Just render the page content, transitioning between routes. We merge
  // outerClassName + contentClassName here because in shell mode there's
  // only one wrapper (no separate outer/content layers).
  if (ctx) {
    return (
      <motion.div
        key={title}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={`${outerClassName} ${contentClassName}`.trim()}
      >
        {children}
      </motion.div>
    );
  }

  // Standalone mode (legacy — no shell parent). Renders the full layout
  // so any code path that still calls <DashboardLayout> directly without
  // a route shell continues to work.
  return (
    <div
      className={`flex h-screen bg-dashboard-bg dark:bg-gray-900 font-plus-jakarta ${outerClassName}`}
    >
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader Headtitle={title} />
        <motion.div
          key={title}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className={contentClassName}
        >
          {children}
        </motion.div>
      </div>

      <div className="lg:hidden fixed bottom-0 w-full z-50">
        <MobileVendorNav />
      </div>
    </div>
  );
};

export default DashboardLayout;
