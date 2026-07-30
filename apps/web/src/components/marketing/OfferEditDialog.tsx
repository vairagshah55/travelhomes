import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  BRAND_VARS,
  BTN_NEUTRAL,
  BTN_PRIMARY,
  CONTROL,
  CONTROL_ERROR,
  Field,
  StatusBadge,
} from "@/components/shared";
import { cn } from "@/lib/utils";
import type { OfferDTO } from "@/lib/api";

/** Every field is held as a string — inputs are strings; coercion happens once, on save. */
interface FormState {
  name: string;
  description: string;
  regularPrice: string;
  discountPrice: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
}

type Errors = Partial<Record<keyof FormState, string>>;

const BLANK: FormState = {
  name: "",
  description: "",
  regularPrice: "",
  discountPrice: "",
  locality: "",
  city: "",
  state: "",
  pincode: "",
};

const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));

function validate(values: FormState): Errors {
  const errors: Errors = {};
  if (!values.name.trim()) errors.name = "Give this offering a name.";

  const price = Number(values.regularPrice);
  if (!values.regularPrice.trim()) errors.regularPrice = "Price is required.";
  else if (!Number.isFinite(price) || price < 0) errors.regularPrice = "Enter a valid amount.";

  if (values.discountPrice.trim()) {
    const discount = Number(values.discountPrice);
    if (!Number.isFinite(discount) || discount < 0) errors.discountPrice = "Enter a valid amount.";
    else if (Number.isFinite(price) && discount >= price)
      errors.discountPrice = "Must be below the regular price.";
  }

  if (values.pincode.trim() && !/^\d{6}$/.test(values.pincode.trim()))
    errors.pincode = "Six digits.";

  return errors;
}

/**
 * Quick edit for the commercial fields of an offering. Category and the
 * type-specific fields (capacities, inclusions, photos) stay in the full
 * editor — category comes from a server-driven catalogue, and a free-text box
 * here could park an offering on a value no filter matches.
 */
export const OfferEditDialog: React.FC<{
  offer: OfferDTO | null;
  onClose: () => void;
  onSave: (id: string, values: Partial<OfferDTO>) => Promise<void>;
}> = ({ offer, onClose, onSave }) => {
  const navigate = useNavigate();
  const [values, setValues] = useState<FormState>(BLANK);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!offer) return;
    setValues({
      name: str(offer.name),
      description: str(offer.description),
      regularPrice: str(offer.regularPrice),
      discountPrice: str(offer.discountPrice),
      locality: str(offer.locality),
      city: str(offer.city),
      state: str(offer.state),
      pincode: str(offer.pincode),
    });
    setErrors({});
  }, [offer]);

  const set = (key: keyof FormState, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    setErrors((e) => (e[key] ? { ...e, [key]: undefined } : e));
  };

  const handleSave = async () => {
    if (!offer?._id) return;
    const found = validate(values);
    setErrors(found);
    if (Object.values(found).some(Boolean)) return;

    setSaving(true);
    try {
      await onSave(offer._id, {
        name: values.name.trim(),
        description: values.description.trim(),
        regularPrice: Number(values.regularPrice),
        discountPrice: values.discountPrice.trim() ? Number(values.discountPrice) : null,
        locality: values.locality.trim(),
        city: values.city.trim(),
        state: values.state.trim(),
        pincode: values.pincode.trim(),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!offer} onOpenChange={(open) => !open && !saving && onClose()}>
      {/* Radix portals to <body>, outside the page root — BRAND_VARS has to
          ride along or every `brand` class in here resolves navy. */}
      <DialogContent
        style={BRAND_VARS}
        className="sm:max-w-[620px] max-h-[88vh] overflow-y-auto rounded-2xl p-0 gap-0"
      >
        <DialogHeader className="px-5 pt-5 pb-4 border-b border-border/70 text-left">
          <DialogTitle className="text-[15px] font-bold tracking-[-0.01em] pr-8">
            Edit offering
          </DialogTitle>
          <div className="flex flex-wrap items-center gap-2 pt-1.5">
            <StatusBadge status={offer?.status || "pending"} size="sm" />
            {offer?.category && (
              <span className="inline-flex items-center h-[22px] px-2 rounded-md bg-muted text-[11px] font-semibold text-muted-foreground">
                {offer.category}
              </span>
            )}
          </div>
        </DialogHeader>

        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Name" error={errors.name} className="sm:col-span-2">
            <Input
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Riverside camper van"
              className={cn("h-10", CONTROL, errors.name && CONTROL_ERROR)}
            />
          </Field>

          <Field label="Regular price (₹)" error={errors.regularPrice}>
            <Input
              type="number"
              min={0}
              inputMode="numeric"
              value={values.regularPrice}
              onChange={(e) => set("regularPrice", e.target.value)}
              className={cn("h-10 tabular-nums", CONTROL, errors.regularPrice && CONTROL_ERROR)}
            />
          </Field>

          <Field
            label="Discounted price (₹)"
            error={errors.discountPrice}
            hint={values.discountPrice ? undefined : "Optional"}
          >
            <Input
              type="number"
              min={0}
              inputMode="numeric"
              value={values.discountPrice}
              onChange={(e) => set("discountPrice", e.target.value)}
              className={cn("h-10 tabular-nums", CONTROL, errors.discountPrice && CONTROL_ERROR)}
            />
          </Field>

          <Field label="Locality" className="sm:col-span-2">
            <Input
              value={values.locality}
              onChange={(e) => set("locality", e.target.value)}
              className={cn("h-10", CONTROL)}
            />
          </Field>

          <Field label="City">
            <Input
              value={values.city}
              onChange={(e) => set("city", e.target.value)}
              className={cn("h-10", CONTROL)}
            />
          </Field>

          <Field label="State">
            <Input
              value={values.state}
              onChange={(e) => set("state", e.target.value)}
              className={cn("h-10", CONTROL)}
            />
          </Field>

          <Field label="Pincode" error={errors.pincode}>
            <Input
              value={values.pincode}
              onChange={(e) => set("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              placeholder="400001"
              className={cn("h-10 tabular-nums", CONTROL, errors.pincode && CONTROL_ERROR)}
            />
          </Field>

          <Field label="Description" className="sm:col-span-2">
            <Textarea
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="What makes this offering worth booking?"
              className={cn("min-h-[96px] resize-y py-2.5", CONTROL)}
            />
          </Field>
        </div>

        <footer className="flex items-center justify-between gap-3 px-5 py-4 border-t border-border/70 bg-muted/40 dark:bg-white/[0.02]">
          <button
            type="button"
            onClick={() => offer?._id && navigate(`/offering/${offer._id}/edit`)}
            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-brand hover:underline"
          >
            Full editor
            <ExternalLink size={13} strokeWidth={2.3} />
          </button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose} disabled={saving} className={BTN_NEUTRAL}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving} className={BTN_PRIMARY}>
              {saving && <Loader2 size={14} className="animate-spin" />}
              {saving ? "Saving" : "Save changes"}
            </Button>
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
};

export default OfferEditDialog;
