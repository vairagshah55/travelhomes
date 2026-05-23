import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X } from "lucide-react";

interface User {
  // Common fields from schema or API
  userId?: string;
  _id?: string;
  name?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  location?: string;
  city?: string;
  state?: string;
  dob?: string;
  userSince?: string;
  createdAt?: string;
  registrationDate?: string;
  lastActiveDate?: string;
  bookedServices?: string;
  bookedService?: string;
  status?: string;
  isVendor?: string | boolean;
  // Computed helpers
  firstName?: string;
  lastName?: string;
}

interface UserDetailsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  user: any; // Relaxed type to handle mixed API responses
}

const UserDetailsPopup: React.FC<UserDetailsPopupProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  if (!user) return null;

  // Helper to extract display values safely
  const getId = () => user.userId || user._id || '-';
  const getFirstName = () => user.firstName || user.name?.split(' ')[0] || '-';
  const getLastName = () => user.lastName || user.name?.split(' ').slice(1).join(' ') || '-';
  const getEmail = () => user.email || '-';
  const getMobile = () => user.mobile || user.phone || '-';
  const getDob = () => user.dob || '-';
  
  // Location handling
  const getLocation = () => user.location || user.city || '-';
  const getState = () => user.state || '-';

  // Dates
  const getRegDate = () => {
    const d = user.registrationDate || user.userSince || user.createdAt;
    return d ? new Date(d).toLocaleDateString() : '-';
  };
  const getLastActive = () => user.lastActiveDate || '-';
  
  const getBookedService = () => user.bookedService || user.bookedServices || '-';
  
  const getIsVendor = () => {
    if (typeof user.isVendor === 'boolean') return user.isVendor ? 'Yes' : 'No';
    return user.isVendor || 'No';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 gap-0 h-[600px]">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-black font-geist">
              User Details
            </DialogTitle>
             {/* <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button> */}
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* User ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                User ID
              </label>
              <div className="text-base text-black font-medium">
                {getId()}
              </div>
            </div>

            {/* First Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>
              <div className="text-base text-black">{getFirstName()}</div>
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>
              <div className="text-base text-black">{getLastName()}</div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="text-base text-black">{getEmail()}</div>
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mobile
              </label>
              <div className="text-base text-black">{getMobile()}</div>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Birth
              </label>
              <div className="text-base text-black">{getDob()}</div>
            </div>

            {/* City / Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location / City
              </label>
              <div className="text-base text-black">{getLocation()}</div>
            </div>

            {/* State */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State
              </label>
              <div className="text-base text-black">{getState()}</div>
            </div>

            {/* Registration Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registration Date
              </label>
              <div className="text-base text-black">
                {getRegDate()}
              </div>
            </div>

            {/* Last Active Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Active Date
              </label>
              <div className="text-base text-black">{getLastActive()}</div>
            </div>

            {/* Booked Service */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Booked Service
              </label>
              <div className="text-base text-black">{getBookedService()}</div>
            </div>

            {/* Is Vendor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Is this user a vendor
              </label>
              <div className="text-base text-black">{getIsVendor()}</div>
            </div>
            
            {/* Status (Extra Field) */}
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <div className="text-base">
                 <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    (user.status === 'active') ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                 }`}>
                    {user.status || 'Unknown'}
                 </span>
              </div>
            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserDetailsPopup;
