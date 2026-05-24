import React from "react";
import {
  BusinessDetailsStep,
  PersonalDetailsStep,
  TermsConditionsStep,
  DiscountOffersStep,
} from "@/components/onboarding/shared";
import type { CountryOption } from "@/components/onboarding/shared";
import {
  TypeStep,
  FeaturesStep,
  DetailsStep,
  PricingStep,
  InclusionExclusionStep,
} from "@/components/onboarding/activity";

interface ActivityType {
  id: string;
  name: string;
  icon: string;
}

export interface ActivityStepApi {
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  errors: Record<string, string>;
  setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  updateFormData: (field: string, value: any) => void;
  clearError: (field: string) => void;

  // Step 0
  activityTypes: ActivityType[];
  toggleActivityType: (id: string) => void;

  // Step 1
  activityFeatures: any[];
  activityFeatureMap: Record<string, string[]>;
  adminFeatures: any[];
  customFeatures: any[];
  showCustomFeaturesInput: boolean;
  setShowCustomFeaturesInput: (v: boolean) => void;
  customFeatureInput: string;
  setCustomFeatureInput: (v: string) => void;
  toggleFeature: (id: string) => void;
  handleRemoveCustomFeature: (idx: number) => void;
  handleAddCustomFeature: (feature: string) => void;

  // Step 2
  ruleInput: string;
  setRuleInput: (v: string) => void;
  photoCarouselRef: React.RefObject<HTMLDivElement>;
  handleCoverImageUpload: (...args: any[]) => void;
  handleFileUpload: (field: "photos" | "idPhotos", files: FileList | null) => void;
  removeFile: (field: "coverImage" | "idPhotos" | "photos", index?: number) => void;
  handleAddRule: (value: string) => void;
  handleRemoveRule: (index: number) => void;
  renderImageSrc: (fileOrUrl: any) => string;

  // Step 3
  locationData: any;

  // Step 4
  addListItem: (
    field: "priceIncludes" | "priceExcludes" | "expectations",
    value: string,
  ) => void;
  removeListItem: (
    field: "priceIncludes" | "priceExcludes" | "expectations",
    index: number,
  ) => void;

  // Step 5
  discountOffers: any;
  handleDiscountToggle: (key: "firstUser" | "festival" | "weekly" | "special") => void;
  handleDiscountOfferChange: (...args: any[]) => void;

  // Step 6
  handleBusinessChange: (field: string, value: string) => void;
  selectedCountry: CountryOption | null;
  setSelectedCountry: (c: CountryOption | null) => void;
  countryDialogOpen: boolean;
  setCountryDialogOpen: (v: boolean) => void;
  countries: CountryOption[];
  handleBusinessStateChange: (val: string) => void;
  handleBusinessCityChange: (val: string) => void;
  mapSrcbusiness: string;

