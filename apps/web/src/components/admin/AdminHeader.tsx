import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Menu, Search } from "lucide-react";
import ProfileDropdown from "./AdminProfileDropdown";

export default function AdminHeader({ Headtitle, setMobileSidebarOpen }) {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const token = localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");
        const res = await fetch(`/api/admin/notifications/unread-count`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data?.count ?? data?.data?.count ?? 0);
        }
      } catch {
        // silently ignore
      }
    };
    fetchUnread();
    const id = setInterval(fetchUnread, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <header className="flex items-center h-[52px] px-4 bg-white border-b border-surface-border shrink-0 gap-3">
      {/* Mobile menu toggle */}
      <button
        onClick={() => setMobileSidebarOpen((prev) => !prev)}
        className="text-gray-500 hover:text-gray-700 hover:bg-surface-muted rounded-md p-1.5 transition-all lg:hidden"
      >
        <Menu size={18} />
      </button>

      {/* Page title */}
      <motion.h1
        key={Headtitle}
        initial={{ opacity: 0, x: -4 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.16 }}
        className="text-sm font-semibold text-dashboard-heading tracking-tight font-geist"
      >
        {Headtitle}
      </motion.h1>

      {/* Search — centered, fixed width */}
      <div className="flex-1 flex justify-center">
        <div className="relative w-[320px] hidden md:block">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full h-8 pl-8 pr-3 bg-surface-muted border border-surface-border rounded-lg text-[12px] text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-brand-400 focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2 ml-auto">
        <button
          onClick={() => navigate("/notifications")}
          className="relative h-8 w-8 flex items-center justify-center rounded-lg border border-surface-border hover:border-brand-400 hover:bg-surface-muted transition-all group"
        >
          <Bell size={15} className="text-gray-500 group-hover:text-brand-500 transition-colors" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 h-[14px] w-[14px] bg-red-500 rounded-full flex items-center justify-center"
              >
                <span className="text-[8px] font-bold text-white leading-none">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              </motion.span>
            )}
          </AnimatePresence>
        </button>
        <ProfileDropdown />
      </div>
    </header>
  );
}
