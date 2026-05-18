import React, { useState } from "react";
import AdminLayout from "../components/AdminLayout";
import AdminAnalyticsOverview from "../components/AdminAnalyticsOverview";
import AdminAnalyticsReport from "../components/AdminAnalyticsReport";

const AdminAnalytics = () => {
  const [activeTab, setActiveTab] = useState<"analytics" | "report">("analytics");

  return (
    <AdminLayout title="Analytics">
      <div className="flex-1 flex flex-col overflow-x-hidden">
        <div className="flex items-center justify-between bg-white border border-dashboard-stroke rounded-t-2xl px-5 py-3">
          <h2 className="text-base font-bold text-dashboard-heading font-geist">
            {activeTab === "analytics" ? "Analytics Overview" : "Analytics Report"}
          </h2>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {(["analytics", "report"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all capitalize ${
                  activeTab === tab
                    ? "bg-white text-dashboard-primary shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 bg-white border border-t-0 border-dashboard-stroke rounded-b-2xl overflow-x-hidden">
          {activeTab === "analytics" ? <AdminAnalyticsOverview /> : <AdminAnalyticsReport />}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;
