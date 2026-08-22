import React, { useEffect, useMemo, useState } from "react";
import { Download, Edit2, MessageSquareQuote, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { cmsService } from "@/services/cms";
import ConfirmModal from "@/components/shared/ConfirmModal";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { AdminDataTable, type ColumnDef, type RowAction } from "@/components/admin/AdminDataTable";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddFAQModal } from "../modals";
import { ImportCsvModal } from "../modals/ImportCsvModal";
import { FAQ_CATEGORIES, sameFaqCategory } from "../faqCategories";
import { downloadCsv, stampedFilename } from "../csvIo";
import {
  buildFaqImportPlan,
  FAQ_CSV_COLUMNS,
  faqsCsvTemplate,
  faqsToCsv,
  type PlannedFaqRow,
} from "../faqsIo";
import { BTN_NEUTRAL, BTN_PRIMARY, CmsSegmented, DIALOG_VARS, SELECT_ITEM, TableFrame } from "../ui";
import type { FAQ } from "../types";

/**
 * FAQ admin: one category at a time, with add / edit / delete. Self-contained —
 * owns its list, its modal and its delete confirmation.
 */
export function FAQsTab() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [category, setCategory] = useState(FAQ_CATEGORIES[0]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<FAQ | null>(null);
  const [pendingDelete, setPendingDelete] = useState<FAQ | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      setFaqs(await cmsService.getFAQs());
    } catch (e) {
      console.error(e);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Stored categories are lowercase while the rail labels are Title Case, so
  // every comparison folds case first.
  const inCategory = useMemo(
    () => faqs.filter((faq) => sameFaqCategory(faq.category, category)),
    [faqs, category],
  );

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return inCategory;
    return inCategory.filter(
      (f) =>
        (f.question || "").toLowerCase().includes(q) || (f.answer || "").toLowerCase().includes(q),
    );
  }, [inCategory, search]);

  const categoryItems = FAQ_CATEGORIES.map((cat) => ({
    value: cat,
    label: cat,
    count: faqs.filter((f) => sameFaqCategory(f.category, cat)).length,
  }));

  const handleSave = async (faqData: { category: string; question: string; answer: string }) => {
    try {
      if (editing) {
        const updated = await cmsService.updateFAQ(editing.id, faqData);
        setFaqs((prev) => prev.map((f) => (f.id === editing.id ? updated : f)));
        toast.success("FAQ updated");
      } else {
        const created = await cmsService.createFAQ(faqData);
        setFaqs((prev) => [...prev, created]);
        toast.success("FAQ added");
        // Jump to the category the new question landed in so it's visible.
        if (faqData?.category) setCategory(faqData.category);
      }
      setEditing(null);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.message || "Failed to save FAQ");
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete?.id) return;
    setDeleting(true);
    try {
      await cmsService.deleteFAQ(pendingDelete.id);
      setFaqs((prev) => prev.filter((faq) => String(faq.id) !== String(pendingDelete.id)));
      toast.success("FAQ deleted");
      setPendingDelete(null);
    } catch {
      toast.error("Failed to delete FAQ");
    } finally {
      setDeleting(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    setShowModal(true);
  };

  /**
   * Export either the open category or the whole help centre.
   *
   * Two options because the tab only ever shows one category: "export" with no
   * choice would silently mean one of them, and whichever it meant would be
   * wrong half the time.
   */
  const handleExport = (scope: "category" | "all") => {
    const rows = scope === "all" ? faqs : visible;
    if (!rows.length) {
      toast.error("Nothing to export");
      return;
    }
    downloadCsv(
      stampedFilename(scope === "all" ? "faqs-all" : `faqs-${category}`, new Date()),
      faqsToCsv(rows),
    );
    toast.success(`Exported ${rows.length} question${rows.length === 1 ? "" : "s"}`);
  };

  /**
   * Apply one planned row. Per-record because the API has no bulk endpoint.
   *
   * `createFAQ` sends exactly the three fields `cms.dto.faqBody` accepts — it's
   * `.strict()`, so anything extra is a 400.
   */
  const applyImportRow = async (row: PlannedFaqRow) => {
    const payload = { category: row.category, question: row.question, answer: row.answer };
    if (row.existing) {
      const updated = await cmsService.updateFAQ(row.existing.id, payload);
      setFaqs((prev) => prev.map((f) => (f.id === row.existing!.id ? updated : f)));
      return;
    }
    const created = await cmsService.createFAQ(payload);
    setFaqs((prev) => [...prev, created]);
  };

  const columns: ColumnDef<FAQ>[] = [
    {
      key: "sl",
      header: "#",
      className: "w-14",
      cell: (_f, index) => <span className="tabular-nums text-app-fg-muted">{index + 1}</span>,
    },
    {
      key: "question",
      header: "Question",
      cell: (f) => <span className="font-semibold text-app-fg">{f.question}</span>,
    },
    {
      key: "answer",
      header: "Answer",
      hideBelow: "lg",
      cell: (f) => (
        <p className="max-w-[420px] text-app-fg-muted line-clamp-2 leading-relaxed">{f.answer}</p>
      ),
    },
  ];

  const rowActions: RowAction<FAQ>[] = [
    {
      label: "Edit",
      icon: Edit2,
      onClick: (f) => {
        setEditing(f);
        setShowModal(true);
      },
    },
    { label: "Delete", icon: Trash2, variant: "danger", onClick: (f) => setPendingDelete(f) },
  ];

  return (
    <div className="space-y-4">
      <CmsSegmented
        items={categoryItems}
        value={category}
        onChange={setCategory}
        layoutId="cmsFaqCategoryPill"
        ariaLabel="FAQ category"
      />

      <AdminToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search questions…"
        primaryAction={
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={BTN_NEUTRAL} title="Download questions as a CSV">
                  <Download size={15} strokeWidth={2.4} />
                  <span className="max-sm:sr-only">Export</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" style={DIALOG_VARS} className="w-72">
                <DropdownMenuItem className={SELECT_ITEM} onSelect={() => handleExport("category")}>
                  <div>
                    <p className="font-semibold">Export “{category}”</p>
                    <p className="mt-0.5 text-[11.5px] text-app-fg-muted">
                      Just the {visible.length} question{visible.length === 1 ? "" : "s"} listed
                      below.
                    </p>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem className={SELECT_ITEM} onSelect={() => handleExport("all")}>
                  <div>
                    <p className="font-semibold">Export all categories</p>
                    <p className="mt-0.5 text-[11.5px] text-app-fg-muted">
                      The whole help centre — {faqs.length} question{faqs.length === 1 ? "" : "s"}.
                    </p>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <button
              onClick={() => setShowImport(true)}
              className={BTN_NEUTRAL}
              title="Add or update questions from a CSV"
            >
              <Upload size={15} strokeWidth={2.4} />
              <span className="max-sm:sr-only">Import</span>
            </button>
            <button onClick={openCreate} className={BTN_PRIMARY}>
              <Plus size={15} strokeWidth={2.4} />
              Add question
            </button>
          </div>
        }
      />

      <TableFrame>
        <AdminDataTable<FAQ>
          columns={columns}
          data={visible}
          isLoading={loading}
          isError={error}
          errorMessage="Could not load the FAQ list."
          onRetry={load}
          hasActiveQuery={!!search.trim()}
          emptyIcon={MessageSquareQuote}
          emptyTitle={`No questions in “${category}”`}
          emptyDescription="Add the first question for this category."
          emptyAction={{ label: "Add question", onClick: openCreate }}
          noResultsDescription="No question in this category matches your search."
          noResultsAction={{ label: "Clear search", onClick: () => setSearch("") }}
          rowActions={rowActions}
        />
      </TableFrame>

      <AddFAQModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditing(null);
        }}
        onSubmit={handleSave}
        initialData={editing}
      />

      <ImportCsvModal<PlannedFaqRow>
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        title="Import FAQs"
        description="Adds new questions and updates existing ones, across every category. Nothing is deleted."
        columns={FAQ_CSV_COLUMNS}
        rowNoun="question"
        guidance={
          <>
            <p>
              <span className="font-semibold text-app-fg">category</span>,{" "}
              <span className="font-semibold text-app-fg">question</span> and{" "}
              <span className="font-semibold text-app-fg">answer</span> are all required. Column
              order doesn't matter.
            </p>
            <p>
              Each row lands in the category its own column names, so one file can load the whole
              help centre. The category must be one of: {FAQ_CATEGORIES.join(", ")}.
            </p>
            <p>
              Rows match existing questions by <span className="font-semibold text-app-fg">id</span>,
              then by category + question — so the same question can exist under two categories
              without them merging, and re-importing an export updates in place.
            </p>
          </>
        }
        buildPlan={(text) => buildFaqImportPlan(text, faqs)}
        onApplyRow={applyImportRow}
        onDone={({ created, updated, failed }) => {
          if (failed === 0) toast.success(`Imported ${created + updated} questions`);
          else toast.error(`${failed} row${failed === 1 ? "" : "s"} could not be saved`);
          void load();
        }}
        onDownloadTemplate={() =>
          downloadCsv(stampedFilename("faqs-template", new Date()), faqsCsvTemplate())
        }
        renderRowMeta={(row) => row.category}
      />

      <ConfirmModal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        isLoading={deleting}
        title="Delete question"
        description={
          pendingDelete ? `Delete “${pendingDelete.question}”? This cannot be undone.` : ""
        }
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}

export default FAQsTab;
