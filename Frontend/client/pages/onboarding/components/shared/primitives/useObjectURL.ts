import { useEffect, useMemo } from "react";
import { getImageUrl } from "@/lib/utils";

// Resolves a File or remote URL string into a renderable src.
// For File inputs, creates an object URL once and revokes it on unmount/change
// so previews don't leak memory.
export function useObjectURL(fileOrUrl: File | string | null | undefined): string {
  const src = useMemo(() => {
    if (!fileOrUrl) return "";
    if (typeof fileOrUrl === "string") return getImageUrl(fileOrUrl);
    return URL.createObjectURL(fileOrUrl);
  }, [fileOrUrl]);

  useEffect(() => {
    if (src && typeof fileOrUrl !== "string" && fileOrUrl) {
      return () => URL.revokeObjectURL(src);
    }
  }, [src, fileOrUrl]);

  return src;
}
