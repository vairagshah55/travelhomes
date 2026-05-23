import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAuth } from "../contexts/AuthContext";
import MobileProfileHeader from "../components/userProfile/MobileProfileHeader";
import ProfileSidebar from "../components/userProfile/ProfileSidebar";
import ProfileHeader from "../components/userProfile/ProfileHeader";
import ProfileInfoSection from "../components/userProfile/ProfileInfoSection";

const UserProfile = () => {
  const { user, refreshUser } = useAuth();
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

  const handleEdit = () => navigate("/user-profile-edit");

  return (
    <div className="min-h-screen flex-col flex gap-0 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-200 transition-colors">
      <Header variant="transparent" className="fixed w-full z-50" />

      <div className="px-4 mt-14 md:px-20 py-5">
        <div className="flex flex-col lg:flex-row gap-4 max-w-7xl mx-auto">
          <MobileProfileHeader onEdit={handleEdit} />
          <ProfileSidebar user={user} />

          <div className="flex-1">
            <ProfileHeader onEdit={handleEdit} />
            <ProfileInfoSection profile={user} />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default UserProfile;
