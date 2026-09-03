import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { cmsPublicApi } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";
import { toast } from "sonner";
import { submitOnboardingData, getOnboardingData, offersApi } from "@/lib/api";
import { onboardingService } from "@/lib/onboardingService";
import { useCountriesData } from "@/hooks/useCountriesData";
import { useHomepageSections } from "@/hooks/useHomepageSections";
import { useFeatures } from "@/hooks/useFeatures";
import { useUserDetails } from "@/hooks/useUserDetails";

// Shared components
import {
  OnboardingLayout,
  BusinessDetailsStep,
  PersonalDetailsStep,
  TermsConditionsStep,
  DiscountOffersStep,
  COUNTRY_OPTIONS,
  DEFAULT_COUNTRY_OPTION,
} from "@/components/onboarding/shared";
import type {
  CountryOption,
  DiscountOffer,
  OnboardingPhase,
} from "@/components/onboarding/shared";

// Stays-specific step components
import {
  PropertyTypeStep,
  CategorySelectionStep,
  StayDetailsStep,
  FeaturesStep,
  UniqueStayCardPreview,
} from "@/components/onboarding/stays";
import {
  propertyCategories,
  getFeaturesForProperty,
  pickStayDiscount,
} from "@/components/onboarding/stays/stayConfig";
import { submitStayOnboarding } from "@/components/onboarding/stays/submitStayOnboarding";
import { StaysStepRenderer } from "@/components/onboarding/stays/StaysStepRenderer";
import { loadStayDraft } from "@/components/onboarding/stays/loadStayDraft";
import { validateStaysStep } from "@/components/onboarding/stays/validateStaysStep";
import { useStayRulesHandlers } from "@/components/onboarding/stays/useStayRulesHandlers";
import { useStayImageHandlers } from "@/components/onboarding/stays/useStayImageHandlers";
import { useStayFieldHandlers } from "@/components/onboarding/stays/useStayFieldHandlers";
import { useStaySelectionHandlers } from "@/components/onboarding/stays/useStaySelectionHandlers";
import {
  StayCrossTypePendingScreen,
  StayStatusLoading,
  StayStatusScreen,
  StayRejectedBanner,
} from "@/components/onboarding/stays/StayStatusScreens";

const countries = COUNTRY_OPTIONS;

/**
 * Named phases for the progress rail.
 *
 * Caravan passed these and stay didn't, so the stay wizard fell back to
 * OnboardingLayout's unlabelled single-group rail — a row of anonymous ticks
 * with no indication of what the remaining steps cover. Same three-part
 * vocabulary as CARAVAN_PHASES so the two flows read alike.
 *
 * `steps` must sum to `totalSteps - 1` (the terms hand-off isn't a content
 * step). ProgressRail validates that and falls back to one unnamed bar on a
 * mismatch rather than mis-highlighting, so keep this in sync with the step
 * order in StaysStepRenderer:
 *   0 Property type · 1 Category · 2 Stay details · 3 Features
 *   4 Discounts · 5 Business · 6 Personal   (7 Terms — excluded)
 */
const STAY_PHASES: OnboardingPhase[] = [
  { label: "Your stay", steps: 4 },
  { label: "Pricing", steps: 1 },
  { label: "About you", steps: 2 },
];

interface Room {
  id: string;
  name: string;
  description: string;
  photos: string[];
  guestCapacity: number;
  beds: number;
  bathrooms: number;
  price: number;
}

