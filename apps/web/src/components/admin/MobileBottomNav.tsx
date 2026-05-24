import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users2, Calendar, MessageSquare, Settings } from "lucide-react";

// AdminApp is mounted at /admin/* in the parent router, so every path here
// must include the /admin prefix — otherwise navigation lands on the public
// (vendor) routes and bounces admins to the vendor login.
const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
  { label: "Users",     icon: Users2,          path: "/admin/management/user" },
  { label: "Bookings",  icon: Calendar,        path: "/admin/management/booking" },
  { label: "Tickets",   icon: MessageSquare,   path: "/admin/help-desk" },
  { label: "Settings",  icon: Settings,        path: "/admin/global-settings" },
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
