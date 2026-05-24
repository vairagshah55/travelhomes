import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SlArrowLeft } from "react-icons/sl";
import { toast } from "sonner";
import { userProfileApi } from "../lib/api";
import { getImageUrl } from "@/lib/utils";
import { Loader } from "@/components/ui/Loader";

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

interface EditProfileFormProps {
  formData: EditFormData;
  onChange: (field: keyof EditFormData, value: string) => void;
  onSave: () => void;
}

/* ─── Sub-components ──────────────────────────────────────────────────────── */

const VerificationStatus = ({ label, verified }: { label: string; verified: boolean }) => (
  <div className="flex items-center gap-3">
    {verified ? (
      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 19 20">
        <path
          d="M3.16699 10L7.91699 14.75L15.8337 5.25"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ) : (
      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    )}
    <span className="text-sm font-plus-jakarta">{label}</span>
  </div>
);

const MobileProfileEditHeader = ({ onBack }: { onBack: () => void }) => (
  <div className="md:hidden flex items-center gap-4 mb-6">
    <button
      onClick={onBack}
      className="p-2 hover:bg-gray-200 dark:hover:bg-[#14709F] rounded-full transition-colors"
    >
      <SlArrowLeft size={20} />
    </button>
    <h1 className="text-xl font-bold font-poppins text-gray-800 dark:text-white">Edit Profile</h1>
  </div>
);

const IdentityVerificationSection = () => (
  <div className="mb-8">
    <h3 className="text-lg font-bold font-geist mb-3">Identity Verification</h3>
    <p className="text-sm text-gray-300 font-plus-jakarta">
      Whether you're traveling for leisure or business, we're committed to making your stay smooth,
      enjoyable, and truly unforgettable.
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
  const displayName = user?.firstName || "Profile";
  return (
    <div className="bg-black rounded-md p-8 text-white max-md:hidden lg:w-80 flex-shrink-0 relative">
      <button
        onClick={onBack}
        className="absolute top-4 left-4 flex items-center gap-1 text-sm hover:opacity-80"
      >
        <SlArrowLeft size={12} />
        <span>Back</span>
      </button>

      <div className="text-center mb-9 mt-4">
        <div className="relative inline-block mb-3">
          <img
            src={photoPreview || (user?.photo ? getImageUrl(user.photo) : "/user-avatar.svg")}
            onError={(e) => {
              e.currentTarget.src = "/user-avatar.svg";
            }}
            alt={`${displayName} avatar`}
            className="w-32 h-32 object-cover bg-white rounded-full"
          />
          <label className="absolute bottom-2 right-2 w-7 h-7 bg-white/50 backdrop-blur-sm rounded-full flex items-center justify-center cursor-pointer hover:bg-white/70 transition-colors">
            <input type="file" accept="image/*" className="hidden" onChange={onPhotoFileChange} />
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 30 30"
            >
              <path
                d="M14.333 8.33325H12.9997C9.66634 8.33325 8.33301 9.66659 8.33301 12.9999V16.9999C8.33301 20.3333 9.66634 21.6666 12.9997 21.6666H16.9997C20.333 21.6666 21.6663 20.3333 21.6663 16.9999V15.6666"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M17.6933 9.0135L12.4399 14.2668C12.2399 14.4668 12.0399 14.8602 11.9999 15.1468L11.7133 17.1535C11.6066 17.8802 12.1199 18.3868 12.8466 18.2868L14.8533 18.0002C15.1333 17.9602 15.5266 17.7602 15.7333 17.5602L20.9866 12.3068C21.8933 11.4002 22.3199 10.3468 20.9866 9.0135C19.6533 7.68017 18.5999 8.10684 17.6933 9.0135Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeMiterlimit="10"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16.9395 9.76685C17.3861 11.3602 18.6328 12.6068 20.2328 13.0602"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </label>
        </div>
        <h2 className="text-xl font-bold font-geist">Upload a Photo</h2>
      </div>

      <IdentityVerificationSection />

      <div className="space-y-4">
        <h3 className="text-lg font-geist">
          {user?.firstName} {user?.lastName}
        </h3>
        <div className="space-y-2">
          <VerificationStatus
            label={user?.email ? "Email Confirmed" : "Email Not Confirmed"}
            verified={!!user?.email}
          />
          <VerificationStatus
            label={user?.mobileVerified ? "Mobile Confirmed" : "Mobile Not Confirmed"}
            verified={!!user?.mobileVerified}
          />
        </div>
      </div>
    </div>
  );
};

