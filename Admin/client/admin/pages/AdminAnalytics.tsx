import React, { useState } from "react";
import AdminSidebar from "../components/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Bell } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import AdminAnalyticsOverview from "../components/AdminAnalyticsOverview";
import AdminAnalyticsReport from "../components/AdminAnalyticsReport";
import AdminProfileDropdown from "../components/AdminProfileDropdown";
import AdminHeader from "../components/AdminHeader";

const AdminAnalytics = () => {
  const [activeTab, setActiveTab] = useState<"analytics" | "report">(
    "analytics",
  );
    const [mobileOpen, setMobileOpen] = useState(false);


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
        <AdminHeader Headtitle={"Analytics"} setMobileSidebarOpen={setMobileOpen}/>

        {/* Content Area */}
        <div className="flex-1 flex flex-col pr-5 pb-5 overflow-x-hidden">
          {/* Tab Navigation */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-dashboard-stroke bg-white rounded-t-3xl">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-dashboard-title font-geist">
                {activeTab === "analytics" ? "Analytics" : "Report"}
              </h2>
            </div>
          </div>

         

         

          {/* Content */}
          <div className="flex-1 bg-white rounded-b-3xl  max-md:flex-wrap overflow-x-hidden">
            {activeTab === "analytics" ? (
              <AdminAnalyticsOverview />
            ) : (
              <AdminAnalyticsReport />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
