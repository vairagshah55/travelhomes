import { toast } from "sonner";
import { submitOnboardingData } from "@/lib/api";

interface ActivityFormData {
  selectedActivities: string[];
  activityName: string;
  regularPrice: string | number;
  personCapacity: number;
  finalPrice: string | number;
  coverImage: File | string | null;
  photos: (File | string)[];
  idPhotos: (File | string)[];
  firstName: string;
  lastName: string;
  businessPhone: string;
  personalLocality: string;
  personalPincode: string;
  personalCity: string;
  personalState: string;
  dateOfBirth: string;
  maritalStatus: string;
  idProof: string;
  brandName: string;
  legalCompanyName: string;
  gstNumber: string;
  businessEmail: string;
  businessLocality: string;
  businessPincode: string;
  businessCity: string;
  businessState: string;
  [key: string]: any;
}

export interface SubmitActivityCallbacks {
  setIsLoading: (v: boolean) => void;
  updateUserDetails: (data: any) => Promise<unknown>;
  updateUserType: (t: "user" | "vendor") => unknown;
}

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

/**
 * Validates activity form data, converts File uploads to data URLs, submits
 * the onboarding payload, and mirrors business/personal details onto the
 * user account. Returns the API result on success; throws on validation or
 * API failure so the caller can decide whether to navigate.
 */
export async function submitActivityOnboarding(
  formData: ActivityFormData,
  cb: SubmitActivityCallbacks,
) {
  try {
    cb.setIsLoading(true);

    if (!formData.activityName || !formData.activityName.trim()) {
      throw new Error("Activity name is required");
    }
    if (!formData.selectedActivities || formData.selectedActivities.length === 0) {
      throw new Error("Please select at least one activity type");
    }
    const regPrice = Number(formData.regularPrice);
    if (!formData.regularPrice || isNaN(regPrice) || regPrice <= 0) {
      throw new Error("Please enter a valid price");
    }

    const coverImageData = formData.coverImage
      ? formData.coverImage instanceof File
        ? await fileToDataUrl(formData.coverImage)
        : formData.coverImage
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

    await cb.updateUserDetails({
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
      },
    });

    cb.updateUserType("vendor");
    toast.success("Activity onboarding saved successfully!");
    return result;
  } catch (e: any) {
    toast.error(e?.message || "Failed to save activity onboarding");
    throw e;
  } finally {
    cb.setIsLoading(false);
  }
}
