import React, { useEffect, useMemo, useState } from "react";
import { Award, Ban, CheckCircle2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cmsService } from "@/services/cms";
import ConfirmModal from "@/components/shared/ConfirmModal";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import {
  AdminFilterBar,
  type ActiveFilters,
  type FilterDefinition,
} from "@/components/admin/AdminFilterBar";
import { AdminDataTable, type ColumnDef, type RowAction } from "@/components/admin/AdminDataTable";
import { TableFrame } from "../ui";
import { StarRating } from "../StarRating";
import type { Testimonial } from "../types";

type Row = Testimonial & { createdAt?: string };

/** The API concatenates first + last name, so a missing name arrives as the
 *  literal string "undefined undefined" — don't print that back at the admin. */
const guestName = (value?: string) => {
  const cleaned = (value || "")
    .replace(/\b(undefined|null)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || "Unnamed guest";
};

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "rating-desc", label: "Rating: high to low" },
  { value: "rating-asc", label: "Rating: low to high" },
];

const FILTER_DEFS: FilterDefinition[] = [
  {
    key: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "active", label: "Active" },
      { value: "inactive", label: "Inactive" },
    ],
  },
];

const PER_PAGE = 10;

/**
 * Testimonials admin: the user-submitted reviews shown on the marketing pages,
 * with activate/deactivate and delete. The list is small enough that searching,
 * sorting and paging client-side beats a round trip.
 */
export function TestimonialsTab() {
  const [testimonials, setTestimonials] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("newest");
  const [filters, setFilters] = useState<ActiveFilters>({});
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Row | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const list = await cmsService.getTestimonials();
      setTestimonials(list.data);
    } catch (e) {
      console.error(e);
      setError(true);
      toast.error("Failed to load testimonials");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    setPage(1);
  }, [search, sortKey, filters]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const status = filters.status as string | undefined;

    let rows = testimonials.filter((t) => {
      if (status === "active" && t.isActive === false) return false;
      if (status === "inactive" && t.isActive !== false) return false;
      if (!q) return true;
      return (
        (t.userName || "").toLowerCase().includes(q) || (t.content || "").toLowerCase().includes(q)
      );
    });

    if (sortKey === "rating-desc") {
      rows = [...rows].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortKey === "rating-asc") {
      rows = [...rows].sort((a, b) => (a.rating || 0) - (b.rating || 0));
    } else if (sortKey === "newest") {
      rows = [...rows].sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
      );
    }
    return rows;
  }, [testimonials, search, sortKey, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const toggle = async (t: Row) => {
    setBusyId(t.id);
    try {
      await cmsService.toggleTestimonial(t.id);
      setTestimonials((prev) =>
        prev.map((x) => (x.id === t.id ? { ...x, isActive: x.isActive === false } : x)),
      );
      toast.success(t.isActive === false ? "Testimonial activated" : "Testimonial deactivated");
    } catch (e) {
      console.error(e);
      toast.error("Failed to change status");
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    setDeleting(true);
    try {
      await cmsService.deleteTestimonial(id);
      setTestimonials((prev) => prev.filter((x) => x.id !== id));
      toast.success("Testimonial deleted");
      setPendingDelete(null);
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete testimonial");
    } finally {
      setDeleting(false);
    }
  };

  const columns: ColumnDef<Row>[] = [
    {
      key: "userName",
      header: "Guest",
      className: "w-44",
      cell: (t) => <span className="font-semibold text-app-fg">{guestName(t.userName)}</span>,
    },
    {
      key: "rating",
      header: "Rating",
      className: "w-36",
      cell: (t) => (
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-semibold tabular-nums text-app-fg">{t.rating}</span>
          <StarRating rating={t.rating} />
        </div>
      ),
    },
    {
      key: "content",
      header: "Review",
      cell: (t) => (
        <p className="max-w-[520px] text-app-fg-muted line-clamp-2 leading-relaxed">{t.content}</p>
      ),
    },
    {
      key: "status",
      header: "Status",
      className: "w-28",
      cell: (t) => <StatusBadge status={t.isActive !== false ? "active" : "inactive"} />,
    },
  ];

  const rowActions: RowAction<Row>[] = [
    {
      label: "Activate",
      icon: CheckCircle2,
      hidden: (t) => t.isActive !== false,
      onClick: toggle,
    },
    {
      label: "Deactivate",
      icon: Ban,
      hidden: (t) => t.isActive === false,
      onClick: toggle,
    },
    { label: "Delete", icon: Trash2, variant: "danger", onClick: (t) => setPendingDelete(t) },
  ];

  const hasQuery = !!search.trim() || Object.keys(filters).length > 0;

  return (
    <div className="space-y-4">
      {/* The tab's panel head already names this section — no inner title here. */}
      <AdminToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search guest or review…"
        sortOptions={SORT_OPTIONS}
        sortValue={sortKey}
        onSortChange={setSortKey}
      />

      <AdminFilterBar
        filters={FILTER_DEFS}
        activeFilters={filters}
        onApply={setFilters}
        onClear={() => setFilters({})}
      />

      <TableFrame>
        <AdminDataTable<Row>
          columns={columns}
          data={paginated}
          isLoading={loading}
          isError={error}
          errorMessage="Could not load testimonials."
          onRetry={load}
          hasActiveQuery={hasQuery}
          emptyIcon={Award}
          emptyTitle="No testimonials yet"
          emptyDescription="Reviews left by guests will show up here."
          noResultsDescription="No testimonial matches the current search or filters."
          noResultsAction={{
            label: "Clear filters",
            onClick: () => {
              setSearch("");
              setFilters({});
            },
          }}
          rowActions={rowActions}
          rowBusy={(t) => busyId === t.id}
          pagination={{
            currentPage: page,
            totalPages,
            totalItems: filtered.length,
            onPageChange: setPage,
          }}
        />
      </TableFrame>

      <ConfirmModal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        isLoading={deleting}
        title="Delete testimonial"
        description={
          pendingDelete
            ? `Delete the testimonial from ${guestName(pendingDelete.userName)}? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}

export default TestimonialsTab;
