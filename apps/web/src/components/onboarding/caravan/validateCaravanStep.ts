import type { FormData } from "./caravanConfig";

export interface ValidateCaravanStepResult {
  errors: Record<string, string>;
  /** When set, the caller should fire toast.error and not advance. */
  toastError?: string;
}

/**
 * Per-step validator for the caravan onboarding flow. The caller is responsible
 * for surfacing the errors (setErrors + optional toast) and only advancing the
 * step when both `errors` is empty and `toastError` is unset.
 */
export function validateCaravanStep(
  currentStep: number,
  formData: FormData,
): ValidateCaravanStepResult {
  const newErrors: Record<string, string> = {};

  if (currentStep === 0) {
    if (!formData.name?.trim()) newErrors.name = "Caravan name is required";
    if (!formData.description?.trim()) newErrors.description = "Caravan description is required";
    if (!formData.coverImage || formData.coverImage.length === 0)
      newErrors.coverImage = "A cover photo is required";
    if (formData.photos.length < 5) newErrors.photos = "Please upload at least 5 photos";
  } else if (currentStep === 1) {
    if (!formData.category) {
      return { errors: {}, toastError: "Please select a caravan category" };
    }
  } else if (currentStep === 2) {
    if (!formData.features || formData.features.length === 0) {
      return { errors: {}, toastError: "Please select at least one feature" };
    }
  } else if (currentStep === 3) {
    if (formData.sleepingCapacity < 1)
      newErrors.sleepingCapacity = "At least 1 sleeping spot is required";
    if (!formData.address?.trim()) newErrors.address = "Street address is required";
    if (!formData.state?.trim()) newErrors.state = "State is required";
    if (!formData.city?.trim()) newErrors.city = "City is required";
    if (!formData.pincode?.trim()) {
      newErrors.pincode = "Pincode is required";
    } else if (formData.pincode.length !== 6) {
      newErrors.pincode = "Pincode must be 6 digits";
    }
  } else if (currentStep === 4) {
    const hasPerKm =
      formData.perKmCharge &&
      !isNaN(Number(formData.perKmCharge)) &&
      Number(formData.perKmCharge) > 0;
    const hasPerDay =
      formData.perDayCharge &&
      !isNaN(Number(formData.perDayCharge)) &&
      Number(formData.perDayCharge) > 0;

    if (!hasPerKm && !hasPerDay) {
      return {
        errors: { pricing: "At least one price (Per KM or Per Day) is required" },
      };
    }

    if (hasPerKm) {
      if (!formData.perKmIncludes?.some((i) => i.trim()))
        newErrors.perKmIncludes = "Please add at least one inclusion";
      if (!formData.perKmExcludes?.some((i) => i.trim()))
        newErrors.perKmExcludes = "Please add at least one exclusion";
    }
    if (hasPerDay) {
      if (!formData.perDayIncludes?.some((i) => i.trim()))
        newErrors.perDayIncludes = "Please add at least one inclusion";
      if (!formData.perDayExcludes?.some((i) => i.trim()))
        newErrors.perDayExcludes = "Please add at least one exclusion";
    }
  } else if (currentStep === 5) {
    if (formData.firstUserDiscount) {
      if (!formData.firstUserDiscountValue)
        newErrors.firstUserDiscountValue = "Discount value is required";
      if (!formData.firstUserDiscountFinalPrice)
        newErrors.firstUserDiscountFinalPrice = "Final price is required";
    }
    if (formData.festivalOffers) {
      if (!formData.festivalOffersValue)
        newErrors.festivalOffersValue = "Discount value is required";
      if (!formData.festivalOffersFinalPrice)
        newErrors.festivalOffersFinalPrice = "Final price is required";
    }
    if (formData.weeklyMonthlyOffers) {
      if (!formData.weeklyMonthlyOffersValue)
        newErrors.weeklyMonthlyOffersValue = "Discount value is required";
      if (!formData.weeklyMonthlyOffersFinalPrice)
        newErrors.weeklyMonthlyOffersFinalPrice = "Final price is required";
    }
    if (formData.specialOffers) {
      if (!formData.specialOffersValue)
        newErrors.specialOffersValue = "Discount value is required";
      if (!formData.specialOffersFinalPrice)
        newErrors.specialOffersFinalPrice = "Final price is required";
    }
  } else if (currentStep === 6) {
    if (!formData.brandName?.trim()) newErrors.brandName = "Brand name is required";
    if (!formData.legalCompanyName?.trim())
      newErrors.legalCompanyName = "Legal company name is required";
    if (!formData.businessAddress?.trim())
      newErrors.businessAddress = "Business address is required";
    if (!formData.businessState?.trim()) newErrors.businessState = "State is required";
    if (!formData.businessCity?.trim()) newErrors.businessCity = "City is required";
    if (!formData.businessPincode?.trim()) {
      newErrors.businessPincode = "Pincode is required";
    } else if (formData.businessPincode.length !== 6) {
      newErrors.businessPincode = "Pincode must be 6 digits";
    }
    if (
      !formData.businessPhoneNumber?.trim() ||
      formData.businessPhoneNumber.length !== 10
    ) {
      newErrors.businessPhoneNumber = "Valid business phone number is required";
    }
  } else if (currentStep === 7) {
    if (!formData.firstName?.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName?.trim()) newErrors.lastName = "Last name is required";
    if (!formData.personalLocality?.trim())
      newErrors.personalLocality = "Country is required";
    if (!formData.personalState?.trim()) newErrors.personalState = "State is required";
    if (!formData.personalCity?.trim()) newErrors.personalCity = "City is required";
    if (!formData.personalPincode?.trim()) {
      newErrors.personalPincode = "Pincode is required";
    } else if (!/^\d{6}$/.test(formData.personalPincode.trim())) {
      newErrors.personalPincode = "Enter a valid 6-digit pincode";
    }
    if (!formData.dateOfBirth) newErrors.dateOfBirth = "Date of Birth is required";
    if (!formData.idProof) newErrors.idProof = "ID Proof type is required";
    if (!formData.idPhotos || formData.idPhotos.length === 0)
      newErrors.idPhotos = "ID Proof photo is required";
  } else if (currentStep === 8) {
    if (!formData.termsAccepted) {
      return {
        errors: {},
        toastError: "You must accept the Terms & Conditions to proceed.",
      };
    }
  }

  return { errors: newErrors };
}
