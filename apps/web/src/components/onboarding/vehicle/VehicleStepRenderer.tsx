import React from "react";
import {
  BusinessDetailsStep,
  PersonalDetailsStep,
  TermsConditionsStep,
  DiscountOffersStep,
} from "@/components/onboarding/shared";
import type { CountryOption, DiscountOffer } from "@/components/onboarding/shared";
// The photo/name/description/rules step is identical across flows apart from
// its labels, so the caravan one is reused with overrides rather than copied.
import DescriptionStep from "@/components/onboarding/caravan/DescriptionStep";
import {
  VehicleClassStep,
  SpecsFeaturesStep,
  VehicleCapacityStep,
  VehiclePricingStep,
  VehicleComplianceStep,
} from "./index";
import type { VehicleListField } from "./VehiclePricingStep";
import type { VehicleDocField } from "./VehicleComplianceStep";
import type { FormData, FuelType, Transmission, VehicleClass } from "./vehicleConfig";

export interface VehicleStepApi {
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
  adjustCapacity: (type: "seating" | "luggage", direction: "increase" | "decrease") => void;
  addPickupPoint: () => void;
  updatePickupPoint: (index: number, value: string) => void;
  removePickupPoint: (index: number) => void;

  // Step 4
  toggleRentalMode: (mode: "selfDrive" | "withDriver") => void;
  setPricingField: (field: string, value: string) => void;
  addListItem: (field: VehicleListField) => void;
  updateListItem: (field: VehicleListField, index: number, value: string) => void;
  removeListItem: (field: VehicleListField, index: number) => void;

  // Step 5
  discountOffers: any;
  handleDiscountToggle: (key: string) => void;
  handleDiscountOfferChange: (key: string, field: keyof DiscountOffer, value: string) => void;
  discountErrors: Record<string, string>;

  // Step 6
  setComplianceField: (field: string, value: string) => void;
  handleDocUpload: (field: VehicleDocField, files: FileList | null) => void;
  removeDoc: (field: VehicleDocField, index: number) => void;

  // Step 7
  businessErrors: Record<string, string>;
  handleBusinessFieldChange: (field: string, value: string) => void;
  selected: CountryOption | null;
  setSelected: (c: CountryOption | null) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
  countries: CountryOption[];
  mapSrcbusiness: string;

