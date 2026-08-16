import React, {
  createContext,
  Suspense,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/Navigation";
import { DashboardHeader } from "@/components/Header";
import MobileVendorNav from "@/components/MobileVendorNav";
import AdminPageTitle from "@/components/admin/AdminPageTitle";
import { PAGE_CONTAINER } from "@/components/admin/adminUI";

// NOTE: <DashboardLayout> is ALWAYS expected to be rendered inside a
// <DashboardLayoutShell /> route (see App.tsx). The page wrapper is now a
// thin pass-through — it propagates the page header to the shell and applies
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
    <div className="h-6 w-6 rounded-full border-2 border-gray-200 border-t-[#3bd9da] animate-spin" />
  </div>
);

/**
 * What a page tells the shell about its own header band.
 *
 * This used to be just the title, because the title was all the 84px top bar
 * had room for. The shell now draws the admin's three-band composition, so a
 * page can also hand up its description, its primary actions and its tab strip
 * — the things that previously had nowhere to live and ended up floating in
 * the content area, differently on every page.
 */
export interface PageHeader {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  tabs?: React.ReactNode;
  /**
   * The page manages its own height and scrolling (chat, the offering detail
   * viewer). The shell's <main> stops scrolling and becomes a flex column so
   * those pages keep the fixed-height contract they were built against.
   */
  fillHeight?: boolean;
}

/**
 * Layout context — set by DashboardLayoutShell (route-level) so that
 * page-level <DashboardLayout title="..." /> wrappers can detect they
 * are already inside a mounted shell and avoid rendering a duplicate.
 *
 * This is the fix for the "sidebar reloads on every navigation" bug:
 * the shell is mounted ONCE for all vendor routes, the Outlet swaps
 * just the page content, and each page's existing DashboardLayout
 * wrapper becomes a thin pass-through that only propagates the header.
 */
interface LayoutContextValue {
  setHeader: (header: PageHeader) => void;
}
const LayoutContext = createContext<LayoutContextValue | null>(null);

/* ── Route-level shell ────────────────────────────────────────────────────── */
/**
 * Renders the persistent sidebar + header + mobile nav. Pages render via
 * <Outlet /> when used as a route element.
 *
 * Three horizontal bands, the same composition as AdminLayout: a 56px top bar
 * (location + global controls), a full-bleed white page-header band (title,
 * description, actions, tabs), then the content area on a light ground. The
 * bands are what give a page structure — everything used to sit on one flat
 * field with the title crammed into the top bar beside the notification bell.
 *
 * `children` is the standalone escape hatch: a page that lives OUTSIDE the
 * dashboard route group but still needs the vendor chrome (e.g. /help, which
 * shows the sidebar for vendors and public header/footer for everyone else)
 * can mount the shell directly around its own content. Same shell either way,
 * so the two can't drift.
 */
export const DashboardLayoutShell: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [header, setHeader] = useState<PageHeader>({ title: "Dashboard" });
  const ctx = useMemo(() => ({ setHeader }), []);

  return (
    <LayoutContext.Provider value={ctx}>
      {/* data-brand="admin" → the shared primitives in components/shared/ read
          their brand tokens from this scope.

          data-console="vendor" → the console surface defined in global.css:
          the table rules both consoles share, and the vendor's own accent and
          page ground. It replaces `bg-tpl-body-bg`, which painted NOTHING
          here: `--tpl-*` is declared only in admin.css, and admin.css is
          imported by AdminApp alone. The page background now comes from
          [data-console="vendor"] in global.css, which vendor routes do load. */}
      <div
        data-brand="admin"
        data-console="vendor"
        className="flex h-screen font-plus-jakarta overflow-hidden"
      >
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <DashboardHeader Headtitle={header.title} />

          <main
            className={
              header.fillHeight
                ? "flex-1 min-h-0 flex flex-col overflow-hidden"
                : "flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide"
            }
          >
            {/* The band scrolls WITH the content rather than pinning under the
                top bar: on a data-heavy page the rows are what you want on
                screen, and a second sticky strip eats a third of a laptop. */}
            <AdminPageTitle
              title={header.title}
              subtitle={header.subtitle}
              actions={header.actions}
              tabs={header.tabs}
            />

            {/* Inner Suspense catches lazy-chunk loads for vendor pages so the
                shell stays mounted. Without this, the outer App-level Suspense
                fallback (RouteFallback) replaces the entire UI including the
                sidebar while a chunk downloads. */}
            <Suspense fallback={<ContentLoader />}>{children ?? <Outlet />}</Suspense>
          </main>
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
  /** One line under the title saying what this page is for. */
  subtitle?: string;
  /** Primary + secondary actions, rendered right of the title in the band. */
  headerActions?: React.ReactNode;
  /** Tab strip, rendered flush on the band's bottom edge. */
  tabs?: React.ReactNode;
  /** This page owns its height and scrolling — see PageHeader.fillHeight. */
  fillHeight?: boolean;
  children: React.ReactNode;
  outerClassName?: string;
  contentClassName?: string;
}

const DashboardLayout = ({
  title,
  subtitle,
  headerActions,
  tabs,
  fillHeight = false,
  children,
  outerClassName = "",
  contentClassName = "",
}: DashboardLayoutProps) => {
  const ctx = useContext(LayoutContext);

  // useLayoutEffect (instead of useEffect) updates the header in the shell
  // BEFORE the browser paints, so the band never flashes the previous page's
  // title between route transitions. Safe to call unconditionally — the
  // if-guard inside handles the (now-illegal) missing-shell case.
  useLayoutEffect(() => {
    if (ctx) ctx.setHeader({ title, subtitle, actions: headerActions, tabs, fillHeight });
    else if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.warn(
        `[DashboardLayout] "${title}" rendered without a DashboardLayoutShell parent. ` +
          "Wrap the route in <DashboardLayoutShell /> — see App.tsx.",
      );
    }
  }, [ctx, title, subtitle, headerActions, tabs, fillHeight]);

  return (
    <motion.div
      key={title}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      /* The scroll container moved up to the shell's <main> so the header band
         scrolls with the content. Pages keep their own padding overrides via
         contentClassName; the default gutter matches the admin's. */
      className={`${outerClassName} ${
        contentClassName || `${PAGE_CONTAINER} px-4 sm:px-6 lg:px-8 py-5 sm:py-6 pb-24 lg:pb-10`
      }`.trim()}
    >
      {children}
    </motion.div>
  );
};

export default DashboardLayout;
