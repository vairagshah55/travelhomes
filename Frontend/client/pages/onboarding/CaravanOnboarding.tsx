import { Alert } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import LogoWebsite from "@/components/ui/LogoWebsite";
import { Toast } from "@/components/ui/toast";
import { Plus, X } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { PiVanBold, PiVanFill } from "react-icons/pi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { toast } from "sonner";
import { Country } from "country-state-city";
import * as Flags from "country-flag-icons/react/3x2";
import { Dialog, DialogBackdrop, DialogPanel } from "@headlessui/react";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cmsPublicApi } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";
import { submitOnboardingData, getOnboardingData } from "@/lib/api";
import { onboardingService } from "@/lib/onboardingService";
import { FaVanShuttle } from "react-icons/fa6";
import {
  Bath,
  Flame,
  Fan,
  User,
  Refrigerator,
  Wind,
  Tent,
  Utensils,
  Droplets,
  BedDouble,
  Table,
  Gamepad2,
  Gamepad,
  CupSoda,
  Microwave,
  CookingPot,
  MoreHorizontal,
  Wifi,
  Tv,
  Music,
  Zap,
  Shield,
  Coffee,
  Sun,
  Moon,
  Volume2,
  Lock,
  Map,
} from "lucide-react";
import { FaUserTie } from "react-icons/fa";
import { IoAdd } from "react-icons/io5";
import { useUserDetails } from "@/hooks/useUserDetails";

type CountryOption = {
  isoCode: string;
  name: string;
  countryCode?: string;
  dialCode?: string;
};

const countries: CountryOption[] = Country.getAllCountries().map((c) => ({
  isoCode: c.isoCode,
  name: c.name,
  countryCode: c.isoCode,
  dialCode: c.phonecode,
}));

interface FormData {
  // Step 0 - Caravan Descriptions
  name: string;
  description: string;
  rules: string[];
  photos: (string | File)[];
  coverImage: (string | File)[];

  // Step 1 - Camper Van Category
  category: string | null;

  // Step 2 - Features
  features: string[];

  // Step 3 - Capacity and Address
  seatingCapacity: number;
  sleepingCapacity: number;
  address:string;
  locality: string;
  state: string;
  city: string;
  pincode: string;

  // Step 4 - Pricing
  perKmCharge: string;
  perDayCharge: string;
  perKmIncludes: string[];
  perKmExcludes: string[];
  perDayIncludes: string[];
  perDayExcludes: string[];
  priceIncludes: string[];
  priceExcludes: string[];

  // Step 5 - Types of Discount
  firstUserDiscount: boolean;
  firstUserDiscountType: "percentage" | "fixed";
  firstUserDiscountValue: string;
  firstUserDiscountFinalPrice: string;

  festivalOffers: boolean;
  festivalOffersType: "percentage" | "fixed";
  festivalOffersValue: string;
  festivalOffersFinalPrice: string;

  weeklyMonthlyOffers: boolean;
  weeklyMonthlyOffersType: "percentage" | "fixed";
  weeklyMonthlyOffersValue: string;
  weeklyMonthlyOffersFinalPrice: string;

  specialOffers: boolean;
  specialOffersType: "percentage" | "fixed";
  specialOffersValue: string;
  specialOffersFinalPrice: string;

  // Step 6 - Business Details
  brandName: string;
  legalCompanyName: string;
  gstNumber: string;
  businessEmailId: string;
  businessPhoneNumber: string;
  businessAddress:string;
  businessLocality: string;
  personalLocality: string;
  businessState: string;
  businessCity: string;
  businessPincode: string;

  // Step 7 - Personal Details
  firstName: string;
  lastName: string;
  personalState: string;
  personalCity: string;
  personalPincode: string;
  dateOfBirth: string;
  maritalStatus: string;
  idProof: string;
  idPhotos: (string | File)[];
  termsAccepted: boolean;
}

