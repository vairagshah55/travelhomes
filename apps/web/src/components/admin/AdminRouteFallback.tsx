import { Shield } from "lucide-react";

/**
 * Minimal fallback shown while the admin sub-app chunk is downloading.
 * Matches the AdminLogin gradient so the transition feels seamless instead
 * of flashing the public-site property-detail skeleton (RouteFallback).
 */
const AdminRouteFallback = () => (
  <div className="min-h-screen bg-gradient-to-br from-[#F7F8FA] via-white to-[#F7F8FA] flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="p-4 bg-[#2563eb] rounded-full shadow-lg">
        <Shield size={28} className="text-white" />
      </div>
      <div className="w-6 h-6 border-2 border-black/15 border-t-black rounded-full animate-spin" />
    </div>
  </div>
);

export default AdminRouteFallback;