interface EditProfileHeaderProps {
  onSave: () => void;
  saving: boolean;
}

const EditProfileHeader = ({ onSave, saving }: EditProfileHeaderProps) => (
  <div className="hidden md:flex flex-col md:flex-row justify-between items-start md:items-center mb-9">
    <h1 className="text-2xl font-semibold text-gray-800 font-poppins mb-4 md:mb-0">Profile</h1>
    <Button
      onClick={onSave}
      disabled={saving}
      className="bg-[#0F5C8A] hover:bg-[#14709F] text-white px-6 rounded-full font-geist disabled:opacity-60"
    >
      {saving ? "Saving…" : "Save"}
    </Button>
  </div>
);

interface EditProfileFormPropsWithSaving extends EditProfileFormProps {
  saving: boolean;
}

const EditProfileForm = ({ formData, onChange, onSave, saving }: EditProfileFormPropsWithSaving) => (
  <div className="space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-base text-gray-700 dark:text-white font-plus-jakarta mb-3">
          Name
        </label>
        <Input
          value={formData.name}
          maxLength={30}
          onChange={(e) => {
            const v = e.target.value;
            onChange("name", v);
            const parts = v.trim().split(/\s+/);
            onChange("firstName", parts[0] || "");
            onChange("lastName", parts.slice(1).join(" ") || "");
          }}
          className="w-full px-3 py-6 border border-gray-400 dark:bg-black dark:text-white rounded-lg text-base text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-base text-gray-700 dark:text-white font-plus-jakarta mb-3">
          Phone Number
        </label>
        <Input
          type="tel"
          maxLength={10}
          value={formData.phoneNumber}
          onChange={(e) => onChange("phoneNumber", e.target.value.replace(/\D/g, ""))}
          className="w-full px-3 py-6 border border-gray-400 dark:bg-black dark:text-white rounded-lg text-base text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-base text-gray-700 dark:text-white font-plus-jakarta mb-3">
          Email
        </label>
        <Input
          maxLength={40}
          value={formData.email}
          onChange={(e) => onChange("email", e.target.value)}
          className="w-full px-3 py-6 border border-gray-400 dark:bg-black dark:text-white rounded-lg text-base text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-base text-gray-700 dark:text-white font-plus-jakarta mb-3">
          Date of Birth
        </label>
        <Input
          type="date"
          value={formData.dateOfBirth}
          onChange={(e) => onChange("dateOfBirth", e.target.value)}
          className="w-full px-3 py-6 border border-gray-400 dark:bg-black dark:text-white rounded-lg text-base text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-base text-gray-700 dark:text-white font-plus-jakarta mb-3">
          State
        </label>
        <Input
          value={formData.state}
          onChange={(e) => onChange("state", e.target.value)}
          className="w-full px-3 py-6 border border-gray-400 dark:bg-black dark:text-white rounded-lg text-base text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-base text-gray-700 dark:text-white font-plus-jakarta mb-3">
          City
        </label>
        <Input
          value={formData.city}
          onChange={(e) => onChange("city", e.target.value)}
          className="w-full px-3 py-6 border border-gray-400 dark:bg-black dark:text-white rounded-lg text-base text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>

    <div className="lg:hidden flex items-start w-full mb-9 mt-6">
      <Button
        onClick={onSave}
        disabled={saving}
        className="bg-[#0F5C8A] hover:bg-[#14709F] dark:bg-black dark:text-white text-white px-8 py-6 rounded-full w-full font-geist disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save"}
      </Button>
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

  const handleChange = (field: keyof EditFormData, value: string) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (saving) return;
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
      <Header
        variant="transparent"
        className="fixed w-full z-50"
        callbackFun={() => {}}
        onNavigate={() => {}}
      />

      <div className="px-4 mt-20 md:px-20 py-10 max-md:py-0">
        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-4">
              <Loader size="xl" />
              <p className="text-gray-600 dark:text-gray-400 animate-pulse font-medium">
                Fetching profile details...
              </p>
            </div>
          </div>
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
                onChange={handleChange}
                onSave={handleSave}
                saving={saving}
              />
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default UserProfileEdit;
