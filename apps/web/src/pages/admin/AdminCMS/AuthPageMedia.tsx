import React from "react";
import { ImageOff, Loader2, Upload } from "lucide-react";
import { getImageUrl } from "@/lib/adminUtils";
import { cn } from "@/lib/utils";
import { BTN_SOFT } from "./ui";

interface AuthPageMediaProps {
  page: string;
  slices: (string | null)[] | undefined;
  loading: boolean;
  uploading: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Preview + upload control for one auth page's hero collage.
 *
 * The public <Gallery /> lays the five stored tiles out as a 3-tile left column
 * and a 2-tile right column; this mirrors that exactly, so what the admin sees is
 * what visitors get. Uploading replaces all five at once.
 */
export const AuthPageMedia: React.FC<AuthPageMediaProps> = ({
  page,
  slices,
  loading,
  uploading,
  inputRef,
  onFileChange,
}) => {
  const tiles = slices || [];
  const hasAny = tiles.some(Boolean);

  const Tile: React.FC<{ index: number; className: string }> = ({ index, className }) => {
    const url = tiles[index];
    return (
      <div
        className={cn(
          "grid place-items-center overflow-hidden rounded-lg border border-app-border bg-app-surface-2",
          className,
        )}
      >
        {url ? (
          <img
            src={getImageUrl(url)}
            alt={`${page} tile ${index + 1}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <ImageOff size={14} className="text-app-fg-subtle" />
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-wrap items-start gap-5">
      {loading ? (
        <div className="w-[280px] h-[280px] rounded-xl bg-app-surface-2 animate-pulse" />
      ) : (
        <div className="w-[280px] h-[280px] flex gap-2">
          <div className="flex flex-col gap-2 w-1/2">
            <Tile index={0} className="h-1/3" />
            <Tile index={1} className="h-1/3" />
            <Tile index={2} className="h-1/3" />
          </div>
          <div className="flex flex-col gap-2 w-1/2">
            <Tile index={3} className="h-1/2" />
            <Tile index={4} className="h-1/2" />
          </div>
        </div>
      )}

      <div className="flex-1 min-w-[220px] space-y-3">
        <p className="text-[12.5px] leading-relaxed text-app-fg-muted">
          One image becomes the whole collage — it is cut into these five tiles and each is stored
          at its own position.
        </p>
        {!loading && !hasAny && (
          <p className="text-[12px] font-medium text-amber-600 dark:text-amber-400">
            No image set — the page falls back to its built-in default.
          </p>
        )}
        <input
          type="file"
          accept="image/*"
          ref={inputRef}
          className="hidden"
          onChange={onFileChange}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || loading}
          className={BTN_SOFT}
        >
          {uploading ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Uploading…
            </>
          ) : (
            <>
              <Upload size={14} /> {hasAny ? "Replace image" : "Upload image"}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AuthPageMedia;