const CaravanOnboarding = () => {
  const navigate = useNavigate();
  const { updateUserType, isAuthenticated, user } = useAuth();

  useEffect(() => {
    // Check if Caravan section is enabled
    cmsPublicApi.listHomepageSections().then((sections) => {
      const section = sections.find((s: any) => s.sectionKey === 'camper-van');
      if (section && !section.isVisible) {
        toast.error("Caravan onboarding is currently disabled.");
        navigate("/");
      }
    }).catch(console.error);

    if (!isAuthenticated) {
      toast.error("Please login to continue");
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const [currentStep, setCurrentStep] = useState(0);
const sliderRef = useRef(null);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    rules: [],
    photos: [],
    coverImage:[],
    category: null,
    features: [],
    seatingCapacity: 1,
    sleepingCapacity: 0,
    address:'',
    locality: "India",
    state: "",
    city: "",
    pincode: "",
    perKmCharge: "",
    perDayCharge: "",
    perKmIncludes: [],
    perKmExcludes: [],
    perDayIncludes: [],
    perDayExcludes: [],
    priceIncludes: [],
    priceExcludes: [],
    // Step 5
    firstUserDiscount: false,
    firstUserDiscountType: "percentage",
    firstUserDiscountValue: "",
    firstUserDiscountFinalPrice: "",
    
    festivalOffers: false,
    festivalOffersType: "percentage",
    festivalOffersValue: "",
    festivalOffersFinalPrice: "",

    weeklyMonthlyOffers: false,
    weeklyMonthlyOffersType: "percentage",
    weeklyMonthlyOffersValue: "",
    weeklyMonthlyOffersFinalPrice: "",

    specialOffers: false,
    specialOffersType: "percentage",
    specialOffersValue: "",
    specialOffersFinalPrice: "",

    brandName: "",
    legalCompanyName: "",
    gstNumber: "",
    businessEmailId: "",
    businessPhoneNumber: "",
    businessAddress:"",
    businessLocality: "India",
    personalLocality: "India",
    businessState: "",
    businessCity: "",
    businessPincode: "",
    firstName: "",
    lastName: "",
    personalState: "",
    personalCity: "",
    personalPincode: "",
    dateOfBirth: "",
    maritalStatus: "",
    idProof: "",
    idPhotos: [],
    termsAccepted: false,
  });
  console.log("Form Data:", formData);
  const [selected, setSelected] = useState<CountryOption | null>(
    countries[100],
  );
  const [open, setOpen] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [fileName, setFileName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const totalSteps = 9;
  const completedSteps = currentStep;
  const [data, setData] = useState([]);
  const [idProofImage, setIdProofImage] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [dynamicCategories, setDynamicCategories] = useState<any[]>([]);
  const [dynamicFeatures, setDynamicFeatures] = useState<any[]>([]);
  const [status, setStatus] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState<string>("");


  const { userDetails, updateUserDetails } = useUserDetails();

  // Populate country list on mount
  useEffect(() => {
    fetch("/countries_states_cities.json") // remove ../../.. for public/ path
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error("Failed to load countries:", err));

      // Fetch admin features
      cmsPublicApi.getFeatures("Camper Van").then(list => {
        const enabled = list.filter((f: any) => f.status === 'enable');
        setDynamicCategories(enabled.filter((f: any) => f.type === 'category'));
        setDynamicFeatures(enabled.filter((f: any) => f.type === 'feature' || !f.type));
      }).catch(console.error);

      // Check for existing data
      const loadExistingData = async () => {
        try {
          const data = await getOnboardingData();
          console.log("Fetched Onboarding Data:", data);

          if (data) {
            console.log("Data Type:", data.type);
            console.log("Has Doc:", !!data.doc);
            if (data.doc) {
              console.log("Doc Status:", data.doc.status);
              console.log("Full Doc Object:", data.doc);
            }
          }
          
          if (data && data.type === 'caravan' && data.doc && ['pending', 'draft', 'rejected'].includes(data.doc.status)) {
            const doc = data.doc;
            console.log('Loading existing caravan data into form:', doc);
            
            // Debug specific fields if they are missing
            console.log("Mapping fields - Name:", doc.name, "Category:", doc.category, "Photos:", doc.photos);

            console.log("Business Details (Draft):", {
              brandName: doc.brandName,
              legalCompanyName: doc.legalCompanyName,
              businessEmailId: doc.businessEmailId,
              businessPhoneNumber: doc.businessPhoneNumber,
              businessAddress: {
                locality: doc.businessLocality,
                state: doc.businessState,
                city: doc.businessCity,
                pincode: doc.businessPincode
              }
            });

            console.log("Personal Details (Draft):", {
              firstName: doc.firstName,
              lastName: doc.lastName,
              personalState: doc.personalState,
              personalCity: doc.personalCity,
              personalPincode: doc.personalPincode,
              dateOfBirth: doc.dateOfBirth,
              maritalStatus: doc.maritalStatus,
              idProof: doc.idProof
            });

            setFormData(prev => ({
              ...prev,
              name: doc.name || "",
              description: doc.description || "",
              rules: doc.rules || [],
              photos: Array.isArray(doc.photos) ? doc.photos : [],
              coverImage: Array.isArray(doc.coverImage) ? doc.coverImage : (typeof doc.coverImage === 'string' ? [doc.coverImage] : []),
              category: doc.category || null,
              features: doc.features || [],
              seatingCapacity: doc.seatingCapacity || 1,
              sleepingCapacity: doc.sleepingCapacity || 0,
              address: doc.address || "",
              locality: doc.locality || "India",
              state: doc.state || "",
              city: doc.city || "",
              pincode: doc.pincode || "",
              perKmCharge: String(doc.perKmCharge || ""),
              perDayCharge: String(doc.perDayCharge || ""),
              perKmIncludes: doc.perKmIncludes || [],
              perKmExcludes: doc.perKmExcludes || [],
              perDayIncludes: doc.perDayIncludes || [],
              perDayExcludes: doc.perDayExcludes || [],
              priceIncludes: doc.priceIncludes || [],
              priceExcludes: doc.priceExcludes || [],
              
              firstUserDiscount: doc.firstUserDiscount ?? false,
              firstUserDiscountType: doc.firstUserDiscountType || "percentage",
              firstUserDiscountValue: String(doc.firstUserDiscountValue || ""),
              firstUserDiscountFinalPrice: String(doc.firstUserDiscountFinalPrice || ""),
              
              festivalOffers: doc.festivalOffers ?? false,
              festivalOffersType: doc.festivalOffersType || "percentage",
              festivalOffersValue: String(doc.festivalOffersValue || ""),
              festivalOffersFinalPrice: String(doc.festivalOffersFinalPrice || ""),
              
              weeklyMonthlyOffers: doc.weeklyMonthlyOffers ?? false,
              weeklyMonthlyOffersType: doc.weeklyMonthlyOffersType || "percentage",
              weeklyMonthlyOffersValue: String(doc.weeklyMonthlyOffersValue || ""),
              weeklyMonthlyOffersFinalPrice: String(doc.weeklyMonthlyOffersFinalPrice || ""),
              
              specialOffers: doc.specialOffers ?? false,
              specialOffersType: doc.specialOffersType || "percentage",
              specialOffersValue: String(doc.specialOffersValue || ""),
              specialOffersFinalPrice: String(doc.specialOffersFinalPrice || ""),
              
              brandName: doc.brandName || "",
              legalCompanyName: doc.legalCompanyName || "",
              gstNumber: doc.gstNumber || "",
              businessEmailId: doc.businessEmailId || "",
              businessPhoneNumber: doc.businessPhoneNumber || "",
              businessLocality: doc.businessLocality || "India",
              personalLocality: doc.personalLocality || "India",
              businessState: doc.businessState || "",
              businessCity: doc.businessCity || "",
              businessPincode: doc.businessPincode || "",
              
              firstName: doc.firstName || "",
              lastName: doc.lastName || "",
              personalState: doc.personalState || "",
              personalCity: doc.personalCity || "",
              personalPincode: doc.personalPincode || "",
              dateOfBirth: doc.dateOfBirth || "",
              maritalStatus: doc.maritalStatus || "",
              idProof: doc.idProof || "",
              idPhotos: (Array.isArray(doc.idPhotos) && doc.idPhotos.length > 0) 
                  ? doc.idPhotos 
                  : [],
              
              termsAccepted: false,
            }));

            if (doc.idPhotos && doc.idPhotos.length > 0) {
              setIdProofImage(doc.idPhotos[0]);
            }
          } else if (userDetails && user?.userType !== 'vendor') {
             console.log("No valid draft found. Auto-filling from userDetails:", userDetails);
             
             console.log("Business Details (Auto-fill):", {
                brandName: userDetails.business?.brandName,
                legalCompanyName: userDetails.business?.legalCompanyName,
                businessEmailId: userDetails.business?.email,
                businessPhoneNumber: userDetails.business?.phoneNumber,
                businessAddress: {
                  locality: userDetails.business?.locality,
                  state: userDetails.business?.state,
                  city: userDetails.business?.city,
                  pincode: userDetails.business?.pincode
                }
             });

             console.log("Personal Details (Auto-fill):", {
                firstName: userDetails.firstName,
                lastName: userDetails.lastName,
                personalState: userDetails.state,
                personalCity: userDetails.city,
                personalPincode: userDetails.personalPincode,
                dateOfBirth: userDetails.dateOfBirth,
                maritalStatus: userDetails.maritalStatus,
                idProof: userDetails.idProof
             });

             // Auto-fill from user details if no draft exists
             setFormData(prev => ({
                ...prev,
                firstName: userDetails.firstName || "",
                lastName: userDetails.lastName || "",
                personalState: userDetails.state || "",
                personalCity: userDetails.city || "",
                personalPincode: userDetails.personalPincode || "",
                personalLocality: userDetails.personalLocality || "India",
                dateOfBirth: userDetails.dateOfBirth ? new Date(userDetails.dateOfBirth).toISOString().split('T')[0] : "",
                maritalStatus: userDetails.maritalStatus || "",
                idProof: userDetails.idProof || "",
                idPhotos: userDetails.idPhotos || [],
                
                brandName: userDetails.business?.brandName || "",
                legalCompanyName: userDetails.business?.legalCompanyName || "",
                gstNumber: userDetails.business?.gstNumber || "",
                businessEmailId: userDetails.business?.email || "",
                businessPhoneNumber: userDetails.business?.phoneNumber || "",
                businessLocality: userDetails.business?.locality || "India",
                businessState: userDetails.business?.state || "",
                businessCity: userDetails.business?.city || "",
                businessPincode: userDetails.business?.pincode || "",
             }));
             if (userDetails.idPhotos && userDetails.idPhotos.length > 0) {
               setIdProofImage(userDetails.idPhotos[0]);
             }
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
        const basePrice = parseFloat(prev.perDayCharge) || parseFloat(prev.perKmCharge) || 0;
        let newData = { ...prev };
        let changed = false;

        const calculateFinal = (type: string, value: string) => {
           const val = parseFloat(value) || 0;
           if (type === 'percentage') {
               return Math.max(0, basePrice - (basePrice * val / 100)).toFixed(0);
           } else {
               return Math.max(0, basePrice - val).toFixed(0);
           }
        };

        if (prev.firstUserDiscount) {
            const final = calculateFinal(prev.firstUserDiscountType, prev.firstUserDiscountValue);
            if (prev.firstUserDiscountFinalPrice !== final) {
                newData.firstUserDiscountFinalPrice = final;
                changed = true;
            }
        }
        
        if (prev.festivalOffers) {
            const final = calculateFinal(prev.festivalOffersType, prev.festivalOffersValue);
            if (prev.festivalOffersFinalPrice !== final) {
                newData.festivalOffersFinalPrice = final;
                changed = true;
            }
        }

        if (prev.weeklyMonthlyOffers) {
            const final = calculateFinal(prev.weeklyMonthlyOffersType, prev.weeklyMonthlyOffersValue);
            if (prev.weeklyMonthlyOffersFinalPrice !== final) {
                newData.weeklyMonthlyOffersFinalPrice = final;
                changed = true;
            }
        }

        if (prev.specialOffers) {
            const final = calculateFinal(prev.specialOffersType, prev.specialOffersValue);
            if (prev.specialOffersFinalPrice !== final) {
                newData.specialOffersFinalPrice = final;
                changed = true;
            }
        }

        return changed ? newData : prev;
      });
    }
  }, [
      currentStep, 
      formData.perDayCharge, 
      formData.perKmCharge,
      formData.firstUserDiscount, 
      formData.firstUserDiscountType, 
      formData.firstUserDiscountValue,
      formData.festivalOffers, 
      formData.festivalOffersType, 
      formData.festivalOffersValue,
      formData.weeklyMonthlyOffers, 
      formData.weeklyMonthlyOffersType, 
      formData.weeklyMonthlyOffersValue,
      formData.specialOffers, 
      formData.specialOffersType, 
      formData.specialOffersValue
  ]);

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    } else {
      navigate("/onboarding/service-selection");
    }
  };

  const handleNext = () => {
    // Per-step validation
    if (currentStep === 0) {
      const newErrors: Record<string, string> = {};
      let hasError = false;

      if (!formData.name || !formData.name.trim()) {
        newErrors.name = "Caravan name is required";
        hasError = true;
      }
      if (!formData.description || !formData.description.trim()) {
        newErrors.description = "Caravan description is required";
        hasError = true;
      }
      if (formData.photos.length < 5) {
        newErrors.photos = "Please upload at least 5 photos";
        hasError = true;
      }

      if (hasError) {
        setErrors(newErrors);
        return;
      }
      setErrors({});
    } else if (currentStep === 1) {
      if (!formData.category) {
        toast.error("Please select a caravan category");
        return;
      }
    } else if (currentStep === 2) {
      if (!formData.features || formData.features.length === 0) {
        toast.error("Please select at least one feature");
        return;
      }
    } else if (currentStep === 3) {
      if (!formData.locality || !formData.locality.trim()) {
        toast.error("Locality is required");
        return;
      }
      if (!formData.address || !formData.address.trim()) {
        toast.error("Address is required");
        return;
      }
      if (!formData.state || !formData.state.trim()) {
        toast.error("State is required");
        return;
      }
      if (!formData.city || !formData.city.trim()) {
        toast.error("City is required");
        return;
      }
      if (!formData.pincode || !formData.pincode.trim()) {
        toast.error("Pincode is required");
        return;
      }
    } else if (currentStep === 4) {
      const newErrors: Record<string, string> = {};
      let hasError = false;

      const hasPerKm = formData.perKmCharge && !isNaN(Number(formData.perKmCharge)) && Number(formData.perKmCharge) > 0;
      const hasPerDay = formData.perDayCharge && !isNaN(Number(formData.perDayCharge)) && Number(formData.perDayCharge) > 0;

      if (!hasPerKm && !hasPerDay) {
        toast.error("At least one price (Per KM or Per Day) is required");
        return;
      }

      if (hasPerKm) {
        if (!formData.perKmIncludes || !formData.perKmIncludes.some((i) => i.trim())) {
          newErrors.perKmIncludes = "Please add at least one inclusion";
          hasError = true;
        }
        if (!formData.perKmExcludes || !formData.perKmExcludes.some((i) => i.trim())) {
          newErrors.perKmExcludes = "Please add at least one exclusion";
          hasError = true;
        }
      }

      if (hasPerDay) {
        if (!formData.perDayIncludes || !formData.perDayIncludes.some((i) => i.trim())) {
          newErrors.perDayIncludes = "Please add at least one inclusion";
          hasError = true;
        }
        if (!formData.perDayExcludes || !formData.perDayExcludes.some((i) => i.trim())) {
          newErrors.perDayExcludes = "Please add at least one exclusion";
          hasError = true;
        }
      }

      if (hasError) {
        setErrors(newErrors);
        return;
      }
      setErrors({});
    } else if (currentStep === 5) {
      const newErrors: Record<string, string> = {};
      let hasError = false;

      // Validate First User Discount
      if (formData.firstUserDiscount) {
        if (!formData.firstUserDiscountValue) {
          newErrors.firstUserDiscountValue = "Discount value is required";
          hasError = true;
        }
        if (!formData.firstUserDiscountFinalPrice) {
          newErrors.firstUserDiscountFinalPrice = "Final price is required";
          hasError = true;
        }
      }

      // Validate Festival Offers
      if (formData.festivalOffers) {
        if (!formData.festivalOffersValue) {
          newErrors.festivalOffersValue = "Discount value is required";
          hasError = true;
        }
        if (!formData.festivalOffersFinalPrice) {
          newErrors.festivalOffersFinalPrice = "Final price is required";
          hasError = true;
        }
      }

      // Validate Weekly/Monthly Offers
      if (formData.weeklyMonthlyOffers) {
        if (!formData.weeklyMonthlyOffersValue) {
          newErrors.weeklyMonthlyOffersValue = "Discount value is required";
          hasError = true;
        }
        if (!formData.weeklyMonthlyOffersFinalPrice) {
          newErrors.weeklyMonthlyOffersFinalPrice = "Final price is required";
          hasError = true;
        }
      }

      // Validate Special Offers
      if (formData.specialOffers) {
        if (!formData.specialOffersValue) {
          newErrors.specialOffersValue = "Discount value is required";
          hasError = true;
        }
        if (!formData.specialOffersFinalPrice) {
          newErrors.specialOffersFinalPrice = "Final price is required";
          hasError = true;
        }
      }

      if (hasError) {
        setErrors(newErrors);
        return;
      }
      setErrors({});
    } else if (currentStep === 6) {
      const newErrors: Record<string, string> = {};
      let hasError = false;

      if (!formData.brandName || !formData.brandName.trim()) {
        newErrors.brandName = "Brand name is required";
        hasError = true;
      }
      
      if (!formData.businessPhoneNumber || !formData.businessPhoneNumber.trim() || formData.businessPhoneNumber.length !== 10) {
        newErrors.businessPhoneNumber = "Valid business phone number is required";
        hasError = true;
      }

      if (hasError) {
        setErrors(newErrors);
        return;
      }
      setErrors({});
    } else if (currentStep === 7) {
      const newErrors: Record<string, string> = {};
      let hasError = false;

      if (!formData.firstName || !formData.firstName.trim()) {
        newErrors.firstName = "First name is required";
        hasError = true;
      }
      if (!formData.lastName || !formData.lastName.trim()) {
        newErrors.lastName = "Last name is required";
        hasError = true;
      }
      if (!formData.personalLocality || !formData.personalLocality.trim()) {
        newErrors.personalLocality = "Country is required";
        hasError = true;
      }
      if (!formData.personalState || !formData.personalState.trim()) {
        newErrors.personalState = "State is required";
        hasError = true;
      }
      if (!formData.personalCity || !formData.personalCity.trim()) {
        newErrors.personalCity = "City is required";
        hasError = true;
      }
      if (!formData.personalPincode || !formData.personalPincode.trim()) {
        newErrors.personalPincode = "Pincode is required";
        hasError = true;
      }
      if (!formData.dateOfBirth) {
        newErrors.dateOfBirth = "Date of Birth is required";
        hasError = true;
      }
      if (!formData.maritalStatus) {
        newErrors.maritalStatus = "Marital Status is required";
        hasError = true;
      }
      if (!formData.idProof) {
        newErrors.idProof = "ID Proof type is required";
        hasError = true;
      }
      if (!formData.idPhotos || formData.idPhotos.length === 0) {
        newErrors.idPhotos = "ID Proof photo is required";
        hasError = true;
      }

      if (hasError) {
        setErrors(newErrors);
        return;
      }
      setErrors({});
    } else if (currentStep === 8) {
      if (!formData.termsAccepted) {
        toast.error("You must accept the Terms & Conditions to proceed.");
        return;
      }
    }

    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const fileToDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const renderImageSrc = (fileOrUrl: any) => {
    if (!fileOrUrl) return "";
    if (typeof fileOrUrl === "string") return getImageUrl(fileOrUrl);
    return URL.createObjectURL(fileOrUrl);
  };

  const handleComplete = async () => {
    try {
      setIsLoading(true);

      // Basic validation
      if (!formData.name || !formData.name.trim()) {
        throw new Error("Caravan name is required");
      }

      if (!formData.category) {
        throw new Error("Please select a caravan category");
      }

      const pdCharge = Number(formData.perDayCharge) || 0;
      const pkCharge = Number(formData.perKmCharge) || 0;

      if (pdCharge <= 0 && pkCharge <= 0) {
        throw new Error("At least one price (Per KM or Per Day) is required");
      }

      // Merge includes and excludes
      const mergedIncludes = [
        ...(formData.perKmIncludes || []),
        ...(formData.perDayIncludes || [])
      ].filter(i => i && i.trim());

      const mergedExcludes = [
        ...(formData.perKmExcludes || []),
        ...(formData.perDayExcludes || [])
      ].filter(i => i && i.trim());

      // Convert File objects to data URLs so server can persist Offer.photos
      const photosData: string[] = await Promise.all(
        ((formData.photos as any[]) || []).map((f: any) =>
          typeof f === "string" ? Promise.resolve(f) : fileToDataUrl(f),
        ),
      );
      const photosCoverImage: string[] = await Promise.all(
        ((formData.coverImage as any[]) || []).map((f: any) =>
          typeof f === "string" ? Promise.resolve(f) : fileToDataUrl(f),
        ),
      );
      const idPhotosData: string[] = await Promise.all(
        ((formData.idPhotos as any[]) || []).map((f: any) =>
          typeof f === "string" ? Promise.resolve(f) : fileToDataUrl(f),
        ),
      );

      const payload = {
        ...formData,
        perDayCharge: pdCharge,
        perKmCharge: pkCharge.toString(), // Ensure string if interface expects it, or keep number if updated. Interface says string.
        priceIncludes: mergedIncludes,
        priceExcludes: mergedExcludes,
        finalPrice: 0,
        seatingCapacity: Number(formData.seatingCapacity),
        sleepingCapacity: Number(formData.sleepingCapacity),
        photos: photosData,
        idPhotos: idPhotosData,
        coverImage: photosCoverImage,
      };

      console.log("Submitting caravan onboarding data...");

      const result = await submitOnboardingData("caravan", payload);

      if (result?.id) {
        // Update user profile with personal & business details
        await updateUserDetails({
            firstName: formData.firstName,
            lastName: formData.lastName,
            phoneNumber: formData.businessPhoneNumber,
            country: formData.personalCountry,
            state: formData.personalState,
            city: formData.personalCity,
            personalPincode: formData.personalPincode,
            personalLocality: formData.personalLocality,
            dateOfBirth: formData.dateOfBirth,
            maritalStatus: formData.maritalStatus,
            idProof: formData.idProof,
            idPhotos: idPhotosData,
            
            business: {
              brandName: formData.brandName,
              legalCompanyName: formData.legalCompanyName,
              gstNumber: formData.gstNumber,
              email: formData.businessEmailId,
              phoneNumber: formData.businessPhoneNumber,
              locality: formData.businessLocality,
              state: formData.businessState,
              city: formData.businessCity,
              pincode: formData.businessPincode,
            }
        });

        onboardingService.setCaravanId(result.id);
        sessionStorage.setItem('onboardingId', result.id);
        sessionStorage.setItem('onboardingType', 'caravan');
        sessionStorage.setItem('id', result.id);
        updateUserType('vendor');
        toast.success("Caravan onboarding saved successfully!");
        navigate("/onboarding/selfie-verification");
        return;
      } else {
        toast.error("Could not save onboarding. Please try again.");
      }
    } catch (e: any) {
      console.error("Error in handleComplete:", e);
      toast.error(e?.message || "Failed to save caravan onboarding");
    } finally {
      setIsLoading(false);
    }
  };

  const addRule = () => {
    setFormData((prev) => ({
      ...prev,
      rules: [...prev.rules, ""],
    }));
  };
  const removeRule = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      rules: prev.rules.filter((_, i) => i !== index),
    }));
  };

  const updateRule = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      rules: prev.rules.map((rule, i) => (i === index ? value : rule)),
    }));
  };

  const addPriceItem = (field: "perKmIncludes" | "perKmExcludes" | "perDayIncludes" | "perDayExcludes") => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...prev[field], ""],
    }));
  };

  const updatePriceItem = (
    field: "perKmIncludes" | "perKmExcludes" | "perDayIncludes" | "perDayExcludes",
    index: number,
    value: string,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
    }));
  };

  const removePriceItem = (field: "perKmIncludes" | "perKmExcludes" | "perDayIncludes" | "perDayExcludes", index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  }

  const toggleFeature = (feature: string) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter((f) => f !== feature)
        : [...prev.features, feature],
    }));
  };

  const adjustCapacity = (
    type: "seating" | "sleeping",
    direction: "increase" | "decrease",
  ) => {
    const field = type === "seating" ? "seatingCapacity" : "sleepingCapacity";
    setFormData((prev) => ({
      ...prev,
      [field]:
        direction === "increase"
          ? prev[field] + 1
          : Math.max(1, prev[field] - 1),
    }));
  };



  const handleFileUpload = (
    field: "photos" | "idPhotos",
    files: FileList | null,
  ) => {
    if (!files) return;

    setFormData((prev) => {
      const currentFiles = prev[field] || [];
      const remainingSlots = 15 - currentFiles.length;
      if (files.length > remainingSlots) {
        toast.error("Upload limit exceeded!");
        console.log("Upload limit exceeded!");
        return prev;
      }
      const newFiles = Array.from(files).slice(0, remainingSlots);
      const updatedFiles = [...currentFiles, ...newFiles];
      console.log("Upload limit remains");
      return {
        ...prev,
        [field]: updatedFiles,
      };
    });
  };
  const handleCoverFileUpload = (
    field: "coverImage",
    files: FileList | null,
  ) => {
    if (!files) return;

    setFormData((prev) => {
      const currentFiles = prev[field] || [];
      const remainingSlots = 2 - currentFiles.length;
      if (files.length > remainingSlots) {
        toast.error("Upload limit exceeded!");
        console.log("Upload limit exceeded!");
        return prev;
      }
      const newFiles = Array.from(files).slice(0, remainingSlots);
      const updatedFiles = [...currentFiles, ...newFiles];
      console.log("Upload limit remains");
      return {
        ...prev,
        [field]: updatedFiles,
      };
    });
  };

  const removeCoverFile = (field: "coverImage", index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };
  const removeFile = (field: "photos" | "idPhotos", index: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index),
    }));
  };

  const handleUploadIDProof = (e) => {
    const file = e.target.files[0];
    setUploadError("");
    setFileName("");

    if (file) {
      const validTypes = ["image/jpeg", "image/png", "application/pdf"];
      if (!validTypes.includes(file.type)) {
        setUploadError("Only JPG, PNG, or PDF files are allowed.");
        return;
      }
      // Removed 1MB size restriction per request
      // if (file.size > 1048576) {
      //   setError("File size must be 1MB or less.");
      //   return;
      // }
      setFileName(file.name);
      setIdProofImage(URL.createObjectURL(file));
      
      setFormData((prev) => ({
        ...prev,
        idPhotos: [file],
      }));

      if (errors.idPhotos) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.idPhotos;
          return newErrors;
        });
      }
    }
  };

  const [customFeatures, setCustomFeatures] = useState<{ name: string; icon: any }[]>([]);
  const [showCustomFeaturesInput, setShowCustomFeaturesInput] = useState(false);
  const [customFeatureInput, setCustomFeatureInput] = useState("");



