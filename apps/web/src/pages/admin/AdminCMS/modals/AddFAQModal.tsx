import React, { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BTN_NEUTRAL,
  BTN_PRIMARY,
  CmsField,
  CONTROL,
  DIALOG_VARS,
  SELECT_ITEM,
  TEXTAREA,
} from "../ui";
import { FAQ_CATEGORIES, canonicalFaqCategory } from "../faqCategories";
import type { AddFAQModalProps } from "../types";

const EMPTY = { category: "", question: "", answer: "" };

export const AddFAQModal: React.FC<AddFAQModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState(EMPTY);

  useEffect(() => {
    if (initialData) {
      setFormData({
        // Bind the matching label so the select resolves — stored categories are
        // lowercase and would otherwise leave it blank.
        category: canonicalFaqCategory(initialData.category) || initialData.category || "",
        question: initialData.question,
        answer: initialData.answer,
      });
    } else {
      setFormData(EMPTY);
    }
  }, [initialData, isOpen]);

  // An off-list stored category (API-created rows) still has to be selectable,
  // otherwise saving would silently rewrite it to something else.
  const categoryOptions = useMemo(() => {
    const stored = formData.category.trim();
    return stored && !canonicalFaqCategory(stored) ? [...FAQ_CATEGORIES, stored] : FAQ_CATEGORIES;
  }, [formData.category]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        style={DIALOG_VARS}
        className="max-w-xl w-[calc(100vw-2rem)] p-0 gap-0 rounded-2xl overflow-hidden max-h-[92vh] flex flex-col"
      >
        <DialogHeader className="px-5 py-4 border-b border-app-border text-left">
          <DialogTitle className="text-[15px] font-bold text-app-fg">
            {initialData ? "Edit question" : "New question"}
          </DialogTitle>
          <DialogDescription className="text-[12.5px] text-app-fg-muted">
            Questions appear on the public Help page, grouped by category.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4">
            <CmsField label="Category" htmlFor="faq-category">
              <Select
                value={formData.category}
                onValueChange={(v) => setFormData({ ...formData, category: v })}
              >
                <SelectTrigger
                  id="faq-category"
                  className="h-11 rounded-xl border-app-border bg-app-surface-2 text-[13.5px]"
                >
                  <SelectValue placeholder="Pick a category" />
                </SelectTrigger>
                <SelectContent style={DIALOG_VARS}>
                  {categoryOptions.map((cat) => (
                    <SelectItem key={cat} value={cat} className={SELECT_ITEM}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CmsField>

            <CmsField label="Question" htmlFor="faq-question">
              <input
                id="faq-question"
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                placeholder="Do I need a licence to drive a camper van?"
                className={CONTROL}
                required
              />
            </CmsField>

            <CmsField label="Answer" htmlFor="faq-answer">
              <textarea
                id="faq-answer"
                rows={6}
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                placeholder="Write the answer guests will read…"
                className={TEXTAREA}
                required
              />
            </CmsField>
          </div>

          <footer className="flex items-center justify-end gap-2 px-5 py-4 border-t border-app-border bg-app-surface-2">
            <button type="button" onClick={onClose} className={BTN_NEUTRAL}>
              Cancel
            </button>
            <button type="submit" disabled={!formData.category} className={BTN_PRIMARY}>
              {initialData ? "Save changes" : "Add question"}
            </button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddFAQModal;
