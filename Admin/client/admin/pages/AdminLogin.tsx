import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Eye, EyeOff, ArrowLeft, Shield } from 'lucide-react';

// Demo admin credentials
const ADMIN_DEMO_CREDENTIALS = {
  email: 'admin@travelhomes.com',
  password: '123456789'
};

import { adminAuthService } from '@/services/api';

const AdminLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: ADMIN_DEMO_CREDENTIALS.email,
    password: ADMIN_DEMO_CREDENTIALS.password
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Check if admin is already logged in
  React.useEffect(() => {
    const adminToken = localStorage.getItem('adminToken') || sessionStorage.getItem('adminToken');
    if (adminToken) {
      navigate('/dashboard');
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

    console.log("LOGIN RESPONSE:", data);

    if (!data?.status) {
      toast.error(data?.message || "Invalid admin credentials");
      return;
    }
console.log("LOGIN RESPONSE:", data.token);
    // 🔑 SAFELY EXTRACT TOKEN
    const token =
      data.token ||
      data?.data?.token ||
      data?.accessToken;

    if (!token) {
      toast.error("Token not received from server");
      return;
    }

    console.log("hello", token);
    

    if (rememberMe) {
      localStorage.setItem("adminToken", token);
    } else {
      sessionStorage.setItem("adminToken", token);
    }

    toast.success("Admin login successful!");
    navigate("/dashboard");

  } catch (error: any) {
    console.error("ADMIN LOGIN ERROR:", error);
    toast.error(error?.message || "Admin login failed. Please try again.");
  } finally {
    setIsLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Admin Panel Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-purple-600 rounded-full">
              <Shield size={32} className="text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Admin Panel</h1>
          <p className="text-purple-200">Secure administrative access</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl p-8 shadow-2xl">
          {/* Back button */}
          {/* <Link
            to="/"
            className="flex items-center gap-2 text-purple-200 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft size={20} />
            <span className="text-sm font-medium">Back to homepage</span>
          </Link> */}

          {/* Demo credentials notice */}
          <div className="bg-purple-600/20 border border-purple-400/30 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-purple-100 mb-2 flex items-center gap-2">
              <Shield size={16} />
              Demo Admin Credentials
            </h3>
            <p className="text-sm text-purple-200 mb-3">Use these credentials for admin access:</p>
            <div className="space-y-2 text-sm font-mono bg-black/20 rounded p-3">
              <div className="text-purple-100">
                <span className="text-purple-300">Email:</span> {ADMIN_DEMO_CREDENTIALS.email}
              </div>
              <div className="text-purple-100">
                <span className="text-purple-300">Password:</span> {ADMIN_DEMO_CREDENTIALS.password}
              </div>
            </div>
          </div>

          {/* Login form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-purple-100">
                  Admin Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="mt-1 h-12 bg-white/10 border-white/20 text-white placeholder:text-purple-300 focus:border-purple-400 focus:ring-purple-400"
                  placeholder="Enter admin email"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-sm font-medium text-purple-100">
                  Admin Password
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    className="h-12 bg-white/10 border-white/20 text-white placeholder:text-purple-300 focus:border-purple-400 focus:ring-purple-400 pr-12"
                    placeholder="Enter admin password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-300 hover:text-white transition-colors"
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
                  className="w-4 h-4 text-purple-600 bg-white/10 border-white/20 rounded focus:ring-purple-500"
                />
                <Label htmlFor="remember" className="text-sm text-purple-200">
                  Keep me signed in
                </Label>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
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
              <p className="text-xs text-purple-300">
                For vendor access, use the{' '}
                <Link to="/login" className="text-purple-100 hover:text-white underline">
                  vendor login page
                </Link>
              </p>
            </div>
          </form>
        </div>

        {/* Security notice */}
        <div className="text-center mt-6 text-xs text-purple-300">
          <p>This is a secure admin area. All activities are logged and monitored.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
