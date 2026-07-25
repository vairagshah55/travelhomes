import React, { useState } from "react";
import { motion } from "framer-motion";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import { MobileBottomNav } from "@/components/admin/MobileBottomNav";

interface AdminLayoutProps {
  title: string;
  /** Optional context strip rendered under the title — e.g. "Welcome back, Vairag" */
  subtitle?: string;
  /** Primary action button(s) rendered on the right of the header */
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Admin shell. Owns:
 *   - Persistent sidebar (collapsible on desktop, drawer on mobile)
 *   - Sticky top header (breadcrumb + title + page-level actions)
 *   - Scrollable content area
 *   - Mobile bottom nav
 *
 * `data-brand="admin"` swaps CSS-var brand tokens for shared primitives in
 * components/shared/, so anything that uses `bg-brand`/`text-brand` renders
 * the admin blue palette inside this subtree.
 */
export default function AdminLayout({
  title,
  subtitle,
  headerActions,
  children,
}: AdminLayoutProps) {
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  return (
    <div
      data-brand="admin"
      className="flex h-screen bg-tpl-body-bg overflow-hidden font-plus-jakarta"
    >
      <AdminSidebar
        showMobileSidebar={showMobileSidebar}
        setShowMobileSidebar={setShowMobileSidebar}
      />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <AdminHeader
          title={title}
          subtitle={subtitle}
          actions={headerActions}
          onOpenMobileSidebar={() => setShowMobileSidebar(true)}
        />

        <motion.main
          key={title}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="flex-1 overflow-y-auto overflow-x-hidden bg-tpl-body-bg dark:bg-tpl-body-bg"
        >
          <div className="px-4 py-5 sm:px-6 md:px-6 lg:px-8 2xl:px-10 sm:py-6 md:py-7 2xl:py-10 pb-20 md:pb-8">
            {children}
          </div>
        </motion.main>
      </div>

      <MobileBottomNav />
    </div>
  );
}
