import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import { IoIosArrowBack } from "react-icons/io";
import Gallery from "./gallery";

/* ================= HELPERS ================= */

const isEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

const isMobile = (value: string) =>
  /^[6-9]\d{9}$/.test(value);

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

  // Step 2
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [otpIsLoading, setOtpIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resetToken, setResetToken] = useState("");

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

  /* ================= STEP 1 ================= */

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) {
      toast.error("Email is required");
      return;
    }

    if (!isEmail(input) && !isMobile(input)) {
      toast.error("Please enter a valid email ");
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

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
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
        toast.error("Invalid or expired OTP");
      }
    } catch {
      toast.error("Invalid OTP reset code. Try again.");
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

    if (!password || !confirmPassword) {
      toast.error("All password fields are required");
      return;
    }

    if (!isStrongPassword(password)) {
      toast.error(
        "Password must be 8+ chars with uppercase, lowercase, number & symbol"
      );
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
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

        <div className="auth-form-container">
          <div className="auth-form">
            <div className="space-y-5 px-4">
              {currentStep === 1 ? (
                <Link to="/login" className="flex items-center gap-1">
                  <IoIosArrowBack size={22} /> Back to login
                </Link>
              ) : (
                <button
                  onClick={() => setCurrentStep((s) => s - 1)}
                  className="flex items-center gap-1"
                >
                  <IoIosArrowBack size={22} /> Back
                </button>
              )}

              <h1 className="text-4xl font-bold">
                {currentStep === 1 && "Reset Password"}
                {currentStep === 2 && "Verify Code"}
                {currentStep === 3 && "Create New Password"}
              </h1>
            </div>

            <div className="pt-8 px-4">
              {currentStep === 1 && (
                <form onSubmit={handleRequestReset} className="space-y-5">
                  <Input
                    placeholder="Enter Your Email "
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                  />
                  <Button disabled={loading} 
                  className="w-full">
                    {loading ? "Sending..." : "Send Code"}
                  </Button>
                </form>
              )}

              {currentStep === 2 && (
                <form onSubmit={handleVerifyOtp} className="space-y-5">
                  <div className="flex gap-2">
                    {otp.map((d, i) => (
                      <input
                        key={i}
                        ref={(el) => (inputRefs.current[i] = el)}
                        value={d}
                        maxLength={1}
                        onChange={(e) =>
                          handleOtpChange(i, e.target.value)
                        }
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        onPaste={i === 0 ? handleOtpPaste : undefined}
                        className="w-12 h-12 text-center border rounded"
                      />
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resendLoading}
                    className="text-sm underline"
                  >
                    {resendLoading ? "Sending..." : "Resend Code"}
                  </button>

                  <Button
                  className="w-full"
                    disabled={otpIsLoading || otp.some((o) => !o)}
                  >
                    {otpIsLoading ? "Verifying..." : "Verify"}
                  </Button>
                </form>
              )}

              {currentStep === 3 && (
                <form onSubmit={handleResetPassword} className="space-y-5">
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="New password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3"
                    >
                      {showPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>

                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) =>
                        setConfirmPassword(e.target.value)
                      }
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-3"
                    >
                      {showConfirmPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>

                  <p className="text-xs text-gray-500">
                    Use 8+ chars with uppercase, lowercase, number & symbol
                  </p>

                  <Button disabled={resetLoading}
                         className="w-full"
                         >
                    {resetLoading ? "Resetting..." : "Reset Password"}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
