import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Award,
  Briefcase,
  FileText,
  Home,
  Image as ImageIcon,
  LayoutGrid,
  Mail,
  MessageSquareQuote,
  Palette,
  ScrollText,
  type LucideIcon,
} from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import { MotionReveal } from "@/components/admin/MotionReveal";
import { cn } from "@/lib/utils";
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
import { CARD_FLUSH } from "@/components/admin/adminUI";

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

/**
 * Tab metadata. The icon + blurb drive the panel header, so the page always
 * says which surface you're editing instead of just repeating "CMS".
 */
const TABS: { key: string; label: string; icon: LucideIcon; blurb: string }[] = [
  {
    key: "Register/Login",
    label: "Auth pages",
    icon: ImageIcon,
    blurb: "Hero collages shown on sign-in, register and password screens.",
  },
  { key: "HomePage", label: "Home page", icon: Home, blurb: "Sections visitors see first." },
  {
    key: "features",
    label: "Features",
    icon: LayoutGrid,
    blurb: "Feature lists used across listings.",
  },
  {
    key: "Contact Us",
    label: "Contact",
    icon: Mail,
    blurb: "Contact details and the enquiry inbox.",
  },
  { key: "Career", label: "Careers", icon: Briefcase, blurb: "Open roles on the careers page." },
  { key: "FAQs", label: "FAQs", icon: MessageSquareQuote, blurb: "Questions grouped by category." },
  {
    key: "Testimonials",
    label: "Testimonials",
    icon: Award,
    blurb: "Guest quotes shown on the marketing pages.",
  },
  { key: "Policy", label: "Policies", icon: ScrollText, blurb: "Terms, privacy and refund copy." },
  { key: "Blogs", label: "Blogs", icon: FileText, blurb: "Articles and their cover images." },
  { key: "Branding", label: "Branding", icon: Palette, blurb: "Logo and favicon used site-wide." },
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
        // Pick only the editable fields — spreading the whole document would
        // echo _id / __v / timestamps straight back on the next save, the same
        // trap BlogsTab's openEdit avoids.
        if (infoRes?.data) {
          const d = infoRes.data;
          setContactInfo({
            email: d.email || "",
            phone: d.phone || "",
            address: d.address || "",
            city: d.city || "",
            state: d.state || "",
            pincode: d.pincode || "",
            image: d.image || "",
          });
        }
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
    <div className="space-y-3 overflow-x-hidden">
      {AUTH_PAGES.map(({ page, title }, index) => (
        <CollapsibleSection key={page} title={title} icon={ImageIcon} defaultExpanded={index === 0}>
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
          <div className="text-center py-12 text-[13px] text-app-fg-muted">
            Content for {activeTab} tab will be implemented here.
          </div>
        );
    }
  };

  const current = TABS.find((t) => t.key === activeTab) ?? TABS[0];
  const TabIcon = current.icon;

  return (
    <AdminLayout
      title="CMS"
      subtitle="Content shown on the public site — pages, banners, FAQs and testimonials."
    >
      <MotionReveal delay={0}>
        <div className={CARD_FLUSH}>
          {/* Panel head — mirrors PanelHead in the shared kit. */}
          <header className="flex items-start gap-3 px-5 pt-4 pb-3.5 border-b border-app-border">
            <span className="grid place-items-center w-8 h-8 rounded-[10px] bg-app-accent-soft text-app-accent shrink-0">
              <TabIcon size={15} strokeWidth={2.1} />
            </span>
            <div className="min-w-0">
              <h2 className="text-[14.5px] font-bold tracking-[-0.01em] text-app-fg">
                {current.label}
              </h2>
              <p className="mt-0.5 text-[12.5px] text-app-fg-muted">{current.blurb}</p>
            </div>
          </header>

          {/* Segmented tab rail — same sliding pill as the vendor consoles'
              tabs, replacing the underline bar on legacy dashboard-* tokens. */}
          <div
            role="tablist"
            aria-label="CMS sections"
            className="flex items-center gap-1 px-3 py-2.5 border-b border-app-border overflow-x-auto scrollbar-hide"
          >
            {TABS.map((tab) => {
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "relative inline-flex items-center gap-1.5 h-9 px-3 rounded-xl whitespace-nowrap shrink-0",
                    "text-[12.5px] font-semibold outline-none transition-colors duration-150",
                    "focus-visible:ring-2 focus-visible:ring-app-accent/40",
                    active
                      ? "text-app-accent"
                      : "text-app-fg-muted hover:text-app-fg hover:bg-app-surface-2",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="cmsTabPill"
                      className="absolute inset-0 rounded-xl bg-app-accent-soft"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <tab.icon size={14} strokeWidth={2.1} className="relative shrink-0" />
                  <span className="relative">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="px-5 py-5 min-h-[calc(100vh-16rem)]">
            <MotionReveal delay={0.06}>{renderTabContent()}</MotionReveal>
          </div>
        </div>
      </MotionReveal>
    </AdminLayout>
  );
};

export default AdminCMS;
