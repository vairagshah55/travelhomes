import { useNavigate } from "react-router-dom";
import { SlArrowLeft } from "react-icons/sl";
import { getImageUrl } from "@/lib/utils";
import VerificationItem from "./VerificationItem";

interface User {
  firstName?: string;
  lastName?: string;
  photo?: string;
  email?: string;
  mobileVerified?: boolean;
}

interface ProfileSidebarProps {
  user: User | null | undefined;
}

const ProfileSidebar = ({ user }: ProfileSidebarProps) => {
  const navigate = useNavigate();
  return (
    <div className="lg:w-80 flex-shrink-0">
      <div className="bg-black rounded-md p-8 text-white">
        {/* Avatar */}
        <div className="text-center rounded-full mb-9">
          <div className="relative rounded-full inline-block mb-3">
            <img
              src={user?.photo ? getImageUrl(user.photo) : "/user-avatar.svg"}
              onError={(e) => { e.currentTarget.src = "/user-avatar.svg"; }}
              alt={`${user?.firstName}'s avatar`}
              className="w-full h-full object-cover bg-white rounded-full"
            />
          </div>
          <button
            onClick={() => navigate("/")}
            className="max-md:hidden text-white flex absolute top-8 left-0 items-center gap-1 ml-24 max-md:ml-4 mt-14"
          >
            <SlArrowLeft size={12} />
            <span className="text-sm">Back</span>
          </button>
          <h2 className="text-xl font-bold font-geist">Upload a Photo</h2>
        </div>

        {/* Identity verification blurb */}
        <div className="mb-8">
          <h3 className="text-lg font-bold font-geist mb-3">Identity Verification</h3>
          <p className="text-sm text-gray-300 font-plus-jakarta">
            Whether you're traveling for leisure or business, we're committed to making your stay
            smooth, enjoyable, and truly unforgettable.
          </p>
        </div>

        {/* Verification status */}
        <div className="space-y-4">
          <h3 className="text-lg font-geist">{user?.firstName} {user?.lastName}</h3>
          <div className="space-y-2">
            <VerificationItem
              confirmed={!!user?.email}
              label={user?.email ? "Email Confirmed" : "Email Not Confirmed"}
            />
            <VerificationItem
              confirmed={!!user?.mobileVerified}
              label={user?.mobileVerified ? "Mobile Confirmed" : "Mobile Not Confirmed"}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSidebar;
