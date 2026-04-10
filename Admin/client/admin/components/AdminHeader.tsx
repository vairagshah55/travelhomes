import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Bell, Menu, MessageCircle } from "lucide-react";
import ProfileDropdown from "./AdminProfileDropdown";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import AdminSidebar from "./AdminSidebar";

export default function AdminHeader({ Headtitle, setMobileSidebarOpen }) {

  const navigate = useNavigate();

  const handleNotificationClick = () => {
    navigate("/notifications");
  };
  const handleSwitchToUser = () => {
    navigate("/user-profile"); // Navigate to user dashboard
  };

  return (
    <header className="flex items-center justify-between p-4 lg:p-6 bg-dashboard-bg">
      {/* Header */}
      <div className="flex items-center gap-4">
        {/* Mobile Menu Button */}
        
        <button
            onClick={() => setMobileSidebarOpen((prev) => !prev)}
          className="text-gray-500 hover:text-gray-700 max-lg:block hidden"
        >
          <Menu size={24} />
        </button>
        {/* Mobile Menu Button */}
        {/* <Sheet onClick={() => setShowMobileSidebar(true)} open={showMobileSidebar} onOpenChange={setShowMobileSidebar}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden dark:bg-black dark:text-white">
              <Menu size={20} />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <AdminSidebar />
          </SheetContent>
        </Sheet> */}

        <h1 className="text-xl lg:text-2xl font-bold text-dashboard-heading tracking-tight font-geist">
          {Headtitle}
        </h1>
      </div>

      <div className="flex items-center gap-4 lg:gap-6">
        {/* <button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <MessageCircle size={20} className="text-dashboard-primary" />
        </button> */}
        {/* <ThemeToggle /> */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNotificationClick}
          className="relative bg-white rounded-full border shadow-sm h-9 w-9 hover:bg-gray-50 hover:shadow-md transition-all"
        >
          <Bell
            size={20}
            className="text-gray-600 dark:bg-white dark:text-black hover:text-dashboard-primary transition-colors"
          />
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse"></span>
        </Button>
        <ProfileDropdown />
      </div>
    </header>
  );
}
