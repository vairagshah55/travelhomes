import React from 'react';
import { X } from 'lucide-react';

interface HelpDeskPopupProps {
  isOpen: boolean;
  onClose: () => void;
  ticket?: {
    vendorName: string;
    email: string;
    date: string;
    status: string;
    subject: string;
    message: string;
  };
}

const HelpDeskPopup: React.FC<HelpDeskPopupProps> = ({ isOpen, onClose, ticket }) => {
  if (!isOpen || !ticket) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-8 w-full max-w-[774px] relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center hover:bg-gray-300 transition-colors"
        >
          <X size={16} className="text-black" />
        </button>

        {/* Header */}
        <h2 className="text-2xl font-bold text-[#131313] font-geist mb-7">Help Desk</h2>

        {/* Content */}
        <div className="space-y-9">
          {/* First Row */}
          <div className="flex items-center gap-10">
            <div className="w-52">
              <div className="text-base font-bold text-[#212121] font-geist mb-3 leading-[18px] tracking-[0.16px]">
                Vendor Name
              </div>
              <div className="text-sm text-[#2A2A2A] font-plus-jakarta leading-6 tracking-[0.2px]">
                {ticket.vendorName}
              </div>
            </div>
            <div className="w-52">
              <div className="text-base font-bold text-[#212121] font-geist mb-3 leading-[18px] tracking-[0.16px]">
                Email
              </div>
              <div className="text-sm text-[#2A2A2A] font-plus-jakarta leading-6 tracking-[0.2px]">
                {ticket.email}
              </div>
            </div>
            <div className="w-52">
              <div className="text-base font-bold text-[#212121] font-geist mb-3 leading-[18px] tracking-[0.16px]">
                Date
              </div>
              <div className="text-sm text-[#2A2A2A] font-plus-jakarta leading-6 tracking-[0.2px]">
                {ticket.date}
              </div>
            </div>
          </div>

          {/* Second Row */}
          <div className="flex items-center gap-10">
            <div className="w-52">
              <div className="text-base font-bold text-[#212121] font-geist mb-3 leading-[18px] tracking-[0.16px]">
                Status
              </div>
              <div className="text-sm text-[#212121] font-poppins leading-[30px]">
                {ticket.status}
              </div>
            </div>
            <div className="w-52">
              <div className="text-base font-bold text-[#212121] font-geist mb-3 leading-[18px] tracking-[0.16px]">
                Subject
              </div>
              <div className="text-sm text-[#2A2A2A] font-plus-jakarta leading-6 tracking-[0.2px]">
                {ticket.subject}
              </div>
            </div>
          </div>

          {/* Message Section */}
          <div className="flex-1">
            <div className="text-base font-bold text-[#212121] font-geist mb-3 leading-[18px] tracking-[0.16px]">
              Message
            </div>
            <div className="text-xs text-[#2A2A2A] font-plus-jakarta leading-6 tracking-[0.16px]">
              {ticket.message}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpDeskPopup;
