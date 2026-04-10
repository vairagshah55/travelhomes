import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Bell, Menu, Loader2, Trash2, CheckSquare, Square, X } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Sidebar } from '@/components/Navigation';
import ProfileDropdown from '@/components/ProfileDropdown';
import ChangePasswordModal from '@/components/ChangePasswordModal';
import { DashboardHeader } from '@/components/Header';
import { notificationsApi, NotificationDTO } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import toast from 'react-hot-toast';

const Notifications = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Selection and Modal states
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedNotification, setSelectedNotification] = useState<any | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationsApi.list(false, 50, 'vendor');
      if (res.success) {
        setNotifications(res.data);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const filteredNotifications = activeFilter === 'unread' 
    ? notifications.filter(n => !n.isRead)
    : notifications;

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      toast.success('All marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(notifications.map(n => (n.id === id || n._id === id) ? { ...n, isRead: true } : n));
    } catch (error) {
      console.error('Error marking as read:', error);
      setNotifications(notifications.map(n => (n.id === id || n._id === id) ? { ...n, isRead: true } : n));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    
    try {
      const loadingToast = toast.loading('Deleting notifications...');
      await notificationsApi.deleteMany(selectedIds);
      setNotifications(notifications.filter(n => !selectedIds.includes(n.id || n._id)));
      setSelectedIds([]);
      toast.dismiss(loadingToast);
      toast.success('Deleted successfully');
    } catch (error) {
      console.error('Error deleting:', error);
      // Fallback for demo
      setNotifications(notifications.filter(n => !selectedIds.includes(n.id || n._id)));
      setSelectedIds([]);
      toast.success('Deleted (Demo Mode)');
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredNotifications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredNotifications.map(n => n.id || n._id));
    }
  };

  const handleOpenNotification = (notification: any) => {
    setSelectedNotification(notification);
    setIsViewModalOpen(true);
    if (!notification.isRead) {
      handleMarkAsRead(notification.id || notification._id);
    }
  };

  const getTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="flex h-screen bg-dashboard-bg font-plus-jakarta">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar isCollapsed={isCollapsed} onToggleCollapse={handleToggleCollapse} />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
       <DashboardHeader Headtitle={"Notifications"}/>

        {/* Notifications Content */}
        <main className="flex-1 p-4 lg:p-5 bg-white  dark:bg-black dark:text-white m-2 lg:m-5 rounded-2xl lg:rounded-3xl overflow-auto">
          {/* Filter Tabs and Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-dashboard-stroke pb-4 mb-5">
            <div className="flex items-center gap-4">
              {/* Select All Checkbox */}
              <div className="flex items-center gap-2 pr-4 border-r border-dashboard-stroke">
                <Checkbox 
                  checked={filteredNotifications.length > 0 && selectedIds.length === filteredNotifications.length}
                  onCheckedChange={handleSelectAll}
                  id="select-all"
                />
                <label htmlFor="select-all" className="text-sm font-geist cursor-pointer select-none">
                  All
                </label>
              </div>

              {/* Filter Tabs */}
              <div className="flex dark:border items-center bg-dashboard-bg rounded-full p-0.5 w-[142px]">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-5 py-2 rounded-full text-sm font-bold font-geist transition-colors ${
                    activeFilter === 'all'
                      ? 'bg-dashboard-primary dark:text-black text-white'
                      : 'text-dashboard-heading hover:text-dashboard-primary'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setActiveFilter('unread')}
                  className={`px-4 py-2 rounded-full text-sm font-geist transition-colors ${
                    activeFilter === 'unread'
                      ? 'bg-dashboard-primary dark:text-black text-white'
                      : 'text-dashboard-heading hover:text-dashboard-primary'
                  }`}
                >
                  Unread
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {selectedIds.length > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  className="flex items-center gap-2 px-4 py-1.5 text-sm font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors"
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
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-dashboard-primary animate-spin" />
                <p className="mt-4 text-dashboard-body font-geist">Loading notifications...</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id || notification._id}
                  className={`border border-dashboard-stroke rounded-2xl dark:bg-black dark:text-white bg-white hover:shadow-sm transition-all cursor-pointer max-w-[1096px] group flex items-center ${
                    !notification.isRead ? 'border-l-4 border-l-dashboard-primary bg-blue-50/5' : ''
                  }`}
                >
                  {/* Checkbox Container */}
                  <div className="pl-4" onClick={(e) => e.stopPropagation()}>
                    <Checkbox 
                      checked={selectedIds.includes(notification.id || notification._id)}
                      onCheckedChange={() => handleToggleSelect(notification.id || notification._id)}
                    />
                  </div>

                  <div className="p-[18px] flex-1" onClick={() => handleOpenNotification(notification)}>
                    <div className="flex items-start gap-5">
                      {/* Avatar */}
                      <img
                        src={notification.avatar || 'https://api.builder.io/api/v1/image/assets/TEMP/601b0cb8de879e2bb353a2eb82394808d5046f75?width=76'}
                        alt="User"
                        className="w-[38px] h-[38px] rounded-full flex-shrink-0 object-cover"
                      />

                      {/* Content */}
                      <div className="flex-1 space-y-0.5">
                        <h4 className={`text-sm font-geist leading-[150%] ${!notification.isRead ? 'font-bold text-dashboard-heading' : 'font-normal text-dashboard-title'}`}>
                          {notification.title}
                        </h4>
                        <p className="text-xs text-dashboard-body font-geist leading-[150%] max-w-[906px] line-clamp-1">
                          {notification.message}
                        </p>
                      </div>

                      {/* Right Side - Unread indicator and time */}
                      <div className="flex flex-col items-end gap-5 pt-1.5 min-w-[80px]">
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-dashboard-primary rounded-full"></div>
                        )}
                        <div className="flex flex-col items-end gap-0.5">
                          <span className="text-[10px] text-dashboard-body font-geist leading-[150%] whitespace-nowrap">
                            {getTimeAgo(notification.createdAt || notification.time)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Empty State */}
          {!loading && filteredNotifications.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Bell size={48} className="text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-dashboard-heading font-geist mb-2">
                No notifications
              </h3>
              <p className="text-dashboard-body font-plus-jakarta">
                {activeFilter === 'unread' 
                  ? "You don't have any unread notifications"
                  : "You don't have any notifications yet"
                }
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Notification View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl p-6">
          <DialogHeader>
            <div className="flex items-center gap-4 mb-2">
               <img
                src={selectedNotification?.avatar || 'https://api.builder.io/api/v1/image/assets/TEMP/601b0cb8de879e2bb353a2eb82394808d5046f75?width=76'}
                alt="Avatar"
                className="w-12 h-12 rounded-full object-cover"
              />
              <div>
                <DialogTitle className="text-lg font-bold font-geist">
                  {selectedNotification?.title}
                </DialogTitle>
                <p className="text-[10px] text-dashboard-body font-geist">
                  {selectedNotification?.createdAt && getTimeAgo(selectedNotification.createdAt)}
                </p>
              </div>
            </div>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-dashboard-title leading-relaxed font-geist">
              {selectedNotification?.message}
            </p>
          </div>
          <DialogFooter>
            <Button 
              onClick={() => setIsViewModalOpen(false)}
              className="bg-dashboard-primary text-black hover:bg-dashboard-primary/90 rounded-full px-8"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onOpenChange={setIsChangePasswordOpen}
      />
    </div>
  );
};

export default Notifications;
