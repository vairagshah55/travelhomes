import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import AdminLayout from "@/components/admin/AdminLayout";
import {
  Bell,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  Search,
  Filter,
  X,
  MoreHorizontal,
  Upload,
  User,
  Eye,
} from "lucide-react";
import RichTextEditor from "@/components/admin/RichTextEditor";
import { cmsService } from "@/services/cms";
import { settingsService } from "@/services/api";

import { getImageUrl } from "@/lib/adminUtils";
import UniqueStaysSkeleton from "@/utils/UniqueStaysSkeleton";
import ConfirmModal from "@/components/shared/ConfirmModal";

import { CollapsibleSection } from "./AdminCMS/CollapsibleSection";
import { StarRating } from "./AdminCMS/StarRating";
import { BrandingTab } from "./AdminCMS/tabs/BrandingTab";
import { TestimonialsTab } from "./AdminCMS/tabs/TestimonialsTab";
import { PolicyTab } from "./AdminCMS/tabs/PolicyTab";
import { ContactUsTab } from "./AdminCMS/tabs/ContactUsTab";
import { FAQsTab } from "./AdminCMS/tabs/FAQsTab";
import { CareerTab } from "./AdminCMS/tabs/CareerTab";
import { HomePageTab } from "./AdminCMS/tabs/HomePageTab";
import { BlogsTab } from "./AdminCMS/tabs/BlogsTab";
import { FeaturesTab } from "./AdminCMS/tabs/FeaturesTab";

