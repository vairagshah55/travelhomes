import React, { useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { crmService } from "@/services/crm";
import { toast } from "sonner";

const AdminCRM: React.FC = () => {
  const [activeTab, setActiveTab] = useState("Vendor");
  // Supports multiple channels
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  // Generic service type for Vendor, User, and Staff
  const [serviceType, setServiceType] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const tabs = ["Vendor", "User", "Staff"];
  const commTypes = ["Email", "Text", "Whatsapp"];

  const toggleChannel = (type: string) => {
    setSelectedChannels((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type],
    );
  };

  const handleSendMessage = async () => {
    try {
      if (selectedChannels.length === 0) {
        toast.error("Please select at least one channel");
        return;
      }
      if (!message.trim()) {
        toast.error("Please enter a message");
        return;
      }

      setLoading(true);
      await crmService.sendMessage({
        targetType: activeTab as "Vendor" | "User" | "Staff",
        channels: selectedChannels,
        serviceType: serviceType as "Caravan" | "Stay" | "Activity" | "",
        message,
      });
      toast.success("Message sent successfully!");
      setMessage("");
      setServiceType("");
      setSelectedChannels([]);
    } catch (e) {
      console.error(e);
      toast.error("Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout title="CRM">
      <div className="flex-1">
        <div className="bg-white dark:bg-tpl-dark-2 rounded-t-[10px] border-b border-tpl-stroke h-[68px] px-6 flex items-center shadow-tpl-1">
          <h2 className="text-[18px] font-bold text-tpl-dark dark:text-white tracking-tight">
            CRM
          </h2>
        </div>

        <div className="bg-white dark:bg-tpl-dark-2 rounded-b-[10px] shadow-tpl-1 p-6 space-y-7">
          {/* Tab Navigation */}
          <div className="flex items-center">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setServiceType(""); // Reset service type when switching tabs
                }}
                className={`px-4 py-3 text-base font-bold transition-colors relative ${
                  activeTab === tab
                    ? "text-tpl-dark dark:text-white"
                    : "text-tpl-dark-5 dark:text-tpl-dark-6"
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-dashboard-primary" />
                )}
              </button>
            ))}
          </div>

          {/* Communication Type Selector (Multi-select) */}
          <div className="flex items-center gap-2 p-0.5 border border-tpl-stroke rounded-full bg-tpl-gray-2 dark:bg-white/5 shadow-sm w-fit">
            {commTypes.map((type) => {
              const isSelected = selectedChannels.includes(type);
              return (
                <button
                  key={type}
                  onClick={() => toggleChannel(type)}
                  className={`px-5 py-3 text-sm font-medium rounded-full transition-all ${
                    isSelected
                      ? "bg-dashboard-primary text-black font-semibold"
                      : "text-dashboard-primary hover:bg-gray-100"
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>

          {/* Form */}
          <div className="border border-tpl-stroke dark:border-white/10 rounded-xl p-4 space-y-5">
            {/* Service-type filter — only meaningful for Vendor/User segments,
                  who are grouped by service category. Staff have no service type. */}
            {activeTab !== "Staff" && (
              <div className="space-y-3">
                <label className="block text-base text-tpl-dark-4 dark:text-tpl-dark-6 font-plus-jakarta">
                  {activeTab} Service Type
                </label>
                <div className="relative">
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="w-full px-3 py-3.5 border border-tpl-stroke dark:border-white/10 bg-transparent text-tpl-dark dark:text-white rounded-lg text-sm font-plus-jakarta focus:outline-none focus:ring-2 focus:ring-tpl-primary focus:border-transparent appearance-none"
                  >
                    <option value="">Select All</option>
                    <option value="Caravan">Caravan</option>
                    <option value="Stay">Stay</option>
                    <option value="Activity">Activity</option>
                  </select>
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-tpl-dark-5">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M14.9396 6.71289L10.0496 11.6029C9.47207 12.1804 8.52707 12.1804 7.94957 11.6029L3.05957 6.71289"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeMiterlimit="10"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {/* Message Textarea */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-base text-tpl-dark-4 dark:text-tpl-dark-6 font-plus-jakarta">
                  Message
                </label>
                <span className="text-[12px] text-tpl-dark-5 dark:text-tpl-dark-6">
                  {message.length}/1000
                </span>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 1000))}
                placeholder="Write message here..."
                rows={5}
                maxLength={1000}
                className="w-full px-3 py-3.5 border border-tpl-stroke dark:border-white/10 bg-transparent text-tpl-dark dark:text-white rounded-lg text-sm font-plus-jakarta focus:outline-none focus:ring-2 focus:ring-tpl-primary focus:border-transparent resize-none"
              />
            </div>

            {/* Send Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSendMessage}
                disabled={loading || !message.trim() || selectedChannels.length === 0}
                className="px-6 py-3 bg-tpl-primary text-black text-sm font-medium rounded-full font-geist tracking-tight transition-colors hover:bg-tpl-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Sending..." : "Send Message"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCRM;
