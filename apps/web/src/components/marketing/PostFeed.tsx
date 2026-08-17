import React, { useState } from "react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ImageIcon, Layers, Megaphone, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { marketingApi, type MarketingContentDTO } from "@/lib/api";
import { ConfirmModal, EmptyState, Panel, PanelHead } from "@/components/shared";
import { cn } from "@/lib/utils";
import { marketingPostsKey, mediaUrl, relativeDate } from "./api";

interface PostFeedProps {
  posts: MarketingContentDTO[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

const CardShell = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-[14px] border border-border overflow-hidden bg-card">{children}</div>
);

const SkeletonCard = () => (
  <CardShell>
    <div className="aspect-[4/3] bg-muted animate-pulse" />
    <div className="p-3.5 space-y-2">
      <div className="h-3 w-full rounded bg-muted animate-pulse" />
      <div className="h-3 w-2/3 rounded bg-muted animate-pulse" />
      <div className="h-2.5 w-16 rounded bg-muted animate-pulse" />
    </div>
  </CardShell>
);

export const PostFeed: React.FC<PostFeedProps> = ({ posts, isLoading, isError, onRetry }) => {
  const queryClient = useQueryClient();
  const [pendingDelete, setPendingDelete] = useState<MarketingContentDTO | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await marketingApi.delete(pendingDelete._id);
      queryClient.setQueryData<MarketingContentDTO[]>(marketingPostsKey, (prev) =>
        (prev ?? []).filter((p) => p._id !== pendingDelete._id),
      );
      toast.success("Post deleted.");
      setPendingDelete(null);
    } catch {
      toast.error("Couldn't delete this post.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <Panel>
        <PanelHead
          icon={Megaphone}
          title="Published posts"
          blurb="Everything currently in the marketing feed."
          aside={
            !isLoading && !isError && posts.length > 0 ? (
              <span className="text-[11.5px] font-semibold tabular-nums text-muted-foreground">
                {posts.length} {posts.length === 1 ? "post" : "posts"}
              </span>
            ) : undefined
          }
        />

        {isError ? (
          <div className="flex flex-col items-center text-center gap-3 py-14 px-6">
            <span className="grid place-items-center w-12 h-12 rounded-full bg-red-50 dark:bg-red-500/10">
              <AlertCircle size={22} className="text-red-500" />
            </span>
            <p className="text-[13px] text-muted-foreground max-w-sm">
              We couldn&apos;t load the marketing feed.
            </p>
            <button
              onClick={onRetry}
              className="h-9 px-4 rounded-full bg-brand text-brand-fg text-[13px] font-semibold hover:bg-brand-hover transition-colors"
            >
              Try again
            </button>
          </div>
        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <EmptyState
            icon={ImageIcon}
            title="No posts yet"
            description="Publish your first post and it will show up here."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 p-5">
            {posts.map((post, i) => {
              const images = post.images ?? [];
              const extra = Math.max(0, images.length - 1);
              return (
                <motion.article
                  key={post._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i, 8) * 0.03, duration: 0.22 }}
                  className={cn(
                    "group rounded-[14px] border border-border overflow-hidden bg-card",
                    "transition-[transform,box-shadow] duration-200",
                    "hover:-translate-y-0.5 hover:shadow-[0_1px_2px_rgba(16,24,40,0.05),0_14px_30px_-18px_rgba(16,24,40,0.35)]",
                  )}
                >
                  <div className="relative aspect-[4/3] bg-muted/60 dark:bg-white/[0.03]">
                    {images.length > 0 ? (
                      <img
                        src={mediaUrl(images[0])}
                        alt=""
                        loading="lazy"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = "/placeholder.svg";
                        }}
                      />
                    ) : (
                      <div className="grid place-items-center h-full">
                        <ImageIcon
                          size={22}
                          strokeWidth={1.6}
                          className="text-muted-foreground/40"
                        />
                      </div>
                    )}

                    {extra > 0 && (
                      <span className="absolute bottom-2 right-2 inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-black/60 text-white text-[10.5px] font-bold tabular-nums">
                        <Layers size={11} strokeWidth={2.4} />+{extra}
                      </span>
                    )}
                  </div>

                  <div className="p-3.5">
                    <p
                      className={cn(
                        "text-[12.5px] leading-relaxed whitespace-pre-wrap break-words line-clamp-3 min-h-[54px]",
                        post.content ? "text-foreground/85" : "text-muted-foreground/60 italic",
                      )}
                    >
                      {post.content || "No copy"}
                    </p>
                    <div className="flex items-center justify-between gap-2 mt-2.5 pt-2.5 border-t border-border/60">
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        {relativeDate(post.createdAt)}
                      </span>
                      <button
                        onClick={() => setPendingDelete(post)}
                        aria-label="Delete post"
                        className="grid place-items-center w-7 h-7 rounded-lg text-muted-foreground/70 outline-none
                          hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10
                          focus-visible:ring-2 focus-visible:ring-red-500/40 transition-colors duration-150"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </Panel>

      <ConfirmModal
        open={!!pendingDelete}
        onClose={() => !deleting && setPendingDelete(null)}
        onConfirm={confirmDelete}
        title="Delete this post?"
        description="It will be removed from the marketing feed permanently."
        confirmLabel="Delete"
        variant="danger"
        isLoading={deleting}
      />
    </>
  );
};

export default PostFeed;