const AdminCMS = () => {
  const [activeTab, setActiveTab] = useState("Register/Login");
  const [openContactMenuId, setOpenContactMenuId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  // Branding States
  const [faviconUrl, setFaviconUrl] = useState<string>("");
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [logoDarkUrl, setLogoDarkUrl] = useState<string>("");

  // Contact Info State
  const [contactInfo, setContactInfo] = useState({
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    image: "",
  });

  // Local preview and file inputs for Change Photo buttons
  const [loginPreview, setLoginPreview] = useState<string>("");
  const [registerPreview1, setRegisterPreview1] = useState<string>("");
  const [registerPreview2, setRegisterPreview2] = useState<string>("");
  const loginFileRef = useRef<HTMLInputElement>(null);
  const registerFileRef1 = useRef<HTMLInputElement>(null);
  const registerFileRef2 = useRef<HTMLInputElement>(null);

  const onLoginPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLoginPreview(reader.result as string);
    reader.readAsDataURL(file);
    try {
      await cmsService.uploadMedia({
        page: "Register/Login",
        section: "Login Page",
        position: 0,
        file,
      });
    } catch (err) {
      console.error(err);
    }
  };
  const onRegisterPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>, which: 1 | 2) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (which === 1) setRegisterPreview1(reader.result as string);
      else setRegisterPreview2(reader.result as string);
    };
    reader.readAsDataURL(file);
    try {
      await cmsService.uploadMedia({
        page: "Register/Login",
        section: "Registration Page",
        position: which === 1 ? 1 : 2,
        file,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const authPages = [
    "Login",
    "Register",
    "ForgetPassword",
    "Verification",
    "EnterEmail",
    "ChangePassword",
  ] as const;
  const slotsPerPage = 5;

  const [previews, setPreviews] = useState<Record<string, (string | null)[]>>({
    Login: Array(slotsPerPage).fill(null),
    Register: Array(slotsPerPage).fill(null),
    ForgetPassword: Array(slotsPerPage).fill(null),
    Verification: Array(slotsPerPage).fill(null),
    EnterEmail: Array(slotsPerPage).fill(null),
    ChangePassword: Array(slotsPerPage).fill(null),
  });

  const makeRefs = () =>
    Array.from({ length: slotsPerPage }, () => React.createRef<HTMLInputElement>());
  const fileRefs = useRef<Record<string, React.RefObject<HTMLInputElement>[]>>({
    Login: makeRefs(),
    Register: makeRefs(),
    ForgetPassword: makeRefs(),
    Verification: makeRefs(),
    EnterEmail: makeRefs(),
    ChangePassword: makeRefs(),
  });

  const getDefaultImage = (page: string, index: number) => {
    const defaultsLogin = [
      "https://api.builder.io/api/v1/image/assets/TEMP/189ec32850d222d53454645d326fb969a5128f86?width=683",
      "https://api.builder.io/api/v1/image/assets/TEMP/189ec32850d222d53454645d326fb969a5128f86?width=683",
      "https://api.builder.io/api/v1/image/assets/TEMP/189ec32850d222d53454645d326fb969a5128f86?width=683",
      "https://api.builder.io/api/v1/image/assets/TEMP/189ec32850d222d53454645d326fb969a5128f86?width=683",
      "https://api.builder.io/api/v1/image/assets/TEMP/189ec32850d222d53454645d326fb969a5128f86?width=683",
    ];
    const defaultsRegister = [
      "https://api.builder.io/api/v1/image/assets/TEMP/efc35c1906a677c7aab6014678e553f772fbd27c?width=683",
      "https://api.builder.io/api/v1/image/assets/TEMP/a5c3a1d5930c7d51d52f92c07949580819d89bfc?width=683",
      "https://api.builder.io/api/v1/image/assets/TEMP/a5c3a1d5930c7d51d52f92c07949580819d89bfc?width=683",
      "https://api.builder.io/api/v1/image/assets/TEMP/a5c3a1d5930c7d51d52f92c07949580819d89bfc?width=683",
      "https://api.builder.io/api/v1/image/assets/TEMP/a5c3a1d5930c7d51d52f92c07949580819d89bfc?width=683",
    ];
    const generic = "https://via.placeholder.com/400x300?text=Add+Image";

    if (page === "Login") return defaultsLogin[index] || generic;
    if (page === "Register") return defaultsRegister[index] || generic;
    return generic;
  };

  const onChangePhoto = async (
    page: string,
    index: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const slicePages = ["Login", "Register", "Verification", "EnterEmail", "ChangePassword"];

    if (slicePages.includes(page)) {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const fullImageSrc = readerEvent.target?.result as string;

        // Set full image preview immediately
        setPreviews((prev) => ({
          ...prev,
          [page]: prev[page].map((v, i) => (i === 0 ? fullImageSrc : v)),
        }));

        const img = new Image();
        img.onload = async () => {
          const w = img.width;
          const h = img.height;
          const halfW = w / 2;
          const thirdH = h / 3;
          const halfH = h / 2;

          const slices = [
            { x: 0, y: 0, w: halfW, h: thirdH }, // 0: Left Top
            { x: 0, y: thirdH, w: halfW, h: thirdH }, // 1: Left Middle
            { x: 0, y: 2 * thirdH, w: halfW, h: thirdH }, // 2: Left Bottom
            { x: halfW, y: 0, w: halfW, h: halfH }, // 3: Right Top
            { x: halfW, y: halfH, w: halfW, h: halfH }, // 4: Right Bottom
          ];

          const uploadPromises = slices.map(async (slice, i) => {
            return new Promise<void>((resolve) => {
              const canvas = document.createElement("canvas");
              const ctx = canvas.getContext("2d");
              if (!ctx) {
                resolve();
                return;
              }

              canvas.width = slice.w;
              canvas.height = slice.h;
              ctx.drawImage(img, slice.x, slice.y, slice.w, slice.h, 0, 0, slice.w, slice.h);

              canvas.toBlob(async (blob) => {
                if (blob) {
                  const slicedFile = new File([blob], `slice_${i}_${file.name}`, {
                    type: file.type,
                  });

                  try {
                    await cmsService.uploadMedia({
                      page,
                      section: page,
                      position: i,
                      file: slicedFile,
                    });
                  } catch (err) {
                    console.error(`Failed to upload slice ${i}`, err);
                  }
                }
                resolve();
              }, file.type);
            });
          });

          await Promise.all(uploadPromises);
          toast.success("Image sliced and uploaded successfully!");
        };
        img.src = fullImageSrc;
      };
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPreviews((prev) => ({
        ...prev,
        [page]: prev[page].map((v, i) => (i === index ? (reader.result as string) : v)),
      }));
    };
    reader.readAsDataURL(file);
    try {
      const result = await cmsService.uploadMedia({
        page,
        section: page,
        position: index,
        file,
      });
      if (result?.data?.url) {
        setPreviews((prev) => ({
          ...prev,
          [page]: prev[page].map((v, i) => (i === index ? result.data.url : v)),
        }));
      }
    } catch (err) {
      console.error("[AdminCMS] Upload failed:", err);
      toast.error(
        `Failed to upload image: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  const tabs = [
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

  // Contact messages state (for Contact Us tab)
  const [contactMessages, setContactMessages] = useState<
    Array<{
      id: string;
      firstName: string;
      lastName?: string;
      email: string;
      phone?: string;
      message: string;
      status?: string;
      createdAt?: string;
    }>
  >([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  // Load initial data from API
  useEffect(() => {
    cmsService
      .getContact()
      .then((res) => {
        if (res?.data) {
          setContactInfo((prev) => ({ ...prev, ...res.data }));
        }
      })
      .catch(console.error);

    // Load contact messages for Contact Us tab
    (async () => {
      try {
        setLoadingContacts(true);
        const list = await cmsService.listContactMessages();
        setContactMessages(list);
      } catch (e) {
        console.warn("Failed to load contact messages", e);
      } finally {
        setLoadingContacts(false);
      }
    })();

    (async () => {
      try {
        const next: Record<string, (string | null)[]> = {
          Login: Array(slotsPerPage).fill(null),
          Register: Array(slotsPerPage).fill(null),
          ForgetPassword: Array(slotsPerPage).fill(null),
          Verification: Array(slotsPerPage).fill(null),
          EnterEmail: Array(slotsPerPage).fill(null),
          ChangePassword: Array(slotsPerPage).fill(null),
        };

        for (const page of authPages) {
          const res = await cmsService.getMedia({ page });
          const items: Array<{ section: string; position: number; url: string } & any> =
            res?.data || res || [];
          (items || []).forEach((m) => {
            const pos = Number(m.position || 0);
            const url = String(m.url || "").trim();
            if (next[page] && pos >= 0 && pos < slotsPerPage && url) {
              next[page][pos] = url;
            }
          });
        }
        setPreviews(next);
      } catch (e) {
        console.warn("Failed to load CMS media", e);
      }
    })();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".action-menu-container")) {
        setOpenContactMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch Branding Settings
  useEffect(() => {
    if (activeTab !== "Branding") return;
    const loadBranding = async () => {
      try {
        const faviconData = await settingsService.getSeo("favicon");
        setFaviconUrl(faviconData?.faviconUrl || "");

        const logoData = await settingsService.getSeo("logo");
        setLogoUrl(logoData?.logoUrl || "");
        setLogoDarkUrl(logoData?.logoDarkUrl || "");
      } catch (e) {
        console.error("Failed to load branding settings", e);
      }
    };
    loadBranding();
  }, [activeTab]);

  const renderRegisterLoginContent = () => (
    <div className="space-y-4 overflow-x-hidden max-md:flex-wrap">
      {/* Login Page */}
      <CollapsibleSection title="Login Page" defaultExpanded>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {loadingContacts ? (
            <UniqueStaysSkeleton />
          ) : (
            [0].map((idx) => (
              <div key={idx} className="space-y-3">
                <div className="w-[300px] h-[300px] bg-gray-200 rounded-xl overflow-hidden">
                  <img
                    src={getImageUrl(previews["Login"]?.[idx] || getDefaultImage("Login", idx))}
                    alt={`Login Page Preview ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileRefs.current["Login"][idx]}
                  className="hidden"
                  onChange={(e) => onChangePhoto("Login", idx, e)}
                />
                <button
                  onClick={() => fileRefs.current["Login"][idx].current?.click()}
                  className="w-[300px] py-3 bg-dashboard-primary text-black rounded-full font-geist text-sm font-medium tracking-tight hover:bg-dashboard-primary/90 transition-colors"
                >
                  Change Photo
                </button>
              </div>
            ))
          )}
        </div>
      </CollapsibleSection>

      {/* Registration Page */}
      <CollapsibleSection title="Registration Page" defaultExpanded>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {loadingContacts ? (
            <UniqueStaysSkeleton />
          ) : (
            [0].map((idx) => (
              <div key={idx} className="space-y-3">
                <div className="w-[300px] h-[300px] bg-gray-200 rounded-xl overflow-hidden">
                  <img
                    src={getImageUrl(
                      previews["Register"]?.[idx] || getDefaultImage("Register", idx),
                    )}
                    alt={`Registration Page Preview ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileRefs.current["Register"][idx]}
                  className="hidden"
                  onChange={(e) => onChangePhoto("Register", idx, e)}
                />
                <button
                  onClick={() => fileRefs.current["Register"][idx].current?.click()}
                  className="w-[300px] py-3 bg-dashboard-primary text-black rounded-full font-geist text-sm font-medium tracking-tight hover:bg-dashboard-primary/90 transition-colors"
                >
                  Change Photo
                </button>
              </div>
            ))
          )}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Verification Code Page">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {loadingContacts ? (
            <UniqueStaysSkeleton />
          ) : (
            [0].map((idx) => (
              <div key={idx} className="space-y-3">
                <div className="w-[300px] h-[300px] bg-gray-200 rounded-xl overflow-hidden">
                  <img
                    src={getImageUrl(
                      previews["Verification"]?.[idx] || getDefaultImage("Verification", idx),
                    )}
                    alt={`Verification Code Page Preview ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileRefs.current["Verification"][idx]}
                  className="hidden"
                  onChange={(e) => onChangePhoto("Verification", idx, e)}
                />
                <button
                  onClick={() => fileRefs.current["Verification"][idx].current?.click()}
                  className="w-[300px] py-3 bg-dashboard-primary text-black rounded-full font-geist text-sm font-medium tracking-tight hover:bg-dashboard-primary/90 transition-colors"
                >
                  Change Photo
                </button>
              </div>
            ))
          )}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Enter Email Page">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3  ">
          {loadingContacts ? (
            <UniqueStaysSkeleton />
          ) : (
            [0].map((idx) => (
              <div key={idx} className="space-y-3">
                <div className="w-[300px] h-[300px] bg-gray-200 rounded-xl overflow-hidden">
                  <img
                    src={getImageUrl(
                      previews["EnterEmail"]?.[idx] || getDefaultImage("EnterEmail", idx),
                    )}
                    alt={`Enter Email Page Preview ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileRefs.current["EnterEmail"][idx]}
                  className="hidden"
                  onChange={(e) => onChangePhoto("EnterEmail", idx, e)}
                />
                <button
                  onClick={() => fileRefs.current["EnterEmail"][idx].current?.click()}
                  className="w-[300px] py-3 bg-dashboard-primary text-black rounded-full font-geist text-sm font-medium tracking-tight hover:bg-dashboard-primary/90 transition-colors"
                >
                  Change Photo
                </button>
              </div>
            ))
          )}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Change Password Page">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {loadingContacts ? (
            <UniqueStaysSkeleton />
          ) : (
            [0].map((idx) => (
              <div key={idx} className="space-y-3">
                <div className="w-[300px] h-[300px] bg-gray-200 rounded-xl overflow-hidden">
                  <img
                    src={getImageUrl(
                      previews["ChangePassword"]?.[idx] || getDefaultImage("ChangePassword", idx),
                    )}
                    alt={`Change Password Page Preview ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileRefs.current["ChangePassword"][idx]}
                  className="hidden"
                  onChange={(e) => onChangePhoto("ChangePassword", idx, e)}
                />
                <button
                  onClick={() => fileRefs.current["ChangePassword"][idx].current?.click()}
                  className="w-[300px] py-3 bg-dashboard-primary text-black rounded-full font-geist text-sm font-medium tracking-tight hover:bg-dashboard-primary/90 transition-colors"
                >
                  Change Photo
                </button>
              </div>
            ))
          )}
        </div>
      </CollapsibleSection>
    </div>
  );

  const renderHomePageContent = () => <HomePageTab />;
  const renderCareerContent = () => <CareerTab />;

  const renderFAQsContent = () => <FAQsTab />;

  const renderTestimonialsContent = () => <TestimonialsTab />;

  const renderfeaturesContent = () => <FeaturesTab />;

  const renderBlogsContent = () => <BlogsTab />;

  const renderPolicyContent = () => <PolicyTab />;
  const renderContactContent = () => (
    <ContactUsTab
      contactInfo={contactInfo}
      setContactInfo={setContactInfo}
      loadingContacts={loadingContacts}
    />
  );

  const renderBrandingContent = () => (
    <BrandingTab
      faviconUrl={faviconUrl}
      logoUrl={logoUrl}
      logoDarkUrl={logoDarkUrl}
      setFaviconUrl={setFaviconUrl}
      setLogoUrl={setLogoUrl}
      setLogoDarkUrl={setLogoDarkUrl}
    />
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "Register/Login":
        return renderRegisterLoginContent();
      case "HomePage":
        return renderHomePageContent();
      case "features":
        return renderfeaturesContent();
      case "Contact Us":
        return renderContactContent();
      case "Career":
        return renderCareerContent();
      case "FAQs":
        return renderFAQsContent();
      case "Testimonials":
        return renderTestimonialsContent();
      case "Policy":
        return renderPolicyContent();
      case "Blogs":
        return renderBlogsContent();
      case "Branding":
        return renderBrandingContent();
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
        <div className="bg-white dark:bg-tpl-dark-2 rounded-t-[10px] border-b border-tpl-stroke min-h-[68px] flex items-center px-6 shadow-tpl-1">
          <h2 className="text-tpl-dark dark:text-white text-[18px] font-bold tracking-tight leading-tight">
            CMS
          </h2>
        </div>

        <div className="bg-white dark:bg-tpl-dark-2 px-6 py-6 rounded-b-[10px] shadow-tpl-1 min-h-[calc(100vh-8rem)]">
          {/* Tabs */}
          <div className="flex items-center mb-6 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
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
          {renderTabContent()}
        </div>
      </div>

      <ConfirmModal
        open={!!confirmDialog}
        onClose={() => setConfirmDialog(null)}
        onConfirm={confirmDialog?.onConfirm ?? (() => {})}
        title={confirmDialog?.title ?? ""}
        description={confirmDialog?.message ?? ""}
        confirmLabel="Delete"
        variant="danger"
      />
    </AdminLayout>
  );
};

export default AdminCMS;
