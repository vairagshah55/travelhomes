import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import MobileUserNav from "../components/MobileUserNav";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SlArrowLeft } from "react-icons/sl";
import { toast } from "sonner";
import { API_BASE_URL } from "../lib/api";
import { getImageUrl } from "@/lib/utils";
import { formatDate, formatDateTime } from '../utils/formateTime';
import { Loader } from "@/components/ui/Loader";

const UserProfileEdit = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    email: user?.email || "",
    dateOfBirth: "",
    city: "",
    state: "",
    photo: "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  React.useEffect(() => {
    if (photoFile) {
      const objectUrl = URL.createObjectURL(photoFile);
      setPhotoPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setPhotoPreview(null);
    }
  }, [photoFile]);

  React.useEffect(() => {
    const load = async () => {
      try {
        const { userProfileApi } = await import("../lib/api");
        if (!user?.email) return;
        const res = await userProfileApi.get(user.email);
        const p = res.data || {};
        
        const firstName = p.firstName || user.firstName || "";
        const lastName = p.lastName || user.lastName || "";
        
        let dob = p.dateOfBirth || user.dateOfBirth || "";
        if (dob && dob !== "-") {
          try {
            dob = new Date(dob).toISOString().split("T")[0];
          } catch (e) {
            // Keep original if parsing fails
          }
        } else {
          dob = "";
        }
        
        setFormData({
          name: [firstName, lastName].filter(Boolean).join(" ").trim(),
          firstName,
          lastName,
          phoneNumber: p.phoneNumber || user.phoneNumber || "",
          email: p.email || user.email || "",
          dateOfBirth: dob,
          state: p.state || user.state || "",
          city: p.city || user.city || "",
          photo: p.photo || user.photo || "",
        });
      } catch (err) {
        console.error("Failed to load profile", err);
      }
    };
    load();
  }, [user?.email]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    try {
      const { userProfileApi } = await import("../lib/api");
      const payload = {
        email: formData.email || user?.email || "",
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        dateOfBirth: formData.dateOfBirth,
        city: formData.city,
        state: formData.state,
      };
      const res = await userProfileApi.upsert(payload);
      
      if (res.success) {
        let photoUrl = formData.photo;
        if (photoFile && payload.email) {
          const up = await userProfileApi.uploadPhoto(payload.email, photoFile);
          photoUrl = up.data?.photo || up.url || photoUrl;
        }

        const updatedProfile = {
          ...payload,
          photo: photoUrl,
        };

        // Update AuthContext state
        updateUser(updatedProfile);

        // Broadcast profile update for any other listeners
        window.dispatchEvent(
          new CustomEvent("profileUpdated", { detail: updatedProfile }),
        );

        toast.success("Profile updated successfully!");
        navigate("/user-profile");
      } else {
        toast.error("Failed to update profile");
      }
    } catch (e) {
      console.error("Failed to save profile", e);
      toast.error("An error occurred while saving profile");
    }
  };


  useEffect(() => {
    // Simulate dynamic data fetching
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);


  if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="flex flex-col items-center gap-4">
        <Loader size="xl" />
        <p className="text-gray-600 dark:text-gray-400 animate-pulse font-medium">
          Fetching profile details...
        </p>
      </div>
    </div>
  );
}
  
  return (
    <div className="min-h-screen flex-col flex gap-0 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-200 transition-colors">
      <Header variant="transparent" className="fixed w-full z-50" />





      {/* Main Content */}
      <div className="px-4 mt-20 md:px-20 py-10 max-md:py-0">
        <div className="flex flex-col lg:flex-row gap-12 max-w-7xl mx-auto">
          {/* Profile Sidebar */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-black rounded-md p-8 text-white max-md:hidden">
              {/* Profile Image Section */}
              <div className="text-center mb-9">
                <div className="relative inline-block mb-3">
                  <img
                    src={photoPreview || (user?.photo ? getImageUrl(user.photo) : "/user-avatar.svg")}
                    onError={(e) => {
                      e.currentTarget.src = "/user-avatar.svg";
                    }}
                    alt={`${user?.firstName}'s avatar`}
                    className="w-full h-full object-cover bg-white rounded-full"
                  />

                  {/* Edit icon overlay -> triggers file input */}
                  <label className="absolute bottom-2 right-2 w-7 h-7 bg-white/50 backdrop-blur-sm rounded-full flex items-center justify-center cursor-pointer hover:bg-white/70 transition-colors">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        setPhotoFile(e.target.files?.[0] || null)
                      }
                    />
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 30 30"
                    >
                      <path
                        d="M14.333 8.33325H12.9997C9.66634 8.33325 8.33301 9.66659 8.33301 12.9999V16.9999C8.33301 20.3333 9.66634 21.6666 12.9997 21.6666H16.9997C20.333 21.6666 21.6663 20.3333 21.6663 16.9999V15.6666"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M17.6933 9.0135L12.4399 14.2668C12.2399 14.4668 12.0399 14.8602 11.9999 15.1468L11.7133 17.1535C11.6066 17.8802 12.1199 18.3868 12.8466 18.2868L14.8533 18.0002C15.1333 17.9602 15.5266 17.7602 15.7333 17.5602L20.9866 12.3068C21.8933 11.4002 22.3199 10.3468 20.9866 9.0135C19.6533 7.68017 18.5999 8.10684 17.6933 9.0135Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeMiterlimit="10"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M16.9395 9.76685C17.3861 11.3602 18.6328 12.6068 20.2328 13.0602"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeMiterlimit="10"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </label>
                </div>
                <button
                  onClick={() => navigate(-1)}
                  className="top-8 left-0 absolute flex items-center gap-1 ml-24 max-md:ml-4 mt-24"
                >
                  <SlArrowLeft size={12} className="" />
                  <span className="text-sm">Back</span>
                </button>
                <h2 className="text-xl font-bold font-geist">Upload a Photo</h2>
              </div>

              {/* Identity Verification */}
              <div className="mb-8 dark:bg-black dark:text-white">
                <h3 className="text-lg font-bold font-geist mb-3 dark:bg-black dark:text-white">
                  Identity Verification
                </h3>
                <p className="text-sm text-gray-300 font-plus-jakarta dark:bg-black dark:text-white">
                  Whether you're traveling for leisure or business, we’re
                  committed to making your stay smooth, enjoyable, and truly
                  unforgettable.
                </p>
              </div>

              {/* Host Info */}
                <div className="space-y-4">
                <h3 className="text-lg font-geist">{user?.firstName} {user?.lastName}</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    {user?.email ? (
                      <svg
                        className="w-5 h-5 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 19 20"
                      >
                        <path
                          d="M3.16699 10L7.91699 14.75L15.8337 5.25"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5 text-red-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    )}
                    <span className="text-sm font-plus-jakarta">
                      {user?.email ? "Email Confirmed" : "Email Not Confirmed"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {user?.mobileVerified ? (
                      <svg
                        className="w-5 h-5 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 19 20"
                      >
                        <path
                          d="M3.16699 10L7.91699 14.75L15.8337 5.25"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5 text-red-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    )}
                    <span className="text-sm font-plus-jakarta">
                      {user?.mobileVerified ? "Mobile Confirmed" : "Mobile Not Confirmed"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Profile Edit Content */}
          <div className="flex-1">
            {/* Profile Header */}
            <div className="max-md:hidden flex flex-col  md:flex-row justify-between items-start md:items-center mb-9">
              <h1 className="text-2xl max-md:text-lg  font-semibold text-gray-800 font-poppins mb-4 md:mb-0">
                Profile
              </h1>
              <Button
                onClick={handleSave}
                className="bg-black hover:bg-gray-800 text-white px-6 rounded-full font-geist"
              >
                Save
              </Button>
            </div>

            {/* Profile Edit Form */}
            <div className="space-y-8   ">
              {/* First Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 dark:bg-black dark:text-white">
                <div>
                  <label className="block text-base text-gray-700 dark:bg-black dark:text-white font-plus-jakarta mb-3">
                    Name
                  </label>
                  <Input
                    value={formData.name}
                     maxLength={30}
                    onChange={(e) => {
                      const v = e.target.value;
                      handleInputChange("name", v);
                      const parts = v.trim().split(/\s+/);
                      handleInputChange("firstName", parts[0] || "");
                      handleInputChange(
                        "lastName",
                        parts.slice(1).join(" ") || "",
                      );
                    }}
                    className="w-full px-3 py-6 border border-gray-400 dark:bg-black dark:text-white rounded-lg text-base text-gray-600 font-plus-jakarta focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
               <div>
  <label className="block text-base text-gray-700 dark:bg-black dark:text-white font-plus-jakarta mb-3">
    Phone Number
  </label>

  <Input
    type="tel"
    maxLength={10}
    value={formData.phoneNumber}
    onChange={(e) => {
      const value = e.target.value.replace(/\D/g, ""); // sirf digits allow
      if (value.length <= 10) {
        handleInputChange("phoneNumber", value);
      }
    }}
    className="w-full px-3 py-6 border border-gray-400 dark:bg-black dark:text-white rounded-lg text-base text-gray-600 font-plus-jakarta focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
  />
</div>

              </div>

              {/* Second Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 dark:bg-black dark:text-white">
                <div>
                  <label className="block text-base text-gray-700 dark:bg-black dark:text-white font-plus-jakarta mb-3">
                    Email
                  </label>
                  <Input
                  maxLength={40}
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    // disabled
                    className="w-full px-3 py-6 border border-gray-400  dark:bg-black dark:text-white rounded-lg text-base text-gray-600 font-plus-jakarta focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-base text-gray-700 dark:bg-black dark:text-white font-plus-jakarta mb-3">
                    Date of Birth
                  </label>
                  <Input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) =>
                      handleInputChange("dateOfBirth", e.target.value)
                    }
                   
                    className="w-full px-3 py-6 border placeholder:dark:text-white border-gray-400  dark:bg-black dark:text-white rounded-lg text-base text-gray-600 font-plus-jakarta focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Third Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-base text-gray-700 dark:bg-black dark:text-white font-plus-jakarta mb-3">
                    State
                  </label>
                  <Input
                    value={formData.state}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    className="w-full px-3 py-6 border border-gray-400 dark:bg-black dark:text-white rounded-lg text-base text-gray-600 font-plus-jakarta focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-base text-gray-700 dark:bg-black dark:text-white font-plus-jakarta mb-3">
                    City
                  </label>
                  <Input
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    className="w-full px-3 py-6 border border-gray-400 dark:bg-black dark:text-white rounded-lg text-base text-gray-600 font-plus-jakarta focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="lg:hidden flex  items-start w-full mb-9 mt-6">
              <Button
                onClick={handleSave}
                className="bg-black hover:bg-gray-800 dark:bg-black dark:text-white text-white px-8 py-6 rounded-full  w-full font-geist"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileEdit;
