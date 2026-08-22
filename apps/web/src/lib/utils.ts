import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Shipped in `public/`. Used wherever an image is missing or fails to load. */
export const PLACEHOLDER_IMAGE = "/placeholder.svg";
/** App-owned assets that must never be rewritten onto the API origin. */
const LOCAL_ASSETS = [PLACEHOLDER_IMAGE, "/user-avatar.svg"];

/**
 * Resolve an image reference from the API into something an `<img>` can load.
 *
 * Server-stored paths arrive relative (`/uploads/cover-123.jpg`) but the API is
 * a different origin from the SPA everywhere except behind the dev proxy, so
 * they have to be pointed at `VITE_API_BASE_URL_MEDIA`. Absolute URLs, blobs and
 * `data:` payloads are already loadable and pass through untouched.
 *
 * `/placeholder.svg` and `/user-avatar.svg` are the app's OWN files in
 * `public/`, and several call sites pass them in as their fallback. Prefixing
 * those aimed them at the API host, which 404s — so the fallback for a broken
 * image was itself a broken image. They stay local.
 */
export function getImageUrl(path?: string | null) {
  if (!path) return PLACEHOLDER_IMAGE;

  if (
    path.startsWith("http") ||
    path.startsWith("blob:") ||
    path.startsWith("data:") ||
    LOCAL_ASSETS.includes(path)
  ) {
    return path;
  }

  const baseUrl = import.meta.env.VITE_API_BASE_URL_MEDIA;

  if (!baseUrl) {
    console.error("Missing VITE_API_BASE_URL_MEDIA");
    return PLACEHOLDER_IMAGE;
  }

  return `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}
