import React from "react";
import { FileCheck2, IdCard, Phone, Upload, UserRound, X } from "lucide-react";
import { Field, SectionCard, StepHeader, StyledInput } from "../shared/primitives";
import { cn, getImageUrl } from "@/lib/utils";

export type VehicleDocField = "rcPhotos" | "driverLicencePhotos";

interface VehicleComplianceStepProps {
  rcPhotos: (string | File)[];
  insuranceExpiry: string;
  pucExpiry: string;
  /** Only asked for when the vendor enabled the chauffeur-driven rate card. */
  withDriverEnabled: boolean;
  driverName: string;
  driverPhone: string;
  driverLicenceNumber: string;
  driverLicencePhotos: (string | File)[];
  errors: Record<string, string>;
  onFieldChange: (field: string, value: string) => void;
  onDocUpload: (field: VehicleDocField, files: FileList | null) => void;
  onRemoveDoc: (field: VehicleDocField, index: number) => void;
  clearError: (field: string) => void;
  embedded?: boolean;
}

/** Local object URL for a File, revoked on unmount. */
function useDocSrc(item: string | File): string {
  const [src, setSrc] = React.useState("");
  React.useEffect(() => {
    if (typeof item === "string") {
      setSrc(getImageUrl(item));
      return;
    }
    const url = URL.createObjectURL(item);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [item]);
  return src;
}

const DocThumb = ({
  item,
  onRemove,
}: {
  item: string | File;
  onRemove: () => void;
}) => {
  const src = useDocSrc(item);
  const isPdf =
    typeof item === "string" ? item.toLowerCase().endsWith(".pdf") : item.type === "application/pdf";

  return (
    <div className="relative group w-full aspect-[4/3] rounded-[14px] overflow-hidden border-[1.5px] border-th-warm-border bg-th-warm-surface">
      {isPdf ? (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-th-warm-text-dark">
          <FileCheck2 size={22} />
          <span className="text-[11px] font-semibold">PDF document</span>
        </div>
      ) : (
        <img src={src} alt="" className="w-full h-full object-cover" />
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove document"
        className="absolute top-1.5 right-1.5 w-[26px] h-[26px] rounded-full bg-black/55 backdrop-blur-[6px] flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer"
      >
        <X size={13} />
      </button>
    </div>
  );
};

const DocUploader = ({
  label,
  hint,
  field,
  items,
  required,
  error,
  onUpload,
  onRemove,
}: {
  label: string;
  hint: string;
  field: VehicleDocField;
  items: (string | File)[];
  required?: boolean;
  error?: string;
  onUpload: (field: VehicleDocField, files: FileList | null) => void;
  onRemove: (field: VehicleDocField, index: number) => void;
}) => {
  const inputId = `vehicle-doc-${field}`;
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[12.5px] font-bold text-th-text-primary tracking-[-0.01em]">
        {label}
        {required && <span className="text-th-error-bright ml-0.5">*</span>}
      </p>

      {items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {items.map((item, index) => (
            <DocThumb key={index} item={item} onRemove={() => onRemove(field, index)} />
          ))}
        </div>
      )}

      <label
        htmlFor={inputId}
        className={cn(
          "flex items-center justify-center gap-2 py-4 rounded-[14px] border-2 border-dashed cursor-pointer transition-all duration-150",
          error
            ? "border-th-error-bright-soft bg-th-error-bright-bg"
            : "border-th-warm-border bg-th-warm-surface hover:border-th-brand hover:bg-th-brand-soft",
        )}
      >
        <Upload size={14} className="text-th-warm-text-dark" />
        <span className="text-[12.5px] font-semibold text-th-text-primary">
          {items.length > 0 ? "Add another" : "Upload"}
        </span>
      </label>
      <input
        id={inputId}
        type="file"
        // Explicit list, not image/*, so the picker cannot offer a format
        // handleDocUpload will reject (HEIC off an iPhone was the common one).
        accept="image/jpeg,image/png,image/webp,application/pdf"
        multiple
        className="hidden"
        onChange={(e) => {
          const input = e.currentTarget;
          onUpload(field, input.files);
          // Reset so re-picking the same file fires change again. Safe only
          // because onUpload copies the FileList synchronously — clearing the
          // input empties that live list (see handleDocUpload).
          input.value = "";
        }}
      />
      <p className="text-[11.5px] text-th-warm-text-muted leading-[1.5]">{hint}</p>
      {error && <p className="text-[12px] font-medium text-th-error-bright">{error}</p>}
    </div>
  );
};

/**
 * Compliance documents, and the driver when there is one.
 *
 * This is its own step rather than fields bolted onto the shared personal-details
 * and terms steps. Those two are used verbatim by all four service flows, and a
 * vehicle is the only one that carries documents with expiry dates — putting the
 * RC and insurance behind a `serviceType === "vehicle-rental"` branch inside a
 * shared component would make every other flow pay to read it.
 *
 * The driver block is conditional on the chauffeur rate card being enabled: a
 * pure self-drive listing has no driver to describe, and asking anyway is how
 * you teach vendors to type placeholder data into required fields.
 */
const VehicleComplianceStep: React.FC<VehicleComplianceStepProps> = ({
  rcPhotos,
  insuranceExpiry,
  pucExpiry,
  withDriverEnabled,
  driverName,
  driverPhone,
  driverLicenceNumber,
  driverLicencePhotos,
  errors,
  onFieldChange,
  onDocUpload,
  onRemoveDoc,
  clearError,
  embedded,
}) => {
  const set = (field: string) => (v: string) => {
    onFieldChange(field, v);
    clearError(field);
  };

  // Expiry dates in the past are the whole point of collecting them, so the
  // pickers stop the vendor entering one rather than leaving it to the admin
  // reviewer to catch.
  const today = new Date().toISOString().slice(0, 10);

  const body = (
    <div className="w-full flex flex-col gap-4">
      <SectionCard
        icon={<FileCheck2 size={16} className="text-th-brand" strokeWidth={2.5} />}
        title="Vehicle documents"
        subtitle="Required before your listing can go live."
        required
      >
        <div className="flex flex-col gap-4">
          <DocUploader
            label="Registration certificate (RC)"
            hint="Both sides, or the PDF from Parivahan. JPG, PNG, WEBP or PDF, max 5 MB."
            field="rcPhotos"
            items={rcPhotos}
            required
            error={errors.rcPhotos}
            onUpload={onDocUpload}
            onRemove={onRemoveDoc}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Insurance valid until" required error={errors.insuranceExpiry}>
              <input
                type="date"
                value={insuranceExpiry}
                min={today}
                onChange={(e) => set("insuranceExpiry")(e.target.value)}
                className={cn(
                  "w-full h-[50px] px-4 rounded-[12px] border-[1.5px] bg-th-surface-0",
                  "text-[14px] font-medium text-th-text-primary outline-none",
                  "transition-[border-color,box-shadow] duration-150",
                  errors.insuranceExpiry
                    ? "border-th-error-bright-soft focus:shadow-[0_0_0_3px_var(--th-error-bright-ring)]"
                    : "border-th-warm-border focus:border-th-brand focus:shadow-[0_0_0_3px_var(--th-ring)]",
                )}
              />
            </Field>

            <Field label="PUC valid until" optional error={errors.pucExpiry}>
              <input
                type="date"
                value={pucExpiry}
                min={today}
                onChange={(e) => set("pucExpiry")(e.target.value)}
                className={cn(
                  "w-full h-[50px] px-4 rounded-[12px] border-[1.5px] bg-th-surface-0",
                  "text-[14px] font-medium text-th-text-primary outline-none",
                  "transition-[border-color,box-shadow] duration-150",
                  "border-th-warm-border focus:border-th-brand focus:shadow-[0_0_0_3px_var(--th-ring)]",
                )}
              />
            </Field>
          </div>
        </div>
      </SectionCard>

      {withDriverEnabled && (
        <SectionCard
          icon={<UserRound size={16} className="text-th-brand" strokeWidth={2.5} />}
          title="Driver details"
          subtitle="Shared with the guest once a chauffeur-driven booking is confirmed."
          required
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Driver name" required error={errors.driverName}>
              <StyledInput
                value={driverName}
                onChange={set("driverName")}
                placeholder="Full name as on the licence"
                maxLength={80}
                error={!!errors.driverName}
              />
            </Field>

            <Field label="Driver phone" required error={errors.driverPhone}>
              <StyledInput
                value={driverPhone}
                onChange={(v) => set("driverPhone")(v.replace(/\D/g, ""))}
                placeholder="10-digit mobile number"
                maxLength={10}
                inputMode="numeric"
                error={!!errors.driverPhone}
              />
            </Field>

            <Field label="Driving licence number" required error={errors.driverLicenceNumber}>
              <StyledInput
                value={driverLicenceNumber}
                onChange={(v) => set("driverLicenceNumber")(v.toUpperCase())}
                placeholder="e.g. MH1420110012345"
                maxLength={24}
                error={!!errors.driverLicenceNumber}
              />
            </Field>
          </div>

          <div className="mt-1">
            <DocUploader
              label="Driving licence photo"
              hint="Front side, clearly readable. JPG, PNG, WEBP or PDF, max 5 MB."
              field="driverLicencePhotos"
              items={driverLicencePhotos}
              required
              error={errors.driverLicencePhotos}
              onUpload={onDocUpload}
              onRemove={onRemoveDoc}
            />
          </div>
        </SectionCard>
      )}

      {!withDriverEnabled && (
        <div className="flex items-start gap-2.5 px-4 py-3.5 rounded-[12px] border-[1.5px] border-th-warm-border bg-th-warm-surface">
          <IdCard size={15} className="text-th-warm-text-dark mt-0.5 shrink-0" />
          <p className="text-[12.5px] text-th-warm-text-dark leading-[1.55]">
            This is a self-drive-only listing, so we don't need driver details. Guests will submit
            their own licence number when they book.
          </p>
        </div>
      )}

      <div className="flex items-start gap-2.5 px-4 py-3.5 rounded-[12px] border-[1.5px] border-th-warm-border bg-th-surface-0">
        <Phone size={15} className="text-th-warm-text-dark mt-0.5 shrink-0" />
        <p className="text-[12.5px] text-th-warm-text-dark leading-[1.55]">
          Our team may call to verify these documents before your listing is approved.
        </p>
      </div>
    </div>
  );

  if (embedded) return body;

  return (
    <div className="w-full flex flex-col gap-6">
      <StepHeader
        kicker="Documents"
        subtitle="The paperwork we're required to hold for a rental vehicle."
      />
      {body}
    </div>
  );
};

export default VehicleComplianceStep;
