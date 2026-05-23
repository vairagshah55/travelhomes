import React, { useState } from "react";
import { motion } from "framer-motion";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import { MobileBottomNav } from "@/components/admin/MobileBottomNav";

interface AdminLayoutProps {
  title: string;
  children: React.ReactNode;
}

export default function AdminLayout({ title, children }: AdminLayoutProps) {
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  return (
    // data-brand="admin" swaps the CSS variables --brand, --brand-hover,
    // --brand-fg, --brand-subtle to the admin blue palette. Shared
    // primitives in components/shared/* read those via `bg-brand` etc.
    // and automatically render admin-blue inside this subtree.
    <div data-brand="admin" className="flex h-screen bg-surface-muted overflow-hidden">
      <AdminSidebar
        showMobileSidebar={showMobileSidebar}
        setShowMobileSidebar={setShowMobileSidebar}
      />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <AdminHeader
          Headtitle={title}
          setMobileSidebarOpen={setShowMobileSidebar}
        />
        <motion.main
          key={title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="flex-1 overflow-y-auto overflow-x-hidden p-5 pb-16 md:pb-5"
        >
          {children}
        </motion.main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
