import React, { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminAnalyticsOverview from "@/components/admin/AdminAnalyticsOverview";
import AdminAnalyticsReport from "@/components/admin/AdminAnalyticsReport";
import { MotionReveal } from "@/components/admin/MotionReveal";

const AdminAnalytics = () => {
  const [activeTab, setActiveTab] = useState<"analytics" | "report">("analytics");

  return (
    <AdminLayout title="Analytics">
      <div className="space-y-6">
        {/* Toolbar — title + Overview/Report segmented control */}
        <div className="flex items-center justify-between gap-4 bg-white dark:bg-tpl-dark-2 rounded-2xl border border-tpl-stroke px-6 py-4 shadow-tpl-1">
          <h2 className="text-[18px] font-bold text-tpl-dark dark:text-white tracking-tight">
            {activeTab === "analytics" ? "Analytics Overview" : "Analytics Report"}
          </h2>
          <div className="flex gap-1 bg-tpl-gray-2 dark:bg-white/5 rounded-lg p-1">
            {(
              [
                ["analytics", "Overview"],
                ["report", "Report"],
              ] as const
            ).map(([tab, label]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab
                    ? "bg-white dark:bg-white/10 text-tpl-primary shadow-tpl-1"
                    : "text-tpl-dark-5 hover:text-tpl-dark dark:hover:text-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Content — overview cards sit on the page bg; report stays in a card */}
        {activeTab === "analytics" ? (
          <MotionReveal delay={0}>
            <AdminAnalyticsOverview />
          </MotionReveal>
        ) : (
          <MotionReveal delay={0}>
            <div className="bg-white dark:bg-tpl-dark-2 rounded-2xl border border-tpl-stroke shadow-tpl-1 overflow-hidden">
              <AdminAnalyticsReport />
            </div>
          </MotionReveal>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;
