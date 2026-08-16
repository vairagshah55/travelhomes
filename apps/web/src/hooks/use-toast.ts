import { toast as sonnerToast } from "sonner";

/**
 * shadcn `useToast` API, backed by sonner.
 *
 * The app shipped three toast systems mounted side by side in App.tsx — the
 * Radix-based shadcn toaster, sonner, and react-hot-toast — all three in the
 * initial bundle. sonner had by far the widest adoption, so it won; this file
 * keeps the shadcn `{ title, description, variant }` call shape working so the
 * remaining call sites (Footer, AccountSettings) keep their exact copy instead
 * of being rewritten by hand.
 *
 * The original was a 188-line reducer + listener store reimplementing what
 * sonner already does. Prefer importing `toast` from "sonner" directly in new
 * code; this exists for the existing callers.
 */

type ToastVariant = "default" | "destructive";

export interface ToastOptions {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: ToastVariant;
  duration?: number;
}

/** Render a toast from the shadcn-shaped options object. */
function toast({ title, description, variant, duration }: ToastOptions) {
  // sonner takes a message plus an options bag. When both title and
  // description are present the title is the message and the description hangs
  // below it, which is how the shadcn toaster rendered them too.
  const message = title ?? description ?? "";
  const opts = {
    ...(title && description ? { description } : {}),
    ...(duration ? { duration } : {}),
  };

  const id =
    variant === "destructive" ? sonnerToast.error(message, opts) : sonnerToast(message, opts);

  return {
    id: String(id),
    dismiss: () => sonnerToast.dismiss(id),
    update: () => {
      /* no-op: sonner updates by re-issuing a toast with the same id */
    },
  };
}

function useToast() {
  return {
    toast,
    dismiss: (id?: string) => sonnerToast.dismiss(id),
    // The old store exposed the live toast list for the <Toaster/> to render.
    // sonner renders its own, so nothing consumes this any more.
    toasts: [] as const,
  };
}

export { useToast, toast };
