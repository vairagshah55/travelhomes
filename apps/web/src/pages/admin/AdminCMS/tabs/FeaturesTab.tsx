import React, { useEffect, useMemo, useState } from "react";
import { LayoutGrid, ListTree, Pencil, Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cmsService } from "@/services/cms";
import ConfirmModal from "@/components/shared/ConfirmModal";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { AdminDataTable, type ColumnDef, type RowAction } from "@/components/admin/AdminDataTable";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AddFeatureModal } from "../modals";
import {
  BTN_PRIMARY,
  CmsField,
  CmsSegmented,
  DIALOG_VARS,
  SELECT_ITEM,
  TableFrame,
  Thumb,
} from "../ui";
import type { Feature } from "../types";

type FeatureType = "feature" | "category" | "selection";
type OfferingCategory = "Camper Van" | "Unique Stay" | "Activity";

const OFFERING_CATEGORIES: OfferingCategory[] = ["Camper Van", "Unique Stay", "Activity"];

const withId = (d: any): Feature => ({ ...d, id: d.id || d._id });

/**
 * Features admin: three modes (Features / Categories / Category selection)
 * crossed with the three offering categories. "Category selection" is
 * Unique-Stay-only and manages sub-categories under a chosen property type.
 *
 * Self-contained — owns both lists, both modals and all CRUD.
 */
