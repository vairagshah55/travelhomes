import EditButton from "./EditButton";

interface ProfileHeaderProps {
  onEdit: () => void;
}

const ProfileHeader = ({ onEdit }: ProfileHeaderProps) => (
  <div className="hidden lg:flex flex-row justify-between items-center mb-5">
    <div>
      <h1 className="text-[22px] font-bold text-gray-900 dark:text-white tracking-tight font-poppins leading-tight">
        Profile
      </h1>
      <p className="text-[13px] text-gray-500 mt-1">
        Your personal details and verification status.
      </p>
    </div>
    <EditButton onClick={onEdit} className="px-5" />
  </div>
);

export default ProfileHeader;
