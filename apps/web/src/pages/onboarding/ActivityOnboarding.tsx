import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { cmsPublicApi } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";
import { toast } from "sonner";
import { Country } from "country-state-city";
import { submitOnboardingData, getOnboardingData } from "@/lib/api";
import { onboardingService } from "@/lib/onboardingService";
import { FaUserTie } from "react-icons/fa6";
import { GiBinoculars, GiCampCookingPot, GiCruiser } from "react-icons/gi";
import { useUserDetails } from "@/hooks/useUserDetails";
import { useCountriesData } from "@/hooks/useCountriesData";
import { useHomepageSections } from "@/hooks/useHomepageSections";
import { useFeatures } from "@/hooks/useFeatures";

// Shared components
import {
  OnboardingLayout,
  BusinessDetailsStep,
  PersonalDetailsStep,
  TermsConditionsStep,
  DiscountOffersStep,
} from "@/components/onboarding/shared";
import type { CountryOption, DiscountOffer } from "@/components/onboarding/shared";

// Activity-specific step components
import {
  TypeStep,
  FeaturesStep,
  DetailsStep,
  PricingStep,
  InclusionExclusionStep,
} from "@/components/onboarding/activity";
import { submitActivityOnboarding } from "@/components/onboarding/activity/submitActivityOnboarding";
import { validateActivityStep } from "@/components/onboarding/activity/validateActivityStep";
import { loadActivityDraft } from "@/components/onboarding/activity/loadActivityDraft";
import { ActivityStepRenderer } from "@/components/onboarding/activity/ActivityStepRenderer";

interface ActivityType {
  id: string;
  name: string;
  icon: string;
}

const countries: CountryOption[] = Country.getAllCountries().map((c) => ({
  isoCode: c.isoCode,
  name: c.name,
  countryCode: c.isoCode,
  dialCode: c.phonecode,
}));

