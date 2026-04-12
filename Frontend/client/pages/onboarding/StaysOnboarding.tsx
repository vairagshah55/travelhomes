import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { cmsPublicApi } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";
import { toast } from "sonner";
import e from "express";
import { Country } from "country-state-city";
import { submitOnboardingData, getOnboardingData, offersApi } from "@/lib/api";
import { onboardingService } from "@/lib/onboardingService";
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
} from "lucide-react";
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

// Stays-specific step components
import {
  PropertyTypeStep,
  CategorySelectionStep,
  StayDetailsStep,
  FeaturesStep,
} from "./components/stays";

const countries: CountryOption[] = Country.getAllCountries().map((c) => ({
  isoCode: c.isoCode,
  name: c.name,
  countryCode: c.isoCode,
  dialCode: c.phonecode,
}));

// Property categories based on property types
const propertyCategories: Record<string, { id: string; name: string; icon: string }[]> = {
  villa: [],
  cabin: [
    { id: "rustic", name: "Rustic Cabin", icon: "🏕️" },
    { id: "modern", name: "Modern Cabin", icon: "🏠" },
    { id: "glamping", name: "Glamping Cabin", icon: "✨" },
    { id: "lakefront", name: "Lakefront Cabin", icon: "🏞️" },
  ],
  castle: [
    { id: "medieval", name: "Medieval Castle", icon: "🏰" },
    { id: "contemporary", name: "Contemporary Castle", icon: "🏛️" },
    { id: "boutique", name: "Boutique Castle", icon: "💎" },
  ],
  cave: [
    { id: "natural", name: "Natural Cave", icon: "🕳️" },
    { id: "luxury", name: "Luxury Cave", icon: "💎" },
    { id: "adventure", name: "Adventure Cave", icon: "🧗" },
  ],
  farmhouse: [
    { id: "traditional", name: "Traditional Farmhouse", icon: "🏘️" },
    { id: "modern", name: "Modern Farmhouse", icon: "🏠" },
    { id: "organic", name: "Organic Farmhouse", icon: "🌱" },
  ],
  camping: [
    { id: "tent", name: "Tent Camping", icon: "⛺" },
    { id: "rv", name: "RV Camping", icon: "🚐" },
    { id: "glamping", name: "Glamping Site", icon: "🏕️" },
  ],
  hut: [
    { id: "traditional", name: "Traditional Hut", icon: "🏠" },
    { id: "beach", name: "Beach Hut", icon: "🏖️" },
    { id: "mountain", name: "Mountain Hut", icon: "🏔️" },
  ],
  heritage: [
    { id: "colonial", name: "Colonial Heritage", icon: "🏛️" },
    { id: "palace", name: "Heritage Palace", icon: "🏰" },
    { id: "manor", name: "Heritage Manor", icon: "🏡" },
  ],
  tiny: [
    { id: "modern", name: "Modern Tiny Home", icon: "🏠" },
    { id: "rustic", name: "Rustic Tiny Home", icon: "🏕️" },
    { id: "offgrid", name: "Off-Grid Tiny Home", icon: "🔋" },
  ],
  tent: [
    { id: "safari", name: "Safari Tent", icon: "🦁" },
    { id: "luxury", name: "Luxury Tent", icon: "💎" },
    { id: "adventure", name: "Adventure Tent", icon: "🧗" },
  ],
  village: [
    { id: "traditional", name: "Traditional Village", icon: "🏘️" },
    { id: "cultural", name: "Cultural Village", icon: "🎭" },
    { id: "homestay", name: "Homestay Village", icon: "🏠" },
  ],
  container: [
    { id: "modern", name: "Modern Container", icon: "🏗️" },
    { id: "shipping", name: "Shipping Container", icon: "🚢" },
    { id: "luxury", name: "Luxury Container", icon: "💎" },
  ],
  cruise: [
    { id: "luxury", name: "Luxury Cruise", icon: "🛳️" },
    { id: "adventure", name: "Adventure Cruise", icon: "🗺️" },
    { id: "family", name: "Family Cruise", icon: "👨‍👩‍👧‍👦" },
  ],
};

