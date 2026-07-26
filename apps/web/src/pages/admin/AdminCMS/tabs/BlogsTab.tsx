import React, { useEffect, useRef, useState } from "react";
import { Edit2, Trash2, MoreHorizontal, ChevronDown, Upload } from "lucide-react";
import { toast } from "sonner";
import { cmsService, type BlogPayload } from "@/services/cms";
import { getImageUrl } from "@/lib/adminUtils";
import RichTextEditor from "@/components/admin/RichTextEditor";
import ConfirmModal from "@/components/shared/ConfirmModal";

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

const rowId = (b: BlogRow) => String(b._id || b.id || "");

const BlogRowActions: React.FC<{
  blog: BlogRow;
  onEdit: () => void;
  onStatusChange: (status: "published" | "draft") => void;
  onDelete: () => void;
}> = ({ blog, onEdit, onStatusChange, onDelete }) => {
  const [open, setOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest(".blog-row-actions")) {
        setOpen(false);
        setStatusOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div className="relative blog-row-actions">
      <button
        onClick={() => setOpen((v) => !v)}
        className="p-1 hover:bg-gray-100 rounded"
        aria-label={`Actions for ${blog.title}`}
      >
        <MoreHorizontal size={22} strokeWidth={2} />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow z-20">
          <button
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
            className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 text-sm"
          >
            <Edit2 size={16} /> <span>Edit</span>
          </button>
          <div className="relative">
            <button
              onClick={() => setStatusOpen((v) => !v)}
              className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 text-sm"
            >
              <ChevronDown size={16} /> <span>Status</span>
            </button>
            {statusOpen && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white border rounded shadow z-30">
                {(["published", "draft"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setStatusOpen(false);
                      setOpen(false);
                      onStatusChange(s);
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-gray-50 text-sm capitalize ${
                      blog.status === s ? "font-semibold text-dashboard-heading" : ""
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 text-red-600 text-sm"
          >
            <Trash2 size={16} /> <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Blogs admin: list (drafts included) + create/edit modal + per-row
 * status change and delete. Self-contained — owns list, form and modal state.
 */
export function BlogsTab() {
  const [blogs, setBlogs] = useState<BlogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<BlogForm>(EMPTY_FORM);
  const [pendingDelete, setPendingDelete] = useState<BlogRow | null>(null);
  const coverRef = useRef<HTMLInputElement>(null);
  const authorImgRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      // No status filter — the admin table must show drafts as well.
      const res: any = await cmsService.listBlogs();
      setBlogs(res?.data || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load blogs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

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

  const uploadImage = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: "coverImage" | "authorImg",
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
      e.target.value = "";
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
    try {
      const res: any = await cmsService.setBlogStatus(id, status);
      const updated: BlogRow = res?.data || { ...blog, status };
      setBlogs((prev) => prev.map((b) => (rowId(b) === id ? updated : b)));
      toast.success(`Blog moved to ${status}`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to change status");
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const id = rowId(pendingDelete);
    try {
      await cmsService.deleteBlog(id);
      setBlogs((prev) => prev.filter((b) => rowId(b) !== id));
      toast.success("Blog deleted");
    } catch (e) {
      console.error(e);
      toast.error("Failed to delete blog");
    } finally {
      setPendingDelete(null);
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return "";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "" : d.toLocaleString();
  };

  return (
    <div className="space-y-4">
      <div className="border border-dashboard-stroke rounded-xl bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-dashboard-heading font-geist text-xl font-bold tracking-tight leading-tight">
            Blogs
          </h3>
          <button
            onClick={openCreate}
            className="px-5 py-2.5 bg-dashboard-primary text-black rounded-full font-geist text-sm font-medium tracking-tight hover:bg-dashboard-primary/90 transition-colors"
          >
            + Add New Blog
          </button>
        </div>

        <div className="border border-dashboard-stroke rounded-xl overflow-scroll">
          <div className="bg-gray-50 border-b border-gray-200 grid grid-cols-12 gap-3 px-4 py-3">
            <div className="col-span-5 text-dashboard-title font-plus-jakarta text-sm font-bold">
              Title
            </div>
            <div className="col-span-3 text-dashboard-title font-plus-jakarta text-sm font-bold">
              Author
            </div>
            <div className="col-span-2 text-dashboard-title font-plus-jakarta text-sm font-bold">
              Status
            </div>
            <div className="col-span-2 text-dashboard-title font-plus-jakarta text-sm font-bold">
              Action
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading blogs...</div>
          ) : blogs.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No blogs yet — use “Add New Blog” to publish the first one.
            </div>
          ) : (
            blogs.map((b, index) => (
              <div
                key={rowId(b) || index}
                className={`grid grid-cols-12 gap-3 px-4 py-3.5 items-center ${
                  index !== blogs.length - 1 ? "border-b border-gray-100" : ""
                }`}
              >
                <div className="col-span-5 flex items-center gap-3">
                  {b.coverImage && (
                    <img
                      src={getImageUrl(b.coverImage)}
                      alt=""
                      className="w-12 h-12 rounded object-cover bg-gray-100 shrink-0"
                    />
                  )}
                  <div className="min-w-0">
                    <div className="text-dashboard-heading font-plus-jakarta text-sm font-bold truncate">
                      {b.title}
                    </div>
                    <div className="text-dashboard-body text-xs">{formatDate(b.createdAt)}</div>
                  </div>
                </div>
                <div className="col-span-3 text-dashboard-body text-sm">{b.authorName || "-"}</div>
                <div className="col-span-2">
                  <span
                    className={`inline-flex px-3 py-1.5 rounded-lg text-sm font-medium ${
                      b.status === "published"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {b.status === "published" ? "Published" : "Draft"}
                  </span>
                </div>
                <div className="col-span-2 flex items-center justify-end relative">
                  <BlogRowActions
                    blog={b}
                    onEdit={() => openEdit(b)}
                    onStatusChange={(s) => changeStatus(b, s)}
                    onDelete={() => setPendingDelete(b)}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white rounded-xl p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-dashboard-heading font-geist text-2xl font-bold tracking-tight">
                {editingId ? "Edit Blog" : "Add New Blog"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-black hover:bg-gray-300 transition-colors"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-dashboard-title text-sm">Title</label>
                  <input
                    required
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-3 py-3.5 border border-gray-400 rounded-lg text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-dashboard-title text-sm">Category</label>
                  <input
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-3.5 border border-gray-400 rounded-lg text-sm focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-dashboard-title text-sm">Author Name</label>
                  <input
                    value={form.authorName}
                    onChange={(e) => setForm({ ...form, authorName: e.target.value })}
                    className="w-full px-3 py-3.5 border border-gray-400 rounded-lg text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-dashboard-title text-sm">Author Role</label>
                  <input
                    value={form.authorRole}
                    onChange={(e) => setForm({ ...form, authorRole: e.target.value })}
                    className="w-full px-3 py-3.5 border border-gray-400 rounded-lg text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-dashboard-title text-sm">Cover Image</label>
                  <div className="flex items-center gap-3 mt-1">
                    {form.coverImage ? (
                      <img
                        src={getImageUrl(form.coverImage)}
                        alt="Cover"
                        className="w-16 h-16 rounded object-cover bg-gray-100"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded bg-gray-100 flex items-center justify-center text-gray-400">
                        <Upload size={20} />
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <input
                        type="file"
                        accept="image/*"
                        ref={coverRef}
                        className="hidden"
                        onChange={(e) => uploadImage(e, "coverImage")}
                      />
                      <button
                        type="button"
                        onClick={() => coverRef.current?.click()}
                        className="px-4 py-2 border border-dashboard-stroke rounded-full text-sm hover:bg-gray-50"
                      >
                        Upload
                      </button>
                      <input
                        value={form.coverImage}
                        onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
                        placeholder="…or paste an image URL"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-dashboard-title text-sm">Author Image</label>
                  <div className="flex items-center gap-3 mt-1">
                    {form.authorImg ? (
                      <img
                        src={getImageUrl(form.authorImg)}
                        alt="Author"
                        className="w-16 h-16 rounded-full object-cover bg-gray-100"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                        <Upload size={20} />
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <input
                        type="file"
                        accept="image/*"
                        ref={authorImgRef}
                        className="hidden"
                        onChange={(e) => uploadImage(e, "authorImg")}
                      />
                      <button
                        type="button"
                        onClick={() => authorImgRef.current?.click()}
                        className="px-4 py-2 border border-dashboard-stroke rounded-full text-sm hover:bg-gray-50"
                      >
                        Upload
                      </button>
                      <input
                        value={form.authorImg}
                        onChange={(e) => setForm({ ...form, authorImg: e.target.value })}
                        placeholder="…or paste an image URL"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-dashboard-title text-sm">Short Description</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-3.5 border border-gray-400 rounded-lg text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="text-dashboard-title text-sm">Status</label>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({ ...form, status: e.target.value as "published" | "draft" })
                  }
                  className="w-full px-3 py-3.5 border border-gray-400 rounded-lg text-sm focus:outline-none bg-white"
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </div>

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="block text-sm text-[#334054] font-plus-jakarta">
                    Meta Keywords
                  </label>
                  <input
                    type="text"
                    value={form.metaKeywords}
                    onChange={(e) => setForm({ ...form, metaKeywords: e.target.value })}
                    placeholder="camper van, road trip, india"
                    className="w-full px-3 py-3.5 border border-[#B0B0B0] rounded-lg text-sm font-plus-jakarta focus:outline-none focus:ring-2 focus:ring-dashboard-primary focus:border-transparent"
                  />
                </div>
                <div className="space-y-3">
                  <label className="block text-sm text-[#334054] font-plus-jakarta">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    value={form.metaTitle}
                    onChange={(e) => setForm({ ...form, metaTitle: e.target.value })}
                    className="w-full px-3 py-3.5 border border-[#B0B0B0] rounded-lg text-sm font-plus-jakarta focus:outline-none focus:ring-2 focus:ring-dashboard-primary focus:border-transparent"
                  />
                </div>
                <div className="space-y-3">
                  <label className="block text-sm text-[#334054] font-plus-jakarta">
                    Meta Description
                  </label>
                  <textarea
                    value={form.metaDescription}
                    onChange={(e) => setForm({ ...form, metaDescription: e.target.value })}
                    placeholder="Write Message here..."
                    rows={5}
                    className="w-full px-3 py-3.5 border border-[#B0B0B0] rounded-lg text-sm font-plus-jakarta focus:outline-none focus:ring-2 focus:ring-dashboard-primary focus:border-transparent resize-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-dashboard-title text-sm">Content</label>
                <RichTextEditor
                  value={form.content}
                  onChange={(val) => setForm({ ...form, content: val })}
                  className="w-full border-gray-400"
                  style={{ minHeight: "300px" }}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 border rounded-full"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 bg-dashboard-primary text-black rounded-full disabled:opacity-60"
                >
                  {saving ? "Saving..." : editingId ? "Save Changes" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title="Delete blog"
        description={pendingDelete ? `Delete “${pendingDelete.title}”? This cannot be undone.` : ""}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}

export default BlogsTab;
