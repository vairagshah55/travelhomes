import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Save, X, Trash2, ImagePlus, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { type OfferDTO, offersApi } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { SlidePanel } from "@/components/bookings/SlidePanel";
import {
  Field,
  StyledInput,
  StyledTextarea,
  StyledSelect,
  RulesList,
} from "./ui";

const defaultForm: Partial<OfferDTO> = {
  name: "",
  category: "",
  description: "",
  rules: [""],
  features: [],
  seatingCapacity: "",
  sleepingCapacity: "",
  locality: "",
  pincode: "",
  city: "",
  state: "",
  regularPrice: "",
  priceIncludes: [""],
  priceExcludes: [""],
  photos: { coverUrl: "", galleryUrls: [] },
};

export const OfferPanel = ({
  open,
  initial,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  initial?: Partial<OfferDTO> | null;
  onOpenChange: (v: boolean) => void;
  onSaved: (offer: OfferDTO, isEdit: boolean) => void;
}) => {
  const isEdit = !!(initial && initial._id);
  const { token } = useAuth();
  const [form, setForm] = useState<Partial<OfferDTO>>(defaultForm);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setForm({ ...defaultForm, ...initial });
      setErrors({});
    }
  }, [open, initial]);

  const update = (field: keyof OfferDTO, value: any) => {
    setForm((p) => ({ ...p, [field]: value }));
    if (errors[field])
      setErrors((p) => {
        const n = { ...p };
        delete n[field];
        return n;
      });
  };

  const setArrayItem = (
    field: "rules" | "priceIncludes" | "priceExcludes",
    index: number,
    value: string,
  ) => {
    const current = (form[field] as string[]) || [];
    update(
      field as any,
      current.map((v, i) => (i === index ? value : v)),
    );
  };
  const addArrayItem = (field: "rules" | "priceIncludes" | "priceExcludes") =>
    update(field, [...((form[field] as string[]) || []), ""]);
  const removeArrayItem = (field: "rules" | "priceIncludes" | "priceExcludes", index: number) =>
    update(
      field,
      ((form[field] as string[]) || []).filter((_, i) => i !== index),
    );

  const removeGalleryUrl = (index: number) => {
    const urls = form.photos?.galleryUrls || [];
    update("photos", { ...(form.photos || {}), galleryUrls: urls.filter((_, i) => i !== index) });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isCover: boolean) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";
      const uploadFile = async (file: File) => {
        const fd = new FormData();
        fd.append("files", file);
        const res = await fetch(`${API_BASE_URL}/api/vendorchats/upload`, {
          method: "POST",
          body: fd,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const json = await res.json();
        if (json.success && json.data?.length > 0) {
          const url = json.data[0].url;
          return url.startsWith("http") ? url : `${API_BASE_URL}${url}`;
        }
        throw new Error(json.message || "Upload failed");
      };

      if (isCover) {
        const url = await uploadFile(files[0]);
        update("photos", { ...(form.photos || {}), coverUrl: url });
        if (errors.cover)
          setErrors((p) => {
            const n = { ...p };
            delete n.cover;
            return n;
          });
      } else {
        const newUrls: string[] = [];
        for (let i = 0; i < files.length; i++) {
          try {
            newUrls.push(await uploadFile(files[i]));
          } catch {}
        }
        update("photos", {
          ...(form.photos || {}),
          galleryUrls: [...(form.photos?.galleryUrls || []), ...newUrls],
        });
        if (errors.gallery)
          setErrors((p) => {
            const n = { ...p };
            delete n.gallery;
            return n;
          });
      }
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name?.trim()) e.name = "Name is required";
    if (!form.category) e.category = "Category is required";
    if (!form.description?.trim()) e.description = "Description is required";
    if (!form.regularPrice && form.regularPrice !== 0) e.regularPrice = "Price is required";
    if (!form.city?.trim()) e.city = "City is required";
    if (!form.state?.trim()) e.state = "State is required";
    if (!form.photos?.coverUrl) e.cover = "Cover image is required";
    if ((form.photos?.galleryUrls?.length || 0) < 5)
      e.gallery = `Upload at least 5 gallery images (${form.photos?.galleryUrls?.length || 0}/5)`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      let serviceType = form.serviceType;
      const cat = (form.category || "").toLowerCase();
      if (cat.includes("van") || cat.includes("caravan")) serviceType = "camper-van";
      else if (cat.includes("stay")) serviceType = "unique-stay";
      else if (cat.includes("activity")) serviceType = "activity";
      else if (!serviceType) serviceType = "unique-stay";

      const { _id, ...rest } = form as any;
      const payload: Partial<OfferDTO> = {
        ...rest,
        serviceType,
        seatingCapacity: form.seatingCapacity ? Number(form.seatingCapacity) : undefined,
        sleepingCapacity: form.sleepingCapacity ? Number(form.sleepingCapacity) : undefined,
        regularPrice: form.regularPrice ? Number(form.regularPrice) : 0,
        status: "pending",
      };

      const res =
        isEdit && initial?._id
          ? await offersApi.update(initial._id, payload, token ?? undefined)
          : await offersApi.create(payload, token ?? undefined);
      if (res.success) {
        onSaved(res.data, !!isEdit);
        onOpenChange(false);
        toast.success(isEdit ? "Updated!" : "Created!");
      } else throw new Error((res as any).message || "Failed");
    } catch (e: any) {
      toast.error(e.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  const galleryCount = form.photos?.galleryUrls?.length || 0;

  return (
    <SlidePanel
      open={open}
      onClose={() => onOpenChange(false)}
      title={isEdit ? "Edit Offer" : "Add New Offer"}
      icon={<Plus size={16} className="text-th-brand" />}
      width={560}
      footer={
        <>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-10 px-[18px] rounded-[11px] border border-th-warm-border bg-transparent text-[13px] font-semibold text-th-warm-text-dark cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className={cn(
              "flex items-center gap-1.5 h-10 px-5 rounded-[11px] border-none bg-th-brand text-[13px] font-bold text-th-text-inverse shadow-[0_4px_16px_rgba(15,92,138,0.30)]",
              saving ? "cursor-not-allowed opacity-50" : "cursor-pointer",
            )}
          >
            <Save size={14} /> {saving ? "Saving…" : isEdit ? "Save Changes" : "Create Offer"}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-5">
        {/* Basic */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name" required error={errors.name}>
            <StyledInput
              value={form.name || ""}
              onChange={(v) => update("name", v)}
              placeholder="Offer name"
              error={!!errors.name}
            />
          </Field>
          <Field label="Category" required error={errors.category}>
            <StyledSelect
              value={form.category || ""}
              onChange={(v) => update("category", v)}
              placeholder="Select"
              error={!!errors.category}
            >
              {["Camper Van", "Unique Stay", "Activity", "Offer"].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </StyledSelect>
          </Field>
        </div>
        <Field label="Description" required error={errors.description}>
          <StyledTextarea
            value={form.description || ""}
            onChange={(v) => update("description", v)}
            placeholder="Describe your offer…"
            error={!!errors.description}
          />
        </Field>

        {/* Capacities + Price */}
        <div className="grid grid-cols-3 gap-3">
          <Field label="Seating">
            <StyledInput
              value={String(form.seatingCapacity || "")}
              onChange={(v) => update("seatingCapacity", v.replace(/\D/g, ""))}
              placeholder="e.g. 4"
            />
          </Field>
          <Field label="Sleeping">
            <StyledInput
              value={String(form.sleepingCapacity || "")}
              onChange={(v) => update("sleepingCapacity", v.replace(/\D/g, ""))}
              placeholder="e.g. 2"
            />
          </Field>
          <Field label="Price (₹/day)" required error={errors.regularPrice}>
            <StyledInput
              value={String(form.regularPrice || "")}
              onChange={(v) => update("regularPrice", v.replace(/\D/g, ""))}
              placeholder="e.g. 2890"
              error={!!errors.regularPrice}
            />
          </Field>
        </div>

        {/* Location */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="State" required error={errors.state}>
            <StyledInput
              value={form.state || ""}
              onChange={(v) => update("state", v)}
              error={!!errors.state}
            />
          </Field>
          <Field label="City" required error={errors.city}>
            <StyledInput
              value={form.city || ""}
              onChange={(v) => update("city", v)}
              error={!!errors.city}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Locality">
            <StyledInput value={form.locality || ""} onChange={(v) => update("locality", v)} />
          </Field>
          <Field label="Pincode">
            <StyledInput
              value={form.pincode || ""}
              onChange={(v) => update("pincode", v.replace(/\D/g, ""))}
              maxLength={6}
            />
          </Field>
        </div>

        {/* Rules */}
        <Field label="Rules">
          <RulesList
            rules={form.rules || []}
            onChange={(i, v) => setArrayItem("rules", i, v)}
            onAdd={() => addArrayItem("rules")}
            onRemove={(i) => removeArrayItem("rules", i)}
          />
        </Field>

        {/* Includes / Excludes */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Price Includes">
            <RulesList
              rules={form.priceIncludes || []}
              onChange={(i, v) => setArrayItem("priceIncludes", i, v)}
              onAdd={() => addArrayItem("priceIncludes")}
              onRemove={(i) => removeArrayItem("priceIncludes", i)}
            />
          </Field>
          <Field label="Price Excludes">
            <RulesList
              rules={form.priceExcludes || []}
              onChange={(i, v) => setArrayItem("priceExcludes", i, v)}
              onAdd={() => addArrayItem("priceExcludes")}
              onRemove={(i) => removeArrayItem("priceExcludes", i)}
            />
          </Field>
        </div>

        {/* Cover Image */}
        <Field label="Cover Image" required error={errors.cover}>
          <div
            className={cn(
              "relative h-[180px] rounded-[14px] overflow-hidden border-2 border-dashed bg-th-warm-surface",
              errors.cover ? "border-th-error-bright-soft" : "border-th-warm-border",
            )}
          >
            {form.photos?.coverUrl ? (
              <>
                <img
                  src={getImageUrl(form.photos.coverUrl)}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => update("photos", { ...(form.photos || {}), coverUrl: "" })}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-[rgba(239,68,68,0.9)] border-none flex items-center justify-center cursor-pointer text-th-text-inverse"
                >
                  <X size={14} />
                </button>
              </>
            ) : (
              <label className="w-full h-full flex flex-col items-center justify-center gap-2 cursor-pointer">
                <ImagePlus size={24} className="text-th-warm-text-muted" />
                <span className="text-[13px] font-semibold text-th-warm-text-dark">
                  Upload cover image
                </span>
                <span className="text-[11px] text-th-warm-text-muted">PNG, JPG up to 10MB</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e, true)}
                />
              </label>
            )}
          </div>
        </Field>

        {/* Gallery */}
        <Field label={`Gallery Images (Min 5)`} required error={errors.gallery}>
          <div className="flex items-center justify-between mb-2">
            <div className="w-full h-1 bg-th-warm-surface rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-[width] duration-[400ms]"
                style={{
                  width: `${Math.min(100, (galleryCount / 5) * 100)}%`,
                  backgroundColor: galleryCount >= 5 ? "#22c55e" : "#0F5C8A",
                }}
              />
            </div>
            <span
              className={cn(
                "text-[11px] font-bold ml-2.5 whitespace-nowrap",
                galleryCount >= 5 ? "text-th-success-bright" : "text-th-warm-text-muted",
              )}
            >
              {galleryCount}/5
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(form.photos?.galleryUrls || []).map((u, i) => (
              <div
                key={i}
                className="relative aspect-square rounded-[10px] overflow-hidden border border-th-warm-border group"
              >
                <img
                  src={getImageUrl(u)}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeGalleryUrl(i)}
                  className="absolute top-1 right-1 w-[22px] h-[22px] rounded-full bg-[rgba(239,68,68,0.85)] border-none flex items-center justify-center cursor-pointer opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Trash2 size={11} className="text-th-text-inverse" />
                </button>
              </div>
            ))}
            <label className="relative aspect-square rounded-[10px] border-2 border-dashed border-th-warm-border flex flex-col items-center justify-center gap-1 cursor-pointer bg-th-warm-surface transition-all">
              {uploading ? (
                <Loader2 size={20} className="text-th-warm-text-muted animate-spin" />
              ) : (
                <>
                  <Plus size={20} className="text-th-warm-text-muted" />
                  <span className="text-[11px] font-semibold text-th-warm-text-muted">Add</span>
                </>
              )}
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e, false)}
              />
            </label>
          </div>
        </Field>
      </div>
    </SlidePanel>
  );
};
