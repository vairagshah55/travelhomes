import React, { useEffect, useMemo, useState } from "react";
import { Edit2, MessageSquareQuote, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cmsService } from "@/services/cms";
import ConfirmModal from "@/components/shared/ConfirmModal";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import { AdminDataTable, type ColumnDef, type RowAction } from "@/components/admin/AdminDataTable";
import { AddFAQModal } from "../modals";
import { FAQ_CATEGORIES, sameFaqCategory } from "../faqCategories";
import { BTN_PRIMARY, CmsSegmented, TableFrame } from "../ui";
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
          <button onClick={openCreate} className={BTN_PRIMARY}>
            <Plus size={15} strokeWidth={2.4} />
            Add question
          </button>
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
