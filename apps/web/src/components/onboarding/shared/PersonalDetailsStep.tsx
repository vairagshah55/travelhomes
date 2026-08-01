import React from "react";
import {
  User,
  MapPin,
  Calendar,
  Heart,
  ShieldCheck,
  Upload,
  ImageIcon,
  Fingerprint,
} from "lucide-react";
import { cn, getImageUrl } from "@/lib/utils";
import { SectionCard, Field, IconInput, IconSelect, StepHeader } from "./primitives";

interface PersonalDetailsStepProps {
  values: {
    firstName: string;
    lastName: string;
    pincode: string;
    dateOfBirth: string;
    maritalStatus: string;
    idProof: string;
  };
  errors: Record<string, string>;
  onChange: (field: string, value: string) => void;
  locationData: any[];
  selectedState: string;
  selectedCity: string;
  countryName: string;
  onStateChange: (val: string) => void;
  onCityChange: (val: string) => void;
  idProofImage: string | null;
  onIdProofUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadError?: string;
}

const PersonalDetailsStep: React.FC<PersonalDetailsStepProps> = ({
  values,
  errors,
  onChange,
  locationData,
  selectedState,
  selectedCity,
  countryName,
  onStateChange,
  onCityChange,
  idProofImage,
  onIdProofUpload,
  uploadError,
}) => {
  const statesForCountry = locationData.find((c) => c.name === countryName)?.states ?? [];
  const citiesForState = statesForCountry.find((s: any) => s.name === selectedState)?.cities ?? [];

  const uploadHasError = !!(uploadError || errors.idPhotos);

  return (
    <div className="flex flex-col items-center gap-7 w-full max-w-2xl">
      <StepHeader
        kicker="Account"
        title="Personal Details"
        subtitle="Tell us a bit about yourself for account verification."
      />

      <div className="w-full flex flex-col gap-4">
        <SectionCard
          icon={<User size={16} className="text-th-brand" strokeWidth={2.5} />}
          title="Personal Info"
          subtitle="Your full legal name"
          bodyGap
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="First Name" required error={errors.firstName}>
              <IconInput
                icon={<User size={15} />}
                value={values.firstName}
                onChange={(v) => onChange("firstName", v)}
                placeholder="e.g. Riya"
                maxLength={30}
                error={!!errors.firstName}
              />
            </Field>

            <Field label="Last Name" required error={errors.lastName}>
              <IconInput
                icon={<User size={15} />}
                value={values.lastName}
                onChange={(v) => onChange("lastName", v)}
                placeholder="e.g. Shah"
                maxLength={30}
                error={!!errors.lastName}
              />
            </Field>
          </div>
        </SectionCard>

        <SectionCard
          icon={<Calendar size={16} className="text-th-brand" strokeWidth={2.5} />}
          title="Personal Details"
          subtitle="Date of birth and relationship status"
          bodyGap
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Date of Birth" required error={errors.dateOfBirth}>
              <IconInput
                icon={<Calendar size={15} />}
                value={values.dateOfBirth}
                onChange={(v) => onChange("dateOfBirth", v)}
                type="date"
                error={!!errors.dateOfBirth}
              />
            </Field>

            <Field label="Marital Status" optional error={errors.maritalStatus}>
              <IconSelect
                icon={<Heart size={15} />}
                value={values.maritalStatus}
                onChange={(v) => onChange("maritalStatus", v)}
                error={!!errors.maritalStatus}
              >
                <option value="">Select status</option>
                <option value="single">Single</option>
                <option value="married">Married</option>
                <option value="divorced">Divorced</option>
              </IconSelect>
            </Field>
          </div>
        </SectionCard>

        <SectionCard
          icon={<MapPin size={16} className="text-th-brand" strokeWidth={2.5} />}
          title="Personal Address"
          subtitle="Your current residential address"
          bodyGap
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Country">
              <div className="flex items-center h-[52px] rounded-[13px] bg-th-warm-surface opacity-70 border-[1.5px] border-transparent">
                <div className="flex items-center px-3 h-full border-r border-[1.5px] border-th-warm-border text-[18px] flex-shrink-0">
                  🇮🇳
                </div>
                <span className="flex-1 px-[14px] text-[14px] text-th-warm-text-muted font-[450]">
                  India
                </span>
              </div>
            </Field>

            <Field label="Pincode" required error={errors.personalPincode}>
              <IconInput
                icon={<MapPin size={15} />}
                value={values.pincode}
                onChange={(v) => onChange("pincode", v.replace(/\D/g, ""))}
                placeholder="e.g. 400001"
                maxLength={6}
                inputMode="numeric"
                error={!!errors.personalPincode}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="State" required error={errors.personalState}>
              <IconSelect
                icon={<MapPin size={15} />}
                value={selectedState}
                onChange={onStateChange}
                error={!!errors.personalState}
              >
                <option value="" disabled>
                  Select State
                </option>
                {statesForCountry.map((s: any, idx: number) => (
                  <option key={idx} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </IconSelect>
            </Field>

            <Field label="City" required error={errors.personalCity}>
              <IconSelect
                icon={<MapPin size={15} />}
                value={selectedCity}
                onChange={onCityChange}
                disabled={!selectedState}
                error={!!errors.personalCity}
              >
                <option value="" disabled>
                  Select City
                </option>
                {citiesForState.map((c: any, idx: number) => (
                  <option key={idx} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </IconSelect>
            </Field>
          </div>
        </SectionCard>

        <SectionCard
          icon={<ShieldCheck size={16} className="text-th-brand" strokeWidth={2.5} />}
          title="Identity Verification"
          subtitle="Government-issued ID for verification"
          bodyGap
        >
          <Field label="ID Proof Type" required error={errors.idProof}>
            <IconSelect
              icon={<Fingerprint size={15} />}
              value={values.idProof}
              onChange={(v) => onChange("idProof", v)}
              error={!!errors.idProof}
            >
              <option value="">Select document type</option>
              <option value="aadhar">Aadhaar Card</option>
              <option value="passport">Passport</option>
              <option value="driving_license">Driving License</option>
            </IconSelect>
          </Field>

          <Field label="Upload ID Photo" required error={uploadError || errors.idPhotos}>
            <label
              className={cn(
                "group relative flex flex-col items-center justify-center w-full h-[180px]",
                "rounded-[16px] cursor-pointer border-2 border-dashed overflow-hidden",
                "transition-all duration-200",
                uploadHasError
                  ? "border-th-error-bright-soft bg-th-error-bright-bg shadow-[0_0_0_3px_var(--th-error-bright-ring)]"
                  : idProofImage
                    ? "border-th-brand bg-th-brand-soft shadow-[0_0_0_3px_rgba(17, 116, 121,0.12)]"
                    : "border-th-warm-border bg-th-warm-surface hover:border-th-brand hover:bg-th-brand-soft",
              )}
            >
              {idProofImage ? (
                <>
                  <img
                    src={getImageUrl(idProofImage)}
                    alt="ID Proof"
                    className="w-full h-full object-cover absolute inset-0"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/45 flex flex-col items-center justify-center gap-2 transition-colors duration-200">
                    <div className="opacity-0 translate-y-[6px] group-hover:opacity-100 group-hover:translate-y-0 transition-[opacity,transform] duration-200 bg-white/[0.92] backdrop-blur-[8px] rounded-full py-2 px-[18px] flex items-center gap-[7px]">
                      <Upload size={14} className="text-th-text-primary" />
                      <span className="text-[12.5px] font-bold text-th-text-primary">
                        Change Photo
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 px-6 text-center">
                  <div
                    className={cn(
                      "w-[50px] h-[50px] rounded-[15px] bg-th-surface-0 flex items-center justify-center",
                      "border-[1.5px] shadow-[0_2px_10px_rgba(0,0,0,0.07)]",
                      "transition-transform duration-200 group-hover:scale-[1.08]",
                      uploadHasError ? "border-th-error-bright-soft" : "border-th-warm-border",
                    )}
                  >
                    <ImageIcon
                      size={22}
                      className={uploadHasError ? "text-[#f87171]" : "text-th-warm-text-muted"}
                    />
                  </div>
                  <div>
                    <p
                      className={cn(
                        "text-[13.5px] font-bold",
                        uploadHasError ? "text-th-error-bright" : "text-th-text-primary",
                      )}
                    >
                      Click to upload ID photo
                    </p>
                    <p className="text-[11px] text-th-warm-text-muted mt-[3px]">
                      JPG, PNG or PDF · Max 5 MB
                    </p>
                  </div>
                </div>
              )}
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={onIdProofUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
            </label>
          </Field>
        </SectionCard>
      </div>
    </div>
  );
};

export default PersonalDetailsStep;
