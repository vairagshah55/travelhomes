import React, { useEffect, useMemo, useState } from "react";
import { useHomepageSections } from "@/hooks/useHomepageSections";
import { useOfferingCatalog } from "@/hooks/useOfferingCatalog";
import { useCountriesData } from "@/hooks/useCountriesData";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Edit2,
  Images,
  IndianRupee,
  Layers,
  ListChecks,
  Loader2,
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ACTIVE_PILL,
  BRAND_VARS,
  BTN_NEUTRAL,
  BTN_PRIMARY,
  CONTROL,
  CONTROL_ERROR,
  Field,
  PANEL,
  PANEL_FOOTER,
  Panel,
  PanelHead,
} from "@/components/shared";
import { cn } from "@/lib/utils";
import { offersApi } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { PiVanBold } from "react-icons/pi";
import { GiBinoculars } from "react-icons/gi";

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
// Each entry carries its rail label, the panel heading it renders, and the icon
// that fronts both — so the rail and the card can never describe a step
// differently.
const STEPS: {
  key: string;
  label: string;
  short: string;
  icon: LucideIcon;
  title: string;
  blurb: string;
}[] = [
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

/** A titled block nested inside a Panel — one step, two or more groupings. */
const SubPanel = ({
  icon: Icon,
  title,
  blurb,
  children,
}: {
  icon: LucideIcon;
  title: string;
  blurb?: string;
  children: React.ReactNode;
}) => (
  <section className="rounded-[14px] border border-border/70 overflow-hidden">
    <header className="flex items-start gap-3 px-4 py-3 border-b border-border/70 bg-muted/40 dark:bg-white/[0.02]">
      <span className="grid place-items-center w-8 h-8 rounded-[10px] bg-brand/10 text-brand shrink-0">
        <Icon size={15} strokeWidth={2.1} />
      </span>
      <div className="min-w-0">
        <p className="text-[13.5px] font-bold text-foreground">{title}</p>
        {blurb && <p className="mt-0.5 text-[12px] text-muted-foreground">{blurb}</p>}
      </div>
    </header>
    <div className="p-4">{children}</div>
  </section>
);

/** Selectable pill — features. Teal fill when on, hairline when off. */
const FeatureChip = ({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={selected}
    className={cn(
      "inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full border text-[12.5px] font-semibold",
      "outline-none transition-[background-color,border-color,box-shadow,color] duration-150",
      "focus-visible:ring-4 focus-visible:ring-brand/15",
      selected
        ? "border-brand bg-brand/[0.09] text-brand"
        : "border-border/70 bg-card text-foreground/80 hover:border-border hover:bg-muted/60",
    )}
  >
    {label}
    {selected && <Check size={12} strokeWidth={3} />}
  </button>
);

/** Rectangular choice tile — categories. */
const ChoiceTile = ({
  label,
  selected,
  disabled,
  onClick,
}: {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-pressed={selected}
    className={cn(
      "px-3.5 py-2.5 rounded-xl border text-left text-[13px] font-semibold",
      "outline-none transition-[background-color,border-color,box-shadow,color] duration-150",
      "focus-visible:ring-4 focus-visible:ring-brand/15 disabled:opacity-50",
      selected
        ? "border-brand bg-brand/[0.07] text-brand"
        : "border-border/70 bg-card text-foreground/80 hover:border-border hover:bg-muted/60",
    )}
  >
    {label}
  </button>
);

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
      contentClassName="flex-1 overflow-y-auto scrollbar-hide p-4 lg:p-6 bg-muted/40 dark:bg-transparent"
    >
      {/* pb clears the fixed MobileVendorNav on small screens. */}
      <div style={BRAND_VARS} className="max-w-6xl mx-auto pb-24 lg:pb-12">
        <div className="grid gap-5 lg:gap-7 lg:grid-cols-[254px_minmax(0,1fr)]">
          {/* ── Left rail: where you are, and how far there is to go ── */}
          <aside className="lg:sticky lg:top-2 self-start space-y-3">
            <div className={cn(PANEL, "p-4")}>
              <div className="flex items-center gap-3">
                <span className="grid place-items-center w-11 h-11 rounded-full bg-brand/[0.1] text-brand shrink-0">
                  <StepIcon size={18} strokeWidth={2.1} />
                </span>
                <div className="min-w-0">
                  <p className="text-[13.5px] font-bold text-foreground truncate">
                    {step === 0 ? "New listing" : currentTab?.label}
                  </p>
                  <p className="mt-0.5 text-[11.5px] tabular-nums text-muted-foreground">
                    Step {step + 1} of {STEPS.length}
                  </p>
                </div>
              </div>

              <div
                className="mt-3.5 h-1.5 rounded-full bg-muted overflow-hidden"
                role="progressbar"
                aria-valuemin={1}
                aria-valuemax={STEPS.length}
                aria-valuenow={step + 1}
              >
                <motion.span
                  className="block h-full rounded-full bg-brand"
                  initial={false}
                  animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                  transition={{ type: "spring", stiffness: 220, damping: 30 }}
                />
              </div>

              <button
                type="button"
                onClick={() => navigate("/offering")}
                className="mt-3 text-[12px] font-semibold text-muted-foreground hover:text-foreground transition-colors duration-150"
              >
                Discard and exit
              </button>
            </div>

            {/* Desktop step rail */}
            <nav
              role="tablist"
              aria-label="Listing steps"
              className={cn(PANEL, "hidden lg:flex flex-col gap-0.5 p-2")}
            >
              {STEPS.map((s, i) => {
                const done = i < step;
                const active = i === step;
                // Jumping back is safe; jumping forward would skip validation.
                const reachable = i <= step;
                return (
                  <button
                    key={s.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    disabled={!reachable}
                    onClick={() => reachable && setStep(i)}
                    className={cn(
                      "group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left",
                      "outline-none transition-colors duration-150",
                      "focus-visible:ring-2 focus-visible:ring-brand/40",
                      !active && reachable && "hover:bg-muted/70 dark:hover:bg-white/[0.04]",
                      !reachable && "cursor-default",
                    )}
                  >
                    {active && (
                      <motion.span
                        layoutId="offeringStepPill"
                        className={ACTIVE_PILL}
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      />
                    )}
                    <span
                      className={cn(
                        "relative grid place-items-center w-7 h-7 rounded-full shrink-0",
                        "text-[11px] font-bold tabular-nums transition-colors duration-150",
                        active
                          ? "bg-brand text-brand-fg"
                          : done
                            ? "bg-brand/15 text-brand"
                            : "bg-muted text-muted-foreground/70",
                      )}
                    >
                      {done ? <Check size={13} strokeWidth={3} /> : i + 1}
                    </span>
                    <span
                      className={cn(
                        "relative min-w-0 text-[13.5px] font-semibold leading-5 truncate",
                        active ? "text-brand" : done ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {s.label}
                    </span>
                  </button>
                );
              })}
            </nav>

            {/* Mobile strip — no sliding pill, so the two rails never share a layoutId */}
            <div
              role="tablist"
              aria-label="Listing steps"
              className="lg:hidden flex items-center gap-1 p-1 overflow-x-auto scrollbar-hide bg-card border border-border/70 rounded-2xl shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
            >
              {STEPS.map((s, i) => {
                const done = i < step;
                const active = i === step;
                const reachable = i <= step;
                return (
                  <button
                    key={s.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    disabled={!reachable}
                    onClick={() => reachable && setStep(i)}
                    className={cn(
                      "flex items-center gap-1.5 h-10 px-3 rounded-xl whitespace-nowrap shrink-0",
                      "text-[12.5px] font-semibold transition-colors duration-150 outline-none",
                      "focus-visible:ring-2 focus-visible:ring-brand/40",
                      active
                        ? "bg-brand/[0.09] text-brand"
                        : done
                          ? "text-foreground"
                          : "text-muted-foreground/70",
                    )}
                  >
                    <span
                      className={cn(
                        "grid place-items-center w-5 h-5 rounded-full text-[10px] font-bold tabular-nums",
                        active
                          ? "bg-brand text-brand-fg"
                          : done
                            ? "bg-brand/15 text-brand"
                            : "bg-muted text-muted-foreground/70",
                      )}
                    >
                      {done ? <Check size={11} strokeWidth={3} /> : i + 1}
                    </span>
                    {s.short}
                  </button>
                );
              })}
            </div>
          </aside>

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
                                : "border-border/70 hover:border-border shadow-[0_1px_2px_rgba(16,24,40,0.04)]",
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
                        <div
                          key={section.label}
                          className="rounded-[14px] border border-border/70 overflow-hidden"
                        >
                          <header className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border/70 bg-muted/40 dark:bg-white/[0.02]">
                            <p className="text-[11px] font-bold uppercase tracking-[0.06em] text-muted-foreground">
                              {section.label}
                            </p>
                            <button
                              type="button"
                              onClick={() => setStep(section.jumpTo)}
                              className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-[12px] font-semibold text-brand hover:bg-brand/[0.09] transition-colors duration-150"
                            >
                              <Edit2 size={11} strokeWidth={2.5} />
                              Edit
                            </button>
                          </header>
                          <dl className="divide-y divide-border/70">
                            {section.rows.map(([k, v]) => {
                              const empty = !v || v === "—" || v === "None";
                              const missing = v === "Missing";
                              return (
                                <div key={k} className="flex gap-3 px-4 py-2.5">
                                  <dt className="w-[110px] shrink-0 text-[12.5px] text-muted-foreground">
                                    {k}
                                  </dt>
                                  <dd
                                    className={cn(
                                      "min-w-0 text-[13px] font-medium break-words",
                                      missing
                                        ? "text-red-600 dark:text-red-400 font-semibold"
                                        : empty
                                          ? "text-muted-foreground/60"
                                          : "text-foreground",
                                    )}
                                  >
                                    {v || "—"}
                                  </dd>
                                </div>
                              );
                            })}
                          </dl>
                        </div>
                      ))}

                      {errors.submit && (
                        <div className="flex items-start gap-2.5 p-3.5 rounded-xl border border-red-300/70 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10">
                          <AlertCircle
                            size={15}
                            strokeWidth={2.3}
                            className="mt-px shrink-0 text-red-600 dark:text-red-400"
                          />
                          <p className="text-[12.5px] font-semibold text-red-700 dark:text-red-300">
                            {errors.submit}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* ── Step navigation ── */}
                <footer className={PANEL_FOOTER}>
                  <Button
                    variant="ghost"
                    onClick={step === 0 ? () => navigate("/offering") : onPrev}
                    className={BTN_NEUTRAL}
                  >
                    <ChevronLeft size={15} strokeWidth={2.4} />
                    {step === 0 ? "Cancel" : "Back"}
                  </Button>

                  {/* Says WHY Continue is dead rather than just greying it out. */}
                  {!stepCanAdvance && !isSubmitting ? (
                    <p className="hidden sm:flex items-center gap-1.5 text-[11.5px] font-medium text-amber-600 dark:text-amber-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Finish this step to continue
                    </p>
                  ) : (
                    <p className="hidden sm:block text-[11.5px] tabular-nums text-muted-foreground">
                      Step {step + 1} of {STEPS.length}
                    </p>
                  )}

                  <Button
                    onClick={onNext}
                    disabled={!stepCanAdvance || isSubmitting}
                    className={cn(BTN_PRIMARY, "disabled:opacity-45 disabled:shadow-none")}
                  >
                    {isLastStep ? (
                      isSubmitting ? (
                        <>
                          <Loader2 size={15} className="animate-spin" />
                          Submitting…
                        </>
                      ) : (
                        <>
                          <Check size={15} strokeWidth={3} />
                          Submit offering
                        </>
                      )
                    ) : (
                      <>
                        Continue
                        <ChevronRight size={15} strokeWidth={2.4} />
                      </>
                    )}
                  </Button>
                </footer>
              </Panel>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AddOfferings;
