import React, { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import AdminSidebar from "../components/AdminSidebar";
import {
  Bell,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  Search,
  Filter,
  X,
  MoreHorizontal,
  Upload,
  User,
  Eye,
} from "lucide-react";
import AdminProfileDropdown from "../components/AdminProfileDropdown";
import AdminHeader from "../components/AdminHeader";
import RichTextEditor from "../components/RichTextEditor";
import { cmsService } from "../../services/cms";
import { settingsService } from "@/services/api";

import { getImageUrl } from "@/lib/utils";
import UniqueStaysSkeleton from "@/lib/UniqueStaysSkeleton";


interface CollapsibleSectionProps {
  title: string;
  children?: React.ReactNode;
  defaultExpanded?: boolean;
  hasContent?: boolean;
  isActive?: boolean;
  showToggle?: boolean;
  onToggleStatus?: (e: React.MouseEvent) => void;
  isSectionActive?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  defaultExpanded = false,
  hasContent = false,
  isActive = false,
  showToggle = false,
  onToggleStatus,
  isSectionActive = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const handleToggle = () => {
    setIsExpanded((prev) => !prev);
  };
  return (
    <div
      className={`border border-dashboard-stroke rounded-xl bg-white ${isActive ? "border-dashboard-primary bg-dashboard-primary/[0.12]" : ""}`}
    >
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={handleToggle}
      >
        <h3 className="text-dashboard-title font-plus-jakarta text-sm font-bold">
          {title}
        </h3>
        <div className="flex items-center gap-3">
          {showToggle && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleStatus?.(e);
              }}
              className={`w-9 h-5 rounded-full transition-colors relative ${
                isSectionActive ? "bg-dashboard-blue-600" : "bg-gray-300"
              }`}
            >
              <div
                className={`w-4 h-4 bg-white rounded-full shadow transition-transform absolute top-0.5 ${
                  isSectionActive ? "translate-x-4" : "translate-x-0.5"
                }`}
              />
            </button>
          )}
          <div className="flex flex-col items-center gap-0.5">
            {/* <ChevronDown
              size={16}
              color="black"
              className={`text-lg text-black transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
            /> */}
          </div>
        </div>
      </div>
      {isExpanded && children && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
};

interface JobPosition {
  id: string;
  position: string;
  experience: string;
  location: string;
  jd: string;
  isActive: boolean;
}

interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
}

interface Testimonial {
  id: string;
  userName: string;
  rating: number;
  content: string;
  isActive?: boolean;
}

interface Feature {
  id: string;
  name: string;
  category: string;
  status: "enable" | "disable";
  icon: string;
}

interface StaffRole {
  id: string;
  name: string;
  features: string[];
}

interface AddFAQModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (faqData: any) => void;
  initialData?: FAQ | null;
}

interface AddFeatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (featureData: any) => void;
  type?: "feature" | "category" | "subcategory";
}

interface AddRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (roleData: any) => void;
}

interface AddJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (jobData: any) => void;
  initialData?: JobPosition | null;
}

