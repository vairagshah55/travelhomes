import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { IoIosArrowBack } from "react-icons/io";
import Gallery from "./gallery";

/* ================= HELPERS ================= */

const isEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const isStrongPassword = (pwd: string) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(pwd);

/* ================= COMPONENT ================= */

const ForgotPassword = () => {
  const navigate = useNavigate();

  // 1: email, 2: otp, 3: reset password
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Step 2
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [otpIsLoading, setOtpIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [otpError, setOtpError] = useState("");

  // Step 3
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  /* ================= EFFECTS ================= */

  useEffect(() => {
    if (currentStep === 2) {
      inputRefs.current[0]?.focus();
    }
  }, [currentStep]);

  useEffect(() => {
    setErrors({});
  }, [currentStep]);

  const clearError = (field: string) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  /* ================= STEP 1 ================= */

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { [key: string]: string } = {};
    if (!input.trim()) newErrors.email = "Email is required.";
    else if (!isEmail(input)) newErrors.email = "Enter a valid email address.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const { vendorAuthApi } = await import("../lib/api");
      const resp = await vendorAuthApi.forgot({ email: input });

      if (resp?.success) {
        toast.success("Reset code sent successfully");
        setCurrentStep(2);
      } else {
        toast.error(resp?.message || "Unable to send reset code");
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  /* ================= STEP 2 ================= */

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (otpError) setOtpError("");

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const data = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!data) return;

    const newOtp = [...otp];
    data.split("").forEach((d, i) => (newOtp[i] = d));
    setOtp(newOtp);
    inputRefs.current[Math.min(data.length, 5)]?.focus();
  };

  const STATIC_OTP = "123456";

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setOtpError("Please enter the complete 6-digit code.");
      return;
    }

    // TODO: remove static OTP before production
    if (otpCode === STATIC_OTP) {
      setResetToken(otpCode);
      toast.success("OTP verified successfully");
      setCurrentStep(3);
      return;
    }

    setOtpIsLoading(true);
    try {
      const { vendorAuthApi } = await import("../lib/api");
      const resp = await vendorAuthApi.verifyOtp({
        email: input,
        otp: otpCode,
      });

      if (resp?.success) {
        setResetToken(otpCode);
        toast.success("OTP verified successfully");
        setCurrentStep(3);
      } else {
        setOtpError("Invalid or expired OTP. Please try again.");
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setOtpError("Invalid OTP. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setOtpIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    try {
      const { vendorAuthApi } = await import("../lib/api");
      await vendorAuthApi.forgot({ email: input });

      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();

      toast.success("New code sent");
    } catch {
      toast.error("Failed to resend code");
    } finally {
      setResendLoading(false);
    }
  };

  /* ================= STEP 3 ================= */

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: { [key: string]: string } = {};
    if (!password.trim()) newErrors.password = "Password is required.";
    else if (!isStrongPassword(password)) newErrors.password = "Min 8 chars, with uppercase, lowercase, number & special symbol.";
    if (!confirmPassword.trim()) newErrors.confirmPassword = "Please confirm your password.";
    else if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setResetLoading(true);
    try {
      const { vendorAuthApi } = await import("../lib/api");
      const resp = await vendorAuthApi.reset({
        email: input,
        token: resetToken,
        newPassword: password,
      });

      if (resp?.success) {
        toast.success("Password reset successfully");
        navigate("/login");
      } else {
        toast.error("Failed to reset password");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setResetLoading(false);
    }
  };

  /* ================= UI ================= */

  const progressSteps = [1, 2, 3];

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black px-6">
      <div className="w-full max-w-6xl flex gap-5">
        <Gallery
          page={
            currentStep === 1
              ? "EnterEmail"
              : currentStep === 2
              ? "Verification"
              : "ChangePassword"
          }
        />

        <div className="w-full lg:w-1/2 max-w-md mx-auto mt-8">
          {/* Back button */}
          {currentStep === 1 ? (
            <Link to="/login" className="flex items-center gap-1 mb-6 text-sm font-medium text-gray-900 dark:text-white hover:opacity-70 transition-opacity">
              <IoIosArrowBack size={18} /> Back to login
            </Link>
          ) : (
            <button
              onClick={() => setCurrentStep((s) => s - 1)}
              className="flex items-center gap-1 mb-6 text-sm font-medium text-gray-900 dark:text-white hover:opacity-70 transition-opacity"
            >
              <IoIosArrowBack size={18} /> Back
            </button>
          )}

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-6">
            {progressSteps.map((s) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  s <= currentStep ? "bg-gray-900 dark:bg-white" : "bg-gray-200 dark:bg-gray-700"
                }`}
              />
            ))}
          </div>

          <h1 className="text-2xl font-bold mb-1 text-gray-900 dark:text-white">
            {currentStep === 1 && "Reset Password"}
            {currentStep === 2 && "Verify Code"}
            {currentStep === 3 && "Create New Password"}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {currentStep === 1 && "Enter your email to receive a reset code."}
            {currentStep === 2 && `A 6-digit code was sent to ${input}`}
            {currentStep === 3 && "Choose a strong new password for your account."}
          </p>

          {/* STEP 1: Email */}
          {currentStep === 1 && (
            <form onSubmit={handleRequestReset} noValidate className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="Enter Your Email"
                  value={input}
                  onChange={(e) => { setInput(e.target.value); clearError("email"); }}
                  onBlur={() => {
                    if (!input.trim()) setErrors((p) => ({ ...p, email: "Email is required." }));
                    else if (!isEmail(input)) setErrors((p) => ({ ...p, email: "Enter a valid email address." }));
                  }}
                  className={`auth-input w-full ${errors.email ? "auth-input-error" : ""}`}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1.5">{errors.email}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 dark:bg-white dark:text-black text-white py-3 rounded-full font-medium text-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                {loading ? "Sending..." : "Send Reset Code"}
              </button>
            </form>
          )}

          {/* STEP 2: OTP */}
          {currentStep === 2 && (
            <form onSubmit={handleVerifyOtp} noValidate className="space-y-4">
              <div className="flex gap-2 justify-start">
                {otp.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => (inputRefs.current[i] = el)}
                    value={d}
                    maxLength={1}
                    inputMode="numeric"
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    onPaste={i === 0 ? handleOtpPaste : undefined}
                    className={`otp-input ${otpError ? "border-red-500" : ""}`}
                  />
                ))}
              </div>
              {otpError && (
                <p className="text-red-500 text-xs mt-1.5">{otpError}</p>
              )}

              <div className="flex items-center gap-1">
                <span className="text-sm text-gray-500 dark:text-gray-400">Didn't receive it?</span>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendLoading}
                  className="text-sm font-semibold text-gray-900 dark:text-white hover:underline disabled:opacity-50"
                >
                  {resendLoading ? "Sending..." : "Resend"}
                </button>
              </div>

              <button
                type="submit"
                disabled={otpIsLoading || otp.some((o) => !o)}
                className="w-full bg-gray-900 dark:bg-white dark:text-black text-white py-3 rounded-full font-medium text-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50"
              >
                {otpIsLoading ? "Verifying..." : "Verify Code"}
              </button>
            </form>
          )}

          {/* STEP 3: New Password */}
          {currentStep === 3 && (
            <form onSubmit={handleResetPassword} noValidate className="space-y-4">
              <div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="New password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); clearError("password"); }}
                    onBlur={() => {
                      if (!password.trim()) setErrors((p) => ({ ...p, password: "Password is required." }));
                      else if (!isStrongPassword(password)) setErrors((p) => ({ ...p, password: "Min 8 chars, with uppercase, lowercase, number & special symbol." }));
                    }}
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
                {/* Password strength indicator */}
                {password.length > 0 && !errors.password && (
                  <div className="mt-2 space-y-1.5">
                    <div className="flex gap-1">
                      {[
                        password.length >= 8,
                        /[A-Z]/.test(password),
                        /[a-z]/.test(password),
                        /\d/.test(password),
                        /[@$!%*?&]/.test(password),
                      ].map((met, i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${met ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"}`} />
                      ))}
                    </div>
                    {isStrongPassword(password) && (
                      <p className="text-xs text-green-600 dark:text-green-400">Strong password</p>
                    )}
                  </div>
                )}
              </div>

              <div>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); clearError("confirmPassword"); }}
                    onBlur={() => {
                      if (!confirmPassword.trim()) setErrors((p) => ({ ...p, confirmPassword: "Please confirm your password." }));
                      else if (password !== confirmPassword) setErrors((p) => ({ ...p, confirmPassword: "Passwords do not match." }));
                    }}
                    className={`auth-input w-full pr-12 ${errors.confirmPassword ? "auth-input-error" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1.5">{errors.confirmPassword}</p>
                )}
                {!errors.confirmPassword && confirmPassword && confirmPassword === password && (
                  <p className="text-green-600 dark:text-green-400 text-xs mt-1.5">Passwords match</p>
                )}
              </div>

              <button
                type="submit"
                disabled={resetLoading}
                className="w-full bg-gray-900 dark:bg-white dark:text-black text-white py-3 rounded-full font-medium text-sm hover:bg-gray-800 dark:hover:bg-gray-100 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                {resetLoading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
