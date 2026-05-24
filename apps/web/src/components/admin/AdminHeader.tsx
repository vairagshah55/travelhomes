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
    <header className="flex items-center h-14 px-4 lg:px-6 bg-white border-b border-gray-200 shrink-0 gap-3 z-30">
      {/* Mobile menu toggle */}
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={() => setMobileSidebarOpen((prev) => !prev)}
        className="lg:hidden text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md p-1.5 -ml-1.5 transition-colors"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </motion.button>

      {/* Page title — animated entry on route change */}
      <AnimatePresence mode="wait">
        <motion.h1
          key={Headtitle}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          className="text-[15px] font-semibold text-gray-900 tracking-tight truncate"
        >
          {Headtitle}
        </motion.h1>
      </AnimatePresence>

      <div className="flex-1" />

      {/* Right action group */}
      <div className="flex items-center gap-1">
        {/* Search */}
        <div className="relative w-64 lg:w-72 hidden md:block group">
          <Search
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-ocean-500 pointer-events-none transition-colors"
          />
          <input
            type="text"
            placeholder="Search…"
            className="w-full h-9 pl-8 pr-3 bg-gray-50 border border-gray-200 rounded-md text-[13px] text-gray-700 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-ocean-400 focus:ring-2 focus:ring-ocean-400/15 hover:border-gray-300 transition-colors"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-0.5 px-1.5 h-5 text-[10px] font-medium text-gray-400 bg-white border border-gray-200 rounded shadow-[0_1px_0_rgba(0,0,0,0.04)] pointer-events-none">
            ⌘K
          </kbd>
        </div>

        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => navigate("/admin/notifications")}
          className="relative h-9 w-9 flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          aria-label="Notifications"
        >
          <Bell size={17} strokeWidth={1.75} />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                className="absolute top-1 right-1 min-w-[15px] h-[15px] px-1 bg-red-500 rounded-full flex items-center justify-center ring-2 ring-white"
              >
                <span className="text-[9px] font-bold text-white leading-none">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        <span className="hidden md:block w-px h-5 bg-gray-200 mx-2" />

        <ProfileDropdown />
      </div>
    </header>
  );
}
