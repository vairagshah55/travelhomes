import React, { useState } from "react";
import { motion } from "framer-motion";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";

interface AdminLayoutProps {
  title: string;
  children: React.ReactNode;
}

export default function AdminLayout({ title, children }: AdminLayoutProps) {
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  return (
    <div className="flex h-screen bg-dashboard-bg overflow-hidden">
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
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="flex-1 overflow-y-auto overflow-x-hidden px-4 lg:px-6 pb-6"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}
