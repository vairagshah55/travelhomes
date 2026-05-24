export interface ValidateActivityStepResult {
  errors: Record<string, string>;
  /** When set, the caller should fire toast.error and not advance. */
  toastError?: string;
}

/**
 * Per-step validator for the activity onboarding flow. The caller is
 * responsible for surfacing the errors (setErrors + optional toast).
 * Step 8 (T&C) only emits a toastError; submission is the caller's job.
 */
export function validateActivityStep(
  currentStep: number,
  formData: any,
): ValidateActivityStepResult {
  const newErrors: Record<string, string> = {};

  if (currentStep === 0) {
    if (!formData.selectedActivities || formData.selectedActivities.length === 0) {
      return { errors: {}, toastError: "Please select at least one activity type" };
    }
  } else if (currentStep === 1) {
    if (!formData.features || formData.features.length === 0) {
      return { errors: {}, toastError: "Please select at least one feature" };
    }
  } else if (currentStep === 2) {
    if (!formData.activityName?.trim()) newErrors.activityName = "Activity name is required";
    if (!formData.description?.trim()) newErrors.description = "Activity description is required";
    if (!formData.coverImage) newErrors.coverImage = "Cover image is required";
    if (!formData.photos || formData.photos.length < 5)
      newErrors.photos = "At least 5 photos are required";
  } else if (currentStep === 3) {
    const regPrice = Number(formData.regularPrice);
    if (!formData.regularPrice || isNaN(regPrice) || regPrice <= 0) {
      newErrors.regularPrice = "Please enter a valid regular price";
    }
    if (!formData.locality?.trim()) newErrors.locality = "Locality is required";
    if (!formData.state) newErrors.state = "State is required";
    if (!formData.city) newErrors.city = "City is required";
    if (!formData.pincode) newErrors.pincode = "Pincode is required";
  } else if (currentStep === 5) {
    if (formData.firstUserDiscount) {
      if (!formData.discountAmount) newErrors.firstUserValue = "Discount amount is required";
      if (!formData.finalPrice) newErrors.firstUserFinalPrice = "Final price is required";
    }
    if (formData.festivalOffers) {
      if (!formData.festivalDiscountAmount)
        newErrors.festivalValue = "Discount amount is required";
      if (!formData.festivalFinalPrice)
        newErrors.festivalFinalPrice = "Final price is required";
    }
    if (formData.weeklyOffers) {
      if (!formData.weeklyDiscountAmount) newErrors.weeklyValue = "Discount amount is required";
      if (!formData.weeklyFinalPrice) newErrors.weeklyFinalPrice = "Final price is required";
    }
    if (formData.specialOffers) {
      if (!formData.specialDiscountAmount)
        newErrors.specialValue = "Discount amount is required";
      if (!formData.specialFinalPrice) newErrors.specialFinalPrice = "Final price is required";
    }
  } else if (currentStep === 6) {
    if (!formData.brandName?.trim()) newErrors.brandName = "Brand name is required";
    if (!formData.businessLocality?.trim())
      newErrors.businessLocality = "Business locality is required";
    if (!formData.legalCompanyName?.trim())
      newErrors.companyName = "Legal Company name is required";
    if (!formData.businessPhone?.trim()) newErrors.businessPhone = "Business Phone is required";
    if (!formData.businessCity) newErrors.city = "Business City is required";
    if (!formData.businessState) newErrors.state = "Business State is required";
    if (!formData.businessPincode) newErrors.businessPincode = "Business Pincode is required";
  } else if (currentStep === 7) {
    if (!formData.firstName?.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName?.trim()) newErrors.lastName = "Last name is required";
    if (!formData.personalLocality?.trim())
      newErrors.personalLocality = "Personal locality is required";
    if (!formData.personalCity) newErrors.personalCity = "Personal City is required";
    if (!formData.personalState) newErrors.personalState = "Personal State is required";
    if (!formData.personalPincode) {
      newErrors.personalPincode = "Personal Pincode is required";
    } else if (!/^\d{6}$/.test(formData.personalPincode.trim())) {
      newErrors.personalPincode = "Enter a valid 6-digit pincode";
    }
    if (!formData.dateOfBirth) newErrors.dateOfBirth = "Date of birth is required";
    if (!formData.idProof) newErrors.idProof = "ID proof type is required";
    if (!formData.idPhotos || formData.idPhotos.length === 0)
      newErrors.idPhotos = "ID proof photo is required";
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
