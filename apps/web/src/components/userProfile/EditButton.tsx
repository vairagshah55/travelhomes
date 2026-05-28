import { Button } from "@/components/ui/button";
import EditIcon from "./EditIcon";

interface EditButtonProps {
  onClick: () => void;
  className?: string;
}

const EditButton = ({ onClick, className }: EditButtonProps) => (
  <Button
    onClick={onClick}
    className={`bg-[#0F5C8A] hover:bg-[#0A4670] text-white rounded-full font-geist shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ${className ?? ""}`}
  >
    <EditIcon />
    Edit
  </Button>
);

export default EditButton;
