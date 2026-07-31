import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  Bell,
  UserPlus,
  CreditCard,
  CalendarCheck,
  HelpCircle,
  Info,
  CheckCircle,
  XCircle,
  Briefcase,
  Trash2,
  Check,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { notificationsService, api } from "@/services/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ConfirmModal } from "@/components/shared/ConfirmModal";

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

type ActiveFilter = "all" | "unread";

const QUERY_KEY = (filter: ActiveFilter) => ["admin", "notifications", filter] as const;

const Notifications = () => {
  const queryClient = useQueryClient();

  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);

  // Confirm state: tracks which action is pending
  const [confirmDelete, setConfirmDelete] = useState<
    { id: string; bulk: false } | { bulk: true } | null
  >(null);

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data, isLoading } = useQuery<Notification[]>({
    queryKey: QUERY_KEY(activeFilter),
    queryFn: async () => {
      const res = await notificationsService.list({ filter: activeFilter });
      return (res?.data ?? res) as Notification[];
    },
    refetchInterval: 30_000,
  });

  const notifications: Notification[] = data ?? [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "notifications"] });

  // ── Mutations ─────────────────────────────────────────────────────────────

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsService.markRead(id),
    onSuccess: (_d, id) => {
      queryClient.setQueryData<Notification[]>(QUERY_KEY(activeFilter), (prev) =>
        prev ? prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)) : prev,
      );
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsService.markAllRead(),
    onSuccess: () => {
      queryClient.setQueryData<Notification[]>(QUERY_KEY(activeFilter), (prev) =>
        prev ? prev.map((n) => ({ ...n, isRead: true })) : prev,
      );
    },
    onError: () => toast.error("Failed to mark all as read."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => notificationsService.remove(id),
    onSuccess: (_d, id) => {
      queryClient.setQueryData<Notification[]>(QUERY_KEY(activeFilter), (prev) =>
        prev ? prev.filter((n) => n._id !== id) : prev,
      );
      setSelectedIds((prev) => prev.filter((item) => item !== id));
      // Close detail modal only after a successful delete
      if (showDetailModal && selectedNotification?._id === id) {
        setShowDetailModal(false);
        setSelectedNotification(null);
      }
    },
    onError: () => toast.error("Failed to delete notification."),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => api.post("/admin/notifications/bulk-delete", { ids }),
    onSuccess: () => {
      queryClient.setQueryData<Notification[]>(QUERY_KEY(activeFilter), (prev) =>
        prev ? prev.filter((n) => !selectedIds.includes(n._id)) : prev,
      );
      setSelectedIds([]);
    },
    onError: () => toast.error("Failed to delete selected notifications."),
  });

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleMarkAllAsRead = () => markAllReadMutation.mutate();

  const handleMarkAsRead = (id: string) => {
    if (!notifications.find((n) => n._id === id)?.isRead) {
      markReadMutation.mutate(id);
    }
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setConfirmDelete({ id, bulk: false });
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    setConfirmDelete({ bulk: true });
  };

  const handleConfirmDelete = () => {
    if (!confirmDelete) return;
    if (confirmDelete.bulk) {
      bulkDeleteMutation.mutate(selectedIds);
    } else {
      deleteMutation.mutate(confirmDelete.id);
    }
    setConfirmDelete(null);
  };

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleOpenDetail = (notification: Notification) => {
    setSelectedNotification(notification);
    setShowDetailModal(true);
    handleMarkAsRead(notification._id);
  };

  // ── Icon helper ───────────────────────────────────────────────────────────

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

  // ── Confirm dialog labels ─────────────────────────────────────────────────

  const confirmTitle = confirmDelete?.bulk
    ? `Delete ${selectedIds.length} notification${selectedIds.length > 1 ? "s" : ""}?`
    : "Delete notification?";

  const confirmDescription = confirmDelete?.bulk
    ? "These notifications will be permanently removed."
    : "This notification will be permanently removed.";

  const isConfirmLoading = deleteMutation.isPending || bulkDeleteMutation.isPending;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <AdminLayout title="Notifications">
      <main className="flex-1 p-5 bg-app-surface rounded-[18px] border border-app-border shadow-[0_1px_2px_rgba(16,24,40,0.04),0_10px_28px_-14px_rgba(16,24,40,0.16)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.35),0_12px_32px_-16px_rgba(0,0,0,0.55)] overflow-auto">
        {/* Filter Tabs and Mark as Read */}
        <div className="flex items-center justify-between overflow-y-scroll gap-6 border-b border-dashboard-stroke pb-4 mb-5">
          <div className="flex items-center flex-1">
            <div className="flex dark:border items-center bg-dashboard-bg rounded-full p-0.5 w-[142px]">
              <button
                onClick={() => setActiveFilter("all")}
                className={`px-5 py-2 rounded-full text-sm font-bold font-geist transition-colors ${
                  activeFilter === "all"
                    ? "bg-dashboard-primary dark:text-black text-black"
                    : "text-dashboard-heading hover:text-dashboard-primary"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveFilter("unread")}
                className={`px-4 py-2 rounded-full text-sm font-geist transition-colors ${
                  activeFilter === "unread"
                    ? "bg-dashboard-primary dark:text-black text-black"
                    : "text-dashboard-heading hover:text-dashboard-primary"
                }`}
              >
                Unread
              </button>
            </div>
          </div>

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
          {isLoading ? (
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
                          ? "bg-dashboard-primary border-dashboard-primary text-black"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {selectedIds.includes(notification._id) && (
                        <Check size={14} strokeWidth={3} />
                      )}
                    </div>

                    {/* Avatar/Icon */}
                    <div className="w-[38px] h-[38px] rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                      {getIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-0.5">
                      <h4
                        className={`text-sm font-normal text-dashboard-title font-geist leading-[150%] ${
                          !notification.isRead ? "font-semibold" : ""
                        }`}
                      >
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
                          <div className="w-2 h-2 bg-dashboard-primary rounded-full" />
                        )}
                        <button
                          onClick={(e) => handleDelete(notification._id, e)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <span className="text-sm text-dashboard-body font-geist leading-[150%] whitespace-nowrap">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Empty State */}
        {!isLoading && notifications.length === 0 && (
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

      {/* Detail Modal — shadcn Dialog (Escape + overlay-click close built-in) */}
      <Dialog
        open={showDetailModal && selectedNotification !== null}
        onOpenChange={(open) => {
          if (!open) {
            setShowDetailModal(false);
            setSelectedNotification(null);
          }
        }}
      >
        {selectedNotification && (
          <DialogContent className="sm:max-w-lg rounded-3xl p-0 overflow-hidden">
            {/* Header */}
            <DialogHeader className="p-6 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                  {getIcon(selectedNotification.type)}
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold dark:text-white">
                    {selectedNotification.title}
                  </DialogTitle>
                  <DialogDescription className="text-xs text-gray-400 mt-0.5">
                    {formatDistanceToNow(new Date(selectedNotification.createdAt), {
                      addSuffix: true,
                    })}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Body */}
            <div className="p-8">
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6">
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {selectedNotification.message}
                </p>
              </div>

              {selectedNotification.referenceId && (
                <div className="mt-6">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Reference Info
                  </p>
                  <div className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-800 rounded-xl">
                    <span className="text-sm font-medium dark:text-gray-400">
                      Model: {selectedNotification.referenceModel}
                    </span>
                    <span className="text-xs font-mono text-gray-500 truncate ml-4">
                      ID: {selectedNotification.referenceId}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <DialogFooter className="p-6 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-end gap-3 sm:space-x-0">
              <button
                onClick={() => handleDelete(selectedNotification._id)}
                className="px-6 py-2.5 rounded-full text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-2"
              >
                <Trash2 size={16} />
                Delete
              </button>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedNotification(null);
                }}
                className="px-8 py-2.5 rounded-full text-sm font-bold bg-dashboard-primary text-black hover:opacity-90 transition-opacity shadow-lg shadow-dashboard-primary/20"
              >
                Close
              </button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      {/* Delete Confirmation — shared ConfirmModal */}
      <ConfirmModal
        open={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleConfirmDelete}
        title={confirmTitle}
        description={confirmDescription}
        confirmLabel="Delete"
        variant="danger"
        isLoading={isConfirmLoading}
      />
    </AdminLayout>
  );
};

export default Notifications;
