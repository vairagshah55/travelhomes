import React, { useEffect, useMemo, useState } from "react";
import {
  Edit2,
  FileText,
  Image as ImageIcon,
  Loader2,
  Plus,
  Search,
  Send,
  Trash2,
  Undo2,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { cmsService, type BlogPayload } from "@/services/cms";
import { getImageUrl } from "@/lib/adminUtils";
import RichTextEditor from "@/components/admin/RichTextEditor";
import ConfirmModal from "@/components/shared/ConfirmModal";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import {
  AdminFilterBar,
  type ActiveFilters,
  type FilterDefinition,
} from "@/components/admin/AdminFilterBar";
import { AdminDataTable, type ColumnDef, type RowAction } from "@/components/admin/AdminDataTable";
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
  CmsSection,
  CONTROL,
  DIALOG_VARS,
  MediaPicker,
  SELECT_ITEM,
  TEXTAREA,
  TableFrame,
  Thumb,
} from "../ui";

type BlogForm = Required<Omit<BlogPayload, "status">> & { status: "published" | "draft" };

type BlogRow = BlogPayload & {
  _id?: string;
  id?: string;
  slug?: string;
  createdAt?: string;
};

const EMPTY_FORM: BlogForm = {
  title: "",
  category: "",
  description: "",
  metaKeywords: "",
  metaDescription: "",
  metaTitle: "",
  content: "",
  coverImage: "",
  authorName: "",
  authorImg: "",
  authorRole: "",
  status: "published",
};

const SORT_OPTIONS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "title", label: "Title A–Z" },
];

const FILTER_DEFS: FilterDefinition[] = [
  {
    key: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "published", label: "Published" },
      { value: "draft", label: "Draft" },
    ],
  },
];

const rowId = (b: BlogRow) => String(b._id || b.id || "");

const formatDate = (value?: string) => {
  if (!value) return "";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString();
};

/**
 * Blogs admin: the article list (drafts included) plus a create/edit dialog.
 * Self-contained — owns the list, the form and both modals.
 */