const mapQuery = `${formData.address || ""} ${formData.city || ""} ${formData.state || ""} ${formData.pincode || ""} India`;

const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(
  mapQuery
)}&output=embed`;


const businessMapQuery = `
  ${formData.businessCity || ""}
  ${formData.businessState || ""}
  ${formData.businessPincode || ""}
  India
`;

const mapSrcbusiness = `https://www.google.com/maps?q=${encodeURIComponent(
  businessMapQuery
)}&output=embed`;

  return (
    <>
      <div className="min-h-screen w-full flex flex-col gap-1 bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex w-full bg-white  z-30 fixed items-center justify-start max-md:px-4 md:px-10 py-2">
        <LogoWebsite />
      </div>

      {/* Main Content */}
      <div className={`px-5 md:px-10 py-[110px] z-10 ${currentStep === 8 ? "h-screen overflow-hidden" : ""}`}>
        <div className="max-w-7xl mx-auto z-10">
          {/* Step 0 - Caravan Descriptions */}
          {currentStep === 0 && (
            <div className="w-full flex flex-col gap-9">
              <div className="flex flex-col items-center gap-5 max-sm:gap-3">
                <h1 className="text-[32px] max-sm:text-xl font-semibold text-black dark:text-white font-sanse text-center">
                  Caravan Descriptions
                </h1>

                <div className="w-full max-w-4xl mx-auto flex flex-col gap-5">
                  {/* Name */}
                  <div className="flex flex-col gap-2 w-full">
                    <div className="flex items-center gap-2 pl-1">
                      <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans']">
                        Name
                      </label>
                    </div>
                    <div className="relative w-full ">
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => {
                          setFormData((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }));
                          if (errors.name) {
                            setErrors((prev) => {
                              const newErrors = { ...prev };
                              delete newErrors.name;
                              return newErrors;
                            });
                          }
                        }}
                        placeholder="Name"
                        required
                        maxLength={50}
                        className={`w-full h-[50px] px-3 py-4 border ${
                          errors.name ? "border-red-500" : "border-[#EAECF0]"
                        } rounded-lg text-sm text-[#121213] font-['Plus_Jakarta_Sans'] focus:outline-none focus:border-[#131313] dark:bg-gray-800 dark:border-gray-600 dark:text-white`}
                      />
                    <div className="flex justify-between w-full">
                       <div> {errors.name && <span className="text-xs text-red-500">{errors.name}</span>}
                    </div>
                        <div className="text-right text-xs text-[#334054] dark:text-gray-400 mt-1 px-[6px]">
                        {formData.name.length}/50
                      </div>
                   
                    </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 pl-1">
                      <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans']">
                        Descriptions
                      </label>
                    </div>
                    <div className="relative">
                      <textarea
                        value={formData.description}
                        onChange={(e) => {
                          setFormData((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }));
                          if (errors.description) {
                            setErrors((prev) => {
                              const newErrors = { ...prev };
                              delete newErrors.description;
                              return newErrors;
                            });
                          }
                        }}
                        placeholder="Write here..."
                        maxLength={200}
                        className={`w-full h-24 px-3 py-4 border ${
                          errors.description ? "border-red-500" : "border-[#EAECF0]"
                        } rounded-lg text-sm text-[#121213] font-['Plus_Jakarta_Sans'] resize-none focus:outline-none focus:border-[#131313] dark:bg-gray-800 dark:border-gray-600 dark:text-white`}
                      />
                      <div className="flex justify-between w-full">
                        <div>
                          {" "}
                          {errors.description && (
                            <span className="text-xs text-red-500">
                              {errors.description}
                            </span>
                          )}
                        </div>
                        <div className="text-right text-xs text-[#334054] dark:text-gray-400 mt-1 px-[6px]">
                          {formData.description.length}/200
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Rules & Regulation */}
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 pl-1">
                        <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans']">
                          Rules & Regulation
                        </label>
                      </div>
                    </div>
                    <div className="flex flex-col gap-4">
                      {formData.rules.map((rule, index) => (
                        <div className="w-full flex items-center gap-2">
                          <input
                            key={index}
                            type="text"
                            value={rule}
                            onChange={(e) => updateRule(index, e.target.value)}
                            placeholder="Add rules..."
                            maxLength={250}
                            className="w-full h-[50px] px-3 py-4 border border-[#EAECF0] rounded-lg text-sm text-[#121213] font-['Plus_Jakarta_Sans'] focus:outline-none focus:border-[#131313] dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                          />
                          <button
                            onClick={() => removeRule(index)}
                            className="w-[50px] h-[50px] p-3 bg-gray-200 rounded-lg flex items-center justify-center"
                          >
                            <X className="w-8 h-8" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={addRule}
                        className="flex items-center gap-2 px-3 py-0 rounded-[60px]"
                      >
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M0.75 6H11.25"
                            stroke="#131313"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M6 11.25L6 0.75"
                            stroke="#131313"
                            strokeWidth="1.2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span className="text-xs text-[#131313] font-sanse font-normal tracking-[-0.24px] leading-[160%]">
                          Add More
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Upload Photos */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base text-[#334054] flex flex-col">
                        Upload Cover Photo
                        <span className="text-[10px] text-gray-500">
Please upload a thumbnail image that   highlights your services and features. </span>
                      </Label>
                       {/* Add Cover Photo */}
                      <div className="relative w-60 h-10 border border-gray-200 rounded-lg flex items-center justify-center cursor-pointer">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) =>
                            handleCoverFileUpload("coverImage", e.target.files)
                          }
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <Plus className="w-5 h-5 text-gray-500" />
                        <span className="text-gray-500 text-sm font-medium">
                          Cover Photo
                        </span>
                      </div>
                    </div>
                     { /* ------------------ COVER IMAGE (FIRST IMAGE) ------------------ */}
    <div className="w-full relative h-64 max-w-xl border border-gray-200 rounded-xl overflow-hidden">
  {formData?.coverImage?.[0] ? (
    <img
      src={renderImageSrc(formData.coverImage[0])}
      alt="Cover"
      className="w-full h-full object-cover"
    />
  ) : (
    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
      No image selected
    </div>
  )}

  {formData?.coverImage?.[0] && (
    <button
      onClick={() => removeCoverFile("coverImage", 0)}
      className="absolute top-2 right-2 w-7 h-7 bg-white shadow-md hover:bg-gray-100 rounded-full flex items-center justify-center transition"
    >
      <X className="w-4 h-4 text-gray-600" />
    </button>
  )}
</div>


                    <div className="flex items-center justify-between">
                      <Label className="text-base text-[#334054] flex flex-col">
                        Upload Photos
                        <span className="text-[10px] text-gray-500">
                          Please upload photos that best highlight your services
                          and features{" "}
                        </span>
                      </Label>
                      {/* Add Cover Photo */}
                      <div
                        className={`relative w-60 h-10 border ${
                          errors.photos ? "border-red-500" : "border-gray-200"
                        } rounded-lg flex items-center justify-center cursor-pointer`}
                      >
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={(e) => {
                            handleFileUpload("photos", e.target.files);
                            if (errors.photos) {
                              setErrors((prev) => {
                                const newErrors = { ...prev };
                                delete newErrors.photos;
                                return newErrors;
                              });
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                        <Plus className="w-5 h-5 text-gray-500" />
                        <span className="text-gray-500 text-sm font-medium">
                          Add Photos
                        </span>
                      </div>
                    </div>
                    {errors.photos && (
                      <span className="text-xs text-red-500">
                        {errors.photos}
                      </span>
                    )}

<div className="flex items-start gap-6 flex-wrap max-sm:flex-col">

                     {/* Photo Grid */}
                      <div className="flex-1 space-y-3">
    {/* Carousel Container */}
    <div className="relative">
      {/* Left Arrow */}
      {formData.photos.length > 5 && (
        <button
          onClick={() => sliderRef.current.scrollBy({ left: -300, behavior: "smooth" })}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white shadow p-2 rounded-full"
        >
        <IoIosArrowBack />
        </button>
      )}

      {/* Images Scrollable Row */}
      <div
        ref={sliderRef}
        className="flex max-w-4xl max-md:w-[400px] items-start gap-3 overflow-x-auto scrollbar-hide scroll-smooth"
      >
        {formData.photos.slice(0, formData.photos.length).map((photo, index) => (
          <div
            key={index}
            className="relative w-44 h-52 max-sm:w-24 max-md:h- 24 border border-gray-200 rounded-lg overflow-hidden flex-shrink-0"
          >
            <img
              src={renderImageSrc(photo)}
              alt={`Upload ${index + 1}`}
              className="w-full h-full object-cover"
            />

            <button
              onClick={() => removeFile("photos", index)}
              className="absolute top-2 right-2 w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Right Arrow */}
      {formData.photos.length > 5 && (
        <button
          onClick={() => sliderRef.current.scrollBy({ left: 300, behavior: "smooth" })}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/80 hover:bg-white shadow p-2 rounded-full"
        >
        <IoIosArrowForward />

        </button>
      )}
    </div>
                      </div>

                      </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 1 - Choose Camper Van Category */}
          {currentStep === 1 && (
            <div className="w-full flex flex-col items-center gap-9">
              <h1 className="text-[32px] max-sm:text-xl font-bold text-black dark:text-white font-sanse text-center">
                Choose a Camper Van Category
              </h1>

              <div className="w-full max-w-4xl mx-auto flex flex-col gap-4">
                {dynamicCategories.map((category) => (
                  <div
                    key={category.id}
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        category: category.name,
                      }));
                    }}
                    className={`flex items-start gap-6 p-5 rounded-xl border cursor-pointer transition-all duration-200 ${
                      formData.category === category.name
                        ? "border-[#131313] dark:border-white bg-white dark:bg-gray-800"
                        : "border-[#EAECF0] dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-[#131313] dark:hover:border-white"
                    }`}
                  >
                    <img
                      src={getImageUrl(category.icon)}
                      alt={category.name}
                      className="w-12 h-12 object-contain"
                    />
                    <div className="flex-1 flex flex-col gap-2">
                      <h3 className="text-base font-semibold text-black dark:text-white font-['Plus_Jakarta_Sans']">
                        {category.name}
                      </h3>
                      <p className="text-sm text-[#334054] dark:text-gray-400 font-['Plus_Jakarta_Sans'] leading-[150%]">
                        {category.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2 - Caravan Features */}
          {currentStep === 2 && (
            <div className="w-full flex flex-col items-center gap-9">
              <h1 className="text-[32px] font-semibold text-black dark:text-white font-sanse text-center">
                Caravan Features
              </h1>

              <div className="max-w-4xl mx-auto flex flex-col gap-6">
                {/* Feature tags in rows */}
                <div className="flex flex-wrap gap-5">
                  {/* Dynamic Features */}
                  {dynamicFeatures.map((feature, idx) => (
                    <button
                      key={feature.id || feature._id || idx}
                      onClick={() => toggleFeature(feature.name)}
                      className={`flex items-center gap-3 px-4 py-2 rounded-[48px] border transition-all duration-200 ${
                        formData.features.includes(feature.name)
                          ? "border-[#131313] dark:border-white bg-white dark:bg-gray-800"
                          : "border-[#EAECF0] dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-[#131313] dark:hover:border-white"
                      }`}
                    >
                      <div className="w-[22px] h-[22px]">
                         <img src={getImageUrl(feature.icon)} alt="" className="w-full h-full object-contain" />
                      </div>
                      <span className="text-base max-sm:text-xs text-[#4B4B4B] dark:text-gray-300 font-medium font-['Plus_Jakarta_Sans']">
                        {feature.name}
                      </span>
                    </button>
                  ))}

                  {/* Custom features */}
                  {customFeatures.map((customFeature, idx) => (
                    <button
                      key={`custom-${idx}`}
                      onClick={() => {
                        setCustomFeatures(prev => prev.filter((_, i) => i !== idx));
                        setFormData(prev => ({
                          ...prev,
                          features: prev.features.filter(f => f !== customFeature.name)
                        }));
                      }}
                      className="flex items-center gap-3 px-4 py-2 rounded-[48px] border border-[#131313] dark:border-white bg-white dark:bg-gray-800"
                    >
                      <div className="w-[22px] h-[22px]">
                        <MoreHorizontal size={18} className="text-gray-600" />
                      </div>
                      <span className="text-base max-sm:text-xs text-[#4B4B4B] dark:text-gray-300 font-medium font-['Plus_Jakarta_Sans']">
                        {customFeature.name}
                      </span>
                      <X size={16} className="text-gray-600 ml-1" />
                    </button>
                  ))}

                  {/* Others/Custom Button */}
                  <button
                    key="others"
                    onClick={() => setShowCustomFeaturesInput(!showCustomFeaturesInput)}
                    className={`flex items-center gap-3 px-4 py-2 rounded-[48px] border transition-all duration-200 ${
                      showCustomFeaturesInput
                        ? "border-[#131313] dark:border-white bg-white dark:bg-gray-800"
                        : "border-[#EAECF0] dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-[#131313] dark:hover:border-white"
                    }`}
                  >
                    <div className="w-[22px] h-[22px]">
                    <IoAdd size={18} className="text-gray-600" />
                    </div>
                    <span className="text-base max-sm:text-xs text-[#4B4B4B] dark:text-gray-300 font-medium font-['Plus_Jakarta_Sans']">
                      Others
                    </span>
                  </button>
                </div>

                {/* Custom features input */}
                {showCustomFeaturesInput && (
               

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customFeatureInput}
                        onChange={(e) => setCustomFeatureInput(e.target.value)}
                        placeholder="Feature name (e.g. Solar Power)"
                        maxLength={50}
                        className="flex-1 h-[50px] px-3 border border-[#EAECF0] rounded-lg text-sm text-[#121213] font-['Plus_Jakarta_Sans'] focus:outline-none focus:border-[#131313] dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                      />
                      <button
                        onClick={() => {
                          if (customFeatureInput.trim() && customFeatures.length < 20) {
                            const newFeatureName = customFeatureInput.trim();
                            // Avoid duplicates
                            if (formData.features.includes(newFeatureName)) {
                              toast.error("This feature already exists");
                              return;
                            }
                            setCustomFeatures(prev => [...prev, { name: newFeatureName, icon: MoreHorizontal }]);
                            setFormData(prev => ({
                              ...prev,
                              features: [...prev.features, newFeatureName]
                            }));
                            setCustomFeatureInput("");
                          }
                        }}
                        disabled={!customFeatureInput.trim() || customFeatures.length >= 20}
                        className="px-6 h-[50px] flex items-center justify-center bg-[#131313] text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        Add
                      </button>
                    </div>
           
                )}
              </div>
            </div>
          )}

          {/* Step 3 - Capacity and Address */}
          {currentStep === 3 && (
            <div className="w-full flex flex-col gap-9">
              <h1 className="text-[32px] font-bold text-black dark:text-white font-sanse text-center">
                Caravan Capacity and Address
              </h1>

              <div className="w-full max-w-4xl mx-auto flex flex-col gap-5">
                {/* Seating Capacity */}
                <div className="flex items-center justify-between py-3 px-3">
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-black dark:text-white font-['Plus_Jakarta_Sans']">
                      Seating Capacity
                    </h3>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => adjustCapacity("seating", "decrease")}
                      className="w-[30px] h-[30px] flex items-center justify-center rounded-full border border-[#EAECF0] dark:border-gray-600 bg-white dark:bg-gray-800"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M13.3337 8H2.66699"
                          stroke="#666666"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    <span className="text-base text-[#334054] dark:text-gray-300 font-medium font-['Plus_Jakarta_Sans']">
                      {formData.seatingCapacity}
                    </span>
                    <button
                      onClick={() => adjustCapacity("seating", "increase")}
                      className="w-[30px] h-[30px] flex items-center justify-center rounded-full border border-[#EAECF0] dark:border-gray-600 bg-white dark:bg-gray-800"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M8.00033 2.66666V13.3333M13.3337 7.99999L2.66699 7.99999"
                          stroke="#666666"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <hr className="border-[#EAECF0] dark:border-gray-600" />

                {/* Sleeping Capacity */}
                <div className="flex items-center justify-between py-3 px-3">
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-black dark:text-white font-['Plus_Jakarta_Sans']">
                      Sleeping Capacity
                    </h3>
                    <p className="text-sm text-[#334054] dark:text-gray-400 font-['Plus_Jakarta_Sans'] leading-[150%]">
                      Lorem ipsum dolor sit amet, consectetur adipiscing elit,
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => adjustCapacity("sleeping", "decrease")}
                      className="w-[30px] h-[30px] flex items-center justify-center rounded-full border border-[#EAECF0] dark:border-gray-600 bg-white dark:bg-gray-800"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M13.3337 8H2.66699"
                          stroke="#666666"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                    <span className="text-base text-[#334054] dark:text-gray-300 font-medium font-['Plus_Jakarta_Sans']">
                      {formData.sleepingCapacity}
                    </span>
                    <button
                      onClick={() => adjustCapacity("sleeping", "increase")}
                      className="w-[30px] h-[30px] flex items-center justify-center rounded-full border border-[#EAECF0] dark:border-gray-600 bg-white dark:bg-gray-800"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M8.00033 2.66666V13.3333M13.3337 7.99999L2.66699 7.99999"
                          stroke="#666666"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                <hr className="border-[#EAECF0] dark:border-gray-600" />

                {/* Address */}
                <div className="flex flex-col gap-5">
                 <div className="flex flex-col gap-2 pl-1">
  <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans']">
    Address
  </label>

 <input
  type="text"
  placeholder="Enter your address"
  value={formData.address}
  onChange={(e) =>
    setFormData((prev) => ({
      ...prev,
      address: e.target.value,
    }))
  }
  className="w-full px-4 py-3 rounded-lg border border-[#EAECF0]"
/>

</div>
                    <div className="w-full flex flex-col gap-5">
                  <div className="w-full flex justify-between gap-5 md:items-center max-md:flex-col">
                    <div className="flex-1 relative">
                      <select
                        name="country"
                        value={formData.locality}
                        onChange={(e) => {
                          const countryVal = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            locality: countryVal,
                            state: "",
                            city: "", // reset city
                          }));
                        }}
                        className="w-full h-[50px] px-3 py-4 border border-[#EAECF0] dark:border-gray-600 rounded-lg text-sm text-[#121213] dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313] appearance-none"
                      >
                        <option value="India">
                          India
                        </option>
                        {/* Render states from selected country */}
                        {/* {data.map((Country: any, idx: number) => (
                          <option key={idx} value={Country.name} >
                            {Country.name}
                          </option>
                        ))} */}
                       
                      </select>
                      <svg
                        className="absolute right-5 top-1/2 transform -translate-y-1/2 w-[18px] h-[18px] pointer-events-none"
                        viewBox="0 0 18 18"
                        fill="none"
                      >
                        <path
                          d="M14.94 6.71249L10.05 11.6025C9.4725 12.18 8.5275 12.18 7.95 11.6025L3.06 6.71249"
                          stroke="#292D32"
                          strokeWidth="1.5"
                          strokeMiterlimit="10"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 relative">
                      <select
                        name="state"
                        value={formData.state}
                        onChange={(e) => {
                          const stateVal = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            state: stateVal,
                            city: "", // reset city
                          }));
                        }}
                        className="w-full h-[50px] px-3  border border-[#EAECF0] dark:border-gray-600 rounded-lg text-sm text-[#121213] dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313] appearance-none"
                      >
                        <option value="" disabled>
                          Select State
                        </option>
                        {/* Render states from selected country */}
                        {data
                          .find((c) => c.name === formData.locality)
                          ?.states?.map((state: any, idx: number) => (
                            <option key={idx} value={state.name}>
                              {state.name}
                            </option>
                          ))}
                      </select>
                      <svg
                        className="absolute right-5 top-1/2 transform -translate-y-1/2 w-[18px] h-[18px] pointer-events-none"
                        viewBox="0 0 18 18"
                        fill="none"
                      >
                        <path
                          d="M14.94 6.71249L10.05 11.6025C9.4725 12.18 8.5275 12.18 7.95 11.6025L3.06 6.71249"
                          stroke="#292D32"
                          strokeWidth="1.5"
                          strokeMiterlimit="10"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 relative">
                      <select
                        name="city"
                        value={formData.city}
                        onChange={(e) => {
                          const cityVal = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            city: cityVal,
                          }));
                        }}
                        className="w-full h-[50px] px-3  border border-[#EAECF0] dark:border-gray-600 rounded-lg text-sm text-[#121213] dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313] appearance-none"
                      >
                        <option value="" disabled>
                          Select City
                        </option>
                        {data
                          .find((country) => country.name === formData.locality)
                          ?.states.find((state) => state.name === formData.state)
                          ?.cities.map((city: any, idx: number) => (
                            <option key={idx} value={city.name}>
                              {city.name}
                            </option>
                          ))}
                      </select>
                      <svg
                        className="absolute right-5 top-1/2 transform -translate-y-1/2 w-[18px] h-[18px] pointer-events-none"
                        viewBox="0 0 18 18"
                        fill="none"
                      >
                        <path
                          d="M14.94 6.71249L10.05 11.6025C9.4725 12.18 8.5275 12.18 7.95 11.6025L3.06 6.71249"
                          stroke="#292D32"
                          strokeWidth="1.5"
                          strokeMiterlimit="10"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>

                 <input
  type="text"
  value={formData.pincode}
  onChange={(e) =>
    setFormData((prev) => ({
      ...prev,
      pincode: e.target.value.replace(/\D/g, ""), // only numbers
    }))
  }
  maxLength={6}
  inputMode="numeric"
  placeholder="Pincode"
  className="flex-1 h-[50px] px-3 max-md:py-3  border border-[#EAECF0] dark:border-gray-600 rounded-lg text-sm text-[#121213] dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313]"
