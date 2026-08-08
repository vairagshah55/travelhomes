import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, EyeOff, X, Loader2 } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import MobileUserNav from "@/components/MobileUserNav";
import { IoIosArrowBack } from "react-icons/io";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { vendorAuthApi } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const AccountSettings = () => {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [activeSetting, setActiveSetting] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const [verificationOtp, setVerificationOtp] = useState("");
  const [serverOtp, setServerOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"input" | "otp">("input");

  const settingsItems = [
    {
      title: "Change Phone Number",
      description: "You can update your phone number and extension.",
    },
    {
      title: "Change Email ID",
      description: "Update the email address associated with your account.",
    },
    {
      title: "Change Password",
      description: "Ensure your account is secure by updating your password.",
    },
  ];

  useEffect(() => {
    if (user) {
      setPhone(user.phoneNumber || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const closeModal = () => {
    setActiveSetting(null);
    setShowOtpInput(false);
    setIsOtpSent(false);
    setIsVerified(false);
    setOtp("");
    setVerificationEmail("");
    setVerificationOtp("");
    setCurrentPassword("");
    setShowCurrentPassword(false);
    setPassword("");
    setConfirmPassword("");
    setConfirmEmail("");
    setStep("input");
  };

  const navigate = useNavigate();

  const handleUpdate = async () => {
    if (!user) return;
    setLoading(true);

    try {
      if (activeSetting === "Change Phone Number") {
        if (step === "input") {
          if (phone.length !== 10) {
            toast({
              title: "Error",
              description: "Phone number must be exactly 10 digits",
              variant: "destructive",
            });
            setLoading(false);
            return;
          }
          if (phone === user.phoneNumber && user.mobileVerified) {
            toast({ title: "Info", description: "Please enter a new phone number" });
            setLoading(false);
            return;
          }
          const res = await vendorAuthApi.sendChangeOtp({
            currentEmail: user.email,
            userType: user.userType,
            newMobile: phone,
          });
          if (res.success) {
            setStep("otp");
            toast({ title: "Success", description: "OTP sent to " + phone });
          }
          setLoading(false);
          return; // Stop here, wait for OTP
        } else {
          // Verify OTP first
          const verifyRes = await vendorAuthApi.verifyOtp({
            email: user.email,
            otp: verificationOtp,
          });
          if (!verifyRes.success) throw new Error("Invalid OTP");

          // Then update
          const payload = { currentEmail: user.email, userType: user.userType, mobile: phone };
          const res = await vendorAuthApi.updateAccount(payload);
          if (res.success) {
            toast({ title: "Success", description: "Phone number updated successfully" });
            updateUser(res.user);
            closeModal();
          }
        }
      } else if (activeSetting === "Change Email ID") {
        if (step === "input") {
          if (email !== confirmEmail) {
            toast({ title: "Error", description: "Emails do not match", variant: "destructive" });
            setLoading(false);
            return;
          }
          if (email === user.email) {
            toast({ title: "Info", description: "Please enter a new email address" });
            setLoading(false);
            return;
          }
          const res = await vendorAuthApi.sendChangeOtp({
            currentEmail: user.email,
            userType: user.userType,
            newEmail: email,
          });
          if (res.success) {
            setStep("otp");
            toast({ title: "Success", description: "OTP sent to " + email });
          }
          setLoading(false);
          return;
        } else {
          // Verify OTP first
          const verifyRes = await vendorAuthApi.verifyOtp({
            email: user.email,
            otp: verificationOtp,
          });
          if (!verifyRes.success) throw new Error("Invalid OTP");

          const payload = { currentEmail: user.email, userType: user.userType, email: email };
          const res = await vendorAuthApi.updateAccount(payload);
          if (res.success) {
            toast({ title: "Success", description: "Email updated successfully" });
            updateUser(res.user);
            closeModal();
          }
        }
      } else if (activeSetting === "Change Password") {
        if (password !== confirmPassword) {
          toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
          setLoading(false);
          return;
        }
        const payload = {
          currentEmail: user.email,
          userType: user.userType,
          currentPassword,
          newPassword: password,
        };
        const res = await vendorAuthApi.updateAccount(payload);
        if (res.success) {
          toast({ title: "Success", description: "Password updated successfully" });
          updateUser(res.user);
          closeModal();
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update account",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSendVerificationOtp = async () => {
    if (!verificationEmail) {
      toast({
        title: "Error",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    if (user && user.email && verificationEmail.toLowerCase() !== user.email.toLowerCase()) {
      toast({
        title: "Error",
        description: "Email does not match your account email",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await vendorAuthApi.forgot({ email: verificationEmail });
      if (res.success) {
        if ((res as any).otp) {
          setServerOtp(String((res as any).otp));
        }
        setIsOtpSent(true);
        toast({
          title: "Success",
          description: "OTP sent to your email",
        });
      } else {
        throw new Error(res.message || "Failed to send OTP");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!verificationOtp) {
      toast({
        title: "Error",
        description: "Please enter OTP",
        variant: "destructive",
      });
      return;
    }

    if (serverOtp && verificationOtp !== serverOtp) {
      toast({
        title: "Error",
        description: "Invalid OTP",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await vendorAuthApi.verifyOtp({ email: verificationEmail, otp: verificationOtp });

      if (res.success) {
        setIsVerified(true);
        toast({
          title: "Success",
          description: "Identity verified successfully",
        });
      } else {
        throw new Error(res.message || "Invalid OTP");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Invalid OTP",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderModalContent = () => {
    if (step === "otp") {
      return (
        <>
          <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center text-[#0a1c1c]">
            Enter OTP
          </h2>
          <div className="mb-4">
            <p className="text-sm text-gray-500 mb-4 text-center">
              We've sent a verification code to{" "}
              <strong className="text-[#0a1c1c]">
                {activeSetting === "Change Phone Number" ? phone : email}
              </strong>
            </p>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              OTP Code<span className="text-red-500">*</span>
            </label>
            <Input
              value={verificationOtp}
              onChange={(e) => setVerificationOtp(e.target.value)}
              placeholder="Enter OTP"
              maxLength={6}
            />
            <div className="mt-2 text-right">
              <button
                onClick={() => {
                  setStep("input");
                  setVerificationOtp("");
                }}
                className="text-sm text-[#117479] hover:underline"
              >
                Change {activeSetting === "Change Phone Number" ? "Number" : "Email"}
              </button>
            </div>
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6">
            <Button
              onClick={closeModal}
              variant="outline"
              className="rounded-full border-gray-300 text-[#0a1c1c] hover:bg-gray-50 hover:text-[#0a1c1c]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={loading}
              className="rounded-full bg-[#3BD9DA] hover:bg-[#2BC7C8] text-white min-w-[130px]"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Update"}
            </Button>
          </div>
        </>
      );
    }

    switch (activeSetting) {
      case "Change Phone Number":
        return (
          <>
            <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center text-[#0a1c1c]">
              Update Phone Number
            </h2>
            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 block mb-1">
                New Phone Number<span className="text-red-500">*</span>
              </label>
              <Input
                value={phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  if (val.length <= 10) setPhone(val);
                }}
                placeholder="Enter new phone number"
              />
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6">
              <Button
                onClick={closeModal}
                variant="outline"
                className="rounded-full border-gray-300 text-[#0a1c1c] hover:bg-gray-50 hover:text-[#0a1c1c]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={loading}
                className="rounded-full bg-[#3BD9DA] hover:bg-[#2BC7C8] text-white min-w-[100px]"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Next"}
              </Button>
            </div>
          </>
        );

      case "Change Email ID":
        return (
          <>
            <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center text-[#0a1c1c]">
              Update Email Address
            </h2>
            <div className="mb-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  New Email address<span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  value={email}
                  placeholder="e.g. content@gmail.com"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Confirm new email address<span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6">
              <Button
                onClick={closeModal}
                variant="outline"
                className="rounded-full border-gray-300 text-[#0a1c1c] hover:bg-gray-50 hover:text-[#0a1c1c]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={loading}
                className="rounded-full bg-[#3BD9DA] hover:bg-[#2BC7C8] text-white min-w-[100px]"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Next"}
              </Button>
            </div>
          </>
        );

      case "Change Password":
        return (
          <>
            <h2 className="text-xl sm:text-2xl font-bold mb-6 text-center text-[#0a1c1c]">
              Update Password
            </h2>
            <div className="mb-6 space-y-4">
              <div className="relative">
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Current Password<span className="text-red-500">*</span>
                </label>
                <Input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="h-12 pr-12"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-2 top-10 transform -translate-y-1/2 text-[#717171] p-2.5"
                >
                  {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div className="relative">
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  New Password<span className="text-red-500">*</span>
                </label>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pr-12"
                  placeholder="Create new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-10 transform -translate-y-1/2 text-[#717171] p-2.5"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              <div className="relative">
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Confirm New Password<span className="text-red-500">*</span>
                </label>
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-12 pr-12"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 top-10 transform -translate-y-1/2 text-[#717171] p-2.5"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6">
              <Button
                onClick={closeModal}
                variant="outline"
                className="rounded-full border-gray-300 text-[#0a1c1c] hover:bg-gray-50 hover:text-[#0a1c1c]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdate}
                disabled={loading}
                className="rounded-full bg-[#3BD9DA] hover:bg-[#2BC7C8] text-white min-w-[100px]"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update"}
              </Button>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen gap-0 bg-gray-100 text-gray-900 transition-colors">
      <SiteHeader />

      <main className="flex-1 px-4 mt-20 py-6 sm:py-10">
        <div className="max-w-3xl mx-auto">
          <div
            onClick={() => navigate(-1)}
            className="mb-6 cursor-pointer inline-flex items-center gap-2 text-[#0a1c1c] hover:text-[#117479] transition-colors w-fit"
          >
            <IoIosArrowBack size={20} />
            <h1 className="text-2xl sm:text-3xl font-semibold font-poppins">Account Settings</h1>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden shadow-sm">
            {settingsItems.map((item) => (
              <div
                key={item.title}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-5 sm:p-6"
              >
                <div className="flex-1">
                  <h3 className="text-base sm:text-lg font-semibold text-[#0a1c1c] font-plus-jakarta mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500 font-plus-jakarta">{item.description}</p>
                </div>
                <Button
                  onClick={() => setActiveSetting(item.title)}
                  variant="outline"
                  className="w-full sm:w-auto sm:ml-10 px-5 py-2 rounded-full border-gray-200 text-[#0a1c1c] hover:border-[#3BD9DA] hover:bg-[#e6fafa] hover:text-[#117479] font-geist text-sm"
                >
                  Update Now
                </Button>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />

      {/* Clearance for the fixed bottom nav, painted in the footer's own
          colour so the page doesn't end on a white band. Collapses to 0 at lg,
          where the nav is hidden. Matches Wishlist.tsx's pattern. */}
      <div className="bg-[#0a1c1c] pb-mobile-nav" aria-hidden />

      <MobileUserNav />

      {activeSetting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-6 text-gray-900">
            <button
              onClick={closeModal}
              aria-label="Close"
              className="absolute top-4 right-4 text-gray-400 hover:text-[#0a1c1c] transition-colors"
            >
              <X size={20} />
            </button>

            {renderModalContent()}
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountSettings;
