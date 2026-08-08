import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import SiteHeader from "../components/SiteHeader";
import Footer from "../components/Footer";
import MobileUserNav from "../components/MobileUserNav";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { SlArrowLeft } from "react-icons/sl";
import { ChevronLeft, ShieldCheck, AlertCircle, Camera, CalendarDays } from "lucide-react";
import { format, parseISO, isValid, subYears } from "date-fns";
import { toast } from "sonner";
import { userProfileApi } from "../lib/api";
import { getImageUrl } from "@/lib/utils";
import { getInitials } from "@/utils/getInitials";

/* ─── Types ───────────────────────────────────────────────────────────────── */

interface EditFormData {
  name: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  dateOfBirth: string;
  city: string;
  state: string;
  photo: string;
}

type EditErrors = Partial<Record<keyof EditFormData, string>>;

/** Pure validator — runs every rule and returns all field errors at once so
 *  the user sees the full picture, not one error at a time. */
function validateEditForm(d: EditFormData): EditErrors {
  const errs: EditErrors = {};
  const name = d.name.trim();
  if (!name) errs.name = "Name is required";
  else if (name.length < 2) errs.name = "Name must be at least 2 characters";
  else if (!/^[\p{L} .'-]+$/u.test(name)) errs.name = "Use letters, spaces, and . ' - only";

  if (!d.phoneNumber.trim()) errs.phoneNumber = "Phone number is required";
  else if (!/^\d{10}$/.test(d.phoneNumber)) errs.phoneNumber = "Enter a valid 10-digit number";

  const email = d.email.trim();
  if (!email) errs.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errs.email = "Enter a valid email";

  if (d.dateOfBirth) {
    const dob = new Date(d.dateOfBirth);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isNaN(dob.getTime())) errs.dateOfBirth = "Invalid date";
    else if (dob > today) errs.dateOfBirth = "Date of birth can't be in the future";
    else {
      const ageYears = (today.getTime() - dob.getTime()) / (365.25 * 24 * 3600 * 1000);
      if (ageYears < 13) errs.dateOfBirth = "You must be at least 13 years old";
      else if (ageYears > 120) errs.dateOfBirth = "Please enter a valid year of birth";
    }
  }

  if (!d.state.trim()) errs.state = "State is required";
  if (!d.city.trim()) errs.city = "City is required";

  return errs;
}

interface EditProfileFormProps {
  formData: EditFormData;
  errors: EditErrors;
  onChange: (field: keyof EditFormData, value: string) => void;
  onSave: () => void;
}

/* ─── Sub-components ──────────────────────────────────────────────────────── */

const VerifyChip = ({
  ok,
  okLabel,
  pendingLabel,
}: {
  ok: boolean;
  okLabel: string;
  pendingLabel: string;
}) => (
  <div
    className={`inline-flex w-full items-center gap-2 px-3 py-2 rounded-lg text-[12.5px] font-medium ${
      ok
        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70"
        : "bg-amber-50 text-amber-700 ring-1 ring-amber-200/70"
    }`}
  >
    {ok ? (
      <ShieldCheck size={14} className="shrink-0" />
    ) : (
      <AlertCircle size={14} className="shrink-0" />
    )}
    <span>{ok ? okLabel : pendingLabel}</span>
  </div>
);

const MobileProfileEditHeader = ({ onBack }: { onBack: () => void }) => (
  <div className="md:hidden flex items-center gap-4 mb-6">
    <button
      onClick={onBack}
      className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full transition-colors"
    >
      <SlArrowLeft size={20} />
    </button>
    <h1 className="text-xl font-bold font-poppins text-gray-800 dark:text-white">Edit Profile</h1>
  </div>
);

const IdentityVerificationSection = () => (
  <div>
    <h3 className="text-[14px] font-semibold text-gray-900 mb-1.5">Identity Verification</h3>
    <p className="text-[12.5px] text-gray-500 leading-relaxed">
      Verify your details so vendors can trust your bookings and we can reach you when it matters.
    </p>
  </div>
);

interface EditProfileSidebarProps {
  user: any;
  photoPreview: string | null;
  onPhotoFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBack: () => void;
}

const EditProfileSidebar = ({
  user,
  photoPreview,
  onPhotoFileChange,
  onBack,
}: EditProfileSidebarProps) => {
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Profile";
  const initials = getInitials(fullName);
  const photoSrc = photoPreview || (user?.photo ? getImageUrl(user.photo) : "");
  const emailVerified = !!user?.emailVerified || !!user?.email;
  const mobileVerified = !!user?.mobileVerified;

  return (
    <aside className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 max-md:hidden lg:w-80 flex-shrink-0 relative">
      <button
        onClick={onBack}
        className="absolute top-4 left-4 inline-flex items-center gap-1 text-[12.5px] font-medium text-gray-500 hover:text-[#117479] transition-colors"
      >
        <ChevronLeft size={14} />
        <span>Back</span>
      </button>

      {/* Avatar with upload affordance */}
      <div className="text-center pt-6 pb-6">
        <div className="relative inline-block mb-4">
          <Avatar className="w-28 h-28 ring-4 ring-[#e6fafa]">
            {photoSrc && <AvatarImage src={photoSrc} alt={`${fullName} avatar`} />}
            <AvatarFallback className="bg-[#e6fafa] text-[#117479] text-[28px] font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <label
            className="absolute bottom-1 right-1 w-10 h-10 bg-[#117479] hover:bg-[#0d4548] rounded-full flex items-center justify-center cursor-pointer shadow-md ring-2 ring-white transition-colors"
            aria-label="Upload photo"
          >
            <input type="file" accept="image/*" className="hidden" onChange={onPhotoFileChange} />
            <Camera size={14} className="text-white" />
          </label>
        </div>
        <h2 className="text-[16px] font-semibold text-gray-900 leading-tight">
          {photoPreview ? "Photo selected" : "Tap the camera to change photo"}
        </h2>
        <p className="text-[12px] text-gray-500 mt-1">JPG or PNG, max 5MB</p>
      </div>

      <div className="h-px bg-gray-100 -mx-6 my-1" />

      {/* Identity verification */}
      <div className="pt-5">
        <IdentityVerificationSection />
      </div>

      <div className="mt-4 space-y-2">
        <VerifyChip ok={emailVerified} okLabel="Email Verified" pendingLabel="Email Not Verified" />
        <VerifyChip
          ok={mobileVerified}
          okLabel="Mobile Verified"
          pendingLabel="Mobile Not Verified"
        />
      </div>
    </aside>
  );
};

interface EditProfileHeaderProps {
  onSave: () => void;
  saving: boolean;
}

const EditProfileHeader = ({ onSave, saving }: EditProfileHeaderProps) => (
  <div className="hidden md:flex flex-row justify-between items-center mb-5">
    <div>
      <h1 className="text-[22px] font-bold text-gray-900 dark:text-white tracking-tight font-poppins leading-tight">
        Edit Profile
      </h1>
      <p className="text-[13px] text-gray-500 mt-1">
        Update your personal details and verification info.
      </p>
    </div>
    <Button
      onClick={onSave}
      disabled={saving}
      className="bg-[#117479] hover:bg-[#0d4548] text-white px-6 rounded-full font-geist shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-60 disabled:translate-y-0 disabled:shadow-md"
    >
      {saving ? "Saving…" : "Save"}
    </Button>
  </div>
);

interface EditProfileFormPropsWithSaving extends EditProfileFormProps {
  saving: boolean;
}

const baseInputCls =
  "w-full h-11 px-3 dark:bg-gray-900 dark:text-white rounded-lg text-[14px] text-gray-900 placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0";
const okBorderCls =
  "border-gray-200 dark:border-gray-700 focus-visible:ring-[#117479] focus-visible:border-[#117479]";
const errBorderCls =
  "border-red-300 dark:border-red-500/40 focus-visible:ring-red-500 focus-visible:border-red-500";
const labelCls = "block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1.5";

const FieldError = ({ message }: { message?: string }) =>
  message ? (
    <p className="mt-1.5 flex items-center gap-1 text-[12px] text-red-600">
      <AlertCircle size={12} className="shrink-0" />
      <span>{message}</span>
    </p>
  ) : null;

const inputClass = (hasError?: boolean) =>
  `${baseInputCls} ${hasError ? errBorderCls : okBorderCls}`;

/* ─── Date-of-Birth picker ────────────────────────────────────────────────────
 * Native <input type="date"> looks inconsistent across browsers and — more
 * importantly — is awful for DOB entry: ChevronLeft × 480 clicks to reach 1985.
 *
 * This wraps shadcn Calendar (react-day-picker v8) in a Popover with
 * captionLayout="dropdown-buttons" so the month/year are clickable selects,
 * and clamps the selectable range to [1900, today]. Storage stays ISO
 * YYYY-MM-DD so handleSave + the validator don't need to change.
 * ───────────────────────────────────────────────────────────────────────── */
interface DOBPickerProps {
  value: string;
  onChange: (v: string) => void;
  hasError?: boolean;
}

const DOBPicker = ({ value, onChange, hasError }: DOBPickerProps) => {
  const [open, setOpen] = useState(false);
  const today = useMemo(() => new Date(), []);
  const minYear = 1900;
  const maxYear = today.getFullYear();

  const selectedDate = useMemo(() => {
    if (!value) return undefined;
    const d = parseISO(value);
    return isValid(d) ? d : undefined;
  }, [value]);

  // Opening with `today` as the visible month forces the user to dropdown
  // back ~30 years on every fresh pick. Bias to age-25 for a sensible start.
  const defaultMonth = selectedDate ?? subYears(today, 25);
  const display = selectedDate ? format(selectedDate, "PPP") : "Select date of birth";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-invalid={hasError}
          aria-haspopup="dialog"
          className={`w-full h-11 px-3 rounded-lg text-[14px] flex items-center justify-between gap-2 border dark:bg-gray-900 dark:text-white text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0 ${
            hasError ? errBorderCls : okBorderCls
          }`}
        >
          <span className={selectedDate ? "text-gray-900 dark:text-white" : "text-gray-400"}>
            {display}
          </span>
          <CalendarDays size={16} className="shrink-0 text-gray-500" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" side="bottom" sideOffset={6} className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selectedDate}
          defaultMonth={defaultMonth}
          onSelect={(d) => {
            if (d) {
              // Use local Y/M/D, not toISOString — toISOString shifts by tz
              // and can off-by-one the saved date in negative-UTC regions.
              onChange(format(d, "yyyy-MM-dd"));
              setOpen(false);
            } else {
              onChange("");
            }
          }}
          // `dropdown` (not `dropdown-buttons`) — month/year selects ONLY, no
          // duplicated chevron buttons under the label. Side-prev/next arrows
          // still work for ±1 month nudges, dropdowns handle the long jumps.
          captionLayout="dropdown"
          fromYear={minYear}
          toYear={maxYear}
          disabled={{ after: today }}
          initialFocus
          className="p-2"
          classNames={{
            // Compact the whole picker — DOB doesn't need 48px tap targets.
            months: "flex flex-col space-y-2",
            month: "space-y-3",
            caption: "flex justify-center pt-1 pb-2 relative items-center",
            caption_dropdowns: "flex items-center gap-1.5",
            caption_label: "hidden",
            dropdown:
              "h-8 rounded-md border border-gray-200 bg-white px-2 text-[13px] font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#117479] cursor-pointer",
            dropdown_month: "min-w-[110px]",
            dropdown_year: "min-w-[80px]",
            nav_button:
              "h-7 w-7 bg-transparent p-0 opacity-60 hover:opacity-100 rounded-md hover:bg-gray-100",
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            head_cell:
              "text-gray-400 rounded-md w-9 font-medium text-[11px] uppercase tracking-wide",
            row: "flex w-full mt-1",
            cell: "h-9 w-9 text-center text-[13px] p-0 relative focus-within:relative focus-within:z-20",
            day: "h-9 w-9 p-0 font-normal rounded-md hover:bg-gray-100 aria-selected:opacity-100 transition-colors",
            day_selected:
              "bg-[#117479] text-white hover:bg-[#0d4548] hover:text-white focus:bg-[#0d4548] focus:text-white",
            day_today: "ring-1 ring-[#117479]/40 text-[#117479] font-semibold",
            day_outside: "text-gray-300",
            day_disabled: "text-gray-300 opacity-50 cursor-not-allowed hover:bg-transparent",
          }}
        />
      </PopoverContent>
    </Popover>
  );
};

