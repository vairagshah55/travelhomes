import React, { createContext, Suspense, useContext, useLayoutEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/Navigation";
import { DashboardHeader } from "@/components/Header";
import MobileVendorNav from "@/components/MobileVendorNav";

// NOTE: <DashboardLayout> is ALWAYS expected to be rendered inside a
// <DashboardLayoutShell /> route (see App.tsx). The page wrapper is now a
// thin pass-through — it propagates the page title to the shell and applies
// page-level content styling, but renders no sidebar/header of its own.
//
// Previously this file had a "standalone" fallback that rendered its own
// sidebar + header when no shell was detected. That fallback fired when the
// context lookup returned null (e.g. lazy-chunked pages whose useContext
// resolution didn't see the provider in time), producing the bug where every
// page rendered two sidebars + two headers stacked on top of each other.
// The fix: kill the fallback entirely so the only way to get the chrome is
// via the shell route, and put every page that uses DashboardLayout inside
// that route block.

/** Tiny content-area placeholder for lazy chunk loads — keeps the shell visible. */
const ContentLoader = () => (
  <div className="flex-1 flex items-center justify-center">
    <div className="h-6 w-6 rounded-full border-2 border-gray-200 border-t-[#0F5C8A] animate-spin" />
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
/**
 * Renders the persistent sidebar + header + mobile nav. Pages render via
 * <Outlet /> when used as a route element.
 *
 * `children` is the standalone escape hatch: a page that lives OUTSIDE the
 * dashboard route group but still needs the vendor chrome (e.g. /help, which
 * shows the sidebar for vendors and public header/footer for everyone else)
 * can mount the shell directly around its own content. Same shell either way,
 * so the two can't drift.
 */
export const DashboardLayoutShell: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [title, setTitle] = useState("Dashboard");

  return (
    <LayoutContext.Provider value={{ setTitle }}>
      {/* data-brand="admin" → the vendor dashboard inherits the admin/console
          design system (tpl tokens, table styling, surfaces) with no duplicate
          theme. */}
      <div
        data-brand="admin"
        className="flex h-screen bg-tpl-body-bg dark:bg-tpl-body-bg font-plus-jakarta overflow-hidden"
      >
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <DashboardHeader Headtitle={title} />
          {/* Inner Suspense catches lazy-chunk loads for vendor pages so the
              shell stays mounted. Without this, the outer App-level Suspense
              fallback (RouteFallback) replaces the entire UI including the
              sidebar while a chunk downloads. */}
          <Suspense fallback={<ContentLoader />}>{children ?? <Outlet />}</Suspense>
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

  // useLayoutEffect (instead of useEffect) updates the title in the shell
  // BEFORE the browser paints, so the header never flashes the previous
  // page's title between route transitions. Safe to call unconditionally —
  // the if-guard inside handles the (now-illegal) missing-shell case.
  useLayoutEffect(() => {
    if (ctx) ctx.setTitle(title);
    else if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn(
        `[DashboardLayout] "${title}" rendered without a DashboardLayoutShell parent. ` +
          "Wrap the route in <DashboardLayoutShell /> — see App.tsx.",
      );
    }
  }, [title, ctx]);

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
};

export default DashboardLayout;
