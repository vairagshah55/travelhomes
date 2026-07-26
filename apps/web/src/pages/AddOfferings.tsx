import React, { useEffect, useMemo, useState } from "react";
import { useHomepageSections } from "@/hooks/useHomepageSections";
import { useOfferingCatalog } from "@/hooks/useOfferingCatalog";
import { useCountriesData } from "@/hooks/useCountriesData";
import { useQueryClient } from "@tanstack/react-query";
import {
  MapPin,
  Tag,
  Tent,
  Check,
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Edit2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { offersApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { PiVanBold } from "react-icons/pi";
import { GiBinoculars } from "react-icons/gi";

import {
  TEAL,
  BLACK,
  GRAY_500,
  GRAY_400,
  GRAY_200,
  WHITE,
  SURFACE,
  ERROR,
  ERROR_BG,
  SectionCard,
  Field,
  StyledInput,
  StyledTextarea,
  StyledSelect,
  FeaturePill,
} from "@/components/offering";
import { CamperVanPricing, UniqueStayPricing, ActivityPricing } from "@/components/offering";
import {
  DescriptionStep as CaravanDescriptionStep,
  CategoryStep as CaravanCategoryStep,
  CapacityAddressStep as CaravanCapacityAddressStep,
} from "@/components/onboarding/caravan";
import { DiscountOffersStep } from "@/components/onboarding/shared";
import { SearchableSelect } from "@/components/onboarding/shared/primitives";

// ─── Constants ────────────────────────────────────────────────────────────────
const TABS = [
  { key: "camper-van", label: "Camper Van", icon: <PiVanBold size={16} />, section: "camper-van" },
  { key: "unique-stay", label: "Unique Stays", icon: <Tent size={16} />, section: "unique-stays" },
  {
    key: "activity",
    label: "Activities",
    icon: <GiBinoculars size={16} />,
    section: "best-activity",
  },
];

// Camper-van categories + features are kept inline — they describe vehicle
// taxonomy that doesn't need admin tuning. Stays + Activities are CMS-driven
// (see useOfferingCatalog) so admins can edit the available options without
// shipping code.
const CAMPER_VAN_CATEGORIES = [
  "Camper Trailer",
  "Luxury RV",
  "Basic Van",
  "Adventure Vehicle",
  "Panel Van",
  "Cargo Van",
  "Motorhome",
  "Campervan",
  "Caravan",
];

const CAMPER_VAN_FEATURES = [
  "Fan",
  "AC",
  "Kitchen",
  "Water",
  "Wifi",
  "Solar",
  "Toilet",
  "Shower",
  "Fridge",
  "TV",
  "Music",
  "GPS",
];

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
// Wizard step definitions. Step 0 is the type picker — the rest are
// type-aware (e.g. step 4 renders different capacity inputs for stays vs
// camper-van). Keep this list short — every additional step is a click the
// vendor has to make.
const STEPS = [
  { key: "type", label: "Service Type", short: "Type" },
  { key: "category", label: "Category", short: "Category" },
  { key: "basics", label: "Basics & Photos", short: "Basics" },
  { key: "features", label: "Features", short: "Features" },
  { key: "location", label: "Location & Capacity", short: "Location" },
  { key: "pricing", label: "Pricing & Discounts", short: "Pricing" },
  { key: "review", label: "Review & Submit", short: "Review" },
] as const;

const AddOfferings = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const [step, setStep] = useState(0);
  const [activeTab, setActiveTab] = useState("camper-van");
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enabledSections, setEnabledSections] = useState<Record<string, boolean>>({
    "camper-van": true,
    "unique-stays": true,
    "best-activity": true,
  });

  // ─── Form state ────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: "",
    rules: [""],
    features: [] as string[],
    photos: { cover: null as File | null, gallery: [] as File[] },
    address: "",
    locality: "India",
    pincode: "",
    city: "",
    state: "",
    seatingCapacity: "1",
    sleepingCapacity: "0",
    perKmCharge: "",
    perDayCharge: "",
    perKmIncludes: [] as string[],
    perKmExcludes: [] as string[],
    perDayIncludes: [] as string[],
    perDayExcludes: [] as string[],
    activityName: "",
    selectedActivities: [] as string[],
    rulesAndRegulations: [] as string[],
    timeDuration: "",
    personCapacity: 1,
    expectations: [] as string[],
    priceDetails: [] as any[],
    stayType: "entire",
    selectedProperties: [] as string[],
    guestCapacity: 1,
    numberOfRooms: 0,
    numberOfBeds: 0,
    numberOfBathrooms: 0,
    entireStayRules: [] as string[],
    optionalRules: [] as string[],
    rooms: [] as any[],
    regularPrice: "",
    priceIncludes: [] as string[],
    priceExcludes: [] as string[],
    firstUserDiscount: false,
    firstUserDiscountType: "percentage",
    firstUserDiscountValue: "",
    festivalOffers: false,
    festivalOffersType: "percentage",
    festivalOffersValue: "",
    weeklyMonthlyOffers: false,
    weeklyMonthlyOffersType: "percentage",
    weeklyMonthlyOffersValue: "",
    specialOffers: false,
    specialOffersType: "percentage",
    specialOffersValue: "",
    termsAccepted: false,
  });
  const [previews, setPreviews] = useState({ cover: "", gallery: [] as string[] });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ─── Helpers ───────────────────────────────────────────────────────────────
  const clearError = (field: string) => {
    if (errors[field])
      setErrors((prev) => {
        const n = { ...prev };
        delete n[field];
        return n;
      });
  };

  const set = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    clearError(field);
  };

  const handleArrayChange = (field: string, index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: (prev as any)[field].map((item: string, i: number) => (i === index ? value : item)),
    }));
  };

  const addArrayItem = (field: string) => {
    setFormData((prev) => ({ ...prev, [field]: [...(prev as any)[field], ""] }));
  };

  const removeArrayItem = (field: string, index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: (prev as any)[field].filter((_: any, i: number) => i !== index),
    }));
  };

  const toggleFeature = (f: string) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.includes(f)
        ? prev.features.filter((x) => x !== f)
        : [...prev.features, f],
    }));
  };

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "cover" | "gallery",
    index?: number,
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      if (type === "cover") {
        setFormData((prev) => ({ ...prev, photos: { ...prev.photos, cover: file } }));
        setPreviews((prev) => ({ ...prev, cover: url }));
        clearError("cover");
      } else {
        setFormData((prev) => {
          const g = [...prev.photos.gallery];
          if (typeof index === "number" && index < g.length) g[index] = file;
          else g.push(file);
          return { ...prev, photos: { ...prev.photos, gallery: g } };
        });
        setPreviews((prev) => {
          const g = [...prev.gallery];
          if (typeof index === "number" && index < g.length) g[index] = url;
          else g.push(url);
          return { ...prev, gallery: g };
        });
      }
    }
  };

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  // ─── Init — homepage sections (which categories are enabled) ─────────
  const { data: homepageSections } = useHomepageSections();

  useEffect(() => {
    if (!homepageSections) return;
    const next: Record<string, boolean> = {
      "camper-van": true,
      "unique-stays": true,
      "best-activity": true,
    };
    (homepageSections as any[]).forEach((s: any) => {
      next[s.sectionKey] = s.isVisible;
    });
    setEnabledSections(next);
    if (!next["camper-van"]) {
      if (next["unique-stays"]) setActiveTab("unique-stay");
      else if (next["best-activity"]) setActiveTab("activity");
    }
  }, [homepageSections]);

  // ─── Validation ────────────────────────────────────────────────────────────
  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (activeTab === "activity") {
      if (!formData.activityName.trim()) e.activityName = "Activity name is required";
    } else {
      if (!formData.name.trim()) e.name = "Name is required";
      if (!formData.category) e.category = "Category is required";
    }
    if (!formData.description.trim()) e.description = "Description is required";
    if (!formData.photos.cover) e.cover = "Cover photo is required";
    if (!formData.state) e.state = "State is required";
    if (!formData.city) e.city = "City is required";
    if (activeTab === "camper-van") {
      if (!formData.perKmCharge && !formData.perDayCharge)
        e.perKmCharge = "At least one pricing is required";
    } else if (activeTab === "unique-stay") {
      if (!formData.regularPrice) e.regularPrice = "Price is required";
    } else if (activeTab === "activity") {
      if (!formData.regularPrice) e.regularPrice = "Price is required";
      if (!formData.timeDuration) e.timeDuration = "Duration is required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ─── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      const coverUrl = formData.photos.cover ? await fileToDataUrl(formData.photos.cover) : "";
      const galleryUrls: string[] = [];
      for (const f of formData.photos.gallery) {
        if (f) galleryUrls.push(await fileToDataUrl(f));
      }

      let specificData: any = {};
      if (activeTab === "camper-van") {
        specificData = {
          seatingCapacity: Number(formData.seatingCapacity),
          sleepingCapacity: Number(formData.sleepingCapacity),
          perKmCharge: formData.perKmCharge,
          perDayCharge: formData.perDayCharge,
          perKmIncludes: formData.perKmIncludes,
          perKmExcludes: formData.perKmExcludes,
          perDayIncludes: formData.perDayIncludes,
          perDayExcludes: formData.perDayExcludes,
        };
      } else if (activeTab === "unique-stay") {
        specificData = {
          guestCapacity: Number(formData.guestCapacity),
          numberOfRooms: Number(formData.numberOfRooms),
          numberOfBeds: Number(formData.numberOfBeds),
          numberOfBathrooms: Number(formData.numberOfBathrooms),
          stayType: formData.stayType,
          rooms: formData.rooms,
          entireStayRules: formData.entireStayRules,
          optionalRules: formData.optionalRules,
        };
      } else if (activeTab === "activity") {
        specificData = {
          name: formData.activityName,
          personCapacity: Number(formData.personCapacity),
          timeDuration: formData.timeDuration,
          priceDetails: formData.priceDetails,
          expectations: formData.expectations,
        };
      }

      if (!token) throw new Error("User not authenticated");

      await offersApi.create(
        {
          name: activeTab === "activity" ? formData.activityName : formData.name,
          category: formData.category,
          description: formData.description,
          rules: formData.rules.filter(Boolean),
          features: formData.features,
          locality: formData.locality,
          pincode: formData.pincode,
          city: formData.city,
          state: formData.state,
          address: formData.address,
          regularPrice: Number(formData.regularPrice || 0),
          priceIncludes: formData.priceIncludes.filter(Boolean),
          priceExcludes: formData.priceExcludes.filter(Boolean),
          photos: { coverUrl, galleryUrls },
          status: "pending",
          serviceType: activeTab,
          ...specificData,
          // Discounts now persisted as a structured sub-doc on the Offer model
          // (Offer.discounts) rather than the legacy flat fields. The old
          // fields are kept on the payload for backwards-compat with any
          // consumer still reading them, but the source of truth is the
          // `discounts` object below.
          discounts: {
            firstUser: {
              enabled: !!formData.firstUserDiscount,
              type: formData.firstUserDiscountType,
              value: formData.firstUserDiscountValue || "",
              finalPrice: "",
            },
            festival: {
              enabled: !!formData.festivalOffers,
              type: formData.festivalOffersType,
              value: formData.festivalOffersValue || "",
              finalPrice: "",
            },
            weekly: {
              enabled: !!formData.weeklyMonthlyOffers,
              type: formData.weeklyMonthlyOffersType,
              value: formData.weeklyMonthlyOffersValue || "",
              finalPrice: "",
            },
            special: {
              enabled: !!formData.specialOffers,
              type: formData.specialOffersType,
              value: formData.specialOffersValue || "",
              finalPrice: "",
            },
          },
          firstUserDiscount: formData.firstUserDiscount,
          firstUserDiscountType: formData.firstUserDiscountType,
          firstUserDiscountValue: formData.firstUserDiscountValue,
          festivalOffers: formData.festivalOffers,
          festivalOffersType: formData.festivalOffersType,
          festivalOffersValue: formData.festivalOffersValue,
          weeklyMonthlyOffers: formData.weeklyMonthlyOffers,
          weeklyMonthlyOffersType: formData.weeklyMonthlyOffersType,
          weeklyMonthlyOffersValue: formData.weeklyMonthlyOffersValue,
          specialOffers: formData.specialOffers,
          specialOffersType: formData.specialOffersType,
          specialOffersValue: formData.specialOffersValue,
        } as any,
        token,
      );

      // Bust the bookings page's resources cache so the new service shows up
      // immediately in the New Booking modal's Service Name dropdown without
      // requiring a hard reload.
      queryClient.invalidateQueries({ queryKey: ["bookings", "resources"] });

      setShowSuccessAlert(true);
      setTimeout(() => {
        setShowSuccessAlert(false);
        navigate("/offerings");
      }, 2000);
    } catch {
      setErrors({ submit: "Failed to submit. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Camper-van uses the inline vehicle taxonomy; stays + activities come
  // from the CMS via useOfferingCatalog (same source as the onboarding flows).
  const catalog = useOfferingCatalog();
  const baseCategories = useMemo(
    () =>
      activeTab === "camper-van" ? CAMPER_VAN_CATEGORIES : catalog.categories[activeTab] || [],
    [activeTab, catalog.categories],
  );
  const baseFeatures = useMemo(
    () => (activeTab === "camper-van" ? CAMPER_VAN_FEATURES : catalog.features[activeTab] || []),
    [activeTab, catalog.features],
  );

  // Defensive merge — keep any in-progress draft category/feature visible even
  // if it's not in the CMS list (e.g. user typed via Other / pasted a custom).
  // AddOfferings doesn't have legacy data to preserve, but this keeps Add and
  // Edit behaviorally identical.
  const categories = useMemo(() => {
    if (!formData.category || baseCategories.includes(formData.category)) {
      return baseCategories;
    }
    return [...baseCategories, formData.category];
  }, [baseCategories, formData.category]);

  const features = useMemo(() => {
    const set = new Set(baseFeatures);
    const extras = (formData.features || []).filter((f) => f && !set.has(f));
    return extras.length ? [...baseFeatures, ...extras] : baseFeatures;
  }, [baseFeatures, formData.features]);

  const arrayHelpers = { handleArrayChange, addArrayItem, removeArrayItem };

  // ─── Per-step validation ──────────────────────────────────────────────────
  // The wizard's "Next" button is enabled only when the current step has the
  // minimum required data. Final submit re-runs full validate() anyway so
  // these checks just gate forward navigation, not the eventual write.
  const stepCanAdvance = useMemo(() => {
    const name = activeTab === "activity" ? formData.activityName : formData.name;
    switch (step) {
      case 0: // Type
        return ["camper-van", "unique-stay", "activity"].includes(activeTab);
      case 1: // Category
        return !!formData.category;
      case 2: // Basics + photos
        return (
          !!name.trim() &&
          !!formData.description.trim() &&
          !!formData.photos.cover &&
          formData.photos.gallery.length >= 5
        );
      case 3: // Features — optional, always allow advancing
        return true;
      case 4: // Location + capacity
        return !!formData.state && !!formData.city;
      case 5: // Pricing
        if (activeTab === "camper-van") {
          return !!formData.perKmCharge || !!formData.perDayCharge;
        }
        if (activeTab === "activity") {
          return !!formData.regularPrice && !!formData.timeDuration;
        }
        return !!formData.regularPrice;
      case 6: // Review
        return true;
      default:
        return true;
    }
  }, [step, activeTab, formData]);

  const isLastStep = step === STEPS.length - 1;
  const onNext = () => {
    if (isLastStep) handleSubmit();
    else setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };
  const onPrev = () => setStep((s) => Math.max(0, s - 1));

  // Photo bridges for the embedded DescriptionStep (it works in (string | File)[]
  // shapes; our state stores cover as File and gallery as File[]).
  const onCoverUploadBridge = (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setFormData((p) => ({ ...p, photos: { ...p.photos, cover: file } }));
    setPreviews((p) => ({ ...p, cover: url }));
    clearError("cover");
  };
  const onGalleryUploadBridge = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);
    setFormData((p) => ({
      ...p,
      photos: { ...p.photos, gallery: [...p.photos.gallery, ...fileList] },
    }));
    setPreviews((p) => ({
      ...p,
      gallery: [...p.gallery, ...fileList.map((f) => URL.createObjectURL(f))],
    }));
    clearError("gallery");
  };
  const onRemoveCoverBridge = () => {
    setFormData((p) => ({ ...p, photos: { ...p.photos, cover: null } }));
    setPreviews((p) => ({ ...p, cover: "" }));
  };
  const onRemovePhotoBridge = (i: number) => {
    setFormData((p) => ({
      ...p,
      photos: { ...p.photos, gallery: p.photos.gallery.filter((_, idx) => idx !== i) },
    }));
    setPreviews((p) => ({ ...p, gallery: p.gallery.filter((_, idx) => idx !== i) }));
  };

  // Rules bridge — DescriptionStep expects 0-indexed handlers; our state
  // already uses an array of strings.
  const onAddRule = () => addArrayItem("rules");
  const onUpdateRule = (i: number, v: string) => handleArrayChange("rules", i, v);
  const onRemoveRule = (i: number) => removeArrayItem("rules", i);
  const adjustCapacity = (type: "seating" | "sleeping", direction: "increase" | "decrease") => {
    const field = type === "seating" ? "seatingCapacity" : "sleepingCapacity";
    setFormData((p) => {
      const current = Number((p as any)[field] || 0);
      const min = type === "seating" ? 1 : 0;
      const next =
        direction === "increase" ? Math.min(20, current + 1) : Math.max(min, current - 1);
      return { ...p, [field]: String(next) };
    });
  };

  // Discount sub-doc state + handlers for the DiscountOffersStep
  type DiscountKey = "firstUser" | "festival" | "weekly" | "special";
  const DISC_PREFIX: Record<DiscountKey, string> = {
    firstUser: "firstUserDiscount",
    festival: "festivalOffers",
    weekly: "weeklyMonthlyOffers",
    special: "specialOffers",
  };
  const discountOffers = {
    firstUser: {
      enabled: formData.firstUserDiscount,
      type: formData.firstUserDiscountType,
      value: formData.firstUserDiscountValue,
      finalPrice: "",
    },
    festival: {
      enabled: formData.festivalOffers,
      type: formData.festivalOffersType,
      value: formData.festivalOffersValue,
      finalPrice: "",
    },
    weekly: {
      enabled: formData.weeklyMonthlyOffers,
      type: formData.weeklyMonthlyOffersType,
      value: formData.weeklyMonthlyOffersValue,
      finalPrice: "",
    },
    special: {
      enabled: formData.specialOffers,
      type: formData.specialOffersType,
      value: formData.specialOffersValue,
      finalPrice: "",
    },
  };
  const handleDiscountToggle = (key: DiscountKey) => {
    const field = DISC_PREFIX[key];
    setFormData((p) => ({ ...p, [field]: !(p as any)[field] }));
  };
  const handleDiscountChange = (key: DiscountKey, field: string, value: string) => {
    const suffix = field === "type" ? "Type" : field === "value" ? "Value" : "FinalPrice";
    setFormData((p) => ({ ...p, [`${DISC_PREFIX[key]}${suffix}`]: value }));
  };

  // Location data for SearchableSelect
  const locationData = useCountriesData();
  const locationCountry = useMemo(
    () => locationData.find((c: any) => c.name === (formData.locality || "India")),
    [locationData, formData.locality],
  );
  const stateOptions = useMemo(
    () =>
      ((locationCountry as any)?.states ?? []).map((st: any) => ({
        label: st.name,
        value: st.name,
      })),
    [locationCountry],
  );
  const cityOptions = useMemo(() => {
    const st = (locationCountry as any)?.states?.find((s: any) => s.name === formData.state);
    return (st?.cities ?? []).map((ct: any) => ({ label: ct.name, value: ct.name }));
  }, [locationCountry, formData.state]);

  const currentTab = TABS.find((t) => t.key === activeTab);

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <DashboardLayout
      title="Add Offering"
      contentClassName="flex-1 overflow-y-auto p-4 lg:p-6 pb-24"
    >
      <div className="max-w-3xl mx-auto flex flex-col gap-5 pb-20">
        {/* ── Header: title + close + tab badge ── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1
              style={{
                fontSize: "clamp(22px, 3.4vw, 28px)",
                fontWeight: 800,
                color: BLACK,
                letterSpacing: "-0.025em",
                lineHeight: 1.2,
              }}
            >
              Add Offering
            </h1>
            <p style={{ fontSize: 13.5, color: GRAY_500, marginTop: 4 }}>
              {step === 0
                ? "Pick what kind of service you'd like to list."
                : `${STEPS[step].label} · Step ${step + 1} of ${STEPS.length}`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/offering")}
            aria-label="Close"
            style={{
              width: 36,
              height: 36,
              borderRadius: 99,
              backgroundColor: SURFACE,
              border: `1.5px solid ${GRAY_200}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <X size={16} color={GRAY_500} />
          </button>
        </div>

        {/* ── Progress dots ── */}
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <React.Fragment key={s.key}>
                <button
                  type="button"
                  onClick={() => i < step && setStep(i)} // can jump back, not forward
                  disabled={i > step}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 10px",
                    borderRadius: 999,
                    border: `1.5px solid ${active ? TEAL : done ? `${TEAL}50` : GRAY_200}`,
                    backgroundColor: active ? `${TEAL}14` : done ? `${TEAL}08` : WHITE,
                    fontSize: 11,
                    fontWeight: 700,
                    color: active ? TEAL : done ? TEAL : GRAY_400,
                    cursor: i < step ? "pointer" : "default",
                    whiteSpace: "nowrap",
                    transition: "all 0.15s",
                  }}
                >
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      backgroundColor: active ? TEAL : done ? TEAL : GRAY_200,
                      color: active || done ? WHITE : GRAY_400,
                      fontSize: 9.5,
                      fontWeight: 800,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {done ? <Check size={10} strokeWidth={3} /> : i + 1}
                  </span>
                  <span className="hidden sm:inline">{s.short}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <span
                    aria-hidden="true"
                    style={{
                      flex: 1,
                      height: 2,
                      borderRadius: 99,
                      backgroundColor: done ? TEAL : GRAY_200,
                      minWidth: 8,
                      opacity: 0.6,
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* ── Step content card ── */}
        <div
          style={{
            backgroundColor: WHITE,
            border: `1.5px solid ${GRAY_200}`,
            borderRadius: 20,
            padding: "24px 22px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
            minHeight: 360,
          }}
        >
          {/* ============ STEP 0 — Service Type =============== */}
          {step === 0 && (
            <div className="flex flex-col gap-4">
              <div>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: GRAY_400,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Start here
                </p>
                <h2
                  className="font-serif"
                  style={{ fontSize: 22, fontWeight: 600, color: BLACK, marginTop: 4 }}
                >
                  What kind of service are you adding?
                </h2>
                <p style={{ fontSize: 13, color: GRAY_500, marginTop: 4 }}>
                  Pick one — you can list more services later from your dashboard.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                {TABS.filter((t) => enabledSections[t.section]).map((tab) => {
                  const active = activeTab === tab.key;
                  const blurb =
                    tab.key === "camper-van"
                      ? "Vehicles available for hire — vans, RVs, motorhomes."
                      : tab.key === "unique-stay"
                        ? "Villas, cabins, treehouses and other non-hotel stays."
                        : "Tours, treks, workshops and outdoor experiences.";
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      style={{
                        textAlign: "left",
                        padding: "18px 18px 20px",
                        borderRadius: 16,
                        border: `2px solid ${active ? TEAL : GRAY_200}`,
                        backgroundColor: active ? `${TEAL}08` : WHITE,
                        boxShadow: active
                          ? `0 0 0 4px ${TEAL}1f, 0 2px 12px rgba(0,0,0,0.05)`
                          : "0 1px 3px rgba(0,0,0,0.04)",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 13,
                          backgroundColor: active ? TEAL : SURFACE,
                          border: `1.5px solid ${active ? TEAL : GRAY_200}`,
                          color: active ? WHITE : GRAY_500,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: 12,
                          transition: "all 0.15s",
                        }}
                      >
                        {React.cloneElement(tab.icon as any, { size: 22 })}
                      </div>
                      <p
                        style={{
                          fontSize: 15,
                          fontWeight: 800,
                          color: BLACK,
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {tab.label}
                      </p>
                      <p style={{ fontSize: 12, color: GRAY_500, marginTop: 4, lineHeight: 1.5 }}>
                        {blurb}
                      </p>
                      {active && (
                        <span
                          className="inline-flex items-center gap-1 mt-3"
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            color: TEAL,
                          }}
                        >
                          <Check size={12} strokeWidth={3} /> SELECTED
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ============ STEP 1 — Category =============== */}
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <div>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: GRAY_400,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {currentTab?.label}
                </p>
                <h2
                  className="font-serif"
                  style={{ fontSize: 22, fontWeight: 600, color: BLACK, marginTop: 4 }}
                >
                  {activeTab === "activity" ? "Choose an activity type" : "Choose a category"}
                </h2>
                <p style={{ fontSize: 13, color: GRAY_500, marginTop: 4 }}>
                  This helps guests find your listing when they filter searches.
                </p>
              </div>

              {activeTab === "camper-van" ? (
                <CaravanCategoryStep
                  embedded
                  category={formData.category || null}
                  onSelect={(name) => set("category", name)}
                />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {(categories.length > 0 ? categories : ["Loading…"]).map((c) => {
                    const active = formData.category === c;
                    const disabled = c === "Loading…";
                    return (
                      <button
                        key={c}
                        type="button"
                        disabled={disabled}
                        onClick={() => set("category", c)}
                        style={{
                          padding: "12px 14px",
                          borderRadius: 13,
                          border: `1.5px solid ${active ? TEAL : GRAY_200}`,
                          backgroundColor: active ? `${TEAL}10` : WHITE,
                          color: active ? TEAL : disabled ? GRAY_400 : BLACK,
                          fontSize: 13,
                          fontWeight: active ? 700 : 500,
                          cursor: disabled ? "not-allowed" : "pointer",
                          textAlign: "left",
                          transition: "all 0.15s",
                          boxShadow: active ? `0 0 0 3px ${TEAL}1a` : "none",
                        }}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ============ STEP 2 — Basics + Photos =============== */}
          {step === 2 && (
            <CaravanDescriptionStep
              embedded
              nameLabel={
                activeTab === "activity"
                  ? "Activity Name"
                  : activeTab === "unique-stay"
                    ? "Property Name"
                    : "Caravan Name"
              }
              namePlaceholder={
                activeTab === "activity"
                  ? "e.g. River Rafting Day Trip"
                  : activeTab === "unique-stay"
                    ? "e.g. Sunset Villa"
                    : "e.g. Cozy Mountain Camper"
              }
              name={activeTab === "activity" ? formData.activityName : formData.name}
              description={formData.description}
              rules={formData.rules}
              photos={formData.photos.gallery}
              coverImage={formData.photos.cover ? [formData.photos.cover] : []}
              errors={{ ...errors, coverImage: errors.cover, photos: errors.gallery }}
              onNameChange={(v) => set(activeTab === "activity" ? "activityName" : "name", v)}
              onDescriptionChange={(v) => set("description", v)}
              onAddRule={onAddRule}
              onRemoveRule={onRemoveRule}
              onUpdateRule={onUpdateRule}
              onPhotoUpload={onGalleryUploadBridge}
              onCoverUpload={onCoverUploadBridge}
              onRemovePhoto={onRemovePhotoBridge}
              onRemoveCover={onRemoveCoverBridge}
              clearError={clearError}
            />
          )}

          {/* ============ STEP 3 — Features =============== */}
          {step === 3 && (
            <div className="flex flex-col gap-4">
              <div>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: GRAY_400,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {currentTab?.label}
                </p>
                <h2
                  className="font-serif"
                  style={{ fontSize: 22, fontWeight: 600, color: BLACK, marginTop: 4 }}
                >
                  What does it include?
                </h2>
                <p style={{ fontSize: 13, color: GRAY_500, marginTop: 4 }}>
                  Tick everything that applies — guests use these as filters.
                </p>
              </div>
              {features.length === 0 ? (
                <p style={{ fontSize: 13, color: GRAY_400 }}>Loading features…</p>
              ) : (
                <div className="flex flex-wrap gap-2.5">
                  {features.map((f) => (
                    <FeaturePill
                      key={f}
                      label={f}
                      selected={formData.features.includes(f)}
                      onClick={() => toggleFeature(f)}
                    />
                  ))}
                </div>
              )}
              {formData.features.length > 0 && (
                <p style={{ fontSize: 11.5, color: GRAY_400, marginTop: 4 }}>
                  <Sparkles size={11} className="inline" /> {formData.features.length} feature
                  {formData.features.length === 1 ? "" : "s"} selected
                </p>
              )}
            </div>
          )}

          {/* ============ STEP 4 — Location & Capacity =============== */}
          {step === 4 && (
            <div className="flex flex-col gap-5">
              {activeTab === "camper-van" ? (
                <CaravanCapacityAddressStep
                  embedded
                  seatingCapacity={Number(formData.seatingCapacity) || 1}
                  sleepingCapacity={Number(formData.sleepingCapacity) || 0}
                  address={formData.address}
                  locality={formData.locality || "India"}
                  state={formData.state}
                  city={formData.city}
                  pincode={formData.pincode}
                  locationData={locationData}
                  mapSrc=""
                  errors={errors}
                  onAdjustCapacity={adjustCapacity}
                  onAddressChange={(v) => set("address", v)}
                  onLocalityChange={(v) =>
                    setFormData((p) => ({ ...p, locality: v, state: "", city: "" }))
                  }
                  onStateChange={(v) => setFormData((p) => ({ ...p, state: v, city: "" }))}
                  onCityChange={(v) => set("city", v)}
                  onPincodeChange={(v) => set("pincode", v.replace(/\D/g, ""))}
                  clearError={clearError}
                />
              ) : (
                <>
                  <div>
                    <p
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: GRAY_400,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      {currentTab?.label}
                    </p>
                    <h2
                      className="font-serif"
                      style={{ fontSize: 22, fontWeight: 600, color: BLACK, marginTop: 4 }}
                    >
                      Where is it located?
                    </h2>
                  </div>
                  <Field label="Street Address" required>
                    <StyledInput
                      value={formData.address}
                      onChange={(v) => set("address", v)}
                      placeholder="Street address"
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="State" required error={errors.state}>
                      <SearchableSelect
                        value={formData.state}
                        onChange={(v) => setFormData((p) => ({ ...p, state: v, city: "" }))}
                        options={stateOptions}
                        placeholder="Select State"
                        searchPlaceholder="Search states…"
                        error={!!errors.state}
                      />
                    </Field>
                    <Field label="City" required error={errors.city}>
                      <SearchableSelect
                        value={formData.city}
                        onChange={(v) => set("city", v)}
                        options={cityOptions}
                        placeholder={formData.state ? "Select City" : "Pick a state first"}
                        searchPlaceholder="Search cities…"
                        disabled={!formData.state}
                        error={!!errors.city}
                      />
                    </Field>
                  </div>
                  <Field label="Pincode">
                    <StyledInput
                      value={formData.pincode}
                      onChange={(v) => set("pincode", v.replace(/\D/g, ""))}
                      placeholder="6-digit code"
                      maxLength={6}
                    />
                  </Field>
                  {activeTab === "unique-stay" && (
                    <Field label="Guest Capacity">
                      <StyledInput
                        value={String(formData.guestCapacity)}
                        onChange={(v) => set("guestCapacity", Number(v) || 1)}
                        placeholder="1"
                        type="number"
                      />
                    </Field>
                  )}
                  {activeTab === "activity" && (
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Persons (max)">
                        <StyledInput
                          value={String(formData.personCapacity)}
                          onChange={(v) => set("personCapacity", Number(v) || 1)}
                          placeholder="1"
                          type="number"
                        />
                      </Field>
                      <Field label="Duration" required error={errors.timeDuration}>
                        <StyledInput
                          value={formData.timeDuration}
                          onChange={(v) => set("timeDuration", v)}
                          placeholder="e.g. 2 Hours"
                          error={!!errors.timeDuration}
                        />
                      </Field>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ============ STEP 5 — Pricing + Discount =============== */}
          {step === 5 && (
            <div className="flex flex-col gap-6">
              <div>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: GRAY_400,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  {currentTab?.label}
                </p>
                <h2
                  className="font-serif"
                  style={{ fontSize: 22, fontWeight: 600, color: BLACK, marginTop: 4 }}
                >
                  Set your pricing
                </h2>
                <p style={{ fontSize: 13, color: GRAY_500, marginTop: 4 }}>
                  Discounts are optional and can be edited anytime.
                </p>
              </div>

              <SectionCard
                icon={<Tag size={16} color={TEAL} strokeWidth={2.5} />}
                title="Pricing"
                subtitle="What you'll charge"
              >
                {activeTab === "camper-van" && (
                  <CamperVanPricing
                    formData={formData}
                    set={set}
                    errors={errors}
                    {...arrayHelpers}
                  />
                )}
                {activeTab === "unique-stay" && (
                  <UniqueStayPricing
                    formData={formData}
                    set={set}
                    errors={errors}
                    {...arrayHelpers}
                  />
                )}
                {activeTab === "activity" && (
                  <ActivityPricing
                    formData={formData}
                    set={set}
                    errors={errors}
                    {...arrayHelpers}
                  />
                )}
              </SectionCard>

              <SectionCard
                icon={<Sparkles size={16} color={TEAL} strokeWidth={2.5} />}
                title="Discounts"
                subtitle="Optional — toggle any offer to enable"
              >
                <DiscountOffersStep
                  embedded
                  offers={discountOffers as any}
                  onToggle={handleDiscountToggle}
                  onOfferChange={handleDiscountChange as any}
                  errors={errors}
                  weeklyLabel="Weekly / Monthly Offers"
                />
              </SectionCard>
            </div>
          )}

          {/* ============ STEP 6 — Review =============== */}
          {step === 6 && (
            <div className="flex flex-col gap-4">
              <div>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: GRAY_400,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Final check
                </p>
                <h2
                  className="font-serif"
                  style={{ fontSize: 22, fontWeight: 600, color: BLACK, marginTop: 4 }}
                >
                  Review your listing
                </h2>
                <p style={{ fontSize: 13, color: GRAY_500, marginTop: 4 }}>
                  Looks good? Submit for review. You can edit it after approval.
                </p>
              </div>

              {[
                {
                  label: "Type",
                  jumpTo: 0,
                  rows: [["Service type", currentTab?.label]],
                },
                {
                  label: "Category",
                  jumpTo: 1,
                  rows: [["Category", formData.category || "—"]],
                },
                {
                  label: "Basics",
                  jumpTo: 2,
                  rows: [
                    ["Name", activeTab === "activity" ? formData.activityName : formData.name],
                    [
                      "Description",
                      (formData.description || "").slice(0, 120) +
                        (formData.description.length > 120 ? "…" : ""),
                    ],
                    ["Cover photo", formData.photos.cover ? "✓ Uploaded" : "Missing"],
                    ["Gallery", `${formData.photos.gallery.length} photos`],
                  ],
                },
                {
                  label: "Features",
                  jumpTo: 3,
                  rows: [
                    [
                      "Selected",
                      formData.features.length > 0 ? formData.features.join(", ") : "None",
                    ],
                  ],
                },
                {
                  label: "Location & Capacity",
                  jumpTo: 4,
                  rows: [
                    [
                      "Where",
                      [formData.address, formData.city, formData.state, formData.pincode]
                        .filter(Boolean)
                        .join(", ") || "—",
                    ],
                    ...(activeTab === "camper-van"
                      ? [
                          [
                            "Capacity",
                            `${formData.seatingCapacity} seating · ${formData.sleepingCapacity} sleeping`,
                          ],
                        ]
                      : activeTab === "unique-stay"
                        ? [["Guests", String(formData.guestCapacity)]]
                        : [
                            ["Persons", String(formData.personCapacity)],
                            ["Duration", formData.timeDuration || "—"],
                          ]),
                  ] as [string, string][],
                },
                {
                  label: "Pricing",
                  jumpTo: 5,
                  rows: (() => {
                    if (activeTab === "camper-van") {
                      return [
                        ["Per Km", formData.perKmCharge ? `₹${formData.perKmCharge}` : "—"],
                        ["Per Day", formData.perDayCharge ? `₹${formData.perDayCharge}` : "—"],
                      ] as [string, string][];
                    }
                    return [
                      ["Regular price", formData.regularPrice ? `₹${formData.regularPrice}` : "—"],
                    ] as [string, string][];
                  })(),
                },
              ].map((section) => (
                <div
                  key={section.label}
                  style={{
                    border: `1.5px solid ${GRAY_200}`,
                    borderRadius: 14,
                    padding: "14px 16px",
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        color: GRAY_400,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {section.label}
                    </p>
                    <button
                      type="button"
                      onClick={() => setStep(section.jumpTo)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 11.5,
                        fontWeight: 700,
                        color: TEAL,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      <Edit2 size={11} /> Edit
                    </button>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {section.rows.map(([k, v]) => (
                      <div key={k} className="flex gap-3" style={{ fontSize: 13 }}>
                        <span
                          style={{
                            color: GRAY_400,
                            minWidth: 110,
                            flexShrink: 0,
                          }}
                        >
                          {k}
                        </span>
                        <span style={{ color: BLACK, fontWeight: 500 }}>{v || "—"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {errors.submit && (
                <div
                  style={{
                    padding: "12px 16px",
                    borderRadius: 12,
                    backgroundColor: ERROR_BG,
                    border: "1.5px solid #fca5a5",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 12 12" fill="none">
                    <circle cx="6" cy="6" r="5.25" stroke={ERROR} strokeWidth="1.5" />
                    <path
                      d="M6 3.5v3M6 8.25v.25"
                      stroke={ERROR}
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  <p style={{ fontSize: 13, fontWeight: 600, color: ERROR }}>{errors.submit}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer / nav ── */}
        <div
          className="flex items-center justify-between gap-3"
          style={{
            position: "sticky",
            bottom: 0,
            padding: "12px 0",
          }}
        >
          <button
            type="button"
            onClick={step === 0 ? () => navigate("/offering") : onPrev}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              height: 44,
              padding: "0 18px",
              borderRadius: 13,
              border: `1.5px solid ${GRAY_200}`,
              backgroundColor: WHITE,
              fontSize: 13,
              fontWeight: 700,
              color: GRAY_500,
              cursor: "pointer",
            }}
          >
            <ChevronLeft size={16} /> {step === 0 ? "Cancel" : "Back"}
          </button>

          <p style={{ fontSize: 12, color: GRAY_400, fontWeight: 600 }}>
            Step {step + 1} of {STEPS.length}
          </p>

          <button
            type="button"
            onClick={onNext}
            disabled={!stepCanAdvance || isSubmitting}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              height: 44,
              padding: "0 24px",
              borderRadius: 13,
              border: "none",
              backgroundColor: TEAL,
              fontSize: 13.5,
              fontWeight: 800,
              color: WHITE,
              cursor: !stepCanAdvance || isSubmitting ? "not-allowed" : "pointer",
              opacity: !stepCanAdvance || isSubmitting ? 0.5 : 1,
              boxShadow: "0 4px 16px rgba(13, 148, 136, 0.30)",
              transition: "all 0.15s",
            }}
          >
            {isLastStep ? (
              isSubmitting ? (
                "Submitting…"
              ) : (
                <>
                  <Check size={16} strokeWidth={3} /> Submit Offering
                </>
              )
            ) : (
              <>
                Continue <ChevronRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Success toast */}
      {showSuccessAlert && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 50,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "14px 20px",
            borderRadius: 16,
            backgroundColor: "#16a34a",
            color: WHITE,
            fontSize: 14,
            fontWeight: 700,
            boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
          }}
        >
          <Check size={16} strokeWidth={3} /> Offering submitted successfully!
        </div>
      )}
    </DashboardLayout>
  );
};

export default AddOfferings;
