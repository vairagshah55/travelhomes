import React from "react";
import { Eye, ImageIcon } from "lucide-react";
import { Panel, PanelHead } from "@/components/shared";
import { cn } from "@/lib/utils";
import type { PostDraft } from "./usePostDraft";

/**
 * Live render of the draft in the shape the record is stored in: a cover image,
 * the remaining photos as an `additionalCount`, and the copy. Gives the vendor
 * something to check before publishing instead of a blind textarea.
 */
export const PostPreview: React.FC<{ draft: PostDraft }> = ({ draft }) => {
  const [cover, ...rest] = draft.images;
  const extra = Math.max(0, rest.length - 2);
  const body = draft.text.trim();

  return (
    <Panel>
      <PanelHead icon={Eye} title="Preview" blurb="How this post is stored." />

      <div className="p-4 space-y-3">
        {cover ? (
          <div className="space-y-2">
            <img
              src={cover.url}
              alt="Cover preview"
              className="w-full aspect-[4/3] object-cover rounded-xl border border-border"
            />
            {rest.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {rest.slice(0, 2).map((img) => (
                  <img
                    key={img.id}
                    src={img.url}
                    alt=""
                    className="w-full aspect-square object-cover rounded-lg border border-border"
                  />
                ))}
                {rest.length > 2 && (
                  <div className="grid place-items-center aspect-square rounded-lg border border-border bg-muted/60 dark:bg-white/5">
                    <span className="text-[13px] font-bold text-muted-foreground tabular-nums">
                      +{extra}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="grid place-items-center gap-2 aspect-[4/3] rounded-xl border border-dashed border-border bg-muted/40 dark:bg-white/[0.02]">
            <ImageIcon size={22} strokeWidth={1.6} className="text-muted-foreground/50" />
            <p className="text-[11.5px] text-muted-foreground/70">No photo yet</p>
          </div>
        )}

        <p
          className={cn(
            "text-[13px] leading-relaxed whitespace-pre-wrap break-words line-clamp-[8]",
            body ? "text-foreground/85" : "text-muted-foreground/60 italic",
          )}
        >
          {body || "Your copy will appear here."}
        </p>

        <p className="text-[11px] text-muted-foreground/70">Just now</p>
      </div>
    </Panel>
  );
};

export default PostPreview;
