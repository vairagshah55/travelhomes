import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface AdminProfileDropdownProps {
  className?: string;
}

const AdminProfileDropdown: React.FC<AdminProfileDropdownProps> = ({
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    sessionStorage.removeItem("adminToken");
    navigate("/admin/login");
    setIsOpen(false);
  };

  const handleProfile = () => {
    navigate("/admin/profile");
    setIsOpen(false);
  };

  const handleHelp = () => {
    navigate("/admin/help");
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Avatar Button with online-status indicator */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative block rounded-full focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:ring-offset-1"
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        <img
          className="w-8 h-8 cursor-pointer rounded-full bg-cover bg-center ring-1 ring-gray-200 hover:ring-gray-300 transition-all"
          src="https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fHJhbmRvbSUyMHBlb3BsZXxlbnwwfHwwfHx8MA%3D%3D"
          alt=""
        />
        {/* Online status dot — bottom-right, ringed in white to pop against the avatar */}
        <span className="absolute bottom-0 right-0 block w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-12 right-0 w-[296px] bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-50 transform transition-all duration-200 ease-out origin-top-right scale-100">
          {/* Profile */}
          <button
            onClick={handleProfile}
            className="w-full px-7 py-4 text-left border-b border-[#EFEFEF] hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors"
          >
            <div className="text-[#0B0907] font-plus-jakarta text-base font-semibold">
              Profile
            </div>
          </button>

          {/* Help */}
          <button
            onClick={handleHelp}
            className="w-full px-7 py-4 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors"
          >
            <div className="text-[#0B0907] font-plus-jakarta text-base font-semibold">
              Help
            </div>
          </button>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full px-7 py-4 text-left hover:bg-red-50 focus:bg-red-50 focus:outline-none transition-colors"
          >
            <div className="text-red-600 font-plus-jakarta text-base font-semibold">
              Logout
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminProfileDropdown;
