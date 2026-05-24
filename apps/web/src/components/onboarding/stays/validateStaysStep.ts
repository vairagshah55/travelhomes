interface Room {
  name: string;
  description: string;
  photos: string[];
  guestCapacity: number;
  beds: number;
  bathrooms: number;
  price: number;
}

export interface ValidateStaysStepInput {
  currentStep: number;
  selectedProperties: string[];
  selectedCategories: string[];
  stayType: "entire" | "individual";
  guestCapacity: number;
  numberOfRooms: number;
  numberOfBeds: number;
  numberOfBathrooms: number;
  regularPrice: string;
  entireStayRules: string[];
  coverImage: string | null;
  entireStayImages: string[];
  rooms: Room[];
  selectedFeatures: string[];
  firstUserDiscount: boolean;
  festivalOffers: boolean;
  weeklyOffers: boolean;
  specialOffers: boolean;
  discountPercentage: string;
  finalPrice: string;
  brandName: string;
  companyName: string;
  businessEmail: string;
  businessPhone: string;
  businessAddress: string;
  locality: string;
  state: string;
  city: string;
  businessPincode: string;
  firstName: string;
  lastName: string;
  personalState: string;
  personalCity: string;
  personalPincode: string;
  dateOfBirth: string;
  idProof: string;
  idProofImage: string | null;
  hasCategoriesForSelection: boolean;
}

export interface ValidateStaysStepResult {
  /** Step-level errors keyed by form field. */
  errors: Record<string, string>;
  /** When set, a toast.error should fire and the step should not advance. */
  toastError?: string;
}

/**
 * Returns the validation errors for the current stay-onboarding step. The
 * caller is responsible for surfacing them (setErrors + toast) and only
 * advancing the step when both `errors` is empty and `toastError` is unset.
 */
export function validateStaysStep(input: ValidateStaysStepInput): ValidateStaysStepResult {
  const {
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
    personalState,
    personalCity,
    personalPincode,
    dateOfBirth,
    idProof,
    idProofImage,
    hasCategoriesForSelection,
  } = input;
  const newErrors: Record<string, string> = {};

  if (currentStep === 0) {
    if (!selectedProperties || selectedProperties.length === 0) {
      return { errors: {}, toastError: "Please select at least one property type" };
    }
  } else if (currentStep === 1) {
    if (
      hasCategoriesForSelection &&
      (!selectedCategories || selectedCategories.length === 0)
    ) {
      return { errors: {}, toastError: "Please select at least one category" };
    }
  } else if (currentStep === 2) {
    if (stayType === "entire") {
      if (guestCapacity <= 0) newErrors.guestCapacity = "Guest capacity must be at least 1";
      if (numberOfRooms <= 0) newErrors.numberOfRooms = "Add at least 1 room";
      if (numberOfBeds <= 0) newErrors.numberOfBeds = "Add at least 1 bed";
      if (numberOfBathrooms <= 0) newErrors.numberOfBathrooms = "Add at least 1 bathroom";
      if (!regularPrice || Number(regularPrice) <= 0)
        newErrors.regularPrice = "Enter a valid price";
      const hasValidRule = entireStayRules.some((rule) => rule.trim() !== "");
      if (!hasValidRule) newErrors.entireStayRules = "Add at least one rule";
      if (!coverImage) newErrors.coverImage = "Cover photo is required";
      if (entireStayImages.length < 5)
        newErrors.entireStayImages = `Upload at least 5 images (${entireStayImages.length}/5)`;
    } else if (stayType === "individual") {
      if (!coverImage) newErrors.coverImage = "Cover photo is required";
      if (!rooms || rooms.length === 0) {
        newErrors.rooms = "Add at least one room";
      } else {
        for (let i = 0; i < rooms.length; i++) {
          const room = rooms[i];
          const validRoomImages = (room.photos || []).filter((p) => p);
          if (!room.name || !room.name.trim())
            newErrors[`room_${i}_name`] = "Room name is required";
          if (!room.description || !room.description.trim())
            newErrors[`room_${i}_description`] = "Description is required";
          if (validRoomImages.length < 5)
            newErrors[`room_${i}_photos`] =
              `Upload at least 5 images (${validRoomImages.length}/5)`;
          if (room.guestCapacity <= 0)
            newErrors[`room_${i}_guestCapacity`] = "Guest capacity must be at least 1";
          if (room.beds <= 0) newErrors[`room_${i}_beds`] = "Add at least 1 bed";
          if (room.bathrooms <= 0)
            newErrors[`room_${i}_bathrooms`] = "Add at least 1 bathroom";
          if (!room.price || room.price <= 0)
            newErrors[`room_${i}_price`] = "Enter a valid price";
        }
      }
    }
  } else if (currentStep === 3) {
    if (!selectedFeatures || selectedFeatures.length === 0) {
      newErrors.features = "Please select at least one feature";
    }
  } else if (currentStep === 4) {
    if (firstUserDiscount || festivalOffers || weeklyOffers || specialOffers) {
      if (!discountPercentage) newErrors.discountPercentage = "Discount Percentage is required";
      if (!finalPrice) newErrors.finalPrice = "Final Price is required";
    }
  } else if (currentStep === 5) {
    if (!brandName?.trim()) newErrors.brandName = "Brand name is required";
    if (!companyName?.trim()) newErrors.companyName = "Company name is required";
    if (!businessEmail?.trim()) {
      newErrors.businessEmail = "Business email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(businessEmail)) {
      newErrors.businessEmail = "Please enter a valid email address";
    }
    if (!businessPhone?.trim()) {
      newErrors.businessPhone = "Business phone number is required";
    } else if (!/^\d{10}$/.test(businessPhone)) {
      newErrors.businessPhone = "Please enter a valid 10-digit phone number";
    }
    if (!businessAddress?.trim()) newErrors.businessAddress = "Business address is required";
    if (!locality?.trim()) newErrors.locality = "Business locality is required";
    if (!state?.trim()) newErrors.state = "Business state is required";
    if (!city?.trim()) newErrors.city = "Business city is required";
    if (!businessPincode?.trim()) {
      newErrors.businessPincode = "Business pincode is required";
    } else if (!/^\d{6}$/.test(businessPincode.trim())) {
      newErrors.businessPincode = "Enter a valid 6-digit pincode";
    }
  } else if (currentStep === 6) {
    if (!firstName?.trim()) newErrors.firstName = "First name is required";
    if (!lastName?.trim()) newErrors.lastName = "Last name is required";
    if (!personalState?.trim()) newErrors.personalState = "Personal state is required";
    if (!personalCity?.trim()) newErrors.personalCity = "Personal city is required";
    if (!personalPincode?.trim()) {
      newErrors.personalPincode = "Pincode is required";
    } else if (!/^\d{6}$/.test(personalPincode.trim())) {
      newErrors.personalPincode = "Enter a valid 6-digit pincode";
    }
    if (!dateOfBirth) newErrors.dateOfBirth = "Date of birth is required";
    if (!idProof) newErrors.idProof = "ID proof type is required";
    if (!idProofImage) newErrors.idPhotos = "ID proof photo is required";
  }

  return { errors: newErrors };
}
