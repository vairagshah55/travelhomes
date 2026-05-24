import React, { useState, useRef } from "react";
import { Upload } from "lucide-react";
import { cmsService } from "@/services/cms";
import { getImageUrl } from "@/lib/adminUtils";
import type { AddFeatureModalProps } from "../types";

export const AddFeatureModal: React.FC<AddFeatureModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  type = "feature",
}) => {
  const [formData, setFormData] = useState({
    name: "",
    icon: "",
    description: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({ name: "", icon: "", description: "" });
    onClose();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await cmsService.uploadMedia({
        page: "features",
        section: "Features",
        file,
      });
      if (res?.data?.url) {
        setFormData((prev) => ({ ...prev, icon: res.data.url }));
      }
    } catch (err) {
      console.error("Feature icon upload failed", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-7 w-full max-w-lg mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-dashboard-heading font-geist text-2xl font-bold tracking-tight">
            {type === "category"
              ? "Add Category"
              : type === "subcategory"
              ? "Add Sub-Category"
              : "Add Feature"}
          </h2>
          <button
            onClick={onClose}
            className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-black hover:bg-gray-300 transition-colors"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-dashboard-title font-plus-jakarta text-sm">
              {type === "category" || type === "subcategory"
                ? "Category Name"
                : "Name"}
            </label>
            <input
              type="text"
              placeholder="Type Here"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full px-3 py-3.5 border border-dashboard-neutral-06 rounded-lg text-sm text-dashboard-neutral-07 placeholder:text-dashboard-neutral-07 focus:outline-none focus:border-dashboard-primary"
              required
            />
          </div>

          {type === "category" && (
            <div className="space-y-2">
              <label className="text-dashboard-title font-plus-jakarta text-sm">
                Description
              </label>
              <textarea
                placeholder="Type Description Here"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-3.5 border border-dashboard-neutral-06 rounded-lg text-sm text-dashboard-neutral-07 placeholder:text-dashboard-neutral-07 focus:outline-none focus:border-dashboard-primary resize-none"
              />
            </div>
          )}

          <div className="space-y-2">
            <div
              className="border-2 border-dashed border-dashboard-stroke rounded-lg p-6 text-center bg-white cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageChange}
              />
              <div className="flex flex-col items-center gap-6">
                {formData.icon ? (
                  <img
                    src={getImageUrl(formData.icon)}
                    alt="Preview"
                    className="h-20 w-20 object-contain"
                  />
                ) : (
                  <div className="w-10 h-10 text-dashboard-blue-600">
                    <Upload size={40} />
                  </div>
                )}
                <div className="space-y-3">
                  <h3 className="text-dashboard-title font-poppins text-sm font-medium">
                    {formData.icon ? "Change image" : "Drag your image"}
                  </h3>
                  <p className="text-dashboard-body font-poppins text-xs leading-tight">
                    Acceptable file types: PNG, JPG, SVG
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <button
              type="submit"
              className="px-8 py-3 bg-dashboard-primary text-white rounded-full font-geist text-sm font-medium tracking-tight hover:bg-dashboard-primary/90 transition-colors"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFeatureModal;
