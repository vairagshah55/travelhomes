import EditButton from "./EditButton";

interface ProfileHeaderProps {
  onEdit: () => void;
}

const ProfileHeader = ({ onEdit }: ProfileHeaderProps) => (
  <div className="hidden lg:flex flex-row justify-between items-start md:items-center mb-9">
    <h1 className="text-2xl max-md:text-lg font-semibold dark:bg-black dark:text-white text-gray-800 font-poppins mb-4 md:mb-0">
      Profile
    </h1>
    <EditButton onClick={onEdit} className="px-4" />
  </div>
);

export default ProfileHeader;
