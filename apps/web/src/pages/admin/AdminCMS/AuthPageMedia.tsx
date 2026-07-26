import React from "react";
import { getImageUrl } from "@/lib/adminUtils";

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
 * The public <Gallery /> lays the five stored tiles out as a 3-tile left
 * column and a 2-tile right column; this mirrors that exactly, so what the
 * admin sees is what visitors get. Uploading replaces all five at once.
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
      <div className={`bg-gray-200 rounded-lg overflow-hidden ${className}`}>
        {url ? (
          <img
            src={getImageUrl(url)}
            alt={`${page} tile ${index + 1}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-500">
            Empty
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {loading ? (
        <div className="w-[300px] h-[300px] rounded-xl bg-gray-100 animate-pulse" />
      ) : (
        <div className="w-[300px] h-[300px] flex gap-2">
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

      {!loading && !hasAny && (
        <p className="w-[300px] text-xs text-dashboard-body">
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
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="w-[300px] py-3 bg-dashboard-primary text-black rounded-full font-geist text-sm font-medium tracking-tight hover:bg-dashboard-primary/90 transition-colors disabled:opacity-60"
      >
        {uploading ? "Uploading..." : "Change Photo"}
      </button>
    </div>
  );
};

export default AuthPageMedia;