const StaysOnboarding = () => {
  const navigate = useNavigate();
  const { updateUserType, isAuthenticated } = useAuth();

  const { data: homepageSections } = useHomepageSections();
  useEffect(() => {
    if (homepageSections) {
      const section = (homepageSections as any[]).find((s: any) => s.sectionKey === "unique-stays");
      if (section && !section.isVisible) {
        toast.error("Stays onboarding is currently disabled.");
        navigate("/");
      }
    }
    if (!isAuthenticated) {
      toast.error("Please login to continue");
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const STEP_STORAGE_KEY = "stay_onboarding_step";
  const FORM_STORAGE_KEY = "stay_onboarding_form";

  // ─── Restore cached form snapshot (sessionStorage) ─────────────────────────
  // useRef, not a bare IIFE: this only feeds the useState initialisers below, but
  // as a plain expression in the component body it re-read and JSON.parse'd the
  // whole snapshot on EVERY render. The snapshot holds the cover photo and the
  // gallery as base64 data URLs (400KB-1MB each after compression, 2-6MB for a
  // five-photo listing), so every keystroke in a House Rules field paid a
  // multi-megabyte parse — the Listing Setup step became unusable once photos
  // were attached. Reading once per mount is all that was ever needed.
  const _cached = useRef<any>(undefined);
  if (_cached.current === undefined) {
    _cached.current = (() => {
      try {
        const raw = sessionStorage.getItem(FORM_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        // Discard snapshots that contain NaN-sentinel values (corrupted by a
        // previous bug where Number() conversions weren't guarded).
        const numeric = ["guestCapacity", "numberOfRooms", "numberOfBeds", "numberOfBathrooms"];
        const isCorrupted = numeric.some(
          (k) => parsed[k] !== undefined && !isFinite(Number(parsed[k])),
        );
        if (isCorrupted) {
          sessionStorage.removeItem(FORM_STORAGE_KEY);
          sessionStorage.removeItem(STEP_STORAGE_KEY);
          return null;
        }
        return parsed;
      } catch {
        return null;
      }
    })();
  }
  const cached = _cached.current;

  const [currentStep, setCurrentStep] = useState(() => {
    const saved = sessionStorage.getItem(STEP_STORAGE_KEY);
    return saved ? parseInt(saved, 10) : 0;
  });

  useEffect(() => {
    sessionStorage.setItem(STEP_STORAGE_KEY, String(currentStep));
  }, [currentStep]);

  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [selectedProperties, setSelectedProperties] = useState<string[]>(
    cached?.selectedProperties ?? [],
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    cached?.selectedCategories ?? [],
  );
  const [stayType, setStayType] = useState<"entire" | "individual">(cached?.stayType ?? "entire");

  // Rules and regulations state
  const [entireStayRules, setEntireStayRules] = useState<string[]>(
    cached?.entireStayRules ?? [""],
  );
  const [roomRules, setRoomRules] = useState<Record<string, string[]>>(cached?.roomRules ?? {});
  const [optionalRules, setOptionalRules] = useState<string[]>(cached?.optionalRules ?? [""]);
  // Use Number() + || fallback so NaN from stale sessionStorage is treated as 0,
  // not propagated into counter arithmetic (NaN + 1 = NaN, NaN > 1 = false → stuck).
  const [guestCapacity, setGuestCapacity] = useState(Number(cached?.guestCapacity) || 0);
  const [numberOfRooms, setNumberOfRooms] = useState(Number(cached?.numberOfRooms) || 1);
  const [numberOfBeds, setNumberOfBeds] = useState(Number(cached?.numberOfBeds) || 0);
  const [numberOfBathrooms, setNumberOfBathrooms] = useState(
    Number(cached?.numberOfBathrooms) || 0,
  );
  const [regularPrice, setRegularPrice] = useState(cached?.regularPrice ?? "");
  const [rooms, setRooms] = useState<Room[]>(
    cached?.rooms ?? [
      {
        id: "1",
        name: "",
        description: "",
        photos: [],
        guestCapacity: 1,
        beds: 1,
        bathrooms: 1,
        price: 5934,
      },
    ],
  );
  const [expandedRoom, setExpandedRoom] = useState<string>("1");

  // Features state
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(
    cached?.selectedFeatures ?? [],
  );
  const [customFeatures, setCustomFeatures] = useState<string[]>(cached?.customFeatures ?? []);
  const [showCustomFeaturesInput, setShowCustomFeaturesInput] = useState(false);
  const [customFeatureInput, setCustomFeatureInput] = useState("");
  const [adminFeatures, setAdminFeatures] = useState<any[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<{ id: string; name: string; icon: string }[]>(
    [],
  );
  const [subCategoriesMap, setSubCategoriesMap] = useState<Record<string, any[]>>({});

  // Discount state
  const [firstUserDiscount, setFirstUserDiscount] = useState(cached?.firstUserDiscount ?? true);
  const [discountType, setDiscountType] = useState(cached?.discountType ?? "percentage");
  const [discountPercentage, setDiscountPercentage] = useState(cached?.discountPercentage ?? "");
  const [finalPrice, setFinalPrice] = useState(cached?.finalPrice ?? "");
  const [festivalOffers, setFestivalOffers] = useState(cached?.festivalOffers ?? false);
  const [weeklyOffers, setWeeklyOffers] = useState(cached?.weeklyOffers ?? false);
  const [specialOffers, setSpecialOffers] = useState(cached?.specialOffers ?? false);

  // Business Details state
  const [brandName, setBrandName] = useState(cached?.brandName ?? "");
  const [companyName, setCompanyName] = useState(cached?.companyName ?? "");
  const [gstNumber, setGstNumber] = useState(cached?.gstNumber ?? "");
  const [businessEmail, setBusinessEmail] = useState(cached?.businessEmail ?? "");
  const [businessPhone, setBusinessPhone] = useState(cached?.businessPhone ?? "");
  const [businessAddress, setBusinessAddress] = useState(cached?.businessAddress ?? "");
  const [locality, setLocality] = useState(cached?.locality ?? "India");
  const [state, setState] = useState(cached?.state ?? "");
  const [city, setCity] = useState(cached?.city ?? "");
  const [businessPincode, setBusinessPincode] = useState(cached?.businessPincode ?? "");

  // Personal Details state
  const [firstName, setFirstName] = useState(cached?.firstName ?? "");
  const [lastName, setLastName] = useState(cached?.lastName ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(cached?.dateOfBirth ?? "");
  const [maritalStatus, setMaritalStatus] = useState(cached?.maritalStatus ?? "");
  const [idProof, setIdProof] = useState(cached?.idProof ?? "");
  const [idProofImage, setIdProofImage] = useState<string | null>(cached?.idProofImage ?? null);
  const [images, setImages] = useState<(string | null)[]>(cached?.images ?? Array(5).fill(null));
  const [entireStayImages, setEntireStayImages] = useState<string[]>(
    cached?.entireStayImages ?? [],
  );
  const [coverImage, setCoverImage] = useState<string | null>(cached?.coverImage ?? null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [selected, setSelected] = useState<CountryOption | null>(DEFAULT_COUNTRY_OPTION);
  const [open, setOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Snapshot the current form to sessionStorage so a mid-wizard refresh doesn't
  // lose the draft.
  //
  // Building the object every render is cheap; serialising it is not. This used
  // to `JSON.stringify` here in the component body and pass the resulting string
  // as the effect's only dependency — clever for the deps array, brutal in
  // practice: the cover photo and gallery are base64 data URLs, so every
  // keystroke re-serialised 2-6MB and wrote it to sessionStorage synchronously.
  // Combined with the parse on the read side, House Rules typing and gallery
  // uploads stalled the main thread hard enough to look broken. Past the ~5MB
  // quota, `setItem` also threw on every attempt and the draft silently wasn't
  // saved at all.
  const formSnapshot = {
    selectedProperties,
    selectedCategories,
    stayType,
    entireStayRules,
    roomRules,
    optionalRules,
    guestCapacity,
    numberOfRooms,
    numberOfBeds,
    numberOfBathrooms,
    regularPrice,
    rooms,
    selectedFeatures,
    customFeatures,
    firstUserDiscount,
    discountType,
    discountPercentage,
    finalPrice,
    festivalOffers,
    weeklyOffers,
    specialOffers,
    brandName,
    companyName,
    gstNumber,
    businessEmail,
    businessPhone,
    businessAddress,
    locality,
    state,
    city,
    businessPincode,
    firstName,
    lastName,
    dateOfBirth,
    maritalStatus,
    idProof,
    idProofImage,
    images: images.filter(Boolean),
    entireStayImages,
    coverImage,
  };
  const formSnapshotRef = useRef(formSnapshot);
  formSnapshotRef.current = formSnapshot;

  // No dependency array on purpose: the timer is re-armed after every render and
  // the cleanup cancels the previous one, so exactly one write happens once the
  // user pauses — instead of one per keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      const snapshot = formSnapshotRef.current;
      try {
        sessionStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(snapshot));
      } catch {
        // Over quota — the photos are what blow it. Save everything else so a
        // refresh still restores the typed fields; the vendor only re-picks
        // images. Better than the previous behaviour, where one oversized
        // gallery meant nothing at all was persisted.
        try {
          const light = {
            ...snapshot,
            coverImage: null,
            entireStayImages: [],
            images: [],
            idProofImage: null,
            rooms: snapshot.rooms.map((room) => ({ ...room, photos: [] })),
          };
          sessionStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(light));
        } catch {
          /* still no room — leave the previous snapshot in place */
        }
      }
    }, 400);
    return () => clearTimeout(timer);
  });

  const { userDetails, updateUserDetails } = useUserDetails();
  // Prevent loadExistingData from running more than once.
  // React Query refetches userDetails in the background (window focus, etc.),
  // which re-triggers the effect and overwrites photos/form data the user just filled.
  const hasLoadedRef = useRef(false);

  const totalSteps = 8;
  const completedSteps = currentStep;
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [status, setStatus] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState<string>("");
  // True while the initial data check is in-flight so we don't flash the
  // full form before knowing the submission is already pending/approved.
  const [isStatusLoading, setIsStatusLoading] = useState(true);
  const [crossTypePending, setCrossTypePending] = useState<{ type: string; doc: any } | null>(null);
  // Lets a vendor re-enter the wizard for a still-pending submission —
  // loadStayDraft already hydrates the form from the pending doc, so once this
  // is true the normal wizard renders pre-filled instead of the "under review"
  // dead end. Resubmitting updates that submission rather than adding another
  // (see upsertOnboardingDoc in Server/modules/onboarding/onboarding.service.js).
  const [bypassPendingGate, setBypassPendingGate] = useState(false);

  const clearError = (field: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const [fileName, setFileName] = useState("");
  const [countryOption2, setCoutryOption2] = useState("India");
  // Only the business address remains — the personal address was removed from
  // this flow, so its country is no longer hydrated or fetched. Only this
  // country's states/cities are loaded; the full dataset is never downloaded.
  const data = useCountriesData([countryOption2]);
  const [stateOption2, setStateOption2] = useState(cached?.state ?? "");
  const [cityOption2, setCityOptions2] = useState(cached?.city ?? "");

  useEffect(() => {
    setState(stateOption2);
  }, [stateOption2]);

  useEffect(() => {
    setCity(cityOption2);
  }, [cityOption2]);

  useEffect(() => {
    setLocality("India");
  }, []);

  // Top-level Unique Stay features + categories (shared cache).
  const { data: stayFeatures } = useFeatures("Unique Stay");
  const { data: stayCategories } = useFeatures("Unique Stay", "category");
  /**
   * Categories that apply to any stay, regardless of property type
   * ("Beach Stays", "Pet-Friendly Stays", …). Stored flat against
   * "Unique Stay" rather than duplicated beneath all 20 property types — see
   * Server/scripts/seed-stay-taxonomy.js. Type-specific subcategories still
   * work and are merged on top in getEffectiveCategories.
   */
  const { data: sharedStayCategories } = useFeatures("Unique Stay", "subcategory");

  useEffect(() => {
    if (!stayFeatures) return;
    // Filter for features or items without type (legacy)
    setAdminFeatures(
      stayFeatures.filter((f: any) => f.status === "enable" && (!f.type || f.type === "feature")),
    );
  }, [stayFeatures]);

  useEffect(() => {
    if (!stayCategories) return;
    const types = stayCategories
      .filter((f: any) => f.status === "enable")
      .map((f: any) => ({
        id: f.name.toLowerCase(),
        realId: f.id || f._id,
        name: f.name,
        icon: f.icon,
      }));
    setPropertyTypes(types);

    // Fetch dynamic sub-categories for each property type. Keeping this
    // as an inline N+1 since each subcategory is keyed by a runtime
    // `type.realId`; useQueries() would also work but the cache benefit
    // is small (called once per page mount, dominated by the top two
    // queries above).
    types.forEach((type: any) => {
      if (type.realId) {
        cmsPublicApi
          .getFeatures(type.realId, "subcategory")
          .then((subs) => {
            if (subs && subs.length > 0) {
              setSubCategoriesMap((prev) => ({
                ...prev,
                [type.id]: subs.map((s: any) => ({
                  id: s.name.toLowerCase().replace(/\s+/g, "-"),
                  name: s.name,
                  icon: s.icon,
                })),
              }));
            }
          })
          .catch(() => {});
      }
    });
  }, [stayCategories]);

  // Check for existing data (resubmission flow) — runs once even if userDetails
  // refetches in the background.
  useEffect(() => {
    if (hasLoadedRef.current) return;
    loadStayDraft({
      userDetails,
      stepStorageKey: STEP_STORAGE_KEY,
      formStorageKey: FORM_STORAGE_KEY,
      markLoaded: () => {
        hasLoadedRef.current = true;
      },
      setters: {
        setStatus,
        setRejectionReason,
        setSelectedProperties,
        setSelectedCategories,
        setStayType,
        setGuestCapacity,
        setNumberOfRooms,
        setNumberOfBeds,
        setNumberOfBathrooms,
        setRegularPrice,
        setRooms,
        setCoverImage,
        setEntireStayImages,
        setImages,
        setSelectedFeatures,
        setEntireStayRules,
        setRoomRules,
        setOptionalRules,
        setFirstUserDiscount,
        setDiscountType,
        setDiscountPercentage,
        setFinalPrice,
        setFestivalOffers,
        setWeeklyOffers,
        setSpecialOffers,
        setBrandName,
        setCompanyName,
        setGstNumber,
        setBusinessEmail,
        setBusinessPhone,
        setBusinessAddress,
        setLocality,
        setState,
        setStateOption2,
        setCity,
        setCityOptions2,
        setBusinessPincode,
        setFirstName,
        setLastName,
        setDateOfBirth,
        setMaritalStatus,
        setIdProof,
        setIdProofImage,
        setTermsAccepted,
        setCurrentStep,
        setIsStatusLoading,
        setCrossTypePending,
      },
    });
  }, [userDetails]);

  // Calculate final price based on regular price and discount
  useEffect(() => {
    if (currentStep === 4) {
      const price = parseFloat(regularPrice) || 0;
      const discount = parseFloat(discountPercentage) || 0;

      let calculatedPrice = 0;
      if (discountType === "percentage") {
        calculatedPrice = price - (price * discount) / 100;
      } else {
        calculatedPrice = price - discount;
      }

      calculatedPrice = Math.max(0, calculatedPrice);
      setFinalPrice(calculatedPrice.toFixed(0));
    }
  }, [regularPrice, discountPercentage, discountType, currentStep]);

  const handleBack = () => {
    setErrors({});
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    } else {
      navigate("/onboarding/service-selection");
    }
  };

  /** Flat, type-agnostic category list from the CMS. */
  const sharedCategoryOptions = useMemo(
    () =>
      ((sharedStayCategories as any[]) ?? [])
        .filter((f: any) => f.status === "enable")
        .map((f: any) => ({
          id: String(f.name).toLowerCase().replace(/\s+/g, "-"),
          name: f.name,
          icon: f.icon,
        })),
    [sharedStayCategories],
  );

  /**
   * Categories offered for a property type: the shared list plus any
   * type-specific subcategories an admin has defined, deduped by name.
   *
   * Union rather than "type-specific wins": a couple of property types already
   * have one-off subcategories, and letting those replace the list would show
   * two options for Cottage and thirty-one for everything else.
   */
  const getEffectiveCategories = (propertyId: string) => {
    const typeSpecific = subCategoriesMap[propertyId] ?? [];
    const merged = [...sharedCategoryOptions];
    const seen = new Set(merged.map((c) => c.name.toLowerCase()));
    for (const c of typeSpecific) {
      if (!seen.has(String(c.name).toLowerCase())) {
        seen.add(String(c.name).toLowerCase());
        merged.push(c);
      }
    }
    if (merged.length > 0) return merged;

    // Nothing from the CMS yet — fall back to the bundled map, then to a
    // single option named after the property type, so the step is never empty.
    const hardcoded = propertyCategories[propertyId];
    if (hardcoded && hardcoded.length > 0) return hardcoded;

    const property = propertyTypes.find((p) => p.id === propertyId);
    return [
      {
        id: "default",
        name: property?.name || "Standard",
        icon: property?.icon || "🏠",
      },
    ];
  };

  const renderImageSrc = (src: string | null) => {
    if (!src) return "";
    if (src.startsWith("data:") || src.startsWith("blob:") || src.startsWith("http")) return src;
    return getImageUrl(src);
  };

  const handleNext = () => {
    const hasCategoriesForSelection =
      currentStep === 1 &&
      selectedProperties.some((propId) => {
        const categories = getEffectiveCategories(propId);
        return categories && categories.length > 0;
      });

    const { errors: newErrors, toastError } = validateStaysStep({
      currentStep,
      selectedProperties,
      selectedCategories,
      stayType,
      guestCapacity,
      numberOfRooms,
      numberOfBeds,
      numberOfBathrooms,
      regularPrice,
      entireStayRules,
      coverImage,
      entireStayImages,
      rooms,
      selectedFeatures,
      firstUserDiscount,
      festivalOffers,
      weeklyOffers,
      specialOffers,
      discountPercentage,
      finalPrice,
      brandName,
      companyName,
      businessEmail,
      businessPhone,
      businessAddress,
      locality,
      state,
      city,
      businessPincode,
      firstName,
      lastName,
      dateOfBirth,
      idProof,
      idProofImage,
      hasCategoriesForSelection,
    });

    if (toastError) {
      toast.error(toastError);
      return;
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Surface the first inline error as a toast — easy to miss if scrolled out.
      toast.error(Object.values(newErrors)[0]);
      return;
    }

    setErrors({});

    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      if (currentStep === totalSteps - 1 && !termsAccepted) {
        toast.error("You must accept the Terms & Conditions to proceed.");
        return;
      }
      handleComplete();
    }
  };

  const handleComplete = () =>
    submitStayOnboarding(
      {
        selectedProperties,
        selectedCategories,
        stayType,
        coverImage,
        guestCapacity,
        numberOfRooms,
        numberOfBeds,
        numberOfBathrooms,
        regularPrice,
        rooms,
        selectedFeatures,
        entireStayRules,
        roomRules,
        optionalRules,
        firstUserDiscount,
        discountType,
        discountPercentage,
        finalPrice,
        festivalOffers,
        weeklyOffers,
        specialOffers,
        brandName,
        companyName,
        gstNumber,
        businessEmail,
        businessPhone,
        businessAddress,
        locality,
        state,
        city,
        businessPincode,
        firstName,
        lastName,
        dateOfBirth,
        maritalStatus,
        idProof,
        idProofImage,
        images,
        entireStayImages,
      },
      {
        setIsLoading,
        updateUserDetails,
        updateUserType,
        navigate,
        stepStorageKey: STEP_STORAGE_KEY,
        formStorageKey: FORM_STORAGE_KEY,
      },
    );

  const sliderRef = useRef(null);

  const canProceed = () => {
    if (currentStep === 0) return selectedProperties.length > 0;
    if (currentStep === 1) return selectedCategories.length > 0;
    if (currentStep === 2) return true;
    if (currentStep === 3) return true;
    if (currentStep === 4) return true;
    if (currentStep === 5) return true;
    if (currentStep === 6) return true;
    return true;
  };

  const {
    togglePropertySelection,
    toggleFeatureSelection,
    incrementValue,
    decrementValue,
    addRoom,
    removeRoom,
    updateRoom,
  } = useStaySelectionHandlers({
    setSelectedProperties,
    setSelectedFeatures,
    showCustomFeaturesInput,
    setShowCustomFeaturesInput,
    rooms,
    setRooms,
    setNumberOfRooms,
  });

  const {
    handleCoverImageUpload,
    removeCoverImage,
    removeRoomImage,
    handleRoomImageUpload,
    handleImageUpload,
    handleEntireStayImageUpload,
    removeEntireStayImage,
    handleUploadIDProof,
  } = useStayImageHandlers({
    setCoverImage,
    setRooms,
    images,
    setImages,
    entireStayImages,
    setEntireStayImages,
    setIdProofImage,
    setError,
    setFileName,
  });

  // Rules management functions
  const {
    addEntireStayRule,
    removeEntireStayRule,
    updateEntireStayRule,
    addRoomRule,
    removeRoomRule,
    updateRoomRule,
  } = useStayRulesHandlers({ setEntireStayRules, setRoomRules, setOptionalRules });

  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollByIndex = (direction: "left" | "right") => {
    if (!scrollRef.current) return;

    const container = scrollRef.current;
    const firstChild = container.firstChild as HTMLElement;

    if (!firstChild) return;

    const itemWidth = firstChild.offsetWidth;
    const gap = 4;
    const scrollAmount = itemWidth + gap;

    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    if (!scrollRef.current) return;

    const container = scrollRef.current;
    const activeChild = container.children[carouselIndex] as HTMLElement;

    if (activeChild) {
      activeChild.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [carouselIndex]);

  // Business map calculation
  const businessMapQuery = `
  ${cityOption2 || ""}
  ${stateOption2 || ""}
  ${businessPincode || ""}
  India
`;

  const mapSrcbusiness = `https://www.google.com/maps?q=${encodeURIComponent(
    businessMapQuery,
  )}&output=embed`;

  // Compute features data for FeaturesStep
  const primaryPropertyType = selectedProperties[0] || "";
  const featuresData = getFeaturesForProperty(primaryPropertyType, "", stayType);

  // All 4 offers share the same discount type/percentage/finalPrice — only
  // the `enabled` flag differs. See pickStayDiscount() for the runtime pick.
  const _sharedOffer = { type: discountType, value: discountPercentage, finalPrice };
  const discountOffers = {
    firstUser: { enabled: firstUserDiscount, ..._sharedOffer },
    festival: { enabled: festivalOffers, ..._sharedOffer },
    weekly: { enabled: weeklyOffers, ..._sharedOffer },
    special: { enabled: specialOffers, ..._sharedOffer },
  };

  const {
    handleDiscountToggle,
    handleDiscountOfferChange,
    handleBusinessChange,
    handleBusinessStateChange,
    handleBusinessCityChange,
    handlePersonalChange,
    handleCategoryToggle,
  } = useStayFieldHandlers({
    firstUserDiscount,
    setFirstUserDiscount,
    festivalOffers,
    setFestivalOffers,
    weeklyOffers,
    setWeeklyOffers,
    specialOffers,
    setSpecialOffers,
    setDiscountType,
    setDiscountPercentage,
    setFinalPrice,
    setSelectedCategories,
    setBrandName,
    setCompanyName,
    setGstNumber,
    setBusinessEmail,
    setBusinessPhone,
    setBusinessAddress,
    setBusinessPincode,
    setStateOption2,
    setCityOptions2,
    setFirstName,
    setLastName,
    setDateOfBirth,
    setMaritalStatus,
    setIdProof,
    clearError,
  });

  // ---------- Render ----------

  const stepApi = {
    // Step 0
    selectedProperties,
    propertyTypes,
    togglePropertySelection,
    errors,
    setErrors,
    // Step 1
    selectedCategories,
    getEffectiveCategories,
    handleCategoryToggle,
    // Step 2 — top-level capacity + price
    stayType,
    setStayType,
    guestCapacity,
    numberOfRooms,
    numberOfBeds,
    numberOfBathrooms,
    regularPrice,
    setRegularPrice,
    incrementValue,
    decrementValue,
    setGuestCapacity,
    setNumberOfRooms,
    setNumberOfBeds,
    setNumberOfBathrooms,
    // Step 2 — rules
    entireStayRules,
    addEntireStayRule,
    removeEntireStayRule,
    updateEntireStayRule,
    roomRules,
    addRoomRule,
    removeRoomRule,
    updateRoomRule,
    // Step 2 — images
    coverImage,
    handleCoverImageUpload,
    removeCoverImage,
    renderImageSrc,
    entireStayImages,
    setEntireStayImages,
    removeEntireStayImage,
    sliderRef,
    // Step 2 — rooms (individual)
    rooms,
    expandedRoom,
    setExpandedRoom,
    addRoom,
    removeRoom,
    updateRoom,
    handleRoomImageUpload,
    removeRoomImage,
    clearError,
    // Step 3
    selectedFeatures,
    toggleFeatureSelection,
    adminFeatures,
    customFeatures,
    setCustomFeatures,
    setSelectedFeatures,
    showCustomFeaturesInput,
    setShowCustomFeaturesInput,
    customFeatureInput,
    setCustomFeatureInput,
    featuresData,
    // Step 4
    discountOffers,
    handleDiscountToggle,
    handleDiscountOfferChange,
    // Step 5
    brandName,
    companyName,
    gstNumber,
    businessEmail,
    businessPhone,
    businessAddress,
    businessPincode,
    handleBusinessChange,
    selected,
    setSelected,
    open,
    setOpen,
    countries,
    data,
    stateOption2,
    cityOption2,
    countryOption2,
    handleBusinessStateChange,
    handleBusinessCityChange,
    mapSrcbusiness,
    // Step 6
    firstName,
    lastName,
    dateOfBirth,
    maritalStatus,
    idProof,
    handlePersonalChange,
    idProofImage,
    handleUploadIDProof,
    uploadError: error,
    // Step 7
    termsAccepted,
    setTermsAccepted,
  };

  const primaryPropertyName =
    propertyTypes.find((p) => p.id === selectedProperties[0])?.name ?? selectedProperties[0];

  const activeDiscount = pickStayDiscount(regularPrice, finalPrice, {
    firstUserDiscount,
    festivalOffers,
    weeklyOffers,
    specialOffers,
  });

  if (isStatusLoading) return <StayStatusLoading />;
  if (crossTypePending) {
    return (
      <StayCrossTypePendingScreen
        pendingType={crossTypePending.type}
        onViewPending={() => navigate(`/onboarding/${crossTypePending.type}`)}
        onGoDashboard={() => navigate("/dashboard")}
      />
    );
  }
  // `approved` has no bypass: the backend treats an approved submission as a
  // finished listing, so resubmitting would create a second one rather than
  // edit it. Only a pending submission is editable in place.
  if ((status === "pending" && !bypassPendingGate) || status === "approved") {
    return (
      <StayStatusScreen
        status={status}
        primaryPropertyName={primaryPropertyName}
        stayType={stayType}
        onGoDashboard={() => navigate("/")}
        onSubmitAnother={() => navigate("/onboarding/service-selection")}
        onEdit={() => setBypassPendingGate(true)}
      />
    );
  }

  return (
    <OnboardingLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      phases={STAY_PHASES}
      isLoading={isLoading}
      canProceed={canProceed()}
      termsAccepted={termsAccepted}
      onBack={handleBack}
      onNext={handleNext}
      preview={
        currentStep <= 4 ? (
          <UniqueStayCardPreview
            propertyType={primaryPropertyName}
            coverImage={coverImage}
            galleryCount={
              stayType === "entire" ? entireStayImages.length : (rooms[0]?.photos?.length ?? 0)
            }
            city={cityOption2 || city}
            state={stateOption2 || state}
            regularPrice={regularPrice}
            guestCapacity={guestCapacity}
            stayType={stayType}
            activeDiscount={activeDiscount}
          />
        ) : undefined
      }
    >
      {status === "rejected" && <StayRejectedBanner rejectionReason={rejectionReason} />}

      <StaysStepRenderer step={currentStep} api={stepApi} />
    </OnboardingLayout>
  );
};

export default StaysOnboarding;
