import { toast } from "sonner";
import { submitOnboardingData } from "@/lib/api";
import { onboardingService } from "@/lib/onboardingService";
import { compressImageToDataUrl } from "@/lib/imageCompression";
import type { FormData } from "./caravanConfig";

export interface SubmitCaravanCallbacks {
  setIsLoading: (v: boolean) => void;
  updateUserDetails: (data: any) => Promise<unknown>;
  updateUserType: (t: "user" | "vendor") => unknown;
  navigate: (to: string) => void;
  formStorageKey: string;
}

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

/**
 * Validates caravan form data, converts any File uploads to data URLs, posts
 * the onboarding payload to the API, then mirrors business/personal details
 * onto the user account. On success: persists the offer id and navigates to
 * selfie-verification.
 */
export async function submitCaravanOnboarding(
  formData: FormData,
  cb: SubmitCaravanCallbacks,
): Promise<void> {
  try {
    cb.setIsLoading(true);

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

    const mergedIncludes = [
      ...(formData.perKmIncludes || []),
      ...(formData.perDayIncludes || []),
    ].filter((i) => i && i.trim());

    const mergedExcludes = [
      ...(formData.perKmExcludes || []),
      ...(formData.perDayExcludes || []),
    ].filter((i) => i && i.trim());

    // Gallery/cover photos are downscaled + re-encoded before base64 — there's
    // no client-side size cap on these, so uncompressed phone-camera photos
    // routinely exceed the server's onboarding payload limit. ID photos stay
    // untouched: legibility of the document matters more than payload size,
    // and handleUploadIDProof already caps that one at 5MB.
    const photosData: string[] = await Promise.all(
      ((formData.photos as any[]) || []).map((f: any) =>
        typeof f === "string" ? Promise.resolve(f) : compressImageToDataUrl(f),
      ),
    );
    const photosCoverImage: string[] = await Promise.all(
      ((formData.coverImage as any[]) || []).map((f: any) =>
        typeof f === "string" ? Promise.resolve(f) : compressImageToDataUrl(f),
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
      perKmCharge: pkCharge.toString(),
      priceIncludes: mergedIncludes,
      priceExcludes: mergedExcludes,
      finalPrice: 0,
      seatingCapacity: Number(formData.seatingCapacity),
      sleepingCapacity: Number(formData.sleepingCapacity),
      photos: photosData,
      idPhotos: idPhotosData,
      coverImage: photosCoverImage,
    };

    const result = await submitOnboardingData("caravan", payload);
    if (!result?.id) {
      toast.error("Could not save onboarding. Please try again.");
      return;
    }

    await cb.updateUserDetails({
      firstName: formData.firstName,
      lastName: formData.lastName,
      phoneNumber: formData.businessPhoneNumber,
      country: (formData as any).personalCountry,
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
        address: formData.businessAddress,
        locality: formData.businessLocality,
        state: formData.businessState,
        city: formData.businessCity,
        pincode: formData.businessPincode,
      },
    });

    onboardingService.setCaravanId(result.id);
    sessionStorage.setItem("onboardingId", result.id);
    sessionStorage.setItem("onboardingType", "caravan");
    sessionStorage.setItem("id", result.id);
    sessionStorage.removeItem("caravan_onboarding_step");
    sessionStorage.removeItem(cb.formStorageKey);
    cb.updateUserType("vendor");
    toast.success("Caravan onboarding saved successfully!");
    cb.navigate("/onboarding/selfie-verification");
  } catch (e: any) {
    toast.error(e?.message || "Failed to save caravan onboarding");
  } finally {
    cb.setIsLoading(false);
  }
}
