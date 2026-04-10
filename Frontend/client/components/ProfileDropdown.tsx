import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getImageUrl } from '@/lib/utils';

interface ProfileDropdownProps {
  userImage?: string;
  userInitials?: string;
  onProfileClick?: () => void;
  onViewAsUserClick?: () => void;
  onSwitchToUserClick?: () => void;
  onBusinessDetailsClick?: () => void;
  onPersonalDetailsClick?: () => void;
  onChangePasswordClick?: () => void;
  onLogoutClick?: () => void;
}

const ProfileDropdown: React.FC<ProfileDropdownProps> = ({
  userImage,
  userInitials = "BS",
  onProfileClick,
  onViewAsUserClick,
  onSwitchToUserClick,
  onBusinessDetailsClick,
  onPersonalDetailsClick,
  onChangePasswordClick,
  onLogoutClick
}) => {
  const navigate = useNavigate();
  const { logout, user, updateUserType } = useAuth();

  const handleProfileClick = () => {
    navigate('/profile');
    if (onProfileClick) onProfileClick();
  };

  const handleSwitchToVendor = async () => {
    await updateUserType('vendor');
    navigate('/dashboard');
  };

  const handleSwitchToUserLocal = async () => {
    await updateUserType('user');
    navigate('/user-profile');
    if (onSwitchToUserClick) onSwitchToUserClick();
  };


  
  const handleLogout = () => {
    logout();
    navigate('/login');
    if (onLogoutClick) onLogoutClick();
  };

  // Get user initials from auth context
  const getUserInitials = () => {
    if (user?.firstName) {
      return `${user.firstName.charAt(0)}${user.lastName?.charAt(0) || ''}`;
    }
    return userInitials;
  };

  const photoUrl = user?.photo 
    ? `${user.photo}`
    : userImage || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="h-9 w-9 cursor-pointer hover:ring-2 hover:ring-dashboard-primary hover:ring-offset-2 transition-all">
          <AvatarImage src={getImageUrl(photoUrl)} />
          <AvatarFallback className="bg-dashboard-primary text-white">{getUserInitials()}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg p-1.5"
        sideOffset={8}
      >
        <DropdownMenuItem
          className="px-7 py-4 text-dashboard-heading dark:text-white font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer rounded-md font-plus-jakarta"
          onClick={handleProfileClick}
        >
          Profile
        </DropdownMenuItem>
        {/* <DropdownMenuItem
          className="px-7 py-4 text-dashboard-heading dark:text-white font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer rounded-md font-plus-jakarta"
          onClick={onViewAsUserClick}
        >
          View As User
        </DropdownMenuItem> */}
        {user?.userType === 'vendor' ? (
          <DropdownMenuItem
            className="px-7 py-4 text-dashboard-heading dark:text-white font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer rounded-md font-plus-jakarta"
            onClick={handleSwitchToUserLocal}
          >
            Switch to User
          </DropdownMenuItem>
        ) : (
          (user?.vendorStatus === 'approved' || user?.vendorStatus === 'active') && (
            <DropdownMenuItem
              className="px-7 py-4 text-dashboard-heading dark:text-white font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer rounded-md font-plus-jakarta"
              onClick={handleSwitchToVendor}
            >
              Switch to Vendor
            </DropdownMenuItem>
          )
        )}
        <DropdownMenuItem 
          className="px-7 py-4 text-dashboard-heading dark:text-white font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer rounded-md font-plus-jakarta"
          onClick={onBusinessDetailsClick}
        >
          Business Details
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="px-7 py-4 text-dashboard-heading dark:text-white font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer rounded-md font-plus-jakarta"
          onClick={onPersonalDetailsClick}
        >
          Personal Details
        </DropdownMenuItem>
        <DropdownMenuItem 
          className="px-7 py-4 text-dashboard-heading dark:text-white font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer rounded-md font-plus-jakarta"
          onClick={onChangePasswordClick}
        >
          Change Password
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-600 my-1" />
        <DropdownMenuItem
          className="px-7 py-4 text-red-600 dark:text-red-400 font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer rounded-md font-plus-jakarta"
          onClick={handleLogout}
        >
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileDropdown;
