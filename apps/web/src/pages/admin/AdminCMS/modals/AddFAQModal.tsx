import React, { useState, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";
import type { AddFAQModalProps } from "../types";

export const AddFAQModal: React.FC<AddFAQModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState({
    category: "",
    question: "",
    answer: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        category: initialData.category,
        question: initialData.question,
        answer: initialData.answer,
      });
    } else {
      setFormData({ category: "", question: "", answer: "" });
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
      <div className="bg-white rounded-xl p-8 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-black font-geist text-2xl font-bold">
            {initialData ? "Edit Question" : "Add New Question"}
          </h2>
          <button
            onClick={onClose}
            className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-black hover:bg-gray-300 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <label className="text-dashboard-title font-plus-jakarta text-sm">Category</label>
            <div className="relative">
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-3.5 border border-dashboard-neutral-06 rounded-lg text-sm text-gray-500 focus:outline-none focus:border-dashboard-primary appearance-none bg-white"
                required
              >
                <option value="">Select</option>
                <option value="Camper Van">Camper Van</option>
                <option value="Unique Stay">Unique Stay</option>
                <option value="Activity">Activity</option>
                <option value="Guest">Guest</option>
                <option value="Booking">Booking</option>
                <option value="Common Questions">Common Questions</option>
                <option value="Locations">Locations</option>
              </select>
              <ChevronDown
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-dashboard-body"
                size={24}
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-dashboard-title font-plus-jakarta text-sm">Questions</label>
            <input
              type="text"
              placeholder="Are this tool are safe and should verify by government with all the rights?"
              value={formData.question}
              onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              className="w-full px-3 py-3.5 border border-dashboard-neutral-06 rounded-lg text-sm text-gray-500 placeholder:text-gray-400 focus:outline-none focus:border-dashboard-primary"
              required
            />
          </div>

          <div className="space-y-3">
            <label className="text-dashboard-title font-plus-jakarta text-sm">Answer</label>
            <textarea
              placeholder="For booking platforms, government verification is not always mandatory, but platforms should follow legal and safety regulations. Always check reviews, licenses, and safety policies before booking."
              value={formData.answer}
              onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
              rows={4}
              className="w-full px-3 py-4 border border-dashboard-neutral-06 rounded-lg text-sm text-dashboard-neutral-07 placeholder:text-dashboard-neutral-07 focus:outline-none focus:border-dashboard-primary resize-none"
              required
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full px-8 py-3 bg-dashboard-primary text-black rounded-full font-geist text-sm font-medium tracking-tight hover:bg-dashboard-primary/90 transition-colors"
            >
              {initialData ? "Save Changes" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFAQModal;
