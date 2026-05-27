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
  userInitials = "",
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
    navigate('/');
    if (onSwitchToUserClick) onSwitchToUserClick();
  };


  
  const handleLogout = () => {
    logout();
    navigate('/login');
    if (onLogoutClick) onLogoutClick();
  };

  // Derive initials from the authenticated user (firstName/lastName, then the
  // legacy `name`, then email), falling back to any passed prop, then "U".
  const getUserInitials = () => {
    if (user?.firstName) {
      return `${user.firstName.charAt(0)}${user.lastName?.charAt(0) || ""}`.toUpperCase();
    }
    const legacyName = (user as { name?: string } | null)?.name;
    if (legacyName?.trim()) {
      const parts = legacyName.trim().split(/\s+/);
      return ((parts[0][0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
    }
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return userInitials || "U";
  };

  // Only use a real photo (user's own, then an explicit prop). No stranger
  // stock-photo fallback — the initials AvatarFallback covers the empty case.
  const photoUrl = user?.photo || userImage || "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Avatar className="h-9 w-9 cursor-pointer hover:ring-2 hover:ring-dashboard-primary hover:ring-offset-2 transition-all">
          {photoUrl && <AvatarImage src={getImageUrl(photoUrl)} />}
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
