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
import { getImageUrl } from "@/lib/utils";
import {
  TEAL,
  TEAL_BG,
  BLACK,
  WHITE,
  SURFACE,
  GRAY_400,
  GRAY_200,
  ERROR,
  ERROR_SOFT,
  ERROR_BG,
  ERROR_RING,
  SectionCard,
  Field,
  IconInput,
  IconSelect,
  StepHeader,
} from "./primitives";

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
  const [uploadHovered, setUploadHovered] = React.useState(false);

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
          icon={<User size={16} color={TEAL} strokeWidth={2.5} />}
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
          icon={<Calendar size={16} color={TEAL} strokeWidth={2.5} />}
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
          icon={<MapPin size={16} color={TEAL} strokeWidth={2.5} />}
          title="Personal Address"
          subtitle="Your current residential address"
          bodyGap
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Country">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  height: 52,
                  borderRadius: 13,
                  backgroundColor: SURFACE,
                  opacity: 0.7,
                  border: "1.5px solid transparent",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "0 12px",
                    height: "100%",
                    borderRight: `1.5px solid ${GRAY_200}`,
                    fontSize: 18,
                    flexShrink: 0,
                  }}
                >
                  🇮🇳
                </div>
                <span
                  style={{
                    flex: 1,
                    padding: "0 14px",
                    fontSize: 14,
                    color: GRAY_400,
                    fontWeight: 450,
                  }}
                >
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
          icon={<ShieldCheck size={16} color={TEAL} strokeWidth={2.5} />}
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
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: 180,
                borderRadius: 16,
                cursor: "pointer",
                border: `2px dashed ${uploadHasError ? ERROR_SOFT : idProofImage ? TEAL : GRAY_200}`,
                backgroundColor: uploadHasError
                  ? ERROR_BG
                  : idProofImage || uploadHovered
                    ? TEAL_BG
                    : SURFACE,
                boxShadow: uploadHasError
                  ? `0 0 0 3px ${ERROR_RING}`
                  : idProofImage
                    ? `0 0 0 3px rgba(24, 95, 165, 0.12)`
                    : "none",
                overflow: "hidden",
                position: "relative",
                transition: "all 0.2s",
              }}
              onMouseEnter={() => setUploadHovered(true)}
              onMouseLeave={() => setUploadHovered(false)}
            >
              {idProofImage ? (
                <>
                  <img
                    src={getImageUrl(idProofImage)}
                    alt="ID Proof"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      position: "absolute",
                      inset: 0,
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      backgroundColor: `rgba(0,0,0,${uploadHovered ? 0.45 : 0})`,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      transition: "background-color 0.2s",
                    }}
                  >
                    <div
                      style={{
                        opacity: uploadHovered ? 1 : 0,
                        transform: uploadHovered ? "translateY(0)" : "translateY(6px)",
                        transition: "opacity 0.2s, transform 0.2s",
                        backgroundColor: "rgba(255,255,255,0.92)",
                        backdropFilter: "blur(8px)",
                        borderRadius: 99,
                        padding: "8px 18px",
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                      }}
                    >
                      <Upload size={14} color={BLACK} />
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: BLACK }}>
                        Change Photo
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 px-6 text-center">
                  <div
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 15,
                      backgroundColor: WHITE,
                      border: `1.5px solid ${uploadHasError ? ERROR_SOFT : GRAY_200}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      boxShadow: "0 2px 10px rgba(0,0,0,0.07)",
                      transition: "transform 0.2s",
                      transform: uploadHovered ? "scale(1.08)" : "scale(1)",
                    }}
                  >
                    <ImageIcon size={22} color={uploadHasError ? "#f87171" : GRAY_400} />
                  </div>
                  <div>
                    <p
                      style={{
                        fontSize: 13.5,
                        fontWeight: 700,
                        color: uploadHasError ? ERROR : BLACK,
                      }}
                    >
                      Click to upload ID photo
                    </p>
                    <p style={{ fontSize: 11, color: GRAY_400, marginTop: 3 }}>
                      JPG, PNG or PDF · Max 5 MB
                    </p>
                  </div>
                </div>
              )}
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={onIdProofUpload}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  opacity: 0,
                  cursor: "pointer",
                  zIndex: 10,
                }}
              />
            </label>
          </Field>
        </SectionCard>
      </div>
    </div>
  );
};

export default PersonalDetailsStep;
