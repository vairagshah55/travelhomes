import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import UserDropdown from './UserDropdown';

interface HeaderProps {
  variant?: 'transparent' | 'white';
  className?: string;
}

export default function Header({ variant = 'white', className = '' }: HeaderProps) {
  const { user, updateUserType } = useAuth();
  const navigate = useNavigate();

  const isTransparent = variant === 'transparent';

  const handleSwitchToVendor = () => {
    updateUserType('vendor');
    navigate('/dashboard'); // Navigate to vendor dashboard
  };
  
  return (
    <nav className={`flex items-center justify-between px-4 md:px-20 py-4 ${
      isTransparent 
        ? 'bg-transparent' 
        : 'bg-white shadow-sm border-b border-gray-200'
    } ${className}`}>
      {/* Logo */}
      <Link to="/" className="flex-shrink-0">
        <img
          className="h-12 md:h-14 w-auto"
          src="https://api.builder.io/api/v1/image/assets/TEMP/4bb5e4c26962166119b759e58b0a3a851d439d09?width=160"
          alt="Travel Home Logo"
        />
      </Link>
      
      {/* Nav Items - Hidden on mobile */}
      <div className="hidden lg:flex items-center gap-10 flex-1 justify-center">
        {/* Navigation items can be added here */}
      </div>
      
      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          className={`hidden md:flex ${
            isTransparent
              ? 'bg-white/90 backdrop-blur-sm border-white text-black hover:bg-white/100'
              : 'bg-white/90 backdrop-blur-sm border-gray-300 text-black hover:bg-gray-50'
          } rounded-full px-4 md:px-6 h-12`}
          onClick={() => {
            if (user) {
              // Logged-in users go to onboarding pages
              navigate('/onboarding/service-selection');
            } else {
              // Non-registered users go to registration
              navigate('/register');
            }
          }}
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" viewBox="0 0 15 16" fill="none">
              <path fillRule="evenodd" clipRule="evenodd" d="M10 1H5C2.79086 1 1 2.79086 1 5V11C1 13.2091 2.79086 15 5 15H10C12.2091 15 14 13.2091 14 11V5C14 2.79086 12.2091 1 10 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7.5 1.75C7.91421 1.75 8.25 1.41421 8.25 1C8.25 0.585786 7.91421 0.25 7.5 0.25V1.75ZM1.5 0.25C1.08579 0.25 0.75 0.585786 0.75 1C0.75 1.41421 1.08579 1.75 1.5 1.75V0.25ZM7.5 4.75C7.91421 4.75 8.25 4.41421 8.25 4C8.25 3.58579 7.91421 3.25 7.5 3.25V4.75ZM1.5 3.25C1.08579 3.25 0.75 3.58579 0.75 4C0.75 4.41421 1.08579 4.75 1.5 4.75V3.25ZM4.5 7.75C4.91421 7.75 5.25 7.41421 5.25 7C5.25 6.58579 4.91421 6.25 4.5 6.25V7.75ZM1.5 6.25C1.08579 6.25 0.75 6.58579 0.75 7C0.75 7.41421 1.08579 7.75 1.5 7.75V6.25ZM7.5 1V0.25H1.5V1V1.75H7.5V1ZM7.5 4V3.25H1.5V4V4.75H7.5V4ZM4.5 7V6.25H1.5V7V7.75H4.5V7Z" fill="currentColor"/>
            </svg>
            <span className="text-sm font-medium">List your offering</span>
          </div>
        </Button>
        
        {user ? (
          <UserDropdown onSwitchToVendor={handleSwitchToVendor} />
        ) : (
          <>
            <Link to="/register">
              <Button className={`${
                isTransparent
                  ? 'bg-white/90 backdrop-blur-sm text-black hover:bg-white/100'
                  : 'bg-black text-white hover:bg-gray-800'
              } rounded-full px-4 md:px-8 h-12`}>
                Register
              </Button>
            </Link>
            <Link to="/admin/login">
              <Button
                variant="outline"
                className="bg-purple-100 border-purple-300 text-purple-700 hover:bg-purple-200 rounded-full px-3 md:px-4 h-10 text-xs"
              >
                Admin
              </Button>
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