export function FeaturesTab() {
  const [offeringCategory, setOfferingCategory] = useState<OfferingCategory>("Camper Van");
  const [featureType, setFeatureType] = useState<FeatureType>("feature");

  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Feature | null>(null);
  const [deleting, setDeleting] = useState(false);
  // Non-null → the open modal is editing this row instead of creating one.
  const [editing, setEditing] = useState<Feature | null>(null);

  const [stayPropertyTypes, setStayPropertyTypes] = useState<Feature[]>([]);
  const [staySubCategories, setStaySubCategories] = useState<Feature[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);
  const [selectedStayProperty, setSelectedStayProperty] = useState<string>("");
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);

  const loadFeatures = () => {
    setLoading(true);
    setError(false);
    cmsService
      .getFeatures(offeringCategory, featureType)
      .then((res: any) => setFeatures((res.data || []).map(withId)))
      .catch((e) => {
        console.error(e);
        setError(true);
      })
      .finally(() => setLoading(false));
  };

  useEffect(loadFeatures, [offeringCategory, featureType]);

  // Property types are the Unique-Stay "category" features. Deliberately not
  // keyed on selectedStayProperty — this effect *sets* it, and re-running on its
  // own output would refetch the list on every selector change.
  useEffect(() => {
    if (featureType !== "selection") return;
    cmsService
      .getFeatures("Unique Stay", "category")
      .then((res: any) => {
        const list = Array.isArray(res) ? res : res.data || [];
        const normalized = list.map(withId);
        setStayPropertyTypes(normalized);
        setSelectedStayProperty((current) => {
          if (current && normalized.some((p: Feature) => p.id === current)) return current;
          return normalized[0]?.id || "";
        });
      })
      .catch(console.error);
  }, [featureType]);

  const loadSubCategories = async (propertyId: string) => {
    setLoadingSubs(true);
    try {
      const res: any = await cmsService.getFeatures(propertyId, "subcategory");
      const list = Array.isArray(res) ? res : res.data || [];
      setStaySubCategories(list.map(withId));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSubs(false);
    }
  };

  useEffect(() => {
    if (featureType !== "selection" || !selectedStayProperty) return;
    loadSubCategories(selectedStayProperty);
  }, [featureType, selectedStayProperty]);

  useEffect(() => {
    setSearch("");
  }, [featureType, offeringCategory]);

  const toggleStatus = async (feature: Feature) => {
    setBusyId(feature.id);
    try {
      const res: any = await cmsService.toggleFeature(feature.id);
      const updated = withId(res.data || res);
      setFeatures((prev) => prev.map((f) => (f.id === feature.id ? updated : f)));
    } catch (e) {
      console.error(e);
      toast.error("Failed to change status");
    } finally {
      setBusyId(null);
    }
  };

  const handleAdd = async (data: any) => {
    if (editing) return handleUpdate(data);
    try {
      const res: any = await cmsService.createFeature({
        ...data,
        category: offeringCategory,
        type: featureType,
      });
      setFeatures((prev) => [...prev, withId(res.data || res)]);
      toast.success(featureType === "category" ? "Category added" : "Feature added");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Failed to add");
    }
  };

  // Edit path for both the feature/category list and the sub-category list —
  // the row already knows which one it came from, so `editing.id` is enough.
  const handleUpdate = async (data: any) => {
    if (!editing) return;
    const id = editing.id;
    const isSubCategory = featureType === "selection";
    try {
      const res: any = await cmsService.updateFeature(id, {
        name: data.name,
        icon: data.icon,
        // Only categories expose a description field in the modal; sending it
        // for a feature would blank whatever an earlier category edit stored.
        ...(featureType === "category" ? { description: data.description || "" } : {}),
      });
      const updated = withId(res.data || res);
      const patch = (prev: Feature[]) => prev.map((f) => (f.id === id ? updated : f));
      if (isSubCategory) setStaySubCategories(patch);
      else setFeatures(patch);
      toast.success("Saved");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Failed to save");
    }
  };

  const handleAddSubCategory = async (data: any) => {
    if (editing) return handleUpdate(data);
    try {
      await cmsService.createFeature({
        name: data.name,
        icon: data.icon,
        category: selectedStayProperty,
        type: "subcategory",
      });
      await loadSubCategories(selectedStayProperty);
      toast.success("Sub-category added");
    } catch (e: any) {
      console.error(e);
      toast.error(e.response?.data?.message || e.message || "Failed to add sub-category");
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    const isSubCategory = featureType === "selection";
    setDeleting(true);
    try {
      await cmsService.deleteFeature(id);
      if (isSubCategory) {
        setStaySubCategories((prev) => prev.filter((f) => f.id !== id));
      } else {
        setFeatures((prev) => prev.filter((f) => f.id !== id));
      }
      toast.success("Deleted");
      setPendingDelete(null);
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  const isCategoryMode = featureType === "category";
  const isSelectionMode = featureType === "selection";

  const visibleFeatures = useMemo(() => {
    const rows = isSelectionMode ? staySubCategories : features;
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((f) =>
      [f.name, f.description, f.category].some((v) => (v || "").toLowerCase().includes(q)),
    );
  }, [features, staySubCategories, isSelectionMode, search]);

  const nameCell = (f: Feature) => (
    <div className="flex items-center gap-3 min-w-0">
      <Thumb src={f.icon} className="w-9 h-9" imgClassName="object-contain p-1" />
      <span className="font-semibold text-app-fg truncate">{f.name}</span>
    </div>
  );

  const columns: ColumnDef<Feature>[] = isSelectionMode
    ? [{ key: "name", header: "Category name", cell: nameCell }]
    : [
        { key: "name", header: isCategoryMode ? "Category name" : "Feature name", cell: nameCell },
        ...(isCategoryMode
          ? [
              {
                key: "description",
                header: "Description",
                hideBelow: "lg" as const,
                cell: (f: Feature) => (
                  <p className="max-w-[320px] text-app-fg-muted line-clamp-2 leading-relaxed">
                    {f.description || "—"}
                  </p>
                ),
              },
            ]
          : []),
        {
          key: "category",
          header: "Applies to",
          className: "w-36",
          hideBelow: "md",
          cell: (f) => <span className="text-app-fg-muted">{f.category}</span>,
        },
        {
          key: "status",
          header: "Shown to vendors",
          className: "w-40",
          cell: (f) => (
            <Switch
              checked={f.status === "enable"}
              onCheckedChange={() => toggleStatus(f)}
              disabled={busyId === f.id}
              aria-label={`${f.status === "enable" ? "Disable" : "Enable"} ${f.name}`}
              onClick={(e) => e.stopPropagation()}
            />
          ),
        },
      ];

  const addLabel = isCategoryMode ? "category" : isSelectionMode ? "sub-category" : "feature";

  const openAdd = () => {
    setEditing(null);
    if (isSelectionMode) {
      if (!selectedStayProperty) {
        toast.error("Pick a property type first");
        return;
      }
      setShowSubCategoryModal(true);
      return;
    }
    setShowFeatureModal(true);
  };

  const openEdit = (f: Feature) => {
    setEditing(f);
    if (isSelectionMode) setShowSubCategoryModal(true);
    else setShowFeatureModal(true);
  };

  const closeModals = () => {
    setShowFeatureModal(false);
    setShowSubCategoryModal(false);
    setEditing(null);
  };

  const rowActions: RowAction<Feature>[] = [
    { label: "Edit", icon: Pencil, onClick: openEdit },
    { label: "Delete", icon: Trash2, variant: "danger", onClick: (f) => setPendingDelete(f) },
  ];

  const modeItems = [
    { value: "feature" as const, label: "Features", icon: Sparkles },
    { value: "category" as const, label: "Categories", icon: LayoutGrid },
    ...(offeringCategory === "Unique Stay"
      ? [{ value: "selection" as const, label: "Category selection", icon: ListTree }]
      : []),
  ];

  const propertyName =
    stayPropertyTypes.find((p) => p.id === selectedStayProperty)?.name || "this property type";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <CmsSegmented
          items={OFFERING_CATEGORIES.map((cat) => ({ value: cat, label: cat }))}
          value={offeringCategory}
          onChange={(cat) => {
            setOfferingCategory(cat);
            if (cat !== "Unique Stay" && featureType === "selection") setFeatureType("feature");
          }}
          layoutId="cmsFeatureOfferingPill"
          ariaLabel="Offering type"
        />
        <CmsSegmented
          items={modeItems}
          value={featureType}
          onChange={setFeatureType}
          layoutId="cmsFeatureModePill"
          ariaLabel="Feature list"
        />
      </div>

      {isSelectionMode && (
        <CmsField label="Property type" className="max-w-sm">
          {stayPropertyTypes.length > 0 ? (
            <Select value={selectedStayProperty} onValueChange={setSelectedStayProperty}>
              <SelectTrigger className="h-11 rounded-xl border-app-border bg-app-surface-2 text-[13.5px]">
                <SelectValue placeholder="Select a property type" />
              </SelectTrigger>
              <SelectContent style={DIALOG_VARS}>
                {stayPropertyTypes.map((p) => (
                  <SelectItem key={p.id} value={p.id} className={SELECT_ITEM}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-[12.5px] text-app-fg-muted">
              No Unique Stay categories yet — add one under “Categories” first.
            </p>
          )}
        </CmsField>
      )}

      <AdminToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={`Search ${addLabel === "sub-category" ? "sub-categories" : addLabel + "s"}…`}
        primaryAction={
          <button onClick={openAdd} className={BTN_PRIMARY}>
            <Plus size={15} strokeWidth={2.4} />
            Add {addLabel}
          </button>
        }
      />

      <TableFrame>
        <AdminDataTable<Feature>
          columns={columns}
          data={visibleFeatures}
          isLoading={isSelectionMode ? loadingSubs : loading}
          isError={!isSelectionMode && error}
          errorMessage="Could not load this list."
          onRetry={loadFeatures}
          hasActiveQuery={!!search.trim()}
          emptyIcon={isSelectionMode ? ListTree : isCategoryMode ? LayoutGrid : Sparkles}
          emptyTitle={
            isSelectionMode
              ? `No sub-categories for ${propertyName}`
              : `No ${addLabel}s for ${offeringCategory}`
          }
          emptyDescription={`Add the first ${addLabel} — vendors see it while creating a listing.`}
          emptyAction={{ label: `Add ${addLabel}`, onClick: openAdd }}
          noResultsDescription="Nothing here matches your search."
          noResultsAction={{ label: "Clear search", onClick: () => setSearch("") }}
          rowActions={rowActions}
          rowBusy={(f) => busyId === f.id}
        />
      </TableFrame>

      <AddFeatureModal
        isOpen={showFeatureModal}
        onClose={closeModals}
        onSubmit={handleAdd}
        type={isSelectionMode ? "feature" : featureType}
        initialData={editing}
      />

      <AddFeatureModal
        isOpen={showSubCategoryModal}
        onClose={closeModals}
        onSubmit={handleAddSubCategory}
        type="subcategory"
        initialData={editing}
      />

      <ConfirmModal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        isLoading={deleting}
        title={`Delete ${addLabel}`}
        description={
          pendingDelete
            ? `Delete “${pendingDelete.name}”? Listings already using it keep their saved value.`
            : ""
        }
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}

export default FeaturesTab;
