import React, { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminAnalyticsOverview from "@/components/admin/AdminAnalyticsOverview";
import AdminAnalyticsReport from "@/components/admin/AdminAnalyticsReport";

const AdminAnalytics = () => {
  const [activeTab, setActiveTab] = useState<"analytics" | "report">("analytics");

  return (
    <AdminLayout title="Analytics">
      <div className="flex-1 flex flex-col overflow-x-hidden">
        <div className="flex items-center justify-between bg-white dark:bg-tpl-dark-2 rounded-t-[10px] px-6 py-5 shadow-tpl-1 border-b border-tpl-stroke">
          <h2 className="text-[18px] font-bold text-tpl-dark dark:text-white tracking-tight">
            {activeTab === "analytics" ? "Analytics Overview" : "Analytics Report"}
          </h2>
          <div className="flex gap-1 bg-tpl-gray-2 dark:bg-white/5 rounded-lg p-1">
            {(["analytics", "report"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${
                  activeTab === tab
                    ? "bg-white dark:bg-tpl-dark-2 text-tpl-primary shadow-tpl-1"
                    : "text-tpl-dark-5 hover:text-tpl-dark dark:hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 bg-white dark:bg-tpl-dark-2 rounded-b-[10px] shadow-tpl-1 overflow-x-hidden">
          {activeTab === "analytics" ? <AdminAnalyticsOverview /> : <AdminAnalyticsReport />}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;
