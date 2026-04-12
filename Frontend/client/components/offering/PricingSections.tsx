import React from "react";
import { Field, StyledInput, RulesList } from "./ui";

/* ─── Camper Van Pricing ──────────────────────────────────────────────────── */
export const CamperVanPricing = ({ formData, set, errors, handleArrayChange, addArrayItem, removeArrayItem }: {
  formData: any; set: (f: string, v: any) => void; errors: Record<string, string>;
  handleArrayChange: (f: string, i: number, v: string) => void;
  addArrayItem: (f: string) => void; removeArrayItem: (f: string, i: number) => void;
}) => (
  <>
    <div className="grid grid-cols-2 gap-4">
      <Field label="Per Km Charge" error={errors.perKmCharge}>
        <StyledInput value={formData.perKmCharge} onChange={(v) => set("perKmCharge", v)} placeholder="e.g. 15" type="number" error={!!errors.perKmCharge} />
      </Field>
      <Field label="Per Day Charge">
        <StyledInput value={formData.perDayCharge} onChange={(v) => set("perDayCharge", v)} placeholder="e.g. 3000" type="number" />
      </Field>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <Field label="Seating Capacity">
        <StyledInput value={formData.seatingCapacity} onChange={(v) => set("seatingCapacity", v)} type="number" />
      </Field>
      <Field label="Sleeping Capacity">
        <StyledInput value={formData.sleepingCapacity} onChange={(v) => set("sleepingCapacity", v)} type="number" />
      </Field>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Per Km Includes">
        <RulesList rules={formData.perKmIncludes} onChange={(i, v) => handleArrayChange("perKmIncludes", i, v)} onAdd={() => addArrayItem("perKmIncludes")} onRemove={(i) => removeArrayItem("perKmIncludes", i)} />
      </Field>
      <Field label="Per Km Excludes">
        <RulesList rules={formData.perKmExcludes} onChange={(i, v) => handleArrayChange("perKmExcludes", i, v)} onAdd={() => addArrayItem("perKmExcludes")} onRemove={(i) => removeArrayItem("perKmExcludes", i)} />
      </Field>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Per Day Includes">
        <RulesList rules={formData.perDayIncludes} onChange={(i, v) => handleArrayChange("perDayIncludes", i, v)} onAdd={() => addArrayItem("perDayIncludes")} onRemove={(i) => removeArrayItem("perDayIncludes", i)} />
      </Field>
      <Field label="Per Day Excludes">
        <RulesList rules={formData.perDayExcludes} onChange={(i, v) => handleArrayChange("perDayExcludes", i, v)} onAdd={() => addArrayItem("perDayExcludes")} onRemove={(i) => removeArrayItem("perDayExcludes", i)} />
      </Field>
    </div>
  </>
);

/* ─── Unique Stay Pricing ─────────────────────────────────────────────────── */
export const UniqueStayPricing = ({ formData, set, errors, handleArrayChange, addArrayItem, removeArrayItem }: {
  formData: any; set: (f: string, v: any) => void; errors: Record<string, string>;
  handleArrayChange: (f: string, i: number, v: string) => void;
  addArrayItem: (f: string) => void; removeArrayItem: (f: string, i: number) => void;
}) => (
  <>
    <div className="grid grid-cols-2 gap-4">
      <Field label="Regular Price" required error={errors.regularPrice}>
        <StyledInput value={formData.regularPrice} onChange={(v) => set("regularPrice", v)} placeholder="e.g. 5000" type="number" error={!!errors.regularPrice} />
      </Field>
      <Field label="Guest Capacity">
        <StyledInput value={String(formData.guestCapacity)} onChange={(v) => set("guestCapacity", v)} type="number" />
      </Field>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Price Includes">
        <RulesList rules={formData.priceIncludes} onChange={(i, v) => handleArrayChange("priceIncludes", i, v)} onAdd={() => addArrayItem("priceIncludes")} onRemove={(i) => removeArrayItem("priceIncludes", i)} />
      </Field>
      <Field label="Price Excludes">
        <RulesList rules={formData.priceExcludes} onChange={(i, v) => handleArrayChange("priceExcludes", i, v)} onAdd={() => addArrayItem("priceExcludes")} onRemove={(i) => removeArrayItem("priceExcludes", i)} />
      </Field>
    </div>
  </>
);

/* ─── Activity Pricing ────────────────────────────────────────────────────── */
export const ActivityPricing = ({ formData, set, errors, handleArrayChange, addArrayItem, removeArrayItem }: {
  formData: any; set: (f: string, v: any) => void; errors: Record<string, string>;
  handleArrayChange: (f: string, i: number, v: string) => void;
  addArrayItem: (f: string) => void; removeArrayItem: (f: string, i: number) => void;
}) => (
  <>
    <div className="grid grid-cols-3 gap-4">
      <Field label="Regular Price" required error={errors.regularPrice}>
        <StyledInput value={formData.regularPrice} onChange={(v) => set("regularPrice", v)} placeholder="e.g. 2000" type="number" error={!!errors.regularPrice} />
      </Field>
      <Field label="Person Capacity">
        <StyledInput value={String(formData.personCapacity)} onChange={(v) => set("personCapacity", v)} type="number" />
      </Field>
      <Field label="Duration" required error={errors.timeDuration}>
        <StyledInput value={formData.timeDuration} onChange={(v) => set("timeDuration", v)} placeholder="e.g. 2 Hours" error={!!errors.timeDuration} />
      </Field>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Price Includes">
        <RulesList rules={formData.priceIncludes} onChange={(i, v) => handleArrayChange("priceIncludes", i, v)} onAdd={() => addArrayItem("priceIncludes")} onRemove={(i) => removeArrayItem("priceIncludes", i)} />
      </Field>
      <Field label="Price Excludes">
        <RulesList rules={formData.priceExcludes} onChange={(i, v) => handleArrayChange("priceExcludes", i, v)} onAdd={() => addArrayItem("priceExcludes")} onRemove={(i) => removeArrayItem("priceExcludes", i)} />
      </Field>
    </div>
  </>
);
