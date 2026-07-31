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
        <div className="flex items-center justify-between gap-4 bg-app-surface rounded-[18px] border border-app-border shadow-[0_1px_2px_rgba(16,24,40,0.04),0_10px_28px_-14px_rgba(16,24,40,0.16)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.35),0_12px_32px_-16px_rgba(0,0,0,0.55)] px-5 py-4">
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
                    ? "bg-app-surface text-app-accent shadow-[0_1px_2px_rgba(16,24,40,0.08)]"
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
            <div className="bg-app-surface rounded-[18px] border border-app-border shadow-[0_1px_2px_rgba(16,24,40,0.04),0_10px_28px_-14px_rgba(16,24,40,0.16)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.35),0_12px_32px_-16px_rgba(0,0,0,0.55)] overflow-hidden">
              <AdminAnalyticsReport />
            </div>
          </MotionReveal>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;
