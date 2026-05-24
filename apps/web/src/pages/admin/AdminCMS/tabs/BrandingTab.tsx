import React from "react";
import { toast } from "sonner";
import { settingsService } from "@/services/api";
import { getImageUrl } from "@/lib/adminUtils";

interface BrandingTabProps {
  faviconUrl: string;
  logoUrl: string;
  logoDarkUrl: string;
  setFaviconUrl: (v: string) => void;
  setLogoUrl: (v: string) => void;
  setLogoDarkUrl: (v: string) => void;
}

/**
 * Branding settings: favicon + light/dark logo upload.
 * Self-contained — upload handler lives here, only the resulting URL state
 * lives in the parent so it can be shared with other CMS sections if needed.
 */
export function BrandingTab({
  faviconUrl,
  logoUrl,
  logoDarkUrl,
  setFaviconUrl,
  setLogoUrl,
  setLogoDarkUrl,
}: BrandingTabProps) {
  const handleBrandingUpload = async (
    type: "favicon" | "logo" | "logo_dark",
    file?: File | null,
  ) => {
    if (!file) return;
    try {
      const page = type === "favicon" ? "favicon" : "logo";
      const res = await settingsService.uploadSeoAsset(page, type, file);

      if (type === "favicon") setFaviconUrl(res?.faviconUrl || "");
      if (type === "logo") setLogoUrl(res?.logoUrl || "");
      if (type === "logo_dark") setLogoDarkUrl(res?.logoDarkUrl || "");

      toast.success("Uploaded successfully");
    } catch (e) {
      console.error("Branding upload failed", e);
      toast.error("Upload failed");
    }
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-2xl border border-dashboard-stroke">
      <div className="space-y-2">
        <label className="block text-base text-[#334054] font-plus-jakarta">Favicon</label>
        {faviconUrl && (
          <img src={getImageUrl(faviconUrl)} alt="Favicon" className="w-10 h-10 object-contain" />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleBrandingUpload("favicon", e.target.files?.[0])}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-base text-[#334054] font-plus-jakarta">
          Light Theme Logo (for White Background)
        </label>
        {logoUrl && (
          <img src={getImageUrl(logoUrl)} alt="Light Logo" className="w-20 h-10 object-contain" />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleBrandingUpload("logo", e.target.files?.[0])}
        />
      </div>

      <div className="space-y-2">
        <label className="block text-base text-[#334054] font-plus-jakarta">
          Dark Theme Logo (for Black Background)
        </label>
        {logoDarkUrl ? (
          <img
            src={getImageUrl(logoDarkUrl)}
            alt="Dark Theme Logo"
            className="w-20 h-10 object-contain bg-black"
          />
        ) : null}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleBrandingUpload("logo_dark", e.target.files?.[0])}
        />
      </div>
    </div>
  );
}

export default BrandingTab;
