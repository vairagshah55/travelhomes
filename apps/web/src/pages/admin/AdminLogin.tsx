import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff, ArrowLeft, Shield } from 'lucide-react';

import { adminAuthService } from '@/services/api';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Check if admin is already logged in.
  // NOTE: AdminApp is mounted at /admin/* in the parent router, so paths inside
  // AdminApp are relative to /admin. Navigating to absolute "/dashboard" would
  // hit the vendor-protected root route and bounce admins to the vendor login.
  React.useEffect(() => {
    const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
    if (adminToken) {
      navigate('/admin/dashboard');
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

    toast.success("Admin login successful!");
    navigate("/admin/dashboard");

  } catch (error: any) {
    toast.error(error?.message || "Admin login failed. Please try again.");
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A2B40] via-[#0A4670] to-[#0A2B40] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Admin Panel Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-[#0F5C8A] rounded-full shadow-lg">
              <Shield size={32} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
          <p className="text-[#D0E4EF]">Secure administrative access</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-8 shadow-2xl">
          {/* Login form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-[#D0E4EF]">
                  Admin Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="mt-1 h-12 bg-white/10 border-white/20 text-white placeholder:text-[#67B2D8] focus:border-[#1E88BA] focus:ring-[#1E88BA]"
                  placeholder="Enter admin email"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-sm font-medium text-[#D0E4EF]">
                  Admin Password
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="h-12 bg-white/10 border-white/20 text-white placeholder:text-[#67B2D8] focus:border-[#1E88BA] focus:ring-[#1E88BA] pr-12"
                    placeholder="Enter admin password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#67B2D8] hover:text-white transition-colors"
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
                  className="w-4 h-4 text-[#0F5C8A] bg-white/10 border-white/20 rounded focus:ring-[#1E88BA]"
                />
                <Label htmlFor="remember" className="text-sm text-[#D0E4EF]">
                  Keep me signed in
                </Label>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-[#0F5C8A] to-[#14709F] hover:from-[#14709F] hover:to-[#1E88BA] text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Authenticating...
                </div>
              ) : (
                'Access Admin Panel'
              )}
            </Button>

            <div className="text-center pt-4">
              <p className="text-xs text-[#67B2D8]">
                For vendor access, use the{' '}
                <Link to="/login" className="text-[#D0E4EF] hover:text-white underline">
                  vendor login page
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Security notice */}
        <div className="text-center mt-6 text-xs text-[#67B2D8]">
          <p>This is a secure admin area. All activities are logged and monitored.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
