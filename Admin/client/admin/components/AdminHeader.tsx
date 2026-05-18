import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Bell, Menu } from "lucide-react";
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
    <header className="flex items-center justify-between px-4 py-3 lg:px-6 lg:py-4 bg-dashboard-bg border-b border-gray-100/60">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileSidebarOpen((prev) => !prev)}
          className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg p-1.5 transition-all max-lg:block hidden"
        >
          <Menu size={22} />
        </button>
        <motion.h1
          key={Headtitle}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.18 }}
          className="text-xl lg:text-2xl font-bold text-dashboard-heading tracking-tight font-geist"
        >
          {Headtitle}
        </motion.h1>
      </div>

      <div className="flex items-center gap-3 lg:gap-4">
        <button
          onClick={() => navigate("/notifications")}
          className="relative bg-white rounded-full border border-gray-200 shadow-sm h-9 w-9 flex items-center justify-center hover:shadow-md hover:border-dashboard-primary/30 transition-all group"
        >
          <Bell size={18} className="text-gray-500 group-hover:text-dashboard-primary transition-colors" />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center"
              >
                <span className="text-[9px] font-bold text-white leading-none">
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
