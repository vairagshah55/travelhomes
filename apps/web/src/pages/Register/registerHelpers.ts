import { COUNTRIES } from "@/data/countries";

export type PhoneCountry = { isoCode: string; name: string; dialCode?: string };

export interface FormData {
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

export const PHONE_COUNTRIES: PhoneCountry[] = COUNTRIES.map((c) => ({
  isoCode: c.iso2,
  name: c.name,
  dialCode: c.phonecode,
}));

/**
 * Default dial code for the phone picker.
 *
 * This used to be `PHONE_COUNTRIES[100]`, which happened to be India only
 * because that was its position in `country-state-city`'s ordering. Looked up
 * by ISO code now so it can't silently become a different country when the
 * underlying list changes.
 */
export const DEFAULT_PHONE_COUNTRY: PhoneCountry =
  PHONE_COUNTRIES.find((c) => c.isoCode === "IN") ?? PHONE_COUNTRIES[0];

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PWD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;

export const DOB_MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DOB_CURRENT_YEAR = new Date().getFullYear();
export const DOB_YEARS = Array.from({ length: 100 }, (_, i) => DOB_CURRENT_YEAR - i);

/**
 * Per-field validator used by the registration form. Returns a non-empty
 * error message string when invalid, or `""` when the value passes.
 * `password` is needed for the `confirmPassword` case.
 */
export const validateRegisterField = (
  field: string,
  value: string,
  password = "",
): string => {
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
    case "dateOfBirth": {
      if (!value.trim()) return "Date of birth is required.";
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
      if (!m) return "Enter a valid date.";
      const [, ys, ms, ds] = m;
      const y = Number(ys);
      const mo = Number(ms);
      const d = Number(ds);
      const dob = new Date(y, mo - 1, d);
      if (
        dob.getFullYear() !== y ||
        dob.getMonth() !== mo - 1 ||
        dob.getDate() !== d
      )
        return "Enter a valid date.";
      const today = new Date();
      let age = today.getFullYear() - y;
      const md = today.getMonth() - (mo - 1);
      if (md < 0 || (md === 0 && today.getDate() < d)) age--;
      if (age < 18) return "You must be at least 18 years old.";
      return "";
    }
    default:
      return "";
  }
};
