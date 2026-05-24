import React, { useState } from "react";
import { X } from "lucide-react";
import type { AddRoleModalProps } from "../types";

const INITIAL_FEATURES = {
  Dashboard: { view: false, full: false },
  Management: { view: false, full: false },
  Payments: { view: false, full: false },
  Analytics: { view: false, full: false },
  "Help Desk": { view: false, full: false },
  CMS: { view: false, full: false },
  Marketing: { view: false, full: false },
  Plugins: { view: false, full: false },
  Staff: { view: false, full: false },
};

export const AddRoleModal: React.FC<AddRoleModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    roleName: "",
    features: { ...INITIAL_FEATURES },
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedFeatures = Object.entries(formData.features)
      .filter(([_, permissions]) => permissions.view || permissions.full)
      .map(([feature, _]) => feature);

    onSubmit({
      roleName: formData.roleName,
      features: selectedFeatures,
    });

    setFormData({ roleName: "", features: { ...INITIAL_FEATURES } });
    onClose();
  };

  const handleFeatureChange = (
    feature: string,
    type: "view" | "full",
    checked: boolean,
  ) => {
    setFormData((prev) => ({
      ...prev,
      features: {
        ...prev.features,
        [feature]: {
          ...prev.features[feature as keyof typeof prev.features],
          [type]: checked,
        },
      },
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
      <div className="bg-white rounded-xl p-8 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-black font-geist text-2xl font-bold">Add New Role</h2>
          <button
            onClick={onClose}
            className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-black hover:bg-gray-300 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <label className="text-dashboard-title font-plus-jakarta text-sm">Role Name</label>
            <input
              type="text"
              placeholder="Accountant"
              value={formData.roleName}
              onChange={(e) => setFormData({ ...formData, roleName: e.target.value })}
              className="w-full px-3 py-3.5 border border-dashboard-neutral-06 rounded-lg text-sm text-dashboard-neutral-07 placeholder:text-dashboard-neutral-07 focus:outline-none focus:border-dashboard-primary"
              required
            />
          </div>

          <div className="space-y-3">
            <label className="text-dashboard-title font-plus-jakarta text-sm">Features</label>
            <div className="border border-dashboard-stroke rounded-xl overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 grid grid-cols-3 px-3 py-3">
                <div className="text-dashboard-title font-plus-jakarta text-sm font-bold">Features Name</div>
                <div className="text-dashboard-title font-plus-jakarta text-sm font-bold text-center">View Access</div>
                <div className="text-dashboard-title font-plus-jakarta text-sm font-bold text-center">Full Access</div>
              </div>
              {Object.keys(formData.features).map((feature) => (
                <div
                  key={feature}
                  className="grid grid-cols-3 px-3 py-3.5 border-b border-gray-100 last:border-0"
                >
                  <div className="text-dashboard-body font-poppins text-sm">{feature}</div>
                  <div className="flex justify-center">
                    <input
                      type="checkbox"
                      checked={formData.features[feature as keyof typeof formData.features].view}
                      onChange={(e) => handleFeatureChange(feature, "view", e.target.checked)}
                      className="w-5 h-5 border border-dashboard-gray-300 rounded text-dashboard-primary focus:ring-dashboard-primary"
                    />
                  </div>
                  <div className="flex justify-center">
                    <input
                      type="checkbox"
                      checked={formData.features[feature as keyof typeof formData.features].full}
                      onChange={(e) => handleFeatureChange(feature, "full", e.target.checked)}
                      className="w-5 h-5 border border-dashboard-gray-300 rounded text-dashboard-primary focus:ring-dashboard-primary"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              className="px-8 py-3 bg-dashboard-primary text-white rounded-full font-geist text-sm font-medium tracking-tight hover:bg-dashboard-primary/90 transition-colors"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddRoleModal;
