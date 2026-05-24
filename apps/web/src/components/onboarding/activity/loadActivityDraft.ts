import { getOnboardingData } from "@/lib/api";

export interface LoadActivityDraftOptions {
  setFormData: (updater: (prev: any) => any) => void;
  setStatus: (v: string) => void;
  setRejectionReason: (v: string) => void;
  userDetails: any;
  isExistingVendor: boolean;
}

/**
 * Fetches the user's activity-onboarding draft (if any) and either restores
 * it onto the form, or — when no draft exists and the user isn't a vendor —
 * auto-fills personal + business fields from the saved profile.
 */
export async function loadActivityDraft(opts: LoadActivityDraftOptions): Promise<void> {
  const { setFormData, setStatus, setRejectionReason, userDetails, isExistingVendor } = opts;
  try {
    const data = await getOnboardingData();

    if (
      data &&
      data.type === "activity" &&
      data.doc &&
      ["pending", "draft", "rejected"].includes(data.doc.status)
    ) {
      const doc = data.doc;
      setStatus(doc.status);
      setRejectionReason(doc.rejectionReason || "");

      setFormData((prev) => ({
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
        discountType: doc.discountType || "percentage",
        discountAmount: String(doc.discountAmount || ""),
        finalPrice: String(doc.finalPrice || ""),

        festivalOffers: doc.festivalOffers ?? false,
        festivalDiscountType: doc.festivalDiscountType || "percentage",
        festivalDiscountAmount: String(doc.festivalDiscountAmount || ""),
        festivalFinalPrice: String(doc.festivalFinalPrice || ""),

        weeklyOffers: doc.weeklyOffers ?? false,
        weeklyDiscountType: doc.weeklyDiscountType || "percentage",
        weeklyDiscountAmount: String(doc.weeklyDiscountAmount || ""),
        weeklyFinalPrice: String(doc.weeklyFinalPrice || ""),

        specialOffers: doc.specialOffers ?? false,
        specialDiscountType: doc.specialDiscountType || "percentage",
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
      return;
    }

    if (userDetails && !isExistingVendor) {
      setFormData((prev) => ({
        ...prev,
        firstName: userDetails.firstName || "",
        lastName: userDetails.lastName || "",
        personalLocality: userDetails.personalLocality || "India",
        personalPincode: userDetails.personalPincode || "",
        personalCity: userDetails.city || "",
        personalState: userDetails.state || "",
        dateOfBirth: userDetails.dateOfBirth
          ? new Date(userDetails.dateOfBirth).toISOString().split("T")[0]
          : "",
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
  } catch {
    /* ignore */
  }
}
