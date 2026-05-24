import React, { useEffect, useState } from "react";
import { Edit2, Trash2, MoreHorizontal, ChevronDown } from "lucide-react";
import { cmsService } from "@/services/cms";
import RichTextEditor from "@/components/admin/RichTextEditor";

type BlogForm = {
  title: string;
  category: string;
  description: string;
  metablogkeyword: string;
  metablogdescription: string;
  metablogtitle: string;
  content: string;
  coverImage: string;
  authorName: string;
  authorImg: string;
  authorRole: string;
  status: "published" | "draft";
};

const EMPTY_FORM: BlogForm = {
  title: "",
  category: "",
  description: "",
  metablogkeyword: "",
  metablogdescription: "",
  metablogtitle: "",
  content: "",
  coverImage: "",
  authorName: "",
  authorImg: "",
  authorRole: "",
  status: "published",
};

const PLACEHOLDER_BLOGS = [
  {
    id: "1",
    title: "Sample Blog Post",
    authorName: "Admin",
    status: "published",
    createdAt: new Date().toISOString(),
  },
];

const BlogRowActions: React.FC<{
  blog: any;
  onEdit: (b: any) => void;
  onDelete: () => void;
}> = ({ blog, onEdit, onDelete }) => {
  const [open, setOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const blogId = blog._id || blog.id;

  const doDelete = async () => {
    if (!confirm("Delete this blog?")) return;
    try {
      await cmsService.deleteBlog(blogId);
      onDelete();
      setOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const doEdit = async () => {
    const newTitle = prompt("Update title", blog.title || "")?.trim();
    if (!newTitle || newTitle === blog.title) return;
    try {
      const res = await cmsService.updateBlog(blogId, { title: newTitle });
      onEdit(res?.data || { ...blog, title: newTitle });
      setOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const changeStatus = async (status: "published" | "draft") => {
    try {
      const res = await cmsService.setBlogStatus(blogId, status);
      onEdit(res?.data || { ...blog, status });
      setStatusOpen(false);
      setOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)} className="p-1 hover:bg-gray-100 rounded">
        <MoreHorizontal size={22} strokeWidth={2} />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow z-20">
          <button onClick={doEdit} className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50">
            <Edit2 size={16} /> <span>Edit</span>
          </button>
          <div className="relative">
            <button
              onClick={() => setStatusOpen((v) => !v)}
              className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50"
            >
              <ChevronDown size={16} /> <span>Status</span>
            </button>
            {statusOpen && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white border rounded shadow z-30">
                <button
                  onClick={() => changeStatus("published")}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50"
                >
                  Published
                </button>
                <button
                  onClick={() => changeStatus("draft")}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50"
                >
                  Draft
                </button>
              </div>
            )}
          </div>
          <button
            onClick={doDelete}
            className="flex items-center gap-2 w-full px-3 py-2 hover:bg-gray-50 text-red-600"
          >
            <Trash2 size={16} /> <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Blogs admin: list + create modal + per-row Edit/Status/Delete.
 * Self-contained — owns blogs list, form state, and modal visibility.
 */
export function BlogsTab() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<BlogForm>(EMPTY_FORM);

  useEffect(() => {
    cmsService
      .listBlogs({ status: "published" })
      .then((res: any) => setBlogs(res?.data || []))
      .catch(console.error);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await cmsService.createBlog({ ...form });
      setBlogs((prev) => [res?.data, ...prev]);
      setShowModal(false);
      setForm(EMPTY_FORM);
    } catch (err) {
      console.error(err);
    }
  };

  const rows = blogs.length ? blogs : PLACEHOLDER_BLOGS;

  return (
    <div className="space-y-4">
      <div className="border border-dashboard-stroke rounded-xl bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-dashboard-heading font-geist text-xl font-bold tracking-tight leading-tight">
            Blogs
          </h3>
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 bg-dashboard-primary text-white rounded-full font-geist text-sm font-medium tracking-tight hover:bg-dashboard-primary/90 transition-colors"
          >
            + Add New Blog
          </button>
        </div>

        <div className="border border-dashboard-stroke rounded-xl overflow-scroll">
          <div className="bg-gray-50 border-b border-gray-200 grid grid-cols-12 gap-3 px-4 py-3">
            <div className="col-span-5 text-dashboard-title font-plus-jakarta text-sm font-bold">Title</div>
            <div className="col-span-3 text-dashboard-title font-plus-jakarta text-sm font-bold">Author</div>
            <div className="col-span-2 text-dashboard-title font-plus-jakarta text-sm font-bold">Status</div>
            <div className="col-span-2 text-dashboard-title font-plus-jakarta text-sm font-bold">Action</div>
          </div>
          {rows.map((b, index, arr) => (
            <div
              key={b.id || b._id || index}
              className={`grid grid-cols-12 gap-3 px-4 py-3.5 items-center ${
                index !== arr.length - 1 ? "border-b border-gray-100" : ""
              }`}
            >
              <div className="col-span-5">
                <div className="text-dashboard-heading font-plus-jakarta text-sm font-bold">{b.title}</div>
                <div className="text-dashboard-body text-xs">
                  {new Date(b.createdAt || "").toLocaleString() || ""}
                </div>
              </div>
              <div className="col-span-3 text-dashboard-body">{b.authorName || "-"}</div>
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
                  onEdit={(updated) =>
                    setBlogs((prev) =>
                      prev.map((x) =>
                        x._id === updated._id || x.id === updated._id ? updated : x,
                      ),
                    )
                  }
                  onDelete={() =>
                    setBlogs((prev) =>
                      prev.filter((x) => (x._id || x.id) !== (b._id || b.id)),
                    )
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <div className="bg-white rounded-xl p-6 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-dashboard-heading font-geist text-2xl font-bold tracking-tight">
                Add New Blog
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-black hover:bg-gray-300 transition-colors"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
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
                  <label className="text-dashboard-title text-sm">Cover Image URL</label>
                  <input
                    value={form.coverImage}
                    onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
                    className="w-full px-3 py-3.5 border border-gray-400 rounded-lg text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-dashboard-title text-sm">Author Image URL</label>
                  <input
                    value={form.authorImg}
                    onChange={(e) => setForm({ ...form, authorImg: e.target.value })}
                    className="w-full px-3 py-3.5 border border-gray-400 rounded-lg text-sm focus:outline-none"
                  />
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

              <div className="space-y-6">
                <div className="space-y-3">
                  <label className="block text-sm text-[#334054] font-plus-jakarta">Meta Keywords</label>
                  <input
                    type="text"
                    value={form.metablogkeyword}
                    onChange={(e) => setForm({ ...form, metablogkeyword: e.target.value })}
                    placeholder="Select"
                    className="w-full px-3 py-3.5 border border-[#B0B0B0] rounded-lg text-sm text-[#98A2B3] font-plus-jakarta focus:outline-none focus:ring-2 focus:ring-dashboard-primary focus:border-transparent"
                  />
                </div>
                <div className="space-y-3">
                  <label className="block text-sm text-[#334054] font-plus-jakarta">Meta Title</label>
                  <input
                    type="text"
                    value={form.metablogtitle}
                    onChange={(e) => setForm({ ...form, metablogtitle: e.target.value })}
                    className="w-full px-3 py-3.5 border border-[#B0B0B0] rounded-lg text-sm text-[#717171] font-plus-jakarta focus:outline-none focus:ring-2 focus:ring-dashboard-primary focus:border-transparent"
                  />
                </div>
                <div className="space-y-3">
                  <label className="block text-sm text-[#334054] font-plus-jakarta">Meta Description</label>
                  <textarea
                    value={form.metablogdescription}
                    onChange={(e) => setForm({ ...form, metablogdescription: e.target.value })}
                    placeholder="Write Message here..."
                    rows={5}
                    className="w-full px-3 py-3.5 border border-[#B0B0B0] rounded-lg text-sm text-[#717171] font-plus-jakarta focus:outline-none focus:ring-2 focus:ring-dashboard-primary focus:border-transparent resize-none"
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
                  className="px-5 py-2.5 bg-dashboard-primary text-white rounded-full"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default BlogsTab;
