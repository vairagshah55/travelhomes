import React, { useState } from "react";
import { motion, MotionConfig } from "framer-motion";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import AdminPageTitle from "./AdminPageTitle";
import AdminCommandPalette from "./AdminCommandPalette";
import { PAGE_CONTAINER } from "./adminUI";
import { MobileBottomNav } from "@/components/admin/MobileBottomNav";

interface AdminLayoutProps {
  title: string;
  /** One line under the title saying what this page is for. */
  subtitle?: string;
  /** Primary + secondary actions, rendered right of the title. */
  headerActions?: React.ReactNode;
  /**
   * Tab strip for the page. Rendered flush with the header band's bottom edge
   * rather than inside the content, so switching tabs visibly swaps the whole
   * body below instead of something nested in a card.
   */
  tabs?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Admin shell. Owns:
 *   - Persistent sidebar (collapsible on desktop, drawer on mobile)
 *   - Slim sticky top bar (search + account)
 *   - A full-bleed page-header band (title / description / actions / tabs)
 *   - Scrollable content area
 *   - Mobile bottom nav
 *
 * The three horizontal bands — 56px top bar, white header band, grey content —
 * are what give a page its structure. Everything used to sit on one flat grey
 * field, so the eye had no order to follow.
 *
 * `data-brand="admin"` swaps CSS-var brand tokens for shared primitives in
 * components/shared/, so anything using `bg-brand`/`text-brand` renders the
 * admin blue palette inside this subtree.
 */
export default function AdminLayout({
  title,
  subtitle,
  headerActions,
  tabs,
  children,
}: AdminLayoutProps) {
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  return (
    <MotionConfig reducedMotion="user">
      <div
        data-brand="admin"
        data-admin-app=""
        className="flex h-screen bg-tpl-body-bg overflow-hidden font-plus-jakarta"
      >
        <AdminSidebar
          showMobileSidebar={showMobileSidebar}
          setShowMobileSidebar={setShowMobileSidebar}
          onOpenPalette={() => setPaletteOpen(true)}
        />

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <AdminHeader
            title={title}
            onOpenMobileSidebar={() => setShowMobileSidebar(true)}
            onOpenPalette={() => setPaletteOpen(true)}
          />

          <main className="flex-1 overflow-y-auto overflow-x-hidden bg-tpl-body-bg">
            {/* The band is INSIDE the scroller, not pinned: on a data-heavy
                page the rows are what you want on screen, and a second sticky
                strip under the top bar eats a third of a laptop viewport. */}
            <AdminPageTitle title={title} subtitle={subtitle} actions={headerActions} tabs={tabs} />

            <motion.div
              key={title}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className={`${PAGE_CONTAINER} px-4 sm:px-6 lg:px-8 py-5 sm:py-6 pb-24 lg:pb-10`}
            >
              {children}
            </motion.div>
          </main>
        </div>

        <MobileBottomNav />

        {/* One palette for the shell. It used to live inside AdminHeader, but
            the rail's footer opens it too, and two mounted copies would mean
            two ⌘K listeners racing each other. */}
        <AdminCommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      </div>
    </MotionConfig>
  );
}
