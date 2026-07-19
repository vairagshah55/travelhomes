import React from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminAnalyticsReport from "@/components/admin/AdminAnalyticsReport";

const AdminAnalyticsReportPage = () => (
  <AdminLayout title="Analytics Report">
    <div className="bg-white dark:bg-tpl-dark-2 border border-tpl-stroke rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-tpl-stroke">
        <h2 className="text-base font-bold text-tpl-dark dark:text-white font-geist">Report</h2>
      </div>
      <AdminAnalyticsReport />
    </div>
  </AdminLayout>
);

export default AdminAnalyticsReportPage;
