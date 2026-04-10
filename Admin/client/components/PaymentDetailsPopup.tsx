import React from "react";
import { X } from "lucide-react";

interface PaymentDetailsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  payment: {
    paymentId: string;
    businessName: string;
    personName: string;
    servicesId: string;
    status: string;
    amount?: string;
    paymentMode?: string;
    transactionId?: string;
  };
}

const PaymentDetailsPopup: React.FC<PaymentDetailsPopupProps> = ({
  isOpen,
  onClose,
  payment,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl p-8 w-full max-w-3xl mx-4 shadow-xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-1 rounded-full bg-gray-200 hover:bg-gray-300 transition-colors"
        >
          <X className="w-4 h-4 text-black" />
        </button>

        {/* Header */}
        <div className="mb-7">
          <h2 className="text-2xl font-bold text-black">Payment Details</h2>
        </div>

        {/* Content */}
        <div className="space-y-9">
          {/* First Row */}
          <div className="flex gap-10">
            <div className="flex-1 space-y-3">
              <label className="block text-base font-bold text-gray-800">
                Payment ID
              </label>
              <p className="text-sm font-normal text-gray-700">
                {payment.paymentId}
              </p>
            </div>
            <div className="flex-1 space-y-3">
              <label className="block text-base font-bold text-gray-800">
                Business Name
              </label>
              <p className="text-sm font-normal text-gray-700">
                {payment.businessName}
              </p>
            </div>
            <div className="flex-1 space-y-3">
              <label className="block text-base font-bold text-gray-800">
                Person Name
              </label>
              <p className="text-sm font-normal text-gray-700">
                {payment.personName}
              </p>
            </div>
          </div>

          {/* Second Row */}
          <div className="flex gap-10">
            <div className="flex-1 space-y-3">
              <label className="block text-base font-bold text-gray-800">
                Services ID
              </label>
              <p className="text-sm font-normal text-gray-700">
                {payment.servicesId}
              </p>
            </div>
            <div className="flex-1 space-y-3">
              <label className="block text-base font-bold text-gray-800">
                Status
              </label>
              <p className="text-sm font-normal text-gray-700">
                {payment.status}
              </p>
            </div>
            <div className="flex-1 space-y-3">
              <label className="block text-base font-bold text-gray-800">
                Amount
              </label>
              <p className="text-sm font-normal text-gray-700">
                {payment.amount || "N/A"}
              </p>
            </div>
          </div>

          {/* Third Row */}
          <div className="flex gap-9">
            <div className="w-52 space-y-3">
              <label className="block text-base font-bold text-gray-800">
                Payment Mode
              </label>
              <p className="text-sm font-normal text-gray-700">
                {payment.paymentMode || "N/A"}
              </p>
            </div>
            <div className="flex-1 space-y-3">
              <label className="block text-base font-bold text-gray-800">
                Transaction ID
              </label>
              <p className="text-sm font-normal text-gray-700 break-all">
                {payment.transactionId || "N/A"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetailsPopup;
