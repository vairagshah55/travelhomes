import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

import { adminAuthService } from "@/services/api";
import { useAuth } from "@/contexts/AdminAuthContext";

/**
 * Turn whatever the api layer threw into something the operator can act on.
 * Bad credentials, a stopped API and an unreachable database are three different
 * problems and used to produce one indistinguishable toast.
 */
function describeLoginFailure(err: unknown): string {
  if (typeof err === "string" && err.trim()) {
    return /network|timeout|failed to fetch/i.test(err)
      ? "Can't reach the server. Check that the API is running on its port."
      : err;
  }
  const e = err as { error?: { code?: string; message?: string }; message?: string } | null;
  switch (e?.error?.code) {
    case "DATABASE_UNAVAILABLE":
      return "The server can't reach its database. Check the API log for the reason, then retry.";
    case "UNAUTHORIZED":
      return "Incorrect email or password.";
    case "FORBIDDEN":
      return e?.error?.message || "This account isn't active. Contact an administrator.";
    case "TOO_MANY_REQUESTS":
      return "Too many attempts. Wait a few minutes and try again.";
    default:
      return e?.error?.message || e?.message || "Admin login failed. Please try again.";
  }
}

const AdminLogin = () => {
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Check if admin is already logged in.
  // NOTE: AdminApp is mounted at /admin/* in the parent router, so paths inside
  // AdminApp are relative to /admin. Navigating to absolute "/dashboard" would
  // hit the vendor-protected root route and bounce admins to the vendor login.
  React.useEffect(() => {
    const adminToken = localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");
    if (adminToken) {
      navigate("/admin/dashboard");
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const data = await adminAuthService.login({
        email: formData.email,
        password: formData.password,
      });

      if (!data?.success) {
        toast.error(data?.message || "Invalid admin credentials");
        return;
      }

      const token = data.token || data?.data?.token || data?.accessToken;

      if (!token) {
        toast.error("Token not received from server");
        return;
      }

      if (rememberMe) {
        localStorage.setItem("adminToken", token);
      } else {
        sessionStorage.setItem("adminToken", token);
      }

      // Pull the role's permissions BEFORE navigating. AuthProvider sits above
      // the router and only fetches /me once on mount — which, on the login
      // page, happened while there was no token, leaving `access` null. Every
      // protected route then sat on its loading spinner forever, because the
      // guard waits for `access` and nothing else would ever fetch it.
      await refresh();

      toast.success("Admin login successful!");
      // A staff member without view_dashboard gets bounced from here to the
      // first area their role does hold (see AdminProtectedRoute).
      navigate("/admin/dashboard");
    } catch (error: unknown) {
      // `services/api.ts` re-throws the server envelope, or a bare string when
      // the request never landed — so `error.message` is usually undefined and
      // every failure used to read as the same generic "login failed", including
      // "the API is down" and "the database is unreachable".
      toast.error(describeLoginFailure(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F7F8FA] via-white to-[#F7F8FA] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Admin Panel Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-5">
            <BrandLogo variant="stacked" size={84} />
          </div>
          <h1 className="text-2xl font-bold text-black mb-1">Admin Panel</h1>
          <p className="text-gray-700">Secure administrative access</p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-xl">
          {/* Login form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Admin Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                  className="mt-1 h-12 bg-white border-gray-300 text-black placeholder:text-gray-400 focus:border-[#3bd9da] focus:ring-[#3bd9da]"
                  placeholder="Enter admin email"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Admin Password
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                    className="h-12 bg-white border-gray-300 text-black placeholder:text-gray-400 focus:border-[#3bd9da] focus:ring-[#3bd9da] pr-12"
                    placeholder="Enter admin password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  id="remember"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-[#117479] bg-white border-gray-300 rounded focus:ring-[#3bd9da]"
                />
                <Label htmlFor="remember" className="text-sm text-gray-700">
                  Keep me signed in
                </Label>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-[#117479] to-[#0d5c60] hover:from-[#0d5c60] hover:to-[#117479] text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Authenticating...
                </div>
              ) : (
                "Access Admin Panel"
              )}
            </Button>

            <div className="text-center pt-4">
              <p className="text-xs text-gray-500">
                For vendor access, use the{" "}
                <Link to="/login" className="text-gray-700 hover:text-black underline">
                  vendor login page
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Security notice */}
        <div className="text-center mt-6 text-xs text-gray-500">
          <p>This is a secure admin area. All activities are logged and monitored.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
