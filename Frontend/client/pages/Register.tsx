import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { toast } from "sonner";
import { ChevronDown, Eye, EyeOff, Search } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { IoIosArrowBack } from "react-icons/io";
import { Country } from "country-state-city";
import * as Flags from "country-flag-icons/react/3x2";
import Gallery from "./gallery";

/* ─── Types ──────────────────────────────────────────────── */

type PhoneCountry = { isoCode: string; name: string; dialCode?: string };

interface FormData {
  email: string;
  mobile: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  country: string;
  state: string;
  city: string;
}

/* ─── Module-level constants ─────────────────────────────── */

const PHONE_COUNTRIES: PhoneCountry[] = Country.getAllCountries().map((c) => ({
  isoCode: c.isoCode,
  name: c.name,
  dialCode: c.phonecode,
}));

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PWD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;


/* ─── Validation (pure function) ────────────────────────── */

const validate = (field: string, value: string, password = ""): string => {
  switch (field) {
    case "email":
      if (!value.trim()) return "Email is required.";
      if (!EMAIL_RE.test(value)) return "Enter a valid email address.";
      return "";
    case "mobile":
      if (!value.trim()) return "Mobile number is required.";
      if (!/^\d{10}$/.test(value)) return "Enter a valid 10-digit phone number.";
      return "";
    case "password":
      if (!value.trim()) return "Password is required.";
      if (!PWD_RE.test(value))
        return "Min 8 chars, with uppercase, lowercase, number & special symbol.";
      return "";
    case "confirmPassword":
      if (!value.trim()) return "Please confirm your password.";
      if (value !== password) return "Passwords do not match.";
      return "";
    case "firstName":
      if (!value.trim()) return "First name is required.";
      return "";
    case "lastName":
      if (!value.trim()) return "Last name is required.";
      return "";
    case "dateOfBirth":
      if (!value.trim()) return "Date of birth is required.";
      return "";
    default:
      return "";
  }
};

/* ─── DOB constants ──────────────────────────────────────── */

const DOB_MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DOB_CURRENT_YEAR = new Date().getFullYear();
const DOB_YEARS = Array.from({ length: 100 }, (_, i) => DOB_CURRENT_YEAR - i);

/* ─── Component ──────────────────────────────────────────── */

