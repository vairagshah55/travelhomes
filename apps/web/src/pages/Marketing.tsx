import { useMemo } from "react";
import { Clock3, ImageIcon, Megaphone, Tag } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { BRAND_VARS, StatTile, StatTileSkeleton } from "@/components/shared";
import {
  OffersSummary,
  PostComposer,
  PostFeed,
  PostPreview,
  useMarketingPosts,
  useMyOffers,
  usePostDraft,
} from "@/components/marketing";

/**
 * Marketing overview — composer on the left, live preview and the offers
 * cross-link on the right rail, published feed underneath.
 *
 * NOTE: `/api/marketing/content` is not vendor-scoped (MarketingContent has no
 * owner field), so this feed is shared across the console. Copy here avoids
 * saying "your posts" until the API grows an owner.
 */
const Marketing = () => {
  const draft = usePostDraft();
  const postsQuery = useMarketingPosts();
  const offersQuery = useMyOffers();

  const posts = postsQuery.data ?? [];
  const offers = offersQuery.data?.items ?? [];

  const stats = useMemo(() => {
    const images = posts.reduce((sum, p) => sum + (p.images?.length ?? 0), 0);
    const live = offers.filter((o) => o.status === "approved").length;
    const pending = offers.filter((o) => o.status === "pending").length;
    return { posts: posts.length, images, live, pending };
  }, [posts, offers]);

  const loadingStats = postsQuery.isLoading || offersQuery.isLoading;

  return (
    <DashboardLayout
      title="Marketing"
      contentClassName="flex-1 overflow-y-auto scrollbar-hide p-4 lg:p-6 bg-muted/40 dark:bg-transparent"
    >
      {/* pb clears the fixed MobileVendorNav on small screens. */}
      <div style={BRAND_VARS} className="max-w-6xl mx-auto space-y-5 pb-24 lg:pb-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {loadingStats ? (
            Array.from({ length: 4 }).map((_, i) => <StatTileSkeleton key={i} />)
          ) : (
            <>
              <StatTile
                index={0}
                icon={Megaphone}
                label="Posts"
                hint="In the feed"
                value={stats.posts}
                color="#117479"
              />
              <StatTile
                index={1}
                icon={ImageIcon}
                label="Images"
                hint="Across all posts"
                value={stats.images}
                color="#3b82f6"
              />
              <StatTile
                index={2}
                icon={Tag}
                label="Offers live"
                hint="Approved and bookable"
                value={stats.live}
                color="#22c55e"
              />
              <StatTile
                index={3}
                icon={Clock3}
                label="Awaiting review"
                hint="Offers with admin"
                value={stats.pending}
                color="#f59e0b"
              />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          <div className="lg:col-span-2">
            <PostComposer draft={draft} />
          </div>

          {/* Sticky so the preview stays in view while the composer grows. */}
          <div className="space-y-5 lg:sticky lg:top-0">
            <PostPreview draft={draft} />
            <OffersSummary
              offers={offers}
              total={offersQuery.data?.total ?? 0}
              isLoading={offersQuery.isLoading}
            />
          </div>
        </div>

        <PostFeed
          posts={posts}
          isLoading={postsQuery.isLoading}
          isError={postsQuery.isError}
          onRetry={() => postsQuery.refetch()}
        />
      </div>
    </DashboardLayout>
  );
};

export default Marketing;
