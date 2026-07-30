import { useEffect, useRef, useState, type RefObject } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminCmsMediaApi, marketingApi } from "@/lib/api";
import { marketingPostsKey } from "./api";

export interface DraftImage {
  id: string;
  file: File;
  /** Object URL — revoked when the image is removed or the draft unmounts. */
  url: string;
}

export const MAX_IMAGES = 10;
/** Matches the multer ceiling on POST /api/cms/media (cms-media.router.js). */
export const MAX_BYTES = 25 * 1024 * 1024;

export interface PostDraft {
  text: string;
  setText: (v: string) => void;
  images: DraftImage[];
  addFiles: (files: FileList | File[] | null) => void;
  removeImage: (id: string) => void;
  clear: () => void;
  submit: () => Promise<void>;
  insertFormat: (prefix: string, suffix?: string) => void;
  textareaRef: RefObject<HTMLTextAreaElement>;
  isSubmitting: boolean;
  /** `n of m` while images upload — a multi-image post is a slow submit. */
  uploaded: number;
  canSubmit: boolean;
  isDirty: boolean;
}

/**
 * Composer state for the marketing page. Owns the draft so the editor and the
 * live preview render from one source, and so object URLs get revoked instead
 * of leaking a blob per selected file (the previous page called
 * `URL.createObjectURL` inline in render — a fresh URL on every keystroke).
 */
export function usePostDraft(): PostDraft {
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const [images, setImages] = useState<DraftImage[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploaded, setUploaded] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const seq = useRef(0);

  // Mirror for the unmount cleanup — a bare effect would capture the empty
  // initial array and revoke nothing.
  const imagesRef = useRef<DraftImage[]>([]);
  imagesRef.current = images;
  useEffect(() => () => imagesRef.current.forEach((i) => URL.revokeObjectURL(i.url)), []);

  const addFiles = (files: FileList | File[] | null) => {
    if (!files) return;
    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      toast.error(`A post can hold ${MAX_IMAGES} images.`);
      return;
    }

    const accepted: DraftImage[] = [];
    let rejection = "";
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) {
        rejection ||= `${file.name} isn't an image.`;
        continue;
      }
      if (file.size > MAX_BYTES) {
        rejection ||= `${file.name} is larger than 25 MB.`;
        continue;
      }
      if (accepted.length >= room) {
        rejection ||= `Only ${MAX_IMAGES} images per post — the rest were skipped.`;
        continue;
      }
      accepted.push({
        id: `img-${seq.current++}`,
        file,
        url: URL.createObjectURL(file),
      });
    }

    if (accepted.length) setImages((prev) => [...prev, ...accepted]);
    if (rejection) toast.error(rejection);
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const hit = prev.find((i) => i.id === id);
      if (hit) URL.revokeObjectURL(hit.url);
      return prev.filter((i) => i.id !== id);
    });
  };

  const clear = () => {
    imagesRef.current.forEach((i) => URL.revokeObjectURL(i.url));
    setImages([]);
    setText("");
  };

  /** Wraps the selection, then restores it so the user can keep typing. */
  const insertFormat = (prefix: string, suffix = "") => {
    const el = textareaRef.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end, value } = el;
    setText(
      `${value.slice(0, start)}${prefix}${value.slice(start, end)}${suffix}${value.slice(end)}`,
    );
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, end + prefix.length);
    });
  };

  const canSubmit = text.trim().length > 0 || images.length > 0;
  const isDirty = canSubmit;

  const submit = async () => {
    if (!canSubmit || isSubmitting) return;
    setIsSubmitting(true);
    setUploaded(0);
    try {
      const urls: string[] = [];
      for (const img of images) {
        const res = await adminCmsMediaApi.upload(img.file, "marketing", "content");
        // The old page dropped failed uploads on the floor and posted anyway,
        // so a post could publish with images silently missing.
        if (!res.success || !res.data?.url) throw new Error(`Upload failed for ${img.file.name}`);
        urls.push(res.data.url);
        setUploaded((n) => n + 1);
      }
      await marketingApi.create({
        content: text.trim(),
        images: urls,
        additionalCount: Math.max(0, urls.length - 1),
      });
      clear();
      queryClient.invalidateQueries({ queryKey: marketingPostsKey });
      toast.success("Post published.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't publish this post.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    text,
    setText,
    images,
    addFiles,
    removeImage,
    clear,
    submit,
    insertFormat,
    textareaRef,
    isSubmitting,
    uploaded,
    canSubmit,
    isDirty,
  };
}