const AddJobModal: React.FC<AddJobModalProps> = ({
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
    console.log('[AddJobModal] Submitting job formData:', formData);
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
              <label className="text-dashboard-title font-plus-jakarta text-sm">
                Job Title
              </label>
              <input
                type="text"
                placeholder="Type Here"
                value={formData.jobTitle}
                onChange={(e) =>
                  setFormData({ ...formData, jobTitle: e.target.value })
                }
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
              <label className="text-dashboard-title font-plus-jakarta text-sm">
                Job Type
              </label>
              <select
                value={formData.jobType}
                onChange={(e) =>
                  setFormData({ ...formData, jobType: e.target.value })
                }
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
              onChange={(e) =>
                setFormData({ ...formData, jobDescription: e.target.value })
              }
              rows={6}
              className="w-full px-3 py-3.5 border border-gray-400 rounded-lg text-sm text-dashboard-neutral-07 placeholder:text-dashboard-neutral-07 focus:outline-none focus:border-dashboard-primary resize-none"
              required
            />
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              type="submit"
              className="px-8 py-3 bg-dashboard-primary text-white rounded-full font-geist text-sm font-medium tracking-tight hover:bg-dashboard-primary/90 transition-colors"
            >
              {initialData ? "Update Job" : "Add Job"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AddFeatureModal: React.FC<AddFeatureModalProps> = ({
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

const AddRoleModal: React.FC<AddRoleModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState({
    roleName: "",
    features: {
      Dashboard: { view: false, full: false },
      Management: { view: false, full: false },
      Payments: { view: false, full: false },
      Analytics: { view: false, full: false },
      "Help Desk": { view: false, full: false },
      CMS: { view: false, full: false },
      Marketing: { view: false, full: false },
      Plugins: { view: false, full: false },
      Staff: { view: false, full: false },
    },
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

    setFormData({
      roleName: "",
      features: {
        Dashboard: { view: false, full: false },
        Management: { view: false, full: false },
        Payments: { view: false, full: false },
        Analytics: { view: false, full: false },
        "Help Desk": { view: false, full: false },
        CMS: { view: false, full: false },
        Marketing: { view: false, full: false },
        Plugins: { view: false, full: false },
        Staff: { view: false, full: false },
      },
    });
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
          <h2 className="text-black font-geist text-2xl font-bold">
            Add New Role
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
            <label className="text-dashboard-title font-plus-jakarta text-sm">
              Role Name
            </label>
            <input
              type="text"
              placeholder="Accountant"
              value={formData.roleName}
              onChange={(e) =>
                setFormData({ ...formData, roleName: e.target.value })
              }
              className="w-full px-3 py-3.5 border border-dashboard-neutral-06 rounded-lg text-sm text-dashboard-neutral-07 placeholder:text-dashboard-neutral-07 focus:outline-none focus:border-dashboard-primary"
              required
            />
          </div>

          <div className="space-y-3">
            <label className="text-dashboard-title font-plus-jakarta text-sm">
              Features
            </label>
            <div className="border border-dashboard-stroke rounded-xl overflow-hidden">
              <div className="bg-gray-50 border-b border-gray-200 grid grid-cols-3 px-3 py-3">
                <div className="text-dashboard-title font-plus-jakarta text-sm font-bold">
                  Features Name
                </div>
                <div className="text-dashboard-title font-plus-jakarta text-sm font-bold text-center">
                  View Access
                </div>
                <div className="text-dashboard-title font-plus-jakarta text-sm font-bold text-center">
                  Full Access
                </div>
              </div>
              {Object.keys(formData.features).map((feature) => (
                <div
                  key={feature}
                  className="grid grid-cols-3 px-3 py-3.5 border-b border-gray-100 last:border-0"
                >
                  <div className="text-dashboard-body font-poppins text-sm">
                    {feature}
                  </div>
                  <div className="flex justify-center">
                    <input
                      type="checkbox"
                      checked={
                        formData.features[
                          feature as keyof typeof formData.features
                        ].view
                      }
                      onChange={(e) =>
                        handleFeatureChange(feature, "view", e.target.checked)
                      }
                      className="w-5 h-5 border border-dashboard-gray-300 rounded text-dashboard-primary focus:ring-dashboard-primary"
                    />
                  </div>
                  <div className="flex justify-center">
                    <input
                      type="checkbox"
                      checked={
                        formData.features[
                          feature as keyof typeof formData.features
                        ].full
                      }
                      onChange={(e) =>
                        handleFeatureChange(feature, "full", e.target.checked)
                      }
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

const AddFAQModal: React.FC<AddFAQModalProps> = ({
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
      setFormData({
        category: "",
        question: "",
        answer: "",
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
            <label className="text-dashboard-title font-plus-jakarta text-sm">
              Category
            </label>
            <div className="relative">
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
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
            <label className="text-dashboard-title font-plus-jakarta text-sm">
              Questions
            </label>
            <input
              type="text"
              placeholder="Are this tool are safe and should verify by government with all the rights?"
              value={formData.question}
              onChange={(e) =>
                setFormData({ ...formData, question: e.target.value })
              }
              className="w-full px-3 py-3.5 border border-dashboard-neutral-06 rounded-lg text-sm text-gray-500 placeholder:text-gray-400 focus:outline-none focus:border-dashboard-primary"
              required
            />
          </div>

          <div className="space-y-3">
            <label className="text-dashboard-title font-plus-jakarta text-sm">
              Answer
            </label>
            <textarea
              placeholder="For booking platforms, government verification is not always mandatory, but platforms should follow legal and safety regulations. Always check reviews, licenses, and safety policies before booking."
              value={formData.answer}
              onChange={(e) =>
                setFormData({ ...formData, answer: e.target.value })
              }
              rows={4}
              className="w-full px-3 py-4 border border-dashboard-neutral-06 rounded-lg text-sm text-dashboard-neutral-07 placeholder:text-dashboard-neutral-07 focus:outline-none focus:border-dashboard-primary resize-none"
              required
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full px-8 py-3 bg-dashboard-primary text-white rounded-full font-geist text-sm font-medium tracking-tight hover:bg-dashboard-primary/90 transition-colors"
            >
              Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;

  return (
    <div className="flex items-center gap-1">
      {[...Array(fullStars)].map((_, i) => (
        <div key={i} className="w-3 h-3 text-yellow-500">
          <svg
            viewBox="0 0 12 11"
            fill="currentColor"
            className="w-full h-full"
          >
            <path d="M7.80273 3.375L11.6465 4.20117L9.02637 7.11426L9.42285 11L5.82324 9.4248L2.22461 11L2.62012 7.11426L0 4.20117L3.84375 3.375L5.82324 0L7.80273 3.375Z" />
          </svg>
        </div>
      ))}
      {hasHalfStar && (
        <div className="relative w-3 h-3">
          <div className="absolute inset-0 text-gray-300">
            <svg
              viewBox="0 0 12 11"
              fill="currentColor"
              className="w-full h-full"
            >
              <path d="M7.80273 3.375L11.6465 4.20117L9.02637 7.11426L9.42285 11L5.82324 9.4248L2.22461 11L2.62012 7.11426L0 4.20117L3.84375 3.375L5.82324 0L7.80273 3.375Z" />
            </svg>
          </div>
          <div className="absolute inset-0 overflow-hidden w-1/2 text-yellow-500">
            <svg
              viewBox="0 0 12 11"
              fill="currentColor"
              className="w-full h-full"
            >
              <path d="M7.80273 3.375L11.6465 4.20117L9.02637 7.11426L9.42285 11L5.82324 9.4248L2.22461 11L2.62012 7.11426L0 4.20117L3.84375 3.375L5.82324 0L7.80273 3.375Z" />
            </svg>
          </div>
        </div>
      )}
      {rating < 5 &&
        [...Array(5 - Math.ceil(rating))].map((_, i) => (
          <div
            key={i + fullStars + (hasHalfStar ? 1 : 0)}
            className="w-3 h-3 text-gray-300"
          >
            <svg
              viewBox="0 0 12 11"
              fill="currentColor"
              className="w-full h-full"
            >
              <path d="M7.80273 3.375L11.6465 4.20117L9.02637 7.11426L9.42285 11L5.82324 9.4248L2.22461 11L2.62012 7.11426L0 4.20117L3.84375 3.375L5.82324 0L7.80273 3.375Z" />
            </svg>
          </div>
        ))}
    </div>
  );
};

const SECTION_KEY_MAP: Record<string, string> = {
  "Camper Van": "camper-van",
  "Unique Stays": "unique-stays",
  "Best Activity": "best-activity",
  "Trending destinations": "trending-destinations",
  "Testimonials": "testimonials",
  "Top Rated Stays": "top-rated-stays",
  "Frequently asked questions": "faq"
};

const AdminCMS = () => {
  const [activeTab, setActiveTab] = useState("Register/Login");
  const [expandedSections, setExpandedSections] = useState<string[]>([
    "Unique Stays",
  ]);
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([]);
  const [homePageSections, setHomePageSections] = useState<
    Record<string, boolean>
  >({});
  const [showJobModal, setShowJobModal] = useState(false);
  const [selectedJobForEdit, setSelectedJobForEdit] =
    useState<JobPosition | null>(null);
  const [openJobMenuId, setOpenJobMenuId] = useState<string | null>(null);
  const [openContactMenuId, setOpenContactMenuId] = useState<string | null>(null);
  const [openFAQMenuId, setOpenFAQMenuId] = useState<string | null>(null);
  const [faqMenuPos, setFaqMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [openFeatureMenuId, setOpenFeatureMenuId] = useState<string | null>(null);

  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [showFAQModal, setShowFAQModal] = useState(false);
  const [selectedFAQForEdit, setSelectedFAQForEdit] = useState<FAQ | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("Unique Stay");

  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  const [activePolicyTab, setActivePolicyTab] = useState("Privacy Policy");
  const [policySections, setPolicySections] = useState<
    { heading: string; content: string }[]
  >([]);
  const [policyName, setPolicyName] = useState("");

  // Branding States
  const [faviconUrl, setFaviconUrl] = useState<string>("");
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [logoDarkUrl, setLogoDarkUrl] = useState<string>("");

  // Contact Info State
  const [contactInfo, setContactInfo] = useState({
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    image: "",
  });

  useEffect(() => {
    const fetchPage = async () => {
      let key = "";
      if (activePolicyTab === "T&C") key = "terms-and-conditions";
      else if (activePolicyTab === "Privacy Policy") key = "privacy-policy";
      else if (activePolicyTab === "Vendor Policy") key = "vendor-policy";
      else return;

      try {
        const data = await cmsService.getPage(key);
        if (data) {
          setPolicyName(data.title || "");
          setPolicySections(data.sections || []);
        } else {
          setPolicyName("");
          setPolicySections([]);
        }
      } catch (e) {
        console.error("Failed to fetch page", e);
      }
    };
    fetchPage();
  }, [activePolicyTab]);

  const handleAddSection = () => {
    setPolicySections([...policySections, { heading: "", content: "" }]);
  };

  const handleRemoveSection = (index: number) => {
    const newSections = [...policySections];
    newSections.splice(index, 1);
    setPolicySections(newSections);
  };

  const handleSectionChange = (
    index: number,
    field: "heading" | "content",
    value: string,
  ) => {
    const newSections = [...policySections];
    newSections[index][field] = value;
    setPolicySections(newSections);
  };

  // features state
  const [selectedOfferingCategory, setSelectedOfferingCategory] =
    useState("Camper Van");
  const [selectedFeatureType, setSelectedFeatureType] = useState<"feature" | "category" | "selection">("feature");
  const [features, setFeatures] = useState<Feature[]>([]);
  const [showFeatureModal, setShowFeatureModal] = useState(false);



  // Staff roles state
  const [staffRoles, setStaffRoles] = useState<StaffRole[]>([]);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Local preview and file inputs for Change Photo buttons
  const [loginPreview, setLoginPreview] = useState<string>("");
  const [registerPreview1, setRegisterPreview1] = useState<string>("");
  const [registerPreview2, setRegisterPreview2] = useState<string>("");
  const loginFileRef = useRef<HTMLInputElement>(null);
  const registerFileRef1 = useRef<HTMLInputElement>(null);
  const registerFileRef2 = useRef<HTMLInputElement>(null);

  const onLoginPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLoginPreview(reader.result as string);
    reader.readAsDataURL(file);
    try {
      await cmsService.uploadMedia({
        page: "Register/Login",
        section: "Login Page",
        position: 0,
        file,
      });
    } catch (err) {
      console.error(err);
    }
  };
  const onRegisterPhotoChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
    which: 1 | 2,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (which === 1) setRegisterPreview1(reader.result as string);
      else setRegisterPreview2(reader.result as string);
    };
    reader.readAsDataURL(file);
    try {
      await cmsService.uploadMedia({
        page: "Register/Login",
        section: "Registration Page",
        position: which === 1 ? 1 : 2,
        file,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const authPages = ["Login", "Register", "ForgetPassword", "Verification", "EnterEmail", "ChangePassword"] as const;
  const slotsPerPage = 5;

  const [previews, setPreviews] = useState<Record<string, (string | null)[]>>({
    "Login": Array(slotsPerPage).fill(null),
    "Register": Array(slotsPerPage).fill(null),
    "ForgetPassword": Array(slotsPerPage).fill(null),
    "Verification": Array(slotsPerPage).fill(null),
    "EnterEmail": Array(slotsPerPage).fill(null),
    "ChangePassword": Array(slotsPerPage).fill(null),
  });

  const makeRefs = () =>
    Array.from({ length: slotsPerPage }, () => React.createRef<HTMLInputElement>());
  const fileRefs = useRef<Record<string, React.RefObject<HTMLInputElement>[]>>({
    "Login": makeRefs(),
    "Register": makeRefs(),
    "ForgetPassword": makeRefs(),
    "Verification": makeRefs(),
    "EnterEmail": makeRefs(),
    "ChangePassword": makeRefs(),
  });

  const getDefaultImage = (page: string, index: number) => {
    const defaultsLogin = [
      "https://api.builder.io/api/v1/image/assets/TEMP/189ec32850d222d53454645d326fb969a5128f86?width=683",
      "https://api.builder.io/api/v1/image/assets/TEMP/189ec32850d222d53454645d326fb969a5128f86?width=683",
      "https://api.builder.io/api/v1/image/assets/TEMP/189ec32850d222d53454645d326fb969a5128f86?width=683",
      "https://api.builder.io/api/v1/image/assets/TEMP/189ec32850d222d53454645d326fb969a5128f86?width=683",
      "https://api.builder.io/api/v1/image/assets/TEMP/189ec32850d222d53454645d326fb969a5128f86?width=683",
    ];
    const defaultsRegister = [
      "https://api.builder.io/api/v1/image/assets/TEMP/efc35c1906a677c7aab6014678e553f772fbd27c?width=683",
      "https://api.builder.io/api/v1/image/assets/TEMP/a5c3a1d5930c7d51d52f92c07949580819d89bfc?width=683",
      "https://api.builder.io/api/v1/image/assets/TEMP/a5c3a1d5930c7d51d52f92c07949580819d89bfc?width=683",
      "https://api.builder.io/api/v1/image/assets/TEMP/a5c3a1d5930c7d51d52f92c07949580819d89bfc?width=683",
      "https://api.builder.io/api/v1/image/assets/TEMP/a5c3a1d5930c7d51d52f92c07949580819d89bfc?width=683",
    ];
    const generic = "https://via.placeholder.com/400x300?text=Add+Image";
    
    if (page === "Login") return defaultsLogin[index] || generic;
    if (page === "Register") return defaultsRegister[index] || generic;
    return generic;
  };

  const onChangePhoto = async (
    page: string,
    index: number,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const slicePages = ["Login", "Register", "Verification", "EnterEmail", "ChangePassword"];

    if (slicePages.includes(page)) {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const fullImageSrc = readerEvent.target?.result as string;

        // Set full image preview immediately
        setPreviews((prev) => ({
          ...prev,
          [page]: prev[page].map((v, i) => (i === 0 ? fullImageSrc : v)),
        }));

        const img = new Image();
        img.onload = async () => {
          const w = img.width;
          const h = img.height;
          const halfW = w / 2;
          const thirdH = h / 3;
          const halfH = h / 2;

          const slices = [
            { x: 0, y: 0, w: halfW, h: thirdH }, // 0: Left Top
            { x: 0, y: thirdH, w: halfW, h: thirdH }, // 1: Left Middle
            { x: 0, y: 2 * thirdH, w: halfW, h: thirdH }, // 2: Left Bottom
            { x: halfW, y: 0, w: halfW, h: halfH }, // 3: Right Top
            { x: halfW, y: halfH, w: halfW, h: halfH }, // 4: Right Bottom
          ];

          const uploadPromises = slices.map(async (slice, i) => {
            return new Promise<void>((resolve) => {
              const canvas = document.createElement("canvas");
              const ctx = canvas.getContext("2d");
              if (!ctx) {
                resolve();
                return;
              }

              canvas.width = slice.w;
              canvas.height = slice.h;
              ctx.drawImage(
                img,
                slice.x,
                slice.y,
                slice.w,
                slice.h,
                0,
                0,
                slice.w,
                slice.h
              );

              canvas.toBlob(async (blob) => {
                if (blob) {
                  const slicedFile = new File([blob], `slice_${i}_${file.name}`, {
                    type: file.type,
                  });

                  try {
                    await cmsService.uploadMedia({
                      page,
                      section: page,
                      position: i,
                      file: slicedFile,
                    });
                  } catch (err) {
                    console.error(`Failed to upload slice ${i}`, err);
                  }
                }
                resolve();
              }, file.type);
            });
          });

          await Promise.all(uploadPromises);
          toast.success("Image sliced and uploaded successfully!");
        };
        img.src = fullImageSrc;
      };
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPreviews((prev) => ({
        ...prev,
        [page]: prev[page].map((v, i) =>
          i === index ? (reader.result as string) : v,
        ),
      }));
    };
    reader.readAsDataURL(file);
    try {
      console.log(`[AdminCMS] Uploading image for ${page} at position ${index}`, {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        uploadURL: "/admin/cms/media",
      });
      const result = await cmsService.uploadMedia({
        page,
        section: page,
        position: index,
        file,
      });
      console.log(`[AdminCMS] Upload successful:`, result);
      if (result?.data?.url) {
        setPreviews((prev) => ({
          ...prev,
          [page]: prev[page].map((v, i) =>
            i === index ? result.data.url : v,
          ),
        }));
      }
    } catch (err) {
      console.error("[AdminCMS] Upload failed:", err);
      toast.error(
        `Failed to upload image: ${
          err instanceof Error ? err.message : "Unknown error"
        }`,
      );
    }
  };

  const tabs = [
    "Register/Login",
    "HomePage",
    "features",
    "Contact Us",
    "Career",
    "FAQs",
    "Testimonials",
    "Policy",
    "Blogs",
    "Branding",
  ];

  // Contact messages state (for Contact Us tab)
  const [contactMessages, setContactMessages] = useState<
    Array<{
      id: string;
      firstName: string;
      lastName?: string;
      email: string;
      phone?: string;
      message: string;
      status?: string;
      createdAt?: string;
    }>
  >([]);
  const [loadingContacts, setLoadingContacts] = useState(false);

  // Job Applications state
  const [jobApplications, setJobApplications] = useState<any[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [openJobApplicationMenuId, setOpenJobApplicationMenuId] = useState<string | null>(null);
  // Career Sub-tab state
  const [careerSubTab, setCareerSubTab] = useState<"Positions" | "Applications">("Positions");

  const toggleSection = (sectionName: string) => {
    setExpandedSections((prev) =>
      prev.includes(sectionName)
        ? prev.filter((s) => s !== sectionName)
        : [...prev, sectionName],
    );
  };

  const toggleHomePageSection = async (sectionTitle: string) => {
    const key = SECTION_KEY_MAP[sectionTitle];
    if (!key) return;

    // Optimistic update
    setHomePageSections((prev) => ({ ...prev, [sectionTitle]: !prev[sectionTitle] }));
    
    try {
      await cmsService.toggleHomepageSection(key);
    } catch (e) {
      console.error("Failed to toggle section", e);
      // Revert on failure
      setHomePageSections((prev) => ({ ...prev, [sectionTitle]: !prev[sectionTitle] }));
    }
  };

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const sections = await cmsService.getHomepageSections();
        const nextState: Record<string, boolean> = {};
        
        // Inverse map for lookup
        const titleMap = Object.entries(SECTION_KEY_MAP).reduce((acc, [title, key]) => {
          acc[key] = title;
          return acc;
        }, {} as Record<string, string>);

        if (Array.isArray(sections)) {
          sections.forEach((s: any) => {
             const title = titleMap[s.sectionKey];
             if (title) {
               nextState[title] = s.isVisible;
             }
          });
        }
        
        // Ensure all keys exist
        Object.keys(SECTION_KEY_MAP).forEach(title => {
           if (nextState[title] === undefined) nextState[title] = true;
        });

        setHomePageSections(nextState);
      } catch (e) {
        console.error("Failed to fetch homepage sections", e);
      }
    };
    fetchSections();
  }, []);

  const loadFAQs = async () => {
    try {
      const list = await cmsService.getFAQs();
      setFaqs(list);
    } catch (e) {
      console.error(e);
    }
  };

  const loadTestimonials = async () => {
    try {
      const list = await cmsService.getTestimonials();
      setTestimonials(list.data);
    } catch (e) {
      console.error(e);
    }
  };

  // Load initial data from API
  useEffect(() => {
    (async () => {
      try {
        const [jobs, featureList, rolesList] =
          await Promise.all([
            cmsService.getJobs(),
            cmsService.getFeatures(selectedOfferingCategory, selectedFeatureType),
            cmsService.getRoles(),
          ]);
        setJobPositions(jobs.data);
        setFeatures(featureList.data);
        setStaffRoles(rolesList);
        // Load FAQs and Testimonials via helpers
        loadFAQs();
        loadTestimonials();
        
        // Load Contact Info
        cmsService.getContact().then((res) => {
          if (res?.data) {
             setContactInfo((prev) => ({ ...prev, ...res.data }));
          }
        }).catch(console.error);

      } catch (e) {
        console.error("Failed to load CMS data", e);
      }
    })();

    // Load contact messages for Contact Us tab
    (async () => {
      try {
        setLoadingContacts(true);
        const list = await cmsService.listContactMessages();
        setContactMessages(list);
      } catch (e) {
        console.warn("Failed to load contact messages", e);
      } finally {
        setLoadingContacts(false);
      }
    })();

    // Load Job Applications
    (async () => {
      try {
        setLoadingApplications(true);
        const res = await cmsService.getJobApplications();
        setJobApplications(res.data);
      } catch (e) {
        console.warn("Failed to load job applications", e);
      } finally {
        setLoadingApplications(false);
      }
    })();

    (async () => {
      try {
        const next: Record<string, (string | null)[]> = {
          "Login": Array(slotsPerPage).fill(null),
          "Register": Array(slotsPerPage).fill(null),
          "ForgetPassword": Array(slotsPerPage).fill(null),
          "Verification": Array(slotsPerPage).fill(null),
          "EnterEmail": Array(slotsPerPage).fill(null),
          "ChangePassword": Array(slotsPerPage).fill(null),
        };
        
        for (const page of authPages) {
          const res = await cmsService.getMedia({ page });
          const items: Array<{ section: string; position: number; url: string } & any> = res?.data || res || [];
          (items || []).forEach((m) => {
            const pos = Number(m.position || 0);
            const url = String(m.url || "").trim();
            if (next[page] && pos >= 0 && pos < slotsPerPage && url) {
              next[page][pos] = url;
            }
          });
        }
        setPreviews(next);
      } catch (e) {
        console.warn("Failed to load CMS media", e);
      }
    })();

    // Load offers for moderation - REMOVED (Redundant)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOfferingCategory, selectedFeatureType]);

  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".action-menu-container")) {
        setOpenJobMenuId(null);
        setOpenContactMenuId(null);
        setOpenFAQMenuId(null);
        setFaqMenuPos(null);
        setOpenFeatureMenuId(null);
        setOpenTestimonialMenu(null);
        setOpenJobApplicationMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch Branding Settings
  useEffect(() => {
    if (activeTab !== "Branding") return;
    const loadBranding = async () => {
      try {
        const faviconData = await settingsService.getSeo('favicon');
        setFaviconUrl(faviconData?.faviconUrl || "");

        const logoData = await settingsService.getSeo('logo');
        setLogoUrl(logoData?.logoUrl || "");
        setLogoDarkUrl(logoData?.logoDarkUrl || "");
      } catch (e) {
        console.error("Failed to load branding settings", e);
      }
    };
    loadBranding();
  }, [activeTab]);

  const handleBrandingUpload = async (type: 'favicon' | 'logo' | 'logo_dark', file?: File | null) => {
    if (!file) return;
    try {
        const page = type === 'favicon' ? 'favicon' : 'logo';
        const res = await settingsService.uploadSeoAsset(page, type, file);
        
        if (type === 'favicon') setFaviconUrl(res?.faviconUrl || "");
        if (type === 'logo') setLogoUrl(res?.logoUrl || "");
        if (type === 'logo_dark') setLogoDarkUrl(res?.logoDarkUrl || "");
        
        toast.success("Uploaded successfully");
    } catch (e) {
        console.error("Branding upload failed", e);
        toast.error("Upload failed");
    }
  };

  // Actions wired to API
  const toggleJobStatus = async (jobId: string) => {
    try {
      const updated = await cmsService.toggleJobStatus(jobId);
      setJobPositions((prev) =>
        prev.map((j) => (j.id === jobId ? updated : j)),
      );
      setOpenJobMenuId(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!window.confirm("Are you sure you want to delete this position?"))
      return;
    try {
      await cmsService.deleteJob(jobId);
      setJobPositions((prev) => prev.filter((j) => j.id !== jobId));
      setOpenJobMenuId(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveJob = async (jobData: any) => {
    console.log('[AdminCMS] handleSaveJob called with:', jobData);
    try {
      if (selectedJobForEdit) {
        console.log('[AdminCMS] Updating job:', selectedJobForEdit.id);
        const updated = await cmsService.updateJob(
          selectedJobForEdit.id,
          jobData,
        );
        console.log('[AdminCMS] Job updated response:', updated);
        setJobPositions((prev) =>
          prev.map((j) => (j.id === selectedJobForEdit.id ? updated : j)),
        );
        toast.success("Job updated successfully");
      } else {
        console.log('[AdminCMS] Creating new job...');
        const created = await cmsService.createJob(jobData);
        console.log('[AdminCMS] Job created response:', created);
        setJobPositions((prev) => [...prev, created]);
        toast.success("Job added successfully");
      }
    } catch (e: any) {
      console.error('[AdminCMS] Error saving job:', e);
      toast.error(e?.message || "Failed to save job");
    }
  };

  const handleSaveFAQ = async (faqData: any) => {
    try {
      if (selectedFAQForEdit) {
        const updated = await cmsService.updateFAQ(
          selectedFAQForEdit.id,
          faqData,
        );
        setFaqs((prev) =>
          prev.map((f) => (f.id === selectedFAQForEdit.id ? updated : f)),
        );
      } else {
        const created = await cmsService.createFAQ(faqData);
        setFaqs((prev) => [...prev, created]);
      }
      setSelectedFAQForEdit(null);
    } catch (e) {
      console.error(e);
    }
  };

  const deleteFAQ = async (id: string) => {
    console.log("[AdminCMS] deleteFAQ triggered with id:", id);
    if (!id) {
       console.error("[AdminCMS] deleteFAQ called with empty id");
       toast.error("Invalid FAQ ID");
       return;
    }
    if (!window.confirm("Are you sure you want to delete this FAQ?")) return;
    try {
      await cmsService.deleteFAQ(id);
      // Ensure we remove the item from local state even if ID format differs slightly
      setFaqs((prev) => prev.filter((faq) => String(faq.id) !== String(id)));
      setOpenFAQMenuId(null);
      setFaqMenuPos(null);
      toast.success("FAQ deleted successfully");
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete FAQ");
    }
  };

  const deleteTestimonial = async (id: string) => {
    try {
      await cmsService.deleteTestimonial(id);
      setTestimonials((prev) =>
        prev.filter((testimonial) => testimonial.id !== id),
      );
    } catch (e) {
      console.error(e);
    }
  };

  const toggleFeatureStatus = async (featureId: string) => {
    try {
      const res = await cmsService.toggleFeature(featureId);
      const updated = res.data || res;
      const normalized = { ...updated, id: updated.id || updated._id };
      setFeatures((prev) =>
        prev.map((f) => (f.id === featureId ? normalized : f)),
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddFeature = async (featureData: any) => {
    try {
      const res = await cmsService.createFeature({
        ...featureData,
        category: selectedOfferingCategory,
        type: selectedFeatureType,
      });
      const created = res.data || res;
      const newFeature = { ...created, id: created.id || created._id };
      setFeatures((prev) => [...prev, newFeature]);
    } catch (e) {
      console.error(e);
    }
  };

  const deleteFeature = async (featureId: string) => {
    try {
      await cmsService.deleteFeature(featureId);
      setFeatures((prev) => prev.filter((f) => f.id !== featureId));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddRole = async (roleData: any) => {
    try {
      const created = await cmsService.createRole(roleData);
      setStaffRoles((prev) => [...prev, created]);
    } catch (e) {
      console.error(e);
    }
  };

  const deleteRole = async (id: string) => {
    try {
      await cmsService.deleteRole(id);
      setStaffRoles((prev) => prev.filter((role) => role.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateApplicationStatus = async (id: string, status: string) => {
    try {
      const updated = await cmsService.updateJobApplicationStatus(id, status);
      const updatedApp = updated.data || updated;
      setJobApplications((prev) =>
        prev.map((app) => (app._id === id || app.id === id ? updatedApp : app))
      );
      setOpenJobApplicationMenuId(null);
      toast.success(`Application status updated to ${status}`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to update status");
    }
  };

  const handleDeleteJobApplication = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this application?")) return;
    try {
      await cmsService.deleteJobApplication(id);
      setJobApplications((prev) => prev.filter((app) => (app._id || app.id) !== id));
      setOpenJobApplicationMenuId(null);
      toast.success("Application deleted successfully");
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete application");
    }
  };

  const renderRegisterLoginContent = () => (
    <div className="space-y-4 overflow-x-hidden max-md:flex-wrap">
      {/* Login Page */}
      <CollapsibleSection title="Login Page" defaultExpanded>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {loadingContacts ? (
              <UniqueStaysSkeleton/>
            ) : (
          [0].map((idx) => (
            <div key={idx} className="space-y-3">
              <div className="w-[300px] h-[300px] bg-gray-200 rounded-xl overflow-hidden">
                <img
                  src={getImageUrl(
                    previews["Login"]?.[idx] ||
                      getDefaultImage("Login", idx)
                  )}
                  alt={`Login Page Preview ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <input
                type="file"
                accept="image/*"
                ref={fileRefs.current["Login"][idx]}
                className="hidden"
                onChange={(e) => onChangePhoto("Login", idx, e)}
              />
              <button
                onClick={() =>
                  fileRefs.current["Login"][idx].current?.click()
                }
                className="w-[300px] py-3 bg-dashboard-primary text-white rounded-full font-geist text-sm font-medium tracking-tight hover:bg-dashboard-primary/90 transition-colors"
              >
                Change Photo
              </button>
            </div>
          )))}
        </div>
      </CollapsibleSection>

      {/* Registration Page */}
      <CollapsibleSection title="Registration Page" defaultExpanded>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {loadingContacts ? (
              <UniqueStaysSkeleton/>
            ) : (
          [0].map((idx) => (
            <div key={idx} className="space-y-3">
              <div className="w-[300px] h-[300px] bg-gray-200 rounded-xl overflow-hidden">
                <img
                  src={getImageUrl(
                    previews["Register"]?.[idx] ||
                      getDefaultImage("Register", idx)
                  )}
                  alt={`Registration Page Preview ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <input
                type="file"
                accept="image/*"
                ref={fileRefs.current["Register"][idx]}
                className="hidden"
                onChange={(e) => onChangePhoto("Register", idx, e)}
              />
              <button
                onClick={() =>
                  fileRefs.current["Register"][idx].current?.click()
                }
                className="w-[300px] py-3 bg-dashboard-primary text-white rounded-full font-geist text-sm font-medium tracking-tight hover:bg-dashboard-primary/90 transition-colors"
              >
                Change Photo
              </button>
            </div>
          )))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Verification Code Page">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {loadingContacts ? (
              <UniqueStaysSkeleton/>
            ) : (
          [0].map((idx) => (
            <div key={idx} className="space-y-3">
              <div className="w-[300px] h-[300px] bg-gray-200 rounded-xl overflow-hidden">
                <img
                  src={getImageUrl(
                    previews["Verification"]?.[idx] ||
                      getDefaultImage("Verification", idx)
                  )}
                  alt={`Verification Code Page Preview ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <input
                type="file"
                accept="image/*"
                ref={fileRefs.current["Verification"][idx]}
                className="hidden"
                onChange={(e) => onChangePhoto("Verification", idx, e)}
              />
              <button
                onClick={() =>
                  fileRefs.current["Verification"][idx].current?.click()
                }
                className="w-[300px] py-3 bg-dashboard-primary text-white rounded-full font-geist text-sm font-medium tracking-tight hover:bg-dashboard-primary/90 transition-colors"
              >
                Change Photo
              </button>
            </div>
          )))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Enter Email Page">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-3  ">
          {loadingContacts ? (
              <UniqueStaysSkeleton/>
            ) : (
          [0].map((idx) => (
            <div key={idx} className="space-y-3">
              <div className="w-[300px] h-[300px] bg-gray-200 rounded-xl overflow-hidden">
                <img
                  src={getImageUrl(
                    previews["EnterEmail"]?.[idx] ||
                      getDefaultImage("EnterEmail", idx)
                  )}
                  alt={`Enter Email Page Preview ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <input
                type="file"
                accept="image/*"
                ref={fileRefs.current["EnterEmail"][idx]}
                className="hidden"
                onChange={(e) => onChangePhoto("EnterEmail", idx, e)}
              />
              <button
                onClick={() =>
                  fileRefs.current["EnterEmail"][idx].current?.click()
                }
                className="w-[300px] py-3 bg-dashboard-primary text-white rounded-full font-geist text-sm font-medium tracking-tight hover:bg-dashboard-primary/90 transition-colors"
              >
                Change Photo
              </button>
            </div>
          )))}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Change Password Page">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {loadingContacts ? (
              <UniqueStaysSkeleton/>
            ) : (
          [0].map((idx) => (
            <div key={idx} className="space-y-3">
              <div className="w-[300px] h-[300px] bg-gray-200 rounded-xl overflow-hidden">
                <img
                  src={getImageUrl(
                    previews["ChangePassword"]?.[idx] ||
                      getDefaultImage("ChangePassword", idx)
                  )}
                  alt={`Change Password Page Preview ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <input
                type="file"
                accept="image/*"
                ref={fileRefs.current["ChangePassword"][idx]}
                className="hidden"
                onChange={(e) => onChangePhoto("ChangePassword", idx, e)}
              />
              <button
                onClick={() =>
                  fileRefs.current["ChangePassword"][idx].current?.click()
                }
                className="w-[300px] py-3 bg-dashboard-primary text-white rounded-full font-geist text-sm font-medium tracking-tight hover:bg-dashboard-primary/90 transition-colors"
              >
                Change Photo
              </button>
            </div>
          )))}
        </div>
      </CollapsibleSection>
    </div>
  );

  const renderHomePageContent = () => (
    <div className="space-y-3.5 max-md:flex-wrap overflow-x-hidden">
      <CollapsibleSection
        title="Camper Van"
        showToggle
        isSectionActive={homePageSections["Camper Van"]}
        onToggleStatus={() => toggleHomePageSection("Camper Van")}
      />
      <CollapsibleSection
        title="Unique Stays"
        defaultExpanded
        hasContent={true}
        isActive={true}
        showToggle
        isSectionActive={homePageSections["Unique Stays"]}
        onToggleStatus={() => toggleHomePageSection("Unique Stays")}
      />
      <CollapsibleSection
        title="Best Activity"
        hasContent={true}
        defaultExpanded
        showToggle
        isSectionActive={homePageSections["Best Activity"]}
        onToggleStatus={() => toggleHomePageSection("Best Activity")}
      />
      <CollapsibleSection
        title="Trending destinations"
        hasContent={true}
        defaultExpanded
        showToggle
        isSectionActive={homePageSections["Trending destinations"]}
        onToggleStatus={() => toggleHomePageSection("Trending destinations")}
      />
      <CollapsibleSection
        title="Testimonials"
        hasContent={true}
        defaultExpanded
        showToggle
        isSectionActive={homePageSections["Testimonials"]}
        onToggleStatus={() => toggleHomePageSection("Testimonials")}
      />
      <CollapsibleSection
        title="Top Rated Stays"
        hasContent={true}
        defaultExpanded
        showToggle
        isSectionActive={homePageSections["Top Rated Stays"]}
        onToggleStatus={() => toggleHomePageSection("Top Rated Stays")}
      />
      <CollapsibleSection
        title="Frequently asked questions"
        hasContent={true}
        defaultExpanded
        showToggle
        isSectionActive={homePageSections["Frequently asked questions"]}
        onToggleStatus={() => toggleHomePageSection("Frequently asked questions")}
      />
    </div>
  );
// console.log("jobPositions:", jobPositions);

  const renderCareerContent = () => (
    <div className="space-y-4">
      {/* Sub-tabs for Career */}
      <div className="flex items-center gap-2 mb-4 bg-white p-2 rounded-xl w-fit border border-dashboard-stroke">
        <button
          onClick={() => setCareerSubTab("Positions")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            careerSubTab === "Positions"
              ? "bg-dashboard-primary text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Open Positions
        </button>
        <button
          onClick={() => setCareerSubTab("Applications")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            careerSubTab === "Applications"
              ? "bg-dashboard-primary text-white"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Applications
        </button>
      </div>

      {careerSubTab === "Applications" ? (
        renderJobApplicationsContent()
      ) : (
        <div className="border border-dashboard-stroke rounded-xl bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-dashboard-title font-plus-jakarta text-sm font-bold">
              Career Positions
            </h3>
            <button
              onClick={() => {
                setSelectedJobForEdit(null);
                setShowJobModal(true);
              }}
              className="px-5 py-2.5 bg-dashboard-primary text-white rounded-full font-geist text-sm font-medium tracking-tight hover:bg-dashboard-primary/90 transition-colors"
            >
              Add New Position
            </button>
          </div>

          <div
            className="h-px bg-dashboard-stroke mb-3"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to right, #EAECF0 0, #EAECF0 2px, transparent 2px, transparent 4px)",
            }}
          ></div>

          <div className="border border-dashboard-stroke rounded-xl overflow-scroll">
            {/* Table Header */}
            <div className="bg-gray-50 border-b border-gray-200 grid grid-cols-12 gap-3 px-4 py-3">
              <div className="col-span-3 text-dashboard-title font-plus-jakarta text-sm font-bold">
                Position
              </div>
              <div className="col-span-2 text-dashboard-title font-plus-jakarta text-sm font-bold">
                Experience Required
              </div>
              <div className="col-span-2 text-dashboard-title font-plus-jakarta text-sm font-bold">
                Location
              </div>
              <div className="col-span-2 text-dashboard-title font-plus-jakarta text-sm font-bold">
                JD
              </div>
              <div className="col-span-1 text-dashboard-title font-plus-jakarta text-sm font-bold">
                Status
              </div>
              <div className="col-span-2 text-dashboard-title font-plus-jakarta text-sm font-bold">
                Action
              </div>
            </div>

            {/* Table Rows */}
            {jobPositions.map((job, index) => (
              <div
                key={job.id}
                className={`grid grid-cols-12 gap-3 px-4 py-3.5 ${
                  index !== jobPositions.length - 1
                    ? "border-b border-gray-100"
                    : ""
                }`}
              >
                <div className="col-span-3">
                  <div className="text-dashboard-heading font-plus-jakarta text-sm font-bold">
                    {job.position}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-dashboard-body font-poppins text-sm">
                    {job.experience}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-dashboard-body font-poppins text-sm">
                    {job.location}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-dashboard-heading font-plus-jakarta text-sm truncate">
                    {job.jd}
                  </div>
                </div>
                <div className="col-span-1">
                  <span
                    className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      job.isActive !== false
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {job.isActive !== false ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="col-span-2 flex items-center justify-center gap-3 relative action-menu-container">
                  <button
                    onClick={() => toggleJobStatus(job.id)}
                    className={`w-9 h-5 rounded-full transition-colors relative ${
                      job.isActive ? "bg-dashboard-blue-600" : "bg-gray-300"
                    }`}
                    title={job.isActive ? "Deactivate" : "Activate"}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full shadow transition-transform absolute top-0.5 ${
                        job.isActive ? "translate-x-4" : "translate-x-0.5"
                      }`}
                    />
                  </button>

                  <button
                    onClick={() =>
                      setOpenJobMenuId(
                        openJobMenuId === job.id ? null : job.id
                      )
                    }
                    className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <MoreHorizontal
                      size={20}
                      className="text-dashboard-body"
                    />
                  </button>

                  {openJobMenuId === job.id && (
                    <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-dashboard-stroke rounded-lg shadow-lg z-50 py-1">
                      <button
                        onClick={() => {
                          setSelectedJobForEdit(job);
                          setShowJobModal(true);
                          setOpenJobMenuId(null);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-dashboard-primary/10 flex items-center gap-2"
                      >
                        <Edit2 size={16} /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteJob(job.id)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderJobApplicationsContent = () => (
    <div className="space-y-4">
      <div className="border border-dashboard-stroke rounded-xl bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-dashboard-title font-plus-jakarta text-sm font-bold">
            Job Applications
          </h3>
        </div>

        <div
          className="h-px bg-dashboard-stroke mb-3"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to right, #EAECF0 0, #EAECF0 2px, transparent 2px, transparent 4px)",
          }}
        ></div>

        <div className="border border-dashboard-stroke rounded-xl overflow-x-auto">
          {/* Table Header */}
          <div className="bg-gray-50 border-b border-gray-200 grid grid-cols-12 px-4 gap-3 py-3 min-w-[1200px]">
            <div className=" text-dashboard-title font-plus-jakarta text-sm font-bold">
              Date
            </div>
            <div className="col-span-2 text-dashboard-title font-plus-jakarta text-sm font-bold">
              Name
            </div>
            <div className="col-span-2 text-dashboard-title font-plus-jakarta text-sm font-bold">
              Job Title
            </div>
            <div className="col-span-2 text-dashboard-title font-plus-jakarta text-sm font-bold">
              Contact
            </div>
            <div className="col-span-1 text-dashboard-title font-plus-jakarta text-sm font-bold">
              Exp
            </div>
            <div className="col-span-1 text-dashboard-title font-plus-jakarta text-sm font-bold">
              Location
            </div>
             <div className="col-span-1 text-dashboard-title font-plus-jakarta text-sm font-bold">
              Resume
            </div>
            <div className="col-span-1 text-dashboard-title font-plus-jakarta text-sm font-bold">
              Status
            </div>
            <div className="col-span-1 text-dashboard-title font-plus-jakarta text-sm font-bold">
              Action
            </div>
          </div>

          {/* Table Rows */}
          {jobApplications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No applications found.
            </div>
          ) : (
            jobApplications.map((app, index) => (
              <div
                key={app._id || app.id || index}
                className={`grid grid-cols-12 gap-3 px-4 py-3.5 min-w-[1200px] ${
                  index !== jobApplications.length - 1
                    ? "border-b border-gray-100"
                    : ""
                }`}
              >
                <div className="col-span-1 text-sm text-gray-600">
                  {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : "-"}
                </div>
                <div className="col-span-2 text-sm font-medium text-gray-900">
                  {app.fullName}
                </div>
                <div className="col-span-2 text-sm text-gray-700">
                  {app.jobTitle}
                </div>
                <div className="col-span-2 text-sm text-gray-600 flex flex-col">
                  <span>{app.email}</span>
                  <span className="text-xs text-gray-500">{app.mobile}</span>
                </div>
                <div className="col-span-1 text-sm text-gray-600">
                  {app.experience}
                </div>
                <div className="col-span-1 text-sm text-gray-600">
                  {app.city}
                </div>
                <div className="col-span-1">
                  {app.cvUrl ? (
                    <a
                      href={getImageUrl(app.cvUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                    >
                      <Upload size={14} /> View
                    </a>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </div>
                <div className="col-span-1">
                   <span className={`text-xs px-2 py-1 rounded-full ${
                      app.status === 'Accepted' ? 'bg-green-100 text-green-700' :
                      app.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                      app.status === 'Interview Scheduled' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                   }`}>
                      {app.status || 'Pending'}
                   </span>
                </div>
                <div className="col-span-1 relative action-menu-container flex justify-center">
                  <button
                    onClick={() =>
                      setOpenJobApplicationMenuId(
                        openJobApplicationMenuId === (app._id || app.id) ? null : (app._id || app.id)
                      )
                    }
                    className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <MoreHorizontal
                      size={20}
                      className="text-dashboard-body"
                    />
                  </button>

                  {openJobApplicationMenuId === (app._id || app.id) && (
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-dashboard-stroke rounded-lg shadow-lg z-50 py-1">
                      {[
                        'Under Review',
                        'Interview Scheduled', 
                        'Interviewed',
                        'Accepted', 
                        'Rejected'
                      ].map(status => (
                        <button
                           key={status}
                           onClick={() => handleUpdateApplicationStatus(app._id || app.id, status)}
                           className="w-full px-4 py-2 text-left text-sm hover:bg-dashboard-primary/10 block text-gray-700"
                        >
                           {status}
                        </button>
                      ))}
                      <div className="h-px bg-gray-100 my-1"></div>
                      <button
                        onClick={() => handleDeleteJobApplication(app._id || app.id)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );

  const renderFAQsContent = () => {
    const activeFAQ = openFAQMenuId ? faqs.find((f) => f.id === openFAQMenuId) : null;

    return (
      <div className="space-y-4">
        <div className="border border-dashboard-stroke rounded-xl bg-white p-4">
          <div className="flex items-center max-sm:flex-col justify-between mb-3">
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-2 max-sm:gap-0 px-1 py-0.5 border border-gray-200 rounded-full bg-white shadow-sm overflow-x-auto">
                {[
                  "Camper Van",
                  "Unique Stay",
                  "Activity",
                  "Guest",
                  "Booking",
                  "Common Questions",
                  "Locations",
                ].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-5 py-3 rounded-full whitespace-nowrap max-sm:text-xs max-xs:px-2 max-sm:py-1 text-sm font-semibold transition-all ${
                      selectedCategory === cat
                        ? "bg-dashboard-primary text-white"
                        : "text-dashboard-primary hover:bg-gray-50"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedFAQForEdit(null);
                setShowFAQModal(true);
              }}
              className="px-5 py-2.5 bg-dashboard-primary text-white rounded-full font-geist text-sm font-medium tracking-tight hover:bg-dashboard-primary/90 transition-colors"
            >
              Add New Question
            </button>
          </div>

          <div
            className="h-px bg-dashboard-stroke mb-3"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to right, #EAECF0 0, #EAECF0 2px, transparent 2px, transparent 4px)",
            }}
          ></div>

          <div className="border border-dashboard-stroke rounded-xl overflow-scroll">
            {/* Table Header */}
            <div className="bg-gray-50 border-b border-gray-200 flex">
              <div className="w-30 px-4 py-3 text-dashboard-title font-plus-jakarta text-sm font-bold">
                SL
              </div>
              <div className="flex-1 px-3 py-3 text-dashboard-title font-plus-jakarta text-sm font-bold">
                Questions
              </div>
              <div className="w-40 px-3 py-3 text-dashboard-title font-plus-jakarta text-sm font-bold">
                Action
              </div>
            </div>

            {/* Table Rows */}
            {faqs
              .filter((faq) => faq.category === selectedCategory)
              .map((faq, index) => (
                <div
                  key={faq.id}
                  className={`flex items-start ${index !== faqs.filter((f) => f.category === selectedCategory).length - 1 ? "border-b border-gray-100" : ""}`}
                >
                  <div className="w-30 px-4 py-3.5">
                    <div className="text-dashboard-heading font-plus-jakarta text-sm">
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-1 px-4 py-3.5">
                    <div className="text-dashboard-heading font-plus-jakarta text-sm leading-6">
                      {faq.question}
                    </div>
                  </div>
                  <div className="w-40 px-3 py-1.5 flex items-center justify-center relative action-menu-container">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        setFaqMenuPos({
                          top: rect.bottom,
                          left: rect.right - 160,
                        });
                        setOpenFAQMenuId(
                          openFAQMenuId === faq.id ? null : faq.id,
                        );
                      }}
                      className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <MoreHorizontal
                        size={20}
                        className="text-dashboard-body"
                      />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Global Dropdown for FAQs */}
        {openFAQMenuId && activeFAQ && faqMenuPos && (
          <div
            className="fixed bg-white border border-dashboard-stroke rounded-lg shadow-lg z-[9999] py-1 w-40"
            style={{ top: faqMenuPos.top, left: faqMenuPos.left }}
          >
            <button
              onClick={() => {
                setSelectedFAQForEdit(activeFAQ);
                setShowFAQModal(true);
                setOpenFAQMenuId(null);
                setFaqMenuPos(null);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-dashboard-primary/10 flex items-center gap-2"
            >
              <Edit2 size={16} /> Edit
            </button>
            <button
              onClick={() => {
                deleteFAQ(activeFAQ.id);
              }}
              className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
            >
              <Trash2 size={16} /> Delete
            </button>
          </div>
        )}
      </div>
    );
  };

  const [openTestimonialMenu, setOpenTestimonialMenu] = useState<string | null>(
    null,
  );

  const renderTestimonialsContent = () => (
    <div className="space-y-4">
      <div className="border border-dashboard-stroke rounded-xl bg-white p-4">
        <div className="flex items-center justify-between mb-3 max-md:flex-wrap">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dashboard-body"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search"
                  className="w-full pl-10 pr-3 py-2.5 border border-dashboard-neutral-06 rounded-lg text-sm text-dashboard-body placeholder:text-dashboard-body focus:outline-none focus:border-dashboard-primary"
                />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 max-md:flex-wrap">
            <div className="flex items-center gap-2">
              <select className="px-4 py-2.5 border border-dashboard-stroke rounded-lg text-sm text-dashboard-body focus:outline-none focus:border-dashboard-primary appearance-none bg-white">
                <option>Sort By</option>
                <option>Rating High to Low</option>
                <option>Rating Low to High</option>
                <option>Date</option>
              </select>
            </div>
            <button className="flex items-center gap-2 px-5 py-2.5 border border-dashboard-stroke rounded-full text-sm text-dashboard-body hover:bg-gray-50 transition-colors">
              <Filter size={18} />
              Filters
            </button>
          </div>
        </div>

        <div
          className="h-px bg-dashboard-stroke mb-3"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to right, #EAECF0 0, #EAECF0 2px, transparent 2px, transparent 4px)",
          }}
        ></div>

        <div className="border border-dashboard-stroke rounded-xl">
          <div className="px-3 py-3 border-b border-dashboard-stroke">
            <div className="text-dashboard-title font-plus-jakarta text-sm font-bold">
              Testimonial
            </div>
          </div>

          <div className="border border-dashboard-stroke rounded-xl overflow-scroll">
            {/* Table Header */}
            <div className="bg-gray-50 border-b border-gray-200 flex">
              <div className="w-30 px-4 py-3 text-dashboard-title font-plus-jakarta text-sm font-bold">
                User Name
              </div>
              <div className="w-32 px-3 py-3 text-dashboard-title font-plus-jakarta text-sm font-bold">
                Rating
              </div>
              <div className="flex-1 px-3 py-3 text-dashboard-title font-plus-jakarta text-sm font-bold">
                Review
              </div>
              <div className="w-24 px-3 py-3 text-dashboard-title font-plus-jakarta text-sm font-bold">
                Status
              </div>
              <div className="w-36 px-3 py-3 text-dashboard-title font-plus-jakarta text-sm font-bold">
                Action
              </div>
            </div>

            {/* Table Rows */}
            {testimonials.map((testimonial, index) => (
              <div
                key={testimonial.id}
                className={`flex items-start ${index !== testimonials.length - 1 ? "border-b border-gray-100" : ""}`}
              >
                <div className="w-30 px-4 py-3.5">
                  <div className="text-dashboard-heading font-plus-jakarta text-sm">
                    {testimonial.userName}
                  </div>
                </div>
                <div className="w-32 px-3 py-3.5">
                  <div className="flex items-center gap-0.5">
                    <span className="text-dashboard-heading font-plus-jakarta text-sm font-medium mr-1">
                      {testimonial.rating}
                    </span>
                    <StarRating rating={testimonial.rating} />
                  </div>
                </div>
                <div className="flex-1 px-4 py-3.5">
                  <div className="text-dashboard-heading font-plus-jakarta text-sm leading-6">
                    {testimonial.content}
                  </div>
                </div>
                <div className="w-24 px-3 py-3.5">
                  <span
                    className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      testimonial.isActive !== false
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {testimonial.isActive !== false ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="w-36 px-3 py-1.5 flex items-center justify-center relative action-menu-container">
                  <button
                    onClick={() =>
                      setOpenTestimonialMenu(
                        openTestimonialMenu === testimonial.id
                          ? null
                          : testimonial.id,
                      )
                    }
                    className="text-dashboard-body hover:text-dashboard-primary transition-colors"
                    aria-label="More actions"
                  >
                    <MoreHorizontal size={22} strokeWidth={2} />
                  </button>
                  {openTestimonialMenu === testimonial.id && (
                    <div className="absolute right-3 top-9 z-20 bg-white border border-gray-200 rounded-lg shadow-lg w-40 py-1">
                      <button
                        onClick={() =>
                          cmsService
                            .toggleTestimonial(testimonial.id)
                            .then(() => {
                              setOpenTestimonialMenu(null);
                              loadTestimonials();
                            })
                        }
                        className="w-full text-left px-4 py-2 text-sm text-dashboard-heading hover:bg-gray-50"
                      >
                        {(testimonial as any).isActive === false
                          ? "Activate"
                          : "Deactivate"}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Delete this testimonial?")) {
                            cmsService.deleteTestimonial(testimonial.id).then(() => {
                              setOpenTestimonialMenu(null);
                              loadTestimonials();
                            });
                          }
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const   renderfeaturesContent = () => {
    return (
      <div className="space-y-4">
        <div className="border border-dashboard-stroke rounded-xl bg-white p-4">
          {/* Feature Type Toggle */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex bg-gray-100 p-1 rounded-full">
              <button
                onClick={() => setSelectedFeatureType("feature")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedFeatureType === "feature"
                    ? "bg-white shadow-sm text-dashboard-primary"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Features (Amenities)
              </button>
              <button
                onClick={() => setSelectedFeatureType("category")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedFeatureType === "category"
                    ? "bg-white shadow-sm text-dashboard-primary"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                Categories (Types)
              </button>
              {selectedOfferingCategory === "Unique Stay" && (
                <button
                  onClick={() => setSelectedFeatureType("selection")}
                  className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedFeatureType === "selection"
                      ? "bg-white shadow-sm text-dashboard-primary"
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  Category Selection
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mb-3">
             <div className="flex items-center gap-5">
               <div className="flex items-center gap-2 px-1 py-0.5 border border-gray-200 rounded-full bg-white shadow-sm overflow-x-auto">
                 {["Camper Van", "Unique Stay", "Activity"].map((cat) => (
                   <button
                     key={cat}
                     onClick={() => {
                        setSelectedOfferingCategory(cat);
                        // If moving away from Unique Stay, reset to feature
                        if (cat !== "Unique Stay" && selectedFeatureType === "selection") {
                           setSelectedFeatureType("feature");
                        }
                     }}
                     className={`px-5 py-3 rounded-full whitespace-nowrap text-sm font-semibold transition-all ${
                       selectedOfferingCategory === cat
                         ? "bg-dashboard-primary text-white"
                         : "text-dashboard-primary hover:bg-gray-50"
                     }`}
                   >
                     {cat}
                   </button>
                 ))}
               </div>
               
             </div>

             <button
               onClick={() => {
                 if (selectedFeatureType === "selection") {
                    if (!selectedStayProperty) {
                      toast.error("Please select a property type first");
                      return;
                    }
                    setShowSubCategoryModal(true);
                 } else {
                    setShowFeatureModal(true);
                 }
               }}
               className="px-5 py-2.5 bg-dashboard-primary text-white rounded-full font-geist text-sm font-medium tracking-tight hover:bg-dashboard-primary/90 transition-colors"
             >
               + Add {selectedFeatureType === "category" ? "Category" : selectedFeatureType === "selection" ? "Sub-Category" : "Feature"}
             </button>
          </div>

          <div
            className="h-px bg-dashboard-stroke mb-3"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to right, #EAECF0 0, #EAECF0 2px, transparent 2px, transparent 4px)",
            }}
          ></div>

          {selectedFeatureType === "selection" ? (
             <div className="border border-dashboard-stroke rounded-xl overflow-scroll">
                  <div className="bg-gray-50 border-b border-gray-200 grid grid-cols-12 gap-3 px-4 py-3">
                    <div className="col-span-8 text-dashboard-title font-plus-jakarta text-sm font-bold">
                      Category Name
                    </div>
                    <div className="col-span-4 text-dashboard-title font-plus-jakarta text-sm font-bold">
                      Action
                    </div>
                  </div>

                  {staySubCategories.length > 0 ? (
                    staySubCategories.map((feature, index) => (
                      <div
                        key={feature.id}
                        className={`grid grid-cols-12 gap-3 px-4 py-3.5 items-center ${
                          index !== staySubCategories.length - 1
                            ? "border-b border-gray-100"
                            : ""
                        }`}
                      >
                        <div className="col-span-8 flex items-center gap-3">
                          {feature.icon && (
                            <img
                              src={getImageUrl(feature.icon)}
                              alt=""
                              className="w-8 h-8 rounded object-cover bg-gray-100"
                            />
                          )}
                          <div className="text-dashboard-heading font-plus-jakarta text-sm font-bold">
                            {feature.name}
                          </div>
                        </div>
                        <div className="col-span-4">
                           <button
                              onClick={async () => {
                                if (confirm("Delete this category?")) {
                                   await cmsService.deleteFeature(feature.id);
                                   setStaySubCategories(prev => prev.filter(f => f.id !== feature.id));
                                }
                              }}
                              className="text-red-600 hover:text-red-800"
                           >
                             <Trash2 size={18} />
                           </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      No categories found for this property type.
                    </div>
                  )}
             </div>
          ) : (
             <div className="border border-dashboard-stroke rounded-xl overflow-scroll">

                <div className="bg-gray-50 border-b border-gray-200 grid grid-cols-12 gap-3 px-4 py-3">
                  <div className={`${selectedFeatureType === "category" ? "col-span-3" : "col-span-5"} text-dashboard-title font-plus-jakarta text-sm font-bold`}>
                    {selectedFeatureType === "category" ? "Category Name" : "Feature Name"}
                  </div>
                  {selectedFeatureType === "category" && (
                    <div className="col-span-4 text-dashboard-title font-plus-jakarta text-sm font-bold">
                      Description
                    </div>
                  )}
                  <div className={`${selectedFeatureType === "category" ? "col-span-2" : "col-span-3"} text-dashboard-title font-plus-jakarta text-sm font-bold`}>
                    Parent Category
                  </div>
                  <div className="col-span-2 text-dashboard-title font-plus-jakarta text-sm font-bold">
                    Status
                  </div>
                  <div className={`${selectedFeatureType === "category" ? "col-span-1" : "col-span-2"} text-dashboard-title font-plus-jakarta text-sm font-bold`}>
                    Action
                  </div>
                </div>

                {features.length > 0 ? (
                  features.map((feature, index) => (
                    <div
                      key={feature.id}
                      className={`grid grid-cols-12 gap-3 px-4 py-3.5 items-center ${
                        index !== features.length - 1
                          ? "border-b border-gray-100"
                          : ""
                      }`}
                    >
                      <div className={`${selectedFeatureType === "category" ? "col-span-3" : "col-span-5"} flex items-center gap-3`}>
                        {feature.icon && (
                          <img
                            src={getImageUrl(feature.icon)}
                            alt=""
                            className="w-8 h-8 rounded object-cover bg-gray-100"
                          />
                        )}
                        <div className="text-dashboard-heading font-plus-jakarta text-sm font-bold">
                          {feature.name}
                        </div>
                      </div>
                      {selectedFeatureType === "category" && (
                        <div className="col-span-4 text-dashboard-body font-poppins text-sm truncate" title={feature.description}>
                          {feature.description || "-"}
                        </div>
                      )}
                      <div className={`${selectedFeatureType === "category" ? "col-span-2" : "col-span-3"}`}>
                        <div className="text-dashboard-body font-poppins text-sm">
                          {feature.category}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <button
                          onClick={() => toggleFeatureStatus(feature.id)}
                          className={`w-9 h-5 rounded-full transition-colors relative ${
                            feature.status === "enable"
                              ? "bg-dashboard-blue-600"
                              : "bg-gray-300"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 bg-white rounded-full shadow transition-transform absolute top-0.5 ${
                              feature.status === "enable"
                                ? "translate-x-4"
                                : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </div>
                      <div className={`${selectedFeatureType === "category" ? "col-span-1" : "col-span-2"} flex items-center justify-center relative action-menu-container`}>
                        <button
                          onClick={() =>
                            setOpenFeatureMenuId(
                              openFeatureMenuId === feature.id ? null : feature.id
                            )
                          }
                          className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <MoreHorizontal
                            size={20}
                            className="text-dashboard-body"
                          />
                        </button>
                        {openFeatureMenuId === feature.id && (
                          <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-dashboard-stroke rounded-lg shadow-lg z-50 py-1">
                            <button
                              onClick={() => {
                                if (
                                  confirm(
                                    "Are you sure you want to delete this feature?"
                                  )
                                ) {
                                  deleteFeature(feature.id);
                                }
                                setOpenFeatureMenuId(null);
                              }}
                              className="flex items-center gap-3 w-full px-3 py-3 text-left hover:bg-gray-50 transition-colors"
                            >
                              <Trash2 size={18} className="text-red-600" />
                              <span className="text-red-600 font-poppins text-sm">
                                Delete
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-gray-500">
                    No {selectedFeatureType === "category" ? "categories" : "features"} found for {selectedOfferingCategory}
                  </div>
                )}
              </div>
          )}
        </div>
      </div>
    );
  };

  const [stayPropertyTypes, setStayPropertyTypes] = useState<Feature[]>([]);
  const [staySubCategories, setStaySubCategories] = useState<Feature[]>([]);
  const [selectedStayProperty, setSelectedStayProperty] = useState<string>("");
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);

  useEffect(() => {
    if (activeTab === "features" && selectedFeatureType === "selection") {
      // Fetch Property Types (Level 2)
      cmsService
        .getFeatures("Unique Stay", "category")
        .then((res: any) => {
           const list = Array.isArray(res) ? res : res.data || [];
           setStayPropertyTypes(list.map((d: any) => ({ ...d, id: d.id || d._id })));
           if (list.length > 0 && !selectedStayProperty) {
             setSelectedStayProperty(list[0].id || list[0].name.toLowerCase());
           }
        })
        .catch(console.error);
    }
  }, [activeTab, selectedFeatureType]);

  useEffect(() => {
    if (activeTab === "features" && selectedFeatureType === "selection" && selectedStayProperty) {
       // Fetch Sub Categories (Level 3) - fetching by category=propertyId and type="subcategory"
       cmsService.getFeatures(selectedStayProperty, "subcategory")
         .then((res: any) => {
            const list = Array.isArray(res) ? res : res.data || [];
            setStaySubCategories(list.map((d: any) => ({ ...d, id: d.id || d._id })));
         })
         .catch(console.error);
    }
  }, [activeTab, selectedFeatureType, selectedStayProperty]);

  const handleAddSubCategory = async (data: any) => {
    try {
      await cmsService.createFeature({
        name: data.name,
        icon: data.icon,
        category: selectedStayProperty,
        type: "subcategory",
      });
      
      const res = await cmsService.getFeatures(selectedStayProperty, "subcategory");
      const list = Array.isArray(res) ? res : res.data || [];
      setStaySubCategories(list.map((d: any) => ({ ...d, id: d.id || d._id })));
    } catch (e: any) {
      console.error(e);
      toast.error(`Failed to add sub-category: ${e.response?.data?.message || e.message || "Unknown error"}`);
    }
  };



  // State for Blogs
  const [blogs, setBlogs] = useState<any[]>([]);
  const [showBlogModal, setShowBlogModal] = useState(false);
  const [blogForm, setBlogForm] = useState({
    title: "",
    category: "",
    description: "",
    metablogkeyword: "",
    metablogdescription: "",
    metablogtitle: "",
    content: "",
    coverImage: "",
    authorName: "",
    authorImg: "",
    authorRole: "",
    status: "published" as "published" | "draft",
  });

  useEffect(() => {
    // Load blogs once when tab is Blogs
    if (activeTab === "Blogs") {
      cmsService
        .listBlogs({ status: "published" })
        .then((res: any) => {
          setBlogs(res?.data || []);
        })
        .catch(console.error);
    }
  }, [activeTab]);

  const handleCreateBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { ...blogForm };
      const res = await cmsService.createBlog(payload);
      setBlogs((prev) => [res?.data, ...prev]);
      setShowBlogModal(false);
      setBlogForm({
        title: "",
        category: "",
        description: "",
        metablogtitle: "",
        metablogdescription: "",
        metablogkeyword: "",
        content: "",
        coverImage: "",
        authorName: "",
        authorImg: "",
        authorRole: "",
        status: "published",
      });
    } catch (err) {
      console.error(err);
    }
  };

  const renderStaffRolesContent = () => (
    <div className="space-y-4">
      <div className="border border-dashboard-stroke rounded-xl bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-dashboard-heading font-geist text-xl font-bold tracking-tight leading-tight">
            Roles
          </h3>
          <button
            onClick={() => setShowRoleModal(true)}
            className="px-5 py-2.5 bg-dashboard-primary text-white rounded-full font-geist text-sm font-medium tracking-tight hover:bg-dashboard-primary/90 transition-colors"
          >
            + Add New Role
          </button>
        </div>

        <div className="border border-dashboard-stroke rounded-xl overflow-scroll">
          {/* Table Header */}
          <div className="bg-gray-50 border-b border-gray-200 grid grid-cols-12 gap-3 px-4 py-3">
            <div className="col-span-3 text-dashboard-title font-plus-jakarta text-sm font-bold">
              Role Name
            </div>
            <div className="col-span-6 text-dashboard-title font-plus-jakarta text-sm font-bold">
              Features
            </div>
            <div className="col-span-3 text-dashboard-title font-plus-jakarta text-sm font-bold">
              Action
            </div>
          </div>

          {/* Table Rows */}
          {staffRoles.map((role, index) => (
            <div
              key={role.id}
              className={`grid grid-cols-12 gap-3 px-4 py-3.5 items-center ${index !== staffRoles.length - 1 ? "border-b border-gray-100" : ""}`}
            >
              <div className="col-span-3">
                <div className="text-dashboard-heading font-plus-jakarta text-sm font-bold">
                  {role.name}
                </div>
              </div>
              <div className="col-span-6">
                <div className="text-dashboard-body font-poppins text-sm">
                  {role.features.join(", ")}
                </div>
              </div>
              <div className="col-span-3 flex items-center justify-center relative">
                <button
                  onClick={() =>
                    setRoleDropdownOpen(
                      roleDropdownOpen === role.id ? null : role.id,
                    )
                  }
                  className="text-dashboard-body hover:text-dashboard-primary transition-colors"
                >
                  <MoreHorizontal size={24} strokeWidth={2} />
                </button>
                {roleDropdownOpen === role.id && (
                  <div className="absolute top-8 right-0 bg-white border border-dashboard-stroke rounded-lg shadow-lg z-10 w-48">
                    <div className="py-1">
                      <button className="flex items-center gap-3 w-full px-3 py-3 text-left hover:bg-gray-50 transition-colors bg-gray-100">
                        <Eye size={18} className="text-dashboard-body" />
                        <span className="text-dashboard-body font-poppins text-sm">
                          View
                        </span>
                      </button>
                      <button
                        onClick={() => {
                          deleteRole(role.id);
                          setRoleDropdownOpen(null);
                        }}
                        className="flex items-center gap-3 w-full px-3 py-3 text-left hover:bg-gray-50 transition-colors"
                      >
                        <Trash2 size={18} className="text-red-600" />
                        <span className="text-red-600 font-poppins text-sm">
                          Delete
                        </span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const BlogRowActions: React.FC<{
    blog: any;
    onEdit: (b: any) => void;
    onDelete: () => void;
  }> = ({ blog, onEdit, onDelete }) => {
    const [open, setOpen] = useState(false);
    const [statusOpen, setStatusOpen] = useState(false);

    const blogId = blog._id || blog.id;

    const doDelete = async () => {
      if (!confirm("Delete this blog?")) return;
      try {
        await cmsService.deleteBlog(blogId);
        onDelete();
        setOpen(false);
      } catch (e) {
        console.error(e);
      }
    };

    const doEdit = async () => {
      // Minimal inline edit: toggle title suffix for demo; ideally open a modal form
      const newTitle = prompt("Update title", blog.title || "")?.trim();
      if (!newTitle || newTitle === blog.title) return;
      try {
        const res = await cmsService.updateBlog(blogId, { title: newTitle });
        onEdit(res?.data || { ...blog, title: newTitle });
        setOpen(false);
      } catch (e) {
        console.error(e);
      }
    };

    const changeStatus = async (status: "published" | "draft") => {
      try {
        const res = await cmsService.setBlogStatus(blogId, status);
        onEdit(res?.data || { ...blog, status });
        setStatusOpen(false);
        setOpen(false);
      } catch (e) {
        console.error(e);
      }
    };

    return (
      <div className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <MoreHorizontal size={22} strokeWidth={2} />
        </button>
        {open && (
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow z-20">
            <button
              onClick={doEdit}
              className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50"
            >
              <Edit2 size={16} /> <span>Edit</span>
            </button>
            <div className="relative">
              <button
                onClick={() => setStatusOpen((v) => !v)}
                className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50"
              >
                <ChevronDown size={16} /> <span>Status</span>
              </button>
              {statusOpen && (
                <div className="absolute right-0 top-full mt-1 w-40 bg-white border rounded shadow z-30">
                  <button
                    onClick={() => changeStatus("published")}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50"
                  >
                    Published
                  </button>
                  <button
                    onClick={() => changeStatus("draft")}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50"
                  >
                    Draft
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={doDelete}
              className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 text-red-600"
            >
              <Trash2 size={16} /> <span>Delete</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderBlogsContent = () => (
    <div className="space-y-4">
      <div className="border border-dashboard-stroke rounded-xl bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-dashboard-heading font-geist text-xl font-bold tracking-tight leading-tight">
            Blogs
          </h3>
          <button
            onClick={() => setShowBlogModal(true)}
            className="px-5 py-2.5 bg-dashboard-primary text-white rounded-full font-geist text-sm font-medium tracking-tight hover:bg-dashboard-primary/90 transition-colors"
          >
            + Add New Blog
          </button>
        </div>

        <div className="border border-dashboard-stroke rounded-xl overflow-scroll">
          <div className="bg-gray-50 border-b border-gray-200 grid grid-cols-12 gap-3 px-4 py-3">
            <div className="col-span-5 text-dashboard-title font-plus-jakarta text-sm font-bold">
              Title
            </div>
            <div className="col-span-3 text-dashboard-title font-plus-jakarta text-sm font-bold">
              Author
            </div>
            <div className="col-span-2 text-dashboard-title font-plus-jakarta text-sm font-bold">
              Status
            </div>
            <div className="col-span-2 text-dashboard-title font-plus-jakarta text-sm font-bold">
              Action
            </div>
          </div>
          {(blogs.length
            ? blogs
            : [
                {
                  id: "1",
                  title: "Sample Blog Post",
                  authorName: "Admin",
                  status: "published",
                  createdAt: new Date().toISOString(),
                },
              ]
          ).map((b, index, arr) => (
            <div
              key={b.id || b._id || index}
              className={`grid grid-cols-12 gap-3 px-4 py-3.5 items-center ${index !== arr.length - 1 ? "border-b border-gray-100" : ""}`}
            >
              <div className="col-span-5">
                <div className="text-dashboard-heading font-plus-jakarta text-sm font-bold">
                  {b.title}
                </div>
                <div className="text-dashboard-body text-xs">
                  {new Date(b.createdAt || "").toLocaleString() || ""}
                </div>
              </div>
              <div className="col-span-3 text-dashboard-body">
                {b.authorName || "-"}
              </div>
              <div className="col-span-2">
                <span
                  className={`inline-flex px-3 py-1.5 rounded-lg text-sm font-medium ${b.status === "published" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
                >
                  {b.status === "published" ? "Published" : "Draft"}
                </span>
              </div>
              <div className="col-span-2 flex items-center justify-end relative">
                <BlogRowActions
                  blog={b}
                  onEdit={(updated) =>
                    setBlogs((prev) =>
                      prev.map((x) =>
                        x._id === updated._id || x.id === updated._id
                          ? updated
                          : x,
                      ),
                    )
                  }
                  onDelete={() =>
                    setBlogs((prev) =>
                      prev.filter((x) => (x._id || x.id) !== (b._id || b.id)),
                    )
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Blog Modal */}
      {showBlogModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white rounded-xl p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-dashboard-heading font-geist text-2xl font-bold tracking-tight">
                Add New Blog
              </h2>
              <button
                onClick={() => setShowBlogModal(false)}
                className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-black hover:bg-gray-300 transition-colors"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateBlog} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-dashboard-title text-sm">Title</label>
                  <input
                    required
                    value={blogForm.title}
                    onChange={(e) =>
                      setBlogForm({ ...blogForm, title: e.target.value })
                    }
                    className="w-full px-3 py-3.5 border border-gray-400 rounded-lg text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-dashboard-title text-sm">
                    Category
                  </label>
                  <input
                    value={blogForm.category}
                    onChange={(e) =>
                      setBlogForm({ ...blogForm, category: e.target.value })
                    }
                    className="w-full px-3 py-3.5 border border-gray-400 rounded-lg text-sm focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-dashboard-title text-sm">
                    Author Name
                  </label>
                  <input
                    value={blogForm.authorName}
                    onChange={(e) =>
                      setBlogForm({ ...blogForm, authorName: e.target.value })
                    }
                    className="w-full px-3 py-3.5 border border-gray-400 rounded-lg text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-dashboard-title text-sm">
                    Author Role
                  </label>
                  <input
                    value={blogForm.authorRole}
                    onChange={(e) =>
                      setBlogForm({ ...blogForm, authorRole: e.target.value })
                    }
                    className="w-full px-3 py-3.5 border border-gray-400 rounded-lg text-sm focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-dashboard-title text-sm">
                    Cover Image URL
                  </label>
                  <input
                    value={blogForm.coverImage}
                    onChange={(e) =>
                      setBlogForm({ ...blogForm, coverImage: e.target.value })
                    }
                    className="w-full px-3 py-3.5 border border-gray-400 rounded-lg text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-dashboard-title text-sm">
                    Author Image URL
                  </label>
                  <input
                    value={blogForm.authorImg}
                    onChange={(e) =>
                      setBlogForm({ ...blogForm, authorImg: e.target.value })
                    }
                    className="w-full px-3 py-3.5 border border-gray-400 rounded-lg text-sm focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-dashboard-title text-sm">
                  Short Description
                </label>
                <textarea
                  rows={3}
                  value={blogForm.description}
                  onChange={(e) =>
                    setBlogForm({ ...blogForm, description: e.target.value })
                  }
                  className="w-full px-3 py-3.5 border border-gray-400 rounded-lg text-sm focus:outline-none"
                />
              </div>
           
               <div className="space-y-6">
                      {/* Meta Keywords */}
                      <div className="space-y-3">
                        <label className="block text-sm text-[#334054] font-plus-jakarta">
                          Meta Keywords
                        </label>
                        <input
                          type="text"
                          value={blogForm.metablogkeyword}
                          onChange={(e) =>
                            setBlogForm({ ...blogForm, metablogkeyword: e.target.value })
                          }
                          placeholder="Select"
                          className="w-full px-3 py-3.5 border border-[#B0B0B0] rounded-lg text-sm text-[#98A2B3] font-plus-jakarta focus:outline-none focus:ring-2 focus:ring-dashboard-primary focus:border-transparent"
                        />
                      </div>

                      {/* Meta Title */}
                      <div className="space-y-3">
                        <label className="block text-sm text-[#334054] font-plus-jakarta">
                          Meta Title
                        </label>
                        <input
                          type="text"
                          value={blogForm.metablogtitle}
                          onChange={(e) =>
                            setBlogForm({ ...blogForm, metablogtitle: e.target.value })
                          }
                          className="w-full px-3 py-3.5 border border-[#B0B0B0] rounded-lg text-sm text-[#717171] font-plus-jakarta focus:outline-none focus:ring-2 focus:ring-dashboard-primary focus:border-transparent"
                        />
                      </div>

                      {/* Meta Description */}
                      <div className="space-y-3">
                        <label className="block text-sm text-[#334054] font-plus-jakarta">
                          Meta Description
                        </label>
                        <textarea
                          value={blogForm.metablogdescription}
                          onChange={(e) =>
                            setBlogForm({ ...blogForm, metablogdescription: e.target.value })
                          }
                          placeholder="Write Message here..."
                          rows={5}
                          className="w-full px-3 py-3.5 border border-[#B0B0B0] rounded-lg text-sm text-[#717171] font-plus-jakarta focus:outline-none focus:ring-2 focus:ring-dashboard-primary focus:border-transparent resize-none"
                        />
                      </div>
                    </div>
             

                 <div>
                <label className="text-dashboard-title text-sm">Content</label>
                <RichTextEditor
                  value={blogForm.content}
                  onChange={(val) =>
                    setBlogForm({ ...blogForm, content: val })
                  }
                  className="w-full border-gray-400"
                  style={{ minHeight: "300px" }}
                />
              </div>
               <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBlogModal(false)}
                  className="px-5 py-2.5 border rounded-full"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-dashboard-primary text-white rounded-full"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  const renderPolicyContent = () => (
    <div className="space-y-4 flex-1">
      <div className="border border-dashboard-stroke rounded-xl bg-white p-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center max-sm:gap-0 gap-2">
            <div className="flex items-center gap-0.5 px-0.5 py-0.5 border border-gray-200 rounded-full bg-white shadow-sm">
              <button
                onClick={() => setActivePolicyTab("T&C")}
                className={`px-6 py-3 rounded-full  max-sm:text-xs max-xs:px-2 max-sm:py-1 text-sm font-semibold transition-all ${
                  activePolicyTab === "T&C"
                    ? "bg-dashboard-primary text-white"
                    : "text-dashboard-primary hover:bg-gray-50"
                }`}
              >
                T&C
              </button>
              <button
                onClick={() => setActivePolicyTab("Privacy Policy")}
                className={`px-6 py-3 rounded-full  max-sm:text-xs max-xs:px-2 max-sm:py-1 text-sm font-semibold transition-all ${
                  activePolicyTab === "Privacy Policy"
                    ? "bg-dashboard-primary text-white"
                    : "text-dashboard-primary hover:bg-gray-50"
                }`}
              >
                Privacy Policy
              </button>
              <button
                onClick={() => setActivePolicyTab("Vendor Policy")}
                className={`px-5 py-3 rounded-full  max-sm:text-xs max-xs:px-2 max-sm:py-1 text-sm font-semibold transition-all ${
                  activePolicyTab === "Vendor Policy"
                    ? "bg-dashboard-primary text-white"
                    : "text-dashboard-primary hover:bg-gray-50"
                }`}
              >
                Vendor Policy
              </button>
            </div>
          </div>
          <button
            onClick={async () => {
              try {
                let key = "";
                if (activePolicyTab === "T&C") key = "terms-and-conditions";
                else if (activePolicyTab === "Privacy Policy") key = "privacy-policy";
                else if (activePolicyTab === "Vendor Policy") key = "vendor-policy";
                
                if (key) {
                   await cmsService.updatePage(key, {
                    title: policyName,
                    sections: policySections,
                  });
                  toast.success("Policy saved successfully");
                }
              } catch (e) {
                console.error(e);
                toast.error("Failed to save policy");
              }
            }}
            className="px-5 py-2.5 bg-dashboard-primary text-white rounded-full font-geist text-sm font-medium tracking-tight hover:bg-dashboard-primary/90 transition-colors"
          >
            Save Policy
          </button>
        </div>

        <div
          className="h-px bg-dashboard-stroke mb-3"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to right, #EAECF0 0, #EAECF0 2px, transparent 2px, transparent 4px)",
          }}
        ></div>

        <div className="flex-1 flex flex-col space-y-4">
          <div className="space-y-3">
            <label className="text-dashboard-title font-plus-jakarta text-sm pl-1">
            {activePolicyTab === "T&C" && "Terms & Conditions"}  
            {activePolicyTab === "Privacy Policy" && "Privacy Policy"}  
            {activePolicyTab === "Vendor Policy" && "Vendor Policy"}  Name
            </label>
            <input
              type="text"
              placeholder={activePolicyTab === "T&C" ? "Terms & Conditions" : activePolicyTab === "Privacy Policy" ? "Privacy Policy" : "Vendor Policy"}
              value={policyName}
              onChange={(e) => setPolicyName(e.target.value)}
              className="w-full px-3 py-4 border border-dashboard-stroke rounded-lg text-sm text-gray-500 placeholder:text-gray-400 focus:outline-none focus:border-dashboard-primary"
            />
          </div>

          <div className="flex-1 flex flex-col space-y-3">
            <label className="text-dashboard-title font-plus-jakarta text-sm font-medium pl-1">
            {activePolicyTab === "T&C" && "Terms & Conditions"}  
            {activePolicyTab === "Privacy Policy" && "Privacy Policy"}  
            {activePolicyTab === "Vendor Policy" && "Vendor Policy"}  Sections
            </label>
            
            {policySections.map((section, index) => (
              <div key={index} className="border border-dashboard-stroke rounded-lg bg-dashboard-bg p-4 space-y-3">
                <div className="flex justify-between items-center">
                   <div className="flex items-center gap-2">
                     {/* <div className="w-2 h-2 rounded-full bg-dashboard-primary" /> */}
                     <span className="font-semibold text-sm">Section {index + 1}</span>
                   </div>
                   <button 
                     onClick={() => handleRemoveSection(index)}
                     className="text-red-500 hover:text-red-700"
                   >
                     <Trash2 size={16} />
                   </button>
                </div>
                <div className="pl-6 space-y-4">
                  <div className="flex items-center gap-3">
                    {/* <span className="text-gray-400">•</span> */}
                    <input
                      type="text"
                      placeholder="Section Heading"
                      value={section.heading}
                      onChange={(e) => handleSectionChange(index, "heading", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-dashboard-primary"
                    />
                  </div>
                  <div className="flex gap-3">
                    {/* <span className="text-gray-400 mt-2">•</span> */}
                    <RichTextEditor
                      value={section.content}
                      onChange={(val) => handleSectionChange(index, "content", val)}
                      className="w-full bg-white border-gray-300"
                      placeholder="Section Content..."
                      style={{ minHeight: "200px" }}
                    />
                  </div>
                </div>
              </div>
            ))}
            
            <button
              onClick={handleAddSection}
              className="mt-2 px-4 py-2 border border-dashed border-dashboard-primary text-dashboard-primary rounded-lg hover:bg-dashboard-primary/5 transition-colors text-sm"
            >
              + Add Section
            </button>
          </div>
        </div>
      </div>
    </div>
  );


  // Contact tab content: show messages list (read-only, with mark read/delete)
  // Modal: view and reply
  const [replyModal, setReplyModal] = useState<{
    open: boolean;
    item: any | null;
    subject: string;
    body: string;
  }>({ open: false, item: null, subject: "", body: "" });
  const handleContactImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await cmsService.uploadMedia({
        page: "Contact Us",
        section: "Main Image",
        file,
      });
      if (res?.data?.url) {
        setContactInfo((prev) => ({ ...prev, image: res.data.url }));
      }
    } catch (err) {
      console.error("Contact image upload failed", err);
    }
  };

  const handleSaveContactInfo = async () => {
    try {
      await cmsService.upsertContact(contactInfo);
      toast.success("Contact info saved successfully!");
    } catch (err) {
      console.error("Failed to save contact info", err);
      toast.error("Failed to save contact info");
    }
  };

  const renderContactContent = () => (
    <div className="border border-dashboard-stroke rounded-xl bg-white p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Contact Us</h3>
        <button 
          onClick={handleSaveContactInfo}
          className="px-5 py-2 bg-dashboard-primary text-white rounded-full font-geist text-sm font-medium hover:bg-dashboard-primary/90 transition-colors"
        >
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Image */}
        <div className="col-span-4">
          <div className="rounded-xl overflow-hidden border bg-gray-50 h-48 flex items-center justify-center">
            {loadingContacts ? (
              <UniqueStaysSkeleton/>
            ) :
            contactInfo.image ? (
              <img
                src={getImageUrl(contactInfo.image)}
                className="w-full h-full object-cover"
                alt="Contact Page"
              />
            ) : (
             <img
                src=" https://api.builder.io/api/v1/image/assets/TEMP/189ec32850d222d53454645d326fb969a5128f86?width=683"
                className="w-full h-full object-cover"
                alt="Contact Page"
              />
            )
            }
          </div>

          <label className="mt-3 w-full block">
            <input 
              type="file" 
              className="hidden" 
              accept="image/*"
              onChange={handleContactImageChange}
            />
            <div className="w-full bg-black text-white py-2 rounded-full text-sm text-center cursor-pointer hover:bg-gray-800">
              Change Photo
            </div>
          </label>
        </div>

        {/* Form */}
        <div className="col-span-8 grid grid-cols-12 gap-4">
          <div className="col-span-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={contactInfo.email}
              onChange={(e) => setContactInfo({...contactInfo, email: e.target.value})}
              placeholder="Enter your email"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>

          <div className="col-span-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
  <input
  type="text"
  value={contactInfo.phone}
  onChange={(e) => {
    // Remove all non-digit characters
    const onlyNums = e.target.value.replace(/\D/g, '');
    setContactInfo({ ...contactInfo, phone: onlyNums });
  }}
  placeholder="Enter phone number"
  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
/>

          </div>

          <div className="col-span-12">
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              value={contactInfo.address}
              onChange={(e) => setContactInfo({...contactInfo, address: e.target.value})}
              placeholder="Address / Locality"
              className="w-full px-3 mt-1 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>

          <div className="col-span-4">
             <input
              type="text"
              value={contactInfo.state}
              onChange={(e) => setContactInfo({...contactInfo, state: e.target.value})}
              placeholder="State"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>

          <div className="col-span-4">
            <input
              type="text"
              value={contactInfo.city}
              onChange={(e) => setContactInfo({...contactInfo, city: e.target.value})}
              placeholder="City"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>


          <div className="col-span-4">
        <input
  type="text"
  value={contactInfo.pincode}
  onChange={(e) => {
    // Remove all non-digit characters
    const onlyNums = e.target.value.replace(/\D/g, '');
    setContactInfo({ ...contactInfo, pincode: onlyNums });
  }}
  placeholder="Enter phone number"
  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
/>
          </div>
        </div>
      </div>
    </div>
  );


  const renderBrandingContent = () => (
    <div className="space-y-6 bg-white p-6 rounded-2xl border border-dashboard-stroke">
      <div className="space-y-2">
        <label className="block text-base text-[#334054] font-plus-jakarta">
          Favicon
        </label>
        {faviconUrl && (
          <img
            src={getImageUrl(faviconUrl)}
            alt="Favicon"
            className="w-10 h-10 object-contain"
          />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) =>
            handleBrandingUpload("favicon", e.target.files?.[0])
          }
        />
      </div>

      <div className="space-y-2">
        <label className="block text-base text-[#334054] font-plus-jakarta">
          Light Theme Logo (for White Background)
        </label>
        {logoUrl && (
          <img
            src={getImageUrl(logoUrl)}
            alt="Light Logo"
            className="w-20 h-10 object-contain"
          />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) =>
            handleBrandingUpload("logo", e.target.files?.[0])
          }
        />
      </div>

      <div className="space-y-2">
        <label className="block text-base text-[#334054] font-plus-jakarta">
          Dark Theme Logo (for Black Background)
        </label>
        {logoDarkUrl ? (
          <img
            src={getImageUrl(logoDarkUrl)}
            alt="Dark Theme Logo"
            className="w-20 h-10 object-contain bg-black"
          />
        ) : null}
        <input
          type="file"
          accept="image/*"
          onChange={(e) =>
            handleBrandingUpload("logo_dark", e.target.files?.[0])
          }
        />
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "Register/Login":
        return renderRegisterLoginContent();
      case "HomePage":
        return renderHomePageContent();
      case "features":
        return renderfeaturesContent();
      case "Contact Us":
        return renderContactContent();
      case "Career":
        return renderCareerContent();
      case "FAQs":
        return renderFAQsContent();
      case "Testimonials":
        return renderTestimonialsContent();
      case "Policy":
        return renderPolicyContent();
      case "Blogs":
        return renderBlogsContent();
      case "Branding":
        return renderBrandingContent();
      default:
        return (
          <div className="text-center py-12 text-dashboard-neutral-07">
            Content for {activeTab} tab will be implemented here.
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex">
      {/* Sidebar */}
      <div className="fixed">
        <AdminSidebar
          showMobileSidebar={mobileOpen}
          setShowMobileSidebar={setMobileOpen}
        />
      </div>
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-x-hidden ml-60 max-lg:ml-0">
        {/* Top Header */}
        <AdminHeader Headtitle={"CMS"} setMobileSidebarOpen={setMobileOpen} />

        {/* Main Content */}
        <div className="flex-1 pr-5 lg:pr-5">
          <div className="bg-white rounded-t-3xl border-b border-dashboard-stroke min-h-[75px] flex items-center px-5">
            <h2 className="text-dashboard-heading font-geist text-xl font-bold tracking-tight leading-tight">
              CMS
            </h2>
          </div>

          <div className="bg-white px-5 py-6 rounded-b-3xl min-h-[calc(100vh-8rem)]">
            {/* Tabs */}
            <div className="flex items-center mb-6 overflow-x-hidden  max-md:flex-wrap">
              {tabs.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 whitespace-nowrap border-b-2 transition-colors font-plus-jakarta text-sm font-bold ${
                    activeTab === tab
                      ? "border-dashboard-primary text-dashboard-heading"
                      : "border-transparent text-dashboard-neutral-06 hover:text-dashboard-heading"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Content */}
            {renderTabContent()}
          </div>
        </div>
      </div>

      <AddJobModal
        isOpen={showJobModal}
        onClose={() => setShowJobModal(false)}
        onSubmit={handleSaveJob}
        initialData={selectedJobForEdit}
      />

      <AddFAQModal
        isOpen={showFAQModal}
        onClose={() => {
          setShowFAQModal(false);
          setSelectedFAQForEdit(null);
        }}
        onSubmit={handleSaveFAQ}
        initialData={selectedFAQForEdit}
      />

      <AddFeatureModal
        isOpen={showFeatureModal}
        onClose={() => setShowFeatureModal(false)}
        onSubmit={handleAddFeature}
        type={selectedFeatureType === "selection" ? "feature" : selectedFeatureType}
      />

      <AddFeatureModal
        isOpen={showSubCategoryModal}
        onClose={() => setShowSubCategoryModal(false)}
        onSubmit={handleAddSubCategory}
        type="subcategory"
      />

      <AddRoleModal
        isOpen={showRoleModal}
        onClose={() => setShowRoleModal(false)}
        onSubmit={handleAddRole}
      />
    </div>
  );
};

export default AdminCMS;
