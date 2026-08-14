import React from "react";
import {
  BusinessDetailsStep,
  PersonalDetailsStep,
  TermsConditionsStep,
  DiscountOffersStep,
} from "@/components/onboarding/shared";
import type { CountryOption, DiscountOffer } from "@/components/onboarding/shared";
import {
  DescriptionStep,
  CategoryStep,
  FeaturesStep,
  CapacityAddressStep,
  PricingStep,
} from "@/components/onboarding/caravan";
import type { FormData } from "./caravanConfig";

export interface CaravanStepApi {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  sliderRef: React.RefObject<any>;

  // Step 0 handlers
  addRule: () => void;
  removeRule: (index: number) => void;
  updateRule: (index: number, value: string) => void;
  handleFileUpload: (field: "photos" | "idPhotos", files: FileList | null) => void;
  handleCoverFileUpload: (field: "coverImage", files: FileList | null) => void;
  removeFile: (field: "photos" | "idPhotos", index: number) => void;
  removeCoverFile: (field: "coverImage", index: number) => void;
  clearError: (field: string) => void;

  // Step 1
  dynamicCategories: any[];
  categoriesLoading?: boolean;

  // Step 2
  dynamicFeatures: any[];
  featuresLoading?: boolean;
  customFeatures: { name: string; icon: any }[];
  showCustomFeaturesInput: boolean;
  setShowCustomFeaturesInput: (v: boolean) => void;
  customFeatureInput: string;
  setCustomFeatureInput: (v: string) => void;
  toggleFeature: (feature: string) => void;
  handleRemoveCustomFeature: (idx: number) => void;
  handleAddCustomFeature: () => void;

  // Step 3
  locationData: any;
  mapSrc: string;
  adjustCapacity: (...args: any[]) => void;

  // Step 4
  addPriceItem: (...args: any[]) => void;
  updatePriceItem: (...args: any[]) => void;
  removePriceItem: (...args: any[]) => void;

  // Step 5
  discountOffers: any;
  handleDiscountToggle: (key: string) => void;
  handleDiscountOfferChange: (key: string, field: keyof DiscountOffer, value: string) => void;
  discountErrors: Record<string, string>;

  // Step 6
  businessErrors: Record<string, string>;
  handleBusinessFieldChange: (field: string, value: string) => void;
  selected: CountryOption | null;
  setSelected: (c: CountryOption | null) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
  countries: CountryOption[];
  mapSrcbusiness: string;

  // Step 7
  handlePersonalFieldChange: (field: string, value: string) => void;
  idProofImage: string | null;
  handleUploadIDProof: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadError: string;
}

/**
 * Step dispatcher for the caravan onboarding flow. Inline lambdas that wrap
 * `setFormData((prev) => ({ ...prev, x }))` for step components stay here
 * — keeping them out of the page file.
 */
