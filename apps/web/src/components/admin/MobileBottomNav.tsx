import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users2, Calendar, MessageSquare, Settings } from "lucide-react";
import { useAuth } from "@/contexts/AdminAuthContext";
import { featureForPath } from "@/lib/adminPermissions";

// AdminApp is mounted at /admin/* in the parent router, so every path here
// must include the /admin prefix — otherwise navigation lands on the public
// (vendor) routes and bounces admins to the vendor login.
const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
  { label: "Users", icon: Users2, path: "/admin/management/user" },
  { label: "Bookings", icon: Calendar, path: "/admin/management/booking" },
  { label: "Tickets", icon: MessageSquare, path: "/admin/help-desk" },
  { label: "Settings", icon: Settings, path: "/admin/global-settings" },
];

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { can } = useAuth();

  // Drop what this role can't open — same filter the desktop sidebar applies.
  // Without it, a staff member limited to e.g. Users still saw five tabs, and
  // four of them bounced straight back off AdminProtectedRoute.
  const items = NAV_ITEMS.filter(({ path }) => {
    const feature = featureForPath(path);
    return !feature || can(feature);
  });

  // Resolve a single active item: the LONGEST path the current URL falls under
  // (with a "/" boundary so /admin/dashboard never matches /admin/dashboard-x).
  // Same approach as the desktop sidebar — avoids two items lighting up at once.
  const { pathname } = location;
  const activePath = items
    .map((i) => i.path)
    .filter((p) => pathname === p || pathname.startsWith(p + "/"))
    .sort((a, b) => b.length - a.length)[0];

  if (items.length === 0) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-tpl-dark-2 border-t border-gray-200 dark:border-tpl-stroke lg:hidden flex items-center justify-around h-14 px-2">
      {items.map(({ label, icon: Icon, path }) => {
        const isActive = path === activePath;
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`flex flex-col items-center gap-0.5 flex-1 py-2 cursor-pointer transition-colors ${
              isActive ? "text-tpl-primary" : "text-tpl-dark-5"
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
