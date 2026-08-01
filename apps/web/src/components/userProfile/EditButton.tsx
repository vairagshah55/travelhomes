import { Button } from "@/components/ui/button";
import EditIcon from "./EditIcon";

interface EditButtonProps {
  onClick: () => void;
  className?: string;
}

const EditButton = ({ onClick, className }: EditButtonProps) => (
  <Button
    onClick={onClick}
    className={`bg-[#117479] hover:bg-[#0d4548] text-white rounded-full font-geist shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 ${className ?? ""}`}
  >
    <EditIcon />
    Edit
  </Button>
);

export default EditButton;
