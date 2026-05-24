import { Button } from "@/components/ui/button";
import EditIcon from "./EditIcon";

interface EditButtonProps {
  onClick: () => void;
  className?: string;
}

const EditButton = ({ onClick, className }: EditButtonProps) => (
  <Button
    onClick={onClick}
    className={`bg-[#0F5C8A] hover:bg-[#14709F] text-white rounded-full font-geist ${className ?? ""}`}
  >
    <EditIcon />
    Edit
  </Button>
);

export default EditButton;
