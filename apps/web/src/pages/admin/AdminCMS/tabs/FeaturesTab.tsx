import React, { useEffect, useState } from "react";
import { Trash2, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { cmsService } from "@/services/cms";
import { getImageUrl } from "@/lib/adminUtils";
import { AddFeatureModal } from "../modals";
import type { Feature } from "../types";

type FeatureType = "feature" | "category" | "selection";
type OfferingCategory = "Camper Van" | "Unique Stay" | "Activity";

const OFFERING_CATEGORIES: OfferingCategory[] = ["Camper Van", "Unique Stay", "Activity"];

/**
 * Features admin: three modes (Features/Categories/Selection) crossed with
 * three offering categories. The "Selection" mode is Unique-Stay-only and
 * manages sub-categories under a chosen property type.
 *
 * Self-contained — owns features list, sub-categories, both modals,
 * click-outside handler, and all CRUD. Parent renders <FeaturesTab />.
 */
export function FeaturesTab() {
  const [offeringCategory, setOfferingCategory] = useState<OfferingCategory>("Camper Van");
  const [featureType, setFeatureType] = useState<FeatureType>("feature");
  const [features, setFeatures] = useState<Feature[]>([]);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showFeatureModal, setShowFeatureModal] = useState(false);

  const [stayPropertyTypes, setStayPropertyTypes] = useState<Feature[]>([]);
  const [staySubCategories, setStaySubCategories] = useState<Feature[]>([]);
  const [selectedStayProperty, setSelectedStayProperty] = useState<string>("");
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);

  useEffect(() => {
    cmsService
      .getFeatures(offeringCategory, featureType)
      .then((res: any) => setFeatures(res.data))
      .catch(console.error);
  }, [offeringCategory, featureType]);

  useEffect(() => {
    if (featureType !== "selection") return;
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
  }, [featureType, selectedStayProperty]);

  useEffect(() => {
    if (featureType !== "selection" || !selectedStayProperty) return;
    cmsService
      .getFeatures(selectedStayProperty, "subcategory")
      .then((res: any) => {
        const list = Array.isArray(res) ? res : res.data || [];
        setStaySubCategories(list.map((d: any) => ({ ...d, id: d.id || d._id })));
      })
      .catch(console.error);
  }, [featureType, selectedStayProperty]);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest(".action-menu-container")) setOpenMenuId(null);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const toggleStatus = async (id: string) => {
    try {
      const res = await cmsService.toggleFeature(id);
      const updated = res.data || res;
      const normalized = { ...updated, id: updated.id || updated._id };
      setFeatures((prev) => prev.map((f) => (f.id === id ? normalized : f)));
    } catch (e) {
      console.error(e);
    }
  };

  const handleAdd = async (data: any) => {
    try {
      const res = await cmsService.createFeature({
        ...data,
        category: offeringCategory,
        type: featureType,
      });
      const created = res.data || res;
      setFeatures((prev) => [...prev, { ...created, id: created.id || created._id }]);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await cmsService.deleteFeature(id);
      setFeatures((prev) => prev.filter((f) => f.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

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
      toast.error(
        `Failed to add sub-category: ${e.response?.data?.message || e.message || "Unknown error"}`,
      );
    }
  };

  const deleteSubCategory = async (id: string) => {
    if (!confirm("Delete this category?")) return;
    await cmsService.deleteFeature(id);
    setStaySubCategories((prev) => prev.filter((f) => f.id !== id));
  };

  const addBtnLabel =
    featureType === "category"
      ? "Category"
      : featureType === "selection"
        ? "Sub-Category"
        : "Feature";

  return (
    <div className="space-y-4">
      <div className="border border-dashboard-stroke rounded-xl bg-white p-4">
        <div className="flex justify-center mb-6">
          <div className="inline-flex bg-gray-100 p-1 rounded-full">
            <button
              onClick={() => setFeatureType("feature")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                featureType === "feature"
                  ? "bg-white shadow-sm text-dashboard-primary"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Features (Amenities)
            </button>
            <button
              onClick={() => setFeatureType("category")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                featureType === "category"
                  ? "bg-white shadow-sm text-dashboard-primary"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              Categories (Types)
            </button>
            {offeringCategory === "Unique Stay" && (
              <button
                onClick={() => setFeatureType("selection")}
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                  featureType === "selection"
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
              {OFFERING_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setOfferingCategory(cat);
                    if (cat !== "Unique Stay" && featureType === "selection") {
                      setFeatureType("feature");
                    }
                  }}
                  className={`px-5 py-3 rounded-full whitespace-nowrap text-sm font-semibold transition-all ${
                    offeringCategory === cat
                      ? "bg-dashboard-primary text-black"
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
              if (featureType === "selection") {
                if (!selectedStayProperty) {
                  toast.error("Please select a property type first");
                  return;
                }
                setShowSubCategoryModal(true);
              } else {
                setShowFeatureModal(true);
              }
            }}
            className="px-5 py-2.5 bg-dashboard-primary text-black rounded-full font-geist text-sm font-medium tracking-tight hover:bg-dashboard-primary/90 transition-colors"
          >
            + Add {addBtnLabel}
          </button>
        </div>

        <div
          className="h-px bg-dashboard-stroke mb-3"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to right, #EAECF0 0, #EAECF0 2px, transparent 2px, transparent 4px)",
          }}
        />

        {featureType === "selection" ? (
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
                    index !== staySubCategories.length - 1 ? "border-b border-gray-100" : ""
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
                      onClick={() => deleteSubCategory(feature.id)}
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
              <div
                className={`${featureType === "category" ? "col-span-3" : "col-span-5"} text-dashboard-title font-plus-jakarta text-sm font-bold`}
              >
                {featureType === "category" ? "Category Name" : "Feature Name"}
              </div>
              {featureType === "category" && (
                <div className="col-span-4 text-dashboard-title font-plus-jakarta text-sm font-bold">
                  Description
                </div>
              )}
              <div
                className={`${featureType === "category" ? "col-span-2" : "col-span-3"} text-dashboard-title font-plus-jakarta text-sm font-bold`}
              >
                Parent Category
              </div>
              <div className="col-span-2 text-dashboard-title font-plus-jakarta text-sm font-bold">
                Status
              </div>
              <div
                className={`${featureType === "category" ? "col-span-1" : "col-span-2"} text-dashboard-title font-plus-jakarta text-sm font-bold`}
              >
                Action
              </div>
            </div>

            {features.length > 0 ? (
              features.map((feature, index) => (
                <div
                  key={feature.id}
                  className={`grid grid-cols-12 gap-3 px-4 py-3.5 items-center ${
                    index !== features.length - 1 ? "border-b border-gray-100" : ""
                  }`}
                >
                  <div
                    className={`${featureType === "category" ? "col-span-3" : "col-span-5"} flex items-center gap-3`}
                  >
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
                  {featureType === "category" && (
                    <div
                      className="col-span-4 text-dashboard-body font-poppins text-sm truncate"
                      title={feature.description}
                    >
                      {feature.description || "-"}
                    </div>
                  )}
                  <div className={`${featureType === "category" ? "col-span-2" : "col-span-3"}`}>
                    <div className="text-dashboard-body font-poppins text-sm">
                      {feature.category}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <button
                      onClick={() => toggleStatus(feature.id)}
                      className={`w-9 h-5 rounded-full transition-colors relative ${
                        feature.status === "enable" ? "bg-dashboard-blue-600" : "bg-gray-300"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 bg-white rounded-full shadow transition-transform absolute top-0.5 ${
                          feature.status === "enable" ? "translate-x-4" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>
                  <div
                    className={`${featureType === "category" ? "col-span-1" : "col-span-2"} flex items-center justify-center relative action-menu-container`}
                  >
                    <button
                      onClick={() => setOpenMenuId(openMenuId === feature.id ? null : feature.id)}
                      className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <MoreHorizontal size={20} className="text-dashboard-body" />
                    </button>
                    {openMenuId === feature.id && (
                      <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-dashboard-stroke rounded-lg shadow-lg z-50 py-1">
                        <button
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this feature?")) {
                              handleDelete(feature.id);
                            }
                            setOpenMenuId(null);
                          }}
                          className="flex items-center gap-3 w-full px-3 py-3 text-left hover:bg-gray-50 transition-colors"
                        >
                          <Trash2 size={18} className="text-red-600" />
                          <span className="text-red-600 font-poppins text-sm">Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                No {featureType === "category" ? "categories" : "features"} found for{" "}
                {offeringCategory}
              </div>
            )}
          </div>
        )}
      </div>

      <AddFeatureModal
        isOpen={showFeatureModal}
        onClose={() => setShowFeatureModal(false)}
        onSubmit={handleAdd}
        type={featureType === "selection" ? "feature" : featureType}
      />

      <AddFeatureModal
        isOpen={showSubCategoryModal}
        onClose={() => setShowSubCategoryModal(false)}
        onSubmit={handleAddSubCategory}
        type="subcategory"
      />
    </div>
  );
}

export default FeaturesTab;
