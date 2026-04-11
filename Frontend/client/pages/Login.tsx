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
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const updateField = (field: "email" | "password", value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
    if (serverError) setServerError("");
  };

  const validateField = (field: "email" | "password") => {
    const value = formData[field];
    let msg = "";
    if (field === "email") {
      if (!value.trim()) msg = "Email is required.";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) msg = "Enter a valid email address.";
    }
    if (field === "password") {
      if (!value.trim()) msg = "Password is required.";
    }
    setErrors((prev) => ({ ...prev, [field]: msg }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { email?: string; password?: string } = {};
    if (!formData.email.trim()) newErrors.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Enter a valid email address.";
    if (!formData.password.trim()) newErrors.password = "Password is required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setServerError("");
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
        setServerError("Invalid email or password.");
      }
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('verify your OTP')) {
        setServerError("Please verify your OTP first. Try registering again.");
      } else {
        setServerError("Something went wrong. Please try again.");
      }
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
          <Link to="/" className="flex items-center gap-1 mb-6 text-sm font-medium text-gray-900 dark:text-white hover:opacity-70 transition-opacity">
            <IoIosArrowBack size={18} /> Home
          </Link>

          <h1 className="text-2xl font-bold mb-1 text-gray-900 dark:text-white">Sign In</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Login to access your account
          </p>

          <form onSubmit={handleLogin} noValidate className="space-y-4">
            {/* EMAIL */}
            <div>
              <input
                type="text"
                placeholder="Enter Your Email"
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
                onBlur={() => validateField("email")}
                className={`auth-input w-full ${errors.email ? "auth-input-error" : ""}`}
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1.5">{errors.email}</p>
              )}
            </div>

            {/* PASSWORD */}
            <div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  onBlur={() => validateField("password")}
                  className={`auth-input w-full pr-12 ${errors.password ? "auth-input-error" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1.5">{errors.password}</p>
              )}
              {serverError && (
                <p className="text-red-500 text-xs mt-1.5">{serverError}</p>
              )}
            </div>

            <label className="hidden items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4"
              />
              Remember me
            </label>

            {/* FORGOT */}
            <div className="flex items-end justify-end text-sm">
              <Link to="/forgot-password" className="text-red-500 font-medium hover:underline">
                Forgot Password?
              </Link>
            </div>

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 dark:bg-white dark:text-black text-white py-3 rounded-full font-medium text-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>

          <p className="text-sm text-center mt-6 text-gray-500 dark:text-gray-400">
            Don't have an account?
            <Link to="/register" className="font-semibold ml-1 text-gray-900 dark:text-white hover:underline">
              Register
            </Link>
          </p>

          <div className="my-6 flex items-center gap-3 text-sm text-gray-400">
            <span className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
            Or login with
            <span className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          </div>

          <button
            onClick={loginWithGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-700 py-3 rounded-full text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-200"
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
