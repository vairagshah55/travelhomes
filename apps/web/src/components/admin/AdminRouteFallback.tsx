import { Shield } from "lucide-react";

/**
 * Minimal fallback shown while the admin sub-app chunk is downloading.
 * Matches the AdminLogin gradient so the transition feels seamless instead
 * of flashing the public-site property-detail skeleton (RouteFallback).
 */
const AdminRouteFallback = () => (
  <div className="min-h-screen bg-gradient-to-br from-[#0A1E3D] via-[#11295A] to-[#0A1E3D] flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="p-4 bg-[#1E3A8A] rounded-full shadow-lg">
        <Shield size={28} className="text-white" />
      </div>
      <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
    </div>
  </div>
);

export default AdminRouteFallback;