const Register = () => {
  const navigate = useNavigate();
  const { register, login, loginWithGoogle, verifyOTP, lastRegisterId, authenticateAfterRegister } = useAuth();

  /* ── Step ─────────────────────────────────────────────── */
  const [step, setStep] = useState<number>(() => {
    const s = parseInt(sessionStorage.getItem('reg_step') || '1');
    return isNaN(s) || s < 1 || s > 3 ? 1 : s;
  });

  /* ── Step 1 – Credentials ─────────────────────────────── */
  const [form, setForm] = useState<FormData>({
    email: sessionStorage.getItem('reg_email') || "",
    mobile: "", password: "", confirmPassword: "",
    firstName: "", lastName: "", dateOfBirth: "",
    country: "India", state: "", city: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  /* ── Step 1 – Phone country picker ───────────────────── */
  const [phoneCountry, setPhoneCountry] = useState<PhoneCountry | null>(PHONE_COUNTRIES[100]);
  const [phoneDropdownOpen, setPhoneDropdownOpen] = useState(false);
  const [phoneSearch, setPhoneSearch] = useState("");
  const phoneDropdownRef = useRef<HTMLDivElement>(null);

  /* ── Step 2 – OTP ─────────────────────────────────────── */
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  /* ── Step 3 – Location ────────────────────────────────── */
  const [locationData, setLocationData] = useState<any[]>([]);
  const [country, setCountry] = useState("India");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [stateOpen, setStateOpen] = useState(false);
  const [stateSearch, setStateSearch] = useState("");
  const [cityOpen, setCityOpen] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const stateDropdownRef = useRef<HTMLDivElement>(null);
  const cityDropdownRef = useRef<HTMLDivElement>(null);

  /* ── Step 3 – DOB selects ─────────────────────────────── */
  const [dobDay, setDobDay] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobYear, setDobYear] = useState("");
  const [dobOpenPanel, setDobOpenPanel] = useState<"day" | "month" | "year" | null>(null);
  const [dobDaySearch, setDobDaySearch] = useState("");
  const [dobMonthSearch, setDobMonthSearch] = useState("");
  const [dobYearSearch, setDobYearSearch] = useState("");
  const dobWrapperRef = useRef<HTMLDivElement>(null);

  /* ── Effects ──────────────────────────────────────────── */

  useEffect(() => {
    fetch("/countries_states_cities.json")
      .then((r) => r.json())
      .then(setLocationData)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (step === 2) inputRefs.current[0]?.focus();
  }, [step]);

  useEffect(() => {
    setErrors({});
    setServerError("");
    setOtpError("");
  }, [step]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setInterval(() => setResendTimer((p) => (p > 0 ? p - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [resendTimer]);

  // Sync location selections into form
  useEffect(() => {
    setForm((prev) => ({ ...prev, country, state, city }));
  }, [country, state, city]);

  // Close phone dropdown on outside click
  useEffect(() => {
    if (!phoneDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (phoneDropdownRef.current && !phoneDropdownRef.current.contains(e.target as Node)) {
        setPhoneDropdownOpen(false);
        setPhoneSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [phoneDropdownOpen]);

  // Close state dropdown on outside click
  useEffect(() => {
    if (!stateOpen) return;
    const handler = (e: MouseEvent) => {
      if (stateDropdownRef.current && !stateDropdownRef.current.contains(e.target as Node)) {
        setStateOpen(false);
        setStateSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [stateOpen]);

  // Close city dropdown on outside click
  useEffect(() => {
    if (!cityOpen) return;
    const handler = (e: MouseEvent) => {
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(e.target as Node)) {
        setCityOpen(false);
        setCitySearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [cityOpen]);

  // Close DOB panels on outside click
  useEffect(() => {
    if (!dobOpenPanel) return;
    const handler = (e: MouseEvent) => {
      if (dobWrapperRef.current && !dobWrapperRef.current.contains(e.target as Node)) {
        setDobOpenPanel(null);
        setDobDaySearch("");
        setDobMonthSearch("");
        setDobYearSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dobOpenPanel]);

  // Persist step so refresh / navigation away doesn't reset to step 1
  useEffect(() => {
    if (step > 1) {
      sessionStorage.setItem('reg_step', String(step));
    } else {
      clearRegSession();
    }
  }, [step]);

  // Persist email so it survives refresh (needed for OTP display + final login)
  useEffect(() => {
    if (form.email) sessionStorage.setItem('reg_email', form.email);
  }, [form.email]);

  /* ── Helpers ──────────────────────────────────────────── */

  const clearRegSession = () => {
    ['reg_step', 'reg_email', 'reg_register_id'].forEach((k) =>
      sessionStorage.removeItem(k)
    );
  };

  const update = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
    if (serverError) setServerError("");
  };

  const blur = (field: string, value: string) => {
    const msg = validate(field, value, form.password);
    setErrors((prev) => ({ ...prev, [field]: msg }));
  };

  const validateStep = (s: number): boolean => {
    const fields = s === 1
      ? ["email", "mobile", "password", "confirmPassword"]
      : ["firstName", "lastName", "dateOfBirth"];

    const newErrors: Record<string, string> = {};
    fields.forEach((f) => {
      const msg = validate(f, (form as any)[f], form.password);
      if (msg) newErrors[f] = msg;
    });

    if (s === 3) {
      if (!country) newErrors.country = "Select a country.";
      if (!state) newErrors.state = "Select a state.";
      if (!city) newErrors.city = "Select a city.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const dialCode = (c: PhoneCountry) =>
    c.dialCode?.charAt(0) !== "+" ? `+${c.dialCode}` : (c.dialCode ?? "");

  const countryStates =
    (locationData.find((c: any) => c.name === country) as any)?.states ?? [];
  const stateCities =
    countryStates.find((s: any) => s.name === state)?.cities ?? [];

  /* ── Step 1 handlers ──────────────────────────────────── */

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(1)) return;

    setIsLoading(true);
    try {
      const res = await register({
        userType: "user",
        email: form.email,
        mobile: form.mobile,
        password: form.password,
      } as any);

      if (res.ok) {
        toast.success("Check your email for the OTP.");
        setStep(2);
        setResendTimer(30);
      } else if (res.code === 409) {
        setServerError("An account with this email already exists.");
      } else {
        setServerError(res.message || "Registration failed. Please try again.");
      }
    } catch {
      setServerError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true);
    try {
      const success = await loginWithGoogle();
      if (success) navigate("/");
    } catch {
      toast.error("Google sign up failed. Please try again.");
    } finally {
      setIsGoogleLoading(false);
    }
  };

  /* ── Step 2 handlers ──────────────────────────────────── */

  const handleOtpChange = (i: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[i] = value;
    setOtp(next);
    if (otpError) setOtpError("");
    if (value && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) inputRefs.current[i - 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!digits) return;
    const next = [...otp];
    digits.split("").forEach((d, i) => (next[i] = d));
    setOtp(next);
    inputRefs.current[Math.min(digits.length, 5)]?.focus();
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) {
      setOtpError("Please enter the complete 6-digit code.");
      return;
    }

    setOtpLoading(true);
    try {
      const success = await verifyOTP(code);
      if (success) {
        toast.success("OTP verified!");
        setStep(3);
      } else {
        setOtpError("Invalid or expired OTP. Please try again.");
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch {
      setOtpError("Verification failed. Please try again.");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!lastRegisterId) return;
    setResendLoading(true);
    try {
      const { authApi } = await import("../lib/api");
      await authApi.resendRegisterOtp(lastRegisterId);
      toast.success("New code sent. Check your email.");
      setResendTimer(30);
    } catch {
      toast.error("Failed to resend OTP.");
    } finally {
      setResendLoading(false);
    }
  };

  /* ── Step 3 handlers ──────────────────────────────────── */

  const daysInMonth = (() => {
    if (!dobMonth) return 31;
    const y = dobYear ? parseInt(dobYear) : 2000;
    return new Date(y, parseInt(dobMonth), 0).getDate();
  })();

  const handleDobChange = (part: "day" | "month" | "year", value: string) => {
    const d = part === "day" ? value : dobDay;
    const m = part === "month" ? value : dobMonth;
    const y = part === "year" ? value : dobYear;
    if (part === "day") setDobDay(value);
    if (part === "month") setDobMonth(value);
    if (part === "year") setDobYear(value);
    if (d && m && y) {
      update("dateOfBirth", `${y}-${m}-${d}`);
    } else {
      update("dateOfBirth", "");
    }
  };

  const handleSaveDetails = async () => {
    if (!validateStep(3)) return;

    try {
      if (lastRegisterId) {
        const { authApi } = await import("../lib/api");
        await authApi.updateRegister(lastRegisterId, {
          firstName: form.firstName,
          lastName: form.lastName,
          dateOfBirth: form.dateOfBirth,
          country,
          state,
          city,
          mobile: form.mobile,
          userType: "user",
          email: form.email,
          password: form.password,
        } as any);
      }

      let success = false;
      try {
        success = await login(form.email, form.password, true, "user");
      } catch {
        // TODO: Remove this fallback before production — allows login even when
        // server-side OTP was bypassed via static OTP during development/testing
        console.log('DEV: Login failed (likely OTP not verified on server), using authenticateAfterRegister fallback');
        authenticateAfterRegister({
          email: form.email,
          firstName: form.firstName,
          lastName: form.lastName,
          userType: 'user',
        });
        success = true;
      }

      if (success) {
        clearRegSession();
        toast.success("Registration complete!");
        const redirect = sessionStorage.getItem("auth_redirect");
        if (redirect) {
          sessionStorage.removeItem("auth_redirect");
          navigate(redirect);
        } else {
          navigate("/");
        }
      } else {
        // TODO: Remove this fallback before production — same static OTP bypass
        console.log('DEV: Login returned false, using authenticateAfterRegister fallback');
        authenticateAfterRegister({
          email: form.email,
          firstName: form.firstName,
          lastName: form.lastName,
          userType: 'user',
        });
        clearRegSession();
        toast.success("Registration complete!");
        navigate("/");
      }
    } catch {
      toast.error("Failed to save details. Please try again.");
    }
  };

  /* ── Step renders ─────────────────────────────────────── */

  const renderStep1 = () => (
    <>
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-black dark:text-white">Register</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          Let's get you all set up so you can access your personal account.
        </p>
      </div>

      <form onSubmit={handleRegister} noValidate className="space-y-3">
        {/* Email */}
        <div>
          <Input
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            onBlur={() => blur("email", form.email)}
            className={`auth-input ${errors.email ? "auth-input-error" : ""}`}
            placeholder="Email ID"
          />
          {errors.email && <p className="text-red-500 text-xs mt-1.5">{errors.email}</p>}
        </div>

        {/* Phone */}
        <div className="flex gap-3 items-start">
          {/* Country code inline dropdown */}
          <div className="relative flex-shrink-0" ref={phoneDropdownRef}>
            <button
              type="button"
              onClick={() => setPhoneDropdownOpen((o) => !o)}
              className={`flex items-center gap-1.5 h-11 px-3 rounded-xl border bg-gray-50/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 min-w-[88px] ${
                phoneDropdownOpen
                  ? "border-gray-900 dark:border-white shadow-[0_0_0_3px_rgba(0,0,0,0.06)] dark:shadow-[0_0_0_3px_rgba(255,255,255,0.08)]"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500"
              }`}
            >
              {phoneCountry && (
                <>
                  {React.createElement((Flags as any)[phoneCountry.isoCode], {
                    title: phoneCountry.name,
                    style: { width: "20px", borderRadius: "2px", flexShrink: 0 },
                  })}
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-100 tabular-nums">
                    {dialCode(phoneCountry)}
                  </span>
                </>
              )}
              <ChevronDown
                className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${
                  phoneDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Dropdown panel */}
            {phoneDropdownOpen && (
              <div className="absolute top-[calc(100%+6px)] left-0 z-50 w-72 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl overflow-hidden">
                {/* Search */}
                <div className="px-3 pt-3 pb-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search country or code..."
                      value={phoneSearch}
                      onChange={(e) => setPhoneSearch(e.target.value)}
                      autoFocus
                      className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Country list */}
                <ul className="max-h-56 overflow-y-auto px-1.5 pb-2 scrollbar-hide">
                  {PHONE_COUNTRIES.filter((c) => {
                    if (!phoneSearch) return true;
                    const q = phoneSearch.toLowerCase();
                    const code = dialCode(c);
                    return (
                      c.name.toLowerCase().includes(q) ||
                      code.includes(q) ||
                      c.isoCode.toLowerCase().includes(q)
                    );
                  }).map((c) => (
                    <li
                      key={c.isoCode}
                      onClick={() => {
                        setPhoneCountry(c);
                        setPhoneDropdownOpen(false);
                        setPhoneSearch("");
                      }}
                      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl cursor-pointer transition-colors ${
                        phoneCountry?.isoCode === c.isoCode
                          ? "bg-gray-100 dark:bg-gray-800"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      }`}
                    >
                      {React.createElement((Flags as any)[c.isoCode], {
                        title: c.name,
                        style: { width: "20px", borderRadius: "2px", flexShrink: 0 },
                      })}
                      <span className="flex-1 text-sm text-gray-900 dark:text-white truncate">
                        {c.name}
                      </span>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 tabular-nums">
                        {dialCode(c)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Phone number input */}
          <div className="flex-1">
            <Input
              type="text"
              value={form.mobile}
              onChange={(e) => update("mobile", e.target.value.replace(/\D/g, ""))}
              onBlur={() => blur("mobile", form.mobile)}
              maxLength={10}
              className={`auth-input ${errors.mobile ? "auth-input-error" : ""}`}
              placeholder="Mobile Number"
            />
            {errors.mobile && <p className="text-red-500 text-xs mt-1.5">{errors.mobile}</p>}
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              onBlur={() => blur("password", form.password)}
              className={`auth-input pr-12 ${errors.password ? "auth-input-error" : ""}`}
              placeholder="Create Password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1.5">{errors.password}</p>}
          {form.password.length > 0 && !errors.password && (
            <div className="mt-2 space-y-1">
              <div className="flex gap-1">
                {[
                  form.password.length >= 8,
                  /[A-Z]/.test(form.password),
                  /[a-z]/.test(form.password),
                  /\d/.test(form.password),
                  /[@$!%*?&#]/.test(form.password),
                ].map((met, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${
                      met ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  />
                ))}
              </div>
              {PWD_RE.test(form.password) && (
                <p className="text-xs text-green-600 dark:text-green-400">Strong password</p>
              )}
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <div className="relative">
            <Input
              type={showConfirmPassword ? "text" : "password"}
              value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
              onBlur={() => blur("confirmPassword", form.confirmPassword)}
              className={`auth-input pr-12 ${errors.confirmPassword ? "auth-input-error" : ""}`}
              placeholder="Confirm Password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-red-500 text-xs mt-1.5">{errors.confirmPassword}</p>
          )}
          {!errors.confirmPassword && form.confirmPassword && form.confirmPassword === form.password && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1.5">Passwords match</p>
          )}
        </div>

        {serverError && <p className="text-red-500 text-xs">{serverError}</p>}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#131313] hover:bg-gray-800 text-white rounded-[60px] text-base font-medium transition-all duration-200 shadow-md hover:shadow-lg"
        >
          {isLoading ? "Creating Account..." : "Register"}
        </Button>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-gray-900 dark:text-white hover:underline">
            Login
          </Link>
        </p>

        <div className="flex items-center gap-3 text-sm text-gray-400">
          <span className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          Or Sign Up with
          <span className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={handleGoogleSignup}
          disabled={isGoogleLoading}
          className="w-full h-11 border border-gray-200 dark:border-gray-700 rounded-[52px] bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
        >
          <div className="flex items-center gap-3">
            <FcGoogle size={20} />
            <span className="text-gray-600 dark:text-white text-sm">
              {isGoogleLoading ? "Signing up..." : "Continue with Google"}
            </span>
          </div>
        </Button>
      </form>

    </>
  );

  const renderStep2 = () => (
    <form onSubmit={handleVerifyOtp} className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-black dark:text-white">Verify Code</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          An authentication code has been sent to {form.email}.
        </p>
      </div>

      <div className="space-y-1.5">
        <p className="text-sm text-gray-700 dark:text-gray-300">Enter Code</p>
        <div className="flex gap-2">
          {otp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => (inputRefs.current[i] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOtpChange(i, e.target.value)}
              onKeyDown={(e) => handleOtpKeyDown(i, e)}
              onPaste={i === 0 ? handleOtpPaste : undefined}
              className={`otp-input ${otpError ? "border-red-500" : ""}`}
            />
          ))}
        </div>
        {otpError && <p className="text-red-500 text-xs mt-1.5">{otpError}</p>}
      </div>

      <div className="flex items-center gap-1">
        <span className="text-sm text-gray-500 dark:text-gray-400">Didn't receive a code?</span>
        <button
          type="button"
          onClick={handleResendOtp}
          disabled={resendLoading || resendTimer > 0}
          className="text-sm font-semibold text-gray-900 dark:text-white hover:underline disabled:opacity-50"
        >
          {resendTimer > 0 ? `${resendTimer}s ` : ""}Resend
        </button>
      </div>

      <Button
        type="submit"
        disabled={otpLoading || otp.join("").length !== 6}
        className="w-full h-11 bg-[#131313] hover:bg-gray-800 text-white rounded-[60px] text-base font-medium transition-all duration-200 disabled:opacity-50"
      >
        {otpLoading ? "Verifying..." : "Verify"}
      </Button>
    </form>
  );

  const renderStep3 = () => (
    <>
      <form
        onSubmit={(e) => { e.preventDefault(); handleSaveDetails(); }}
        className="space-y-3"
      >
        <div className="mb-1">
          <h1 className="text-2xl font-bold text-black dark:text-white">Your Details</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Almost done — just a few more details.
          </p>
        </div>

        {/* Name */}
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              value={form.firstName}
              onChange={(e) => update("firstName", e.target.value)}
              onBlur={() => blur("firstName", form.firstName)}
              className={`auth-input ${errors.firstName ? "auth-input-error" : ""}`}
              placeholder="First Name"
            />
            {errors.firstName && <p className="text-red-500 text-xs mt-1.5">{errors.firstName}</p>}
          </div>
          <div className="flex-1">
            <Input
              value={form.lastName}
              onChange={(e) => update("lastName", e.target.value)}
              onBlur={() => blur("lastName", form.lastName)}
              className={`auth-input ${errors.lastName ? "auth-input-error" : ""}`}
              placeholder="Last Name"
            />
            {errors.lastName && <p className="text-red-500 text-xs mt-1.5">{errors.lastName}</p>}
          </div>
        </div>

        {/* Date of Birth */}
        <div>
          <div className="flex gap-2" ref={dobWrapperRef}>

            {/* Day */}
            <div className="relative" style={{ width: "76px" }}>
              <button
                type="button"
                onClick={() => setDobOpenPanel((p) => (p === "day" ? null : "day"))}
                className={`h-11 w-full flex items-center justify-between px-3 border rounded-xl text-sm bg-gray-50/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 ${
                  errors.dateOfBirth && !dobDay
                    ? "border-red-500"
                    : dobOpenPanel === "day"
                    ? "border-gray-900 dark:border-white shadow-[0_0_0_3px_rgba(0,0,0,0.06)] dark:shadow-[0_0_0_3px_rgba(255,255,255,0.08)]"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500"
                }`}
              >
                <span className={dobDay ? "text-gray-900 dark:text-white font-medium" : "text-gray-400"}>
                  {dobDay || "DD"}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${dobOpenPanel === "day" ? "rotate-180" : ""}`} />
              </button>
              {dobOpenPanel === "day" && (
                <div className="absolute top-[calc(100%+6px)] left-0 z-50 w-32 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl overflow-hidden">
                  <div className="px-2 pt-2 pb-1">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Day..."
                        value={dobDaySearch}
                        onChange={(e) => setDobDaySearch(e.target.value)}
                        autoFocus
                        className="w-full h-8 pl-7 pr-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors"
                      />
                    </div>
                  </div>
                  <ul className="max-h-44 overflow-y-auto py-1 scrollbar-hide">
                    {Array.from({ length: daysInMonth }, (_, i) => i + 1)
                      .filter((d) => !dobDaySearch || String(d).includes(dobDaySearch))
                      .map((d) => {
                        const val = String(d).padStart(2, "0");
                        return (
                          <li
                            key={d}
                            onClick={() => { handleDobChange("day", val); setDobOpenPanel(null); setDobDaySearch(""); }}
                            className={`px-3 py-1.5 cursor-pointer text-sm text-center rounded-lg mx-1 transition-colors ${
                              dobDay === val
                                ? "bg-gray-900 dark:bg-white text-white dark:text-black font-medium"
                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                            }`}
                          >
                            {d}
                          </li>
                        );
                      })}
                  </ul>
                </div>
              )}
            </div>

            {/* Month */}
            <div className="relative flex-1">
              <button
                type="button"
                onClick={() => setDobOpenPanel((p) => (p === "month" ? null : "month"))}
                className={`h-11 w-full flex items-center justify-between px-3 border rounded-xl text-sm bg-gray-50/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 ${
                  dobOpenPanel === "month"
                    ? "border-gray-900 dark:border-white shadow-[0_0_0_3px_rgba(0,0,0,0.06)] dark:shadow-[0_0_0_3px_rgba(255,255,255,0.08)]"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500"
                }`}
              >
                <span className={dobMonth ? "text-gray-900 dark:text-white font-medium" : "text-gray-400"}>
                  {dobMonth ? DOB_MONTHS[parseInt(dobMonth) - 1] : "Month"}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${dobOpenPanel === "month" ? "rotate-180" : ""}`} />
              </button>
              {dobOpenPanel === "month" && (
                <div className="absolute top-[calc(100%+6px)] left-0 z-50 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl overflow-hidden">
                  <div className="px-2 pt-2 pb-1">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search..."
                        value={dobMonthSearch}
                        onChange={(e) => setDobMonthSearch(e.target.value)}
                        autoFocus
                        className="w-full h-8 pl-7 pr-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors"
                      />
                    </div>
                  </div>
                  <ul className="max-h-44 overflow-y-auto py-1 scrollbar-hide">
                    {DOB_MONTHS.map((m, i) => {
                      const val = String(i + 1).padStart(2, "0");
                      return m.toLowerCase().includes(dobMonthSearch.toLowerCase()) || !dobMonthSearch ? (
                        <li
                          key={i}
                          onClick={() => { handleDobChange("month", val); setDobOpenPanel(null); setDobMonthSearch(""); }}
                          className={`px-3 py-1.5 cursor-pointer text-sm rounded-lg mx-1 transition-colors ${
                            dobMonth === val
                              ? "bg-gray-900 dark:bg-white text-white dark:text-black font-medium"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                          }`}
                        >
                          {m}
                        </li>
                      ) : null;
                    })}
                  </ul>
                </div>
              )}
            </div>

            {/* Year */}
            <div className="relative" style={{ width: "96px" }}>
              <button
                type="button"
                onClick={() => setDobOpenPanel((p) => (p === "year" ? null : "year"))}
                className={`h-11 w-full flex items-center justify-between px-3 border rounded-xl text-sm bg-gray-50/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 ${
                  dobOpenPanel === "year"
                    ? "border-gray-900 dark:border-white shadow-[0_0_0_3px_rgba(0,0,0,0.06)] dark:shadow-[0_0_0_3px_rgba(255,255,255,0.08)]"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500"
                }`}
              >
                <span className={dobYear ? "text-gray-900 dark:text-white font-medium" : "text-gray-400"}>
                  {dobYear || "Year"}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${dobOpenPanel === "year" ? "rotate-180" : ""}`} />
              </button>
              {dobOpenPanel === "year" && (
                <div className="absolute top-[calc(100%+6px)] right-0 z-50 w-32 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl overflow-hidden">
                  <div className="px-2 pt-2 pb-1">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Year..."
                        value={dobYearSearch}
                        onChange={(e) => setDobYearSearch(e.target.value)}
                        autoFocus
                        className="w-full h-8 pl-7 pr-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors"
                      />
                    </div>
                  </div>
                  <ul className="max-h-44 overflow-y-auto py-1 scrollbar-hide">
                    {DOB_YEARS
                      .filter((y) => !dobYearSearch || String(y).includes(dobYearSearch))
                      .map((y) => (
                        <li
                          key={y}
                          onClick={() => { handleDobChange("year", String(y)); setDobOpenPanel(null); setDobYearSearch(""); }}
                          className={`px-3 py-1.5 cursor-pointer text-sm text-center rounded-lg mx-1 transition-colors ${
                            dobYear === String(y)
                              ? "bg-gray-900 dark:bg-white text-white dark:text-black font-medium"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                          }`}
                        >
                          {y}
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>

          </div>
          {errors.dateOfBirth && <p className="text-red-500 text-xs mt-1.5">{errors.dateOfBirth}</p>}
        </div>

        {/* Country (locked) */}
        <Select value={country} disabled>
          <SelectTrigger className="h-11 border border-gray-200 dark:border-gray-700 rounded-xl px-4 text-sm bg-gray-50/50 dark:bg-gray-800/50 text-gray-900 dark:text-white">
            <SelectValue placeholder="Country" />
          </SelectTrigger>
          <SelectContent>
            {locationData.map((c: any, i: number) => (
              <SelectItem key={i} value={c.name}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* State */}
        <div className="relative" ref={stateDropdownRef}>
          <button
            type="button"
            onClick={() => { setStateOpen((o) => !o); setCityOpen(false); }}
            className={`h-11 w-full flex items-center justify-between border rounded-xl px-4 text-sm font-medium bg-gray-50/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 ${
              errors.state
                ? "border-red-500"
                : stateOpen
                ? "border-gray-900 dark:border-white shadow-[0_0_0_3px_rgba(0,0,0,0.06)] dark:shadow-[0_0_0_3px_rgba(255,255,255,0.08)]"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500"
            }`}
          >
            <span className={state ? "text-gray-900 dark:text-white" : "text-gray-400 font-normal"}>
              {state || "State"}
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${stateOpen ? "rotate-180" : ""}`} />
          </button>
          {errors.state && <p className="text-red-500 text-xs mt-1.5">{errors.state}</p>}

          {stateOpen && (
            <div className="absolute top-[calc(100%+6px)] left-0 z-50 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl overflow-hidden">
              <div className="px-3 pt-3 pb-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search state..."
                    value={stateSearch}
                    onChange={(e) => setStateSearch(e.target.value)}
                    autoFocus
                    className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors"
                  />
                </div>
              </div>
              <ul className="max-h-52 overflow-y-auto px-1.5 pb-2 scrollbar-hide">
                {countryStates
                  .filter((s: any) => !stateSearch || s.name.toLowerCase().includes(stateSearch.toLowerCase()))
                  .map((s: any, i: number) => (
                    <li
                      key={i}
                      onClick={() => { setState(s.name); setCity(""); setStateOpen(false); setStateSearch(""); }}
                      className={`px-2.5 py-2 rounded-xl cursor-pointer text-sm transition-colors ${
                        state === s.name
                          ? "bg-gray-100 dark:bg-gray-800 font-medium text-gray-900 dark:text-white"
                          : "text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      }`}
                    >
                      {s.name}
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>

        {/* City */}
        <div className="relative" ref={cityDropdownRef}>
          <button
            type="button"
            onClick={() => { setCityOpen((o) => !o); setStateOpen(false); }}
            disabled={!state}
            className={`h-11 w-full flex items-center justify-between border rounded-xl px-4 text-sm font-medium bg-gray-50/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
              errors.city
                ? "border-red-500"
                : cityOpen
                ? "border-gray-900 dark:border-white shadow-[0_0_0_3px_rgba(0,0,0,0.06)] dark:shadow-[0_0_0_3px_rgba(255,255,255,0.08)]"
                : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-500"
            }`}
          >
            <span className={city ? "text-gray-900 dark:text-white" : "text-gray-400 font-normal"}>
              {city || "City"}
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${cityOpen ? "rotate-180" : ""}`} />
          </button>
          {errors.city && <p className="text-red-500 text-xs mt-1.5">{errors.city}</p>}

          {cityOpen && (
            <div className="absolute top-[calc(100%+6px)] left-0 z-50 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl overflow-hidden">
              <div className="px-3 pt-3 pb-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search city..."
                    value={citySearch}
                    onChange={(e) => setCitySearch(e.target.value)}
                    autoFocus
                    className="w-full h-9 pl-9 pr-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors"
                  />
                </div>
              </div>
              <ul className="max-h-52 overflow-y-auto px-1.5 pb-2 scrollbar-hide">
                {stateCities
                  .filter((c: any) => !citySearch || c.name.toLowerCase().includes(citySearch.toLowerCase()))
                  .map((c: any, i: number) => (
                    <li
                      key={i}
                      onClick={() => { setCity(c.name); setCityOpen(false); setCitySearch(""); }}
                      className={`px-2.5 py-2 rounded-xl cursor-pointer text-sm transition-colors ${
                        city === c.name
                          ? "bg-gray-100 dark:bg-gray-800 font-medium text-gray-900 dark:text-white"
                          : "text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      }`}
                    >
                      {c.name}
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </div>

        <Button
          type="submit"
          className="w-full h-11 bg-[#131313] hover:bg-gray-800 text-white rounded-[60px] text-base font-medium transition-all duration-200 shadow-md hover:shadow-lg"
        >
          Complete Registration
        </Button>
      </form>
    </>
  );

  /* ── Main render ──────────────────────────────────────── */

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black px-6">
      <div className="w-full max-w-6xl flex gap-5">
        <Gallery page="Register" />

        <div className="auth-form-container lg:w-1/2 flex justify-center items-center">
          <div className="auth-form">
            <div className="px-4 mb-2">
              <button
                onClick={
                  step === 1
                    ? () => navigate("/")
                    : () => {
                        const prev = step - 1;
                        if (prev === 1) clearRegSession();
                        setStep(prev);
                      }
                }
                className="flex items-center gap-1 text-gray-900 dark:text-white hover:opacity-80 transition-opacity"
              >
                <IoIosArrowBack size={22} />
                <span className="text-sm font-medium">{step === 1 ? "Home" : "Back"}</span>
              </button>
            </div>

            <div className="px-4 pt-4">
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
