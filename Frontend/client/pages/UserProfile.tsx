import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import MobileUserNav from "../components/MobileUserNav";
import { useAuth } from "../contexts/AuthContext";
import { ArrowLeft } from "lucide-react";
import { SlArrowLeft } from "react-icons/sl";
import { API_BASE_URL } from "../lib/api";
import { Button } from "@/components/ui/button";
import { getImageUrl } from "@/lib/utils";
import {  formatDate } from "@/utils/formateTime";

const UserProfile = () => {
  const { user, refreshUser } = useAuth();
  const [showMobileDropdown, setShowMobileDropdown] = useState(false);

  const [loading, setLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  React.useEffect(() => {
    const load = async () => {
      try {
        await refreshUser();
      } catch (e) {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const profile = user;

  const profileMenuItems = [
    { label: "Profile", active: true, path: "/user-profile" },
    { label: "Trips", active: false, path: "/user-trips" },
    { label: "Wishlist", active: false, path: "/wishlist" },
    { label: "Account Setting", active: false, path: "/account-settings" },
    { label: "Chat", active: false, path: "/chat" },
    { label: "Help", active: false, path: "/help" },
    { label: "Logout", active: false, path: "/logout" },
  ];
  return (
    <div className="min-h-screen flex-col flex gap-0 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-200 transition-colors">
      <Header variant="transparent" className="fixed w-full z-50" />

      {/* Main Content */}
      <div className="px-4 mt-14 md:px-20 py-5 ">
        <div className="flex flex-col lg:flex-row gap-4 max-w-7xl mx-auto ">
          <div className="lg:hidden flex  md:flex-row justify-between items-start md:items-center ">
         <div className="flex items-center gap-2">
  <button
    onClick={() => navigate("/")}
    className="text-black flex items-center"
  >
    <SlArrowLeft size={16} />
  </button>

  <h1 className="text-2xl max-md:text-lg font-semibold dark:bg-black dark:text-white text-gray-800 font-poppins">
    Profile
  </h1>
</div>
            <Button
              onClick={() => navigate("/user-profile-edit")}
              className="bg-black hover:bg-gray-800 text-white px-3 rounded-full font-geist"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  d="M9.16699 1.6665H7.50033C3.33366 1.6665 1.66699 3.33317 1.66699 7.49984V12.4998C1.66699 16.6665 3.33366 18.3332 7.50033 18.3332H12.5003C16.667 18.3332 18.3337 16.6665 18.3337 12.4998V10.8332"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M13.3666 2.51688L6.7999 9.08354C6.5499 9.33354 6.2999 9.82521 6.2499 10.1835L5.89157 12.6919C5.75823 13.6002 6.3999 14.2335 7.30823 14.1085L9.81657 13.7502C10.1666 13.7002 10.6582 13.4502 10.9166 13.2002L17.4832 6.63354C18.6166 5.50021 19.1499 4.18354 17.4832 2.51688C15.8166 0.850211 14.4999 1.38354 13.3666 2.51688Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeMiterlimit="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M12.4248 3.4585C12.9831 5.45016 14.5415 7.0085 16.5415 7.57516"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeMiterlimit="10"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Edit
            </Button>
          </div>
          {/* Profile Sidebar */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-black rounded-md p-8 text-white">
              {/* Profile Image Section */}
              <div className="text-center rounded-full mb-9 ">
                <div className="relative rounded-full inline-block mb-3">
                  <img
                    src={user?.photo ? getImageUrl(user.photo) : "/user-avatar.svg"}
                    onError={(e) => {
                      e.currentTarget.src = "/user-avatar.svg";
                    }}
                    alt={`${user?.firstName}'s avatar`}
                    className="w-full h-full object-cover bg-white rounded-full"
                  />
                </div>
                <button
                  onClick={() => navigate("/")}
                  className="max-md:hidden text-white flex absolute top-8 left-0 items-center gap-1 ml-24 max-md:ml-4 mt-14  "
                >
                  <SlArrowLeft size={12} className="" />
                  <span className="text-sm">Back</span>
                </button>
                <h2 className="text-xl font-bold font-geist">Upload a Photo</h2>
              </div>

              {/* Identity Verification */}
              <div className="mb-8">
                <h3 className="text-lg font-bold font-geist mb-3">
                  Identity Verification
                </h3>
                <p className="text-sm text-gray-300 font-plus-jakarta">
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

          {/* Main Profile Content */}
          <div className="flex-1">
            {/* Profile Header */}
            <div className=" flex flex-row justify-between items-start md:items-center mb-9">

          <h1 className="text-2xl max-md:text-lg  font-semibold dark:bg-black dark:text-white text-gray-800 font-poppins mb-4 md:mb-0">
                Profile
              </h1>

              <Button
                onClick={() => navigate("/user-profile-edit")}
                className="bg-black hover:bg-gray-800 text-white px-4 rounded-full font-geist"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    d="M9.16699 1.6665H7.50033C3.33366 1.6665 1.66699 3.33317 1.66699 7.49984V12.4998C1.66699 16.6665 3.33366 18.3332 7.50033 18.3332H12.5003C16.667 18.3332 18.3337 16.6665 18.3337 12.4998V10.8332"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M13.3666 2.51688L6.7999 9.08354C6.5499 9.33354 6.2999 9.82521 6.2499 10.1835L5.89157 12.6919C5.75823 13.6002 6.3999 14.2335 7.30823 14.1085L9.81657 13.7502C10.1666 13.7002 10.6582 13.4502 10.9166 13.2002L17.4832 6.63354C18.6166 5.50021 19.1499 4.18354 17.4832 2.51688C15.8166 0.850211 14.4999 1.38354 13.3666 2.51688Z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeMiterlimit="10"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M12.4248 3.4585C12.9831 5.45016 14.5415 7.0085 16.5415 7.57516"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeMiterlimit="10"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Edit
              </Button>
            </div>

            {/* Profile Information */}
            <div className="space-y-7 max-md:w-full mt-4">
              {/* First Row */}
              <div className="grid grid-cols-2 md:grid-cols-2 gap-20">
                <div>
                  <label className="block text-base font-semibold dark:bg-black dark:text-white text-gray-700 font-plus-jakarta mb-2">
                    Name
                  </label>
                  <p className="text-base text-gray-600 dark:bg-black dark:text-white font-plus-jakarta">
                    {profile?.firstName || ""} {profile?.lastName || ""}
                  </p>
                </div>
                <div>
                  <label className="block text-base font-semibold dark:bg-black dark:text-white text-gray-700 font-plus-jakarta mb-2">
                    Phone Number
                  </label>
                  <p className="text-base text-gray-600 dark:bg-black dark:text-white font-plus-jakarta">
                    {profile?.phoneNumber || ""}
                  </p>
                </div>
              </div>

              <hr className="border-gray-200" />

              {/* Second Row */}
              <div className="grid grid-cols-2 md:grid-cols-2 gap-20">
                <div>
                  <label className="block text-base font-semibold dark:bg-black dark:text-white text-gray-700 font-plus-jakarta mb-2">
                    Email
                  </label>
                  <p className="text-base text-gray-600 dark:bg-black dark:text-white font-plus-jakarta">
                    {profile?.email || user?.email || ""}
                  </p>
                </div>
                <div>
                  <label className="block text-base font-semibold text-gray-700 dark:bg-black dark:text-white font-plus-jakarta mb-2">
                    Date of Birth
                  </label>
                  <p className="text-base text-gray-600 dark:bg-black dark:text-white font-plus-jakarta">
                    {formatDate(profile?.dateOfBirth) || ""}
                  </p>
                </div>
              </div>

              <hr className="border-gray-200" />

              {/* Third Row */}
              <div className="grid grid-cols-2 md:grid-cols-2 gap-20">
                <div>
                  <label className="block text-base font-semibold text-gray-700 dark:bg-black dark:text-white font-plus-jakarta mb-2">
                    State
                  </label>
                  <p className="text-base text-gray-600 dark:bg-black dark:text-white font-plus-jakarta">
                    {profile?.state || ""}
                  </p>
                </div>
                <div>
                  <label className="block text-base font-semibold dark:bg-black dark:text-white text-gray-700 font-plus-jakarta mb-2">
                    City
                  </label>
                  <p className="text-base text-gray-600 dark:bg-black dark:text-white font-plus-jakarta">
                    {profile?.city || ""}
                  </p>
                </div>
              </div>

              <hr className="border-gray-200" />

              {/* Extra Info */}
              {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-base font-semibold text-gray-700 dark:bg-black dark:text-white font-plus-jakarta mb-2">
                    ID Proof
                  </label>
                  <p className="text-base text-gray-600 dark:bg-black dark:text-white font-plus-jakarta">
                    {profile?.idProof || "2233-4455-6677"}
                  </p>
                </div>
              </div> */}
            </div>
          </div>
        </div>

      
      </div>
      <Footer/>
    </div>
  );
};

export default UserProfile;
