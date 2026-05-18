import React from "react";
import AdminLayout from "../components/AdminLayout";
import AdminAnalyticsReport from "../components/AdminAnalyticsReport";

const AdminAnalyticsReportPage = () => (
  <AdminLayout title="Analytics Report">
    <div className="bg-white border border-dashboard-stroke rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-dashboard-stroke">
        <h2 className="text-base font-bold text-dashboard-heading font-geist">Report</h2>
      </div>
      <AdminAnalyticsReport />
    </div>
  </AdminLayout>
);

export default AdminAnalyticsReportPage;