// Dynamic features based on property types and categories
const getFeaturesForProperty = (propertyType: string, category: string, stayType: string) => {
  const baseFeatures: { label: string; value: string; icon: string | React.ComponentType<any> }[] = [

  ];

  // Features for entire stay properties
  if (stayType === "entire") {
    const entireStayFeatures = [
      ...baseFeatures,
      { label: "Garden", value: "garden", icon: "🌳" },
      { label: "Parking", value: "parking", icon: "🚗" },
      { label: "Sports Facilities", value: "sports", icon: Gamepad },
      { label: "Swimming Pool", value: "pool", icon: "🏊" },
      { label: "BBQ Area", value: "bbq", icon: "🍖" },
      { label: "Fireplace", value: "fireplace", icon: Flame },
      { label: "Jacuzzi", value: "jacuzzi", icon: "🛁" },
      { label: "Gym", value: "gym", icon: "💪" },
      { label: "Spa", value: "spa", icon: "💆" },
    ];

    switch (propertyType) {
      case "villa":
        return [
          ...entireStayFeatures,
          { label: "Private Pool", value: "private_pool", icon: "🏊" },
          { label: "Ocean View", value: "ocean_view", icon: "🌊" },
          { label: "Tennis Court", value: "tennis", icon: "🎾" },
        ];
      case "cabin":
        return [
          ...entireStayFeatures,
          { label: "Wood Stove", value: "wood_stove", icon: Flame },
          { label: "Hiking Trails", value: "hiking", icon: "🥾" },
          { label: "Fishing Access", value: "fishing", icon: "🎣" },
        ];
      case "castle":
        return [
          ...entireStayFeatures,
          { label: "Castle Tower", value: "tower", icon: "🏰" },
          { label: "Moat", value: "moat", icon: "🏞️" },
          { label: "Dungeon", value: "dungeon", icon: "🕳️" },
        ];
      case "farmhouse":
        return [
          ...entireStayFeatures,
          { label: "Farm Animals", value: "animals", icon: "🐄" },
          { label: "Organic Garden", value: "organic_garden", icon: "🌱" },
          { label: "Barn", value: "barn", icon: "🏭" },
        ];
      case "heritage":
        return [
          ...entireStayFeatures,
          { label: "Historical Artifacts", value: "artifacts", icon: "🏛️" },
          { label: "Antique Furniture", value: "antiques", icon: "🪑" },
          { label: "Museum Access", value: "museum", icon: "🎨" },
        ];
      default:
        return entireStayFeatures;
    }
  }

  // Features for individual rooms
  else {
    const roomFeatures = [
      ...baseFeatures,

    ];

    switch (propertyType) {
      case "tent":
        return [
          ...roomFeatures,
          { label: "Campfire Pit", value: "campfire", icon: Flame },
          { label: "Safari Bed", value: "safari_bed", icon: BedDouble },
          { label: "Mosquito Net", value: "mosquito_net", icon: "🦟" },
        ];
      case "treehouse":
        return [
          ...roomFeatures,
          { label: "Tree Views", value: "tree_views", icon: "🌳" },
          { label: "Rope Bridge", value: "rope_bridge", icon: "🌉" },
          { label: "Bird Watching", value: "birds", icon: "🐦" },
        ];
      case "container":
        return [
          ...roomFeatures,
          { label: "Industrial Design", value: "industrial", icon: "🏗️" },
          { label: "Modern Amenities", value: "modern", icon: "✨" },
          { label: "Eco-Friendly", value: "eco", icon: "🌱" },
        ];
      default:
        return roomFeatures;
    }
  }
};

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
  const { updateUserType, isAuthenticated, user } = useAuth();

  useEffect(() => {
    // Check if Unique Stays section is enabled
    cmsPublicApi.listHomepageSections().then((sections) => {
      const section = sections.find((s: any) => s.sectionKey === 'unique-stays');
      if (section && !section.isVisible) {
        toast.error("Stays onboarding is currently disabled.");
        navigate("/");
      }
    }).catch(console.error);

    if (!isAuthenticated) {
      toast.error("Please login to continue");
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [stayType, setStayType] = useState<"entire" | "individual">("entire");

  // Rules and regulations state
  const [entireStayRules, setEntireStayRules] = useState<string[]>([""]);
  const [roomRules, setRoomRules] = useState<Record<string, string[]>>({});
  const [optionalRules, setOptionalRules] = useState<string[]>([""]);
  const [guestCapacity, setGuestCapacity] = useState(0);
  const [numberOfRooms, setNumberOfRooms] = useState(1);
  const [numberOfBeds, setNumberOfBeds] = useState(0);
  const [numberOfBathrooms, setNumberOfBathrooms] = useState(0);
  const [regularPrice, setRegularPrice] = useState("");
  const [rooms, setRooms] = useState<Room[]>([
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

  ]);
  const [expandedRoom, setExpandedRoom] = useState<string>("1");

  // Features state
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [customFeatures, setCustomFeatures] = useState<string[]>([]);
  const [showCustomFeaturesInput, setShowCustomFeaturesInput] = useState(false);
  const [customFeatureInput, setCustomFeatureInput] = useState("");
  const [adminFeatures, setAdminFeatures] = useState<any[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<{ id: string; name: string; icon: string }[]>([]);
  const [subCategoriesMap, setSubCategoriesMap] = useState<Record<string, any[]>>({});

  // Discount state
  const [firstUserDiscount, setFirstUserDiscount] = useState(true);
  const [discountType, setDiscountType] = useState("percentage");
  const [discountPercentage, setDiscountPercentage] = useState("");
  const [finalPrice, setFinalPrice] = useState("");
  const [festivalOffers, setFestivalOffers] = useState(false);
  const [weeklyOffers, setWeeklyOffers] = useState(false);
  const [specialOffers, setSpecialOffers] = useState(false);

  // Business Details state
  const [brandName, setBrandName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [businessEmail, setBusinessEmail] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [locality, setLocality] = useState("India");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [businessPincode, setBusinessPincode] = useState("");
  const [personalPincode, setPersonalPincode] = useState("");

  // Personal Details state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [personalCountry, setPersonalCountry] = useState("India");
  const [personalState, setPersonalState] = useState("");
  const [personalCity, setPersonalCity] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [idProof, setIdProof] = useState("");
  const [idProofImage, setIdProofImage] = useState<string | null>(null);
  const [images, setImages] = useState<(string | null)[]>(Array(5).fill(null));
  const [entireStayImages, setEntireStayImages] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [selected, setSelected] = useState<CountryOption | null>(
    countries[100],
  );
  const [open, setOpen] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const { userDetails, updateUserDetails } = useUserDetails();

  const totalSteps = 8;
  const completedSteps = currentStep;
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [status, setStatus] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState<string>("");

  const clearError = (field: string) => {
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const [fileName, setFileName] = useState("");
  const [data, setData] = useState([]);
  const [countryOption, setCoutryOption] = useState("India");
  const [countryOption2, setCoutryOption2] = useState("India");
  const [stateOption, setStateOption] = useState("");
  const [stateOption2, setStateOption2] = useState("");
  const [cityOption, setCityOptions] = useState("");
  const [cityOption2, setCityOptions2] = useState("");

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

  // Populate country list on mount
  useEffect(() => {
    fetch("/countries_states_cities.json") // remove ../../.. for public/ path
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error("Failed to load countries:", err));

    // Fetch admin features (amenities)
    cmsPublicApi.getFeatures("Unique Stay").then(list => {
      // Filter for features or items without type (legacy)
      setAdminFeatures(list.filter((f: any) => f.status === 'enable' && (!f.type || f.type === 'feature')));
    }).catch(console.error);

    // Fetch property types (categories)
    cmsPublicApi.getFeatures("Unique Stay", "category").then(list => {
      const types = list
        .filter((f: any) => f.status === 'enable')
        .map((f: any) => ({
           id: f.name.toLowerCase(),
           realId: f.id || f._id,
           name: f.name,
           icon: f.icon
        }));
      setPropertyTypes(types);

      // Fetch dynamic sub-categories for each property type
      types.forEach((type: any) => {
        if (type.realId) {
          cmsPublicApi.getFeatures(type.realId, "subcategory").then(subs => {
             if (subs && subs.length > 0) {
               setSubCategoriesMap(prev => ({
                 ...prev,
                 [type.id]: subs.map((s: any) => ({
                    id: s.name.toLowerCase().replace(/\s+/g, '-'),
                    name: s.name,
                    icon: s.icon
                 }))
               }));
             }
          }).catch(console.error);
        }
      });

    }).catch(console.error);

    // Check for existing data
    const loadExistingData = async () => {
      try {
        const data = await getOnboardingData();

        if (data && data.type === 'stay' && data.doc && ['pending', 'draft', 'rejected'].includes(data.doc.status)) {
          const doc = data.doc;
          console.log('Loading existing stay data:', doc);

          console.log('status:', doc.status);
          setStatus(doc.status);
          console.log('rejectionReason:', doc.rejectionReason);
          setRejectionReason(doc.rejectionReason || "");

          console.log('selectedProperties:', doc.selectedProperties);
          setSelectedProperties(doc.selectedProperties || []);
          console.log('selectedCategories:', doc.selectedCategories);
          setSelectedCategories(doc.selectedCategories || []);
          console.log('stayType:', doc.stayType);
          setStayType(doc.stayType || "entire");
          console.log('guestCapacity:', doc.guestCapacity);
          setGuestCapacity(doc.guestCapacity || 0);
          console.log('numberOfRooms:', doc.numberOfRooms);
          setNumberOfRooms(doc.numberOfRooms || 0);
          console.log('numberOfBeds:', doc.numberOfBeds);
          setNumberOfBeds(doc.numberOfBeds || 0);
          console.log('numberOfBathrooms:', doc.numberOfBathrooms);
          setNumberOfBathrooms(doc.numberOfBathrooms || 0);
          console.log('regularPrice:', doc.regularPrice);
          setRegularPrice(String(doc.regularPrice || ""));

          console.log('rooms:', doc.rooms);
          if (doc.rooms && doc.rooms.length > 0) {
            setRooms(doc.rooms);
            setCoverImage(doc.coverImage || null);
            // Handle images
            if (doc.stayType === 'entire') {
               console.log('entireStayImages:', doc.images);
               const imgs = doc.images || [];
               setEntireStayImages(imgs);
            } else {
               console.log('images (room):', doc.rooms[0]?.photos);
               const imgs = doc.rooms[0]?.photos || [];
               setImages([...imgs, ...Array(Math.max(0, 5 - imgs.length)).fill(null)]);
            }
          }

          console.log('selectedFeatures:', doc.selectedFeatures);
          setSelectedFeatures(doc.selectedFeatures || []);
          console.log('rules:', doc.rules);
          setEntireStayRules(doc.rules && doc.rules.length > 0 ? doc.rules : [""]);
          console.log('roomRules:', doc.roomRules);
          setRoomRules(doc.roomRules || {});
          console.log('optionalRules:', doc.optionalRules);
          setOptionalRules(doc.optionalRules && doc.optionalRules.length > 0 ? doc.optionalRules : [""]);

          console.log('firstUserDiscount:', doc.firstUserDiscount);
          setFirstUserDiscount(doc.firstUserDiscount ?? true);
          console.log('discountType:', doc.discountType);
          setDiscountType(doc.discountType || "");
          console.log('discountPercentage:', doc.discountPercentage);
          setDiscountPercentage(String(doc.discountPercentage || ""));
          console.log('finalPrice:', doc.finalPrice);
          setFinalPrice(String(doc.finalPrice || ""));

          console.log('festivalOffers:', doc.festivalOffers);
          setFestivalOffers(doc.festivalOffers ?? false);
          console.log('weeklyOffers:', doc.weeklyOffers);
          setWeeklyOffers(doc.weeklyOffers ?? false);
          console.log('specialOffers:', doc.specialOffers);
          setSpecialOffers(doc.specialOffers ?? false);

          console.log('brandName:', doc.brandName);
          setBrandName(doc.brandName || "");
          console.log('companyName:', doc.companyName);
          setCompanyName(doc.companyName || "");
          console.log('gstNumber:', doc.gstNumber);
          setGstNumber(doc.gstNumber || "");
          console.log('businessEmail:', doc.businessEmail);
          setBusinessEmail(doc.businessEmail || "");
          console.log('businessPhone:', doc.businessPhone);
          setBusinessPhone(doc.businessPhone || "");
          console.log('locality:', doc.locality);
          setLocality(doc.locality || "India");
          console.log('state:', doc.state);
          setState(doc.state || "");
          setStateOption2(doc.state || "");
          console.log('city:', doc.city);
          setCity(doc.city || "");
          setCityOptions2(doc.city || "");
          console.log('businessPincode/pincode:', doc.businessPincode || doc.pincode);
          setBusinessPincode(doc.businessPincode || doc.pincode || "");
          console.log('personalPincode:', doc.personalPincode);
          setPersonalPincode(doc.personalPincode || "");

          console.log('firstName:', doc.firstName);
          setFirstName(doc.firstName || "");
          console.log('lastName:', doc.lastName);
          setLastName(doc.lastName || "");
          console.log('personalCountry:', doc.personalCountry);
          setPersonalCountry(doc.personalCountry || "India");
          console.log('personalState:', doc.personalState);
          setPersonalState(doc.personalState || "");
          setStateOption(doc.personalState || "");
          console.log('personalCity:', doc.personalCity);
          setPersonalCity(doc.personalCity || "");
          setCityOptions(doc.personalCity || "");
          console.log('dateOfBirth:', doc.dateOfBirth);
          setDateOfBirth(doc.dateOfBirth || "");
          console.log('maritalStatus:', doc.maritalStatus);
          setMaritalStatus(doc.maritalStatus || "");
          console.log('idProof:', doc.idProof);
          setIdProof(doc.idProof || "");

          console.log('idPhotos:', doc.idPhotos);
          if (doc.idPhotos && doc.idPhotos.length > 0) {
            setIdProofImage(doc.idPhotos[0]);
          }

          setTermsAccepted(false);
        } else if (userDetails && user?.userType !== 'vendor') {
           // Auto-fill from user details if no draft exists and user is not a vendor (first time)
           setFirstName(userDetails.firstName || "");
           setLastName(userDetails.lastName || "");
           setPersonalState(userDetails.state || "");
           setStateOption(userDetails.state || "");
           setPersonalCity(userDetails.city || "");
           setCityOptions(userDetails.city || "");
           setPersonalPincode(userDetails.personalPincode || "");

           setPersonalCountry(userDetails.country || "India");
           if (userDetails.dateOfBirth) {
               setDateOfBirth(new Date(userDetails.dateOfBirth).toISOString().split('T')[0]);
           }
           setMaritalStatus(userDetails.maritalStatus || "");
           setIdProof(userDetails.idProof || "");
           if (userDetails.idPhotos && userDetails.idPhotos.length > 0) {
               setIdProofImage(userDetails.idPhotos[0]);
           }

           setBrandName(userDetails.business?.brandName || "");
           setCompanyName(userDetails.business?.legalCompanyName || "");
           setGstNumber(userDetails.business?.gstNumber || "");
           setBusinessEmail(userDetails.business?.email || "");
           setBusinessPhone(userDetails.business?.phoneNumber || "");
           setLocality(userDetails.business?.locality || "India");
           setState(userDetails.business?.state || "");
           setStateOption2(userDetails.business?.state || "");
           setCity(userDetails.business?.city || "");
           setCityOptions2(userDetails.business?.city || "");
           setBusinessPincode(userDetails.business?.pincode || "");
        }
      } catch (err) {
        console.error("Failed to load existing onboarding data", err);
      }
    };
    loadExistingData();

  }, [userDetails]);

  // Calculate final price based on regular price and discount
  useEffect(() => {
    if (currentStep === 4) {
      const price = parseFloat(regularPrice) || 0;
      const discount = parseFloat(discountPercentage) || 0;

      let calculatedPrice = 0;
      if (discountType === "percentage") {
        calculatedPrice = price - (price * discount / 100);
      } else {
        calculatedPrice = price - discount;
      }

      calculatedPrice = Math.max(0, calculatedPrice);
      setFinalPrice(calculatedPrice.toFixed(0));
    }
  }, [regularPrice, discountPercentage, discountType, currentStep]);

  const handleBack = () => {
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

  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      toast.error("Please upload a valid image (JPEG/PNG)");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCoverImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeCoverImage = () => {
    setCoverImage(null);
  };

  const handleNext = () => {
    // Per-step validation
    const newErrors: Record<string, string> = {};

    if (currentStep === 0) {
      if (!selectedProperties || selectedProperties.length === 0) {
        toast.error("Please select at least one property type");
        return;
      }
    } else if (currentStep === 1) {
      const hasCategories = selectedProperties.some((propId) => {
        const categories = getEffectiveCategories(propId);
        return categories && categories.length > 0;
      });

      if (
        hasCategories &&
        (!selectedCategories || selectedCategories.length === 0)
      ) {
        toast.error("Please select at least one category");
        return;
      }
    } else if (currentStep === 2) {
      if (stayType === "entire") {
        if (guestCapacity <= 0) newErrors.guestCapacity = "Guest capacity must be at least 1";
        if (numberOfRooms <= 0) newErrors.numberOfRooms = "Add at least 1 room";
        if (numberOfBeds <= 0) newErrors.numberOfBeds = "Add at least 1 bed";
        if (numberOfBathrooms <= 0) newErrors.numberOfBathrooms = "Add at least 1 bathroom";
        if (!regularPrice || Number(regularPrice) <= 0) newErrors.regularPrice = "Enter a valid price";
        const hasValidRule = entireStayRules.some((rule) => rule.trim() !== "");
        if (!hasValidRule) newErrors.entireStayRules = "Add at least one rule";
        if (!coverImage) newErrors.coverImage = "Cover photo is required";
        if (entireStayImages.length < 5) newErrors.entireStayImages = `Upload at least 5 images (${entireStayImages.length}/5)`;
      } else if (stayType === "individual") {
        if (!coverImage) newErrors.coverImage = "Cover photo is required";
        if (!rooms || rooms.length === 0) {
          newErrors.rooms = "Add at least one room";
        } else {
          for (let i = 0; i < rooms.length; i++) {
            const room = rooms[i];
            const validRoomImages = (room.photos || []).filter(p => p);
            if (!room.name || !room.name.trim()) newErrors[`room_${i}_name`] = "Room name is required";
            if (!room.description || !room.description.trim()) newErrors[`room_${i}_description`] = "Description is required";
            if (validRoomImages.length < 5) newErrors[`room_${i}_photos`] = `Upload at least 5 images (${validRoomImages.length}/5)`;
            if (room.guestCapacity <= 0) newErrors[`room_${i}_guestCapacity`] = "Guest capacity must be at least 1";
            if (room.beds <= 0) newErrors[`room_${i}_beds`] = "Add at least 1 bed";
            if (room.bathrooms <= 0) newErrors[`room_${i}_bathrooms`] = "Add at least 1 bathroom";
            if (!room.price || room.price <= 0) newErrors[`room_${i}_price`] = "Enter a valid price";
          }
        }
      }
    } else if (currentStep === 3) {
      if (!selectedFeatures || selectedFeatures.length === 0) {
        newErrors.features = "Please select at least one feature";
      }
    } else if (currentStep === 4) {
      if (
        firstUserDiscount ||
        festivalOffers ||
        weeklyOffers ||
        specialOffers
      ) {
        if (!discountPercentage)
          newErrors.discountPercentage = "Discount Percentage is required";
        if (!finalPrice) newErrors.finalPrice = "Final Price is required";
      }
    } else if (currentStep === 5) {
      if (!brandName || !brandName.trim()) {
        newErrors.brandName = "Brand name is required";
      }
      if (!companyName || !companyName.trim()) {
        newErrors.companyName = "Company name is required";
      }
      if (!businessEmail || !businessEmail.trim()) {
        newErrors.businessEmail = "Business email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(businessEmail)) {
        newErrors.businessEmail = "Please enter a valid email address";
      }
      if (!businessPhone || !businessPhone.trim()) {
        newErrors.businessPhone = "Business phone number is required";
      } else if (!/^\d{10}$/.test(businessPhone)) {
        newErrors.businessPhone = "Please enter a valid 10-digit phone number";
      }
      if (!locality || !locality.trim()) {
        newErrors.locality = "Business locality is required";
      }
      if (!state || !state.trim()) {
        newErrors.state = "Business state is required";
      }
      if (!city || !city.trim()) {
        newErrors.city = "Business city is required";
      }
      if (!businessPincode || !businessPincode.trim()) {
        newErrors.businessPincode = "Business pincode is required";
      }
    } else if (currentStep === 6) {
      if (!firstName || !firstName.trim()) {
        newErrors.firstName = "First name is required";
      }
      if (!lastName || !lastName.trim()) {
        newErrors.lastName = "Last name is required";
      }
      if (!personalState || !personalState.trim()) {
        newErrors.personalState = "Personal state is required";
      }
      if (!personalCity || !personalCity.trim()) {
        newErrors.personalCity = "Personal city is required";
      }
      if (!personalPincode || !personalPincode.trim()) {
        newErrors.personalPincode = "Pincode is required";
      }
      if (!dateOfBirth) {
        newErrors.dateOfBirth = "Date of birth is required";
      }
      if (!maritalStatus) {
        newErrors.maritalStatus = "Marital status is required";
      }
      if (!idProof) {
        newErrors.idProof = "ID proof is required";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({}); // Clear errors if validation passes

    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
    } else if (currentStep === totalSteps - 1) {
      if (!termsAccepted) {
        toast.error("You must accept the Terms & Conditions to proceed.");
        return;
      }
      handleComplete();
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    try {
      setIsLoading(true);

      const gallery: string[] = (images || []).filter(Boolean) as string[];
      const entireStayGallery: string[] = entireStayImages || [];
      const roomsWithPhotos = [...rooms];
      if (!roomsWithPhotos.length) {
        roomsWithPhotos.push({ id: '1', name: '', description: '', photos: [], guestCapacity: 1, beds: 1, bathrooms: 1, price: Number(regularPrice) || 0 });
      }

      if (stayType === "entire") {
        roomsWithPhotos[0] = { ...roomsWithPhotos[0], photos: entireStayGallery };
      }

      const payload = {
        selectedProperties,
        selectedCategories,
        stayType,
        coverImage,
        guestCapacity: Number(guestCapacity),
        numberOfRooms: Number(numberOfRooms),
        numberOfBeds: Number(numberOfBeds),
        numberOfBathrooms: Number(numberOfBathrooms),
        regularPrice: Number(regularPrice),
        rooms: roomsWithPhotos,
        selectedFeatures,
        entireStayRules: entireStayRules.filter(rule => rule.trim() !== ""),
        roomRules,
        optionalRules: optionalRules.filter(rule => rule.trim() !== ""),
        firstUserDiscount,
        discountType,
        discountPercentage: Number(discountPercentage),
        finalPrice: Number(finalPrice) || 0,
        festivalOffers,
        weeklyOffers,
        specialOffers,
        brandName,
        companyName,
        gstNumber,
        businessEmail,
        businessPhone,
        locality,
        state,
        city,
        pincode: businessPincode,
        businessPincode,
        personalPincode,
        firstName,
        lastName,
        personalCountry,
        personalState,
        personalCity,
        dateOfBirth,
        maritalStatus,
        idProof,
        idPhotos: idProofImage ? [idProofImage] : [],
      };

      // Basic validation
      if (!selectedProperties || selectedProperties.length === 0) {
        throw new Error('Please select at least one property type');
      }

      const regPrice = Number(regularPrice);
      if (!regularPrice || isNaN(regPrice) || regPrice <= 0) {
        throw new Error('Please enter a valid regular price');
      }

      if (!guestCapacity || Number(guestCapacity) <= 0) {
        throw new Error('Please enter a valid guest capacity');
      }

      const result = await submitOnboardingData('stay', payload);

      if (result?.id) {
         await updateUserDetails({
             firstName: firstName,
             lastName: lastName,
             phoneNumber: businessPhone,
             country: personalCountry,
             state: personalState,
             city: personalCity,
             personalLocality: personalCountry,
             personalPincode: personalPincode,
             dateOfBirth: dateOfBirth,
             maritalStatus: maritalStatus,
             idProof: idProof,
             idPhotos: idProofImage ? [idProofImage] : [],

             business: {
               brandName: brandName,
               legalCompanyName: companyName,
               gstNumber: gstNumber,
               email: businessEmail,
               phoneNumber: businessPhone,
               locality: locality,
               state: state,
               city: city,
               pincode: businessPincode,
             }
         });

        onboardingService.setStayId(result.id);
        sessionStorage.setItem('onboardingId', result.id);
        sessionStorage.setItem('onboardingType', 'stay');
        sessionStorage.setItem('id', result.id);
        updateUserType('vendor');
        toast.success('Stay onboarding saved successfully!');
        navigate("/onboarding/selfie-verification");
        return;
      } else {
        toast.error("Could not save onboarding. Please try again.");
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save');
    } finally {
      setIsLoading(false);
    }
  };

  const sliderRef = useRef(null);

  const togglePropertySelection = (propertyId: string) => {
    setSelectedProperties((prev) => {
      const isSelected = prev.includes(propertyId);
      if (isSelected) {
        return prev.filter((id) => id !== propertyId);
      } else {
        if (prev.length >= 5) {
          toast.error("Maximum 5 properties can be selected");
          return prev;
        }
        return [...prev, propertyId];
      }
    });
  };

  const canProceed = () => {
    if (currentStep === 0) return selectedProperties.length > 0;
    if (currentStep === 1) return selectedCategories.length > 0;
    if (currentStep === 2) {
      if (stayType === "entire") {
        return guestCapacity > 0 && numberOfRooms > 0 && numberOfBeds > 0 && numberOfBathrooms > 0
          && !!regularPrice && Number(regularPrice) > 0 && !!coverImage && entireStayImages.length >= 5;
      }
      if (stayType === "individual") {
        return !!coverImage && rooms.length > 0 && rooms.every(r =>
          r.name?.trim() && r.description?.trim() && r.guestCapacity > 0 && r.beds > 0 && r.bathrooms > 0 && r.price > 0 && (r.photos || []).length >= 5
        );
      }
      return false;
    }
    if (currentStep === 3) return true;
    if (currentStep === 4) return true;
    if (currentStep === 5)
      return brandName.trim() !== "" && companyName.trim() !== "";
    if (currentStep === 6)
      return firstName.trim() !== "" && lastName.trim() !== "";
    return true;
  };

  const toggleFeatureSelection = (featureId: string) => {
    if (featureId === "others") {
      setShowCustomFeaturesInput(!showCustomFeaturesInput);
    } else {
      setSelectedFeatures((prev) => {
        const isSelected = prev.includes(featureId);
        if (isSelected) {
          return prev.filter((id) => id !== featureId);
        } else {
          return [...prev, featureId];
        }
      });
    }
  };

  const incrementValue = (
    value: number,
    setter: (val: number) => void,
    max: number = 20,
  ) => {
    if (value < max) setter(value + 1);
  };

  const decrementValue = (
    value: number,
    setter: (val: number) => void,
    min: number = 1,
  ) => {
    if (value > min) setter(value - 1);
  };

  const addRoom = () => {
    const newRoom: Room = {
      id: (rooms.length + 1).toString(),
      name: "",
      description: "",
      photos: [],
      guestCapacity: 1,
      beds: 1,
      bathrooms: 1,
      price: 5934,
    };
    setRooms([...rooms, newRoom]);
    setNumberOfRooms(rooms.length + 1);
  };

  const removeRoom = () => {
    if (rooms.length > 1) {
      setRooms(rooms.slice(0, -1));
      setNumberOfRooms(rooms.length - 1);
    }
  };

  const updateRoom = (id: string, field: keyof Room, value: any) => {
    setRooms((prev) =>
      prev.map((room) => (room.id === id ? { ...room, [field]: value } : room))
    );
  };

  const removeRoomImage = (roomId: string, index: number) => {
    setRooms(prev => prev.map(room => {
      if (room.id === roomId) {
        return {
          ...room,
          photos: (room.photos || []).filter((_, i) => i !== index)
        };
      }
      return room;
    }));
  };

  const handleRoomImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    roomId: string
  ) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
            validFiles.push(file);
        }
    }

    if (validFiles.length === 0) return;

    const readPromises = validFiles.map(file => {
        return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
        });
    });

    Promise.all(readPromises).then(base64Images => {
        setRooms(prev => prev.map(room => {
            if (room.id === roomId) {
                return {
                    ...room,
                    photos: [...(room.photos || []), ...base64Images]
                };
            }
            return room;
        }));
    });
  };

  const handleImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      toast.error("Only JPG and PNG images are allowed!");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const newImages = [...images];
      newImages[index] = reader.result as string;
      setImages(newImages);
    };
    reader.readAsDataURL(file);
  };

  const handleEntireStayImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    index: number,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
      toast.error("Only JPG and PNG images are allowed!");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const newImages = [...entireStayImages];
      newImages[index] = reader.result as string;
      setEntireStayImages(newImages);
    };
    reader.readAsDataURL(file);
  };

  const removeEntireStayImage = (index: number) => {
    setEntireStayImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadIDProof = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setError("");
    setFileName("");

    if (file) {
      const validTypes = ["image/jpeg", "image/png", "application/pdf"];
      if (!validTypes.includes(file.type)) {
        setError("Only JPG, PNG, or PDF files are allowed.");
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        setIdProofImage(reader.result as string);
      };
      reader.readAsDataURL(file);

      setFileName(file.name);
    }
  };

  // Rules management functions
  const addEntireStayRule = () => {
    setEntireStayRules(prev => [...prev, ""]);
  };

  const removeEntireStayRule = (index: number) => {
    setEntireStayRules(prev => prev.filter((_, i) => i !== index));
  };

  const updateEntireStayRule = (index: number, value: string) => {
    setEntireStayRules(prev => prev.map((rule, i) => i === index ? value : rule));
  };

  const addRoomRule = (roomId: string) => {
    setRoomRules(prev => ({
      ...prev,
      [roomId]: [...(prev[roomId] || [""]), ""]
    }));
  };

  const removeRoomRule = (roomId: string, index: number) => {
    setRoomRules(prev => {
      const roomRulesList = prev[roomId] || [];
      return {
        ...prev,
        [roomId]: roomRulesList.filter((_, i) => i !== index)
      };
    });
  };

  const updateRoomRule = (roomId: string, index: number, value: string) => {
    setRoomRules(prev => ({
      ...prev,
      [roomId]: (prev[roomId] || []).map((rule, i) => i === index ? value : rule)
    }));
  };

  const addOptionalRule = () => {
    setOptionalRules(prev => [...prev, ""]);
  };

  const removeOptionalRule = (index: number) => {
    setOptionalRules(prev => prev.filter((_, i) => i !== index));
  };

  const updateOptionalRule = (index: number, value: string) => {
    setOptionalRules(prev => prev.map((rule, i) => i === index ? value : rule));
  };

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
    businessMapQuery
  )}&output=embed`;

  // Compute features data for FeaturesStep
  const primaryPropertyType = selectedProperties[0] || "";
  const featuresData = getFeaturesForProperty(primaryPropertyType, "", stayType);

  // Build discount offers object for DiscountOffersStep
  const discountOffers = {
    firstUser: {
      enabled: firstUserDiscount,
      type: discountType,
      value: discountPercentage,
      finalPrice: finalPrice,
    },
    festival: {
      enabled: festivalOffers,
      type: discountType,
      value: discountPercentage,
      finalPrice: finalPrice,
    },
    weekly: {
      enabled: weeklyOffers,
      type: discountType,
      value: discountPercentage,
      finalPrice: finalPrice,
    },
    special: {
      enabled: specialOffers,
      type: discountType,
      value: discountPercentage,
      finalPrice: finalPrice,
    },
  };

  const handleDiscountToggle = (key: "firstUser" | "festival" | "weekly" | "special") => {
    switch (key) {
      case "firstUser": setFirstUserDiscount(!firstUserDiscount); break;
      case "festival": setFestivalOffers(!festivalOffers); break;
      case "weekly": setWeeklyOffers(!weeklyOffers); break;
      case "special": setSpecialOffers(!specialOffers); break;
    }
  };

  const handleDiscountOfferChange = (
    _key: "firstUser" | "festival" | "weekly" | "special",
    field: keyof DiscountOffer,
    value: string,
  ) => {
    // All offers share the same discountType, discountPercentage, finalPrice
    switch (field) {
      case "type":
        setDiscountType(value);
        break;
      case "value":
        setDiscountPercentage(value);
        clearError("discountPercentage");
        break;
      case "finalPrice":
        setFinalPrice(value);
        clearError("finalPrice");
        break;
    }
  };

  // Business details onChange handler
  const handleBusinessChange = (field: string, value: string) => {
    switch (field) {
      case "brandName": setBrandName(value); clearError("brandName"); break;
      case "companyName": setCompanyName(value); clearError("companyName"); break;
      case "gstNumber": setGstNumber(value); break;
      case "businessEmail": setBusinessEmail(value); clearError("businessEmail"); break;
      case "businessPhone": setBusinessPhone(value); clearError("businessPhone"); break;
      case "pincode": setBusinessPincode(value); clearError("businessPincode"); break;
    }
  };

  const handleBusinessStateChange = (val: string) => {
    setStateOption2(val);
    setCityOptions2("");
    clearError("state");
  };

  const handleBusinessCityChange = (val: string) => {
    setCityOptions2(val);
    clearError("city");
  };

  // Personal details onChange handler
  const handlePersonalChange = (field: string, value: string) => {
    switch (field) {
      case "firstName": setFirstName(value); clearError("firstName"); break;
      case "lastName": setLastName(value); clearError("lastName"); break;
      case "pincode": setPersonalPincode(value); clearError("personalPincode"); break;
      case "dateOfBirth": setDateOfBirth(value); clearError("dateOfBirth"); break;
      case "maritalStatus": setMaritalStatus(value); clearError("maritalStatus"); break;
      case "idProof": setIdProof(value); clearError("idProof"); break;
    }
  };

  const handlePersonalStateChange = (val: string) => {
    setStateOption(val);
    setCityOptions("");
    clearError("personalState");
  };

  const handlePersonalCityChange = (val: string) => {
    setCityOptions(val);
    clearError("personalCity");
  };

  const handleCategoryToggle = (categoryKey: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryKey)
        ? prev.filter((id) => id !== categoryKey)
        : [...prev, categoryKey]
    );
  };

  // ---------- Render ----------

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <PropertyTypeStep
            selectedProperties={selectedProperties}
            propertyTypes={propertyTypes}
            onToggle={togglePropertySelection}
            errors={errors}
          />
        );

      case 1:
        return (
          <CategorySelectionStep
            selectedProperties={selectedProperties}
            selectedCategories={selectedCategories}
            propertyTypes={propertyTypes}
            getEffectiveCategories={getEffectiveCategories}
            onCategoryToggle={handleCategoryToggle}
          />
        );

      case 2:
        return (
          <StayDetailsStep
            stayType={stayType}
            setStayType={setStayType}
            guestCapacity={guestCapacity}
            numberOfRooms={numberOfRooms}
            numberOfBeds={numberOfBeds}
            numberOfBathrooms={numberOfBathrooms}
            regularPrice={regularPrice}
            setRegularPrice={setRegularPrice}
            incrementValue={incrementValue}
            decrementValue={decrementValue}
            setGuestCapacity={setGuestCapacity}
            setNumberOfRooms={setNumberOfRooms}
            setNumberOfBeds={setNumberOfBeds}
            setNumberOfBathrooms={setNumberOfBathrooms}
            entireStayRules={entireStayRules}
            addEntireStayRule={addEntireStayRule}
            removeEntireStayRule={removeEntireStayRule}
            updateEntireStayRule={updateEntireStayRule}
            roomRules={roomRules}
            addRoomRule={addRoomRule}
            removeRoomRule={removeRoomRule}
            updateRoomRule={updateRoomRule}
            coverImage={coverImage}
            handleCoverImageUpload={handleCoverImageUpload}
            removeCoverImage={removeCoverImage}
            renderImageSrc={renderImageSrc}
            entireStayImages={entireStayImages}
            setEntireStayImages={setEntireStayImages}
            removeEntireStayImage={removeEntireStayImage}
            sliderRef={sliderRef}
            rooms={rooms}
            expandedRoom={expandedRoom}
            setExpandedRoom={setExpandedRoom}
            addRoom={addRoom}
            removeRoom={removeRoom}
            updateRoom={updateRoom}
            handleRoomImageUpload={handleRoomImageUpload}
            removeRoomImage={removeRoomImage}
            errors={errors}
            clearError={clearError}
          />
        );

      case 3:
        return (
          <FeaturesStep
            selectedFeatures={selectedFeatures}
            toggleFeatureSelection={toggleFeatureSelection}
            adminFeatures={adminFeatures}
            customFeatures={customFeatures}
            setCustomFeatures={setCustomFeatures}
            setSelectedFeatures={setSelectedFeatures}
            showCustomFeaturesInput={showCustomFeaturesInput}
            setShowCustomFeaturesInput={setShowCustomFeaturesInput}
            customFeatureInput={customFeatureInput}
            setCustomFeatureInput={setCustomFeatureInput}
            featuresData={featuresData}
            errors={errors}
          />
        );

      case 4:
        return (
          <DiscountOffersStep
            offers={discountOffers}
            onToggle={handleDiscountToggle}
            onOfferChange={handleDiscountOfferChange}
            errors={errors}
            weeklyLabel="Weekly or Monthly Offers"
          />
        );

      case 5:
        return (
          <BusinessDetailsStep
            values={{
              brandName,
              companyName,
              gstNumber,
              businessEmail,
              businessPhone,
              pincode: businessPincode,
            }}
            errors={errors}
            onChange={handleBusinessChange}
            selectedCountry={selected}
            onCountrySelect={setSelected}
            countryDialogOpen={open}
            setCountryDialogOpen={setOpen}
            countries={countries}
            locationData={data}
            selectedState={stateOption2}
            selectedCity={cityOption2}
            countryName={countryOption2}
            onStateChange={handleBusinessStateChange}
            onCityChange={handleBusinessCityChange}
            mapSrc={mapSrcbusiness}
          />
        );

      case 6:
        return (
          <PersonalDetailsStep
            values={{
              firstName,
              lastName,
              pincode: personalPincode,
              dateOfBirth,
              maritalStatus,
              idProof,
            }}
            errors={errors}
            onChange={handlePersonalChange}
            locationData={data}
            selectedState={stateOption}
            selectedCity={cityOption}
            countryName={countryOption}
            onStateChange={handlePersonalStateChange}
            onCityChange={handlePersonalCityChange}
            idProofImage={idProofImage}
            onIdProofUpload={handleUploadIDProof}
            uploadError={error}
          />
        );

      case 7:
        return (
          <TermsConditionsStep
            termsAccepted={termsAccepted}
            onTermsChange={setTermsAccepted}
          />
        );

      default:
        return null;
    }
  };

  return (
    <OnboardingLayout
      currentStep={currentStep}
      totalSteps={totalSteps}
      isLoading={isLoading}
      canProceed={canProceed()}
      termsAccepted={termsAccepted}
      onBack={handleBack}
      onNext={handleNext}
    >
      {status === 'rejected' && (
        <div className="w-full max-w-4xl p-4 border border-red-200 bg-red-50 rounded-md">
          <h3 className="text-red-800 font-semibold mb-1">Service Rejected</h3>
          <p className="text-red-700 text-sm">
            Reason: {rejectionReason || 'No reason provided'}
          </p>
          <p className="text-red-600 text-xs mt-2">
            Please update the details and resubmit for approval.
          </p>
        </div>
      )}

      {renderStepContent()}
    </OnboardingLayout>
  );
};

export default StaysOnboarding;
