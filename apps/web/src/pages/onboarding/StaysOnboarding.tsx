import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { cmsPublicApi } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";
import { toast } from "sonner";
import { Country } from "country-state-city";
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
} from "@/components/onboarding/shared";
import type { CountryOption, DiscountOffer } from "@/components/onboarding/shared";

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
  StayStatusLoading,
  StayStatusScreen,
  StayRejectedBanner,
} from "@/components/onboarding/stays/StayStatusScreens";

const countries: CountryOption[] = Country.getAllCountries().map((c) => ({
  isoCode: c.isoCode,
  name: c.name,
  countryCode: c.isoCode,
  dialCode: c.phonecode,
}));


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
  const _cached = (() => {
    try {
      const raw = sessionStorage.getItem(FORM_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // Discard snapshots that contain NaN-sentinel values (corrupted by a
      // previous bug where Number() conversions weren't guarded).
      const numeric = ["guestCapacity", "numberOfRooms", "numberOfBeds", "numberOfBathrooms"];
      const isCorrupted = numeric.some((k) => parsed[k] !== undefined && !isFinite(Number(parsed[k])));
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
    _cached?.selectedProperties ?? [],
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    _cached?.selectedCategories ?? [],
  );
  const [stayType, setStayType] = useState<"entire" | "individual">(_cached?.stayType ?? "entire");

  // Rules and regulations state
  const [entireStayRules, setEntireStayRules] = useState<string[]>(
    _cached?.entireStayRules ?? [""],
  );
  const [roomRules, setRoomRules] = useState<Record<string, string[]>>(_cached?.roomRules ?? {});
  const [optionalRules, setOptionalRules] = useState<string[]>(_cached?.optionalRules ?? [""]);
  // Use Number() + || fallback so NaN from stale sessionStorage is treated as 0,
  // not propagated into counter arithmetic (NaN + 1 = NaN, NaN > 1 = false → stuck).
  const [guestCapacity, setGuestCapacity] = useState(Number(_cached?.guestCapacity) || 0);
  const [numberOfRooms, setNumberOfRooms] = useState(Number(_cached?.numberOfRooms) || 1);
  const [numberOfBeds, setNumberOfBeds] = useState(Number(_cached?.numberOfBeds) || 0);
  const [numberOfBathrooms, setNumberOfBathrooms] = useState(Number(_cached?.numberOfBathrooms) || 0);
  const [regularPrice, setRegularPrice] = useState(_cached?.regularPrice ?? "");
  const [rooms, setRooms] = useState<Room[]>(
    _cached?.rooms ?? [
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
    _cached?.selectedFeatures ?? [],
  );
  const [customFeatures, setCustomFeatures] = useState<string[]>(_cached?.customFeatures ?? []);
  const [showCustomFeaturesInput, setShowCustomFeaturesInput] = useState(false);
  const [customFeatureInput, setCustomFeatureInput] = useState("");
  const [adminFeatures, setAdminFeatures] = useState<any[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<{ id: string; name: string; icon: string }[]>(
    [],
  );
  const [subCategoriesMap, setSubCategoriesMap] = useState<Record<string, any[]>>({});

  // Discount state
  const [firstUserDiscount, setFirstUserDiscount] = useState(_cached?.firstUserDiscount ?? true);
  const [discountType, setDiscountType] = useState(_cached?.discountType ?? "percentage");
  const [discountPercentage, setDiscountPercentage] = useState(_cached?.discountPercentage ?? "");
  const [finalPrice, setFinalPrice] = useState(_cached?.finalPrice ?? "");
  const [festivalOffers, setFestivalOffers] = useState(_cached?.festivalOffers ?? false);
  const [weeklyOffers, setWeeklyOffers] = useState(_cached?.weeklyOffers ?? false);
  const [specialOffers, setSpecialOffers] = useState(_cached?.specialOffers ?? false);

  // Business Details state
  const [brandName, setBrandName] = useState(_cached?.brandName ?? "");
  const [companyName, setCompanyName] = useState(_cached?.companyName ?? "");
  const [gstNumber, setGstNumber] = useState(_cached?.gstNumber ?? "");
  const [businessEmail, setBusinessEmail] = useState(_cached?.businessEmail ?? "");
  const [businessPhone, setBusinessPhone] = useState(_cached?.businessPhone ?? "");
  const [businessAddress, setBusinessAddress] = useState(_cached?.businessAddress ?? "");
  const [locality, setLocality] = useState(_cached?.locality ?? "India");
  const [state, setState] = useState(_cached?.state ?? "");
  const [city, setCity] = useState(_cached?.city ?? "");
  const [businessPincode, setBusinessPincode] = useState(_cached?.businessPincode ?? "");
  const [personalPincode, setPersonalPincode] = useState(_cached?.personalPincode ?? "");

  // Personal Details state
  const [firstName, setFirstName] = useState(_cached?.firstName ?? "");
  const [lastName, setLastName] = useState(_cached?.lastName ?? "");
  const [personalCountry, setPersonalCountry] = useState(_cached?.personalCountry ?? "India");
  const [personalState, setPersonalState] = useState(_cached?.personalState ?? "");
  const [personalCity, setPersonalCity] = useState(_cached?.personalCity ?? "");
  const [dateOfBirth, setDateOfBirth] = useState(_cached?.dateOfBirth ?? "");
  const [maritalStatus, setMaritalStatus] = useState(_cached?.maritalStatus ?? "");
  const [idProof, setIdProof] = useState(_cached?.idProof ?? "");
  const [idProofImage, setIdProofImage] = useState<string | null>(_cached?.idProofImage ?? null);
  const [images, setImages] = useState<(string | null)[]>(_cached?.images ?? Array(5).fill(null));
  const [entireStayImages, setEntireStayImages] = useState<string[]>(
    _cached?.entireStayImages ?? [],
  );
  const [coverImage, setCoverImage] = useState<string | null>(_cached?.coverImage ?? null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [selected, setSelected] = useState<CountryOption | null>(countries[100]);
  const [open, setOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Snapshot the current form to sessionStorage. We stringify once and use the
  // result as the only effect dependency, so React doesn't have to track 42
  // individual values and the deps array stays manageable.
  const formSnapshotJson = JSON.stringify({
    selectedProperties, selectedCategories, stayType, entireStayRules, roomRules,
    optionalRules, guestCapacity, numberOfRooms, numberOfBeds, numberOfBathrooms,
    regularPrice, rooms, selectedFeatures, customFeatures, firstUserDiscount,
    discountType, discountPercentage, finalPrice, festivalOffers, weeklyOffers,
    specialOffers, brandName, companyName, gstNumber, businessEmail, businessPhone,
    businessAddress, locality, state, city, businessPincode, personalPincode,
    firstName, lastName, personalCountry, personalState, personalCity, dateOfBirth,
    maritalStatus, idProof, idProofImage, images: images.filter(Boolean),
    entireStayImages, coverImage,
  });
  useEffect(() => {
    try {
      sessionStorage.setItem(FORM_STORAGE_KEY, formSnapshotJson);
    } catch { /* quota exceeded — ignore */ }
  }, [formSnapshotJson]);

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

  const clearError = (field: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const [fileName, setFileName] = useState("");
  const data = useCountriesData();
  const [countryOption, setCoutryOption] = useState("India");
  const [countryOption2, setCoutryOption2] = useState("India");
  const [stateOption, setStateOption] = useState(_cached?.personalState ?? "");
  const [stateOption2, setStateOption2] = useState(_cached?.state ?? "");
  const [cityOption, setCityOptions] = useState(_cached?.personalCity ?? "");
  const [cityOption2, setCityOptions2] = useState(_cached?.city ?? "");

  useEffect(() => {
    setState(stateOption2);
  }, [stateOption2]);

  useEffect(() => {
    setCity(cityOption2);
  }, [cityOption2]);

  useEffect(() => {
    setLocality("India");
  }, []);

  useEffect(() => {
    setPersonalState(stateOption);
  }, [stateOption]);

  useEffect(() => {
    setPersonalCity(cityOption);
  }, [cityOption]);

  useEffect(() => {
    setPersonalCountry("India");
  }, []);

  // Top-level Unique Stay features + categories (shared cache).
  const { data: stayFeatures } = useFeatures("Unique Stay");
  const { data: stayCategories } = useFeatures("Unique Stay", "category");

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
      markLoaded: () => {
        hasLoadedRef.current = true;
      },
      setters: {
        setStatus, setRejectionReason, setSelectedProperties, setSelectedCategories,
        setStayType, setGuestCapacity, setNumberOfRooms, setNumberOfBeds,
        setNumberOfBathrooms, setRegularPrice, setRooms, setCoverImage,
        setEntireStayImages, setImages, setSelectedFeatures, setEntireStayRules,
        setRoomRules, setOptionalRules, setFirstUserDiscount, setDiscountType,
        setDiscountPercentage, setFinalPrice, setFestivalOffers, setWeeklyOffers,
        setSpecialOffers, setBrandName, setCompanyName, setGstNumber,
        setBusinessEmail, setBusinessPhone, setBusinessAddress, setLocality,
        setState, setStateOption2, setCity, setCityOptions2, setBusinessPincode,
        setPersonalPincode, setFirstName, setLastName, setPersonalCountry,
        setPersonalState, setStateOption, setPersonalCity, setCityOptions,
        setDateOfBirth, setMaritalStatus, setIdProof, setIdProofImage,
        setTermsAccepted, setCurrentStep, setIsStatusLoading,
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

  const getEffectiveCategories = (propertyId: string) => {
    // Prioritize dynamic categories from Admin
    const dynamic = subCategoriesMap[propertyId];
    if (dynamic && dynamic.length > 0) return dynamic;

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
      currentStep, selectedProperties, selectedCategories, stayType, guestCapacity,
      numberOfRooms, numberOfBeds, numberOfBathrooms, regularPrice, entireStayRules,
      coverImage, entireStayImages, rooms, selectedFeatures, firstUserDiscount,
      festivalOffers, weeklyOffers, specialOffers, discountPercentage, finalPrice,
      brandName, companyName, businessEmail, businessPhone, businessAddress, locality,
      state, city, businessPincode, firstName, lastName, personalState, personalCity,
      personalPincode, dateOfBirth, idProof, idProofImage, hasCategoriesForSelection,
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
        selectedProperties, selectedCategories, stayType, coverImage,
        guestCapacity, numberOfRooms, numberOfBeds, numberOfBathrooms,
        regularPrice, rooms, selectedFeatures, entireStayRules, roomRules,
        optionalRules, firstUserDiscount, discountType, discountPercentage,
        finalPrice, festivalOffers, weeklyOffers, specialOffers, brandName,
        companyName, gstNumber, businessEmail, businessPhone, businessAddress,
        locality, state, city, businessPincode, personalPincode, firstName,
        lastName, personalCountry, personalState, personalCity, dateOfBirth,
        maritalStatus, idProof, idProofImage, images, entireStayImages,
      },
      {
        setIsLoading, updateUserDetails, updateUserType, navigate,
        stepStorageKey: STEP_STORAGE_KEY, formStorageKey: FORM_STORAGE_KEY,
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
    handleDiscountToggle, handleDiscountOfferChange, handleBusinessChange,
    handleBusinessStateChange, handleBusinessCityChange, handlePersonalChange,
    handlePersonalStateChange, handlePersonalCityChange, handleCategoryToggle,
  } = useStayFieldHandlers({
    firstUserDiscount, setFirstUserDiscount, festivalOffers, setFestivalOffers,
    weeklyOffers, setWeeklyOffers, specialOffers, setSpecialOffers,
    setDiscountType, setDiscountPercentage, setFinalPrice, setSelectedCategories,
    setBrandName, setCompanyName, setGstNumber, setBusinessEmail, setBusinessPhone,
    setBusinessAddress, setBusinessPincode, setStateOption2, setCityOptions2,
    setFirstName, setLastName, setPersonalPincode, setDateOfBirth, setMaritalStatus,
    setIdProof, setStateOption, setCityOptions, clearError,
  });

  // ---------- Render ----------

  const stepApi = {
    // Step 0
    selectedProperties, propertyTypes, togglePropertySelection, errors, setErrors,
    // Step 1
    selectedCategories, getEffectiveCategories, handleCategoryToggle,
    // Step 2 — top-level capacity + price
    stayType, setStayType, guestCapacity, numberOfRooms, numberOfBeds, numberOfBathrooms,
    regularPrice, setRegularPrice, incrementValue, decrementValue,
    setGuestCapacity, setNumberOfRooms, setNumberOfBeds, setNumberOfBathrooms,
    // Step 2 — rules
    entireStayRules, addEntireStayRule, removeEntireStayRule, updateEntireStayRule,
    roomRules, addRoomRule, removeRoomRule, updateRoomRule,
    // Step 2 — images
    coverImage, handleCoverImageUpload, removeCoverImage, renderImageSrc,
    entireStayImages, setEntireStayImages, removeEntireStayImage, sliderRef,
    // Step 2 — rooms (individual)
    rooms, expandedRoom, setExpandedRoom, addRoom, removeRoom, updateRoom,
    handleRoomImageUpload, removeRoomImage, clearError,
    // Step 3
    selectedFeatures, toggleFeatureSelection, adminFeatures, customFeatures,
    setCustomFeatures, setSelectedFeatures, showCustomFeaturesInput,
    setShowCustomFeaturesInput, customFeatureInput, setCustomFeatureInput, featuresData,
    // Step 4
    discountOffers, handleDiscountToggle, handleDiscountOfferChange,
    // Step 5
    brandName, companyName, gstNumber, businessEmail, businessPhone, businessAddress,
    businessPincode, handleBusinessChange, selected, setSelected, open, setOpen,
    countries, data, stateOption2, cityOption2, countryOption2,
    handleBusinessStateChange, handleBusinessCityChange, mapSrcbusiness,
    // Step 6
    firstName, lastName, personalPincode, dateOfBirth, maritalStatus, idProof,
    handlePersonalChange, stateOption, cityOption, countryOption,
    handlePersonalStateChange, handlePersonalCityChange, idProofImage,
    handleUploadIDProof, uploadError: error,
    // Step 7
    termsAccepted, setTermsAccepted,
  };

  const primaryPropertyName =
    propertyTypes.find((p) => p.id === selectedProperties[0])?.name ?? selectedProperties[0];

  const activeDiscount = pickStayDiscount(
    regularPrice,
    finalPrice,
    { firstUserDiscount, festivalOffers, weeklyOffers, specialOffers },
  );

  if (isStatusLoading) return <StayStatusLoading />;
  if (status === "pending" || status === "approved") {
    return (
      <StayStatusScreen
        status={status}
        primaryPropertyName={primaryPropertyName}
        stayType={stayType}
        onGoDashboard={() => navigate("/")}
        onSubmitAnother={() => navigate("/onboarding/service-selection")}
      />
    );
  }

  return (
    <OnboardingLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
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
            galleryCount={stayType === "entire" ? entireStayImages.length : (rooms[0]?.photos?.length ?? 0)}
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
