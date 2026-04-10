// import { clsx, type ClassValue } from "clsx";
// import { twMerge } from "tailwind-merge";

// export function cn(...inputs: ClassValue[]) {
//   return twMerge(clsx(inputs));
// }

// export function getImageUrl(path: string | undefined | null) {
//   if (!path) return "";
//   if (path.startsWith("http") || path.startsWith("blob:") || path.startsWith("data:")) return path;
//   const baseUrl = import.meta.env.VITE_API_BASE_URL_MEDIA || "";
//   return `${baseUrl}${path}`;
// }

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getImageUrl(path?: string | null) {
  if (!path) return "/fallback.jpg";

  if (
    path.startsWith("http") ||
    path.startsWith("blob:") ||
    path.startsWith("data:")
  ) {
    return path;
  }

  const baseUrl = import.meta.env.VITE_API_BASE_URL_MEDIA;

  if (!baseUrl) {
    console.error("Missing VITE_API_BASE_URL_MEDIA");
    return "/fallback.jpg";
  }

  return `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
}