/>

                  </div>
                </div>
                </div>

               {/* Map Integration */}
          <div className="h-96 max-md:mb-14 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
  <iframe
    src={mapSrc}
    width="100%"
    height="100%"
    style={{ border: 0 }}
    loading="lazy"
    referrerPolicy="no-referrer-when-downgrade"
    title="Selected Location Map"
  />
</div>

              </div>
            </div>
          )}

  {/* Step 4 - Pricing Details */}
  {currentStep === 4 && (
    <div className="w-full flex flex-col items-center gap-9">
      <h1 className="text-[32px] font-bold text-black dark:text-white font-sanse text-center">
        Pricing Details
      </h1>

      <div className="w-full max-w-4xl mx-auto flex flex-col gap-8">
        {/* Pricing section */}
        <div className="w-full flex flex-col gap-10 justify-center items-start">
          <div className="w-full flex flex-col gap-4">
            <div className="w-full flex items-center gap-2 pl-1">
              <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans']">
                Per Kilometer(KM) Charge
              </label>
            </div>
            <div className="w-full flex items-center gap-2 pl-3">
              {/* Name */}
              <div className="flex flex-col gap-2 w-full">
                <div className="relative w-full ">
                  <input
                    type="number"
                    value={formData.perKmCharge}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        perKmCharge: e.target.value,
                      }));
                      if (errors.perKmCharge) {
                        setErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.perKmCharge;
                          return newErrors;
                        });
                      }
                    }}
                    placeholder="Enter price per km"
                    className={`w-full h-[50px] px-3 py-4 border ${
                      errors.perKmCharge ? "border-red-500" : "border-[#EAECF0]"
                    } rounded-lg text-sm text-[#121213] font-['Plus_Jakarta_Sans'] focus:outline-none focus:border-[#131313] dark:bg-gray-800 dark:border-gray-600 dark:text-white`}
                  />
                  {errors.perKmCharge && (
                    <span className="text-xs text-red-500 mt-1">
                      {errors.perKmCharge}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          {/* Above price includes */}
          <div className="w-full flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 pl-1 flex-1">
                <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans']">
                  Above price includes
                </label>
              </div>
            </div>

            <div className="w-full flex flex-col gap-4">
              {formData.perKmIncludes.map((item, index) => (
                <div className="w-full flex items-center gap-2" key={index}>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) =>
                      updatePriceItem(
                        "perKmIncludes",
                        index,
                        e.target.value
                      )
                    }
                    placeholder="Text here.."
                    maxLength={250}
                    className="w-full h-[50px] px-3 py-4 border border-[#EAECF0] rounded-lg text-sm text-[#121213] font-['Plus_Jakarta_Sans'] focus:outline-none focus:border-[#131313] dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  />
                  <button
                    onClick={() => removePriceItem("perKmIncludes", index)}
                    className="w-[50px] h-[50px] p-3 bg-gray-200 rounded-lg flex items-center justify-center"
                  >
                    <X className="w-8 h-8" />
                  </button>
                </div>
              ))}

              <button
                onClick={() => addPriceItem("perKmIncludes")}
                className="flex items-center gap-2 px-3 py-2 rounded-[60px]"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm text-[#131313] font-sanse font-normal tracking-[-0.28px] leading-[160%]">
                  Add More
                </span>
              </button>
              {errors.perKmIncludes && (
                <span className="text-xs text-red-500">
                  {errors.perKmIncludes}
                </span>
              )}
            </div>
          </div>

          {/* Above price excludes */}
          <div className="w-full flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 pl-1 flex-1">
                <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans']">
                  Above price excludes
                </label>
              </div>
            </div>

            <div className="w-full flex flex-col gap-4">
              {formData.perKmExcludes.map((item, index) => (
                <div className="w-full flex items-center gap-2" key={index}>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) =>
                      updatePriceItem(
                        "perKmExcludes",
                        index,
                        e.target.value
                      )
                    }
                    placeholder="Text here.."
                    maxLength={250}
                    className="w-full h-[50px] px-3 py-4 border border-[#EAECF0] rounded-lg text-sm text-[#121213] font-['Plus_Jakarta_Sans'] focus:outline-none focus:border-[#131313] dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  />
                  <button
                    onClick={() => removePriceItem("perKmExcludes", index)}
                    className="w-[50px] h-[50px] p-3 bg-gray-200 rounded-lg flex items-center justify-center"
                  >
                    <X className="w-8 h-8" />
                  </button>
                </div>
              ))}

              <button
                onClick={() => addPriceItem("perKmExcludes")}
                className="flex items-center gap-2 px-3 py-2 rounded-[60px]"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm text-[#131313] font-sanse font-normal tracking-[-0.28px] leading-[160%]">
                  Add More
                </span>
              </button>
              {errors.perKmExcludes && (
                <span className="text-xs text-red-500">
                  {errors.perKmExcludes}
                </span>
              )}
            </div>
          </div>
          <div className="w-full flex flex-col gap-4 ">
            <div className="w-full flex items-center gap-2 pl-1">
              <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans']">
                Per Day Kilometer(KM) Charge
              </label>
            </div>
            <div className="w-full flex items-center gap-2 pl-3">
              <div className="w-full flex flex-col gap-2">
                <div className="relative w-full ">
                  <input
                    type="number"
                    value={formData.perDayCharge}
                    onChange={(e) => {
                      setFormData((prev) => ({
                        ...prev,
                        perDayCharge: e.target.value,
                      }));
                      if (errors.perDayCharge) {
                        setErrors((prev) => {
                          const newErrors = { ...prev };
                          delete newErrors.perDayCharge;
                          return newErrors;
                        });
                      }
                    }}
                    placeholder="Enter price per day"
                    className={`w-full h-[50px] px-3 py-4 border ${
                      errors.perDayCharge
                        ? "border-red-500"
                        : "border-[#EAECF0]"
                    } rounded-lg text-sm text-[#121213] font-['Plus_Jakarta_Sans'] focus:outline-none focus:border-[#131313] dark:bg-gray-800 dark:border-gray-600 dark:text-white`}
                  />
                  {errors.perDayCharge && (
                    <span className="text-xs text-red-500 mt-1">
                      {errors.perDayCharge}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Above price includes */}
          <div className="w-full flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 pl-1 flex-1">
                <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans']">
                  Above price includes
                </label>
              </div>
            </div>

            <div className="w-full flex flex-col gap-4">
              {formData.perDayIncludes.map((item, index) => (
                <div className="w-full flex items-center gap-2" key={index}>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) =>
                      updatePriceItem(
                        "perDayIncludes",
                        index,
                        e.target.value
                      )
                    }
                    placeholder="Text here.."
                    maxLength={250}
                    className="w-full h-[50px] px-3 py-4 border border-[#EAECF0] rounded-lg text-sm text-[#121213] font-['Plus_Jakarta_Sans'] focus:outline-none focus:border-[#131313] dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  />
                  <button
                    onClick={() => removePriceItem("perDayIncludes", index)}
                    className="w-[50px] h-[50px] p-3 bg-gray-200 rounded-lg flex items-center justify-center"
                  >
                    <X className="w-8 h-8" />
                  </button>
                </div>
              ))}

              <button
                onClick={() => addPriceItem("perDayIncludes")}
                className="flex items-center gap-2 px-3 py-2 rounded-[60px]"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm text-[#131313] font-sanse font-normal tracking-[-0.28px] leading-[160%]">
                  Add More
                </span>
              </button>
              {errors.perDayIncludes && (
                <span className="text-xs text-red-500">
                  {errors.perDayIncludes}
                </span>
              )}
            </div>
          </div>

          {/* Above price excludes */}
          <div className="w-full flex flex-col gap-4 max-md:mb-10">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 pl-1 flex-1">
                <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans']">
                  Above price excludes
                </label>
              </div>
            </div>

            <div className="w-full flex flex-col gap-4">
              {formData.perDayExcludes.map((item, index) => (
                <div className="w-full flex items-center gap-2" key={index}>
                  <input
                    type="text"
                    value={item}
                    onChange={(e) =>
                      updatePriceItem(
                        "perDayExcludes",
                        index,
                        e.target.value
                      )
                    }
                    placeholder="Text here.."
                    maxLength={250}
                    className="w-full h-[50px] px-3 py-4 border border-[#EAECF0] rounded-lg text-sm text-[#121213] font-['Plus_Jakarta_Sans'] focus:outline-none focus:border-[#131313] dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  />
                  <button
                    onClick={() => removePriceItem("perDayExcludes", index)}
                    className="w-[50px] h-[50px] p-3 bg-gray-200 rounded-lg flex items-center justify-center"
                  >
                    <X className="w-8 h-8" />
                  </button>
                </div>
              ))}

              <button
                onClick={() => addPriceItem("perDayExcludes")}
                className="flex items-center gap-2 px-3 py-2 rounded-[60px]"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm text-[#131313] font-sanse font-normal tracking-[-0.28px] leading-[160%]">
                  Add More
                </span>
              </button>
              {errors.perDayExcludes && (
                <span className="text-xs text-red-500">
                  {errors.perDayExcludes}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )}

          {/* Step 5 - Types of Discount */}
          {currentStep === 5 && (
            <div className="w-full flex flex-col items-center gap-9">
              <h1 className="text-[32px] font-bold text-black dark:text-white font-sanse text-center">
                Types of Discount
              </h1>

              <div className="w-full max-w-4xl mx-auto flex flex-col gap-4">
                {/* First 5 User Discount */}
                <div className="w-full p-5 flex flex-col gap-3 border border-[#EAECF0] dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans']">
                      First 5 User Discount
                    </span>
                    <button
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          firstUserDiscount: !prev.firstUserDiscount,
                        }))
                      }
                      className={`w-9 h-5 rounded-full flex items-center transition-colors duration-200 ${
                        formData.firstUserDiscount
                          ? "bg-[#2563EB] justify-end"
                          : "bg-[#D2D5DA] dark:bg-gray-600 justify-start"
                      }`}
                    >
                      <div className="w-4 h-4 bg-white rounded-full shadow-sm mx-0.5"></div>
                    </button>
                  </div>

                  {formData.firstUserDiscount && (
                    <>
                      <div className="w-full h-px bg-[#EAECF0] dark:bg-gray-600"></div>
                      <div className="flex gap-5 max-md:flex-col">
                        <div className="flex-1 flex flex-col gap-3">
                          <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans']">
                            Discount Type
                          </label>
                          <div className="relative">
                            <select
                              value={formData.firstUserDiscountType}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  firstUserDiscountType: e.target.value as
                                    | "percentage"
                                    | "fixed",
                                }))
                              }
                              className="w-full h-[50px] px-3 py-4 border border-[#B0B0B0] dark:border-gray-600 rounded-lg text-sm text-[#717171] dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313] appearance-none"
                            >
                              <option value="percentage">Percentage</option>
                              <option value="fixed">Fixed Amount</option>
                            </select>
                            <svg
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none"
                              viewBox="0 0 16 16"
                              fill="none"
                            >
                              <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M4.31319 5.65967C4.50846 5.44678 4.82504 5.44678 5.0203 5.65967L8.31319 9.25C8.50846 9.4629 8.82504 9.4629 9.0203 9.25L12.3132 5.65968C12.5085 5.44678 12.825 5.44678 13.0203 5.65968C13.2156 5.87257 13.2156 6.21775 13.0203 6.43065L9.72741 10.021C9.14162 10.6597 8.19187 10.6597 7.60609 10.021L4.31319 6.43065C4.11793 6.21775 4.11793 5.87257 4.31319 5.65967Z"
                                fill="#131313"
                              />
                            </svg>
                          </div>
                        </div>

                        <div className="flex-1 flex flex-col gap-3">
                          <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans']">
                            Discount Value
                          </label>
                          <input
                            type="number"
                            maxLength={formData.firstUserDiscountType === 'percentage' ? 2 : 10}
                            value={formData.firstUserDiscountValue}
                            onChange={(e) => {
                              setFormData((prev) => ({
                                ...prev,
                                firstUserDiscountValue: e.target.value,
                              }));
                              if (errors.firstUserDiscountValue) {
                                setErrors((prev) => {
                                  const newErrors = { ...prev };
                                  delete newErrors.firstUserDiscountValue;
                                  return newErrors;
                                });
                              }
                            }}
                            placeholder={formData.firstUserDiscountType === 'percentage' ? "10%" : "₹ 2000"}
                            className={`w-full h-[50px] px-3 py-4 border ${errors.firstUserDiscountValue ? "border-red-500" : "border-[#B0B0B0] dark:border-gray-600"} rounded-lg text-sm text-[#717171] dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313]`}
                          />
                           {errors.firstUserDiscountValue && (
                              <span className="text-xs text-red-500">
                                {errors.firstUserDiscountValue}
                              </span>
                            )}
                        </div>

                        <div className="flex-1 flex flex-col gap-3">
                          <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans']">
                            Final Price
                          </label>
                          <input
                            type="number"
                            value={formData.firstUserDiscountFinalPrice}
                            onChange={(e) => {
                              setFormData((prev) => ({
                                ...prev,
                                firstUserDiscountFinalPrice: e.target.value,
                              }));
                              if (errors.firstUserDiscountFinalPrice) {
                                setErrors((prev) => {
                                  const newErrors = { ...prev };
                                  delete newErrors.firstUserDiscountFinalPrice;
                                  return newErrors;
                                });
                              }
                            }}
                            placeholder="Final price after discount"
                            className={`w-full h-[50px] px-3 py-4 border ${errors.firstUserDiscountFinalPrice ? "border-red-500" : "border-[#B0B0B0] dark:border-gray-600"} rounded-lg text-sm text-[#717171] dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313]`}
                          />
                          {errors.firstUserDiscountFinalPrice && (
                              <span className="text-xs text-red-500">
                                {errors.firstUserDiscountFinalPrice}
                              </span>
                            )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Festival Offers */}
                <div className="w-full p-5 border border-[#EAECF0] dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans']">
                      Festival Offers
                    </span>
                    <button
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          festivalOffers: !prev.festivalOffers,
                        }))
                      }
                      className={`w-9 h-5 rounded-full flex items-center transition-colors duration-200 ${
                        formData.festivalOffers
                          ? "bg-[#2563EB] justify-end"
                          : "bg-[#D2D5DA] dark:bg-gray-600 justify-start"
                      }`}
                    >
                      <div className="w-4 h-4 bg-white rounded-full shadow-sm mx-0.5"></div>
                    </button>
                  </div>
                  {formData.festivalOffers && (
                    <>
                      <div className="w-full h-px bg-[#EAECF0] dark:bg-gray-600"></div>
                      <div className="flex gap-5 max-md:flex-col">
                        <div className="flex-1 flex flex-col gap-3">
                          <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans']">
                            Discount Type
                          </label>
                          <div className="relative">
                            <select
                              value={formData.festivalOffersType}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  festivalOffersType: e.target.value as
                                    | "percentage"
                                    | "fixed",
                                }))
                              }
                              className="w-full h-[50px] px-3 py-4 border border-[#B0B0B0] dark:border-gray-600 rounded-lg text-sm text-[#717171] dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313] appearance-none"
                            >
                              <option value="percentage">Percentage</option>
                              <option value="fixed">Fixed Amount</option>
                            </select>
                            <svg
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none"
                              viewBox="0 0 16 16"
                              fill="none"
                            >
                              <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M4.31319 5.65967C4.50846 5.44678 4.82504 5.44678 5.0203 5.65967L8.31319 9.25C8.50846 9.4629 8.82504 9.4629 9.0203 9.25L12.3132 5.65968C12.5085 5.44678 12.825 5.44678 13.0203 5.65968C13.2156 5.87257 13.2156 6.21775 13.0203 6.43065L9.72741 10.021C9.14162 10.6597 8.19187 10.6597 7.60609 10.021L4.31319 6.43065C4.11793 6.21775 4.11793 5.87257 4.31319 5.65967Z"
                                fill="#131313"
                              />
                            </svg>
                          </div>
                        </div>

                        <div className="flex-1 flex flex-col gap-3">
                          <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans']">
                            Discount Value
                          </label>
                          <input
                            type="number"
                            maxLength={formData.festivalOffersType === 'percentage' ? 2 : 10}
                            value={formData.festivalOffersValue}
                            onChange={(e) => {
                              setFormData((prev) => ({
                                ...prev,
                                festivalOffersValue: e.target.value,
                              }));
                              if (errors.festivalOffersValue) {
                                setErrors((prev) => {
                                  const newErrors = { ...prev };
                                  delete newErrors.festivalOffersValue;
                                  return newErrors;
                                });
                              }
                            }}
                            placeholder={formData.festivalOffersType === 'percentage' ? "10%" : "₹ 2000"}
                            className={`w-full h-[50px] px-3 py-4 border ${errors.festivalOffersValue ? "border-red-500" : "border-[#B0B0B0] dark:border-gray-600"} rounded-lg text-sm text-[#717171] dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313]`}
                          />
                          {errors.festivalOffersValue && (
                              <span className="text-xs text-red-500">
                                {errors.festivalOffersValue}
                              </span>
                            )}
                        </div>

                        <div className="flex-1 flex flex-col gap-3">
                          <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans']">
                            Final Price
                          </label>
                          <input
                            type="number"
                            value={formData.festivalOffersFinalPrice}
                            onChange={(e) => {
                              setFormData((prev) => ({
                                ...prev,
                                festivalOffersFinalPrice: e.target.value,
                              }));
                              if (errors.festivalOffersFinalPrice) {
                                setErrors((prev) => {
                                  const newErrors = { ...prev };
                                  delete newErrors.festivalOffersFinalPrice;
                                  return newErrors;
                                });
                              }
                            }}
                            placeholder="₹ 2000"
                            className={`w-full h-[50px] px-3 py-4 border ${errors.festivalOffersFinalPrice ? "border-red-500" : "border-[#B0B0B0] dark:border-gray-600"} rounded-lg text-sm text-[#717171] dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313]`}
                          />
                           {errors.festivalOffersFinalPrice && (
                              <span className="text-xs text-red-500">
                                {errors.festivalOffersFinalPrice}
                              </span>
                            )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Weekly or Monthly Offers */}
                <div className="w-full p-5 border border-[#EAECF0] dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans']">
                      Weekly or Monthly Offers
                    </span>
                    <button
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          weeklyMonthlyOffers: !prev.weeklyMonthlyOffers,
                        }))
                      }
                      className={`w-9 h-5 rounded-full flex items-center transition-colors duration-200 ${
                        formData.weeklyMonthlyOffers
                          ? "bg-[#2563EB] justify-end"
                          : "bg-[#D2D5DA] dark:bg-gray-600 justify-start"
                      }`}
                    >
                      <div className="w-4 h-4 bg-white rounded-full shadow-sm mx-0.5"></div>
                    </button>
                  </div>
                  {formData.weeklyMonthlyOffers && (
                    <>
                      <div className="w-full h-px bg-[#EAECF0] dark:bg-gray-600"></div>
                      <div className="flex gap-5 max-md:flex-col">
                        <div className="flex-1 flex flex-col gap-3">
                          <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans']">
                            Discount Type
                          </label>
                          <div className="relative">
                            <select
                              value={formData.weeklyMonthlyOffersType}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  weeklyMonthlyOffersType: e.target.value as
                                    | "percentage"
                                    | "fixed",
                                }))
                              }
                              className="w-full h-[50px] px-3 py-4 border border-[#B0B0B0] dark:border-gray-600 rounded-lg text-sm text-[#717171] dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313] appearance-none"
                            >
                              <option value="percentage">Percentage</option>
                              <option value="fixed">Fixed Amount</option>
                            </select>
                            <svg
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none"
                              viewBox="0 0 16 16"
                              fill="none"
                            >
                              <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M4.31319 5.65967C4.50846 5.44678 4.82504 5.44678 5.0203 5.65967L8.31319 9.25C8.50846 9.4629 8.82504 9.4629 9.0203 9.25L12.3132 5.65968C12.5085 5.44678 12.825 5.44678 13.0203 5.65968C13.2156 5.87257 13.2156 6.21775 13.0203 6.43065L9.72741 10.021C9.14162 10.6597 8.19187 10.6597 7.60609 10.021L4.31319 6.43065C4.11793 6.21775 4.11793 5.87257 4.31319 5.65967Z"
                                fill="#131313"
                              />
                            </svg>
                          </div>
                        </div>

                        <div className="flex-1 flex flex-col gap-3">
                          <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans']">
                            Discount Value
                          </label>
                          <input
                            type="number"
                            maxLength={formData.weeklyMonthlyOffersType === 'percentage' ? 2 : 10}
                            value={formData.weeklyMonthlyOffersValue}
                            onChange={(e) => {
                              setFormData((prev) => ({
                                ...prev,
                                weeklyMonthlyOffersValue: e.target.value,
                              }));
                              if (errors.weeklyMonthlyOffersValue) {
                                setErrors((prev) => {
                                  const newErrors = { ...prev };
                                  delete newErrors.weeklyMonthlyOffersValue;
                                  return newErrors;
                                });
                              }
                            }}
                            placeholder={formData.weeklyMonthlyOffersType === 'percentage' ? "10%" : "₹ 2000"}
                            className={`w-full h-[50px] px-3 py-4 border ${errors.weeklyMonthlyOffersValue ? "border-red-500" : "border-[#B0B0B0] dark:border-gray-600"} rounded-lg text-sm text-[#717171] dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313]`}
                          />
                          {errors.weeklyMonthlyOffersValue && (
                              <span className="text-xs text-red-500">
                                {errors.weeklyMonthlyOffersValue}
                              </span>
                            )}
                        </div>

                        <div className="flex-1 flex flex-col gap-3">
                          <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans']">
                            Final Price
                          </label>
                          <input
                            type="number"
                            value={formData.weeklyMonthlyOffersFinalPrice}
                            onChange={(e) => {
                              setFormData((prev) => ({
                                ...prev,
                                weeklyMonthlyOffersFinalPrice: e.target.value,
                              }));
                              if (errors.weeklyMonthlyOffersFinalPrice) {
                                setErrors((prev) => {
                                  const newErrors = { ...prev };
                                  delete newErrors.weeklyMonthlyOffersFinalPrice;
                                  return newErrors;
                                });
                              }
                            }}
                            placeholder="₹ 2000"
                            className={`w-full h-[50px] px-3 py-4 border ${errors.weeklyMonthlyOffersFinalPrice ? "border-red-500" : "border-[#B0B0B0] dark:border-gray-600"} rounded-lg text-sm text-[#717171] dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313]`}
                          />
                          {errors.weeklyMonthlyOffersFinalPrice && (
                              <span className="text-xs text-red-500">
                                {errors.weeklyMonthlyOffersFinalPrice}
                              </span>
                            )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Special Offers */}
                <div className="w-full p-5 border border-[#EAECF0] dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-bold text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans']">
                      Special Offers
                    </span>
                    <button
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          specialOffers: !prev.specialOffers,
                        }))
                      }
                      className={`w-9 h-5 rounded-full flex items-center transition-colors duration-200 ${
                        formData.specialOffers
                          ? "bg-[#2563EB] justify-end"
                          : "bg-[#D2D5DA] dark:bg-gray-600 justify-start"
                      }`}
                    >
                      <div className="w-4 h-4 bg-white rounded-full shadow-sm mx-0.5"></div>
                    </button>
                  </div>
                  {formData.specialOffers && (
                    <>
                      <div className="w-full h-px bg-[#EAECF0] dark:bg-gray-600"></div>
                      <div className="flex gap-5 max-md:flex-col">
                        <div className="flex-1 flex flex-col gap-3">
                          <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans']">
                            Discount Type
                          </label>
                          <div className="relative">
                            <select
                              value={formData.specialOffersType}
                              onChange={(e) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  specialOffersType: e.target.value as
                                    | "percentage"
                                    | "fixed",
                                }))
                              }
                              className="w-full h-[50px] px-3 py-4 border border-[#B0B0B0] dark:border-gray-600 rounded-lg text-sm text-[#717171] dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313] appearance-none"
                            >
                              <option value="percentage">Percentage</option>
                              <option value="fixed">Fixed Amount</option>
                            </select>
                            <svg
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none"
                              viewBox="0 0 16 16"
                              fill="none"
                            >
                              <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M4.31319 5.65967C4.50846 5.44678 4.82504 5.44678 5.0203 5.65967L8.31319 9.25C8.50846 9.4629 8.82504 9.4629 9.0203 9.25L12.3132 5.65968C12.5085 5.44678 12.825 5.44678 13.0203 5.65968C13.2156 5.87257 13.2156 6.21775 13.0203 6.43065L9.72741 10.021C9.14162 10.6597 8.19187 10.6597 7.60609 10.021L4.31319 6.43065C4.11793 6.21775 4.11793 5.87257 4.31319 5.65967Z"
                                fill="#131313"
                              />
                            </svg>
                          </div>
                        </div>

                        <div className="flex-1 flex flex-col gap-3">
                          <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans']">
                            Discount Value
                          </label>
                          <input
                            type="number"
                            maxLength={formData.specialOffersType === 'percentage' ? 2 : 10}
                            value={formData.specialOffersValue}
                            onChange={(e) => {
                              setFormData((prev) => ({
                                ...prev,
                                specialOffersValue: e.target.value,
                              }));
                              if (errors.specialOffersValue) {
                                setErrors((prev) => {
                                  const newErrors = { ...prev };
                                  delete newErrors.specialOffersValue;
                                  return newErrors;
                                });
                              }
                            }}
                            placeholder={formData.specialOffersType === 'percentage' ? "10%" : "₹ 2000"}
                            className={`w-full h-[50px] px-3 py-4 border ${errors.specialOffersValue ? "border-red-500" : "border-[#B0B0B0] dark:border-gray-600"} rounded-lg text-sm text-[#717171] dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313]`}
                          />
                          {errors.specialOffersValue && (
                              <span className="text-xs text-red-500">
                                {errors.specialOffersValue}
                              </span>
                            )}
                        </div>

                        <div className="flex-1 flex flex-col gap-3">
                          <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans']">
                            Final Price
                          </label>
                          <input
                            type="number"
                            value={formData.specialOffersFinalPrice}
                            onChange={(e) => {
                              setFormData((prev) => ({
                                ...prev,
                                specialOffersFinalPrice: e.target.value,
                              }));
                              if (errors.specialOffersFinalPrice) {
                                setErrors((prev) => {
                                  const newErrors = { ...prev };
                                  delete newErrors.specialOffersFinalPrice;
                                  return newErrors;
                                });
                              }
                            }}
                            placeholder="₹ 2000"
                            className={`w-full h-[50px] px-3 py-4 border ${errors.specialOffersFinalPrice ? "border-red-500" : "border-[#B0B0B0] dark:border-gray-600"} rounded-lg text-sm text-[#717171] dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313]`}
                          />
                          {errors.specialOffersFinalPrice && (
                              <span className="text-xs text-red-500">
                                {errors.specialOffersFinalPrice}
                              </span>
                            )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 6 - Business Details */}
          {currentStep === 6 && (
            <div className="w-full flex flex-col items-center gap-9">
              <h1 className="text-[32px] font-bold text-black dark:text-white font-sanse text-center">
                Business Details
              </h1>

              <div className="w-full max-w-4xl mx-auto flex flex-col gap-5">
                {/* Brand Name & Legal Company Name */}
                <div className="flex gap-5 max-md:flex-col">
                  <div className="flex-1 flex flex-col gap-3">
                    <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans'] pl-1">
                      Brand Name
                    </label>
                    <input
                      type="text"
                      value={formData.brandName}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          brandName: e.target.value,
                        }));
                        if (errors.brandName) {
                          setErrors((prev) => ({ ...prev, brandName: "" }));
                        }
                      }}
                      maxLength={50}
                      placeholder="Enter Brand Name"
                      className={`w-full h-[50px] px-3 py-4 border ${
                        errors.brandName ? "border-red-500" : "border-[#EAECF0] dark:border-gray-600"
                      } rounded-lg text-sm text-[#121213] dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313]`}
                    />
                    {errors.brandName && (
                      <span className="text-xs text-red-500 pl-1">
                        {errors.brandName}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col gap-3">
                    <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans'] pl-1">
                      Legal Company Name
                    </label>
                    <input
                      type="text"
                      value={formData.legalCompanyName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          legalCompanyName: e.target.value,
                        }))
                      }
                      maxLength={50}
                      placeholder="Enter Company Name"
                      className="w-full h-[50px] px-3 py-4 border border-[#EAECF0] dark:border-gray-600 rounded-lg text-sm text-[#121213] dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313]"
                    />
                  </div>
                </div>

                {/* GST Number & Business Email */}
                <div className="flex gap-5 max-md:flex-col">
                  <div className="flex-1 flex flex-col gap-3">
                    <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans'] pl-1">
                      GST Number
                    </label>
                    <input
                      type="text"
                      value={formData.gstNumber}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          gstNumber: e.target.value,
                        }))
                      }
                      maxLength={15}
                      placeholder=" GST Number (Optional)"
                      className="w-full h-[50px] px-3 py-4 border border-[#EAECF0] dark:border-gray-600 rounded-lg text-sm text-[#121213] dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313]"
                    />
                  </div>
                  <div className="flex-1 flex flex-col gap-3">
                    <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans'] pl-1">
                      Business Email ID
                    </label>
                    <input
                      type="email"
                      value={formData.businessEmailId}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          businessEmailId: e.target.value,
                        }))
                      }
                      placeholder="Enter Business Email ID (Optional)"
                      className="w-full h-[50px] px-3 py-4 border border-[#EAECF0] dark:border-gray-600 rounded-lg text-sm text-[#121213] dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313]"
                    />
                  </div>
                </div>

                {/* Business Phone Number */}
                <div className="flex flex-col gap-3">
                  <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans'] pl-1">
                    Business Phone number
                  </label>
                  <div className="flex gap-3">
                    <div
                      onClick={(e) => setOpen(true)}
                      className="cursor-pointer"
                    >
                      {selected && (
                        <span
                          onClick={() => {
                            setSelected(selected);
                          }}
                          className="flex items-center px-5 py-2 border rounded-xl gap-2 text-base text-[#717171] font-['Plus_Jakarta_Sans']"
                        >
                          {" "}
                          {React.createElement(
                            (Flags as any)[selected.isoCode],
                            {
                              title: selected.name,
                              style: { width: "24px" },
                            },
                          )}
                          {selected.dialCode.charAt(0) !== "+"
                            ? `+${selected.dialCode}`
                            : selected.dialCode}
                        </span>
                      )}
                    </div>

                    <Dialog open={open} onClose={setOpen}>
                      <DialogBackdrop
                        transition
                        className="inset-0  data-closed:opacity-1 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
                      />
                      {/* {isModalOpen && ( */}
                      <div className="fixed inset-0 bg-opacity-60 flex items-center justify-center z-50">
                        <DialogPanel className="w-[150px] shadow-md bg-[#f9fafc]  shadow-[#717171] h-[3 30px] scrollbar-hide  rounded-xl px-4 max-h-[80%] overflow-y-auto">
                          <button
                            onClick={() => setOpen(false)}
                            className="fixed w-auto bg-[#f9fafc] p-3 text-[#717171] text-[16px]"
                          >
                            <span className="font-[22px] flex gap-0 items-center">
                              <IoIosArrowBack size={24} />
                              Back
                            </span>
                          </button>
                          {/* <div className="w-full text-white mt-4 rounded-xl p-3 flex border focus:border-[#BED6FF] border-[#BED6FF] px-4">
                                  <img src={SearchIcon} alt="" className="w-5 h-5" />
                                  <input
                                    type="text"
                                    placeholder="Search for Countries"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="outline-none font-normal ml-1 placeholder:text-white px-2 text-sm w-full bg-transparent"
                                  />
                                </div> */}

                          <ul className="mt-6 py-5">
                            {countries.map((c) => (
                              <li
                                key={c.isoCode}
                                onClick={() => {
                                  setSelected(c);
                                  setOpen(false);
                                }}
                                className="flex items-center rounded-[5px] text-[#717171] text-sm font-normal px-3 py-2 cursor-pointer"
                              >
                                {React.createElement(
                                  (Flags as any)[c.isoCode],
                                  {
                                    title: c.name,
                                    style: {
                                      width: "25px",
                                      marginRight: "12px",
                                    },
                                  },
                                )}{" "}
                                {/* {c.name} */}
                                {c.dialCode.charAt(0) !== "+"
                                  ? `+${c.dialCode}`
                                  : c.dialCode}
                              </li>
                            ))}
                          </ul>
                        </DialogPanel>
                      </div>
                      {/* )} */}
                    </Dialog>
                    {/* <Plus className="w-3 h-3 text-[#717171]" /> */}
                    {/* <span className="text-base text-[#717171] font-['Plus_Jakarta_Sans']">
                                    91
                                  </span> */}

                    <input
                      type="text"
                      value={formData.businessPhoneNumber}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, ""); // remove all non-digit characters
                        setFormData((prev) => ({
                          ...prev,
                          businessPhoneNumber: value,
                        }));
                         if (errors.businessPhoneNumber) {
                          setErrors((prev) => ({ ...prev, businessPhoneNumber: "" }));
                        }
                      }}
                      maxLength={10}
                      className={`w-full h-[50px] px-3 py-4 border ${
                        errors.businessPhoneNumber ? "border-red-500" : "border-[#EAECF0] dark:border-gray-600"
                      } rounded-lg text-sm text-[#121213] dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313]`}
                      placeholder="Mobile Number"
                    />
                  </div>
                  {errors.businessPhoneNumber && (
                      <span className="text-xs text-red-500 pl-1">
                        {errors.businessPhoneNumber}
                      </span>
                    )}
                </div>
              </div>

              <div className="w-full max-w-4xl flex flex-col gap-3">
                <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans'] pl-1">
                  Business Address
                </label>
                <input
                  type="text"
                  value={formData.businessAddress}
                  onChange={(e) => {
                    setFormData((prev) => ({
                      ...prev,
                      businessAddress: e.target.value,
                    }));
                  }}
                  className="w-full h-[50px] px-3 py-4 border border-[#EAECF0] dark:border-gray-600 rounded-lg text-sm text-[#121213] dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313]"
                  placeholder="Business Address"
                />
                <div className="w-full flex flex-col gap-5">
                  <div className="w-full flex justify-between gap-5 md:items-center max-md:flex-col">
                    <div className="flex-1 relative">
                      <select
                        name="country"
                        value={formData.businessLocality}
                        onChange={(e) => {
                          const countryVal = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            businessLocality: countryVal,
                            businessState: "",
                            businessCity: "", // reset city
                          }));
                        }}
                        className="w-full h-[50px] px-3  border border-[#EAECF0] dark:border-gray-600 rounded-lg text-sm text-[#121213] dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313] appearance-none"
                      >
                        <option value="India">
                          India
                        </option>
                        {/* Render states from selected country */}
                        {/* {data.map((Country: any, idx: number) => (
                          <option key={idx} value={Country.name} disabled>
                            {Country.name}
                          </option>
                        ))} */}
                      </select>
                      <svg
                        className="absolute right-5 top-1/2 transform -translate-y-1/2 w-[18px] h-[18px] pointer-events-none"
                        viewBox="0 0 18 18"
                        fill="none"
                      >
                        <path
                          d="M14.94 6.71249L10.05 11.6025C9.4725 12.18 8.5275 12.18 7.95 11.6025L3.06 6.71249"
                          stroke="#292D32"
                          strokeWidth="1.5"
                          strokeMiterlimit="10"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 relative">
                      <select
                        name="state"
                        value={formData.businessState}
                        onChange={(e) => {
                          const stateVal = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            businessState: stateVal,
                            businessCity: "", // reset city
                          }));
                        }}
                        className="w-full h-[50px] px-3  border border-[#EAECF0] dark:border-gray-600 rounded-lg text-sm text-[#121213] dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313] appearance-none"
                      >
                        <option value="" disabled>
                          Select State
                        </option>
                        {/* Render states from selected country */}
                        {data
                          .find((c) => c.name === formData.businessLocality)
                          ?.states?.map((state: any, idx: number) => (
                            <option key={idx} value={state.name}>
                              {state.name}
                            </option>
                          ))}
                      </select>
                      <svg
                        className="absolute right-5 top-1/2 transform -translate-y-1/2 w-[18px] h-[18px] pointer-events-none"
                        viewBox="0 0 18 18"
                        fill="none"
                      >
                        <path
                          d="M14.94 6.71249L10.05 11.6025C9.4725 12.18 8.5275 12.18 7.95 11.6025L3.06 6.71249"
                          stroke="#292D32"
                          strokeWidth="1.5"
                          strokeMiterlimit="10"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                    <div className="flex-1 relative">
                      <select
                        name="city"
                        value={formData.businessCity}
                        onChange={(e) => {
                          const cityVal = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            businessCity: cityVal,
                          }));
                        }}
                        className="w-full h-[50px] px-3  border border-[#EAECF0] dark:border-gray-600 rounded-lg text-sm text-[#121213] dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313] appearance-none"
                      >
                        <option value="" disabled>
                          Select City
                        </option>
                        {data
                          .find((country) => country.name === formData.businessLocality)
                          ?.states.find((state) => state.name === formData.businessState)
                          ?.cities.map((city: any, idx: number) => (
                            <option key={idx} value={city.name}>
                              {city.name}
                            </option>
                          ))}
                      </select>
                      <svg
                        className="absolute right-5 top-1/2 transform -translate-y-1/2 w-[18px] h-[18px] pointer-events-none"
                        viewBox="0 0 18 18"
                        fill="none"
                      >
                        <path
                          d="M14.94 6.71249L10.05 11.6025C9.4725 12.18 8.5275 12.18 7.95 11.6025L3.06 6.71249"
                          stroke="#292D32"
                          strokeWidth="1.5"
                          strokeMiterlimit="10"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>

                    <input
                      type="text"
                      value={formData.businessPincode}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          businessPincode: e.target.value.replace(/\D/g, ""),
                        }))
                      }
                      maxLength={6}
                       inputMode="numeric"
                      placeholder="Pincode"
                      className="flex-1 h-[50px] px-3 max-md:py-3 border border-[#EAECF0] dark:border-gray-600 rounded-lg text-sm text-[#121213] dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313]"
                    />
                  </div>
                 {/* Map Integration */}
               <div className="h-96 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
  <iframe
    src={mapSrcbusiness}
    width="100%"
    height="100%"
    style={{ border: 0 }}
    loading="lazy"
    referrerPolicy="no-referrer-when-downgrade"
    title="Selected Location Map"
  />
