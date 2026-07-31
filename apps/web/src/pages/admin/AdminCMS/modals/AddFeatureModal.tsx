import React, { useEffect, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { cmsService } from "@/services/cms";
import { getImageUrl } from "@/lib/adminUtils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BTN_NEUTRAL, BTN_PRIMARY, CmsField, CONTROL, DIALOG_VARS, TEXTAREA } from "../ui";
import type { AddFeatureModalProps } from "../types";

const EMPTY = { name: "", icon: "", description: "" };

const COPY = {
  feature: { title: "New feature", nameLabel: "Feature name", cta: "Add feature" },
  category: { title: "New category", nameLabel: "Category name", cta: "Add category" },
  subcategory: {
    title: "New sub-category",
    nameLabel: "Sub-category name",
    cta: "Add sub-category",
  },
} as const;

export const AddFeatureModal: React.FC<AddFeatureModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  type = "feature",
}) => {
  const [formData, setFormData] = useState(EMPTY);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const copy = COPY[type] ?? COPY.feature;

  useEffect(() => {
    if (isOpen) setFormData(EMPTY);
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploading(true);
    try {
      const res = await cmsService.uploadMedia({ page: "features", section: "Features", file });
      if (res?.data?.url) setFormData((prev) => ({ ...prev, icon: res.data.url }));
    } catch (err) {
      console.error("Feature icon upload failed", err);
      toast.error("Icon upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        style={DIALOG_VARS}
        className="max-w-lg w-[calc(100vw-2rem)] p-0 gap-0 rounded-2xl overflow-hidden max-h-[92vh] flex flex-col"
      >
        <DialogHeader className="px-5 py-4 border-b border-app-border text-left">
          <DialogTitle className="text-[15px] font-bold text-app-fg">{copy.title}</DialogTitle>
          <DialogDescription className="text-[12.5px] text-app-fg-muted">
            Vendors pick from this list while creating a listing.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4">
            <CmsField label={copy.nameLabel} htmlFor="feature-name">
              <input
                id="feature-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Solar power"
                className={CONTROL}
                required
              />
            </CmsField>

            {type === "category" && (
              <CmsField label="Description" htmlFor="feature-description">
                <textarea
                  id="feature-description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="One line shown alongside the category."
                  className={TEXTAREA}
                />
              </CmsField>
            )}

            <CmsField label="Icon" hint="PNG, JPG or SVG">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full rounded-xl border border-dashed border-app-border bg-app-surface-2 px-4 py-6 text-center transition-colors hover:border-app-accent hover:bg-app-accent-soft focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-app-accent/20 disabled:opacity-60"
              >
                <span className="flex flex-col items-center gap-3">
                  {uploading ? (
                    <Loader2 size={24} className="animate-spin text-app-accent" />
                  ) : formData.icon ? (
                    <img
                      src={getImageUrl(formData.icon)}
                      alt=""
                      className="h-14 w-14 object-contain"
                    />
                  ) : (
                    <Upload size={24} className="text-app-accent" />
                  )}
                  <span className="text-[12.5px] font-semibold text-app-fg">
                    {uploading ? "Uploading…" : formData.icon ? "Replace icon" : "Choose an icon"}
                  </span>
                </span>
              </button>
            </CmsField>
          </div>

          <footer className="flex items-center justify-end gap-2 px-5 py-4 border-t border-app-border bg-app-surface-2">
            <button type="button" onClick={onClose} className={BTN_NEUTRAL}>
              Cancel
            </button>
            <button type="submit" disabled={uploading} className={BTN_PRIMARY}>
              {copy.cta}
            </button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddFeatureModal;
