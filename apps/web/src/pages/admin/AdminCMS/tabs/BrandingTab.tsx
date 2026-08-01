import React, { useState } from "react";
import { toast } from "sonner";
import { settingsService } from "@/services/api";
import { getImageUrl } from "@/lib/utils";
import { iconSrc, logoSrc } from "@/lib/brand";
import { CmsField, MediaPicker } from "../ui";

type Asset = "favicon" | "logo" | "logo_dark";

/** The bundled artwork each slot falls back to when nothing has been uploaded. */
const BUILT_IN = {
  favicon: iconSrc(192),
  logo: logoSrc("horizontal", "black"),
  logo_dark: logoSrc("horizontal", "white"),
} as const;

/** Uploaded asset if there is one, otherwise the bundled default that's live today. */
const resolve = (uploaded: string, builtIn: string) =>
  uploaded ? getImageUrl(uploaded) : builtIn;

/** One labelled plate in the preview strip. */
const Plate = ({
  label,
  src,
  dark = false,
  contain = "h-9",
}: {
  label: string;
  src: string;
  dark?: boolean;
  contain?: string;
}) => (
  <div className="min-w-0">
    <div
      className={`grid place-items-center h-[76px] px-4 rounded-[12px] border ${
        dark ? "bg-[#101828] border-[#101828]" : "bg-white border-app-border"
      }`}
    >
      <img src={src} alt="" className={`${contain} w-auto max-w-full object-contain`} />
    </div>
    <p className="mt-1.5 text-[11.5px] text-app-fg-muted">{label}</p>
  </div>
);

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
    <div className="space-y-4">
      {/* What the site is serving right now — uploads if present, bundled artwork
          otherwise. Shown at true header size so it's judged the way visitors see it. */}
      <div className="rounded-[14px] border border-app-border p-4">
        <div className="flex items-baseline justify-between gap-3 mb-3">
          <p className="text-[12.5px] font-semibold text-app-fg/85">Live on the site</p>
          {!logoUrl && !logoDarkUrl && !faviconUrl && (
            <span className="text-[11px] text-app-fg-muted">
              Built-in TravelHomes artwork — upload below to override
            </span>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto]">
          <Plate label="Light surfaces" src={resolve(logoUrl, BUILT_IN.logo)} />
          <Plate label="Dark surfaces" src={resolve(logoDarkUrl, BUILT_IN.logo_dark)} dark />
          <Plate
            label="App icon"
            src={resolve(faviconUrl, BUILT_IN.favicon)}
            contain="h-11"
          />
        </div>
      </div>

      <div className="rounded-[14px] border border-app-border p-4">
        <div className="grid gap-6 lg:grid-cols-3">
          <CmsField label="Favicon">
            <MediaPicker
              value={faviconUrl}
              fallbackSrc={BUILT_IN.favicon}
              busy={uploading === "favicon"}
              onFile={(file) => upload("favicon", file)}
              accept="image/png,image/x-icon,image/svg+xml"
              hint="Square PNG, ICO or SVG — shown in the browser tab."
            />
          </CmsField>

          <CmsField label="Logo — light background">
            <MediaPicker
              value={logoUrl}
              fallbackSrc={BUILT_IN.logo}
              shape="wide"
              busy={uploading === "logo"}
              onFile={(file) => upload("logo", file)}
              hint="Used on white headers and the footer."
            />
          </CmsField>

          <CmsField label="Logo — dark background">
            <MediaPicker
              value={logoDarkUrl}
              fallbackSrc={BUILT_IN.logo_dark}
              shape="wide"
              busy={uploading === "logo_dark"}
              onFile={(file) => upload("logo_dark", file)}
              previewClassName="bg-[#101828] border-[#101828]"
              hint="Shown over dark or photographic sections."
            />
          </CmsField>
        </div>
      </div>
    </div>
  );
}

export default BrandingTab;
