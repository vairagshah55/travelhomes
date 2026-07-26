import React, { useEffect, useMemo, useState } from "react";
import { Search, Filter, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { cmsService } from "@/services/cms";
import ConfirmModal from "@/components/shared/ConfirmModal";
import { StarRating } from "../StarRating";
import type { Testimonial } from "../types";

type SortKey = "default" | "rating-desc" | "rating-asc" | "date";
type StatusFilter = "all" | "active" | "inactive";

const SORT_LABELS: Record<SortKey, string> = {
  default: "Sort By",
  "rating-desc": "Rating High to Low",
  "rating-asc": "Rating Low to High",
  date: "Date",
};

/**
 * Testimonials admin: list of user-submitted reviews with activate/deactivate
 * and delete actions, plus client-side search / sort / status filtering.
 * The list is small enough that filtering client-side beats a round trip.
 */
export function TestimonialsTab() {
  const [testimonials, setTestimonials] = useState<(Testimonial & { createdAt?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("default");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Testimonial | null>(null);

  const load = async () => {
    try {
      const list = await cmsService.getTestimonials();
      setTestimonials(list.data);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load testimonials");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest(".action-menu-container")) setOpenMenu(null);
      if (!t.closest(".filters-container")) setFiltersOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = testimonials.filter((t) => {
      if (statusFilter === "active" && t.isActive === false) return false;
      if (statusFilter === "inactive" && t.isActive !== false) return false;
      if (!q) return true;
      return (
        (t.userName || "").toLowerCase().includes(q) || (t.content || "").toLowerCase().includes(q)
      );
    });

    if (sortKey === "rating-desc") {
      rows = [...rows].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortKey === "rating-asc") {
      rows = [...rows].sort((a, b) => (a.rating || 0) - (b.rating || 0));
    } else if (sortKey === "date") {
      rows = [...rows].sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
      );
    }
    return rows;
  }, [testimonials, search, sortKey, statusFilter]);

  const toggle = async (t: Testimonial) => {
    setOpenMenu(null);
    try {
      await cmsService.toggleTestimonial(t.id);
      setTestimonials((prev) =>
        prev.map((x) => (x.id === t.id ? { ...x, isActive: x.isActive === false } : x)),
      );
      toast.success(t.isActive === false ? "Testimonial activated" : "Testimonial deactivated");
    } catch (e) {
      console.error(e);
      toast.error("Failed to change status");
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    try {
      await cmsService.deleteTestimonial(id);
      setTestimonials((prev) => prev.filter((x) => x.id !== id));
      toast.success("Testimonial deleted");
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete testimonial");
    } finally {
      setPendingDelete(null);
    }
  };

  const activeFilterCount = (statusFilter !== "all" ? 1 : 0) + (sortKey !== "default" ? 1 : 0);

  return (
    <div className="space-y-4">
      <div className="border border-dashboard-stroke rounded-xl bg-white p-4">
        <div className="flex items-center justify-between mb-3 max-md:flex-wrap gap-3">
          <div className="flex items-center gap-5">
            <div className="relative w-64 max-sm:w-full">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-dashboard-body"
                size={20}
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or review"
                className="w-full pl-10 pr-3 py-2.5 border border-dashboard-stroke rounded-lg text-sm text-tpl-dark placeholder:text-tpl-dark-5 focus:outline-none focus:border-dashboard-primary"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 max-md:flex-wrap">
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="px-4 py-2.5 border border-dashboard-stroke rounded-lg text-sm text-dashboard-body focus:outline-none focus:border-dashboard-primary bg-white"
            >
              {(Object.keys(SORT_LABELS) as SortKey[]).map((k) => (
                <option key={k} value={k}>
                  {SORT_LABELS[k]}
                </option>
              ))}
            </select>

            <div className="relative filters-container">
              <button
                onClick={() => setFiltersOpen((v) => !v)}
                className="flex items-center gap-2 px-5 py-2.5 border border-dashboard-stroke rounded-full text-sm text-dashboard-body hover:bg-gray-50 transition-colors"
              >
                <Filter size={18} />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-1 px-1.5 rounded-full bg-dashboard-primary text-black text-xs font-semibold">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              {filtersOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-dashboard-stroke rounded-lg shadow-lg z-40 p-3 space-y-2">
                  <p className="text-xs font-semibold text-dashboard-title">Status</p>
                  {(["all", "active", "inactive"] as StatusFilter[]).map((s) => (
                    <label
                      key={s}
                      className="flex items-center gap-2 text-sm text-dashboard-body cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="testimonial-status"
                        checked={statusFilter === s}
                        onChange={() => setStatusFilter(s)}
                      />
                      <span className="capitalize">{s}</span>
                    </label>
                  ))}
                  <button
                    onClick={() => {
                      setStatusFilter("all");
                      setSortKey("default");
                      setSearch("");
                    }}
                    className="w-full mt-2 px-3 py-1.5 text-xs border border-dashboard-stroke rounded-full hover:bg-gray-50"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>
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
          <div className="px-3 py-3 border-b border-dashboard-stroke flex items-center justify-between">
            <div className="text-dashboard-title font-plus-jakarta text-sm font-bold">
              Testimonial
            </div>
            <div className="text-dashboard-body text-xs">
              {visible.length} of {testimonials.length}
            </div>
          </div>

          <div className="border border-dashboard-stroke rounded-xl overflow-scroll">
            <div className="bg-gray-50 border-b border-gray-200 flex min-w-[860px]">
              <div className="w-40 px-4 py-3 text-dashboard-title font-plus-jakarta text-sm font-bold">
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

            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading testimonials...</div>
            ) : visible.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {testimonials.length === 0
                  ? "No testimonials yet."
                  : "No testimonials match the current filters."}
              </div>
            ) : (
              visible.map((testimonial, index) => (
                <div
                  key={testimonial.id}
                  className={`flex items-start min-w-[860px] ${
                    index !== visible.length - 1 ? "border-b border-gray-100" : ""
                  }`}
                >
                  <div className="w-40 px-4 py-3.5">
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
                        setOpenMenu(openMenu === testimonial.id ? null : testimonial.id)
                      }
                      className="text-dashboard-body hover:text-dashboard-primary transition-colors"
                      aria-label="More actions"
                    >
                      <MoreHorizontal size={22} strokeWidth={2} />
                    </button>
                    {openMenu === testimonial.id && (
                      <div className="absolute right-3 top-9 z-20 bg-white border border-gray-200 rounded-lg shadow-lg w-40 py-1">
                        <button
                          onClick={() => toggle(testimonial)}
                          className="w-full text-left px-4 py-2 text-sm text-dashboard-heading hover:bg-gray-50"
                        >
                          {testimonial.isActive === false ? "Activate" : "Deactivate"}
                        </button>
                        <button
                          onClick={() => {
                            setPendingDelete(testimonial);
                            setOpenMenu(null);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                        >
                          Delete
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

      <ConfirmModal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title="Delete testimonial"
        description={
          pendingDelete
            ? `Delete the testimonial from ${pendingDelete.userName}? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}

export default TestimonialsTab;
