import React, { useEffect, useMemo, useState } from "react";
import {
  Download,
  LayoutGrid,
  ListTree,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getImageUrl } from "@/lib/adminUtils";
import { cn } from "@/lib/utils";
import { FeatureIcon, isLucideIcon } from "@/components/features/featureIcons";
import { AddFeatureModal, ImportFeaturesModal } from "../modals";
import {
  dataUrlToFile,
  downloadCsv,
  exportFilename,
  fetchIconAsDataUrl,
  toCsv,
  type PlannedRow,
} from "../featuresIo";
import {
  BTN_NEUTRAL,
  BTN_PRIMARY,
  CmsField,
  CmsSegmented,
  DIALOG_VARS,
  SELECT_ITEM,
  TableFrame,
} from "../ui";
import type { Feature } from "../types";

type FeatureType = "feature" | "category" | "selection";
type OfferingCategory = "Camper Van" | "Unique Stay" | "Activity" | "Vehicle Rental";

const OFFERING_CATEGORIES: OfferingCategory[] = [
  "Camper Van",
  "Unique Stay",
  "Activity",
  "Vehicle Rental",
];

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
  const [showImport, setShowImport] = useState(false);
  const [exporting, setExporting] = useState(false);

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

  /* `FeatureIcon` rather than `Thumb`: no row in the database has an uploaded
     icon, so Thumb rendered the same grey placeholder square 50 times. This
     falls back to an icon inferred from the feature's own name, which is what
     vendors will see too. */
  const nameCell = (f: Feature) => (
    <div className="flex items-center gap-3 min-w-0">
      <span
        className={cn(
          "grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border border-app-border bg-app-surface-2",
          isLucideIcon(f.icon) || !f.icon ? "text-app-accent" : "",
        )}
      >
        <FeatureIcon icon={f.icon} name={f.name} size={17} />
      </span>
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

  /* ── CSV import / export ────────────────────────────────────────────────
     Both act on the list currently on screen: the selected offering category
     crossed with the selected mode (and, in selection mode, the chosen property
     type). Scoping them to the visible tab is what makes the round-trip
     predictable — export, edit in a spreadsheet, import back into the same
     place. */

  /** Values a create/update must carry, whichever tab is open. */
  const ioTarget = isSelectionMode
    ? { category: selectedStayProperty, type: "subcategory" }
    : { category: offeringCategory, type: featureType };

  /**
   * @param withIcons Inlines each row's icon image as a data URL so the file is
   *   self-contained and can be imported into another environment. Off by
   *   default: base64 turns a readable spreadsheet into multi-kilobyte cells,
   *   and the plain `icon` path already round-trips fine within one environment.
   */
  const handleExport = async (withIcons: boolean) => {
    if (!visibleFeatures.length) {
      toast.error("Nothing to export in this list");
      return;
    }

    let iconData: Map<string, string> | undefined;
    let skipped = 0;

    if (withIcons) {
      /* `lucide:` tokens are skipped, not fetched: they're already portable
         across environments — that's the whole point of storing a token rather
         than an upload path — and `getImageUrl("lucide:wifi")` would just build
         a nonsense URL, fail, and get miscounted as an unreadable icon. */
      const withIcon = visibleFeatures.filter((f) => f.icon && !isLucideIcon(f.icon));
      setExporting(true);
      try {
        iconData = new Map();
        const results = await Promise.all(
          withIcon.map(async (f) => [f.id, await fetchIconAsDataUrl(getImageUrl(f.icon))] as const),
        );
        for (const [id, data] of results) {
          if (data) iconData.set(id, data);
          else skipped++;
        }
      } finally {
        setExporting(false);
      }
    }

    downloadCsv(
      exportFilename(isSelectionMode ? propertyName : offeringCategory, addLabel, new Date()),
      toCsv(visibleFeatures, iconData),
    );

    // Say the number, because an active search narrows what gets exported.
    const n = visibleFeatures.length;
    toast.success(
      `Exported ${n} ${n === 1 ? "row" : "rows"}${search.trim() ? " matching your search" : ""}` +
        (withIcons ? ` · ${iconData?.size ?? 0} icons embedded` : "") +
        (skipped ? ` · ${skipped} icon${skipped === 1 ? "" : "s"} too large or unreadable` : ""),
    );
  };

  /**
   * Apply one planned row. Per-record because the API has no bulk endpoint.
   *
   * Empty cells never clear an existing value — a CSV that omits the icon or
   * description column would otherwise silently wipe both on every row it
   * touches. Import sets what it's given and leaves the rest alone; clearing a
   * field stays an explicit edit in the UI.
   */
  const applyImportRow = async (row: PlannedRow) => {
    // An embedded image is uploaded first and its new path wins: a path copied
    // from another environment points at an upload that doesn't exist here.
    let iconPath = row.icon;
    if (row.iconData) {
      const file = dataUrlToFile(row.iconData, `feature-${row.name}`.slice(0, 60));
      if (file) {
        const up: any = await cmsService.uploadMedia({
          page: "features",
          section: "Features",
          file,
        });
        if (up?.data?.url) iconPath = up.data.url;
      }
    }

    const payloadExtras = {
      ...(iconPath ? { icon: iconPath } : {}),
      ...(row.description ? { description: row.description } : {}),
    };

    if (row.action === "create") {
      const res: any = await cmsService.createFeature({
        name: row.name,
        category: ioTarget.category,
        type: ioTarget.type,
        ...payloadExtras,
      });
      // The server forces `status: "enable"` on create, so a row that asked to
      // be disabled needs the toggle afterwards.
      if (row.status === "disable") {
        await cmsService.toggleFeature(withId(res.data || res).id);
      }
      return;
    }

    if (row.existing) {
      await cmsService.updateFeature(row.existing.id, { name: row.name, ...payloadExtras });
      if (row.existing.status !== row.status) {
        await cmsService.toggleFeature(row.existing.id);
      }
    }
  };

  const handleImportDone = ({ created, updated, failed }: { created: number; updated: number; failed: number }) => {
    // Refetch rather than patching local state — a run can touch dozens of rows
    // and the server is the only thing that knows the final shape of each.
    if (isSelectionMode) {
      if (selectedStayProperty) void loadSubCategories(selectedStayProperty);
    } else {
      loadFeatures();
    }
    if (failed === 0) toast.success(`Imported ${created + updated} rows`);
    else toast.error(`${failed} of ${created + updated + failed} rows could not be saved`);
  };

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
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={BTN_NEUTRAL}
                  disabled={exporting}
                  title="Download this list as a CSV"
                >
                  <Download size={15} strokeWidth={2.4} />
                  <span className="max-sm:sr-only">{exporting ? "Preparing…" : "Export"}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" style={DIALOG_VARS} className="w-72">
                <DropdownMenuItem
                  className={SELECT_ITEM}
                  onSelect={() => void handleExport(false)}
                >
                  <div>
                    <p className="font-semibold">Export CSV</p>
                    <p className="mt-0.5 text-[11.5px] text-app-fg-muted">
                      Spreadsheet-friendly. Icons stay as paths.
                    </p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem className={SELECT_ITEM} onSelect={() => void handleExport(true)}>
                  <div>
                    <p className="font-semibold">Export CSV with icons</p>
                    <p className="mt-0.5 text-[11.5px] text-app-fg-muted">
                      Embeds the icon images, so it imports into another environment intact.
                    </p>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              onClick={() => setShowImport(true)}
              className={BTN_NEUTRAL}
              title="Add or update rows from a CSV"
            >
              <Upload size={15} strokeWidth={2.4} />
              <span className="max-sm:sr-only">Import</span>
            </button>
            <button onClick={openAdd} className={BTN_PRIMARY}>
              <Plus size={15} strokeWidth={2.4} />
              Add {addLabel}
            </button>
          </div>
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

      <ImportFeaturesModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        /* Matching runs against the whole current list, not `visibleFeatures` —
           otherwise an active search would hide a row and the importer would
           create a duplicate of something already there. */
        existing={isSelectionMode ? staySubCategories : features}
        target={{
          category: ioTarget.category,
          type: ioTarget.type,
          label: addLabel === "sub-category" ? "sub-categories" : `${addLabel}s`,
          categoryLabel: isSelectionMode ? propertyName : offeringCategory,
        }}
        onApplyRow={applyImportRow}
        onDone={handleImportDone}
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
