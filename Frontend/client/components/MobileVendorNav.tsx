import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const MobileVendorNav = () => {
  const location = useLocation();
  
  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard' || location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };
  
  const navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 21 20" fill="none">
          <g clipPath="url(#clip0_0_15209)">
            <path d="M19.1331 9.08317V3.4165C19.1331 2.1665 18.5998 1.6665 17.2748 1.6665H13.9081C12.5831 1.6665 12.0498 2.1665 12.0498 3.4165V9.08317C12.0498 10.3332 12.5831 10.8332 13.9081 10.8332H17.2748C18.5998 10.8332 19.1331 10.3332 19.1331 9.08317Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M19.1331 16.5835V15.0835C19.1331 13.8335 18.5998 13.3335 17.2748 13.3335H13.9081C12.5831 13.3335 12.0498 13.8335 12.0498 15.0835V16.5835C12.0498 17.8335 12.5831 18.3335 13.9081 18.3335H17.2748C18.5998 18.3335 19.1331 17.8335 19.1331 16.5835Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9.54964 10.9165V16.5832C9.54964 17.8332 9.01631 18.3332 7.69131 18.3332H4.32464C2.99964 18.3332 2.46631 17.8332 2.46631 16.5832V10.9165C2.46631 9.6665 2.99964 9.1665 4.32464 9.1665H7.69131C9.01631 9.1665 9.54964 9.6665 9.54964 10.9165Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M9.54964 3.4165V4.9165C9.54964 6.1665 9.01631 6.6665 7.69131 6.6665H4.32464C2.99964 6.6665 2.46631 6.1665 2.46631 4.9165V3.4165C2.46631 2.1665 2.99964 1.6665 4.32464 1.6665H7.69131C9.01631 1.6665 9.54964 2.1665 9.54964 3.4165Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </g>
          <defs>
            <clipPath id="clip0_0_15209">
              <rect width="20" height="20" fill="white" transform="translate(0.799805)"/>
            </clipPath>
          </defs>
        </svg>
      )
    },
    {
      label: 'Calendar',
      path: '/bookings',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 21 20" fill="none">
          <g clipPath="url(#clip0_0_15212)">
            <path d="M7.06641 1.6665V4.1665" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M13.7334 1.6665V4.1665" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3.31641 7.5752H17.4831" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M17.8999 7.08317V14.1665C17.8999 16.6665 16.6499 18.3332 13.7332 18.3332H7.06657C4.1499 18.3332 2.8999 16.6665 2.8999 14.1665V7.08317C2.8999 4.58317 4.1499 2.9165 7.06657 2.9165H13.7332C16.6499 2.9165 17.8999 4.58317 17.8999 7.08317Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M13.479 11.4167H13.4865" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M13.479 13.9167H13.4865" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10.396 11.4167H10.4035" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10.396 13.9167H10.4035" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7.31199 11.4167H7.31948" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7.31199 13.9167H7.31948" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </g>
          <defs>
            <clipPath id="clip0_0_15212">
              <rect width="20" height="20" fill="white" transform="translate(0.399902)"/>
            </clipPath>
          </defs>
        </svg>
      )
    },
    {
      label: 'Booking',
      path: '/bookings/new',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 20 20" fill="none">
          <path d="M8.85714 11.1429H3.14286C2.81905 11.1429 2.54781 11.0331 2.32915 10.8137C2.11048 10.5943 2.00077 10.323 2 10C1.99924 9.67695 2.10896 9.40571 2.32915 9.18629C2.54934 8.96686 2.82057 8.85714 3.14286 8.85714H8.85714V3.14286C8.85714 2.81905 8.96686 2.54781 9.18629 2.32915C9.40571 2.11048 9.67695 2.00077 10 2C10.323 1.99924 10.5947 2.10896 10.8149 2.32915C11.035 2.54934 11.1444 2.82057 11.1429 3.14286V8.85714H16.8571C17.1809 8.85714 17.4526 8.96686 17.672 9.18629C17.8914 9.40571 18.0008 9.67695 18 10C17.9992 10.323 17.8895 10.5947 17.6709 10.8149C17.4522 11.035 17.1809 11.1444 16.8571 11.1429H11.1429V16.8571C11.1429 17.1809 11.0331 17.4526 10.8137 17.672C10.5943 17.8914 10.323 18.0008 10 18C9.67695 17.9992 9.40571 17.8895 9.18629 17.6709C8.96686 17.4522 8.85714 17.1809 8.85714 16.8571V11.1429Z" fill="currentColor"/>
        </svg>
      )
    },
    {
      label: 'Chat',
      path: '/chat',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 21 20" fill="none">
          <g clipPath="url(#clip0_0_15219)">
            <path d="M15.9913 14.0249L16.3163 16.6582C16.3996 17.3498 15.658 17.8331 15.0663 17.4748L11.5746 15.3998C11.1913 15.3998 10.8163 15.3748 10.4497 15.3248C11.0663 14.5998 11.433 13.6832 11.433 12.6915C11.433 10.3248 9.38298 8.40819 6.84965 8.40819C5.88298 8.40819 4.99132 8.68317 4.24965 9.1665C4.22465 8.95817 4.21631 8.74983 4.21631 8.53316C4.21631 4.7415 7.50798 1.6665 11.5746 1.6665C15.6413 1.6665 18.933 4.7415 18.933 8.53316C18.933 10.7832 17.7746 12.7749 15.9913 14.0249Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M11.4328 12.6915C11.4328 13.6832 11.0661 14.5999 10.4495 15.3249C9.62445 16.3249 8.31611 16.9665 6.84945 16.9665L4.67445 18.2582C4.30778 18.4832 3.84111 18.1748 3.89111 17.7498L4.09944 16.1082C2.98278 15.3332 2.26611 14.0915 2.26611 12.6915C2.26611 11.2248 3.04945 9.93318 4.24945 9.16651C4.99112 8.68318 5.88278 8.4082 6.84945 8.4082C9.38278 8.4082 11.4328 10.3248 11.4328 12.6915Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </g>
          <defs>
            <clipPath id="clip0_0_15219">
              <rect width="20" height="20" fill="white" transform="translate(0.599609)"/>
            </clipPath>
          </defs>
        </svg>
      )
    },
    {
      label: 'Profile',
      path: '/profile',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 21 20" fill="none">
          <path d="M10.2996 10.6502C10.2413 10.6419 10.1663 10.6419 10.0996 10.6502C8.63298 10.6002 7.46631 9.40023 7.46631 7.92523C7.46631 6.41689 8.68298 5.19189 10.1996 5.19189C11.708 5.19189 12.933 6.41689 12.933 7.92523C12.9246 9.40023 11.7663 10.6002 10.2996 10.6502Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M15.8163 16.1498C14.333 17.5081 12.3663 18.3331 10.1997 18.3331C8.03301 18.3331 6.06634 17.5081 4.58301 16.1498C4.66634 15.3665 5.16634 14.5998 6.05801 13.9998C8.34134 12.4831 12.0747 12.4831 14.3413 13.9998C15.233 14.5998 15.733 15.3665 15.8163 16.1498Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10.1995 18.3332C14.8019 18.3332 18.5329 14.6022 18.5329 9.99984C18.5329 5.39746 14.8019 1.6665 10.1995 1.6665C5.59717 1.6665 1.86621 5.39746 1.86621 9.99984C1.86621 14.6022 5.59717 18.3332 10.1995 18.3332Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white lg:hidden z-50">
      <nav className="flex justify-between items-center px-4 py-3">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="flex flex-col items-center gap-2 flex-1"
          >
            <div className={`${isActive(item.path) ? 'text-dashboard-primary' : 'text-gray-500'}`}>
              {item.icon}
            </div>
            <span className={`text-xs font-plus-jakarta ${
              isActive(item.path) ? 'text-dashboard-primary font-bold' : 'text-gray-500 font-normal'
            }`}>
              {item.label}
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default MobileVendorNav;
