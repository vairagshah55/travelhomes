import React, { useState } from "react";
import { motion } from "framer-motion";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import { MobileBottomNav } from "@/admin/MobileBottomNav";

interface AdminLayoutProps {
  title: string;
  children: React.ReactNode;
}

export default function AdminLayout({ title, children }: AdminLayoutProps) {
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  return (
    <div className="flex h-screen bg-surface-muted overflow-hidden">
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
