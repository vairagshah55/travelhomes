import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const MobileUserNav = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    {
      label: 'Home',
      path: '/',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M3 12.9915C3 10.796 3 9.69824 3.51122 8.78671C4.02244 7.87518 4.95776 7.30359 6.8284 6.16042L7.8284 5.54931C9.85916 4.30829 10.8745 3.68778 12 3.68778C13.1255 3.68778 14.1408 4.30829 16.1716 5.54931L17.1716 6.16042C19.0422 7.30359 19.9776 7.87518 20.4888 8.78671C21 9.69824 21 10.796 21 12.9915V12.9915C21 16.7684 21 18.6569 19.8284 19.8284C18.6569 21 16.7712 21 13 21H11C7.22876 21 5.34315 21 4.17157 19.8284C3 18.6569 3 16.7684 3 12.9915V12.9915Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M9 20V16C9 15.0681 9 14.6022 9.15224 14.2346C9.35523 13.7446 9.74458 13.3552 10.2346 13.1522C10.6022 13 11.0681 13 12 13V13C12.9319 13 13.3978 13 13.7654 13.1522C14.2554 13.3552 14.6448 13.7446 14.8478 14.2346C15 14.6022 15 15.0681 15 16V20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      )
    },
    {
      label: 'Search',
      path: '/search',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 25 24">
          <path d="M12 21C17.2467 21 21.5 16.7467 21.5 11.5C21.5 6.25329 17.2467 2 12 2C6.75329 2 2.5 6.25329 2.5 11.5C2.5 16.7467 6.75329 21 12 21Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M22.5 22L20.5 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      label: 'Wishlist',
      path: '/wishlist',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M12.62 20.8101C12.28 20.9301 11.72 20.9301 11.38 20.8101C8.48 19.8201 2 15.6901 2 8.6901C2 5.6001 4.49 3.1001 7.56 3.1001C9.38 3.1001 10.99 3.9801 12 5.3401C13.01 3.9801 14.63 3.1001 16.44 3.1001C19.51 3.1001 22 5.6001 22 8.6901C22 15.6901 15.52 19.8201 12.62 20.8101Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      label: 'Chat',
      path: '/chat',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 25 24">
          <path d="M18.9701 16.83L19.3601 19.99C19.4601 20.82 18.5701 21.4 17.8601 20.97L13.6701 18.48C13.2101 18.48 12.7601 18.45 12.3201 18.39C13.0601 17.52 13.5001 16.42 13.5001 15.23C13.5001 12.39 11.0401 10.09 8.00009 10.09C6.84009 10.09 5.7701 10.42 4.8801 11C4.8501 10.75 4.84009 10.5 4.84009 10.24C4.84009 5.68999 8.79009 2 13.6701 2C18.5501 2 22.5001 5.68999 22.5001 10.24C22.5001 12.94 21.1101 15.33 18.9701 16.83Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M13.5 15.2298C13.5 16.4198 13.06 17.5198 12.32 18.3898C11.33 19.5898 9.76 20.3598 8 20.3598L5.39 21.9098C4.95 22.1798 4.39 21.8098 4.45 21.2998L4.7 19.3298C3.36 18.3998 2.5 16.9098 2.5 15.2298C2.5 13.4698 3.44 11.9198 4.88 10.9998C5.77 10.4198 6.84 10.0898 8 10.0898C11.04 10.0898 13.5 12.3898 13.5 15.2298Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      label: 'Profile',
      path: '/user-profile',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M12.12 12.7805C12.05 12.7705 11.96 12.7705 11.88 12.7805C10.12 12.7205 8.71997 11.2805 8.71997 9.51047C8.71997 7.70047 10.18 6.23047 12 6.23047C13.81 6.23047 15.28 7.70047 15.28 9.51047C15.27 11.2805 13.88 12.7205 12.12 12.7805Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M18.74 19.3796C16.96 21.0096 14.6 21.9996 12 21.9996C9.40001 21.9996 7.04001 21.0096 5.26001 19.3796C5.36001 18.4396 5.96001 17.5196 7.03001 16.7996C9.77001 14.9796 14.25 14.9796 16.97 16.7996C18.04 17.5196 18.64 18.4396 18.74 19.3796Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_44px_4px_rgba(102,102,102,0.07)] lg:hidden z-50">
      <nav className="flex justify-between items-center px-4 py-3">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="flex flex-col items-center gap-2 w-[72px]"
          >
            <div className={`${isActive(item.path) ? 'text-dashboard-primary' : 'text-gray-500'}`}>
              {item.icon}
            </div>
            <span className={`text-xs font-plus-jakarta font-semibold ${
              isActive(item.path) ? 'text-dashboard-primary' : 'text-gray-500'
            }`}>
              {item.label}
            </span>
          </Link>
        ))}
      </nav>

      {/* Home Indicator for iPhones */}
      <div className="flex justify-center pb-2">
        <div className="w-36 h-1 bg-black rounded-full"></div>
      </div>
    </div>
  );
};

export default MobileUserNav;
