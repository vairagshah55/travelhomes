import type { FormData } from "./vehicleConfig";

export interface ValidateVehicleStepResult {
  errors: Record<string, string>;
  /** When set, the caller should fire toast.error and not advance. */
  toastError?: string;
}

/** Loose RTO format: 2 letters, 1-2 digits, 1-3 letters, 1-4 digits. */
const REGISTRATION_RE = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{1,4}$/;

const positive = (value: string) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0;
};

const hasLine = (items: string[] | undefined) => !!items?.some((i) => i.trim());

/**
 * Per-step validator for the vehicle rental onboarding flow. The caller
 * surfaces the errors (setErrors + optional toast) and only advances when
 * `errors` is empty and `toastError` is unset.
 *
 * Step order matches VehicleStepRenderer:
 *   0 Vehicle + Photos · 1 Specs · 2 Capacity | 3 Pricing · 4 Offers |
 *   5 Documents | 6 Business · 7 Personal | 8 Terms
 */
export function validateVehicleStep(
  currentStep: number,
  formData: FormData,
): ValidateVehicleStepResult {
  const newErrors: Record<string, string> = {};

  if (currentStep === 0) {
    // Identity and photos, formerly two steps. No name/description checks:
    // those inputs are gone — the listing name comes from brand + model via
    // deriveVehicleName and the description from the specs, so there is
    // nothing here for a vendor to get wrong. Leaving the old required-checks
    // in would block the step on fields that no longer have inputs.
    if (!formData.vehicleClass) newErrors.vehicleClass = "Select a category — car, van or bus";
    if (!formData.category) newErrors.category = "Select a sub-category";
    if (!formData.brand?.trim()) newErrors.brand = "Brand is required";
    if (!formData.model?.trim()) newErrors.model = "Model is required";
    if (!formData.manufactureYear) newErrors.manufactureYear = "Manufacture year is required";

    const registration = formData.registrationNumber?.trim().toUpperCase().replace(/[\s-]/g, "");
    if (!registration) {
      newErrors.registrationNumber = "Registration number is required";
    } else if (!REGISTRATION_RE.test(registration)) {
      newErrors.registrationNumber = "Enter a valid registration number, e.g. MH12AB1234";
    }

    if (!formData.coverImage || formData.coverImage.length === 0)
      newErrors.coverImage = "A cover photo is required";
    if (formData.photos.length < 5) newErrors.photos = "Please upload at least 5 photos";
  } else if (currentStep === 1) {
    if (!formData.fuelType) newErrors.fuelType = "Fuel type is required";
    if (!formData.transmission) newErrors.transmission = "Transmission is required";
    if (!formData.features || formData.features.length === 0) {
      return { errors: newErrors, toastError: "Please select at least one amenity" };
    }
  } else if (currentStep === 2) {
    if (formData.seatingCapacity < 1) newErrors.seatingCapacity = "At least 1 seat is required";
    // Seat count is not checked against SEAT_HINT_BY_CLASS on purpose — the
    // classes overlap in the real world, so the hint is advisory and shown
    // inline by VehicleCapacityStep rather than enforced here.
    // Still a string[] on the model, but the step now collects exactly one, so
    // the copy no longer tells the vendor to "add" anything.
    if (!hasLine(formData.pickupPoints)) newErrors.pickupPoints = "A parking location is required";
    // No address checks: the address card was removed from this step.
    // The listing's address/city/state/pincode now come from the business
    // address via deriveVehicleLocation, and that IS still validated — on the
    // Business Details step, which is required before submit.
  } else if (currentStep === 3) {
    if (!formData.selfDriveEnabled && !formData.withDriverEnabled) {
      return {
        errors: { pricing: "Choose a rental mode — self-drive or with driver" },
      };
    }

    // The toggle enforces this, but a draft saved before modes became exclusive
    // can still hold both, and it would price two rate cards that can't both
    // apply. Caught here rather than silently switching one off under the
    // vendor — which of the two they meant isn't ours to guess.
    if (formData.selfDriveEnabled && formData.withDriverEnabled) {
      return {
        errors: { pricing: "Pick one rental mode — self-drive or with driver, not both" },
      };
    }

    if (formData.selfDriveEnabled) {
      if (!positive(formData.selfDrivePerDay))
        newErrors.selfDrivePerDay = "A per-day rate is required for self-drive";
      if (!hasLine(formData.selfDriveIncludes))
        newErrors.selfDriveIncludes = "Please add at least one inclusion";
      if (!hasLine(formData.selfDriveExcludes))
        newErrors.selfDriveExcludes = "Please add at least one exclusion";
    }

    if (formData.withDriverEnabled) {
      // Per KILOMETRE — the chauffeur per-day rate was removed from the form.
      if (!positive(formData.withDriverPerKm))
        newErrors.withDriverPerKm = "A per-km rate is required for chauffeur-driven";
      if (!formData.withDriverOneWay && !formData.withDriverTwoWay)
        newErrors.withDriverTrip = "Choose one-way, two-way, or both";
      if (!hasLine(formData.withDriverIncludes))
        newErrors.withDriverIncludes = "Please add at least one inclusion";
      if (!hasLine(formData.withDriverExcludes))
        newErrors.withDriverExcludes = "Please add at least one exclusion";
    }

    // An extra-km charge with no free allowance means every kilometre is billed
    // twice over — once in the day rate, once as "extra". Almost always a
    // mis-fill rather than the vendor's intent.
    if (
      formData.selfDriveEnabled &&
      positive(formData.extraKmCharge) &&
      !positive(formData.freeKmPerDay)
    ) {
      newErrors.freeKmPerDay = "Set a free-km allowance, or clear the extra-km charge";
    }

  } else if (currentStep === 4) {
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
      if (!formData.specialOffersValue) newErrors.specialOffersValue = "Discount value is required";
      if (!formData.specialOffersFinalPrice)
        newErrors.specialOffersFinalPrice = "Final price is required";
    }
  } else if (currentStep === 5) {
    if (!formData.rcPhotos || formData.rcPhotos.length === 0)
      newErrors.rcPhotos = "The registration certificate is required";

    if (!formData.insuranceExpiry) {
      newErrors.insuranceExpiry = "Insurance expiry date is required";
    } else {
      // Compare date-only: a policy expiring today is still valid today, and
      // comparing against `new Date()` would reject it from 00:00 onwards.
      const today = new Date().toISOString().slice(0, 10);
      if (formData.insuranceExpiry < today)
        newErrors.insuranceExpiry = "Insurance has expired — please renew it first";
    }

    if (formData.pucExpiry) {
      const today = new Date().toISOString().slice(0, 10);
      if (formData.pucExpiry < today) newErrors.pucExpiry = "PUC certificate has expired";
    }

    // Driver details are only asked for — and only required — when the vendor
    // enabled the chauffeur-driven rate card.
    if (formData.withDriverEnabled) {
      if (!formData.driverName?.trim()) newErrors.driverName = "Driver name is required";
      if (!formData.driverPhone?.trim() || formData.driverPhone.length !== 10)
        newErrors.driverPhone = "Valid 10-digit driver phone is required";
      if (!formData.driverLicenceNumber?.trim())
        newErrors.driverLicenceNumber = "Driving licence number is required";
      if (!formData.driverLicencePhotos || formData.driverLicencePhotos.length === 0)
        newErrors.driverLicencePhotos = "A photo of the driving licence is required";
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
    if (!formData.businessPhoneNumber?.trim() || formData.businessPhoneNumber.length !== 10) {
      newErrors.businessPhoneNumber = "Valid business phone number is required";
    }
  } else if (currentStep === 7) {
    if (!formData.firstName?.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName?.trim()) newErrors.lastName = "Last name is required";
    if (!formData.personalLocality?.trim()) newErrors.personalLocality = "Country is required";
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
