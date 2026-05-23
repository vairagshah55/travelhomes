import { formatDate } from "@/utils/formateTime";
import ProfileField from "./ProfileField";

interface User {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  state?: string;
  city?: string;
}

interface ProfileInfoSectionProps {
  profile: User | null | undefined;
}

const ProfileInfoSection = ({ profile }: ProfileInfoSectionProps) => (
  <div className="space-y-7 max-md:w-full mt-4">
    {/* Name + Phone */}
    <div className="grid grid-cols-2 gap-20">
      <ProfileField
        label="Name"
        value={`${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim()}
      />
      <ProfileField label="Phone Number" value={profile?.phoneNumber} />
    </div>
    <hr className="border-gray-200" />

    {/* Email + DOB */}
    <div className="grid grid-cols-2 gap-20">
      <ProfileField label="Email" value={profile?.email} />
      <ProfileField label="Date of Birth" value={formatDate(profile?.dateOfBirth)} />
    </div>
    <hr className="border-gray-200" />

    {/* State + City */}
    <div className="grid grid-cols-2 gap-20">
      <ProfileField label="State" value={profile?.state} />
      <ProfileField label="City" value={profile?.city} />
    </div>
  </div>
);

export default ProfileInfoSection;
