import React, { useState, useEffect } from "react";
import type { AddJobModalProps } from "../types";

export const AddJobModal: React.FC<AddJobModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    jobTitle: "",
    experienceRequired: "",
    jobType: "Full Time",
    jobDescription: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        jobTitle: initialData.position,
        experienceRequired: initialData.experience,
        jobType: initialData.location || "Full Time",
        jobDescription: initialData.jd,
      });
    } else {
      setFormData({
        jobTitle: "",
        experienceRequired: "",
        jobType: "Full Time",
        jobDescription: "",
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
      <div className="bg-white rounded-xl p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-dashboard-heading font-geist text-2xl font-bold tracking-tight">
            {initialData ? "Edit Position" : "Add New Position"}
          </h2>
          <button
            onClick={onClose}
            className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-black hover:bg-gray-300 transition-colors"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-dashboard-title font-plus-jakarta text-sm">Job Title</label>
              <input
                type="text"
                placeholder="Type Here"
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                className="w-full px-3 py-3.5 border border-gray-400 rounded-lg text-sm text-dashboard-neutral-07 placeholder:text-dashboard-neutral-07 focus:outline-none focus:border-dashboard-primary"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-dashboard-title font-plus-jakarta text-sm">
                Experience Required
              </label>
              <select
                value={formData.experienceRequired}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    experienceRequired: e.target.value,
                  })
                }
                className="w-full px-3 py-3.5 border border-gray-400 rounded-lg text-sm text-dashboard-neutral-07 focus:outline-none focus:border-dashboard-primary appearance-none bg-white"
                required
              >
                <option value="">select</option>
                <option value="Fresher">Fresher</option>
                <option value="1 Year">1 Year</option>
                <option value="2 Years">2 Years</option>
                <option value="3 Years">3 Years</option>
                <option value="4 Years">4 Years</option>
                <option value="5+ Years">5+ Years</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-dashboard-title font-plus-jakarta text-sm">Job Type</label>
              <select
                value={formData.jobType}
                onChange={(e) => setFormData({ ...formData, jobType: e.target.value })}
                className="w-full px-3 py-3.5 border border-gray-400 rounded-lg text-sm text-dashboard-neutral-07 focus:outline-none focus:border-dashboard-primary appearance-none bg-white"
                required
              >
                <option value="Full Time">Full Time</option>
                <option value="Part Time">Part Time</option>
                <option value="Contract">Contract</option>
                <option value="Internship">Internship</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-dashboard-title font-plus-jakarta text-sm">
              Job Description
            </label>
            <textarea
              placeholder="Type Here"
              value={formData.jobDescription}
              onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
              rows={6}
              className="w-full px-3 py-3.5 border border-gray-400 rounded-lg text-sm text-dashboard-neutral-07 placeholder:text-dashboard-neutral-07 focus:outline-none focus:border-dashboard-primary resize-none"
              required
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              type="submit"
              className="px-8 py-3 bg-dashboard-primary text-black rounded-full font-geist text-sm font-medium tracking-tight hover:bg-dashboard-primary/90 transition-colors"
            >
              {initialData ? "Update Job" : "Add Job"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddJobModal;