const EditProfileForm = ({
  formData,
  errors,
  onChange,
  onSave,
  saving,
}: EditProfileFormPropsWithSaving) => (
  <>
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
        <div>
          <label className={labelCls}>Name</label>
          <Input
            value={formData.name}
            maxLength={30}
            aria-invalid={!!errors.name}
            onChange={(e) => {
              const v = e.target.value;
              onChange("name", v);
              const parts = v.trim().split(/\s+/);
              onChange("firstName", parts[0] || "");
              onChange("lastName", parts.slice(1).join(" ") || "");
            }}
            className={inputClass(!!errors.name)}
          />
          <FieldError message={errors.name} />
        </div>
        <div>
          <label className={labelCls}>Phone Number</label>
          <Input
            type="tel"
            maxLength={10}
            value={formData.phoneNumber}
            aria-invalid={!!errors.phoneNumber}
            onChange={(e) => onChange("phoneNumber", e.target.value.replace(/\D/g, ""))}
            className={inputClass(!!errors.phoneNumber)}
            placeholder="10-digit mobile"
          />
          <FieldError message={errors.phoneNumber} />
        </div>
        <div>
          <label className={labelCls}>Email</label>
          <Input
            maxLength={40}
            value={formData.email}
            aria-invalid={!!errors.email}
            onChange={(e) => onChange("email", e.target.value)}
            className={inputClass(!!errors.email)}
            placeholder="name@example.com"
          />
          <FieldError message={errors.email} />
        </div>
        <div>
          <label className={labelCls}>Date of Birth</label>
          <DOBPicker
            value={formData.dateOfBirth}
            hasError={!!errors.dateOfBirth}
            onChange={(v) => onChange("dateOfBirth", v)}
          />
          <FieldError message={errors.dateOfBirth} />
        </div>
        <div>
          <label className={labelCls}>State</label>
          <Input
            value={formData.state}
            aria-invalid={!!errors.state}
            onChange={(e) => onChange("state", e.target.value)}
            className={inputClass(!!errors.state)}
            placeholder="State"
          />
          <FieldError message={errors.state} />
        </div>
        <div>
          <label className={labelCls}>City</label>
          <Input
            value={formData.city}
            aria-invalid={!!errors.city}
            onChange={(e) => onChange("city", e.target.value)}
            className={inputClass(!!errors.city)}
            placeholder="City"
          />
          <FieldError message={errors.city} />
        </div>
      </div>
    </div>

    {/* Mobile Save — sticks to brand styling */}
    <div className="md:hidden w-full mt-5 mb-2">
      <Button
        onClick={onSave}
        disabled={saving}
        className="w-full h-12 bg-[#117479] hover:bg-[#0d4548] text-white rounded-full font-geist shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save"}
      </Button>
    </div>
  </>
);

