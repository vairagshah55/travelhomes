import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import { MotionReveal } from "@/components/admin/MotionReveal";
import { cmsService } from "@/services/cms";
import { settingsService } from "@/services/api";

import { CollapsibleSection } from "./AdminCMS/CollapsibleSection";
import { AuthPageMedia } from "./AdminCMS/AuthPageMedia";
import { BrandingTab } from "./AdminCMS/tabs/BrandingTab";
import { TestimonialsTab } from "./AdminCMS/tabs/TestimonialsTab";
import { PolicyTab } from "./AdminCMS/tabs/PolicyTab";
import { ContactUsTab, type ContactMessage } from "./AdminCMS/tabs/ContactUsTab";
import { FAQsTab } from "./AdminCMS/tabs/FAQsTab";
import { CareerTab } from "./AdminCMS/tabs/CareerTab";
import { HomePageTab } from "./AdminCMS/tabs/HomePageTab";
import { BlogsTab } from "./AdminCMS/tabs/BlogsTab";
import { FeaturesTab } from "./AdminCMS/tabs/FeaturesTab";

/**
 * The auth pages whose hero collage is CMS-managed. Each one stores five
 * media rows (position 0-4) that the public <Gallery /> renders as a
 * 3-tile left column + 2-tile right column.
 */
const AUTH_PAGES = [
  { page: "Login", title: "Login Page" },
  { page: "Register", title: "Registration Page" },
  { page: "ForgetPassword", title: "Forgot Password Page" },
  { page: "Verification", title: "Verification Code Page" },
  { page: "EnterEmail", title: "Enter Email Page" },
  { page: "ChangePassword", title: "Change Password Page" },
] as const;

const SLOTS_PER_PAGE = 5;

const emptySlots = () =>
  AUTH_PAGES.reduce<Record<string, (string | null)[]>>((acc, { page }) => {
    acc[page] = Array(SLOTS_PER_PAGE).fill(null);
    return acc;
  }, {});

const TABS = [
  "Register/Login",
  "HomePage",
  "features",
  "Contact Us",
  "Career",
  "FAQs",
  "Testimonials",
  "Policy",
  "Blogs",
  "Branding",
];

/**
 * Split an image into the five tiles the public gallery expects:
 * left column thirds (0,1,2) then right column halves (3,4).
 */
function sliceIntoTiles(img: HTMLImageElement, mimeType: string) {
  const halfW = img.width / 2;
  const thirdH = img.height / 3;
  const halfH = img.height / 2;

  const regions = [
    { x: 0, y: 0, w: halfW, h: thirdH }, // left top
    { x: 0, y: thirdH, w: halfW, h: thirdH }, // left middle
    { x: 0, y: 2 * thirdH, w: halfW, h: thirdH }, // left bottom
    { x: halfW, y: 0, w: halfW, h: halfH }, // right top
    { x: halfW, y: halfH, w: halfW, h: halfH }, // right bottom
  ];

  return Promise.all(
    regions.map(
      (r, i) =>
        new Promise<{ blob: Blob | null; dataUrl: string }>((resolve) => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve({ blob: null, dataUrl: "" });
            return;
          }
          canvas.width = Math.max(1, Math.round(r.w));
          canvas.height = Math.max(1, Math.round(r.h));
          ctx.drawImage(img, r.x, r.y, r.w, r.h, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL(mimeType);
          canvas.toBlob((blob) => resolve({ blob, dataUrl }), mimeType);
          void i;
        }),
    ),
  );
}

const readFileAsDataURL = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read that image"));
    img.src = src;
  });

