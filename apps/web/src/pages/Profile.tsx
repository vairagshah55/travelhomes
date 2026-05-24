import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Edit } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import ChangePasswordModal from "@/components/ChangePasswordModal";
import { userProfileApi, API_BASE_URL } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { SocialIcon } from "./Profile/SocialIcon";

const Profile = () => {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("personal");
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "business") setActiveTab("business");
    else if (tab === "social") setActiveTab("social");
    else setActiveTab("personal");
  }, [searchParams]);

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
    socialProfiles: [],
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
        const data: Record<string, any> = json?.data || {};
        // Format date for input
        if (data.dateOfBirth) {
          data.dateOfBirth = new Date(data.dateOfBirth).toISOString().split("T")[0];
        }
        setProfile((prev) => ({ ...prev, ...data }));
        updateUser(data);
      } catch {
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
        [name]: value,
      },
    }));
  };

  const handleSaveProfile = async () => {
    try {
      if (!email) {
        toast.error("Please enter an email first", {
          duration: 4000,
          position: "top-right",
          style: {
            background: "#EF4444",
            color: "#fff",
            fontWeight: "500",
            borderRadius: "12px",
            padding: "16px",
            boxShadow: "0 10px 25px -5px rgba(239, 68, 68, 0.4)",
          },
          iconTheme: {
            primary: "#fff",
            secondary: "#EF4444",
          },
        });
        return;
      }
      setSaving(true);
      const json = await userProfileApi.upsert({ ...profile, email });
      const data: Record<string, any> = json.data || {};
      if (data.dateOfBirth) {
        data.dateOfBirth = new Date(data.dateOfBirth).toISOString().split("T")[0];
      }
      setProfile((prev) => ({ ...prev, ...data }));
      updateUser(data);
      setIsEditing(false);
      toast.success("Profile saved successfully!", {
        duration: 4000,
        position: "top-right",
        style: {
          background: "#10B981",
          color: "#fff",
          fontWeight: "500",
          borderRadius: "12px",
          padding: "16px",
          boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.4)",
        },
        iconTheme: {
          primary: "#fff",
          secondary: "#10B981",
        },
      });
    } catch (e: any) {
      toast.error("Error: " + e.message, {
        duration: 4000,
        position: "top-right",
        style: {
          background: "#EF4444",
          color: "#fff",
          fontWeight: "500",
          borderRadius: "12px",
          padding: "16px",
          boxShadow: "0 10px 25px -5px rgba(239, 68, 68, 0.4)",
        },
        iconTheme: {
          primary: "#fff",
          secondary: "#EF4444",
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
      toast.error("Please enter an email first", {
        duration: 4000,
        position: "top-right",
        style: {
          background: "#EF4444",
          color: "#fff",
          fontWeight: "500",
          borderRadius: "12px",
          padding: "16px",
          boxShadow: "0 10px 25px -5px rgba(239, 68, 68, 0.4)",
        },
        iconTheme: {
          primary: "#fff",
          secondary: "#EF4444",
        },
      });
      return;
    }
    const fd = new FormData();
    fd.append("photo", file);
    fd.append("email", email);
    try {
      setUploading(true);
      const json = await userProfileApi.uploadPhoto(email, file);
      const newUrl = json?.data?.photo || json?.url;
      if (newUrl) {
        setProfile((p) => ({ ...p, photo: newUrl }));
        updateUser({ photo: newUrl });
      }
      toast.success("Photo uploaded", {
        duration: 4000,
        position: "top-right",
        style: {
          background: "#10B981",
          color: "#fff",
          fontWeight: "500",
          borderRadius: "12px",
          padding: "16px",
          boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.4)",
        },
        iconTheme: {
          primary: "#fff",
          secondary: "#10B981",
        },
      });
    } catch (err: any) {
      toast.error("Upload error: " + err.message, {
        duration: 4000,
        position: "top-right",
        style: {
          background: "#EF4444",
          color: "#fff",
          fontWeight: "500",
          borderRadius: "12px",
          padding: "16px",
          boxShadow: "0 10px 25px -5px rgba(239, 68, 68, 0.4)",
        },
        iconTheme: {
          primary: "#fff",
          secondary: "#EF4444",
        },
      });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleAddSocialLink = () => {
    if (!linkTitle || !linkUrl) return;
    const newLink = { platform: linkTitle, url: linkUrl };
    setProfile((prev: any) => ({
      ...prev,
      socialProfiles: [...(prev.socialProfiles || []), newLink],
    }));
    setLinkTitle("");
    setLinkUrl("");
  };

  const handleRemoveSocialLink = (index: number) => {
    setProfile((prev: any) => ({
      ...prev,
      socialProfiles: (prev.socialProfiles || []).filter((_: any, i: number) => i !== index),
    }));
  };


  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  return (
    <DashboardLayout title="Profile" contentClassName="flex-1 overflow-y-auto p-4 lg:p-5">
      <div className="bg-white dark:bg-gray-900 dark:text-white rounded-2xl lg:rounded-3xl min-h-full">
          {/* Profile Tabs Header */}
          <div className="flex items-center justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-3 mb-5">
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800/60 p-1 rounded-xl">
              {[
                { key: "personal", label: "Personal Details" },
                { key: "social", label: "Social Profile" },
                { key: "business", label: "Business Details" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold font-plus-jakarta transition-all duration-150 ${
                    activeTab === tab.key
                      ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <Button
              onClick={() => setIsChangePasswordOpen(true)}
              className="rounded-xl px-5 h-9 font-semibold text-sm text-white flex-shrink-0"
              style={{ background: "#185FA5" }}
            >
              Change Password
            </Button>
          </div>

          {/* Tab Content */}
          {activeTab === "personal" && (
            <div className="space-y-6">
              {/* Personal Details Form */}
              <Card className="bg-gray-50 dark:bg-gray-900 dark:text-white border border-gray-100 dark:border-gray-800">
                <CardContent className="p-6">
                  {/* Photo + Email row */}
                  <div className="flex items-center gap-6 mb-6">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                      {profile.photo ? (
                        <img
                          src={profile.photo}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
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
                          <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">
                            First Name
                          </label>
                          <div className="text-base text-gray-600 dark:text-gray-300 font-plus-jakarta">
                            {profile.firstName || "-"}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">
                            Last Name
                          </label>
                          <div className="text-base text-gray-600 dark:text-gray-300 font-plus-jakarta">
                            {profile.lastName || "-"}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">
                            Email
                          </label>
                          <div className="text-base text-gray-600 dark:text-gray-300 font-plus-jakarta">
                            {email || "-"}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
                        <div className="space-y-2">
                          <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">
                            Phone Number
                          </label>
                          <div className="text-base text-gray-600 dark:text-gray-300 font-plus-jakarta">
                            {profile.phoneNumber || "-"}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">
                            Date of Birth
                          </label>
                          <div className="text-base text-gray-600 dark:text-gray-300 font-plus-jakarta">
                            {profile.dateOfBirth || "-"}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">
                            Marital Status
                          </label>
                          <div className="text-base text-gray-600 dark:text-gray-300 font-plus-jakarta">
                            {profile.maritalStatus || "-"}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
                        <div className="space-y-2">
                          <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">
                            Country
                          </label>
                          <div className="text-base text-gray-600 dark:text-gray-300 font-plus-jakarta">
                            {profile.country || "-"}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">
                            State
                          </label>
                          <div className="text-base text-gray-600 dark:text-gray-300 font-plus-jakarta">
                            {profile.state || "-"}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">
                            City
                          </label>
                          <div className="text-base text-gray-600 dark:text-gray-300 font-plus-jakarta">
                            {profile.city || "-"}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
                        <div className="space-y-2">
                          <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">
                            Locality
                          </label>
                          <div className="text-base text-gray-600 dark:text-gray-300 font-plus-jakarta">
                            {profile.personalLocality || "-"}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">
                            Pincode
                          </label>
                          <div className="text-base text-gray-600 dark:text-gray-300 font-plus-jakarta">
                            {profile.personalPincode || "-"}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">
                            Id Proof
                          </label>
                          <div className="text-base text-gray-600 dark:text-gray-300 font-plus-jakarta">
                            {profile.idProof || "-"}
                          </div>
                        </div>
                      </div>

                      {profile.idPhotos && profile.idPhotos.length > 0 && (
                        <div className="space-y-4">
                          <label className="text-base font-semibold text-dashboard-title font-plus-jakarta">
                            ID Photos
                          </label>
                          <div className="flex gap-4 flex-wrap">
                            {profile.idPhotos.map((url: string, idx: number) => (
                              <div key={idx} className="relative group">
                                <img
                                  src={url}
                                  alt={`ID Photo ${idx + 1}`}
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
                          className="text-white font-semibold"
                          style={{ background: "#185FA5" }}
                        >
                          {saving ? "Saving..." : "Save Changes"}
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
                    className="rounded-xl px-5 font-semibold text-sm flex items-center gap-2 border"
                    style={{ borderColor: "#185FA5", color: "#185FA5" }}
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
                        Build trust with your network by connecting your social profiles
                      </p>
                    </div>

                    {/* Social Platforms */}
                    <div className="space-y-2">
                      {(profile.socialProfiles || []).map((link: any, index: number) => (
                        <div key={index}>
                          <div className="flex items-center justify-between p-5">
                            <div className="flex items-center gap-5">
                              <div className="w-5 h-5"><SocialIcon platform={link.platform} /></div>
                              <span className="text-lg text-dashboard-heading font-plus-jakarta">
                                {link.platform}
                              </span>
                            </div>
                            <div className="flex items-center gap-6">
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-base text-gray-400 font-plus-jakarta hover:text-dashboard-primary truncate max-w-[200px]"
                              >
                                {link.url}
                              </a>
                              <button
                                className="text-gray-400 hover:text-red-500"
                                onClick={() => handleRemoveSocialLink(index)}
                              >
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
              <Card className="bg-gray-50 dark:bg-gray-900 dark:text-white border border-gray-100 dark:border-gray-800">
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
                    <Button
                      onClick={handleAddSocialLink}
                      className="rounded-xl px-5 font-semibold text-white"
                      style={{ background: "#185FA5" }}
                    >
                      ADD
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveProfile}
                  disabled={saving}
                  className="text-white font-semibold"
                  style={{ background: "#185FA5" }}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          )}

          {activeTab === "business" && (
            <div className="space-y-6">
              {/* Business Information */}
              <Card className="bg-gray-50 dark:bg-gray-900 dark:text-white border border-gray-100 dark:border-gray-800">
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
                              {profile.business?.brandName ||
                                profile.vendorDetails?.brandName ||
                                "-"}
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
                          className="text-white font-semibold"
                          style={{ background: "#185FA5" }}
                        >
                          {saving ? "Saving..." : "Save Changes"}
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
                    className="rounded-xl px-5 font-semibold text-sm flex items-center gap-2 border"
                    style={{ borderColor: "#185FA5", color: "#185FA5" }}
                  >
                    <Edit size={18} />
                    Edit
                  </Button>
                </div>
              )}
            </div>
          )}
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal isOpen={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen} />
    </DashboardLayout>
  );
};

export default Profile;