  // Step 8
  handlePersonalFieldChange: (field: string, value: string) => void;
  idProofImage: string | null;
  handleUploadIDProof: (e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadError: string;
}

/**
 * Step dispatcher for the vehicle rental onboarding flow.
 *
 * Ten steps: 0 Details · 1 Class · 2 Specs · 3 Capacity | 4 Pricing · 5 Offers |
 * 6 Documents | 7 Business · 8 Personal | 9 Terms. Keep this order in sync with
 * validateVehicleStep and VEHICLE_PHASES in pages/onboarding/VehicleOnboarding.
 */
export function VehicleStepRenderer({ step, api }: { step: number; api: VehicleStepApi }) {
  const { formData, setFormData, errors, setErrors } = api;

  switch (step) {
    case 0:
      return (
        <DescriptionStep
          nameLabel="Vehicle Name"
          namePlaceholder="e.g. Toyota Innova Crysta — 7 seater"
          kicker="Vehicle Details"
          headerSubtitle="Photos and a clear description are what get a vehicle booked — add the details a traveller needs before they trust you with their trip."
          descriptionHelp="What should a renter know? Mention its condition, how it drives, and the trips it suits best."
          descriptionPlaceholder="Describe the vehicle's condition, comfort, and what kind of trips it's best for…"
          coverPhotoNoun="vehicle"
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
        <VehicleClassStep
          vehicleClass={formData.vehicleClass}
          category={formData.category}
          brand={formData.brand}
          model={formData.model}
          manufactureYear={formData.manufactureYear}
          registrationNumber={formData.registrationNumber}
          dynamicCategories={api.dynamicCategories}
          categoriesLoading={api.categoriesLoading}
          errors={errors}
          onVehicleClassChange={(v: VehicleClass) =>
            setFormData((prev) => ({
              ...prev,
              vehicleClass: v,
              // Category lists are class-scoped in CMS; a category picked for
              // "car" is rarely valid for "bus", so switching class clears it
              // rather than silently submitting a mismatched pair.
              category: prev.vehicleClass && prev.vehicleClass !== v ? null : prev.category,
            }))
          }
          onCategoryChange={(v) => setFormData((prev) => ({ ...prev, category: v }))}
          onBrandChange={(v) => setFormData((prev) => ({ ...prev, brand: v }))}
          onModelChange={(v) => setFormData((prev) => ({ ...prev, model: v }))}
          onManufactureYearChange={(v) => setFormData((prev) => ({ ...prev, manufactureYear: v }))}
          onRegistrationNumberChange={(v) =>
            setFormData((prev) => ({ ...prev, registrationNumber: v }))
          }
          clearError={api.clearError}
        />
      );

    case 2:
      return (
        <SpecsFeaturesStep
          fuelType={formData.fuelType}
          transmission={formData.transmission}
          airConditioned={formData.airConditioned}
          features={formData.features}
          dynamicFeatures={api.dynamicFeatures}
          featuresLoading={api.featuresLoading}
          customFeatures={api.customFeatures}
          showCustomFeaturesInput={api.showCustomFeaturesInput}
          customFeatureInput={api.customFeatureInput}
          errors={errors}
          onFuelTypeChange={(v: FuelType) => setFormData((prev) => ({ ...prev, fuelType: v }))}
          onTransmissionChange={(v: Transmission) =>
            setFormData((prev) => ({ ...prev, transmission: v }))
          }
          onAirConditionedChange={(v) => setFormData((prev) => ({ ...prev, airConditioned: v }))}
          onToggleFeature={api.toggleFeature}
          onRemoveCustomFeature={api.handleRemoveCustomFeature}
          onToggleCustomInput={() => api.setShowCustomFeaturesInput(!api.showCustomFeaturesInput)}
          onCustomFeatureInputChange={api.setCustomFeatureInput}
          onAddCustomFeature={api.handleAddCustomFeature}
          clearError={api.clearError}
        />
      );

    case 3:
      return (
        <VehicleCapacityStep
          vehicleClass={formData.vehicleClass}
          seatingCapacity={formData.seatingCapacity}
          luggageCapacity={formData.luggageCapacity}
          address={formData.address}
          locality={formData.locality}
          state={formData.state}
          city={formData.city}
          pincode={formData.pincode}
          pickupPoints={formData.pickupPoints}
          locationData={api.locationData}
          mapSrc={api.mapSrc}
          errors={errors}
          onAdjustCapacity={api.adjustCapacity}
          onAddressChange={(v) => setFormData((prev) => ({ ...prev, address: v }))}
          onLocalityChange={(v) =>
            setFormData((prev) => ({ ...prev, locality: v, state: "", city: "" }))
          }
          onStateChange={(v) => setFormData((prev) => ({ ...prev, state: v, city: "" }))}
          onCityChange={(v) => setFormData((prev) => ({ ...prev, city: v }))}
          onPincodeChange={(v) => setFormData((prev) => ({ ...prev, pincode: v }))}
          onAddPickupPoint={api.addPickupPoint}
          onUpdatePickupPoint={api.updatePickupPoint}
          onRemovePickupPoint={api.removePickupPoint}
          clearError={api.clearError}
        />
      );

    case 4:
      return (
        <VehiclePricingStep
          selfDriveEnabled={formData.selfDriveEnabled}
          selfDrivePerDay={formData.selfDrivePerDay}
          selfDrivePerKm={formData.selfDrivePerKm}
          freeKmPerDay={formData.freeKmPerDay}
          extraKmCharge={formData.extraKmCharge}
          securityDeposit={formData.securityDeposit}
          minRentalHours={formData.minRentalHours}
          selfDriveIncludes={formData.selfDriveIncludes}
          selfDriveExcludes={formData.selfDriveExcludes}
          withDriverEnabled={formData.withDriverEnabled}
          withDriverPerDay={formData.withDriverPerDay}
          withDriverPerKm={formData.withDriverPerKm}
          driverAllowancePerDay={formData.driverAllowancePerDay}
          nightChargeAfter={formData.nightChargeAfter}
          outstationPerKm={formData.outstationPerKm}
          withDriverIncludes={formData.withDriverIncludes}
          withDriverExcludes={formData.withDriverExcludes}
          fuelPolicy={formData.fuelPolicy}
          tollsAndParking={formData.tollsAndParking}
          cancellationWindowHours={formData.cancellationWindowHours}
          errors={errors}
          onToggleMode={api.toggleRentalMode}
          onFieldChange={api.setPricingField}
          onAddListItem={api.addListItem}
          onUpdateListItem={api.updateListItem}
          onRemoveListItem={api.removeListItem}
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
        <VehicleComplianceStep
          rcPhotos={formData.rcPhotos}
          insuranceExpiry={formData.insuranceExpiry}
          pucExpiry={formData.pucExpiry}
          withDriverEnabled={formData.withDriverEnabled}
          driverName={formData.driverName}
          driverPhone={formData.driverPhone}
          driverLicenceNumber={formData.driverLicenceNumber}
          driverLicencePhotos={formData.driverLicencePhotos}
          errors={errors}
          onFieldChange={api.setComplianceField}
          onDocUpload={api.handleDocUpload}
          onRemoveDoc={api.removeDoc}
          clearError={api.clearError}
        />
      );

    case 7:
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

    case 8:
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

    case 9:
      return (
        <TermsConditionsStep
          termsAccepted={formData.termsAccepted}
          onTermsChange={(checked) => setFormData((prev) => ({ ...prev, termsAccepted: checked }))}
        />
      );

    default:
      return null;
  }
}

export default VehicleStepRenderer;
