import { Button } from "@/components/ui/button";
import EditIcon from "./EditIcon";

interface EditButtonProps {
  onClick: () => void;
  className?: string;
}

const EditButton = ({ onClick, className }: EditButtonProps) => (
  <Button
    onClick={onClick}
    className={`bg-[#1E3A8A] hover:bg-[#2D4DA8] text-white rounded-full font-geist ${className ?? ""}`}
  >
    <EditIcon />
    Edit
  </Button>
);

export default EditButton;