export function CaravanStepRenderer({ step, api }: { step: number; api: CaravanStepApi }) {
  const { formData, setFormData, errors, setErrors } = api;

  switch (step) {
    case 0:
      return (
        <DescriptionStep
          name={formData.name}
          description={formData.description}
          rules={formData.rules}
          photos={formData.photos}
          coverImage={formData.coverImage}
          errors={errors}
          sliderRef={api.sliderRef}
          onNameChange={(v) => setFormData((prev) => ({ ...prev, name: v }))}
          onDescriptionChange={(v) => setFormData((prev) => ({ ...prev, description: v }))}
          onAddRule={api.addRule}
          onRemoveRule={api.removeRule}
          onUpdateRule={api.updateRule}
          onPhotoUpload={(files) => api.handleFileUpload("photos", files)}
          onCoverUpload={(files) => api.handleCoverFileUpload("coverImage", files)}
          onRemovePhoto={(i) => api.removeFile("photos", i)}
          onRemoveCover={(i) => api.removeCoverFile("coverImage", i)}
          clearError={api.clearError}
        />
      );
    case 1:
      return (
        <CategoryStep
          category={formData.category}
          dynamicCategories={api.dynamicCategories}
          categoriesLoading={api.categoriesLoading}
          onSelect={(name) => setFormData((prev) => ({ ...prev, category: name }))}
        />
      );
    case 2:
      return (
        <FeaturesStep
          features={formData.features}
          dynamicFeatures={api.dynamicFeatures}
          featuresLoading={api.featuresLoading}
          customFeatures={api.customFeatures}
          showCustomFeaturesInput={api.showCustomFeaturesInput}
          customFeatureInput={api.customFeatureInput}
          onToggleFeature={api.toggleFeature}
          onRemoveCustomFeature={api.handleRemoveCustomFeature}
          onToggleCustomInput={() => api.setShowCustomFeaturesInput(!api.showCustomFeaturesInput)}
          onCustomFeatureInputChange={api.setCustomFeatureInput}
          onAddCustomFeature={api.handleAddCustomFeature}
        />
      );
    case 3:
      return (
        <CapacityAddressStep
          seatingCapacity={formData.seatingCapacity}
          sleepingCapacity={formData.sleepingCapacity}
          address={formData.address}
          locality={formData.locality}
          state={formData.state}
          city={formData.city}
          pincode={formData.pincode}
          locationData={api.locationData}
          mapSrc={api.mapSrc}
          errors={errors}
          onAdjustCapacity={api.adjustCapacity}
          onAddressChange={(v) => setFormData((prev) => ({ ...prev, address: v }))}
          onLocalityChange={(v) =>
            setFormData((prev) => ({ ...prev, locality: v, state: "", city: "" }))
          }
          onStateChange={(v) =>
            setFormData((prev) => ({ ...prev, state: v, city: "" }))
          }
          onCityChange={(v) => setFormData((prev) => ({ ...prev, city: v }))}
          onPincodeChange={(v) => setFormData((prev) => ({ ...prev, pincode: v }))}
          clearError={api.clearError}
        />
      );
    case 4:
      return (
        <PricingStep
          perKmCharge={formData.perKmCharge}
          perDayCharge={formData.perDayCharge}
          perKmIncludes={formData.perKmIncludes}
          perKmExcludes={formData.perKmExcludes}
          perDayIncludes={formData.perDayIncludes}
          perDayExcludes={formData.perDayExcludes}
          errors={errors}
          onPerKmChargeChange={(v) => setFormData((prev) => ({ ...prev, perKmCharge: v }))}
          onPerDayChargeChange={(v) => setFormData((prev) => ({ ...prev, perDayCharge: v }))}
          onAddPriceItem={api.addPriceItem}
          onUpdatePriceItem={api.updatePriceItem}
          onRemovePriceItem={api.removePriceItem}
          clearError={api.clearError}
        />
      );
    case 5:
      return (
        <DiscountOffersStep
          offers={api.discountOffers}
          onToggle={api.handleDiscountToggle}
          onOfferChange={api.handleDiscountOfferChange}
          errors={api.discountErrors}
          weeklyLabel="Weekly-Monthly Offers"
        />
      );
    case 6:
      return (
        <BusinessDetailsStep
          values={{
            brandName: formData.brandName,
            companyName: formData.legalCompanyName,
            gstNumber: formData.gstNumber,
            businessEmail: formData.businessEmailId,
            businessPhone: formData.businessPhoneNumber,
            businessAddress: formData.businessAddress,
            pincode: formData.businessPincode,
          }}
          errors={api.businessErrors}
          onChange={api.handleBusinessFieldChange}
          selectedCountry={api.selected}
          onCountrySelect={api.setSelected}
          countryDialogOpen={api.open}
          setCountryDialogOpen={api.setOpen}
          countries={api.countries}
          locationData={api.locationData}
          selectedState={formData.businessState}
          selectedCity={formData.businessCity}
          countryName={formData.businessLocality}
          onStateChange={(val) => {
            setFormData((prev) => ({ ...prev, businessState: val, businessCity: "" }));
            setErrors((prev) => ({ ...prev, businessState: "", businessCity: "" }));
          }}
          onCityChange={(val) => {
            setFormData((prev) => ({ ...prev, businessCity: val }));
            setErrors((prev) => ({ ...prev, businessCity: "" }));
          }}
          mapSrc={api.mapSrcbusiness}
        />
      );
    case 7:
      return (
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
          onChange={api.handlePersonalFieldChange}
          locationData={api.locationData}
          selectedState={formData.personalState}
          selectedCity={formData.personalCity}
          countryName={formData.personalLocality}
          onStateChange={(val) => {
            setFormData((prev) => ({ ...prev, personalState: val, personalCity: "" }));
            if (errors.personalState) {
              setErrors((prev) => ({ ...prev, personalState: "" }));
            }
          }}
          onCityChange={(val) => {
            setFormData((prev) => ({ ...prev, personalCity: val }));
            if (errors.personalCity) {
              setErrors((prev) => ({ ...prev, personalCity: "" }));
            }
          }}
          idProofImage={api.idProofImage}
          onIdProofUpload={api.handleUploadIDProof}
          uploadError={api.uploadError}
        />
      );
    case 8:
      return (
        <TermsConditionsStep
          termsAccepted={formData.termsAccepted}
          onTermsChange={(checked) =>
            setFormData((prev) => ({ ...prev, termsAccepted: checked }))
          }
        />
      );
    default:
      return null;
  }
}

export default CaravanStepRenderer;
