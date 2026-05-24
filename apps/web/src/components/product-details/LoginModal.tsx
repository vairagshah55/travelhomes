import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Eye, EyeOff, X as XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * "Log in to save" modal — shown when a guest taps the favorite/heart button
 * on a product details page. On success, fires `onSuccess` (typically to mark
 * the item favorited) and closes itself.
 */
export function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const errs: { email?: string; password?: string } = {};

    if (!form.email.trim()) {
      errs.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errs.email = "Enter a valid email address";
    }
    if (!form.password) {
      errs.password = "Password is required";
    } else if (form.password.length < 6) {
      errs.password = "Password must be at least 6 characters";
    }

    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    try {
      const success = await login(form.email.trim(), form.password, true);
      if (success) {
        toast.success("Logged in!");
        onSuccess?.();
        setForm({ email: "", password: "" });
        setFieldErrors({});
        onClose();
      } else {
        setError("Invalid email or password");
      }
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-[#2D4DA8] transition-colors"
            >
              <XIcon className="w-5 h-5 text-gray-500" />
            </button>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Log in to save
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Save your favourite stays and access them anytime.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm((p) => ({ ...p, email: val }));
                    if (!val.trim()) {
                      setFieldErrors((p) => ({ ...p, email: "Email is required" }));
                    } else if (
                      val.includes("@") &&
                      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())
                    ) {
                      setFieldErrors((p) => ({ ...p, email: "Enter a valid email address" }));
                    } else {
                      setFieldErrors((p) => ({ ...p, email: undefined }));
                    }
                  }}
                  placeholder="you@example.com"
                  className={`w-full px-4 py-2.5 rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none transition-colors placeholder:text-gray-400 ${
                    fieldErrors.email
                      ? "border-red-400 focus:border-red-500"
                      : "border-gray-200 dark:border-gray-700 focus:border-gray-400 dark:focus:border-gray-500"
                  }`}
                  autoFocus
                />
                {fieldErrors.email && (
                  <p className="text-xs text-red-500 mt-1">{fieldErrors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => {
                      setForm((p) => ({ ...p, password: e.target.value }));
                      if (fieldErrors.password) {
                        setFieldErrors((p) => ({ ...p, password: undefined }));
                      }
                    }}
                    placeholder="Enter password"
                    className={`w-full px-4 py-2.5 pr-11 rounded-xl border bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm outline-none transition-colors placeholder:text-gray-400 ${
                      fieldErrors.password
                        ? "border-red-400 focus:border-red-500"
                        : "border-gray-200 dark:border-gray-700 focus:border-gray-400 dark:focus:border-gray-500"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-xs text-red-500 mt-1">{fieldErrors.password}</p>
                )}
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30">
                  <span className="text-red-500 text-sm mt-0.5">&#9888;</span>
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <Button
                type="submit"
                disabled={
                  loading ||
                  !form.email.trim() ||
                  !form.password ||
                  !!fieldErrors.email ||
                  !!fieldErrors.password
                }
                className="w-full bg-gray-900 dark:bg-white dark:text-black text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-[#2D4DA8] dark:hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "Logging in..." : "Log in"}
              </Button>

              <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    navigate("/register");
                  }}
                  className="text-gray-900 dark:text-white font-medium underline underline-offset-2"
                >
                  Sign up
                </button>
              </p>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default LoginModal;
