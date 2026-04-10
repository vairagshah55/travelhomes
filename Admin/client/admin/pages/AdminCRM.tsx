import React, { useState } from "react";
import AdminSidebar from "../components/AdminSidebar";
import AdminHeader from "../components/AdminHeader";
import { crmService } from "../../services/crm";
import { toast } from "sonner";

const AdminCRM: React.FC = () => {
  const [activeTab, setActiveTab] = useState("Vendor");
  // Supports multiple channels
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  // Generic service type for Vendor, User, and Staff
  const [serviceType, setServiceType] = useState("");
  const [message, setMessage] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const tabs = ["Vendor", "User", "Staff"];
  const commTypes = ["Email", "Text", "Whatsapp"];

  const toggleChannel = (type: string) => {
    setSelectedChannels((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
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
        targetType: activeTab as 'Vendor' | 'User' | 'Staff',
        channels: selectedChannels,
        serviceType: serviceType as 'Caravan' | 'Stay' | 'Activity' | '',
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
    <div className="min-h-screen bg-[#F9FAFB] flex">
      <div className="fixed">
        <AdminSidebar
          showMobileSidebar={mobileOpen}
          setShowMobileSidebar={setMobileOpen}
        />
      </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-x-hidden ml-60 max-lg:ml-0">
        {/* Top Header */}
        <AdminHeader
          Headtitle={"CRM"}
          setMobileSidebarOpen={setMobileOpen}
        />

        {/* Main Content */}
        <div className="flex-1 px-5 pb-5 lg:pr-5">
          <div className="bg-white rounded-t-[24px] border-b border-dashboard-stroke h-[75px] px-5 flex items-center">
            <h2 className="text-xl font-bold text-dashboard-heading font-geist tracking-tight">
              CRM
            </h2>
          </div>

          <div className="bg-white rounded-b-[24px] p-5 space-y-7">
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
                    activeTab === tab ? "text-[#0B0907]" : "text-[#6B6B6B]"
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
            <div className="flex items-center gap-2 p-0.5 border border-[#EAEAEA] rounded-full bg-white shadow-sm w-fit">
              {commTypes.map((type) => {
                const isSelected = selectedChannels.includes(type);
                return (
                  <button
                    key={type}
                    onClick={() => toggleChannel(type)}
                    className={`px-5 py-3 text-sm font-medium rounded-full transition-all ${
                      isSelected
                        ? "bg-dashboard-primary text-white font-semibold"
                        : "text-dashboard-primary hover:bg-gray-100"
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>

            {/* Form */}
            <div className="border border-dashboard-stroke rounded-xl p-4 space-y-5">
              {/* Type Dropdown (Dynamic Label) */}
              <div className="space-y-3">
                <label className="block text-base text-[#334054] font-plus-jakarta">
                  {activeTab} Type
                </label>
                <div className="relative">
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="w-full px-3 py-3.5 border border-[#B0B0B0] rounded-lg text-sm text-[#98A2B3] font-plus-jakarta focus:outline-none focus:ring-2 focus:ring-dashboard-primary focus:border-transparent appearance-none"
                  >
                    <option value="">Select All</option>
                    <option value="Caravan">Caravan</option>
                    <option value="Stay">Stay</option>
                    <option value="Activity">Activity</option>
                  </select>
                  <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 18 18"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M14.9396 6.71289L10.0496 11.6029C9.47207 12.1804 8.52707 12.1804 7.94957 11.6029L3.05957 6.71289"
                        stroke="#292D32"
                        strokeWidth="1.5"
                        strokeMiterlimit="10"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Message Textarea */}
              <div className="space-y-3">
                <label className="block text-base text-[#334054] font-plus-jakarta">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write Message here..."
                  rows={5}
                  className="w-full px-3 py-3.5 border border-[#B0B0B0] rounded-lg text-sm text-[#717171] font-plus-jakarta focus:outline-none focus:ring-2 focus:ring-dashboard-primary focus:border-transparent resize-none"
                />
              </div>

              {/* Send Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleSendMessage}
                  disabled={loading}
                  className={`px-6 py-3 bg-dashboard-primary text-white text-sm font-medium rounded-full font-geist tracking-tight transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-90'}`}
                >
                  {loading ? 'Sending...' : 'Send Message'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCRM;
