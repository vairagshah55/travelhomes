import React, { useEffect, useState } from "react";
import AdminSidebar from "../components/AdminSidebar";
import AdminHeader from "../components/AdminHeader";
import { settingsService } from "@/services/api";
import { getImageUrl } from "@/lib/utils";


const AdminGlobalSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState("SEO");
  const [activePage, setActivePage] = useState("About");
  const [activeUserType, setActiveUserType] = useState<"Vendor" | "User">("Vendor");

  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // SEO Form States
  const [metaKeywords, setMetaKeywords] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [socialTitle, setSocialTitle] = useState("");
  const [socialDescription, setSocialDescription] = useState("");
  const [ogImageUrl, setOgImageUrl] = useState<string>("");
  const [seoEditable, setSeoEditable] = useState(false);

  // Settings States
  const [vendorApproval, setVendorApproval] = useState(true);
  const [mobileApproval, setMobileApproval] = useState(true);
  const [emailApproval, setEmailApproval] = useState(true);
  const [phoneApproval, setPhoneApproval] = useState(true);

  const tabs = ["SEO", "Other Settings"];
  const pages = [
    "Homepage",
    "About",
    "Career",
    "Blog",
    "Why Host With Us",
    "Contact Us",
    "Policy",
    "Privacy Policy",
    "Blog Details",
    "Help",
  ];
  const userTypes: Array<"Vendor" | "User"> = ["Vendor", "User"];

  // Fetch SEO for activePage
  useEffect(() => {
    if (activeTab !== "SEO") return;
    const loadSeo = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await settingsService.getSeo(activePage);
        setMetaKeywords(data?.metaKeywords || "");
        setMetaTitle(data?.metaTitle || "");
        setMetaDescription(data?.metaDescription || "");
        setSocialTitle(data?.socialTitle || "");
        setSocialDescription(data?.socialDescription || "");
        setOgImageUrl(data?.ogImageUrl || "");
        setSeoEditable(false);
      } catch (e: any) {
        setError(typeof e === 'string' ? e : 'Failed to load SEO settings');
      } finally {
        setLoading(false);
      }
    };
    loadSeo();
  }, [activeTab, activePage]);

  // Fetch System settings for activeUserType
  useEffect(() => {
    if (activeTab !== "Other Settings") return;
    const loadSystem = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await settingsService.getSystem(activeUserType);
        setVendorApproval(Boolean(data?.vendorApproval));
        setMobileApproval(Boolean(data?.mobileApproval));
        setEmailApproval(Boolean(data?.emailApproval));
        setPhoneApproval(Boolean(data?.phoneApproval));
      } catch (e: any) {
        setError(typeof e === 'string' ? e : 'Failed to load system settings');
      } finally {
        setLoading(false);
      }
    };
    loadSystem();
  }, [activeTab, activeUserType]);

  // Save handlers
  const saveSeo = async () => {
    try {
      setLoading(true);
      await settingsService.upsertSeo({
        page: activePage,
        metaKeywords,
        metaTitle,
        metaDescription,
        socialTitle,
        socialDescription,
        ogImageUrl,
      });
      setSeoEditable(false);
    } catch (e) {
      console.error('Failed to save SEO settings', e);
    } finally {
      setLoading(false);
    }
  };

  const saveSystem = async () => {
    try {
      setLoading(true);
      await settingsService.updateSystem({
        userType: activeUserType,
        vendorApproval,
        mobileApproval,
        emailApproval,
        phoneApproval,
      });
    } catch (e) {
      console.error('Failed to save system settings', e);
    } finally {
      setLoading(false);
    }
  };

  // Upload handlers for favicon/logo/og
  const handleUpload = async (type: 'favicon' | 'logo' | 'og' | 'logo_dark', file?: File | null) => {
    if (!file) return;
    try {
      setLoading(true);
      const res = await settingsService.uploadSeoAsset(activePage, type, file);
      if (type === 'og') setOgImageUrl(res?.ogImageUrl || "");
    } catch (e) {
      console.error('Upload failed', e);
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
          Headtitle={"Global Settings"}
          setMobileSidebarOpen={setMobileOpen}
        />

        {/* Main Content */}
        <div className="flex-1 px-5 pb-5 lg:pr-5">
          <div className="bg-white rounded-t-[24px] border-b border-dashboard-stroke h-[75px] px-5 flex items-center">
            <h2 className="text-xl font-bold text-dashboard-heading font-geist tracking-tight">
              Settings
            </h2>
          </div>

          <div className="bg-white rounded-b-[24px] p-5 space-y-6">
            {/* Tab Navigation */}
            <div className="flex items-center max-md:flex-wrap">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
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

            {activeTab === "SEO" ? (
              /* SEO Content */
              <div className="space-y-4">
                <div className="border border-dashboard-stroke rounded-xl p-4 space-y-3">
                  {/* Page Selector */}
                  <div className="flex flex-wrap items-center  p-0.5 border border-[#EAEAEA] max-sm:rounded-lg rounded-full bg-white shadow-sm">
                    {pages.map((page) => (
                      <button
                        key={page}
                        onClick={() => setActivePage(page)}
                        className={`px-5 py-3 text-sm font-medium rounded-full transition-all whitespace-nowrap ${
                          activePage === page
                            ? "bg-dashboard-primary text-white font-semibold"
                            : "text-dashboard-primary"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  {/* Divider */}
                  <div className="w-full h-px border-t border-dashed border-dashboard-stroke" />

                  {/* SEO Form */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-6">
                      {/* Meta Keywords */}
                      <div className="space-y-3">
                        <label className="block text-base text-[#334054] font-plus-jakarta">
                          Meta Keywords
                        </label>
                        <input
                          type="text"
                          value={metaKeywords}
                          onChange={(e) => setMetaKeywords(e.target.value)}
                          placeholder="Select"
                          className="w-full px-3 py-3.5 border border-[#B0B0B0] rounded-lg text-sm text-[#98A2B3] font-plus-jakarta focus:outline-none focus:ring-2 focus:ring-dashboard-primary focus:border-transparent"
                          disabled={!seoEditable}
                        />
                      </div>

                      {/* Meta Title */}
                      <div className="space-y-3">
                        <label className="block text-base text-[#334054] font-plus-jakarta">
                          Meta Title
                        </label>
                        <input
                          type="text"
                          value={metaTitle}
                          onChange={(e) => setMetaTitle(e.target.value)}
                          className="w-full px-3 py-3.5 border border-[#B0B0B0] rounded-lg text-sm text-[#717171] font-plus-jakarta focus:outline-none focus:ring-2 focus:ring-dashboard-primary focus:border-transparent"
                          disabled={!seoEditable}
                        />
                      </div>

                      {/* Meta Description */}
                      <div className="space-y-3">
                        <label className="block text-base text-[#334054] font-plus-jakarta">
                          Meta Description
                        </label>
                        <textarea
                          value={metaDescription}
                          onChange={(e) => setMetaDescription(e.target.value)}
                          placeholder="Write Message here..."
                          rows={5}
                          className="w-full px-3 py-3.5 border border-[#B0B0B0] rounded-lg text-sm text-[#717171] font-plus-jakarta focus:outline-none focus:ring-2 focus:ring-dashboard-primary focus:border-transparent resize-none"
                          disabled={!seoEditable}
                        />
                      </div>
                    </div>

                    <div className="space-y-6">
                      {/* Social Title */}
                      <div className="space-y-3">
                        <label className="block text-base text-[#334054] font-plus-jakarta">
                          Social Title
                        </label>
                        <input
                          type="text"
                          value={socialTitle}
                          onChange={(e) => setSocialTitle(e.target.value)}
                          className="w-full px-3 py-3.5 border border-[#B0B0B0] rounded-lg text-sm text-[#98A2B3] font-plus-jakarta focus:outline-none focus:ring-2 focus:ring-dashboard-primary focus:border-transparent"
                          disabled={!seoEditable}
                        />
                      </div>

                      {/* Social Description */}
                      <div className="space-y-3 flex-1">
                        <label className="block text-base text-[#334054] font-plus-jakarta">
                          Social Description
                        </label>
                        <textarea
                          value={socialDescription}
                          onChange={(e) => setSocialDescription(e.target.value)}
                          placeholder="Write Message here..."
                          rows={9}
                          className="w-full px-3 py-3.5 border border-[#B0B0B0] rounded-lg text-sm text-[#717171] font-plus-jakarta focus:outline-none focus:ring-2 focus:ring-dashboard-primary focus:border-transparent resize-none"
                          disabled={!seoEditable}
                        />
                      </div>
    {/* Actions: Edit/Save */}
                  <div className="flex gap-3">
                    {!seoEditable ? (
                      <button onClick={() => setSeoEditable(true)} className="px-4 py-2 bg-dashboard-primary text-white rounded-md">
                        Edit
                      </button>
                    ) : (
                      <button onClick={saveSeo} className="px-4 py-2 bg-dashboard-primary text-white rounded-md">
                        Save Details
                      </button>
                    )}
                  </div>


                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Other Settings Content */
              <div className="space-y-4">
                <div className="border border-dashboard-stroke rounded-xl p-4 space-y-4">
                  {/* User Type Selector */}
                  <div className="flex items-center p-0.5 border border-[#EAEAEA] rounded-full bg-white shadow-sm w-fit">
                    {userTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => setActiveUserType(type)}
                        className={`px-6 py-3 text-sm font-medium rounded-full transition-all ${
                          activeUserType === type
                            ? "bg-dashboard-primary text-white font-semibold"
                            : "text-dashboard-primary"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>

                  {/* Divider */}
                  <div className="w-full h-px border-t border-dashed border-dashboard-stroke" />

                  {/* Settings Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Vendor Approval */}
                    <div className="flex items-center justify-between">
                      <span className="text-base text-[#334054] font-medium font-plus-jakarta">
                        Vendor Approval
                      </span>
                      <div
                        onClick={async () => {
                          const next = !vendorApproval;
                          setVendorApproval(next);
                          await saveSystem();
                        }}
                        className={`relative w-9 h-5 rounded-full cursor-pointer transition-colors ${
                          vendorApproval ? "bg-[#2563EB]" : "bg-gray-300"
                        }`}
                      >
                        <div
                          className={`absolute w-4 h-4 bg-white rounded-full shadow-sm transition-transform top-0.5 ${
                            vendorApproval ? "translate-x-4" : "translate-x-0.5"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Mobile Approval */}
                    <div className="flex items-center justify-between">
                      <span className="text-base text-[#334054] font-medium font-plus-jakarta">
                        Mobile Approval
                      </span>
                      <div
                        onClick={async () => {
                          const next = !mobileApproval;
                          setMobileApproval(next);
                          await saveSystem();
                        }}
                        className={`relative w-9 h-5 rounded-full cursor-pointer transition-colors ${
                          mobileApproval ? "bg-[#2563EB]" : "bg-gray-300"
                        }`}
                      >
                        <div
                          className={`absolute w-4 h-4 bg-white rounded-full shadow-sm transition-transform top-0.5 ${
                            mobileApproval ? "translate-x-4" : "translate-x-0.5"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Email Approval */}
                    <div className="flex items-center justify-between">
                      <span className="text-base text-[#334054] font-medium font-plus-jakarta">
                        Email Approval
                      </span>
                      <div
                        onClick={async () => {
                          const next = !emailApproval;
                          setEmailApproval(next);
                          await saveSystem();
                        }}
                        className={`relative w-9 h-5 rounded-full cursor-pointer transition-colors ${
                          emailApproval ? "bg-[#2563EB]" : "bg-gray-300"
                        }`}
                      >
                        <div
                          className={`absolute w-4 h-4 bg-white rounded-full shadow-sm transition-transform top-0.5 ${
                            emailApproval ? "translate-x-4" : "translate-x-0.5"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Phone Approval */}
                    <div className="flex items-center justify-between">
                      <span className="text-base text-[#334054] font-medium font-plus-jakarta">
                        Phone Approval
                      </span>
                      <div
                        onClick={async () => {
                          const next = !phoneApproval;
                          setPhoneApproval(next);
                          await saveSystem();
                        }}
                        className={`relative w-9 h-5 rounded-full cursor-pointer transition-colors ${
                          phoneApproval ? "bg-[#2563EB]" : "bg-gray-300"
                        }`}
                      >
                        <div
                          className={`absolute w-4 h-4 bg-white rounded-full shadow-sm transition-transform top-0.5 ${
                            phoneApproval ? "translate-x-4" : "translate-x-0.5"
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminGlobalSettings;
