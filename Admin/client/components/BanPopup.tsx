import React, { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BanPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => void;
  listingName?: string;
  isLoading?: boolean;
}

const BanPopup: React.FC<BanPopupProps> = ({
  isOpen,
  onClose,
  onSubmit,
  listingName = "this listing",
  isLoading = false,
}) => {
  const [reason, setReason] = useState("");

  const handleSubmit = () => {
    if (reason.trim()) {
      onSubmit(reason);
      // Don't reset or close here - it will be handled after API call completes
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setReason("");
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-8 w-full max-w-3xl mx-4 relative">
        {/* Close Button */}
        <button
          onClick={handleClose}
          disabled={isLoading}
          className="absolute top-4 right-4 w-6 h-6 bg-[#E5E5E5] rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors disabled:opacity-50"
        >
          <X size={16} className="text-black" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-[32px] font-bold text-black font-geist">
            Deactivate Listing
          </h2>
        </div>

        {/* Description */}
        <div className="mb-6">
          <p className="text-gray-700">
            Are you sure you want to deactivate <strong>{listingName}</strong>? This
            action will change the listing status to "deactivate" and it will no longer be
            visible to users.
          </p>
        </div>

        {/* Form */}
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-base text-[#334054] font-plus-jakarta font-normal">
              Reason for Deactivation
            </label>
            <textarea
              placeholder="Please provide a reason for deactivating this listing"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={6}
              disabled={isLoading}
              className="w-full p-3.5 border border-[#B0B0B0] rounded-lg text-sm text-[#717171] font-plus-jakarta placeholder:text-[#717171] resize-none focus:outline-none focus:ring-2 focus:ring-[#131313] focus:border-transparent disabled:opacity-50"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="mt-8">
          <Button
            onClick={handleSubmit}
            disabled={!reason.trim() || isLoading}
            className="w-full h-12 bg-[#D30000] text-white rounded-[60px] text-base font-geist font-medium hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              "Deactivate Listing"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BanPopup;