</div>

                </div>
              </div>
            </div>
          )}
          {/* Step 7 - Personal Details */}
          {currentStep === 7 && (
            <div className="w-full flex flex-col items-center gap-9">
              <h1 className="text-[32px] font-bold text-black dark:text-white font-sanse text-center">
                Personal Details
              </h1>

              <div className="w-full  max-w-4xl mx-auto flex flex-col gap-5">
                {/* First Name & Last Name */}
                <div className="flex gap-5 max-md:flex-col">
                  <div className="flex-1 flex flex-col gap-3">
                    <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans'] pl-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          firstName: e.target.value,
                        }));
                        if (errors.firstName) {
                          setErrors((prev) => ({ ...prev, firstName: "" }));
                        }
                      }}
                      maxLength={30}
                      placeholder="Enter Your First Name"
                      className={`w-full h-[50px] px-3 py-4 border ${
                        errors.firstName ? "border-red-500" : "border-[#EAECF0] dark:border-gray-600"
                      } rounded-lg text-sm text-[#121213] dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313]`}
                    />
                    {errors.firstName && (
                      <span className="text-xs text-red-500 pl-1">
                        {errors.firstName}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col gap-3">
                    <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans'] pl-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          lastName: e.target.value,
                        }));
                         if (errors.lastName) {
                          setErrors((prev) => ({ ...prev, lastName: "" }));
                        }
                      }}
                      maxLength={30}
                      placeholder="Enter Your Last Name"
                      className={`w-full h-[50px] px-3 py-4 border ${
                        errors.lastName ? "border-red-500" : "border-[#EAECF0] dark:border-gray-600"
                      } rounded-lg text-sm text-[#121213] dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313]`}
                    />
                     {errors.lastName && (
                      <span className="text-xs text-red-500 pl-1">
                        {errors.lastName}
                      </span>
                    )}
                  </div>
                </div>

                {/* State & City */}
                <div className="w-full flex justify-between md:items-center gap-5 max-md:flex-col">
                  <div className="flex-1 flex flex-col gap-3">
                    <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans'] pl-1">
                      Country
                    </label>
                    <div className="relative">
                      <select
                        name="Country"
                        value={formData.personalLocality}
                        onChange={(e) => {
                          const countryVal = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            personalLocality: countryVal,
                            personalState: "",
                            personalCity: "", // reset city
                          }));
                        }}
                        className={`w-full h-[50px] px-3  border ${errors.personalLocality ? "border-red-500" : "border-[#EAECF0] dark:border-gray-600"} rounded-lg text-sm text-[#121213] dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313] appearance-none`}
                      >
                        <option value="India" >
                         India
                        </option>
                        {/* Render states from selected country */}
                        {/* {data.map((Country: any, idx: number) => (
                          <option key={idx} value={Country.name} disabled>
                            {Country.name}
                          </option>
                        ))} */}
                      </select>
                      {errors.personalLocality && (
                        <span className="text-xs text-red-500 pl-1 absolute top-[52px]">
                          {errors.personalLocality}
                        </span>
                      )}
                      <svg
                        className="absolute right-5 top-1/2 transform -translate-y-1/2 w-[18px] h-[18px] pointer-events-none"
                        viewBox="0 0 18 18"
                        fill="none"
                      >
                        <path
                          d="M14.94 6.71249L10.05 11.6025C9.4725 12.18 8.5275 12.18 7.95 11.6025L3.06 6.71249"
                          stroke="#292D32"
                          strokeWidth="1.5"
                          strokeMiterlimit="10"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col gap-3">
                    <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans'] pl-1">
                      State
                    </label>
                    <div className="relative">
                      <select
                        name="state"
                        value={formData.personalState}
                        onChange={(e) => {
                          const stateVal = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            personalState: stateVal,
                            personalCity: "", // reset city
                          }));
                           if (errors.personalState) {
                            setErrors((prev) => ({ ...prev, personalState: "" }));
                          }
                        }}
                        className={`w-full h-[50px] px-3  border ${errors.personalState ? "border-red-500" : "border-[#EAECF0] dark:border-gray-600"} rounded-lg text-sm text-[#121213] dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313] appearance-none`}
                      >
                        <option value="" disabled>
                          Select State
                        </option>
                        {/* Render states from selected country */}
                        {data
                          .find((c) => c.name === formData.personalLocality)
                          ?.states?.map((state: any, idx: number) => (
                            <option key={idx} value={state.name} >
                              {state.name}
                            </option>
                          ))}
                      </select>
                      {errors.personalState && (
                        <span className="text-xs text-red-500 pl-1 absolute top-[52px]">
                          {errors.personalState}
                        </span>
                      )}
                      <svg
                        className="absolute right-5 top-1/2 transform -translate-y-1/2 w-[18px] h-[18px] pointer-events-none"
                        viewBox="0 0 18 18"
                        fill="none"
                      >
                        <path
                          d="M14.94 6.71249L10.05 11.6025C9.4725 12.18 8.5275 12.18 7.95 11.6025L3.06 6.71249"
                          stroke="#292D32"
                          strokeWidth="1.5"
                          strokeMiterlimit="10"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col gap-3">
                    <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans'] pl-1">
                      City
                    </label>
                    <div className="relative">
                      <select
                        name="city"
                        value={formData.personalCity}
                        onChange={(e) => {
                          const cityVal = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            personalCity: cityVal,
                          }));
                           if (errors.personalCity) {
                            setErrors((prev) => ({ ...prev, personalCity: "" }));
                          }
                        }}
                        className={`w-full h-[50px] px-3  border ${errors.personalCity ? "border-red-500" : "border-[#EAECF0] dark:border-gray-600"} rounded-lg text-sm text-[#121213] dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313] appearance-none`}
                      >
                        <option value="" disabled>
                          Select City
                        </option>
                        {data
                          .find((country) => country.name === formData.personalLocality)
                          ?.states.find((state) => state.name === formData.personalState)
                          ?.cities.map((city: any, idx: number) => (
                            <option key={idx} value={city.name}>
                              {city.name}
                            </option>
                          ))}
                      </select>
                       {errors.personalCity && (
                        <span className="text-xs text-red-500 pl-1 absolute top-[52px]">
                          {errors.personalCity}
                        </span>
                      )}
                      <svg
                        className="absolute right-5 top-1/2 transform -translate-y-1/2 w-[18px] h-[18px] pointer-events-none"
                        viewBox="0 0 18 18"
                        fill="none"
                      >
                        <path
                          d="M14.94 6.71249L10.05 11.6025C9.4725 12.18 8.5275 12.18 7.95 11.6025L3.06 6.71249"
                          stroke="#292D32"
                          strokeWidth="1.5"
                          strokeMiterlimit="10"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col gap-3">
                    <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans'] pl-1">
                      PinCode
                    </label>
                    <input
                      type="text"
                      value={formData.personalPincode}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          personalPincode: e.target.value,
                        }));
                         if (errors.personalPincode) {
                          setErrors((prev) => ({ ...prev, personalPincode: "" }));
                        }
                      }}
                      maxLength={6}
                      placeholder="Pincode"
                      className={`flex-1 h-[50px] px-3 py-4 border ${errors.personalPincode ? "border-red-500" : "border-[#EAECF0] dark:border-gray-600"} rounded-lg text-sm text-[#121213] dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313]`}
                    />
                     {errors.personalPincode && (
                        <span className="text-xs text-red-500 pl-1">
                          {errors.personalPincode}
                        </span>
                      )}
                  </div>
                </div>

                {/* Date of Birth & Marital Status */}
                <div className="flex gap-5">
                  <div className="flex-1 flex flex-col gap-3">
                    <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans'] pl-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          dateOfBirth: e.target.value,
                        }));
                        if (errors.dateOfBirth) {
                          setErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors.dateOfBirth;
                            return newErrors;
                          });
                        }
                      }}
                      className={`w-full h-[50px] px-3  border ${errors.dateOfBirth ? "border-red-500" : "border-[#EAECF0] dark:border-gray-600"} rounded-lg text-sm text-[#121213] dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313]`}
                    />
                    {errors.dateOfBirth && (
                      <span className="text-xs text-red-500 pl-1">
                        {errors.dateOfBirth}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col gap-3">
                    <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans'] pl-1">
                      Marital Status
                    </label>
                    <div className="relative">
                      <select
                        value={formData.maritalStatus}
                        onChange={(e) => {
                          setFormData((prev) => ({
                            ...prev,
                            maritalStatus: e.target.value,
                          }));
                          if (errors.maritalStatus) {
                            setErrors((prev) => {
                              const newErrors = { ...prev };
                              delete newErrors.maritalStatus;
                              return newErrors;
                            });
                          }
                        }}
                        className={`w-full h-[50px] px-3  border ${errors.maritalStatus ? "border-red-500" : "border-[#EAECF0] dark:border-gray-600"} rounded-lg text-sm text-[#121213] dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313] appearance-none`}
                      >
                        <option value="">Select</option>
                        <option value="single">Single</option>
                        <option value="married">Married</option>
                        <option value="divorced">Divorced</option>
                      </select>
                      <svg
                        className="absolute right-5 top-1/2 transform -translate-y-1/2 w-[18px] h-[18px] pointer-events-none"
                        viewBox="0 0 18 18"
                        fill="none"
                      >
                        <path
                          d="M14.94 6.71249L10.05 11.6025C9.4725 12.18 8.5275 12.18 7.95 11.6025L3.06 6.71249"
                          stroke="#292D32"
                          strokeWidth="1.5"
                          strokeMiterlimit="10"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                       {errors.maritalStatus && (
                        <span className="text-xs text-red-500 pl-1 absolute top-[52px]">
                          {errors.maritalStatus}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* ID Proof */}
                <div className="flex flex-col gap-3">
                  <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans'] pl-1">
                    ID Proof
                  </label>
                  <div className="relative">
                    <select
                      value={formData.idProof}
                      onChange={(e) => {
                        setFormData((prev) => ({
                          ...prev,
                          idProof: e.target.value,
                        }));
                        if (errors.idProof) {
                          setErrors((prev) => {
                            const newErrors = { ...prev };
                            delete newErrors.idProof;
                            return newErrors;
                          });
                        }
                      }}
                      className={`w-full h-[50px] px-3  border ${errors.idProof ? "border-red-500" : "border-[#EAECF0] dark:border-gray-600"} rounded-lg text-sm text-[#121213] dark:text-gray-300 font-['Plus_Jakarta_Sans'] bg-white dark:bg-gray-800 focus:outline-none focus:border-[#131313] appearance-none`}
                    >
                      <option value="">Select</option>
                      <option value="aadhar">Aadhar Card</option>
                      <option value="passport">Passport</option>
                      <option value="driving_license">Driving License</option>
                    </select>
                    <span>
                      <svg
                        className="absolute right-5 top-1/2 transform -translate-y-1/2 w-[18px] h-[18px] pointer-events-none"
                        viewBox="0 0 18 18"
                        fill="none"
                      >
                        <path
                          d="M14.94 6.71249L10.05 11.6025C9.4725 12.18 8.5275 12.18 7.95 11.6025L3.06 6.71249"
                          stroke="#292D32"
                          strokeWidth="1.5"
                          strokeMiterlimit="10"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                     {errors.idProof && (
                        <span className="text-xs text-red-500 pl-1 absolute top-[52px]">
                          {errors.idProof}
                        </span>
                      )}
                  </div>
                </div>

                {/* ID Photos */}
                 <div className="flex flex-col gap-5">
                  <label className="text-base text-[#334054] dark:text-gray-300 font-['Plus_Jakarta_Sans'] pl-1">
                    ID Photos
                  </label>
                  <div className="w-[242px] max-md:w-full h-[175px] flex flex-col items-center justify-center gap-4 bg-[#F9FAFB] dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 relative overflow-hidden">
                    {idProofImage ? (
                      <img 
                        src={getImageUrl(idProofImage)} 
                        alt="ID Proof" 
                        className="w-full h-full object-cover absolute top-0 left-0"
                      />
                    ) : (
                      <>
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 18 18"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M1.125 9H16.875"
                            stroke="#98A2B3"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M9 16.875L9 1.125"
                            stroke="#98A2B3"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span className="text-sm text-[#98A2B3] font-['Plus_Jakarta_Sans'] z-1">
                          Upload Here
                        </span>
                      </>
                    )}
                    
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={handleUploadIDProof}
                      style={{
                        position: "absolute",
                        width: "100%",
                        height: "100%",
                        opacity: 0,
                        cursor: "pointer",
                        left: 0,
                        top: 0,
                        zIndex: 10,
                      }}
                    />
                    
                    {/* Show error message */}
                    {error && (
                      <span className="text-xs text-red-500 mt-2 z-20 bg-white px-1 rounded absolute bottom-2">{error}</span>
                    )}
                  </div>
                </div>
            
              </div>
            </div>
          )}

          {/* Step 8 - Terms & Conditions for Verification */}
          {currentStep === 8 && (
       <div className="flex gap-4 max-md:gap-1 max-md:flex-col overflow-y-auto scrollbar-hide max-h-screen  ">
        <div className="flex-1 flex flex-col gap-3">
            <h1 className="text-[32px] max-md:text-base font-bold text-[#1C2939] dark:text-white  ">
                      Terms & Conditions for Verification
                    </h1>
                    <p className="max-md:text-xs text-base text-[#485467] dark:text-gray-400 font-['Poppins'] leading-[155%]">
                      By proceeding with the verification process on{" "}
                      <span className="max-md:text-xs font-bold text-[#1C2939] dark:text-white">
                        Travel Homes
                      </span>
                      , you agree to the following terms and conditions:
                    </p>
                    <p className="max-md:text-xs text-base font-['Poppins'] leading-[155%] mt-4">
                        <span className="font-bold text-[#101828] dark:text-white">
                          1. Accurate Information
                        </span>
                        <span className="font-bold text-[#334054] dark:text-gray-300">
                          {" "}
                          –
                        </span>
                        <span className="text-[#334054] dark:text-gray-300">
                          {" "}
                          Provide truthful details; false information may lead
                          to account suspension.
                        </span>
                      </p>
                      <p className="max-md:text-xs text-base font-['Poppins'] leading-[155%]">
                        <span className="font-bold text-[#101828] dark:text-white">
                          2. Data Usage & Security
                        </span>
                        <span className="font-bold text-[#334054] dark:text-gray-300">
                          {" "}
                          –
                        </span>
                        <span className="text-[#334054] dark:text-gray-300">
                          {" "}
                          Your data is securely stored and used only for
                          verification; third-party services may assist in the
                          process.
                        </span>
                      </p>
                      <p className="max-md:text-xs text-base font-['Poppins'] leading-[155%]">
                        <span className="font-bold text-[#101828] dark:text-white">
                          3. Verification Rights
                        </span>
                        <span className="font-bold text-[#334054] dark:text-gray-300">
                          {" "}
                          –
                        </span>
                        <span className="text-[#334054] dark:text-gray-300">
                          {" "}
                          We may deny verification if information is invalid,
                          and terms are subject to updates.
                        </span>
                      </p>

                       <div className="flex items-center space-x-2 mt-4">
                    <Checkbox 
                      id="terms" 
                      checked={formData.termsAccepted}
                      onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, termsAccepted: checked }))}
                    />
                    <Label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      I accept the terms and conditions
                    </Label>
                  </div>

                
       </div>
   <div className="pb-4">
     <img
                  src="https://api.builder.io/api/v1/image/assets/TEMP/7e591c21d8b3bea0e51f3c5c2a65a03538099697?width=1000"
                  alt="Verification Illustration"
                  className="w-[500px] h-[500px] object-contain"
                />
       </div>
       </div>
          )}
        </div>
      </div>

      {/* Footer with Progress and Navigation */}
