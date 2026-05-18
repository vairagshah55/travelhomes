import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import toast from "react-hot-toast";
import {
  X,
  Bold,
  Underline,
  Italic,
  AlignJustify,
  Link2,
  Upload,
  Trash2,
  AlertTriangle,
  ImageIcon,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { marketingApi, adminCmsMediaApi, MarketingContentDTO, API_BASE_URL } from "@/lib/api";

const Marketing = () => {
  const [contentText, setContentText] = useState("");
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const marketingKey = ["marketing", "list"] as const;
  const { data: items = [] } = useQuery<MarketingContentDTO[]>({
    queryKey: marketingKey,
    queryFn: () => marketingApi.list(),
  });

  const insertFormat = (prefix: string, suffix = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const newText = `${text.substring(0, start)}${prefix}${text.substring(start, end)}${suffix}${text.substring(end)}`;
    setContentText(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.length) {
      setUploadedImages((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      setUploadedImages((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const handleDeleteItem = (id: string) => {
    setConfirmDelete(id);
  };

  const doDeleteItem = async (id: string) => {
    try {
      await marketingApi.delete(id);
      queryClient.setQueryData<MarketingContentDTO[]>(marketingKey, (prev) =>
        (prev ?? []).filter((item) => item._id !== id),
      );
    } catch {
      toast.error("Failed to delete content.");
    }
  };

  const handleSubmit = async () => {
    if (!contentText && uploadedImages.length === 0) {
      toast.error("Please add some content or images.");
      return;
    }
    setIsSubmitting(true);
    try {
      const imageUrls: string[] = [];
      for (const file of uploadedImages) {
        const res = await adminCmsMediaApi.upload(file, "marketing", "content");
        if (res.success && res.data?.url) imageUrls.push(res.data.url);
      }
      await marketingApi.create({
        content: contentText,
        images: imageUrls,
        additionalCount: Math.max(0, imageUrls.length - 1),
      });
      setContentText("");
      setUploadedImages([]);
      queryClient.invalidateQueries({ queryKey: marketingKey });
      toast.success("Marketing content posted successfully!");
    } catch (error: any) {
      toast.error(`Failed to submit: ${error.message || "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Marketing">
      <div className="p-5 space-y-5">
        {/* Upload Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-[15px] font-bold text-gray-900 dark:text-white">Upload Content</h2>
          </div>

          <div className="p-6 space-y-6">
            {/* Drag & drop zone */}
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Images / Reels
              </p>
              <div
                className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                  dragActive
                    ? "border-[#185FA5] bg-blue-50 dark:bg-blue-500/10"
                    : "border-gray-200 dark:border-gray-700 hover:border-[#185FA5] hover:bg-blue-50/30 dark:hover:bg-blue-500/5"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Upload size={20} className="text-gray-400 dark:text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Drag & drop or{" "}
                      <span className="text-[#185FA5] font-semibold">browse files</span>
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      Images, PDF, DOC, CSV, XLSX supported
                    </p>
                  </div>
                </div>
                <input
                  id="file-upload"
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.csv,.xlsx"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </div>

              {/* Preview uploaded images */}
              {uploadedImages.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-4">
                  {uploadedImages.map((file, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="relative group"
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Upload ${index + 1}`}
                        className="w-20 h-20 object-cover rounded-xl border border-gray-200 dark:border-gray-700"
                      />
                      <button
                        onClick={() => setUploadedImages((p) => p.filter((_, i) => i !== index))}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 shadow-sm"
                      >
                        <X size={11} className="text-gray-600 dark:text-gray-300" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Text editor */}
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                Content
              </p>
              <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <Textarea
                  ref={textareaRef}
                  value={contentText}
                  onChange={(e) => setContentText(e.target.value)}
                  placeholder="Write your marketing content here..."
                  className="min-h-[120px] border-0 rounded-none bg-gray-50 dark:bg-gray-800/50 resize-none focus:ring-0 text-sm"
                />
                {/* Toolbar */}
                <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-2.5 bg-white dark:bg-gray-900 flex items-center gap-3">
                  {[
                    { icon: Bold, action: () => insertFormat("**", "**"), title: "Bold" },
                    { icon: Underline, action: () => insertFormat("__", "__"), title: "Underline" },
                    { icon: Italic, action: () => insertFormat("*", "*"), title: "Italic" },
                    { icon: AlignJustify, action: () => insertFormat("\n"), title: "New Line" },
                    {
                      icon: Link2,
                      action: () => {
                        const url = prompt("Enter URL:");
                        if (url) insertFormat("[", `](${url})`);
                      },
                      title: "Link",
                    },
                  ].map(({ icon: Icon, action, title }) => (
                    <button
                      key={title}
                      onClick={action}
                      title={title}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors text-gray-500 dark:text-gray-400"
                    >
                      <Icon size={14} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setContentText(""); setUploadedImages([]); }}
                className="px-4 py-2 text-sm font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-[#185FA5] hover:bg-[#042C53] text-white rounded-xl px-6"
              >
                {isSubmitting ? "Submitting…" : "Post Content"}
              </Button>
            </div>
          </div>
        </div>

        {/* Previous posts */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-[15px] font-bold text-gray-900 dark:text-white">Previous Posts</h3>
          </div>

          {items.length === 0 ? (
            <div className="py-16 flex flex-col items-center gap-4 text-gray-400">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center">
                <ImageIcon size={22} className="text-gray-300 dark:text-gray-600" strokeWidth={1.5} />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                  No posts yet
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-600">
                  Marketing content you post will appear here
                </p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {items.map((item, i) => (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.18 }}
                  className="p-5 flex gap-4 hover:bg-gray-50/60 dark:hover:bg-white/[0.02] transition-colors"
                >
                  {item.images && item.images.length > 0 && (
                    <div className="flex gap-2 flex-wrap max-w-[180px] shrink-0">
                      {item.images.slice(0, 3).map((img, idx) => (
                        <img
                          key={idx}
                          src={img.startsWith("http") ? img : `${API_BASE_URL}${img}`}
                          alt={`Post ${idx}`}
                          className="w-20 h-20 object-cover rounded-xl"
                        />
                      ))}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                      {item.content}
                    </p>
                    <p className="mt-2 text-[11px] text-gray-400 dark:text-gray-600">
                      {new Date(item.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteItem(item._id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors self-start shrink-0"
                  >
                    <Trash2 size={15} />
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirm Delete Modal */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/15 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Delete post?</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    This marketing post will be permanently removed.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-1">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    doDeleteItem(confirmDelete);
                    setConfirmDelete(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default Marketing;
