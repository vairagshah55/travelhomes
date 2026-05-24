import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAuth } from "../contexts/AuthContext";
import MobileProfileHeader from "../components/userProfile/MobileProfileHeader";
import ProfileSidebar from "../components/userProfile/ProfileSidebar";
import ProfileHeader from "../components/userProfile/ProfileHeader";
import ProfileInfoSection from "../components/userProfile/ProfileInfoSection";

// NOTE: don't call refreshUser() here. AuthContext already auto-refreshes
// 500ms after app mount and on every tab-visibility change. A page-level
// refresh on top of that caused a visible jerk: the page first painted with
// the cached user, then ~300ms later the refetch landed and React repainted
// with a new user object (refreshUser always builds a fresh reference even
// when nothing changed), flashing the avatar/name layout.
const UserProfile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

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
