import React from "react";
import { getImageUrl } from "@/lib/adminUtils";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  AdminDetailDrawer,
  DetailField,
  DetailPhotos,
  DetailSection,
} from "./AdminDetailDrawer";

/**
 * Vendor inspector.
 *
 * Was a centred `fixed inset-0` overlay of grey cards with blue section icons;
 * it is now a right-side drawer on the shared tokens. Loading and error are
 * handled by the drawer itself, so a slow `getVendor` keeps the header (drawn
 * from the row already in hand) and shimmers only the body — the old version
 * swapped the entire panel for a spinner and then jumped.
 *
 * Every field getter below is unchanged: vendor records arrive in three shapes
 * (flat, `business.*`/`personal.*` nested, and the legacy column names), which
 * is what the fallback chains are for.
 */

interface VendorDetailsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: any | null;
  isLoading?: boolean;
  error?: string | null;
  /** Walk the filtered list without closing. */
  position?: { index: number; total: number };
  onPrev?: () => void;
  onNext?: () => void;
}

// Handle YYYY-MM-DD specifically to avoid the UTC shift that turns a birthday
// into the day before in IST.
const formatDate = (dateString?: string) => {
  if (!dateString || dateString === "N/A") return "";
  try {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split("-").map(Number);
      const date = new Date(year, month - 1, day);
      return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    }
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateString;
  }
};

export default function VendorDetailsPopup({
  isOpen,
  onClose,
  vendor,
  isLoading,
  error,
  position,
  onPrev,
  onNext,
}: VendorDetailsPopupProps) {
  if (!isOpen) return null;

  /* ── Business ── */
  const brandName = vendor?.brandName || vendor?.business?.brandName || vendor?.businessName || "";
  const legalCompanyName =
    vendor?.legalCompanyName || vendor?.business?.legalCompanyName || vendor?.companyName || "";
  const gstNumber = vendor?.gstNumber || vendor?.business?.gstNumber || "";
  const businessEmail = vendor?.businessEmail || vendor?.business?.email || vendor?.email || "";
  const businessPhone =
    vendor?.businessPhone ||
    vendor?.business?.phone ||
    vendor?.phoneNumber ||
    vendor?.phone ||
    "";

  const businessAddress =
    [
      vendor?.businessLocality || vendor?.business?.locality || vendor?.locality,
      vendor?.businessCity || vendor?.business?.city || vendor?.city,
      vendor?.businessState || vendor?.business?.state || vendor?.state,
      vendor?.businessPincode || vendor?.business?.pincode || vendor?.pincode,
    ]
      .filter(Boolean)
      .join(", ") ||
    vendor?.businessAddress ||
    vendor?.address ||
    "";

  /* ── Personal ── */
  const firstName = vendor?.firstName || vendor?.personal?.firstName || "";
  const lastName = vendor?.lastName || vendor?.personal?.lastName || "";
  const fullName =
    firstName || lastName
      ? `${firstName} ${lastName}`.trim()
      : vendor?.personName || vendor?.name || "";

  const dateOfBirth = formatDate(vendor?.dateOfBirth || vendor?.personal?.dateOfBirth);
  const maritalStatus = vendor?.maritalStatus || vendor?.personal?.maritalStatus || "";

  const personalAddress =
    [
      vendor?.personalLocality || vendor?.personal?.locality,
      vendor?.personalCity || vendor?.personal?.city,
      vendor?.personalState || vendor?.personal?.state,
      vendor?.personalPincode || vendor?.personal?.pincode,
    ]
      .filter(Boolean)
      .join(", ") ||
    vendor?.personalAddress ||
    vendor?.address ||
    "";

  const idProofType = vendor?.idProof || vendor?.personal?.idProof || vendor?.idType || "";
  const idPhotos: string[] = (
    vendor?.idPhotos ||
    vendor?.personal?.idPhotos ||
    (vendor?.idPhoto ? [vendor.idPhoto] : [])
  )
    .filter(Boolean)
    .map((p: string) => getImageUrl(p));

  const vendorId = vendor?.vendorId || vendor?._id || "";

  return (
    <AdminDetailDrawer
      open={isOpen}
      onClose={onClose}
      eyebrow="Vendor"
      title={brandName || fullName || vendorId || "Vendor"}
      subtitle={vendorId ? `Vendor ID: ${vendorId}` : undefined}
      status={vendor?.status ? <StatusBadge status={vendor.status} /> : undefined}
      width="lg"
      loading={isLoading}
      error={error ?? null}
      position={position}
      onPrev={onPrev}
      onNext={onNext}
    >
      <DetailSection title="Business details">
        <DetailField label="Brand name" value={brandName} />
        <DetailField label="Legal company name" value={legalCompanyName} />
        <DetailField label="GST number" value={gstNumber} />
        <DetailField label="Business phone" value={businessPhone} />
        <DetailField label="Business email" value={businessEmail} full />
        <DetailField label="Business address" value={businessAddress} full />
      </DetailSection>

      <DetailSection title="Personal details">
        <DetailField label="Full name" value={fullName} />
        <DetailField label="Date of birth" value={dateOfBirth} />
        {/* Passed through only when set — an empty <span> would defeat the
            em-dash placeholder DetailField draws for missing values. */}
        <DetailField
          label="Marital status"
          value={maritalStatus ? <span className="capitalize">{maritalStatus}</span> : ""}
        />
        <DetailField label="Personal address" value={personalAddress} full />
      </DetailSection>

      <DetailSection title="Identity proof">
        <DetailField label="ID type" value={idProofType} />
        {idPhotos.length > 0 && <DetailPhotos photos={idPhotos} label="ID proof" />}
      </DetailSection>
    </AdminDetailDrawer>
  );
}
