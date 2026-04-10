import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, DEMO_CREDENTIALS } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Calendar, Plus, Eye, EyeOff } from "lucide-react";
import { FcGoogle } from "react-icons/fc"; // Official Google logo, colored
import { IoIosArrowBack } from "react-icons/io";
import { Country } from "country-state-city";
import * as Flags from "country-flag-icons/react/3x2";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { cmsPublicApi } from "../lib/api";
import Gallery from "./gallery";

type CountryOption = {
  isoCode: string;
  name: string;
  countryCode?: string;
  dialCode?: string;
};

const countries: CountryOption[] = Country.getAllCountries().map((c) => ({
  isoCode: c.isoCode,
  name: c.name,
  countryCode: c.isoCode,
  dialCode: c.phonecode,
}));

interface RegisterFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  country: string;
  state: string;
  city: string;
  email: string;
  mobile: string;
  password: string;
  confirmPassword: string;
}

const Register = () => {
  const navigate = useNavigate();
  const {
    register,
    login,
    loginWithGoogle,
    verifyOTP,
    lastRegisterId,
    authenticateAfterRegister,
  } = useAuth();

  // Step control: 1-register, 2-otp, 3-details
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState<RegisterFormData>({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    country: "",
    state: "",
    city: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
  });

  // === Add these new states ===
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // === Validation function ===
  const validateForm = (step: number) => {
    const newErrors: { [key: string]: string } = {};

    // Step 1 validations (email, mobile, password)
    if (step === 1) {
      if (!formData.email.trim()) newErrors.email = "Email is required.";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
        newErrors.email = "Enter a valid email address.";

      if (!formData.mobile.trim())
        newErrors.mobile = "Mobile number is required.";
      else if (!/^\d{10}$/.test(formData.mobile))
        newErrors.mobile = "Enter a valid 10-digit phone number.";

  if (!formData.password.trim()) {
  newErrors.password = "Password is required.";
} else {
  const password = formData.password;

  const passwordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

  if (!passwordRegex.test(password)) {
    newErrors.password =
      "Password must be at least 8 characters and include uppercase, lowercase, number & special symbol.";
  }
}
      if (!formData.confirmPassword.trim())
        newErrors.confirmPassword = "Please confirm your password.";
      else if (formData.password !== formData.confirmPassword)
        newErrors.confirmPassword = "Passwords do not match.";
    }

    // Step 3 validations (details form)
    if (step === 3) {
      if (!formData.firstName.trim())
        newErrors.firstName = "First name is required.";
      if (!formData.lastName.trim())
        newErrors.lastName = "Last name is required.";
      if (!formData.dateOfBirth.trim())
        newErrors.dateOfBirth = "Date of birth is required.";
      if (!countryOption.trim()) newErrors.country = "Select a country.";
      if (!stateOption.trim()) newErrors.state = "Select a state.";
      if (!cityOption.trim()) newErrors.city = "Select a city.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // true if valid
  };

  const validateInput = (name: string, value: string) => {
    let errorMessage = "";

    switch (name) {
      case "email":
        if (!value.trim()) errorMessage = "Email is required.";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
          errorMessage = "Enter a valid email address.";
        break;
      case "mobile":
        if (!value.trim()) errorMessage = "Mobile number is required.";
        else if (!/^\d{10}$/.test(value))
          errorMessage = "Enter a valid 10-digit phone number.";
        break;
      case "password":
        if (!value.trim()) errorMessage = "Password is required.";
        else if (value.length < 8)
          errorMessage = "Password must be at least 8 characters.";
        break;
      case "confirmPassword":
        if (!value.trim()) errorMessage = "Please confirm your password.";
        else if (value !== formData.password)
          errorMessage = "Passwords do not match.";
        break;
      case "firstName":
        if (!value.trim()) errorMessage = "First name is required.";
        break;
      case "lastName":
        if (!value.trim()) errorMessage = "Last name is required.";
        break;
      case "dateOfBirth":
        if (!value.trim()) errorMessage = "Date of birth is required.";
        break;
    }

    setErrors((prev) => ({ ...prev, [name]: errorMessage }));
  };

  // Step 2 (OTP)
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpIsLoading, setOtpIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [selected, setSelected] = useState<CountryOption | null>(
    countries[100],
  );
  const [open, setOpen] = useState(false);
  const [data, setData] = useState([]);
  const [countryOption, setCoutryOption] = useState("");
  const [stateOption, setStateOption] = useState("");
  const [cityOption, setCityOptions] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);


  formData.country = countryOption;
  formData.state = stateOption;
  formData.city = cityOption;

  // Populate country list on mount
  useEffect(() => {
    fetch("/countries_states_cities.json") // remove ../../.. for public/ path
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setCoutryOption("India");
      })
      .catch((err) => console.error("Failed to load countries:", err));
  }, []);

  useEffect(() => {
    if (currentStep === 2 && inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [currentStep]);

  useEffect(() => {
  setErrors({});
  setHasSubmitted(false);
}, [currentStep]);

  // === Step navigation ===
  const handleNext = () => setCurrentStep((prev) => prev + 1);
  const handleBack = () => setCurrentStep((prev) => prev - 1);
  const handleBackRegister = () => navigate("/");

  // === Form logic for each step ===
  const updateFormData = (field: keyof RegisterFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // --- Step 1: Register ---
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

      setHasSubmitted(true); // 👈 KEY LINE

    if (!validateForm(1)) {
      toast.error("Please fix the highlighted errors.");
      return;
    }

    if (
      formData.password &&
      formData.confirmPassword &&
      formData.password !== formData.confirmPassword
    ) {
      toast.error("Passwords do not match.");
      return;
    }
    setIsLoading(true);
    try {
      const res = await register({
        userType: "user",
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth,
        country: formData.country,
        state: formData.state,
        city: formData.city,
        email: formData.email,
        mobile: formData.mobile,
        password: formData.password,
      } as any);
      if (res.ok) {
        toast.success("Registration successful! Check your email for the OTP.");
        setCurrentStep(2);
        setC(30);
      } else if (res.code === 409) {
        toast.error("Email already exists. Please log in.");
        // Stay on step 1 so user can correct email or go to login
      } else {
        toast.error(res.message || "Registration failed. Please try again.");
      }
    } catch (error: any) {
      console.error("Registration error:", error);
      toast.error(error?.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); // removes everything except digits (0-9)
    updateFormData("mobile", value);
  };

  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true);
    try {
      const success = await loginWithGoogle();
      if (success) {
        toast.success("Sign up with Google successful!");
        navigate("/");
      }
    } catch (error) {
      toast.error("Google sign up failed. Please try again.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // --- Step 2: OTP ---
  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return; // Prevent multi character paste
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    console.log("Updated OTP:", newOtp);
    // Auto-focus next
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text");
    const pasteOtp = pasteData.slice(0, 6).split("");
    const newOtp = [...otp];
    pasteOtp.forEach((char, index) => {
      if (index < 6 && /^\d$/.test(char)) {
        newOtp[index] = char;
      }
    });
    setOtp(newOtp);
    console.log("Pasted OTP:", newOtp);
    const nextEmptyIndex = newOtp.findIndex((val) => val === "");
    const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
    inputRefs.current[focusIndex]?.focus();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      toast.error("Please enter complete OTP");
      return;
    }
    setOtpIsLoading(true);
    try {
      const success = await verifyOTP(otpCode);
      if (success) {
        toast.success("OTP verified successfully!");
        // Move to final details step
        setCurrentStep(3);
      } else {
        toast.error("Invalid OTP. Please try again.");
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch {
      toast.error("Verification failed. Please try again.");
      setOtp(["", "", "", "", "",""]);
      inputRefs.current[0]?.focus();
    } finally {
      setOtpIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setResendLoading(true);
      if (!lastRegisterId) throw new Error("No register id");
      const { authApi } = await import("../lib/api");
      await authApi.resendRegisterOtp(lastRegisterId);
      toast.success("OTP resent successfully! Check your email.");
      setC(30);
    } catch {
      toast.error("Failed to resend OTP");
    } finally {
      setResendLoading(false);
    }
  };

  // --- Step 3: Details ---
  const handleDetailsSave = async () => {
    // Validate required fields for Step 3
    if (!validateForm(3)) {
      toast.error("Please fix the highlighted errors.");
      return;
    }

    try {
      // Update register collection with final details
      if (lastRegisterId) {
        const { authApi } = await import("../lib/api");
        await authApi.updateRegister(lastRegisterId, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          dateOfBirth: formData.dateOfBirth,
          country: countryOption,
          state: stateOption,
          city: cityOption,
          mobile: formData.mobile,
          userType: "user",
          email: formData.email,
          password: formData.password,
        } as any);
      }
      
      // Log the user in to get the token (Authentication)
      const success = await login(formData.email, formData.password, true, "user");
      
      if (success) {
        toast.success("Details saved! Registration complete.");
        // Navigate to user home page or redirected page
        const redirect = sessionStorage.getItem('auth_redirect');
        if (redirect) {
          sessionStorage.removeItem('auth_redirect');
          navigate(redirect);
        } else {
          navigate("/");
        }
      } else {
        toast.error("Registration successful, but login failed. Please log in manually.");
        navigate("/login");
      }
    } catch (e) {
      toast.error("Failed to save details. Please try again.");
    }
  };

  const [c, setC] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (c > 0) {
      interval = setInterval(() => {
        setC((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [c]);
  // === RENDER STEPS ===
  //Step 1
  const renderRegisterStep = () => (
    <>
      <div className="mb-3">
        <h1 className="text-2xl max-md:text-center font-bold text-black dark:text-white font-['Inter']">
          Register
        </h1>
        <p className="text-sm max-md:text-center text-[#112211] dark:text-gray-300 opacity-75 font-['Plus_Jakarta_Sans']">
          Let's get you all set up so you can access your personal account.
        </p>
      </div>
      <form onSubmit={handleRegister}>
        <div className="space-y-3 max-md:space-y-3">
          <div className="space-y-3 max-md:space-y-3">
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => updateFormData("email", e.target.value)}
              onBlur={() => validateInput("email", formData.email)}
              className={`auth-input h-10 ${hasSubmitted  && errors.email ? "border-red-500" : ""}`}
              placeholder="Email ID"
            />
            {hasSubmitted  && errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}

            <div className="flex sm:flex-row gap-3">
              <div
                onClick={() => setOpen(true)}
                className="flex max-md:w-[35%] cursor-pointer items-center gap-3 border border-[#B0B0B0] dark:border-gray-600 rounded-lg px-3 h-10 w-full sm:w-auto"
              >
                {selected && (
                  <span
                    onClick={() => {
                      setSelected(selected);
                    }}
                    className="flex items-center gap-2 text-base text-[#717171] font-['Plus_Jakarta_Sans']"
                  >
                    {React.createElement((Flags as any)[selected.isoCode], {
                      title: selected.name,
                      style: { width: "24px" },
                    })}
                    {selected.dialCode.charAt(0) !== "+"
                      ? `+${selected.dialCode}`
                      : selected.dialCode}
                  </span>
                )}

                {/* <Plus className="w-3 h-3 text-[#717171]" /> */}
                {/* <span className="text-base text-[#717171] font-['Plus_Jakarta_Sans']">
                91
              </span> */}
              </div>
              <div className="w-full flex flex-col">
                <Input
                  type="text"
                  value={formData.mobile}
                  onChange={handlePhoneChange}
                  onBlur={() => validateInput("mobile", formData.mobile)}
                  maxLength={10}
                  className="auth-input"
                  placeholder="Mobile Number"
                />
                {hasSubmitted  && errors.mobile && (
                  <p className="text-red-500 text-sm mt-1">{errors.mobile}</p>
                )}
              </div>
            </div>
            <div className="space-y-3 max-md:space-y-3">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={(e) => updateFormData("password", e.target.value)}
                  onBlur={() => validateInput("password", formData.password)}
                  className="h-10 border-[#B0B0B0] dark:border-gray-600 rounded-lg px-3 pr-12 text-base font-['Plus_Jakarta_Sans'] placeholder:text-[#717171]"
                  placeholder="Create Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/3 text-[#717171] hover:text-[#131313] dark:hover:text-white"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {hasSubmitted  && errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
              )}
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    updateFormData("confirmPassword", e.target.value)
                  }
                  onBlur={() =>
                    validateInput("confirmPassword", formData.confirmPassword)
                  }
                  className="h-10 border-[#B0B0B0] dark:border-gray-600 rounded-lg px-3 pr-12 text-base font-['Plus_Jakarta_Sans'] placeholder:text-[#717171]"
                  placeholder="Confirm Password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 text-[#717171] hover:text-[#131313] dark:hover:text-white"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>

                {hasSubmitted  && errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.confirmPassword}
                  </p>
                )}

                {/* <div className="flex items-center gap-4 mt-3">
                  <label className="flex items-center gap-2 text-sm text-[#717171] dark:text-gray-400 font-['Plus_Jakarta_Sans']">
                    <input
                      type="radio"
                      name="userType"
                      value="user"
                      checked={userType === "user"}
                      onChange={() => setUserType("user")}
                    />
                    User
                  </label>
                  <label className="flex items-center gap-2 text-sm text-[#717171] dark:text-gray-400 font-['Plus_Jakarta_Sans']">
                    <input
                      type="radio"
                      name="userType"
                      value="vendor"
                      checked={userType === "vendor"}
                      onChange={() => setUserType("vendor")}
                    />
                    Vendor
                  </label>
                </div> */}
              </div>
            </div>
          </div>
          <div className="space-y-3 max-md:space-y-2">
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#131313] hover:bg-gray-800 text-white rounded-[60px] text-base font-medium transition-all duration-200"
            >
              {isLoading ? "Creating Account..." : "Register"}
            </Button>
            <div className="text-center">
              <span className="text-sm text-[#121] dark:text-gray-300">
                Already have account?{" "}
                <Link
                  to="/login"
                  className="font-bold text-[#121] dark:text-white hover:underline"
                >
                  Login
                </Link>
              </span>
            </div>
          </div>
          {/* Divider */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-[#D6D6D6] dark:bg-gray-600"></div>
            <span className="text-sm text-[#717171] dark:text-gray-400 font-['Plus_Jakarta_Sans']">
              Or Sign Up with
            </span>
            <div className="flex-1 h-px  bg-[#D6D6D6] dark:bg-gray-600"></div>
          </div>
          {/* Google signup */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignup}
            disabled={isGoogleLoading}
            className="w-full h-10 border border-black dark:border-white rounded-[52px] bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
          >
            <div className="flex items-center gap-3">
              <FcGoogle />
              <span className="text-[#717171] font-normal dark:text-white font-['Inter'] text-base">
                {isGoogleLoading ? "Signing up..." : "Continue with Google"}
              </span>
            </div>
          </Button>
        </div>

        {/*Countries Model*/}
        <Dialog open={open} onClose={setOpen}>
          <DialogBackdrop
            transition
            className="inset-0  data-closed:opacity-1 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
          />
          {/* {isModalOpen && ( */}
          <div className="fixed inset-0 bg-opacity-60 flex items-center justify-center z-50">
            <DialogPanel className="w-[150px] shadow-md bg-[#f9fafc]  shadow-[#717171] h-[3 30px] scrollbar-hide  rounded-xl px-4 max-h-[80%] overflow-y-auto">
              <button
                onClick={() => setOpen(false)}
                className="w-[130px] rounded-xl fixed bg-[#f9fafc] p-3 text-[#717171] text-[16px]"
              >
                <span className="font-[22px] flex gap-0 items-center">
                  <IoIosArrowBack size={24} />
                  Back
                </span>
              </button>
              {/* <div className="w-full text-white mt-4 rounded-xl p-3 flex border focus:border-[#BED6FF] border-[#BED6FF] px-4">
              <img src={SearchIcon} alt="" className="w-5 h-5" />
              <input
                type="text"
                placeholder="Search for Countries"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="outline-none font-normal ml-1 placeholder:text-white px-2 text-sm w-full bg-transparent"
              />
            </div> */}

              <ul className="mt-6 py-5">
                {countries.map((c) => (
                  <li
                    key={c.isoCode}
                    onClick={() => {
                      setSelected(c);
                      setOpen(false);
                    }}
                    className="flex items-center rounded-[5px] text-[#717171] text-sm font-normal px-3 py-2 cursor-pointer"
                  >
                    {React.createElement((Flags as any)[c.isoCode], {
                      title: c.name,
                      style: { width: "25px", marginRight: "12px" },
                    })}{" "}
                    {/* {c.name} */}
                    {c.dialCode.charAt(0) !== "+"
                      ? `+${c.dialCode}`
                      : c.dialCode}
                  </li>
                ))}
              </ul>
            </DialogPanel>
          </div>
          {/* )} */}
        </Dialog>
      </form>
    </>
  );

  //Step 2
  const renderOTPStep = () => (
    <form onSubmit={handleVerifyOtp} className="space-y-6">
      <div className="space-y-3">
        <div className="space-y-3">
          <h1 className="text-2xl max-md:text-center font-bold text-black dark:text-white font-['Inter']">
            Verify code
          </h1>
          <p className="text-sm max-md:text-center text-[#112211] dark:text-gray-300 opacity-75 font-['Plus_Jakarta_Sans']">
            An authentication code has been sent to your email.
          </p>
        </div>
    
        <div className="space-y-4">
          <label className="text-base text-[#222] dark:text-gray-300 font-['Plus_Jakarta_Sans']">
            Enter Code
          </label>
          <div className="flex gap-2 sm:gap-3 justify-start">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                onPaste={idx === 0 ? handleOtpPaste : undefined}
                className="otp-input w-[48px] sm:w-[52px] focus:outline-none"
              />
            ))}
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1">
            <span className="text-sm text-[#717171] dark:text-gray-400 font-['Plus_Jakarta_Sans']">
              Didn't receive a code?
            </span>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendLoading || c > 0}
              className="text-sm text-[#121] dark:text-white font-bold hover:underline disabled:opacity-50 font-['Plus_Jakarta_Sans']"
            >
             {c > 0 && `${c}s `}<span className="text-sm text-[#121]">Resend</span> 
            </button>
            {/* <button className="text-[#818181] text-xs" disabled={resendLoading} onClick={handleResend}>
             {c}s <span className="text-sm text-[#121]">Resend</span> 
            </button> */}
          </div>
        </div>
        <Button
          type="submit"
          disabled={otpIsLoading || otp.join("").length !== 6}
          className="w-full h-10 bg-[#131313] hover:bg-gray-800 text-white rounded-[60px] text-base font-medium transition-all duration-200 disabled:opacity-50"
        >
          {otpIsLoading ? "Verifying..." : "Verify"}
        </Button>
      </div>
    </form>
  );

  //Step 3
  const renderDetailsStep = () => (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleDetailsSave();
      }}
    >
      <div className="space-y-3">
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 space-y-3">
              <Input
                value={formData.firstName}
                onChange={(e) => updateFormData("firstName", e.target.value)}
                onBlur={() => validateInput("firstName", formData.firstName)}
                className="auth-input"
                placeholder="First Name"
              />
              {errors.firstName && (
                <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
              )}
            </div>
            <div className="flex-1 space-y-3">
              <Input
                value={formData.lastName}
                onChange={(e) => updateFormData("lastName", e.target.value)}
                onBlur={() => validateInput("lastName", formData.lastName)}
                className="auth-input"
                placeholder="Last Name"
              />
              {errors.lastName && (
                <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>
         <div
  className="relative"
  onClick={() => document.getElementById("dob")?.showPicker()}
>
  <Input
    id="dob"
    type="date"
    value={formData.dateOfBirth}
    onChange={(e) => updateFormData("dateOfBirth", e.target.value)}
    onBlur={() => validateInput("dateOfBirth", formData.dateOfBirth)}
    className="h-10 w-full border-[#B0B0B0] dark:border-gray-600 rounded-lg px-3 text-base font-['Plus_Jakarta_Sans']
               placeholder:text-[#717171]
               appearance-none
               [&::-webkit-calendar-picker-indicator]:opacity-0
               [&::-webkit-calendar-picker-indicator]:absolute
               [&::-webkit-calendar-picker-indicator]:right-0
               [&::-webkit-calendar-picker-indicator]:w-full
               [&::-webkit-calendar-picker-indicator]:h-full
               [&::-webkit-calendar-picker-indicator]:cursor-pointer"
    placeholder="Date of Birth"
  />

  {/* Custom calendar icon (optional) */}
  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#222] pointer-events-none" />
</div>

          {errors.dateOfBirth && (
            <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>
          )}
          <Select
            name="country"
            value={countryOption}
            disabled={true}
            onValueChange={(value) => {
              const countryVal = value;
              setCoutryOption(countryVal);
              setFormData((prev) => ({
                ...prev,
                state: "",
                city: "", // reset city
              }));
            }}
          >
            <SelectTrigger className="h-10 border-[#B0B0B0] dark:border-gray-600 rounded-lg px-3 text-base font-['Plus_Jakarta_Sans'] text-[#717171]">
              <SelectValue placeholder="Country" />
            </SelectTrigger>
            <SelectContent>
              {<SelectItem value="texas"> Select Country</SelectItem>}
              {data.map((Country: any, idx: number) => (
                <SelectItem key={idx} value={Country.name}>
                  {Country.name}
                </SelectItem>
              ))}
            </SelectContent>

            {/* Render states from selected country */}
          </Select>
          <Select
            value={stateOption}
            onValueChange={(value) => setStateOption(value)}
          >
            <SelectTrigger className="h-10 border-[#B0B0B0] dark:border-gray-600 rounded-lg px-3 text-base font-['Plus_Jakarta_Sans'] text-[#717171]">
              <SelectValue placeholder="State" />
            </SelectTrigger>
            <SelectContent>
              {<SelectItem value="texas">Select State</SelectItem>}
              {data
                .find((c) => c.name === countryOption)
                ?.states?.map((state: any, idx: number) => (
                  <SelectItem key={idx} value={state.name}>
                    {state.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {errors.state && (
            <p className="text-red-500 text-sm mt-1">{errors.state}</p>
          )}
          <Select
            value={cityOption}
            onValueChange={(value) => setCityOptions(value)}
          >
            <SelectTrigger className="h-10 border-[#B0B0B0] dark:border-gray-600 rounded-lg px-3 text-base font-['Plus_Jakarta_Sans'] text-[#717171]">
              <SelectValue placeholder="City" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="los-angeles">Select City</SelectItem>
              {data
                .find((country) => country.name === countryOption)
                ?.states.find((state) => state.name === stateOption)
                ?.cities.map((city: any, idx: number) => (
                  <SelectItem key={idx} value={city.name}>
                    {city.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          {errors.city && (
            <p className="text-red-500 text-sm mt-1">{errors.city}</p>
          )}
        </div>
        <Button
          type="submit"
          className="w-full h-10 bg-[#131313] hover:bg-gray-800 text-white rounded-[60px] text-base font-medium transition-all duration-200"
        >
          Save
        </Button>
      </div>
    </form>
  );

  // --- Progress indicator: 3 steps now ---
  const progressSteps = [1, 2, 3];

  return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black px-6">
      <div className="w-full max-w-6xl flex gap-5">
        <Gallery page="Register"/>
    
      {/* Right side - Form + Step tracker */}
      <div className="auth-form-container lg:w-1/2 flex justify-center items-center">
        <div className="auth-form">
          {/* Back button and header */}
          <div className="space-y-5 max-md:px-0 px-4">
            {currentStep === 1 && (
              <button
                onClick={handleBackRegister}
                className="flex items-center gap-1 text-[#131313] dark:text-white hover:opacity-80 transition-opacity"
              >
                {/* <ArrowLeft size={24} /> */}
                <IoIosArrowBack size={24} />
                <span className="text-md max-md:text-sm font-medium font-['Plus_Jakarta_Sans']">
                  Home
                </span>
              </button>
            )}
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                className="flex items-center gap-1 text-[#131313] dark:text-white hover:opacity-80 transition-opacity"
              >
                <IoIosArrowBack size={24} />
                <span className="text-md max-md:text-sm font-medium font-['Plus_Jakarta_Sans']">
                  Back
                </span>
              </button>
            )}
          </div>
        
          {/* Step renderer */}
          <div className="overflow-hidden pt-5 max-md:px-0 px-4">
            {currentStep === 1 && renderRegisterStep()}
            {currentStep === 2 && renderOTPStep()}
            {currentStep === 3 && renderDetailsStep()}
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default Register;