export function BlogsTab() {
  const [blogs, setBlogs] = useState<BlogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("newest");
  const [filters, setFilters] = useState<ActiveFilters>({});

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<BlogForm>(EMPTY_FORM);
  const [uploading, setUploading] = useState<"coverImage" | "authorImg" | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<BlogRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      // No status filter — the admin table must show drafts as well.
      const res: any = await cmsService.listBlogs();
      setBlogs(res?.data || []);
    } catch (e) {
      console.error(e);
      setError(true);
      toast.error("Failed to load blogs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const status = filters.status as string | undefined;

    let rows = blogs.filter((b) => {
      if (status && (b.status === "draft" ? "draft" : "published") !== status) return false;
      if (!q) return true;
      return [b.title, b.category, b.authorName].some((v) => (v || "").toLowerCase().includes(q));
    });

    if (sortKey === "title") {
      rows = [...rows].sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    } else {
      rows = [...rows].sort((a, b) => {
        const diff = new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        return sortKey === "oldest" ? -diff : diff;
      });
    }
    return rows;
  }, [blogs, search, sortKey, filters]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  // Pick only the editable fields — spreading the whole row would send _id /
  // slug / createdAt back on update.
  const openEdit = (blog: BlogRow) => {
    setEditingId(rowId(blog));
    setForm({
      title: blog.title || "",
      category: blog.category || "",
      description: blog.description || "",
      content: blog.content || "",
      coverImage: blog.coverImage || "",
      authorName: blog.authorName || "",
      authorImg: blog.authorImg || "",
      authorRole: blog.authorRole || "",
      metaTitle: blog.metaTitle || "",
      metaKeywords: blog.metaKeywords || "",
      metaDescription: blog.metaDescription || "",
      status: blog.status === "draft" ? "draft" : "published",
    });
    setShowModal(true);
  };

  const uploadImage = async (file: File, field: "coverImage" | "authorImg") => {
    setUploading(field);
    try {
      const res = await cmsService.uploadMedia({
        page: "Blogs",
        section: field === "coverImage" ? "Cover Image" : "Author Image",
        file,
      });
      if (res?.data?.url) {
        setForm((prev) => ({ ...prev, [field]: res.data.url }));
        toast.success("Image uploaded");
      }
    } catch (err) {
      console.error(err);
      toast.error("Image upload failed");
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const res: any = await cmsService.updateBlog(editingId, form);
        const updated: BlogRow = res?.data || { ...form, _id: editingId };
        setBlogs((prev) => prev.map((b) => (rowId(b) === editingId ? updated : b)));
        toast.success("Blog updated");
      } else {
        const res: any = await cmsService.createBlog(form);
        if (res?.data) setBlogs((prev) => [res.data, ...prev]);
        toast.success("Blog created");
      }
      setShowModal(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || "Failed to save blog");
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (blog: BlogRow, status: "published" | "draft") => {
    const id = rowId(blog);
    if (!id || blog.status === status) return;
    setBusyId(id);
    try {
      const res: any = await cmsService.setBlogStatus(id, status);
      const updated: BlogRow = res?.data || { ...blog, status };
      setBlogs((prev) => prev.map((b) => (rowId(b) === id ? updated : b)));
      toast.success(status === "published" ? "Blog published" : "Blog moved to drafts");
    } catch (e) {
      console.error(e);
      toast.error("Failed to change status");
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const id = rowId(pendingDelete);
    setDeleting(true);
    try {
      await cmsService.deleteBlog(id);
      setBlogs((prev) => prev.filter((b) => rowId(b) !== id));
      toast.success("Blog deleted");
      setPendingDelete(null);
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete blog");
    } finally {
      setDeleting(false);
    }
  };

  const columns: ColumnDef<BlogRow>[] = [
    {
      key: "title",
      header: "Article",
      cell: (b) => (
        <div className="flex items-center gap-3 min-w-0">
          <Thumb src={b.coverImage} className="w-11 h-11" />
          <div className="min-w-0">
            <p className="font-semibold text-app-fg truncate max-w-[320px]">{b.title}</p>
            <p className="text-[12px] text-app-fg-muted">
              {[b.category, formatDate(b.createdAt)].filter(Boolean).join(" · ") || "—"}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "authorName",
      header: "Author",
      className: "w-44",
      hideBelow: "md",
      cell: (b) => <span className="text-app-fg-muted">{b.authorName || "—"}</span>,
    },
    {
      key: "status",
      header: "Status",
      className: "w-28",
      cell: (b) => <StatusBadge status={b.status === "draft" ? "draft" : "published"} />,
    },
  ];

  const rowActions: RowAction<BlogRow>[] = [
    { label: "Edit", icon: Edit2, onClick: openEdit },
    {
      label: "Publish",
      icon: Send,
      hidden: (b) => b.status !== "draft",
      onClick: (b) => changeStatus(b, "published"),
    },
    {
      label: "Move to draft",
      icon: Undo2,
      hidden: (b) => b.status === "draft",
      onClick: (b) => changeStatus(b, "draft"),
    },
    { label: "Delete", icon: Trash2, variant: "danger", onClick: (b) => setPendingDelete(b) },
  ];

  const hasQuery = !!search.trim() || Object.keys(filters).length > 0;

  return (
    <div className="space-y-4">
      <AdminToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search title, category or author…"
        sortOptions={SORT_OPTIONS}
        sortValue={sortKey}
        onSortChange={setSortKey}
        primaryAction={
          <button onClick={openCreate} className={BTN_PRIMARY}>
            <Plus size={15} strokeWidth={2.4} />
            Add blog
          </button>
        }
      />

      <AdminFilterBar
        filters={FILTER_DEFS}
        activeFilters={filters}
        onApply={setFilters}
        onClear={() => setFilters({})}
      />

      <TableFrame>
        <AdminDataTable<BlogRow>
          columns={columns}
          data={visible}
          isLoading={loading}
          isError={error}
          errorMessage="Could not load the blog list."
          onRetry={load}
          hasActiveQuery={hasQuery}
          emptyIcon={FileText}
          emptyTitle="No blogs yet"
          emptyDescription="Write the first article — it goes live as soon as it's published."
          emptyAction={{ label: "Add blog", onClick: openCreate }}
          noResultsDescription="No article matches the current search or filters."
          noResultsAction={{
            label: "Clear filters",
            onClick: () => {
              setSearch("");
              setFilters({});
            },
          }}
          rowActions={rowActions}
          rowBusy={(b) => busyId === rowId(b)}
          getRowId={rowId}
        />
      </TableFrame>

      {/* ── Create / edit ─────────────────────────────────────────────────── */}
      <Dialog open={showModal} onOpenChange={(o) => !o && !saving && setShowModal(false)}>
        <DialogContent
          style={DIALOG_VARS}
          className="max-w-3xl w-[calc(100vw-2rem)] p-0 gap-0 rounded-2xl overflow-hidden max-h-[92vh] flex flex-col"
        >
          <DialogHeader className="px-5 py-4 border-b border-app-border text-left">
            <DialogTitle className="text-[15px] font-bold text-app-fg">
              {editingId ? "Edit blog" : "New blog"}
            </DialogTitle>
            <DialogDescription className="text-[12.5px] text-app-fg-muted">
              Cover image, author and SEO fields all show up on the public article page.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col">
            <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <CmsField label="Title" htmlFor="blog-title" className="sm:col-span-2">
                  <input
                    id="blog-title"
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="How to plan a Himalayan road trip"
                    className={CONTROL}
                  />
                </CmsField>
                <CmsField label="Category" htmlFor="blog-category">
                  <input
                    id="blog-category"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    placeholder="Road trips"
                    className={CONTROL}
                  />
                </CmsField>
                <CmsField label="Status" htmlFor="blog-status">
                  <Select
                    value={form.status}
                    onValueChange={(v) => setForm({ ...form, status: v as "published" | "draft" })}
                  >
                    <SelectTrigger
                      id="blog-status"
                      className="h-11 rounded-xl border-app-border bg-app-surface-2 text-[13.5px]"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent style={DIALOG_VARS}>
                      <SelectItem value="published" className={SELECT_ITEM}>
                        Published
                      </SelectItem>
                      <SelectItem value="draft" className={SELECT_ITEM}>
                        Draft
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </CmsField>
              </div>

              <CmsField label="Short description" htmlFor="blog-description">
                <textarea
                  id="blog-description"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="One or two lines shown in the article list."
                  className={TEXTAREA}
                />
              </CmsField>

              <CmsSection icon={ImageIcon} title="Cover image">
                <MediaPicker
                  value={form.coverImage}
                  shape="wide"
                  busy={uploading === "coverImage"}
                  onFile={(file) => uploadImage(file, "coverImage")}
                  onChangeUrl={(url) => setForm({ ...form, coverImage: url })}
                  onClear={() => setForm({ ...form, coverImage: "" })}
                  hint="Wide crop — used as the article header."
                />
              </CmsSection>

              <CmsSection icon={User} title="Author">
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <CmsField label="Name" htmlFor="blog-author">
                      <input
                        id="blog-author"
                        value={form.authorName}
                        onChange={(e) => setForm({ ...form, authorName: e.target.value })}
                        className={CONTROL}
                      />
                    </CmsField>
                    <CmsField label="Role" htmlFor="blog-author-role">
                      <input
                        id="blog-author-role"
                        value={form.authorRole}
                        onChange={(e) => setForm({ ...form, authorRole: e.target.value })}
                        placeholder="Travel writer"
                        className={CONTROL}
                      />
                    </CmsField>
                  </div>
                  <MediaPicker
                    value={form.authorImg}
                    shape="circle"
                    busy={uploading === "authorImg"}
                    onFile={(file) => uploadImage(file, "authorImg")}
                    onChangeUrl={(url) => setForm({ ...form, authorImg: url })}
                    onClear={() => setForm({ ...form, authorImg: "" })}
                    hint="Square image, shown as a circular avatar."
                  />
                </div>
              </CmsSection>

              <CmsField label="Content">
                <RichTextEditor
                  value={form.content}
                  onChange={(val) => setForm({ ...form, content: val })}
                  placeholder="Write the article…"
                  className="w-full"
                  style={{ minHeight: "260px" }}
                />
              </CmsField>

              <CmsSection
                icon={Search}
                title="SEO"
                blurb="Used for search results and link previews."
              >
                <div className="space-y-4">
                  <CmsField label="Meta title" htmlFor="blog-meta-title">
                    <input
                      id="blog-meta-title"
                      value={form.metaTitle}
                      onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
                      className={CONTROL}
                    />
                  </CmsField>
                  <CmsField label="Meta keywords" htmlFor="blog-meta-keywords">
                    <input
                      id="blog-meta-keywords"
                      value={form.metaKeywords}
                      onChange={(e) => setForm({ ...form, metaKeywords: e.target.value })}
                      placeholder="camper van, road trip, india"
                      className={CONTROL}
                    />
                  </CmsField>
                  <CmsField label="Meta description" htmlFor="blog-meta-description">
                    <textarea
                      id="blog-meta-description"
                      rows={3}
                      value={form.metaDescription}
                      onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
                      className={TEXTAREA}
                    />
                  </CmsField>
                </div>
              </CmsSection>
            </div>

            <footer className="flex items-center justify-end gap-2 px-5 py-4 border-t border-app-border bg-app-surface-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                disabled={saving}
                className={BTN_NEUTRAL}
              >
                Cancel
              </button>
              <button type="submit" disabled={saving} className={BTN_PRIMARY}>
                {saving ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Saving…
                  </>
                ) : editingId ? (
                  "Save changes"
                ) : (
                  "Create blog"
                )}
              </button>
            </footer>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmModal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        isLoading={deleting}
        title="Delete blog"
        description={pendingDelete ? `Delete “${pendingDelete.title}”? This cannot be undone.` : ""}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}

export default BlogsTab;
