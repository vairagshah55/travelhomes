import React, { useState } from "react";
import { toast } from "sonner";
import { settingsService } from "@/services/api";
import { CmsField, MediaPicker } from "../ui";

type Asset = "favicon" | "logo" | "logo_dark";

interface BrandingTabProps {
  faviconUrl: string;
  logoUrl: string;
  logoDarkUrl: string;
  setFaviconUrl: (v: string) => void;
  setLogoUrl: (v: string) => void;
  setLogoDarkUrl: (v: string) => void;
}

/**
 * Branding settings: favicon + light/dark logo upload. Self-contained — the
 * upload handler lives here and only the resulting URLs live in the parent, so
 * other CMS sections can read them.
 */
export function BrandingTab({
  faviconUrl,
  logoUrl,
  logoDarkUrl,
  setFaviconUrl,
  setLogoUrl,
  setLogoDarkUrl,
}: BrandingTabProps) {
  const [uploading, setUploading] = useState<Asset | null>(null);

  const upload = async (type: Asset, file: File) => {
    setUploading(type);
    try {
      const page = type === "favicon" ? "favicon" : "logo";
      const res = await settingsService.uploadSeoAsset(page, type, file);

      if (type === "favicon") setFaviconUrl(res?.faviconUrl || "");
      if (type === "logo") setLogoUrl(res?.logoUrl || "");
      if (type === "logo_dark") setLogoDarkUrl(res?.logoDarkUrl || "");

      toast.success("Uploaded — live on the site straight away");
    } catch (e) {
      console.error("Branding upload failed", e);
      toast.error("Upload failed");
    } finally {
      setUploading(null);
    }
  };

  return (
    <div className="rounded-[14px] border border-app-border p-4">
      <div className="grid gap-6 lg:grid-cols-3">
        <CmsField label="Favicon">
          <MediaPicker
            value={faviconUrl}
            busy={uploading === "favicon"}
            onFile={(file) => upload("favicon", file)}
            accept="image/png,image/x-icon,image/svg+xml"
            hint="Square PNG, ICO or SVG — shown in the browser tab."
          />
        </CmsField>

        <CmsField label="Logo — light background">
          <MediaPicker
            value={logoUrl}
            shape="wide"
            busy={uploading === "logo"}
            onFile={(file) => upload("logo", file)}
            hint="Used on white headers and the footer."
          />
        </CmsField>

        <CmsField label="Logo — dark background">
          <MediaPicker
            value={logoDarkUrl}
            shape="wide"
            busy={uploading === "logo_dark"}
            onFile={(file) => upload("logo_dark", file)}
            previewClassName="bg-[#101828] border-[#101828]"
            hint="Shown over dark or photographic sections."
          />
        </CmsField>
      </div>
    </div>
  );
}

export default BrandingTab;
