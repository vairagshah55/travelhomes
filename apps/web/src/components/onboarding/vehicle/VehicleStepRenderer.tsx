import React from "react";
import {
  BusinessDetailsStep,
  PersonalDetailsStep,
  TermsConditionsStep,
} from "@/components/onboarding/shared";
import type { CountryOption } from "@/components/onboarding/shared";
// The photos step is shared with caravan and activity. Those two also collect a
// name, description and house rules on it; vehicle shows photos only, so it
// switches the other two cards off rather than forking the component.
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
  adjustCapacity: (type: "seating" | "luggage", direction: "increase" | "decrease") => void;
  /**
   * One pickup point, not a list — the Add-point control is gone.
   * `pickupPoints` is still a string[] on the model and the API, so this writes
   * index 0 and clears the array when the field is emptied. Keeping the array
   * shape means nothing downstream (Offer, validation, submit) had to change.
   */
  setPickupPoint: (value: string) => void;

  // Step 4
  toggleRentalMode: (mode: "selfDrive" | "withDriver") => void;
  /** One-way / two-way chauffeur trips — exactly one is required. */
  setTripDirection: (which: "oneWay" | "twoWay") => void;
  setPricingField: (field: string, value: string) => void;
  addListItem: (field: VehicleListField) => void;
  updateListItem: (field: VehicleListField, index: number, value: string) => void;
  removeListItem: (field: VehicleListField, index: number) => void;

  // Step 5

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
 * Eight steps: 0 Vehicle + Photos · 1 Specs · 2 Capacity | 3 Pricing |
 * 4 Documents | 5 Business · 6 Personal | 7 Terms. (Discount Offers was
 * dropped from THIS flow only — caravan, stay and activity still have it.) Keep this order in sync with
 * validateVehicleStep, TOTAL_STEPS and VEHICLE_PHASES in
 * pages/onboarding/VehicleOnboarding. (Was ten: identity and photos merged.)
 */
export function VehicleStepRenderer({ step, api }: { step: number; api: VehicleStepApi }) {
  const { formData, setFormData, errors, setErrors } = api;

  switch (step) {
    case 0:
      /**
       * Vehicle identity AND photos on one page.
       *
       * These were two steps until the Vehicle Name, Description and Rules
       * inputs came out of the photos step, which left it holding a cover
       * image and a gallery and nothing else — too thin to be its own page in
       * a nine-step flow. Brand and model are what the listing name is now
       * derived from (deriveVehicleName), so they belong beside the pictures
       * they name.
       *
       * DescriptionStep renders `embedded`, i.e. its section cards without a
       * StepHeader of its own — VehicleClassStep above already supplies the
       * page's heading.
       */
      return (
        <div className="w-full flex flex-col gap-4">
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
                // Categories are class-scoped (VEHICLE_TAXONOMY); a category
                // picked for "car" is not valid for "bus", so switching class
                // clears it rather than silently submitting a mismatched pair.
                // The model picklist is scoped to the CATEGORY in turn, so it
                // has to go with it — otherwise a Swift stays filed under a bus.
                ...(prev.vehicleClass && prev.vehicleClass !== v
                  ? { category: null, model: "", brand: "" }
                  : { category: prev.category }),
              }))
            }
            onCategoryChange={(v) =>
              setFormData((prev) =>
                prev.category === v ? prev : { ...prev, category: v, model: "", brand: "" },
              )
            }
            onBrandChange={(v) => setFormData((prev) => ({ ...prev, brand: v }))}
            onModelChange={(v) => setFormData((prev) => ({ ...prev, model: v }))}
            onManufactureYearChange={(v) =>
              setFormData((prev) => ({ ...prev, manufactureYear: v }))
            }
            onRegistrationNumberChange={(v) =>
              setFormData((prev) => ({ ...prev, registrationNumber: v }))
            }
            clearError={api.clearError}
          />
          <DescriptionStep
            embedded
            showIdentity={false}
            showRules={false}
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
        </div>
      );

    case 1:
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

    case 2:
      return (
        <VehicleCapacityStep
          vehicleClass={formData.vehicleClass}
          seatingCapacity={formData.seatingCapacity}
          luggageCapacity={formData.luggageCapacity}
          pickupPoints={formData.pickupPoints}
          errors={errors}
          onAdjustCapacity={api.adjustCapacity}
          onPickupPointChange={api.setPickupPoint}
          clearError={api.clearError}
        />
      );

    case 3:
      return (
        <VehiclePricingStep
          selfDriveEnabled={formData.selfDriveEnabled}
          selfDrivePerDay={formData.selfDrivePerDay}
          freeKmPerDay={formData.freeKmPerDay}
          extraKmCharge={formData.extraKmCharge}
          minRentalHours={formData.minRentalHours}
          selfDriveIncludes={formData.selfDriveIncludes}
          selfDriveExcludes={formData.selfDriveExcludes}
          withDriverEnabled={formData.withDriverEnabled}
          withDriverPerKm={formData.withDriverPerKm}
          driverAllowancePerDay={formData.driverAllowancePerDay}
          withDriverOneWay={formData.withDriverOneWay}
          withDriverTwoWay={formData.withDriverTwoWay}
          onSelectTripDirection={api.setTripDirection}
          withDriverIncludes={formData.withDriverIncludes}
          withDriverExcludes={formData.withDriverExcludes}
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

    case 4:
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

    case 5:
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

    case 6:
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

    case 7:
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
