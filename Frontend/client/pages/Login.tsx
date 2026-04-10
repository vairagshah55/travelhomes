import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { IoIosArrowBack } from "react-icons/io";
import { toast } from "sonner";
import { FcGoogle } from "react-icons/fc";

import { useAuth } from "../contexts/AuthContext";
import Gallery from "./gallery";

const Login = () => {
  const navigate = useNavigate();
  const { login, loginWithGoogle } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { email?: string; password?: string } = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    }

    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const success = await login(
        formData.email,
        formData.password,
        rememberMe
      );
      if (success) {
        toast.success("Login successful!");
        const redirect = sessionStorage.getItem('auth_redirect');
        if (redirect) {
          sessionStorage.removeItem('auth_redirect');
          navigate(redirect);
        } else {
          navigate("/");
        }
      } else {
        toast.error("Invalid credentials");
      }
    } catch {
      toast.error("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black px-6">
      <div className="w-full max-w-6xl flex gap-5">
        <Gallery page="Login" />

        {/* FORM */}
        <div className="w-full lg:w-1/2 max-w-md mx-auto mt-8">
          <Link to="/" className="flex items-center gap-1 mb-6 text-sm font-medium">
            <IoIosArrowBack size={18} /> Home
          </Link>

          <h1 className="text-2xl font-bold mb-2">Sign In</h1>
          <p className="text-sm text-gray-500 mb-6">
            Login to access your account
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* EMAIL */}
            <div>
              <input
                type="text"
                placeholder="Enter Your Email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  setErrors({ ...errors, email: "" });
                }}
                className={`w-full border px-4 py-3 rounded-xl outline-none text-sm ${
                  errors.email ? "border-red-500" : "border-[#D0D0D0]"
                }`}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* PASSWORD */}
            <div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => {
                    setFormData({ ...formData, password: e.target.value });
                    setErrors({ ...errors, password: "" });
                  }}
                  className={`w-full border px-4 py-3 rounded-xl outline-none text-sm ${
                    errors.password ? "border-red-500" : "border-[#D0D0D0]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>
   <label className="hidden  items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  // disabled={loading}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4"
                />
                Remember me
              </label>
            {/* REMEMBER + FORGOT */}
            <div className="flex items-end justify-end text-sm">
           

              <Link to="/forgot-password" className="text-red-500 font-medium">
                Forgot Password?
              </Link>
            </div>

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white py-3 rounded-full font-medium hover:opacity-90 transition"
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>

          <p className="text-sm text-center mt-6">
            Don’t have an account?
            <Link to="/register" className="font-semibold ml-1">
              Register
            </Link>
          </p>

          <div className="my-6 flex items-center gap-3 text-sm text-gray-400">
            <span className="flex-1 h-px bg-gray-200" />
            Or login with
            <span className="flex-1 h-px bg-gray-200" />
          </div>

          <button
            onClick={loginWithGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-2 border border-gray-300 py-3 rounded-full text-sm font-medium hover:bg-gray-50 transition"
          >
            <FcGoogle size={22} />
            {googleLoading ? "Signing in..." : "Continue with Google"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
