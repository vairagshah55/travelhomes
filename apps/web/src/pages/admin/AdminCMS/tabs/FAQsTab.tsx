import React, { useEffect, useState } from "react";
import { Edit2, Trash2, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { cmsService } from "@/services/cms";
import { AddFAQModal } from "../modals";
import type { FAQ } from "../types";

const CATEGORIES = [
  "Camper Van",
  "Unique Stay",
  "Activity",
  "Guest",
  "Booking",
  "Common Questions",
  "Locations",
];

/**
 * FAQ admin: category-filtered list with row-level Edit/Delete via portal-style
 * dropdown. Self-contained — owns its own state, modal, and click-outside
 * handler. Uses native confirm() for deletion to avoid coupling to parent's
 * ConfirmDialog state.
 */
export function FAQsTab() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("Unique Stay");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<FAQ | null>(null);

  const load = async () => {
    try {
      const list = await cmsService.getFAQs();
      setFaqs(list);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest(".action-menu-container")) {
        setOpenMenuId(null);
        setMenuPos(null);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const handleSave = async (faqData: any) => {
    try {
      if (editing) {
        const updated = await cmsService.updateFAQ(editing.id, faqData);
        setFaqs((prev) => prev.map((f) => (f.id === editing.id ? updated : f)));
      } else {
        const created = await cmsService.createFAQ(faqData);
        setFaqs((prev) => [...prev, created]);
      }
      setEditing(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    if (!id) {
      toast.error("Invalid FAQ ID");
      return;
    }
    if (!confirm("Delete this FAQ?")) return;
    try {
      await cmsService.deleteFAQ(id);
      setFaqs((prev) => prev.filter((faq) => String(faq.id) !== String(id)));
      setOpenMenuId(null);
      setMenuPos(null);
      toast.success("FAQ deleted successfully");
    } catch {
      toast.error("Failed to delete FAQ");
    }
  };

  const activeFAQ = openMenuId ? faqs.find((f) => f.id === openMenuId) : null;
  const filtered = faqs.filter((faq) => faq.category === selectedCategory);

  return (
    <div className="space-y-4">
      <div className="border border-dashboard-stroke rounded-xl bg-white p-4">
        <div className="flex items-center max-sm:flex-col justify-between mb-3">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2 max-sm:gap-0 px-1 py-0.5 border border-gray-200 rounded-full bg-white shadow-sm overflow-x-auto">
              {CATEGORIES.map((cat) => (
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
              setEditing(null);
              setShowModal(true);
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
        />

        <div className="border border-dashboard-stroke rounded-xl overflow-scroll">
          <div className="bg-gray-50 border-b border-gray-200 flex">
            <div className="w-30 px-4 py-3 text-dashboard-title font-plus-jakarta text-sm font-bold">SL</div>
            <div className="flex-1 px-3 py-3 text-dashboard-title font-plus-jakarta text-sm font-bold">Questions</div>
            <div className="w-40 px-3 py-3 text-dashboard-title font-plus-jakarta text-sm font-bold">Action</div>
          </div>

          {filtered.map((faq, index) => (
            <div
              key={faq.id}
              className={`flex items-start ${index !== filtered.length - 1 ? "border-b border-gray-100" : ""}`}
            >
              <div className="w-30 px-4 py-3.5">
                <div className="text-dashboard-heading font-plus-jakarta text-sm">{index + 1}</div>
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
                    setMenuPos({ top: rect.bottom, left: rect.right - 160 });
                    setOpenMenuId(openMenuId === faq.id ? null : faq.id);
                  }}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <MoreHorizontal size={20} className="text-dashboard-body" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {openMenuId && activeFAQ && menuPos && (
        <div
          className="fixed bg-white border border-dashboard-stroke rounded-lg shadow-lg z-[9999] py-1 w-40"
          style={{ top: menuPos.top, left: menuPos.left }}
        >
          <button
            onClick={() => {
              setEditing(activeFAQ);
              setShowModal(true);
              setOpenMenuId(null);
              setMenuPos(null);
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-dashboard-primary/10 flex items-center gap-2"
          >
            <Edit2 size={16} /> Edit
          </button>
          <button
            onClick={() => handleDelete(activeFAQ.id)}
            className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      )}

      <AddFAQModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditing(null);
        }}
        onSubmit={handleSave}
        initialData={editing}
      />
    </div>
  );
}

export default FAQsTab;
