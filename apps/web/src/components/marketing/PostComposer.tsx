import React, { useId, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlignJustify,
  Bold,
  ImagePlus,
  Italic,
  Link2,
  Loader2,
  PenLine,
  Underline,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BTN_NEUTRAL, BTN_PRIMARY, PANEL_FOOTER, Panel, PanelHead } from "@/components/shared";
import { cn } from "@/lib/utils";
import { MAX_IMAGES, type PostDraft } from "./usePostDraft";

/* Formatting marks are stored verbatim — nothing in the app renders markdown
   yet, so these are notes for whoever cross-posts the copy, not styling. */
const TOOLS = [
  { icon: Bold, title: "Bold", apply: (d: PostDraft) => d.insertFormat("**", "**") },
  { icon: Italic, title: "Italic", apply: (d: PostDraft) => d.insertFormat("*", "*") },
  { icon: Underline, title: "Underline", apply: (d: PostDraft) => d.insertFormat("__", "__") },
  { icon: AlignJustify, title: "New line", apply: (d: PostDraft) => d.insertFormat("\n") },
  {
    icon: Link2,
    title: "Link",
    apply: (d: PostDraft) => {
      const url = window.prompt("Link URL");
      if (url) d.insertFormat("[", `](${url})`);
    },
  },
];

const FieldLabel = ({ children, hint }: { children: React.ReactNode; hint?: React.ReactNode }) => (
  <div className="flex items-baseline justify-between gap-2 mb-2">
    <p className="text-[12.5px] font-semibold text-foreground/85">{children}</p>
    {hint && <span className="text-[11px] tabular-nums text-muted-foreground/70">{hint}</span>}
  </div>
);

export const PostComposer: React.FC<{ draft: PostDraft }> = ({ draft }) => {
  const [dragActive, setDragActive] = useState(false);
  const inputId = useId();

  const onDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    draft.addFiles(e.dataTransfer.files);
  };

  const status = draft.isSubmitting
    ? draft.images.length
      ? `Uploading ${Math.min(draft.uploaded + 1, draft.images.length)} of ${draft.images.length}…`
      : "Publishing…"
    : draft.canSubmit
      ? `${draft.images.length} image${draft.images.length === 1 ? "" : "s"} · ${draft.text.trim().length} characters`
      : "Add a photo or some copy to publish.";

  return (
    <Panel>
      <PanelHead
        icon={PenLine}
        title="Create a post"
        blurb="Photos and copy for the TravelHomes marketing feed."
      />

      <div className="p-5 space-y-5">
        {/* ── Photos ── */}
        <div>
          <FieldLabel hint={`${draft.images.length}/${MAX_IMAGES}`}>Photos</FieldLabel>

          {/* A <label> is the drop target so click, tab and Enter all open the
              picker — the old zone was a div wired to document.getElementById,
              which was unreachable by keyboard. */}
          <label
            htmlFor={inputId}
            onDragEnter={onDrag}
            onDragLeave={onDrag}
            onDragOver={onDrag}
            onDrop={onDrop}
            className={cn(
              "flex flex-col items-center gap-3 rounded-2xl border border-dashed px-6 py-8 text-center cursor-pointer",
              "transition-colors duration-150",
              "focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/15",
              dragActive
                ? "border-brand bg-brand/[0.06]"
                : "border-border bg-muted/40 dark:bg-white/[0.02] hover:border-brand/60 hover:bg-brand/[0.04]",
            )}
          >
            <span
              className={cn(
                "grid place-items-center w-11 h-11 rounded-xl transition-colors duration-150",
                dragActive ? "bg-brand text-brand-fg" : "bg-brand/10 text-brand",
              )}
            >
              <ImagePlus size={19} strokeWidth={2} />
            </span>
            <span className="space-y-1">
              <span className="block text-[13px] font-semibold text-foreground">
                Drop images here or <span className="text-brand">browse</span>
              </span>
              <span className="block text-[11.5px] text-muted-foreground">
                JPG, PNG, WEBP or GIF · up to 25 MB each · {MAX_IMAGES} per post
              </span>
            </span>
            <input
              id={inputId}
              type="file"
              multiple
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                draft.addFiles(e.target.files);
                // Reset so re-picking the same file fires onChange again.
                e.target.value = "";
              }}
            />
          </label>

          <AnimatePresence initial={false}>
            {draft.images.length > 0 && (
              <motion.ul
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.18 }}
                className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 mt-3 overflow-hidden"
              >
                {draft.images.map((img, i) => (
                  <motion.li
                    key={img.id}
                    layout
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.94 }}
                    transition={{ duration: 0.15 }}
                    className="group relative aspect-square"
                  >
                    <img
                      src={img.url}
                      alt={img.file.name}
                      className="w-full h-full object-cover rounded-xl border border-border/70"
                    />
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-md bg-black/65 text-white text-[9.5px] font-bold uppercase tracking-wide">
                        Cover
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => draft.removeImage(img.id)}
                      aria-label={`Remove ${img.file.name}`}
                      className="absolute -top-1.5 -right-1.5 grid place-items-center w-6 h-6 rounded-full
                        bg-card border border-border text-muted-foreground shadow-sm
                        opacity-0 group-hover:opacity-100 focus-visible:opacity-100
                        hover:text-red-600 hover:border-red-200 transition-opacity duration-150"
                    >
                      <X size={11} strokeWidth={2.6} />
                    </button>
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>

        {/* ── Copy ── */}
        <div>
          <FieldLabel hint={`${draft.text.length} characters`}>Content</FieldLabel>
          <div
            className={cn(
              "rounded-xl border border-border bg-muted/50 dark:bg-white/5 overflow-hidden",
              "transition-[background-color,border-color,box-shadow] duration-150",
              "focus-within:bg-card focus-within:border-brand focus-within:ring-4 focus-within:ring-brand/15",
            )}
          >
            <Textarea
              ref={draft.textareaRef}
              value={draft.text}
              onChange={(e) => draft.setText(e.target.value)}
              placeholder="What's new — a seasonal offer, a new stay, a place worth visiting…"
              maxLength={20000}
              className="min-h-[140px] border-0 bg-transparent rounded-none resize-y text-[13.5px] leading-relaxed
                focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
            />
            <div className="flex items-center gap-1 px-2 py-1.5 border-t border-border/70 bg-card/60">
              {TOOLS.map(({ icon: Icon, title, apply }) => (
                <button
                  key={title}
                  type="button"
                  onClick={() => apply(draft)}
                  title={title}
                  aria-label={title}
                  className="grid place-items-center w-8 h-8 rounded-lg text-muted-foreground outline-none
                    hover:bg-brand/[0.09] hover:text-brand focus-visible:ring-2 focus-visible:ring-brand/40
                    transition-colors duration-150"
                >
                  <Icon size={14} strokeWidth={2.2} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <footer className={PANEL_FOOTER}>
        <p className="text-[11.5px] text-muted-foreground tabular-nums">{status}</p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={draft.clear}
            disabled={!draft.isDirty || draft.isSubmitting}
            className={BTN_NEUTRAL}
          >
            Clear
          </Button>
          <Button
            type="button"
            onClick={draft.submit}
            disabled={!draft.canSubmit || draft.isSubmitting}
            className={BTN_PRIMARY}
          >
            {draft.isSubmitting && <Loader2 size={14} className="animate-spin" />}
            {draft.isSubmitting ? "Publishing" : "Publish post"}
          </Button>
        </div>
      </footer>
    </Panel>
  );
};

export default PostComposer;
