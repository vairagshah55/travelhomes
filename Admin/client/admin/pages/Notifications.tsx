import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import AdminSidebar from "../components/AdminSidebar";
import AdminHeader from "../components/AdminHeader";
import { Bell, UserPlus, CreditCard, CalendarCheck, HelpCircle, Info, CheckCircle, XCircle, Briefcase, Trash2, Check, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  _id: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  referenceId?: string;
  referenceModel?: string;
}

const Notifications = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");
      console.log("[DEBUG] Fetching notifications from:", `${API_BASE_URL}/api/admin/notifications?unreadOnly=${activeFilter === "unread"}`);
      
      const res = await fetch(`${API_BASE_URL}/api/admin/notifications?unreadOnly=${activeFilter === "unread"}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      const data = await res.json();
      console.log("[DEBUG] Received notifications data:", data);
      if (data.success) {
        setNotifications(data.data);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
    return () => clearInterval(interval);
  }, [activeFilter]);

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleMarkAllAsRead = async () => {
    try {
      const token = localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");
      const res = await fetch(`${API_BASE_URL}/api/admin/notifications/read-all`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        // Refresh notifications or optimistically update
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");
      const res = await fetch(`${API_BASE_URL}/api/admin/notifications/${id}/read`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this notification?")) return;

    try {
      const token = localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");
      const res = await fetch(`${API_BASE_URL}/api/admin/notifications/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (data.success) {
        setNotifications((prev) => prev.filter((n) => n._id !== id));
        setSelectedIds((prev) => prev.filter((item) => item !== id));
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} notifications?`)) return;

    try {
      const token = localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");
      const res = await fetch(`${API_BASE_URL}/api/admin/notifications/bulk-delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ ids: selectedIds })
      });
      const data = await res.json();
      if (data.success) {
        setNotifications((prev) => prev.filter((n) => !selectedIds.includes(n._id)));
        setSelectedIds([]);
      }
    } catch (error) {
      console.error("Error in bulk delete:", error);
    }
  };

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleOpenDetail = (notification: Notification) => {
    setSelectedNotification(notification);
    setShowDetailModal(true);
    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "new_user":
      case "vendor_registration":
        return <UserPlus className="w-5 h-5 text-blue-500" />;
      case "payment_received":
        return <CreditCard className="w-5 h-5 text-green-500" />;
      case "new_booking":
        return <CalendarCheck className="w-5 h-5 text-purple-500" />;
      case "helpdesk_ticket":
        return <HelpCircle className="w-5 h-5 text-orange-500" />;
      case "service_approval":
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case "service_rejection":
        return <XCircle className="w-5 h-5 text-red-500" />;
      case "job_application":
        return <Briefcase className="w-5 h-5 text-cyan-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };


  return (
    <div className="min-h-screen bg-[#F9FAFB] flex">
      {/* Sidebar */}
      <div className="fixed">

      <AdminSidebar
        showMobileSidebar={mobileOpen}
        setShowMobileSidebar={setMobileOpen}
        />
        </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-x-hidden ml-60 max-lg:ml-0">
        {/* Top Header */}
        <AdminHeader
          Headtitle={"Notifications"}
          setMobileSidebarOpen={setMobileOpen}
        />

        {/* Notifications Content */}
        <main className="flex-1 p-4 lg:p-5 bg-white  dark:bg-black dark:text-white m-2 lg:m-5 rounded-2xl lg:rounded-3xl overflow-auto">
          {/* Filter Tabs and Mark as Read */}
          <div className="flex items-center justify-between overflow-y-scroll gap-6 border-b border-dashboard-stroke pb-4 mb-5">
            <div className="flex items-center flex-1">
              {/* Filter Tabs */}
              <div className="flex dark:border items-center bg-dashboard-bg rounded-full p-0.5 w-[142px]">
                <button
                  onClick={() => setActiveFilter("all")}
                  className={`px-5 py-2 rounded-full text-sm font-bold font-geist transition-colors ${
                    activeFilter === "all"
                      ? "bg-dashboard-primary dark:text-black text-white"
                      : "text-dashboard-heading hover:text-dashboard-primary"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setActiveFilter("unread")}
                  className={`px-4 py-2 rounded-full text-sm font-geist transition-colors ${
                    activeFilter === "unread"
                      ? "bg-dashboard-primary dark:text-black text-white"
                      : "text-dashboard-heading hover:text-dashboard-primary"
                  }`}
                >
                  Unread
                </button>
              </div>
            </div>

            {/* Mark as Read Button */}
            <div className="flex items-center gap-2">
              {selectedIds.length > 0 && (
                <button
                  onClick={handleBulkDelete}
                  className="px-4 py-1.5 text-sm font-bold text-red-500 font-geist hover:bg-red-50 rounded-full transition-colors flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Delete ({selectedIds.length})
                </button>
              )}
              <button
                onClick={handleMarkAllAsRead}
                className="px-4 py-1.5 text-sm font-bold text-dashboard-heading font-geist hover:text-dashboard-primary transition-colors"
              >
                Mark as Read
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-10">Loading notifications...</div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  onClick={() => handleOpenDetail(notification)}
                  className={`border border-dashboard-stroke rounded-2xl dark:bg-black dark:text-white bg-white hover:shadow-sm transition-shadow cursor-pointer max-w-[1096px] ${
                    !notification.isRead ? "bg-blue-50 dark:bg-gray-900" : ""
                  }`}
                >
                  <div className="p-[18px]">
                    <div className="flex items-start gap-4">
                      {/* Checkbox */}
                      <div 
                        onClick={(e) => handleToggleSelect(notification._id, e)}
                        className={`w-5 h-5 rounded border flex items-center justify-center mt-2 flex-shrink-0 transition-colors ${
                          selectedIds.includes(notification._id) 
                            ? "bg-dashboard-primary border-dashboard-primary text-white" 
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        {selectedIds.includes(notification._id) && <Check size={14} strokeWidth={3} />}
                      </div>

                      {/* Avatar/Icon */}
                      <div className="w-[38px] h-[38px] rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                        {getIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 space-y-0.5">
                        <h4 className={`text-sm font-normal text-dashboard-title font-geist leading-[150%] ${!notification.isRead ? 'font-semibold' : ''}`}>
                          {notification.title}
                        </h4>
                        <p className="text-xs text-dashboard-body font-geist leading-[150%] max-w-[906px] line-clamp-1">
                          {notification.message}
                        </p>
                      </div>

                      {/* Right Side - Time and Action */}
                      <div className="flex flex-col items-end gap-3 pt-1.5 min-w-[80px]">
                        <div className="flex items-center gap-3">
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-dashboard-primary rounded-full"></div>
                          )}
                          <button 
                            onClick={(e) => handleDelete(notification._id, e)}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <span className="text-sm text-dashboard-body font-geist leading-[150%] whitespace-nowrap">
                          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Empty State */}
          {!loading && notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Bell size={48} className="text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-dashboard-heading font-geist mb-2">
                No notifications
              </h3>
              <p className="text-dashboard-body font-plus-jakarta">
                {activeFilter === "unread"
                  ? "You don't have any unread notifications"
                  : "You don't have any notifications yet"}
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedNotification && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                  {getIcon(selectedNotification.type)}
                </div>
                <div>
                  <h3 className="text-lg font-bold dark:text-white">{selectedNotification.title}</h3>
                  <p className="text-xs text-gray-400">
                    {formatDistanceToNow(new Date(selectedNotification.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowDetailModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-8">
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6">
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {selectedNotification.message}
                </p>
              </div>

              {selectedNotification.referenceId && (
                <div className="mt-6">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Reference Info</p>
                  <div className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-800 rounded-xl">
                    <span className="text-sm font-medium dark:text-gray-400">Model: {selectedNotification.referenceModel}</span>
                    <span className="text-xs font-mono text-gray-500 truncate ml-4">ID: {selectedNotification.referenceId}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  handleDelete(selectedNotification._id);
                  setShowDetailModal(false);
                }}
                className="px-6 py-2.5 rounded-full text-sm font-bold text-red-500 hover:bg-red-50 transition-colors flex items-center gap-2"
              >
                <Trash2 size={16} />
                Delete
              </button>
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-8 py-2.5 rounded-full text-sm font-bold bg-dashboard-primary text-white hover:opacity-90 transition-opacity shadow-lg shadow-dashboard-primary/20"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
