import React, { useEffect, useMemo, useState } from "react";
import { useHomepageSections } from "@/hooks/useHomepageSections";
import { useOfferingCatalog } from "@/hooks/useOfferingCatalog";
import { useCountriesData } from "@/hooks/useCountriesData";
import { useQueryClient } from "@tanstack/react-query";
import {
  Check,
  ClipboardCheck,
  Images,
  IndianRupee,
  Layers,
  ListChecks,
  MapPin,
  Sparkles,
  Tag,
  Tent,
  type LucideIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import {
  BRAND_VARS,
  CONTROL,
  CONTROL_ERROR,
  Field,
  PANEL,
  Panel,
  PanelHead,
} from "@/components/shared";
import { cn } from "@/lib/utils";
import { offersApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { PiVanBold } from "react-icons/pi";
import { GiBinoculars } from "react-icons/gi";

import {
  CamperVanPricing,
  UniqueStayPricing,
  ActivityPricing,
  ChoiceTile,
  FeatureChip,
  ReviewSection,
  SubPanel,
  WizardError,
  WizardFooter,
  WizardRail,
  type WizardStep,
} from "@/components/offering";
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

// Camper-van vehicle types are CMS-driven (CMS → Features → Camper Van →
// Categories, same feed as caravan onboarding); this list is only the fallback
// for when an admin hasn't added any yet. Camper-van features are still inline.
// Keep in step with FALLBACK_CATEGORIES in onboarding/caravan/CategoryStep.tsx.
const CAMPER_VAN_CATEGORIES = [
  "Motorhome",
  "Campervan / Caravan",
  "Travel Trailer",
  "Off Road Caravan",
  "Mini Caravan",
];

// Fallback only, for a CMS with no Camper Van features yet. Keep in step with
// FALLBACK_FEATURES in onboarding/caravan/FeaturesStep.tsx.
const CAMPER_VAN_FEATURES = [
  "Air Conditioning",
  "Heating",
  "Sofa / Lounge Seating",
  "Recliner Seats",
  "Storage Cabinets",
  "Double Bed",
  "Single Beds",
  "Bunk Beds",
  "Sofa Cum Bed",
  "Pillows",
  "Blankets",
  "Induction Stove / Gas Stove",
  "Microwave",
  "Refrigerator",
  "Basic Kitchen Utensils",
  "Bathroom",
  "Toilet",
  "Hot Water / Geyser",
  "Wash Basin",
  "Mirror",
  "Toiletries",
  "TV",
  "Wi-Fi",
  "Speaker",
  "Charging Points",
  "Generator",
  "Power Backup",
  "Exterior Lights",
  "Drinking Water Facility",
  "Fire Extinguisher",
  "First Aid Kit",
  "CCTV",
  "GPS Tracking",
  "Awning",
  "Outdoor Kitchen",
  "BBQ",
  "Rooftop Terrace",
  "Camping Chairs",
  "Camping Table",
  "Wheelchair Accessible",
];

// ═════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════
// Wizard step definitions. Step 0 is the type picker — the rest are
// type-aware (e.g. step 4 renders different capacity inputs for stays vs
// camper-van). Keep this list short — every additional step is a click the
// vendor has to make.
// Each entry carries its rail label, the panel heading it renders, and the icon
// that fronts both — so the rail and the card can never describe a step
// differently.
const STEPS: WizardStep[] = [
  {
    key: "type",
    label: "Service type",
    short: "Type",
    icon: Layers,
    title: "What are you listing?",
    blurb: "Pick one — you can add more services later from your dashboard.",
  },
  {
    key: "category",
    label: "Category",
    short: "Category",
    icon: Tag,
    title: "Choose a category",
    blurb: "This is how guests find your listing when they filter a search.",
  },
  {
    key: "basics",
    label: "Basics & photos",
    short: "Basics",
    icon: Images,
    title: "Basics and photos",
    blurb: "Name it, describe it, and add the photos guests see first.",
  },
  {
    key: "features",
    label: "Features",
    short: "Features",
    icon: ListChecks,
    title: "What does it include?",
    blurb: "Tick everything that applies — guests use these as filters.",
  },
  {
    key: "location",
    label: "Location & capacity",
    short: "Location",
    icon: MapPin,
    title: "Where is it, and how many fit?",
    blurb: "Guests see the city and state before they book.",
  },
  {
    key: "pricing",
    label: "Pricing & discounts",
    short: "Pricing",
    icon: IndianRupee,
    title: "Set your pricing",
    blurb: "Discounts are optional and can be edited any time.",
  },
  {
    key: "review",
    label: "Review & submit",
    short: "Review",
    icon: ClipboardCheck,
    title: "Review your listing",
    blurb: "Looks good? Submit for review — you can edit it after approval.",
  },
];

/* ── Local presentational pieces ──────────────────────────────────────────────
   Deliberately local: `components/offering/ui.tsx` (SectionCard / FeaturePill /
   StyledInput) is shared with the PUBLIC onboarding flows, where `th-brand` is
   the navy site brand — restyling those to console teal would repaint the
   public pages too. The embedded onboarding steps below are left alone for the
   same reason.                                                               */

const AddOfferings = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { token } = useAuth();
  const [step, setStep] = useState(0);
  const [activeTab, setActiveTab] = useState("camper-van");
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

      // `/offerings` was never a route — submitting dropped the vendor on the
      // catch-all. The listings page is `/offering`.
      toast.success("Offering submitted for review");
      navigate("/offering");
    } catch {
      setErrors({ submit: "Failed to submit. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // All three tabs' categories come from the CMS via useOfferingCatalog (same
  // source as the onboarding flows); camper-van falls back to the inline
  // vehicle taxonomy until an admin adds Camper Van categories.
  const catalog = useOfferingCatalog();
  const baseCategories = useMemo(() => {
    const fromCms = catalog.categories[activeTab] || [];
    if (activeTab !== "camper-van") return fromCms;
    return fromCms.length ? fromCms : CAMPER_VAN_CATEGORIES;
  }, [activeTab, catalog.categories]);
  const baseFeatures = useMemo(() => {
    const fromCms = catalog.features[activeTab] || [];
    if (activeTab !== "camper-van") return fromCms;
    return fromCms.length ? fromCms : CAMPER_VAN_FEATURES;
  }, [activeTab, catalog.features]);

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
  // Only the selected country's states/cities are fetched (see useCountriesData).
  const locationData = useCountriesData(formData.locality || "India");
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
  const stepMeta = STEPS[step];
  const StepIcon = stepMeta.icon;

  /* Two headings are type-aware; the rest read the same whatever you're
     listing, so they stay in the STEPS table. */
  const stepTitle =
    step === 1 && activeTab === "activity" ? "Choose an activity type" : stepMeta.title;

  const catalogLoading = step === 1 && categories.length === 0;

  const TYPE_BLURBS: Record<string, string> = {
    "camper-van": "Vehicles available for hire — vans, RVs, motorhomes.",
    "unique-stay": "Villas, cabins, treehouses and other non-hotel stays.",
    activity: "Tours, treks, workshops and outdoor experiences.",
  };

  /** Review rows, per section, with the step each one jumps back to. */
  const reviewSections: { label: string; jumpTo: number; rows: [string, string | undefined][] }[] =
    [
      { label: "Type", jumpTo: 0, rows: [["Service type", currentTab?.label]] },
      { label: "Category", jumpTo: 1, rows: [["Category", formData.category || "—"]] },
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
          ["Cover photo", formData.photos.cover ? "Uploaded" : "Missing"],
          ["Gallery", `${formData.photos.gallery.length} photos`],
        ],
      },
      {
        label: "Features",
        jumpTo: 3,
        rows: [["Selected", formData.features.length > 0 ? formData.features.join(", ") : "None"]],
      },
      {
        label: "Location & capacity",
        jumpTo: 4,
        rows: [
          [
            "Where",
            [formData.address, formData.city, formData.state, formData.pincode]
              .filter(Boolean)
              .join(", ") || "—",
          ],
          ...((activeTab === "camper-van"
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
                ]) as [string, string][]),
        ],
      },
      {
        label: "Pricing",
        jumpTo: 5,
        rows:
          activeTab === "camper-van"
            ? [
                ["Per km", formData.perKmCharge ? `₹${formData.perKmCharge}` : "—"],
                ["Per day", formData.perDayCharge ? `₹${formData.perDayCharge}` : "—"],
              ]
            : [["Regular price", formData.regularPrice ? `₹${formData.regularPrice}` : "—"]],
      },
    ];

  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <DashboardLayout
      title="Add Offering"
    >
      {/* pb clears the fixed MobileVendorNav on small screens. */}
      <div style={BRAND_VARS} className="max-w-6xl mx-auto">
        <div className="grid gap-5 lg:gap-7 lg:grid-cols-[254px_minmax(0,1fr)]">
          {/* ── Left rail: where you are, and how far there is to go ── */}
          <WizardRail
            steps={STEPS}
            current={step}
            onJump={setStep}
            title={step === 0 ? "New listing" : (currentTab?.label ?? "New listing")}
            exitLabel="Discard and exit"
            onExit={() => navigate("/offering")}
            pillId="addOfferingStepPill"
          />

          {/* ── The step ── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="min-w-0"
            >
              <Panel>
                <PanelHead icon={StepIcon} title={stepTitle} blurb={stepMeta.blurb} />

                <div className="p-5">
                  {/* ============ STEP 0 — Service type =============== */}
                  {step === 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {TABS.filter((t) => enabledSections[t.section]).map((tab) => {
                        const active = activeTab === tab.key;
                        return (
                          <motion.button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key)}
                            aria-pressed={active}
                            whileTap={{ scale: 0.985 }}
                            transition={{ type: "spring", stiffness: 520, damping: 30 }}
                            className={cn(
                              "flex flex-col items-start gap-3 p-4 rounded-2xl border bg-card text-left",
                              "outline-none transition-[border-color,box-shadow] duration-150",
                              "focus-visible:ring-4 focus-visible:ring-brand/15",
                              active
                                ? "border-brand ring-4 ring-brand/10"
                                : "border-border hover:border-border shadow-[0_1px_2px_rgba(16,24,40,0.04)]",
                            )}
                          >
                            <span
                              className={cn(
                                "grid place-items-center w-11 h-11 rounded-[14px] shrink-0",
                                "transition-colors duration-150",
                                active
                                  ? "bg-brand text-brand-fg"
                                  : "bg-muted text-muted-foreground",
                              )}
                            >
                              {React.cloneElement(tab.icon as any, { size: 20 })}
                            </span>
                            <span className="min-w-0">
                              <span className="flex items-center gap-1.5">
                                <span
                                  className={cn(
                                    "text-[14px] font-bold tracking-[-0.01em]",
                                    active ? "text-brand" : "text-foreground",
                                  )}
                                >
                                  {tab.label}
                                </span>
                                {active && (
                                  <Check size={13} strokeWidth={3} className="text-brand" />
                                )}
                              </span>
                              <span className="mt-1 block text-[12.5px] leading-relaxed text-muted-foreground">
                                {TYPE_BLURBS[tab.key]}
                              </span>
                            </span>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}

                  {/* ============ STEP 1 — Category =============== */}
                  {step === 1 &&
                    (activeTab === "camper-van" ? (
                      <CaravanCategoryStep
                        embedded
                        category={formData.category || null}
                        dynamicCategories={catalog.camperVanCategories}
                        categoriesLoading={catalog.camperVanCategoriesLoading}
                        onSelect={(name) => set("category", name)}
                      />
                    ) : catalogLoading ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {[0, 1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="h-[42px] rounded-xl bg-muted animate-pulse" />
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {categories.map((c) => (
                          <ChoiceTile
                            key={c}
                            label={c}
                            selected={formData.category === c}
                            onClick={() => set("category", c)}
                          />
                        ))}
                      </div>
                    ))}

                  {/* ============ STEP 2 — Basics + photos =============== */}
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
                      onNameChange={(v) =>
                        set(activeTab === "activity" ? "activityName" : "name", v)
                      }
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
                    <div className="space-y-4">
                      {features.length === 0 ? (
                        <div className="flex flex-wrap gap-2.5">
                          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                            <div key={i} className="h-9 w-24 rounded-full bg-muted animate-pulse" />
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2.5">
                          {features.map((f) => (
                            <FeatureChip
                              key={f}
                              label={f}
                              selected={formData.features.includes(f)}
                              onClick={() => toggleFeature(f)}
                            />
                          ))}
                        </div>
                      )}
                      {formData.features.length > 0 && (
                        <p className="flex items-center gap-1.5 text-[11.5px] font-semibold text-brand">
                          <Sparkles size={12} strokeWidth={2.3} />
                          {formData.features.length} feature
                          {formData.features.length === 1 ? "" : "s"} selected
                        </p>
                      )}
                    </div>
                  )}

                  {/* ============ STEP 4 — Location & capacity =============== */}
                  {step === 4 &&
                    (activeTab === "camper-van" ? (
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
                      <div className="space-y-4">
                        <Field label="Street address" htmlFor="offering-address">
                          <Input
                            id="offering-address"
                            value={formData.address}
                            onChange={(e) => set("address", e.target.value)}
                            placeholder="Street address"
                            className={cn("h-11", CONTROL)}
                          />
                        </Field>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Field label="State" error={errors.state}>
                            <SearchableSelect
                              value={formData.state}
                              onChange={(v) => setFormData((p) => ({ ...p, state: v, city: "" }))}
                              options={stateOptions}
                              placeholder="Select state"
                              searchPlaceholder="Search states…"
                              error={!!errors.state}
                            />
                          </Field>
                          <Field label="City" error={errors.city}>
                            <SearchableSelect
                              value={formData.city}
                              onChange={(v) => set("city", v)}
                              options={cityOptions}
                              placeholder={formData.state ? "Select city" : "Pick a state first"}
                              searchPlaceholder="Search cities…"
                              disabled={!formData.state}
                              error={!!errors.city}
                            />
                          </Field>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <Field label="Pincode" htmlFor="offering-pincode">
                            <Input
                              id="offering-pincode"
                              value={formData.pincode}
                              onChange={(e) => set("pincode", e.target.value.replace(/\D/g, ""))}
                              placeholder="6-digit code"
                              maxLength={6}
                              inputMode="numeric"
                              className={cn("h-11", CONTROL)}
                            />
                          </Field>

                          {activeTab === "unique-stay" && (
                            <Field label="Guest capacity" htmlFor="offering-guests">
                              <Input
                                id="offering-guests"
                                type="number"
                                min={1}
                                value={String(formData.guestCapacity)}
                                onChange={(e) => set("guestCapacity", Number(e.target.value) || 1)}
                                placeholder="1"
                                className={cn("h-11", CONTROL)}
                              />
                            </Field>
                          )}

                          {activeTab === "activity" && (
                            <Field label="Persons (max)" htmlFor="offering-persons">
                              <Input
                                id="offering-persons"
                                type="number"
                                min={1}
                                value={String(formData.personCapacity)}
                                onChange={(e) => set("personCapacity", Number(e.target.value) || 1)}
                                placeholder="1"
                                className={cn("h-11", CONTROL)}
                              />
                            </Field>
                          )}
                        </div>

                        {activeTab === "activity" && (
                          <Field
                            label="Duration"
                            htmlFor="offering-duration"
                            error={errors.timeDuration}
                          >
                            <Input
                              id="offering-duration"
                              value={formData.timeDuration}
                              onChange={(e) => set("timeDuration", e.target.value)}
                              placeholder="e.g. 2 Hours"
                              aria-invalid={!!errors.timeDuration}
                              className={cn("h-11", CONTROL, errors.timeDuration && CONTROL_ERROR)}
                            />
                          </Field>
                        )}
                      </div>
                    ))}

                  {/* ============ STEP 5 — Pricing + discounts =============== */}
                  {step === 5 && (
                    <div className="space-y-4">
                      <SubPanel icon={Tag} title="Pricing" blurb="What you'll charge">
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
                      </SubPanel>

                      <SubPanel
                        icon={Sparkles}
                        title="Discounts"
                        blurb="Optional — toggle any offer to enable it"
                      >
                        <DiscountOffersStep
                          embedded
                          offers={discountOffers as any}
                          onToggle={handleDiscountToggle}
                          onOfferChange={handleDiscountChange as any}
                          errors={errors}
                          weeklyLabel="Weekly / Monthly Offers"
                        />
                      </SubPanel>
                    </div>
                  )}

                  {/* ============ STEP 6 — Review =============== */}
                  {step === 6 && (
                    <div className="space-y-3">
                      {reviewSections.map((section) => (
                        <ReviewSection
                          key={section.label}
                          label={section.label}
                          rows={section.rows}
                          onEdit={() => setStep(section.jumpTo)}
                        />
                      ))}

                      {errors.submit && <WizardError message={errors.submit} />}
                    </div>
                  )}
                </div>

                <WizardFooter
                  step={step}
                  total={STEPS.length}
                  canAdvance={stepCanAdvance}
                  busy={isSubmitting}
                  isLastStep={isLastStep}
                  onBack={step === 0 ? () => navigate("/offering") : onPrev}
                  onNext={onNext}
                  backLabel={step === 0 ? "Cancel" : "Back"}
                  submitLabel="Submit offering"
                  busyLabel="Submitting…"
                />
              </Panel>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AddOfferings;