const AdminCMS = () => {
  const [activeTab, setActiveTab] = useState("Register/Login");

  // ── Branding ─────────────────────────────────────────────────────────
  const [faviconUrl, setFaviconUrl] = useState<string>("");
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [logoDarkUrl, setLogoDarkUrl] = useState<string>("");

  // ── Contact ──────────────────────────────────────────────────────────
  const [contactInfo, setContactInfo] = useState({
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    image: "",
  });
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);

  // ── Auth-page media ──────────────────────────────────────────────────
  const [previews, setPreviews] = useState<Record<string, (string | null)[]>>(emptySlots);
  const [loadingMedia, setLoadingMedia] = useState(true);
  const [uploadingPage, setUploadingPage] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, React.RefObject<HTMLInputElement>>>(
    AUTH_PAGES.reduce<Record<string, React.RefObject<HTMLInputElement>>>((acc, { page }) => {
      acc[page] = React.createRef<HTMLInputElement>();
      return acc;
    }, {}),
  );

  /**
   * One picked image becomes the whole collage: it is cut into the five
   * tiles the public page renders and each tile is upserted at its position.
   */
  const onChangePhoto = async (page: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploadingPage(page);
    try {
      const dataUrl = await readFileAsDataURL(file);
      const img = await loadImage(dataUrl);
      const tiles = await sliceIntoTiles(img, file.type || "image/jpeg");

      // Show the cut tiles straight away, then swap in the stored URLs.
      setPreviews((prev) => ({
        ...prev,
        [page]: tiles.map((t, i) => t.dataUrl || prev[page][i]),
      }));

      const uploaded = await Promise.all(
        tiles.map(async (tile, i) => {
          if (!tile.blob) return null;
          const slicedFile = new File([tile.blob], `slice_${i}_${file.name}`, {
            type: file.type || "image/jpeg",
          });
          const res = await cmsService.uploadMedia({
            page,
            section: page,
            position: i,
            file: slicedFile,
          });
          return res?.data?.url ?? null;
        }),
      );

      setPreviews((prev) => ({
        ...prev,
        [page]: prev[page].map((v, i) => uploaded[i] || v),
      }));
      toast.success("Image updated on the live page");
    } catch (err) {
      console.error("[AdminCMS] Upload failed:", err);
      toast.error(
        `Failed to upload image: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    } finally {
      setUploadingPage(null);
    }
  };

  // Load contact info + inbox
  useEffect(() => {
    (async () => {
      try {
        const [infoRes, messages] = await Promise.all([
          cmsService.getContact().catch(() => null),
          cmsService.listContactMessages().catch(() => []),
        ]);
        if (infoRes?.data) setContactInfo((prev) => ({ ...prev, ...infoRes.data }));
        setContactMessages(messages as ContactMessage[]);
      } catch (e) {
        console.warn("Failed to load contact data", e);
      } finally {
        setLoadingContacts(false);
      }
    })();
  }, []);

  // Load the stored tiles for every auth page
  useEffect(() => {
    (async () => {
      try {
        const next = emptySlots();
        const results = await Promise.all(
          AUTH_PAGES.map(async ({ page }) => ({
            page,
            res: await cmsService.getMedia({ page }),
          })),
        );
        results.forEach(({ page, res }) => {
          const items: Array<{ position?: number; url?: string }> = res?.data || res || [];
          (items || []).forEach((m) => {
            const pos = Number(m.position || 0);
            const url = String(m.url || "").trim();
            if (pos >= 0 && pos < SLOTS_PER_PAGE && url) next[page][pos] = url;
          });
        });
        setPreviews(next);
      } catch (e) {
        console.warn("Failed to load CMS media", e);
      } finally {
        setLoadingMedia(false);
      }
    })();
  }, []);

  // Branding is only fetched when its tab is opened
  useEffect(() => {
    if (activeTab !== "Branding") return;
    (async () => {
      try {
        const faviconData = await settingsService.getSeo("favicon");
        setFaviconUrl(faviconData?.faviconUrl || "");

        const logoData = await settingsService.getSeo("logo");
        setLogoUrl(logoData?.logoUrl || "");
        setLogoDarkUrl(logoData?.logoDarkUrl || "");
      } catch (e) {
        console.error("Failed to load branding settings", e);
      }
    })();
  }, [activeTab]);

  const renderRegisterLoginContent = () => (
    <div className="space-y-4 overflow-x-hidden max-md:flex-wrap">
      <p className="text-sm text-dashboard-body">
        The image you upload is split into the five tiles shown on the public page — the preview
        below is exactly what visitors will see.
      </p>
      {AUTH_PAGES.map(({ page, title }, index) => (
        <CollapsibleSection key={page} title={title} defaultExpanded={index < 2}>
          <AuthPageMedia
            page={page}
            slices={previews[page]}
            loading={loadingMedia}
            uploading={uploadingPage === page}
            inputRef={fileRefs.current[page]}
            onFileChange={(e) => onChangePhoto(page, e)}
          />
        </CollapsibleSection>
      ))}
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "Register/Login":
        return renderRegisterLoginContent();
      case "HomePage":
        return <HomePageTab />;
      case "features":
        return <FeaturesTab />;
      case "Contact Us":
        return (
          <ContactUsTab
            contactInfo={contactInfo}
            setContactInfo={setContactInfo}
            loadingContacts={loadingContacts}
            messages={contactMessages}
            setMessages={setContactMessages}
          />
        );
      case "Career":
        return <CareerTab />;
      case "FAQs":
        return <FAQsTab />;
      case "Testimonials":
        return <TestimonialsTab />;
      case "Policy":
        return <PolicyTab />;
      case "Blogs":
        return <BlogsTab />;
      case "Branding":
        return (
          <BrandingTab
            faviconUrl={faviconUrl}
            logoUrl={logoUrl}
            logoDarkUrl={logoDarkUrl}
            setFaviconUrl={setFaviconUrl}
            setLogoUrl={setLogoUrl}
            setLogoDarkUrl={setLogoDarkUrl}
          />
        );
      default:
        return (
          <div className="text-center py-12 text-dashboard-neutral-07">
            Content for {activeTab} tab will be implemented here.
          </div>
        );
    }
  };

  return (
    <AdminLayout title="CMS">
      <div className="flex-1">
        <MotionReveal delay={0}>
          <div className="bg-white dark:bg-tpl-dark-2 rounded-t-[10px] border-b border-tpl-stroke min-h-[68px] flex items-center px-6 shadow-tpl-1">
            <h2 className="text-tpl-dark dark:text-white text-[18px] font-bold tracking-tight leading-tight">
              CMS
            </h2>
          </div>
        </MotionReveal>

        <div className="bg-white dark:bg-tpl-dark-2 px-6 py-6 rounded-b-[10px] shadow-tpl-1 min-h-[calc(100vh-8rem)]">
          {/* Tabs */}
          <div className="flex items-center mb-6 overflow-x-auto scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 whitespace-nowrap border-b-2 transition-colors font-plus-jakarta text-sm font-bold ${
                  activeTab === tab
                    ? "border-dashboard-primary text-dashboard-heading"
                    : "border-transparent text-dashboard-neutral-06 hover:text-dashboard-heading"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Content */}
          <MotionReveal delay={0.06}>{renderTabContent()}</MotionReveal>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminCMS;