/* ─── Skeleton — mirrors the real layout so there's no swap-flicker ─────── */

const ShimmerBox = ({ className = "" }: { className?: string }) => (
  <div className={`bg-gray-100 rounded animate-pulse ${className}`} />
);

const EditProfileSkeleton = () => (
  <div className="flex flex-col lg:flex-row gap-12 max-w-7xl mx-auto">
    {/* Sidebar skeleton */}
    <aside className="max-md:hidden lg:w-80 flex-shrink-0">
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
        <div className="flex justify-center pt-6 pb-4">
          <div className="w-28 h-28 rounded-full bg-gray-100 animate-pulse ring-4 ring-[#e6fafa]" />
        </div>
        <div className="space-y-2 text-center">
          <ShimmerBox className="h-4 w-32 mx-auto" />
          <ShimmerBox className="h-3 w-44 mx-auto" />
        </div>
        <div className="h-px bg-gray-100 -mx-6 my-5" />
        <div className="space-y-2">
          <ShimmerBox className="h-3.5 w-36" />
          <ShimmerBox className="h-3 w-full" />
          <ShimmerBox className="h-3 w-3/4" />
        </div>
        <div className="mt-5 space-y-2">
          <ShimmerBox className="h-9" />
          <ShimmerBox className="h-9" />
        </div>
      </div>
    </aside>

    {/* Form area skeleton */}
    <div className="flex-1">
      <div className="hidden md:flex justify-between items-center mb-5">
        <div className="space-y-2">
          <ShimmerBox className="h-5 w-32" />
          <ShimmerBox className="h-3 w-64" />
        </div>
        <div className="h-10 w-24 rounded-full bg-gray-100 animate-pulse" />
      </div>
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <ShimmerBox className="h-3 w-20 mb-2" />
              <div className="h-11 rounded-lg bg-gray-50 border border-gray-100 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

/* ─── Main Page Component ─────────────────────────────────────────────────── */

const EMPTY_FORM: EditFormData = {
  name: "",
  firstName: "",
  lastName: "",
  phoneNumber: "",
  email: "",
  dateOfBirth: "",
  city: "",
  state: "",
  photo: "",
};

const UserProfileEdit = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<EditFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<EditErrors>({});
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Local preview for the selected file — revoke object URL when it changes
  // or the component unmounts to avoid memory leaks.
  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview(null);
      return;
    }
    const objectUrl = URL.createObjectURL(photoFile);
    setPhotoPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [photoFile]);

  // Load saved profile by email. `loading` is tied to this fetch (was
  // previously gated by a fake 2-second setTimeout that ignored fetch
  // progress — so fast loads still made users wait, and slow loads showed
  // an empty form).
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!user?.email) {
        if (!cancelled) setLoading(false);
        return;
      }
      try {
        const res = await userProfileApi.get(user.email);
        const p: Record<string, any> = res.data || {};

        const firstName = p.firstName || user.firstName || "";
        const lastName = p.lastName || user.lastName || "";

        let dob = p.dateOfBirth || user.dateOfBirth || "";
        if (dob && dob !== "-") {
          try {
            dob = new Date(dob).toISOString().split("T")[0];
          } catch {
            // Keep original if parsing fails.
          }
        } else {
          dob = "";
        }

        if (cancelled) return;
        setFormData({
          name: [firstName, lastName].filter(Boolean).join(" ").trim(),
          firstName,
          lastName,
          phoneNumber: p.phoneNumber || user.phoneNumber || "",
          email: p.email || user.email || "",
          dateOfBirth: dob,
          state: p.state || user.state || "",
          city: p.city || user.city || "",
          photo: p.photo || user.photo || "",
        });
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  const handleChange = (field: keyof EditFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear the field's error as soon as the user starts fixing it — feels
    // responsive without waiting for the next save attempt.
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const handleSave = async () => {
    if (saving) return;

    // Validate first — show all errors at once, scroll to the first invalid
    // field, and toast a summary. Don't even attempt the network call.
    const found = validateEditForm(formData);
    if (Object.keys(found).length) {
      setErrors(found);
      // Inline red messages + auto-scroll + focus tell the user what's wrong;
      // a toast on top would be redundant. The first input flagged invalid by
      // aria-invalid is the natural focus target — keeps screen readers and
      // pointer users converging on the same element.
      requestAnimationFrame(() => {
        const firstEl = document.querySelector<HTMLElement>('[aria-invalid="true"]');
        firstEl?.scrollIntoView({ behavior: "smooth", block: "center" });
        firstEl?.focus({ preventScroll: true });
      });
      return;
    }
    setErrors({});

    setSaving(true);
    try {
      const payload = {
        email: formData.email || user?.email || "",
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        dateOfBirth: formData.dateOfBirth,
        city: formData.city,
        state: formData.state,
      };
      const res = await userProfileApi.upsert(payload);
      if (!res.success) {
        toast.error("Failed to update profile");
        return;
      }

      let photoUrl = formData.photo;
      if (photoFile && payload.email) {
        const up = await userProfileApi.uploadPhoto(payload.email, photoFile);
        photoUrl = up.data?.photo || photoUrl;
      }

      const updatedProfile = { ...payload, photo: photoUrl };
      updateUser(updatedProfile);
      window.dispatchEvent(new CustomEvent("profileUpdated", { detail: updatedProfile }));
      toast.success("Profile updated successfully!");
      navigate("/user-profile");
    } catch (e) {
      console.error("Failed to save profile", e);
      toast.error("An error occurred while saving profile");
    } finally {
      setSaving(false);
    }
  };

  // Keep Header + Footer mounted even while loading so the spinner→form swap
  // doesn't trigger a full-page layout flash (the fixed header + footer used
  // to appear/disappear with the loading switch).
  return (
    <div className="min-h-screen flex-col flex gap-0 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-200 transition-colors">
      <SiteHeader />

      <div className="px-4 mt-20 md:px-20 py-10 max-md:pt-4 max-md:pb-10">
        {loading ? (
          <EditProfileSkeleton />
        ) : (
          <div className="flex flex-col lg:flex-row gap-12 max-w-7xl mx-auto">
            <MobileProfileEditHeader onBack={() => navigate(-1)} />

            <EditProfileSidebar
              user={user}
              photoPreview={photoPreview}
              onPhotoFileChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
              onBack={() => navigate(-1)}
            />

            <div className="flex-1">
              <EditProfileHeader onSave={handleSave} saving={saving} />
              <EditProfileForm
                formData={formData}
                errors={errors}
                onChange={handleChange}
                onSave={handleSave}
                saving={saving}
              />
            </div>
          </div>
        )}
      </div>
      <Footer />
      {/* Clearance for the fixed bottom nav, painted in the footer's own
          colour so the page doesn't end on a white band. Collapses to 0 at lg,
          where the nav is hidden. Matches Index.tsx's pattern. */}
      <div className="bg-[#0a1c1c] pb-mobile-nav" aria-hidden />
      <MobileUserNav />
    </div>
  );
};

export default UserProfileEdit;
