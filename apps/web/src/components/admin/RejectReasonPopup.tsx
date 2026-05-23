import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";

interface RejectReasonPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  isLoading?: boolean;
}

const RejectReasonPopup: React.FC<RejectReasonPopupProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [reason, setReason] = useState("");

  const handleSubmit = () => {
    onSubmit(reason);
    setReason(""); // Reset after submit
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-6 rounded-xl">
        <DialogHeader className="mb-4 flex flex-row items-center justify-between">
          <DialogTitle className="text-2xl font-bold font-geist">Reject</DialogTitle>
          {/* <button
            onClick={onClose}
            className="rounded-full bg-gray-100 p-1 hover:bg-gray-200 transition-colors"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button> */}
        </DialogHeader>

        <div className="space-y-4 mb-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-500">Job Description</label>
            <Textarea
              placeholder="Type Here"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="min-h-[120px] rounded-lg border-gray-200 resize-none focus-visible:ring-0 focus-visible:border-gray-400"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleSubmit}
            disabled={!reason.trim() || isLoading}
            className="bg-black text-white hover:bg-gray-800 rounded-full px-8"
          >
            {isLoading ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RejectReasonPopup;
