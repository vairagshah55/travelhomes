import React, { useState, useEffect } from "react";
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Bell, Menu, Edit } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sidebar } from "@/components/Navigation";
import ProfileDropdown from "@/components/ProfileDropdown";
import ChangePasswordModal from "@/components/ChangePasswordModal";
import { DashboardHeader } from "@/components/Header";
import { userProfileApi, API_BASE_URL } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

const Profile = () => {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("personal");
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "business") setActiveTab("business");
    else if (tab === "social") setActiveTab("social");
    else setActiveTab("personal");
  }, [searchParams]);

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleNotificationClick = () => {
    window.location.href = "/notifications";
  };

  const handleSwitchToUser = () => {
    navigate("/user-profile"); // Navigate to user dashboard
  };

  // Load email from URL (?email=) or localStorage; user can also type it in the field below
  const defaultEmail =
    new URLSearchParams(window.location.search).get("email") ??
    localStorage.getItem("profileEmail") ??
    "";
  const [email, setEmail] = useState(defaultEmail);

  // Profile state from API
  const [profile, setProfile] = useState<any>({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    state: "",
    city: "",
    country: "",
    dateOfBirth: "",
    personalLocality: "",
    personalPincode: "",
    idProof: "",
    photo: "",
    vendorDetails: null,
    business: {},
    socialProfiles: []
  });

  const [isEditing, setIsEditing] = useState(false);

  const [saving, setSaving] = useState(false);

  // Fetch profile when email changes
  useEffect(() => {
    if (!email) return;
    localStorage.setItem("profileEmail", email);
    (async () => {
      try {
        const json = await userProfileApi.get(email);
        const data = json?.data || {};
        // Format date for input
        if (data.dateOfBirth) {
          data.dateOfBirth = new Date(data.dateOfBirth).toISOString().split('T')[0];
        }
        setProfile((prev) => ({ ...prev, ...data }));
        updateUser(data);
      } catch (e) {
        console.error(e);
        // Initialize minimal profile with just email if fetch fails (e.g. 404)
        setProfile((prev) => ({ ...prev, email }));
      }
    })();
  }, [email]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleBusinessInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile((prev: any) => ({
      ...prev,
      business: {
        ...(prev.business || {}),
        [name]: value
      }
    }));
  };

  const handleSaveProfile = async () => {
    try {
      if (!email) {
        toast.error('Please enter an email first', {
          duration: 4000,
          position: 'top-right',
          style: {
            background: '#EF4444',
            color: '#fff',
            fontWeight: '500',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.4)',
          },
          iconTheme: {
            primary: '#fff',
            secondary: '#EF4444',
          },
        });
        return;
      }
      setSaving(true);
      const json = await userProfileApi.upsert({ ...profile, email });
      const data = json.data || {};
      if (data.dateOfBirth) {
        data.dateOfBirth = new Date(data.dateOfBirth).toISOString().split('T')[0];
      }
      setProfile((prev) => ({ ...prev, ...data }));
      updateUser(data);
      setIsEditing(false);
      toast.success('Profile saved successfully!', {
        duration: 4000,
        position: 'top-right',
        style: {
          background: '#10B981',
          color: '#fff',
          fontWeight: '500',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)',
        },
        iconTheme: {
          primary: '#fff',
          secondary: '#10B981',
        },
      });
      
    } catch (e: any) {
      toast.error('Error: ' + e.message, {
        duration: 4000,
        position: 'top-right',
        style: {
          background: '#EF4444',
          color: '#fff',
          fontWeight: '500',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.4)',
        },
        iconTheme: {
          primary: '#fff',
          secondary: '#EF4444',
        },
      });
    } finally {
      setSaving(false);
    }
  };

  // Photo upload
  const [uploading, setUploading] = useState(false);
  const onPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!email) {
      toast.error('Please enter an email first', {
        duration: 4000,
        position: 'top-right',
        style: {
          background: '#EF4444',
          color: '#fff',
          fontWeight: '500',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.4)',
        },
        iconTheme: {
          primary: '#fff',
          secondary: '#EF4444',
        },
      });
      return;
    }
    const fd = new FormData();
    fd.append('photo', file);
    fd.append('email', email);
    try {
      setUploading(true);
      const json = await userProfileApi.uploadPhoto(email, file);
      const newUrl = json?.data?.photo || json?.url;
      if (newUrl) {
        setProfile((p) => ({ ...p, photo: newUrl }));
        updateUser({ photo: newUrl });
      }
      toast.success('Photo uploaded', {
        duration: 4000,
        position: 'top-right',
        style: {
          background: '#10B981',
          color: '#fff',
          fontWeight: '500',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)',
        },
        iconTheme: {
          primary: '#fff',
          secondary: '#10B981',
        },
      });
    } catch (err: any) {
      toast.error('Upload error: ' + err.message, {
        duration: 4000,
        position: 'top-right',
        style: {
          background: '#EF4444',
          color: '#fff',
          fontWeight: '500',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.4)',
        },
        iconTheme: {
          primary: '#fff',
          secondary: '#EF4444',
        },
      });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleAddSocialLink = () => {
    if (!linkTitle || !linkUrl) return;
    const newLink = { platform: linkTitle, url: linkUrl };
    setProfile((prev: any) => ({
      ...prev,
      socialProfiles: [...(prev.socialProfiles || []), newLink]
    }));
    setLinkTitle("");
    setLinkUrl("");
  };

  const handleRemoveSocialLink = (index: number) => {
    setProfile((prev: any) => ({
      ...prev,
      socialProfiles: (prev.socialProfiles || []).filter((_: any, i: number) => i !== index)
    }));
  };

  const getSocialIcon = (platform: string) => {
    const p = (platform || "").toLowerCase();
    if (p.includes("instagram")) {
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10 1.80078C12.6719 1.80078 12.9883 1.8125 14.0391 1.85937C15.0156 1.90234 15.543 2.06641 15.8945 2.20312C16.3594 2.38281 16.6953 2.60156 17.043 2.94922C17.3945 3.30078 17.6094 3.63281 17.7891 4.09766C17.9258 4.44922 18.0898 4.98047 18.1328 5.95312C18.1797 7.00781 18.1914 7.32422 18.1914 9.99219C18.1914 12.6641 18.1797 12.9805 18.1328 14.0312C18.0898 15.0078 17.9258 15.5352 17.7891 15.8867C17.6094 16.3516 17.3906 16.6875 17.043 17.0352C16.6914 17.3867 16.3594 17.6016 15.8945 17.7812C15.543 17.918 15.0117 18.082 14.0391 18.125C12.9844 18.1719 12.668 18.1836 10 18.1836C7.32812 18.1836 7.01172 18.1719 5.96094 18.125C4.98438 18.082 4.45703 17.918 4.10547 17.7812C3.64062 17.6016 3.30469 17.3828 2.95703 17.0352C2.60547 16.6836 2.39062 16.3516 2.21094 15.8867C2.07422 15.5352 1.91016 15.0039 1.86719 14.0312C1.82031 12.9766 1.80859 12.6602 1.80859 9.99219C1.80859 7.32031 1.82031 7.00391 1.86719 5.95312C1.91016 4.97656 2.07422 4.44922 2.21094 4.09766C2.39062 3.63281 2.60937 3.29687 2.95703 2.94922C3.30859 2.59766 3.64062 2.38281 4.10547 2.20312C4.45703 2.06641 4.98828 1.90234 5.96094 1.85937C7.01172 1.8125 7.32812 1.80078 10 1.80078ZM10 0C7.28516 0 6.94531 0.0117187 5.87891 0.0585937C4.81641 0.105469 4.08594 0.277344 3.45312 0.523437C2.79297 0.78125 2.23438 1.12109 1.67969 1.67969C1.12109 2.23437 0.78125 2.79297 0.523437 3.44922C0.277344 4.08594 0.105469 4.8125 0.0585938 5.875C0.0117188 6.94531 0 7.28516 0 10C0 12.7148 0.0117188 13.0547 0.0585938 14.1211C0.105469 15.1836 0.277344 15.9141 0.523437 16.5469C0.78125 17.207 1.12109 17.7656 1.67969 18.3203C2.23438 18.875 2.79297 19.2187 3.44922 19.4727C4.08594 19.7187 4.8125 19.8906 5.875 19.9375C6.94141 19.9844 7.28125 19.9961 9.99609 19.9961C12.7109 19.9961 13.0508 19.9844 14.1172 19.9375C15.1797 19.8906 15.9102 19.7187 16.543 19.4727C17.1992 19.2187 17.7578 18.875 18.3125 18.3203C18.8672 17.7656 19.2109 17.207 19.4648 16.5508C19.7109 15.9141 19.8828 15.1875 19.9297 14.125C19.9766 13.0586 19.9883 12.7187 19.9883 10C19.9883 7.28516 19.9766 6.94531 19.9297 5.87891C19.8828 4.81641 19.7109 4.08594 19.4648 3.45312C19.207 2.79297 18.8672 2.23437 18.3125 1.67969C17.7578 1.12109 17.207 0.78125 16.5508 0.523437C15.9141 0.277344 15.1875 0.105469 14.125 0.0585938C13.0586 0.0117188 12.7187 0 10 0ZM10 4.86328C7.16406 4.86328 4.86328 7.16406 4.86328 10C4.86328 12.8359 7.16406 15.1367 10 15.1367C12.8359 15.1367 15.1367 12.8359 15.1367 10C15.1367 7.16406 12.8359 4.86328 10 4.86328ZM10 13.332C8.16016 13.332 6.66797 11.8398 6.66797 10C6.66797 8.16016 8.16016 6.66797 10 6.66797C11.8398 6.66797 13.332 8.16016 13.332 10C13.332 11.8398 11.8398 13.332 10 13.332Z"
            fill="#0B0907"
          />
          <path
            d="M16.5391 4.66016C16.5391 5.32422 16 5.85938 15.3398 5.85938C14.6758 5.85938 14.1406 5.32031 14.1406 4.66016C14.1406 3.99609 14.6797 3.46094 15.3398 3.46094C16 3.46094 16.5391 4 16.5391 4.66016Z"
            fill="#0B0907"
          />
        </svg>
      );
    }
    if (p.includes("facebook")) {
      return (
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10 0C4.4772 0 0 4.4772 0 10C0 14.6896 3.2288 18.6248 7.5844 19.7056V13.056H5.5224V10H7.5844V8.6832C7.5844 5.2796 9.1248 3.702 12.4664 3.702C13.1 3.702 14.1932 3.8264 14.6404 3.9504V6.7204C14.4044 6.6956 13.9944 6.6832 13.4852 6.6832C11.8456 6.6832 11.212 7.3044 11.212 8.9192V10H14.4784L13.9172 13.056H11.212V19.9268C16.1636 19.3288 20.0004 15.1128 20.0004 10C20 4.4772 15.5228 0 10 0Z"
            fill="#131313"
          />
        </svg>
      );
    }
    // Default
    return (
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="10" cy="10" r="10" fill="#E5E7EB" />
        <path d="M10 5L15 15H5L10 5Z" fill="#9CA3AF" />
      </svg>
    );
  };

  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  return (
    <div className="flex h-screen bg-dashboard-bg font-plus-jakarta">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          isCollapsed={isCollapsed}
          onToggleCollapse={handleToggleCollapse}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <DashboardHeader Headtitle={"Profile"} />

        {/* Profile Content */}
        <main className="flex-1 p-4 lg:p-5 dark:bg-black dark:text-white bg-white m-2 lg:m-5 rounded-2xl lg:rounded-3xl overflow-auto">
          {/* Profile Tabs Header */}
          <div className="flex items-center justify-between gap-6 border-b border-dashboard-stroke pb-4 mb-5">
            <div className="flex items-center flex-1">
              <div className="flex items-center gap-0">
                <button
                  onClick={() => setActiveTab("personal")}
                  className={`px-4 py-3 text-base font-bold font-plus-jakarta transition-colors relative ${
                    activeTab === "personal"
                      ? "text-dashboard-heading"
                      : "text-gray-400 hover:text-dashboard-heading"
                  }`}
                >
                  Personal Details
                  {activeTab === "personal" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-dashboard-primary"></div>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("social")}
                  className={`px-4 py-3 text-base font-bold font-plus-jakarta transition-colors relative ${
                    activeTab === "social"
                      ? "text-dashboard-heading"
                      : "text-gray-400 hover:text-dashboard-heading"
                  }`}
                >
                  Social Profile
                  {activeTab === "social" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-dashboard-primary"></div>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("business")}
                  className={`px-4 py-3 text-base font-bold font-plus-jakarta transition-colors relative ${
                    activeTab === "business"
                      ? "text-dashboard-heading"
                      : "text-gray-400 hover:text-dashboard-heading"
                  }`}
                >
                  Business Details
                  {activeTab === "business" && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-dashboard-primary"></div>
                  )}
                </button>
              </div>
            </div>
            <Button
              onClick={() => setIsChangePasswordOpen(true)}
              className="bg-dashboard-primary  dark:text-black text-white px-6 py-3 rounded-full font-geist text-sm"
            >
              Change Password
            </Button>
          </div>

          {/* Tab Content */}
          {activeTab === "personal" && (
            <div className="space-y-6">
              {/* Personal Details Form */}
              <Card className="bg-gray-50 dark:bg-black dark:text-white border-0">
                <CardContent className="p-6">
                  {/* Photo + Email row */}
                  <div className="flex items-center gap-6 mb-6">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                      {profile.photo ? (
                        <img src={profile.photo} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm text-gray-500">No photo</span>
                      )}
                    </div>
                    {isEditing && (
                      <div>
                        <Input type="file" accept="image/*" onChange={onPhotoChange} />
                      </div>
                    )}
                  </div>
                  
                  {!isEditing ? (
                    // Read-only View
                    <div className="space-y-7">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
                        <div className="space-y-2">
                          <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">First Name</label>
                          <div className="text-base text-gray-600 dark:text-gray-300 font-plus-jakarta">{profile.firstName || "-"}</div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">Last Name</label>
                          <div className="text-base text-gray-600 dark:text-gray-300 font-plus-jakarta">{profile.lastName || "-"}</div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">Email</label>
                          <div className="text-base text-gray-600 dark:text-gray-300 font-plus-jakarta">{email || "-"}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
                        <div className="space-y-2">
                          <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">Phone Number</label>
                          <div className="text-base text-gray-600 dark:text-gray-300 font-plus-jakarta">{profile.phoneNumber || "-"}</div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">Date of Birth</label>
                          <div className="text-base text-gray-600 dark:text-gray-300 font-plus-jakarta">{profile.dateOfBirth || "-"}</div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">Marital Status</label>
                          <div className="text-base text-gray-600 dark:text-gray-300 font-plus-jakarta">{profile.maritalStatus || "-"}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
                        <div className="space-y-2">
                          <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">Country</label>
                          <div className="text-base text-gray-600 dark:text-gray-300 font-plus-jakarta">{profile.country || "-"}</div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">State</label>
                          <div className="text-base text-gray-600 dark:text-gray-300 font-plus-jakarta">{profile.state || "-"}</div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">City</label>
                          <div className="text-base text-gray-600 dark:text-gray-300 font-plus-jakarta">{profile.city || "-"}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
                        <div className="space-y-2">
                          <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">Locality</label>
                          <div className="text-base text-gray-600 dark:text-gray-300 font-plus-jakarta">{profile.personalLocality || "-"}</div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">Pincode</label>
                          <div className="text-base text-gray-600 dark:text-gray-300 font-plus-jakarta">{profile.personalPincode || "-"}</div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">Id Proof</label>
                          <div className="text-base text-gray-600 dark:text-gray-300 font-plus-jakarta">{profile.idProof || "-"}</div>
                        </div>
                      </div>

                      {profile.idPhotos && profile.idPhotos.length > 0 && (
                        <div className="space-y-4">
                          <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">ID Photos</label>
                          <div className="flex gap-4 flex-wrap">
                            {profile.idPhotos.map((url: string, idx: number) => (
                              <div key={idx} className="relative group">
                                <img 
                                  src={url} 
                                  alt={`ID Photo ${idx+1}`} 
                                  className="w-32 h-32 object-cover rounded-xl border border-dashboard-stroke shadow-sm transition-transform group-hover:scale-105" 
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    // Edit Form
                    <div className="space-y-7">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
                        <div className="space-y-3">
                          <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">
                            First Name
                          </label>
                          <Input
                            name="firstName"
                            value={profile.firstName}
                            onChange={handleInputChange}
                            placeholder="First Name"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">
                            Last Name
                          </label>
                          <Input
                            name="lastName"
                            value={profile.lastName}
                            onChange={handleInputChange}
                            placeholder="Last Name"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">
                            Email
                          </label>
                          <Input
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter email to load profile"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
                        <div className="space-y-3">
                          <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">
                            Phone Number
                          </label>
                          <Input
                            name="phoneNumber"
                            value={profile.phoneNumber}
                            onChange={handleInputChange}
                            placeholder="Phone Number"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">
                            Date of Birth
                          </label>
                          <Input
                            type="date"
                            name="dateOfBirth"
                            value={profile.dateOfBirth}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">
                            Marital Status
                          </label>
                          <Input
                            name="maritalStatus"
                            value={profile.maritalStatus}
                            onChange={handleInputChange}
                            placeholder="Marital Status"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
                        <div className="space-y-3">
                          <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">
                            Country
                          </label>
                          <Input
                            name="country"
                            value={profile.country}
                            onChange={handleInputChange}
                            placeholder="Country"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">
                            State
                          </label>
                          <Input
                            name="state"
                            value={profile.state}
                            onChange={handleInputChange}
                            placeholder="State"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">
                            City
                          </label>
                          <Input
                            name="city"
                            value={profile.city}
                            onChange={handleInputChange}
                            placeholder="City"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
                        <div className="space-y-3">
                          <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">
                            Locality
                          </label>
                          <Input
                            name="personalLocality"
                            value={profile.personalLocality}
                            onChange={handleInputChange}
                            placeholder="Locality"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">
                            Pincode
                          </label>
                          <Input
                            name="personalPincode"
                            value={profile.personalPincode}
                            onChange={handleInputChange}
                            placeholder="Pincode"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">
                            Id Proof
                          </label>
                          <Input
                            name="idProof"
                            value={profile.idProof}
                            onChange={handleInputChange}
                            placeholder="Enter Id Proof"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button 
                          onClick={handleSaveProfile} 
                          disabled={saving}
                          className="bg-dashboard-primary text-white"
                        >
                          {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Edit Button Toggle */}
              {!isEditing && (
                <div className="flex justify-end">
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    className="px-6 py-3 border-dashboard-primary text-dashboard-primary hover:bg-dashboard-primary hover:text-white rounded-full font-geist flex items-center gap-2"
                  >
                    <Edit size={18} />
                    Edit
                  </Button>
                </div>
              )}
            </div>
          )}

          {activeTab === "social" && (
            <div className="space-y-6">
              {/* Connected Accounts */}
              <Card className="border border-dashboard-stroke">
                <CardContent className="p-6">
                  <div className="space-y-8">
                    {/* Header */}
                    <div className="space-y-3">
                      <h3 className="text-lg font-bold text-dashboard-primary font-plus-jakarta">
                        Connected Account
                      </h3>
                      <p className="text-base text-dashboard-title font-plus-jakarta">
                        Build trust with your network by connecting your social
                        profiles
                      </p>
                    </div>

                    {/* Social Platforms */}
                    <div className="space-y-2">
                      {(profile.socialProfiles || []).map((link: any, index: number) => (
                        <div key={index}>
                          <div className="flex items-center justify-between p-5">
                            <div className="flex items-center gap-5">
                              <div className="w-5 h-5">{getSocialIcon(link.platform)}</div>
                              <span className="text-lg text-dashboard-heading font-plus-jakarta">
                                {link.platform}
                              </span>
                            </div>
                            <div className="flex items-center gap-6">
                              <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-base text-gray-400 font-plus-jakarta hover:text-dashboard-primary truncate max-w-[200px]">
                                {link.url}
                              </a>
                              <button className="text-gray-400 hover:text-red-500" onClick={() => handleRemoveSocialLink(index)}>
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 12 12"
                                  fill="none"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    d="M0.75 0.75L11.4313 11.2813"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  <path
                                    d="M11.4316 0.75L0.750294 11.2813"
                                    stroke="currentColor"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                          {index < (profile.socialProfiles || []).length - 1 && (
                            <div className="h-px bg-dashboard-stroke mx-5"></div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Add Link Form */}
              <Card className="bg-gray-50 dark:bg-black dark:text-white border-0">
                <CardContent className="p-5">
                  <div className="flex items-end gap-6">
                    <div className="flex-1 space-y-3">
                      <label className="text-base text-dashboard-title font-plus-jakarta">
                        Link Title
                      </label>
                      <Input
                        value={linkTitle}
                        placeholder="Enter Link Title (e.g. Instagram)"
                        onChange={(e) => setLinkTitle(e.target.value)}
                        className="border-gray-300 bg-white text-sm text-dashboard-neutral-07 font-plus-jakarta"
                      />
                    </div>
                    <div className="flex-1 space-y-3">
                      <label className="text-base text-dashboard-title font-plus-jakarta">
                        URL
                      </label>
                      <Input
                        value={linkUrl}
                        placeholder="Enter Url"
                        onChange={(e) => setLinkUrl(e.target.value)}
                        className="border-gray-300 bg-white text-sm text-dashboard-neutral-07 font-plus-jakarta"
                      />
                    </div>
                    <Button onClick={handleAddSocialLink} className="bg-dashboard-primary dark:text-black  text-white px-8 py-3 rounded-full font-geist">
                      ADD
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button 
                  onClick={handleSaveProfile} 
                  disabled={saving}
                  className="bg-dashboard-primary text-white"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )}

          {activeTab === "business" && (
            <div className="space-y-6">
              {/* Business Information */}
              <Card className="bg-gray-50 dark:bg-black dark:text-white border-0">
                <CardContent className="p-6">
                  {!isEditing ? (
                    <div className="space-y-7">
                      {/* Business Identity Section */}
                      <div className="space-y-5">
                        <h3 className="text-lg font-bold text-dashboard-primary font-plus-jakarta mb-4">
                          Business Identity
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
                          <div className="space-y-3">
                            <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">
                              Brand Name
                            </label>
                            <div className="text-base text-dashboard-neutral-07 font-plus-jakarta">
                              {profile.business?.brandName || profile.vendorDetails?.brandName || "-"}
                            </div>
                          </div>
                          <div className="space-y-3">
                            <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">
                              Legal Company Name
                            </label>
                            <div className="text-base text-dashboard-neutral-07 font-plus-jakarta">
                              {profile.business?.legalCompanyName || "-"}
                            </div>
                          </div>
                          <div className="space-y-3">
                            <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">
                              Business Type
                            </label>
                            <div className="text-base text-dashboard-neutral-07 font-plus-jakarta">
                              {profile.vendorDetails?.servicesOffered?.[0] || "Travel & Tourism"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Business Contact Section */}
                      <div className="space-y-5">
                        <h3 className="text-lg font-bold text-dashboard-primary font-plus-jakarta mb-4">
                          Contact Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
                          <div className="space-y-3">
                            <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">
                              Business Email
                            </label>
                            <div className="text-base text-dashboard-neutral-07 font-plus-jakarta">
                              {profile.business?.email || profile.vendorDetails?.email || "-"}
                            </div>
                          </div>
                          <div className="space-y-3">
                            <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">
                              Business Phone
                            </label>
                            <div className="text-base text-dashboard-neutral-07 font-plus-jakarta">
                              {profile.business?.phoneNumber || profile.vendorDetails?.phone || "-"}
                            </div>
                          </div>
                          <div className="space-y-3">
                            <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">
                              Website
                            </label>
                            <div className="text-base text-dashboard-neutral-07 font-plus-jakarta">
                              {profile.business?.website || "-"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Business Address Section */}
                      <div className="space-y-5">
                        <h3 className="text-lg font-bold text-dashboard-primary font-plus-jakarta mb-4">
                          Business Address
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                          <div className="space-y-3">
                            <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">
                              Locality
                            </label>
                            <div className="text-base text-dashboard-neutral-07 font-plus-jakarta">
                              {profile.business?.locality || profile.vendorDetails?.location || "-"}
                            </div>
                          </div>
                          <div className="space-y-3">
                            <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">
                              City
                            </label>
                            <div className="text-base text-dashboard-neutral-07 font-plus-jakarta">
                              {profile.business?.city || "-"}
                            </div>
                          </div>
                          <div className="space-y-3">
                            <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">
                              State
                            </label>
                            <div className="text-base text-dashboard-neutral-07 font-plus-jakarta">
                              {profile.business?.state || "-"}
                            </div>
                          </div>
                          <div className="space-y-3">
                            <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">
                              Pincode
                            </label>
                            <div className="text-base text-dashboard-neutral-07 font-plus-jakarta">
                              {profile.business?.pincode || "-"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Legal & Tax Information */}
                      <div className="space-y-5">
                        <h3 className="text-lg font-bold text-dashboard-primary font-plus-jakarta mb-4">
                          Legal & Tax Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
                          <div className="space-y-3">
                            <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">
                              GST Number
                            </label>
                            <div className="text-base text-dashboard-neutral-07 font-plus-jakarta">
                              {profile.business?.gstNumber || "-"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-7">
                      <div className="space-y-5">
                        <h3 className="text-lg font-bold text-dashboard-primary font-plus-jakarta mb-4">
                          Business Identity
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
                          <div className="space-y-3">
                            <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">
                              Brand Name
                            </label>
                            <Input
                              name="brandName"
                              value={profile.business?.brandName || ""}
                              onChange={handleBusinessInputChange}
                              placeholder="Brand Name"
                            />
                          </div>
                          <div className="space-y-3">
                            <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">
                              Legal Company Name
                            </label>
                            <Input
                              name="legalCompanyName"
                              value={profile.business?.legalCompanyName || ""}
                              onChange={handleBusinessInputChange}
                              placeholder="Legal Company Name"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-5">
                        <h3 className="text-lg font-bold text-dashboard-primary font-plus-jakarta mb-4">
                          Contact Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
                          <div className="space-y-3">
                            <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">
                              Business Email
                            </label>
                            <Input
                              name="email"
                              value={profile.business?.email || ""}
                              onChange={handleBusinessInputChange}
                              placeholder="Business Email"
                            />
                          </div>
                          <div className="space-y-3">
                            <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">
                              Business Phone
                            </label>
                            <Input
                              name="phoneNumber"
                              value={profile.business?.phoneNumber || ""}
                              onChange={handleBusinessInputChange}
                              placeholder="Business Phone"
                            />
                          </div>
                          <div className="space-y-3">
                            <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">
                              Website
                            </label>
                            <Input
                              name="website"
                              value={profile.business?.website || ""}
                              onChange={handleBusinessInputChange}
                              placeholder="Website"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-5">
                        <h3 className="text-lg font-bold text-dashboard-primary font-plus-jakarta mb-4">
                          Business Address
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
                          <div className="space-y-3">
                            <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">
                              Locality
                            </label>
                            <Input
                              name="locality"
                              value={profile.business?.locality || ""}
                              onChange={handleBusinessInputChange}
                              placeholder="Locality"
                            />
                          </div>
                          <div className="space-y-3">
                            <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">
                              City
                            </label>
                            <Input
                              name="city"
                              value={profile.business?.city || ""}
                              onChange={handleBusinessInputChange}
                              placeholder="City"
                            />
                          </div>
                          <div className="space-y-3">
                            <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">
                              State
                            </label>
                            <Input
                              name="state"
                              value={profile.business?.state || ""}
                              onChange={handleBusinessInputChange}
                              placeholder="State"
                            />
                          </div>
                          <div className="space-y-3">
                            <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">
                              Pincode
                            </label>
                            <Input
                              name="pincode"
                              value={profile.business?.pincode || ""}
                              onChange={handleBusinessInputChange}
                              placeholder="Pincode"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-5">
                        <h3 className="text-lg font-bold text-dashboard-primary font-plus-jakarta mb-4">
                          Legal & Tax Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
                          <div className="space-y-3">
                            <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">
                              GST Number
                            </label>
                            <Input
                              name="gstNumber"
                              value={profile.business?.gstNumber || ""}
                              onChange={handleBusinessInputChange}
                              placeholder="GST Number"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button 
                          onClick={handleSaveProfile} 
                          disabled={saving}
                          className="bg-dashboard-primary text-white"
                        >
                          {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {!isEditing && (
                <div className="flex justify-end">
                  <Button
                    onClick={() => setIsEditing(true)}
                    variant="outline"
                    className="px-6 py-3 border-dashboard-primary text-dashboard-primary hover:bg-dashboard-primary hover:text-white rounded-full font-geist flex items-center gap-2"
                  >
                    <Edit size={18} />
                    Edit
                  </Button>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isChangePasswordOpen}
        onOpenChange={setIsChangePasswordOpen}
      />
    </div>
  );
};

export default Profile;