  // Step 7
  handlePersonalChange: (field: string, value: string) => void;
  handlePersonalStateChange: (val: string) => void;
  handlePersonalCityChange: (val: string) => void;
  idProofImage: string | null;
  handleIdProofUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Step dispatcher for the activity onboarding flow. Mirrors the pattern used
 * by Stays and Caravan — bundles all state + setters + handlers in one `api`
 * object so the page render is a one-liner.
 */
export function ActivityStepRenderer({ step, api }: { step: number; api: ActivityStepApi }) {
  const { formData, setFormData, errors, setErrors } = api;

  if (step === 0) {
    return (
      <TypeStep
        selectedActivities={formData.selectedActivities}
        activityTypes={api.activityTypes}
        onToggle={api.toggleActivityType}
      />
    );
  }
  if (step === 1) {
    return (
      <FeaturesStep
        selectedActivities={formData.selectedActivities}
        selectedFeatures={formData.features}
        activityFeatures={api.activityFeatures}
        activityFeatureMap={api.activityFeatureMap}
        adminFeatures={api.adminFeatures}
        customFeatures={api.customFeatures}
        showCustomFeaturesInput={api.showCustomFeaturesInput}
        customFeatureInput={api.customFeatureInput}
        onToggleFeature={api.toggleFeature}
        onRemoveCustomFeature={api.handleRemoveCustomFeature}
        onSetShowCustomFeaturesInput={api.setShowCustomFeaturesInput}
        onSetCustomFeatureInput={api.setCustomFeatureInput}
        onAddCustomFeature={api.handleAddCustomFeature}
      />
    );
  }
  if (step === 2) {
    return (
      <DetailsStep
        activityName={formData.activityName}
        description={formData.description}
        coverImage={formData.coverImage}
        photos={formData.photos}
        rulesAndRegulations={formData.rulesAndRegulations}
        ruleInput={api.ruleInput}
        errors={errors}
        photoCarouselRef={api.photoCarouselRef}
        onUpdateFormData={api.updateFormData}
        onCoverImageUpload={api.handleCoverImageUpload}
        onPhotoUpload={(files) => api.handleFileUpload("photos", files)}
        onRemoveFile={api.removeFile}
        onSetRuleInput={api.setRuleInput}
        onAddRule={api.handleAddRule}
        onRemoveRule={api.handleRemoveRule}
        renderImageSrc={api.renderImageSrc}
        setErrors={setErrors}
      />
    );
  }
  if (step === 3) {
    return (
      <PricingStep
        regularPrice={formData.regularPrice}
        personCapacity={formData.personCapacity}
        timeDuration={formData.timeDuration}
        address={formData.address || ""}
        locality={formData.locality}
        state={formData.state}
        city={formData.city}
        pincode={formData.pincode}
        errors={errors}
        locationData={api.locationData}
        onUpdateFormData={api.updateFormData}
        setFormData={setFormData}
        clearError={api.clearError}
      />
    );
  }
  if (step === 4) {
    return (
      <InclusionExclusionStep
        priceIncludes={formData.priceIncludes}
        priceExcludes={formData.priceExcludes}
        expectations={formData.expectations}
        onAddListItem={api.addListItem}
        onRemoveListItem={api.removeListItem}
      />
    );
  }
  if (step === 5) {
    return (
      <DiscountOffersStep
        offers={api.discountOffers}
        onToggle={api.handleDiscountToggle}
        onOfferChange={api.handleDiscountOfferChange}
        errors={errors}
        weeklyLabel="Weekly or Monthly Offers"
      />
    );
  }
  if (step === 6) {
    return (
      <BusinessDetailsStep
        values={{
          brandName: formData.brandName,
          companyName: formData.legalCompanyName,
          gstNumber: formData.gstNumber,
          businessEmail: formData.businessEmail,
          businessPhone: formData.businessPhone,
          // ActivityOnboarding doesn't carry a discrete businessAddress field —
          // the locality/city/state are kept separately. Pass an empty string
          // so the shared step renders without crashing.
          businessAddress: "",
          pincode: formData.businessPincode,
        }}
        errors={errors}
        onChange={api.handleBusinessChange}
        selectedCountry={api.selectedCountry}
        onCountrySelect={api.setSelectedCountry}
        countryDialogOpen={api.countryDialogOpen}
        setCountryDialogOpen={api.setCountryDialogOpen}
        countries={api.countries}
        locationData={api.locationData}
        selectedState={formData.businessState}
        selectedCity={formData.businessCity}
        countryName={formData.businessLocality}
        onStateChange={api.handleBusinessStateChange}
        onCityChange={api.handleBusinessCityChange}
        mapSrc={api.mapSrcbusiness}
      />
    );
  }
  if (step === 7) {
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
        onChange={api.handlePersonalChange}
        locationData={api.locationData}
        selectedState={formData.personalState}
        selectedCity={formData.personalCity}
        countryName={formData.personalLocality}
        onStateChange={api.handlePersonalStateChange}
        onCityChange={api.handlePersonalCityChange}
        idProofImage={api.idProofImage}
        onIdProofUpload={api.handleIdProofUpload}
        uploadError={errors.idPhotos}
      />
    );
  }
  if (step === 8) {
    return (
      <TermsConditionsStep
        termsAccepted={formData.termsAccepted}
        onTermsChange={(checked) => api.updateFormData("termsAccepted", checked)}
      />
    );
  }
  return null;
}

export default ActivityStepRenderer;
