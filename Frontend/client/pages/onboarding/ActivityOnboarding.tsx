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

// Shared components
import {
  OnboardingLayout,
  BusinessDetailsStep,
  PersonalDetailsStep,
  TermsConditionsStep,
  DiscountOffersStep,
} from "./components/shared";
import type { CountryOption, DiscountOffer } from "./components/shared";

// Activity-specific step components
import {
  TypeStep,
  FeaturesStep,
  DetailsStep,
  PricingStep,
  InclusionExclusionStep,
} from "./components/activity";

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

  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [data, setData] = useState([]);
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
  const [formData, setFormData] = useState({
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
    priceIncludes: [ "" ] as string[],
    priceExcludes: [] as string[],
    expectations: [] as string[],

    // Step 5: Types of Discount
    firstUserDiscount: true,
    discountType: "",
    discountAmount: "",
    finalPrice: "",

    festivalOffers: false,
    festivalDiscountType: "",
    festivalDiscountAmount: "",
    festivalFinalPrice: "",

    weeklyOffers: false,
    weeklyDiscountType: "",
    weeklyDiscountAmount: "",
    weeklyFinalPrice: "",

    specialOffers: false,
    specialDiscountType: "",
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
  });

  // Features state
  const [customFeatures, setCustomFeatures] = useState<string[]>([]);
  const [showCustomFeaturesInput, setShowCustomFeaturesInput] = useState(false);
  const [customFeatureInput, setCustomFeatureInput] = useState("");
  const [ruleInput, setRuleInput] = useState("");
  const [adminFeatures, setAdminFeatures] = useState<any[]>([]);

  // Load countries data on mount
  useEffect(() => {
    // Check if Activity section is enabled
    cmsPublicApi.listHomepageSections().then((sections) => {
      const activitySection = sections.find((s: any) => s.sectionKey === 'best-activity');
      if (activitySection && !activitySection.isVisible) {
        toast.error("Activity onboarding is currently disabled.");
        navigate("/");
      }
    }).catch(console.error);
    fetch("/countries_states_cities.json")
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error("Failed to load countries:", err));

    // Fetch admin features
    cmsPublicApi.getFeatures("Activity").then(list => {
      setAdminFeatures(list.filter((f: any) => f.status === 'enable'));
    }).catch(console.error);

    // Fetch activity categories (types)
    cmsPublicApi.getFeatures("Activity", "category").then(list => {
      const types = list
        .filter((f: any) => f.status === 'enable')
        .map((f: any) => ({
          id: f.name,
          name: f.name,
          icon: f.icon
        }));
      setActivityTypes(types);
    }).catch(console.error);

    // Check for existing data (resubmission)
    const loadExistingData = async () => {
      try {
        const data = await getOnboardingData();

        if (data && data.type === 'activity' && data.doc && ['pending', 'draft', 'rejected'].includes(data.doc.status)) {
          const doc = data.doc;
          console.log('Loading existing activity data:', doc);

          console.log('--- DEBUG: Activity Data Fields ---');
          console.log('selectedActivities:', doc.selectedActivities);
          console.log('features:', doc.features);
          console.log('activityName:', doc.activityName);
          console.log('description:', doc.description);
          console.log('coverImage:', doc.coverImage);
          console.log('photos:', doc.photos);
          console.log('rulesAndRegulations:', doc.rulesAndRegulations);
          console.log('regularPrice:', doc.regularPrice);
          console.log('personCapacity:', doc.personCapacity);
          console.log('timeDuration:', doc.timeDuration);
          console.log('locality:', doc.locality);
          console.log('state:', doc.state);
          console.log('city:', doc.city);
          console.log('pincode:', doc.pincode);
          console.log('priceIncludes:', doc.priceIncludes);
          console.log('priceExcludes:', doc.priceExcludes);
          console.log('expectations:', doc.expectations);

          console.log('Discounts - First User:', { active: doc.firstUserDiscount, type: doc.discountType, amount: doc.discountAmount, final: doc.finalPrice });
          console.log('Discounts - Festival:', { active: doc.festivalOffers, type: doc.festivalDiscountType, amount: doc.festivalDiscountAmount, final: doc.festivalFinalPrice });
          console.log('Discounts - Weekly:', { active: doc.weeklyOffers, type: doc.weeklyDiscountType, amount: doc.weeklyDiscountAmount, final: doc.weeklyFinalPrice });
          console.log('Discounts - Special:', { active: doc.specialOffers, type: doc.specialDiscountType, amount: doc.specialDiscountAmount, final: doc.specialFinalPrice });

          console.log('Business Details:', {
            brandName: doc.brandName,
            legalCompanyName: doc.legalCompanyName,
            gstNumber: doc.gstNumber,
            businessEmail: doc.businessEmail,
            businessPhone: doc.businessPhone,
            businessLocality: doc.businessLocality,
            businessPincode: doc.businessPincode,
            businessCity: doc.businessCity,
            businessState: doc.businessState
          });

          console.log('Personal Details:', {
            firstName: doc.firstName,
            lastName: doc.lastName,
            personalLocality: doc.personalLocality,
            personalPincode: doc.personalPincode,
            personalCity: doc.personalCity,
            personalState: doc.personalState,
            dateOfBirth: doc.dateOfBirth,
            maritalStatus: doc.maritalStatus,
            idProof: doc.idProof,
            idPhotos: doc.idPhotos
          });
          console.log('-----------------------------------');

          setStatus(doc.status);
          setRejectionReason(doc.rejectionReason || "");

          // Map backend data to frontend formData
          setFormData(prev => ({
            ...prev,
            selectedActivities: doc.selectedActivities || [],
            features: doc.features || [],
            activityName: doc.activityName || "",
            description: doc.description || "",
            coverImage: doc.coverImage || null,
            photos: doc.photos || [],
            rulesAndRegulations: doc.rulesAndRegulations || [],

            regularPrice: String(doc.regularPrice || ""),
            personCapacity: doc.personCapacity || 1,
            timeDuration: doc.timeDuration || "",
            locality: doc.locality || "India",
            state: doc.state || "",
            city: doc.city || "",
            pincode: doc.pincode || "",

            priceIncludes: doc.priceIncludes || [],
            priceExcludes: doc.priceExcludes || [],
            expectations: doc.expectations || [],

            firstUserDiscount: doc.firstUserDiscount ?? true,
            discountType: doc.discountType || "",
            discountAmount: String(doc.discountAmount || ""),
            finalPrice: String(doc.finalPrice || ""),

            festivalOffers: doc.festivalOffers ?? false,
            festivalDiscountType: doc.festivalDiscountType || "",
            festivalDiscountAmount: String(doc.festivalDiscountAmount || ""),
            festivalFinalPrice: String(doc.festivalFinalPrice || ""),

            weeklyOffers: doc.weeklyOffers ?? false,
            weeklyDiscountType: doc.weeklyDiscountType || "",
            weeklyDiscountAmount: String(doc.weeklyDiscountAmount || ""),
            weeklyFinalPrice: String(doc.weeklyFinalPrice || ""),

            specialOffers: doc.specialOffers ?? false,
            specialDiscountType: doc.specialDiscountType || "",
            specialDiscountAmount: String(doc.specialDiscountAmount || ""),
            specialFinalPrice: String(doc.specialFinalPrice || ""),

            brandName: doc.brandName || "",
            legalCompanyName: doc.legalCompanyName || "",
            gstNumber: doc.gstNumber || "",
            businessEmail: doc.businessEmail || "",
            businessPhone: doc.businessPhone || "",
            businessLocality: doc.businessLocality || "India",
            businessPincode: doc.businessPincode || "",
            businessCity: doc.businessCity || "",
            businessState: doc.businessState || "",

            firstName: doc.firstName || "",
            lastName: doc.lastName || "",
            personalLocality: doc.personalLocality || "India",
            personalPincode: doc.personalPincode || "",
            personalCity: doc.personalCity || "",
            personalState: doc.personalState || "",
            dateOfBirth: doc.dateOfBirth || "",
            maritalStatus: doc.maritalStatus || "",
            idProof: doc.idProof || "",
            idPhotos: doc.idPhotos || [],

            termsAccepted: false,
          }));
        } else if (userDetails && user?.userType !== 'vendor') {
           console.log("Auto-filling from userDetails:", userDetails);

           console.log('--- DEBUG: User Details Auto-fill ---');
           console.log('Personal Details:', {
              firstName: userDetails.firstName,
              lastName: userDetails.lastName,
              personalLocality: userDetails.personalLocality,
              personalPincode: userDetails.personalPincode,
              personalCity: userDetails.city,
              personalState: userDetails.state,
              dateOfBirth: userDetails.dateOfBirth,
              maritalStatus: userDetails.maritalStatus,
              idProof: userDetails.idProof,
              idPhotos: userDetails.idPhotos
           });

           console.log('Business Details:', {
              brandName: userDetails.business?.brandName,
              legalCompanyName: userDetails.business?.legalCompanyName,
              gstNumber: userDetails.business?.gstNumber,
              businessEmail: userDetails.business?.email,
              businessPhone: userDetails.business?.phoneNumber,
              businessLocality: userDetails.business?.locality,
              businessPincode: userDetails.business?.pincode,
              businessCity: userDetails.business?.city,
              businessState: userDetails.business?.state
           });
           console.log('-------------------------------------');

           // Auto-fill from user details if no draft exists
           setFormData(prev => ({
              ...prev,
              firstName: userDetails.firstName || "",
              lastName: userDetails.lastName || "",
              personalLocality: userDetails.personalLocality || "India",
              personalPincode: userDetails.personalPincode || "",
              personalCity: userDetails.city || "",
              personalState: userDetails.state || "",
              dateOfBirth: userDetails.dateOfBirth ? new Date(userDetails.dateOfBirth).toISOString().split('T')[0] : "",
              maritalStatus: userDetails.maritalStatus || "",
              idProof: userDetails.idProof || "",
              idPhotos: userDetails.idPhotos || [],

              brandName: userDetails.business?.brandName || "",
              legalCompanyName: userDetails.business?.legalCompanyName || "",
              gstNumber: userDetails.business?.gstNumber || "",
              businessEmail: userDetails.business?.email || "",
              businessPhone: userDetails.business?.phoneNumber || "",
              businessLocality: userDetails.business?.locality || "India",
              businessPincode: userDetails.business?.pincode || "",
              businessCity: userDetails.business?.city || "",
              businessState: userDetails.business?.state || "",
           }));
        }
      } catch (err) {
        console.error("Failed to load existing onboarding data", err);
      }
    };

    loadExistingData();

  }, [userDetails]);

  // Auto-calculate final prices for discounts
  useEffect(() => {
    if (currentStep === 5) {
      setFormData(prev => {
        const basePrice = parseFloat(prev.regularPrice) || 0;
        let newData = { ...prev };
        let changed = false;

        // Only auto-seed when basePrice is known AND the field is still empty
        // (never override a value the user has manually entered)
        if (basePrice <= 0) return prev;

        const calculateFinal = (type: string, value: string) => {
           const val = parseFloat(value) || 0;
           if (type === 'percentage') {
               return Math.max(0, basePrice - (basePrice * val / 100)).toFixed(0);
           } else {
               return Math.max(0, basePrice - val).toFixed(0);
           }
        };

        if (prev.firstUserDiscount && !prev.finalPrice) {
            newData.finalPrice = calculateFinal(prev.discountType, prev.discountAmount);
            changed = true;
        }

        if (prev.festivalOffers && !prev.festivalFinalPrice) {
            newData.festivalFinalPrice = calculateFinal(prev.festivalDiscountType, prev.festivalDiscountAmount);
            changed = true;
        }

        if (prev.weeklyOffers && !prev.weeklyFinalPrice) {
            newData.weeklyFinalPrice = calculateFinal(prev.weeklyDiscountType, prev.weeklyDiscountAmount);
            changed = true;
        }

        if (prev.specialOffers && !prev.specialFinalPrice) {
            newData.specialFinalPrice = calculateFinal(prev.specialDiscountType, prev.specialDiscountAmount);
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
      formData.specialDiscountAmount
  ]);

  // Navigation Handlers
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    } else {
      navigate("/onboarding/service-selection");
    }
  };

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const submitActivity = async () => {
    try {
      setIsLoading(true);

      // Basic validation
      if (!formData.activityName || !formData.activityName.trim()) {
        throw new Error("Activity name is required");
      }

      if (
        !formData.selectedActivities ||
        formData.selectedActivities.length === 0
      ) {
        throw new Error("Please select at least one activity type");
      }

      const regPrice = Number(formData.regularPrice);
      if (!formData.regularPrice || isNaN(regPrice) || regPrice <= 0) {
        throw new Error("Please enter a valid price");
      }

      // Convert selected photos to data URLs so server can map to Offer.photos
      const coverImageData = formData.coverImage
        ? (formData.coverImage instanceof File ? await fileToDataUrl(formData.coverImage) : formData.coverImage)
        : null;
      const photosData = await Promise.all(
        (formData.photos || []).map((f: any) => (f instanceof File ? fileToDataUrl(f) : f)),
      );
      const idPhotosData = await Promise.all(
        (formData.idPhotos || []).map((f: any) => (f instanceof File ? fileToDataUrl(f) : f)),
      );

      const clean = {
        ...formData,
        regularPrice: regPrice,
        personCapacity: Number(formData.personCapacity),
        finalPrice: Number(formData.finalPrice) || 0,
        coverImage: coverImageData,
        photos: photosData,
        idPhotos: idPhotosData,
      };

      const result = await submitOnboardingData("activity", clean);

      // Update user details for auto-fill in future
      await updateUserDetails({
        firstName: clean.firstName,
        lastName: clean.lastName,
        phoneNumber: clean.businessPhone,
        country: (clean as any).personalCountry,
        personalLocality: clean.personalLocality,
        personalPincode: clean.personalPincode,
        city: clean.personalCity,
        state: clean.personalState,
        dateOfBirth: clean.dateOfBirth,
        maritalStatus: clean.maritalStatus,
        idProof: clean.idProof,
        idPhotos: clean.idPhotos as string[],
        business: {
          brandName: clean.brandName,
          legalCompanyName: clean.legalCompanyName,
          gstNumber: clean.gstNumber,
          email: clean.businessEmail,
          phoneNumber: clean.businessPhone,
          locality: clean.businessLocality,
          pincode: clean.businessPincode,
          city: clean.businessCity,
          state: clean.businessState,
        }
      });

      updateUserType('vendor');
      toast.success("Activity onboarding saved successfully!");
      return result;
    } catch (e: any) {
      toast.error(e?.message || "Failed to save activity onboarding");
      throw e;
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = async () => {
    setErrors({});
    let newErrors: { [key: string]: string } = {};
    let isValid = true;

    // Per-step validation
    if (currentStep === 0) {
      if (
        !formData.selectedActivities ||
        formData.selectedActivities.length === 0
      ) {
        toast.error("Please select at least one activity type");
        return;
      }
    } else if (currentStep === 1) {
      if (!formData.features || formData.features.length === 0) {
        toast.error("Please select at least one feature");
        return;
      }
    } else if (currentStep === 2) {
      if (!formData.activityName || !formData.activityName.trim()) {
        newErrors.activityName = "Activity name is required";
        isValid = false;
      }
      if (!formData.description || !formData.description.trim()) {
        newErrors.description = "Activity description is required";
        isValid = false;
      }
      if (!formData.coverImage) {
        newErrors.coverImage = "Cover image is required";
        isValid = false;
      }
      if (!formData.photos || formData.photos.length < 5) {
        newErrors.photos = "At least 5 photos are required";
        isValid = false;
      }
    } else if (currentStep === 3) {
      const regPrice = Number(formData.regularPrice);
      if (!formData.regularPrice || isNaN(regPrice) || regPrice <= 0) {
        newErrors.regularPrice = "Please enter a valid regular price";
        isValid = false;
      }
      if (!formData.locality || !formData.locality.trim()) {
        newErrors.locality = "Locality is required";
        isValid = false;
      }
      if (!formData.state) {
        newErrors.state = "State is required";
        isValid = false;
      }
      if (!formData.city) {
        newErrors.city = "City is required";
        isValid = false;
      }
      if (!formData.pincode) {
        newErrors.pincode = "Pincode is required";
        isValid = false;
      }
    } else if (currentStep === 4) {
      // Inclusion/Exclusion - optional
    } else if (currentStep === 5) {
      if (formData.firstUserDiscount) {
        if (!formData.discountType) {
          newErrors.discountType = "Discount type is required";
          isValid = false;
        }
        if (!formData.discountAmount) {
          newErrors.discountAmount = "Discount amount is required";
          isValid = false;
        }
        if (!formData.finalPrice) {
          newErrors.finalPrice = "Final price is required";
          isValid = false;
        }
      }
      if (formData.festivalOffers) {
        if (!formData.festivalDiscountType) {
          newErrors.festivalDiscountType = "Discount type is required";
          isValid = false;
        }
        if (!formData.festivalDiscountAmount) {
          newErrors.festivalDiscountAmount = "Discount amount is required";
          isValid = false;
        }
        if (!formData.festivalFinalPrice) {
          newErrors.festivalFinalPrice = "Final price is required";
          isValid = false;
        }
      }
      if (formData.weeklyOffers) {
        if (!formData.weeklyDiscountType) {
          newErrors.weeklyDiscountType = "Discount type is required";
          isValid = false;
        }
        if (!formData.weeklyDiscountAmount) {
          newErrors.weeklyDiscountAmount = "Discount amount is required";
          isValid = false;
        }
        if (!formData.weeklyFinalPrice) {
          newErrors.weeklyFinalPrice = "Final price is required";
          isValid = false;
        }
      }
      if (formData.specialOffers) {
        if (!formData.specialDiscountType) {
          newErrors.specialDiscountType = "Discount type is required";
          isValid = false;
        }
        if (!formData.specialDiscountAmount) {
          newErrors.specialDiscountAmount = "Discount amount is required";
          isValid = false;
        }
        if (!formData.specialFinalPrice) {
          newErrors.specialFinalPrice = "Final price is required";
          isValid = false;
        }
      }
    } else if (currentStep === 6) {
      if (!formData.brandName || !formData.brandName.trim()) {
        newErrors.brandName = "Brand name is required";
        isValid = false;
      }
      if (!formData.businessLocality || !formData.businessLocality.trim()) {
        newErrors.businessLocality = "Business locality is required";
        isValid = false;
      }
      if (!formData.legalCompanyName || !formData.legalCompanyName.trim()) {
        newErrors.legalCompanyName = "Legal Company name is required";
        isValid = false;
      }
      if (!formData.businessPhone || !formData.businessPhone.trim()) {
        newErrors.businessPhone = "Business Phone is required";
        isValid = false;
      }
      if (!formData.businessCity) {
        newErrors.businessCity = "Business City is required";
        isValid = false;
      }
      if (!formData.businessState) {
        newErrors.businessState = "Business State is required";
        isValid = false;
      }
      if (!formData.businessPincode) {
        newErrors.businessPincode = "Business Pincode is required";
        isValid = false;
      }
    } else if (currentStep === 7) {
      if (!formData.firstName || !formData.firstName.trim()) {
        newErrors.firstName = "First name is required";
        isValid = false;
      }
      if (!formData.lastName || !formData.lastName.trim()) {
        newErrors.lastName = "Last name is required";
        isValid = false;
      }
      if (!formData.personalLocality || !formData.personalLocality.trim()) {
        newErrors.personalLocality = "Personal locality is required";
        isValid = false;
      }
      if (!formData.personalCity) {
        newErrors.personalCity = "Personal City is required";
        isValid = false;
      }
      if (!formData.personalState) {
        newErrors.personalState = "Personal State is required";
        isValid = false;
      }
      if (!formData.personalPincode) {
        newErrors.personalPincode = "Personal Pincode is required";
        isValid = false;
      } else if (!/^\d{6}$/.test(formData.personalPincode.trim())) {
        newErrors.personalPincode = "Enter a valid 6-digit pincode";
        isValid = false;
      }
      if (!formData.dateOfBirth) {
        newErrors.dateOfBirth = "Date of birth is required";
        isValid = false;
      }
      if (!formData.idProof) {
        newErrors.idProof = "ID proof type is required";
        isValid = false;
      }
      if (!formData.idPhotos || formData.idPhotos.length === 0) {
        newErrors.idPhotos = "ID proof photo is required";
        isValid = false;
      }
    } else if (currentStep === 8) {
      if (!formData.termsAccepted) {
        toast.error("You must accept the Terms & Conditions to proceed.");
        return;
      }
      // Save then navigate only if we received an ID
      try {
        const saved = await submitActivity();
        if (saved?.id) {
          onboardingService.setActivityId(saved.id);
          sessionStorage.setItem('onboardingId', saved.id);
          sessionStorage.setItem('onboardingType', 'activity');
          sessionStorage.setItem('id', saved.id);
          navigate("/onboarding/selfie-verification");
          return;
        } else {
          toast.error("Could not save onboarding. Please try again.");
          return;
        }
      } catch (e) {
        toast.error("Could not save onboarding. Please try again.");
        return;
      }
    }

    if (!isValid) {
      setErrors(newErrors);
      toast.error("Please fill all required fields correctly");
      return;
    }

    setCurrentStep((prev) => prev + 1);
  };

  // Update formData helper
  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for the field if it exists
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
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
  const addListItem = (
    key: "priceIncludes" | "priceExcludes" | "expectations",
    value: string
  ) => {
    if (!value.trim()) return;

    setFormData((prev) => ({
      ...prev,
      [key]: [...prev[key], value.trim()],
    }));
  };

  const removeListItem = (
    key: "priceIncludes" | "priceExcludes" | "expectations",
    index: number
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

  const handleFileUpload = (
    field: "photos" | "idPhotos",
    files: FileList | null,
  ) => {
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

  const removeFile = (
    field: "photos" | "idPhotos" | "coverImage",
    index?: number,
  ) => {
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
    businessMapQuery
  )}&output=embed`;

  const renderImageSrc = (fileOrUrl: any) => {
    if (!fileOrUrl) return "";
    if (typeof fileOrUrl === "string") return getImageUrl(fileOrUrl);
    try {
      return URL.createObjectURL(fileOrUrl);
    } catch (e) {
      console.error("Error creating object URL", e);
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
    value: string
  ) => {
    const fieldMap: Record<string, Record<string, string>> = {
      firstUser: { type: "discountType", value: "discountAmount", finalPrice: "finalPrice" },
      festival: { type: "festivalDiscountType", value: "festivalDiscountAmount", finalPrice: "festivalFinalPrice" },
      weekly: { type: "weeklyDiscountType", value: "weeklyDiscountAmount", finalPrice: "weeklyFinalPrice" },
      special: { type: "specialDiscountType", value: "specialDiscountAmount", finalPrice: "specialFinalPrice" },
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
  };

  const handleBusinessStateChange = (val: string) => {
    updateFormData("businessState", val);
    updateFormData("businessCity", "");
  };

  const handleBusinessCityChange = (val: string) => {
    updateFormData("businessCity", val);
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
  const idProofImage = formData.idPhotos.length > 0
    ? (typeof formData.idPhotos[0] === "string"
        ? formData.idPhotos[0]
        : (() => { try { return URL.createObjectURL(formData.idPhotos[0] as File); } catch { return null; } })())
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
      {status === 'rejected' && (
        <div className="w-full max-w-4xl mb-6 p-4 border border-red-200 bg-red-50 rounded-md">
          <h3 className="text-red-800 font-semibold mb-1">Service Rejected</h3>
          <p className="text-red-700 text-sm">
            Reason: {rejectionReason || 'No reason provided'}
          </p>
          <p className="text-red-600 text-xs mt-2">
            Please update the details and resubmit for approval.
          </p>
        </div>
      )}

      {/* Step 0: Activity Types */}
      {currentStep === 0 && (
        <TypeStep
          selectedActivities={formData.selectedActivities}
          activityTypes={activityTypes}
          onToggle={toggleActivityType}
        />
      )}

      {/* Step 1: Features */}
      {currentStep === 1 && (
        <FeaturesStep
          selectedActivities={formData.selectedActivities}
          selectedFeatures={formData.features}
          activityFeatures={activityFeatures}
          activityFeatureMap={activityFeatureMap}
          adminFeatures={adminFeatures}
          customFeatures={customFeatures}
          showCustomFeaturesInput={showCustomFeaturesInput}
          customFeatureInput={customFeatureInput}
          onToggleFeature={toggleFeature}
          onRemoveCustomFeature={handleRemoveCustomFeature}
          onSetShowCustomFeaturesInput={setShowCustomFeaturesInput}
          onSetCustomFeatureInput={setCustomFeatureInput}
          onAddCustomFeature={handleAddCustomFeature}
        />
      )}

      {/* Step 2: Activity Details */}
      {currentStep === 2 && (
        <DetailsStep
          activityName={formData.activityName}
          description={formData.description}
          coverImage={formData.coverImage}
          photos={formData.photos}
          rulesAndRegulations={formData.rulesAndRegulations}
          ruleInput={ruleInput}
          errors={errors}
          photoCarouselRef={photoCarouselRef as React.RefObject<HTMLDivElement>}
          onUpdateFormData={updateFormData}
          onCoverImageUpload={handleCoverImageUpload}
          onPhotoUpload={(files) => handleFileUpload("photos", files)}
          onRemoveFile={removeFile}
          onSetRuleInput={setRuleInput}
          onAddRule={handleAddRule}
          onRemoveRule={handleRemoveRule}
          renderImageSrc={renderImageSrc}
          setErrors={setErrors}
        />
      )}

      {/* Step 3: Pricing Details */}
      {currentStep === 3 && (
        <PricingStep
          regularPrice={formData.regularPrice}
          personCapacity={formData.personCapacity}
          timeDuration={formData.timeDuration}
          address={(formData as any).address || ""}
          locality={formData.locality}
          state={formData.state}
          city={formData.city}
          pincode={formData.pincode}
          errors={errors}
          locationData={data}
          onUpdateFormData={updateFormData}
          setFormData={setFormData as any}
        />
      )}

      {/* Step 4: Inclusion & Exclusion */}
      {currentStep === 4 && (
        <InclusionExclusionStep
          priceIncludes={formData.priceIncludes}
          priceExcludes={formData.priceExcludes}
          expectations={formData.expectations}
          onAddListItem={addListItem}
          onRemoveListItem={removeListItem}
        />
      )}

      {/* Step 5: Types of Discount */}
      {currentStep === 5 && (
        <DiscountOffersStep
          offers={discountOffers}
          onToggle={handleDiscountToggle}
          onOfferChange={handleDiscountOfferChange}
          errors={errors}
          weeklyLabel="Weekly or Monthly Offers"
        />
      )}

      {/* Step 6: Business Details */}
      {currentStep === 6 && (
        <BusinessDetailsStep
          values={{
            brandName: formData.brandName,
            companyName: formData.legalCompanyName,
            gstNumber: formData.gstNumber,
            businessEmail: formData.businessEmail,
            businessPhone: formData.businessPhone,
            pincode: formData.businessPincode,
          }}
          errors={errors}
          onChange={handleBusinessChange}
          selectedCountry={selectedCountry}
          onCountrySelect={setSelectedCountry}
          countryDialogOpen={countryDialogOpen}
          setCountryDialogOpen={setCountryDialogOpen}
          countries={countries}
          locationData={data}
          selectedState={formData.businessState}
          selectedCity={formData.businessCity}
          countryName={formData.businessLocality}
          onStateChange={handleBusinessStateChange}
          onCityChange={handleBusinessCityChange}
          mapSrc={mapSrcbusiness}
        />
      )}

      {/* Step 7: Personal Details */}
      {currentStep === 7 && (
        <PersonalDetailsStep
          values={{
            firstName: formData.firstName,
            lastName: formData.lastName,
            pincode: formData.personalPincode,
            dateOfBirth: formData.dateOfBirth,
            maritalStatus: formData.maritalStatus,
            idProof: formData.idProof,
          }}
          errors={errors}
          onChange={handlePersonalChange}
          locationData={data}
          selectedState={formData.personalState}
          selectedCity={formData.personalCity}
          countryName={formData.personalLocality}
          onStateChange={handlePersonalStateChange}
          onCityChange={handlePersonalCityChange}
          idProofImage={idProofImage}
          onIdProofUpload={handleIdProofUpload}
          uploadError={errors.idPhotos}
        />
      )}

      {/* Step 8: Terms & Conditions */}
      {currentStep === 8 && (
        <TermsConditionsStep
          termsAccepted={formData.termsAccepted}
          onTermsChange={(checked) => updateFormData("termsAccepted", checked)}
        />
      )}
    </OnboardingLayout>
  );
};

export default ActivityOnboarding;
