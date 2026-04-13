import { useNavigate } from "react-router-dom";
import { SlArrowLeft } from "react-icons/sl";
import EditButton from "./EditButton";

interface MobileProfileHeaderProps {
  onEdit: () => void;
}

const MobileProfileHeader = ({ onEdit }: MobileProfileHeaderProps) => {
  const navigate = useNavigate();
  return (
    <div className="lg:hidden flex md:flex-row justify-between items-start md:items-center">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate("/")} className="text-black flex items-center">
          <SlArrowLeft size={16} />
        </button>
        <h1 className="text-2xl max-md:text-lg font-semibold dark:bg-black dark:text-white text-gray-800 font-poppins">
          Profile
        </h1>
      </div>
      <EditButton onClick={onEdit} className="px-3" />
    </div>
  );
};

export default MobileProfileHeader;