const ActivityOnboarding = () => {
  const navigate = useNavigate();
  const { updateUserType, isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      toast.error("Please login to continue");
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const STEP_STORAGE_KEY = "activity_onboarding_step";
  const FORM_STORAGE_KEY = "activity_onboarding_form";

  const [currentStep, setCurrentStep] = useState(() => {
    const saved = sessionStorage.getItem(STEP_STORAGE_KEY);
    return saved ? parseInt(saved, 10) : 0;
  });

  useEffect(() => {
    sessionStorage.setItem(STEP_STORAGE_KEY, String(currentStep));
  }, [currentStep]);

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const data = useCountriesData();
  const [countriesData, setCountriesData] = useState<any[]>([]); // For country-state-city data
  const photoCarouselRef = React.useRef<HTMLDivElement>(null);

  const { userDetails, updateUserDetails } = useUserDetails();

  const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
  const [status, setStatus] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState<string>("");

  // Country dialog state for BusinessDetailsStep
  const [countryDialogOpen, setCountryDialogOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<CountryOption | null>(
    countries.find((c) => c.isoCode === "IN") || null,
  );

  // Form data for all steps
  const defaultFormData = {
    // Step 0: Selected activity types
    selectedActivities: [] as string[],

    // Step 1: Features
    features: [] as string[],

    // Step 2: Activity Details
    activityName: "",
    description: "",
    coverImage: null as File | string | null,
    photos: [] as (File | string)[],
    rulesAndRegulations: [] as string[],

    // Step 3: Pricing Details
    regularPrice: "",
    personCapacity: 1,
    timeDuration: "",
    address: "",
    locality: "India",
    state: "",
    city: "",
    pincode: "",
    priceDetails: [] as Array<{
      state: string;
      city: string;
      include: boolean;
      price?: string;
    }>,

    // Step 4: Inclusion & Exclusion
    priceIncludes: [""] as string[],
    priceExcludes: [] as string[],
    expectations: [] as string[],

    // Step 5: Types of Discount
    firstUserDiscount: true,
    discountType: "percentage",
    discountAmount: "",
    finalPrice: "",

    festivalOffers: false,
    festivalDiscountType: "percentage",
    festivalDiscountAmount: "",
    festivalFinalPrice: "",

    weeklyOffers: false,
    weeklyDiscountType: "percentage",
    weeklyDiscountAmount: "",
    weeklyFinalPrice: "",

    specialOffers: false,
    specialDiscountType: "percentage",
    specialDiscountAmount: "",
    specialFinalPrice: "",

    // Step 6: Business Details
    brandName: "",
    legalCompanyName: "",
    gstNumber: "",
    businessEmail: "",
    businessPhone: "",
    businessLocality: "India",
    businessPincode: "",
    businessCity: "",
    businessState: "",

    // Step 7: Personal Details
    firstName: "",
    lastName: "",
    personalLocality: "India",
    personalPincode: "",
    personalCity: "",
    personalState: "",
    dateOfBirth: "",
    maritalStatus: "",
    idProof: "",
    idPhotos: [] as (File | string)[],
    // Step 8: Terms & Conditions
    termsAccepted: false,
  };

  const [formData, setFormData] = useState(() => {
    try {
      const saved = sessionStorage.getItem(FORM_STORAGE_KEY);
      if (saved) return { ...defaultFormData, ...JSON.parse(saved) };
    } catch {}
    return defaultFormData;
  });

  useEffect(() => {
    try {
      const serialisable = {
        ...formData,
        coverImage: typeof formData.coverImage === "string" ? formData.coverImage : null,
        photos: formData.photos.filter((p: File | string) => typeof p === "string"),
        idPhotos: formData.idPhotos.filter((p: File | string) => typeof p === "string"),
      };
      sessionStorage.setItem(FORM_STORAGE_KEY, JSON.stringify(serialisable));
    } catch {}
  }, [formData]);

  // Features state
  const [customFeatures, setCustomFeatures] = useState<string[]>([]);
  const [showCustomFeaturesInput, setShowCustomFeaturesInput] = useState(false);
  const [customFeatureInput, setCustomFeatureInput] = useState("");
  const [ruleInput, setRuleInput] = useState("");
  const [adminFeatures, setAdminFeatures] = useState<any[]>([]);

  // Check if Activity section is enabled (uses shared cache).
  const { data: homepageSections } = useHomepageSections();
  useEffect(() => {
    if (!homepageSections) return;
    const activitySection = (homepageSections as any[]).find(
      (s: any) => s.sectionKey === "best-activity",
    );
    if (activitySection && !activitySection.isVisible) {
      toast.error("Activity onboarding is currently disabled.");
      navigate("/");
    }
  }, [homepageSections, navigate]);

  // Load CMS-driven feature/category data on mount.
  // Activity features + categories (shared cache with Index).
  const { data: activityFeaturesData } = useFeatures("Activity");
  const { data: activityCategories } = useFeatures("Activity", "category");

  useEffect(() => {
    if (activityFeaturesData) {
      setAdminFeatures(activityFeaturesData.filter((f: any) => f.status === "enable"));
    }
  }, [activityFeaturesData]);

  useEffect(() => {
    if (!activityCategories) return;
    const types = activityCategories
      .filter((f: any) => f.status === "enable")
      .map((f: any) => ({
        id: f.name,
        name: f.name,
        icon: f.icon,
      }));
    setActivityTypes(types);
  }, [activityCategories]);

  useEffect(() => {
    loadActivityDraft({
      setFormData,
      setStatus,
      setRejectionReason,
      userDetails,
      isExistingVendor: user?.userType === "vendor",
    });
  }, [userDetails]);

  // Auto-calculate final prices for discounts
  useEffect(() => {
    if (currentStep === 5) {
      setFormData((prev) => {
        const basePrice = parseFloat(prev.regularPrice) || 0;
        const newData = { ...prev };
        let changed = false;

        // Only auto-seed when basePrice is known AND the field is still empty
        // (never override a value the user has manually entered)
        if (basePrice <= 0) return prev;

        const calculateFinal = (type: string, value: string) => {
          const val = parseFloat(value) || 0;
          if (type === "percentage") {
            return Math.max(0, basePrice - (basePrice * val) / 100).toFixed(0);
          } else {
            return Math.max(0, basePrice - val).toFixed(0);
          }
        };

        if (prev.firstUserDiscount && !prev.finalPrice) {
          newData.finalPrice = calculateFinal(prev.discountType, prev.discountAmount);
          changed = true;
        }

        if (prev.festivalOffers && !prev.festivalFinalPrice) {
          newData.festivalFinalPrice = calculateFinal(
            prev.festivalDiscountType,
            prev.festivalDiscountAmount,
          );
          changed = true;
        }

        if (prev.weeklyOffers && !prev.weeklyFinalPrice) {
          newData.weeklyFinalPrice = calculateFinal(
            prev.weeklyDiscountType,
            prev.weeklyDiscountAmount,
          );
          changed = true;
        }

        if (prev.specialOffers && !prev.specialFinalPrice) {
          newData.specialFinalPrice = calculateFinal(
            prev.specialDiscountType,
            prev.specialDiscountAmount,
          );
          changed = true;
        }

        return changed ? newData : prev;
      });
    }
  }, [
    currentStep,
    formData.regularPrice,
    formData.firstUserDiscount,
    formData.discountType,
    formData.discountAmount,
    formData.festivalOffers,
    formData.festivalDiscountType,
    formData.festivalDiscountAmount,
    formData.weeklyOffers,
    formData.weeklyDiscountType,
    formData.weeklyDiscountAmount,
    formData.specialOffers,
    formData.specialDiscountType,
    formData.specialDiscountAmount,
  ]);

  // Navigation Handlers
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    } else {
      navigate("/onboarding/service-selection");
    }
  };

  const submitActivity = () =>
    submitActivityOnboarding(formData, { setIsLoading, updateUserDetails, updateUserType });

  const handleNext = async () => {
    setErrors({});
    const { errors: newErrors, toastError } = validateActivityStep(currentStep, formData);
    if (toastError) {
      toast.error(toastError);
      return;
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    if (currentStep === 8) {
      try {
        const saved = await submitActivity();
        if (saved?.id) {
          onboardingService.setActivityId(saved.id);
          sessionStorage.setItem("onboardingId", saved.id);
          sessionStorage.setItem("onboardingType", "activity");
          sessionStorage.setItem("id", saved.id);
          sessionStorage.removeItem(STEP_STORAGE_KEY);
          sessionStorage.removeItem(FORM_STORAGE_KEY);
          navigate("/onboarding/selfie-verification");
          return;
        }
        toast.error("Could not save onboarding. Please try again.");
        return;
      } catch {
        toast.error("Could not save onboarding. Please try again.");
        return;
      }
    }

    setCurrentStep((prev) => prev + 1);
  };

  // Update formData helper
  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    clearError(field);
  };

  // Toggle activity selection and keep formData selectedActivities in sync
  const toggleActivityType = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedActivities: prev.selectedActivities.includes(id)
        ? prev.selectedActivities.filter((actId) => actId !== id)
        : [...prev.selectedActivities, id],
    }));
  };

  // Add and remove list items (inclusions, exclusions, expectations)
  const addListItem = (key: "priceIncludes" | "priceExcludes" | "expectations", value: string) => {
    if (!value.trim()) return;

    setFormData((prev) => ({
      ...prev,
      [key]: [...prev[key], value.trim()],
    }));
  };

  const removeListItem = (
    key: "priceIncludes" | "priceExcludes" | "expectations",
    index: number,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index),
    }));
  };

  const toggleFeature = (featureId: string) => {
    if (featureId === "others") {
      setShowCustomFeaturesInput(!showCustomFeaturesInput);
    } else {
      setFormData((prev) => ({
        ...prev,
        features: prev.features.includes(featureId)
          ? prev.features.filter((f) => f !== featureId)
          : [...prev.features, featureId],
      }));
    }
  };

  // File upload handlers
  const handleCoverImageUpload = (files: FileList | null) => {
    if (!files) return;
    const file = files[0];
    if (!file) return;

    setFormData((prev) => ({
      ...prev,
      coverImage: file,
    }));
    // Clear error
    if (errors.coverImage) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.coverImage;
        return newErrors;
      });
    }
  };

  const handleFileUpload = (field: "photos" | "idPhotos", files: FileList | null) => {
    if (!files) return;

    const maxSize = 5 * 1024 * 1024; // 5 MB
    const validTypes = ["image/jpeg", "image/png", "application/pdf"];

    for (const file of Array.from(files)) {
      if (field === "idPhotos" && !validTypes.includes(file.type)) {
        toast.error("Only JPG, PNG, or PDF files are allowed.");
        return;
      }
      if (file.size > maxSize) {
        toast.error("File size must be under 5 MB.");
        return;
      }
    }

    setFormData((prev) => {
      const currentFiles = prev[field] || [];
      const maxPhotos = field === "photos" ? 15 : 5;
      const remainingSlots = maxPhotos - currentFiles.length;
      if (files.length > remainingSlots) {
        toast.error(
          `Upload limit exceeded! Maximum ${maxPhotos} ${field === "photos" ? "photos" : "files"} allowed.`,
        );
        return prev;
      }
      const newFiles = Array.from(files).slice(0, remainingSlots);
      const updatedFiles = [...currentFiles, ...newFiles];

      // Clear errors if requirements met
      if (field === "photos" && updatedFiles.length >= 5 && errors.photos) {
        setErrors((prevErr) => {
          const newErrors = { ...prevErr };
          delete newErrors.photos;
          return newErrors;
        });
      }
      if (field === "idPhotos" && updatedFiles.length > 0 && errors.idPhotos) {
        setErrors((prevErr) => {
          const newErrors = { ...prevErr };
          delete newErrors.idPhotos;
          return newErrors;
        });
      }

      return {
        ...prev,
        [field]: updatedFiles,
      };
    });
  };

  const removeFile = (field: "photos" | "idPhotos" | "coverImage", index?: number) => {
    setFormData((prev) => {
      if (field === "coverImage") {
        return {
          ...prev,
          coverImage: null,
        };
      }
      return {
        ...prev,
        [field]: prev[field].filter((_, i) => i !== index),
      };
    });
  };

  // Base activity features
  const baseActivityFeatures = [
    { label: "Guide", value: "guide", icon: FaUserTie },
    { label: "Equipment", value: "equipment", icon: GiCampCookingPot },
    { label: "Safety Gear", value: "safety_gear", icon: GiBinoculars },
    { label: "Transportation", value: "transportation", icon: GiCruiser },
    { label: "Meals", value: "meals", icon: GiCampCookingPot },
    { label: "Photography", value: "photography", icon: GiBinoculars },
  ];

  const activityFeatureMap: { [key: string]: string[] } = {
    hiking: ["guide", "equipment", "meals", "photography"],
    zipline: ["guide", "equipment", "safety_gear", "transportation"],
    climbing: ["guide", "equipment", "safety_gear"],
    snorkeling: ["guide", "equipment", "safety_gear", "meals"],
    safari: ["guide", "transportation", "meals", "photography"],
    ballooning: ["guide", "transportation", "photography"],
    wildlife: ["guide", "transportation", "photography"],
    bungee: ["guide", "equipment", "safety_gear"],
    water: ["guide", "equipment", "safety_gear", "meals"],
    paragliding: ["guide", "equipment", "safety_gear", "photography"],
    cultural: ["guide", "photography", "meals"],
    camping: ["guide", "equipment", "meals", "transportation"],
    historical: ["guide", "photography", "transportation"],
    museum: ["guide", "photography"],
    birdwatching: ["guide", "photography", "meals"],
    whale: ["guide", "photography", "meals"],
    temple: ["guide", "photography"],
    walking: ["guide", "photography", "meals"],
    nationalparks: ["guide", "photography", "meals", "transportation"],
    jungle: ["guide", "equipment", "meals", "transportation", "photography"],
    yacht: ["guide", "meals", "photography"],
    amusement: ["transportation", "meals"],
    stargazing: ["guide", "photography", "meals"],
  };

  const activityFeatures = [...baseActivityFeatures];

  // Disable Next if Terms not accepted on last step
  const canProceed = () => {
    if (currentStep === 8) return formData.termsAccepted;
    return true;
  };

  const businessMapQuery = `
  ${formData.businessCity || ""}
  ${formData.businessState || ""}
  ${formData.businessPincode || ""}
  India
`;

  const mapSrcbusiness = `https://www.google.com/maps?q=${encodeURIComponent(
    businessMapQuery,
  )}&output=embed`;

  const renderImageSrc = (fileOrUrl: any) => {
    if (!fileOrUrl) return "";
    if (typeof fileOrUrl === "string") return getImageUrl(fileOrUrl);
    try {
      return URL.createObjectURL(fileOrUrl);
    } catch (e) {
      return "";
    }
  };

  // --- Handlers for removing custom features (used by FeaturesStep) ---
  const handleRemoveCustomFeature = (idx: number) => {
    const featureName = customFeatures[idx];
    setCustomFeatures((prev) => prev.filter((_, i) => i !== idx));
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((f) => f !== featureName),
    }));
  };

  const handleAddCustomFeature = (feature: string) => {
    setCustomFeatures((prev) => [...prev, feature]);
    setFormData((prev) => ({
      ...prev,
      features: [...prev.features, feature],
    }));
  };

  // --- Handlers for rules (used by DetailsStep) ---
  const handleAddRule = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      rulesAndRegulations: [...prev.rulesAndRegulations, value],
    }));
  };

  const handleRemoveRule = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      rulesAndRegulations: prev.rulesAndRegulations.filter((_, i) => i !== index),
    }));
  };

  // --- Discount offers mapping for shared DiscountOffersStep ---
  const discountOffers = {
    firstUser: {
      enabled: formData.firstUserDiscount,
      type: formData.discountType,
      value: formData.discountAmount,
      finalPrice: formData.finalPrice,
    } as DiscountOffer,
    festival: {
      enabled: formData.festivalOffers,
      type: formData.festivalDiscountType,
      value: formData.festivalDiscountAmount,
      finalPrice: formData.festivalFinalPrice,
    } as DiscountOffer,
    weekly: {
      enabled: formData.weeklyOffers,
      type: formData.weeklyDiscountType,
      value: formData.weeklyDiscountAmount,
      finalPrice: formData.weeklyFinalPrice,
    } as DiscountOffer,
    special: {
      enabled: formData.specialOffers,
      type: formData.specialDiscountType,
      value: formData.specialDiscountAmount,
      finalPrice: formData.specialFinalPrice,
    } as DiscountOffer,
  };

  const handleDiscountToggle = (key: "firstUser" | "festival" | "weekly" | "special") => {
    const fieldMap: Record<string, string> = {
      firstUser: "firstUserDiscount",
      festival: "festivalOffers",
      weekly: "weeklyOffers",
      special: "specialOffers",
    };
    updateFormData(fieldMap[key], !formData[fieldMap[key] as keyof typeof formData]);
  };

  const handleDiscountOfferChange = (
    key: "firstUser" | "festival" | "weekly" | "special",
    field: keyof DiscountOffer,
    value: string,
  ) => {
    const fieldMap: Record<string, Record<string, string>> = {
      firstUser: { type: "discountType", value: "discountAmount", finalPrice: "finalPrice" },
      festival: {
        type: "festivalDiscountType",
        value: "festivalDiscountAmount",
        finalPrice: "festivalFinalPrice",
      },
      weekly: {
        type: "weeklyDiscountType",
        value: "weeklyDiscountAmount",
        finalPrice: "weeklyFinalPrice",
      },
      special: {
        type: "specialDiscountType",
        value: "specialDiscountAmount",
        finalPrice: "specialFinalPrice",
      },
    };
    const formField = fieldMap[key][field];
    if (formField) {
      updateFormData(formField, value);
    }
  };

  // --- Business details mapping for shared BusinessDetailsStep ---
  const handleBusinessChange = (field: string, value: string) => {
    const fieldMap: Record<string, string> = {
      brandName: "brandName",
      companyName: "legalCompanyName",
      gstNumber: "gstNumber",
      businessEmail: "businessEmail",
      businessPhone: "businessPhone",
      pincode: "businessPincode",
    };
    updateFormData(fieldMap[field] || field, value);
    // Also clear the UI error key (BusinessDetailsStep uses the prop field name)
    clearError(field);
  };

  const handleBusinessStateChange = (val: string) => {
    updateFormData("businessState", val);
    updateFormData("businessCity", "");
    clearError("state");
  };

  const handleBusinessCityChange = (val: string) => {
    updateFormData("businessCity", val);
    clearError("city");
  };

  // --- Personal details mapping for shared PersonalDetailsStep ---
  const handlePersonalChange = (field: string, value: string) => {
    const fieldMap: Record<string, string> = {
      firstName: "firstName",
      lastName: "lastName",
      pincode: "personalPincode",
      dateOfBirth: "dateOfBirth",
      maritalStatus: "maritalStatus",
      idProof: "idProof",
    };
    updateFormData(fieldMap[field] || field, value);
  };

  const handlePersonalStateChange = (val: string) => {
    updateFormData("personalState", val);
    updateFormData("personalCity", "");
  };

  const handlePersonalCityChange = (val: string) => {
    updateFormData("personalCity", val);
  };

  const handleIdProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload("idPhotos", e.target.files);
  };

  // Get ID proof image for preview
  const idProofImage =
    formData.idPhotos.length > 0
      ? typeof formData.idPhotos[0] === "string"
        ? formData.idPhotos[0]
        : (() => {
            try {
              return URL.createObjectURL(formData.idPhotos[0] as File);
            } catch {
              return null;
            }
          })()
      : null;

  // Step components rendered conditionally
  return (
    <OnboardingLayout
      currentStep={currentStep}
      totalSteps={9}
      isLoading={isLoading}
      canProceed={canProceed()}
      termsAccepted={formData.termsAccepted}
      onBack={handleBack}
      onNext={handleNext}
    >
      {status === "rejected" && (
        <div className="w-full max-w-4xl mb-6 p-4 border border-red-200 bg-red-50 rounded-md">
          <h3 className="text-red-800 font-semibold mb-1">Service Rejected</h3>
          <p className="text-red-700 text-sm">Reason: {rejectionReason || "No reason provided"}</p>
          <p className="text-red-600 text-xs mt-2">
            Please update the details and resubmit for approval.
          </p>
        </div>
      )}

      <ActivityStepRenderer
        step={currentStep}
        api={{
          formData,
          setFormData,
          errors,
          setErrors,
          updateFormData,
          clearError,
          activityTypes,
          toggleActivityType,
          activityFeatures,
          activityFeatureMap,
          adminFeatures,
          customFeatures,
          showCustomFeaturesInput,
          setShowCustomFeaturesInput,
          customFeatureInput,
          setCustomFeatureInput,
          toggleFeature,
          handleRemoveCustomFeature,
          handleAddCustomFeature,
          ruleInput,
          setRuleInput,
          photoCarouselRef: photoCarouselRef as React.RefObject<HTMLDivElement>,
          handleCoverImageUpload,
          handleFileUpload,
          removeFile,
          handleAddRule,
          handleRemoveRule,
          renderImageSrc,
          locationData: data,
          addListItem,
          removeListItem,
          discountOffers,
          handleDiscountToggle,
          handleDiscountOfferChange,
          handleBusinessChange,
          selectedCountry,
          setSelectedCountry,
          countryDialogOpen,
          setCountryDialogOpen,
          countries,
          handleBusinessStateChange,
          handleBusinessCityChange,
          mapSrcbusiness,
          handlePersonalChange,
          handlePersonalStateChange,
          handlePersonalCityChange,
          idProofImage,
          handleIdProofUpload,
        }}
      />
    </OnboardingLayout>
  );
};

export default ActivityOnboarding;
