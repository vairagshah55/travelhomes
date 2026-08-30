import { User, Phone, Mail, Calendar, MapPin, Building2 } from "lucide-react";
import { formatDate } from "@/utils/formateTime";
import ProfileField from "./ProfileField";

interface UserProfile {
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  state?: string;
  city?: string;
}

interface ProfileInfoSectionProps {
  profile: UserProfile | null | undefined;
}

const ProfileInfoSection = ({ profile }: ProfileInfoSectionProps) => (
  <div className="bg-white border border-gray-100 rounded-2xl shadow-sm">
    {/* Row 1 — Name + Phone */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8 px-6 py-5">
      <ProfileField
        icon={User}
        label="Name"
        value={`${profile?.firstName ?? ""} ${profile?.lastName ?? ""}`.trim()}
      />
      <ProfileField icon={Phone} label="Phone number" value={profile?.phoneNumber} />
    </div>
    <div className="h-px bg-gray-100 mx-6" />

    {/* Row 2 — Email + DOB */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8 px-6 py-5">
      <ProfileField icon={Mail} label="Email" value={profile?.email} />
      <ProfileField icon={Calendar} label="Date of birth" value={formatDate(profile?.dateOfBirth)} />
    </div>
    <div className="h-px bg-gray-100 mx-6" />

    {/* Row 3 — State + City */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-5 gap-x-8 px-6 py-5">
      <ProfileField icon={Building2} label="State" value={profile?.state} />
      <ProfileField icon={MapPin} label="City" value={profile?.city} />
    </div>
  </div>
);

export default ProfileInfoSection;