<div className="fixed bottom-0 z-30 w-full border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg px-5 lg:px-20 py-4">
  <div className="max-w-4xl mx-auto w-full flex items-center justify-between gap-6">

    {/* LEFT SECTION */}
    {currentStep !== 8 && (
      <div className="flex flex-col md:flex-row md:items-center gap-4 w-full">

        {/* PROGRESS TEXT */}
        <span className="text-sm md:text-lg font-semibold text-[#131313] dark:text-white">
          {currentStep}/{totalSteps - 1} Completed
        </span>

        {/* PROGRESS BAR */}
        <div className="flex gap-[6px] w-full md:w-[294px] h-[6px]">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-full rounded-2xl ${
                i <= currentStep
                  ? "bg-[#131313] dark:bg-white"
                  : "bg-[#EAECF0] dark:bg-gray-600"
              }`}
            />
          ))}
        </div>
      </div>
    )}

    {/* RIGHT SECTION */}
    {currentStep === 8 ? (
      <div className="flex items-center gap-3">
        <button
          onClick={handleBack}
          className="px-6 py-3 text-sm border border-gray-300 dark:border-gray-600 rounded-full"
        >
          Back
        </button>

        <button
          onClick={handleNext}
          disabled={isLoading}
          className="px-8 py-3 text-sm bg-[#131313] hover:bg-gray-800 text-white rounded-full w-[220px]"
        >
          {isLoading ? "Loading..." : "Start Verification"}
        </button>
      </div>
    ) : (
      <div className="flex items-center gap-3">
        <button
          onClick={handleBack}
          className="px-6 py-3 text-sm border border-gray-200 dark:border-gray-600 rounded-full"
        >
          Back
        </button>

        <button
          onClick={handleNext}
          className="px-8 py-3 text-sm bg-[#131313] text-white rounded-full"
        >
          Next
        </button>
      </div>
    )}
  </div>
</div>

    </div>
    </>
  );
};

export default CaravanOnboarding;
