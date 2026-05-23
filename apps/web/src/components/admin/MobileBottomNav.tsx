import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users2, Calendar, MessageSquare, Settings } from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Users",     icon: Users2,          path: "/management/user" },
  { label: "Bookings",  icon: Calendar,        path: "/management/booking" },
  { label: "Tickets",   icon: MessageSquare,   path: "/help-desk" },
  { label: "Settings",  icon: Settings,        path: "/global-settings" },
];

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden flex items-center justify-around h-14 px-2">
      {NAV_ITEMS.map(({ label, icon: Icon, path }) => {
        const isActive = location.pathname.startsWith(path);
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`flex flex-col items-center gap-0.5 flex-1 py-2 cursor-pointer transition-colors ${
              isActive ? "text-brand-500" : "text-gray-400"
            }`}
          >
            <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
            <span className="text-[10px] font-medium">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default MobileBottomNav;
