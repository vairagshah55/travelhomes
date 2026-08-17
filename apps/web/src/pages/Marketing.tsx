import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Clock3, ImageIcon, Megaphone, Tag } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { BRAND_VARS, BTN_RAW, BTN_SOFT, StatTile, StatTileSkeleton } from "@/components/shared";
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
  const navigate = useNavigate();
  const draft = usePostDraft();
  const postsQuery = useMarketingPosts();
  const offersQuery = useMyOffers();

  /* `Array.isArray`, not `?? []`. `/api/marketing/content` returns a bare array
     on success, so any error envelope (`{ success: false, … }`) arrives as an
     OBJECT that survives the nullish check and then blows up on `.reduce` —
     white-screening the page instead of showing the feed's error state. Caught
     by the runtime smoke pass; `Offering.tsx` already guards its list this way. */
  const posts = Array.isArray(postsQuery.data) ? postsQuery.data : [];
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
      subtitle="Write a post, see how it will look, and check what promotions are running behind it."
      headerActions={
        <button onClick={() => navigate("/marketing/offers")} className={`${BTN_RAW} ${BTN_SOFT}`}>
          <Tag size={14} strokeWidth={2.2} />
          Manage offers
        </button>
      }
    >
      <div style={BRAND_VARS} className="space-y-5 md:space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
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
              />
              <StatTile
                index={1}
                icon={ImageIcon}
                label="Images"
                hint={
                  stats.posts > 0
                    ? `${(stats.images / stats.posts).toFixed(1)} per post`
                    : "Across all posts"
                }
                value={stats.images}
              />
              <StatTile
                index={2}
                icon={Tag}
                label="Offers live"
                hint="Approved and bookable"
                value={stats.live}
                onClick={() => navigate("/marketing/offers?tab=approved")}
              />
              <StatTile
                index={3}
                icon={Clock3}
                label="Awaiting review"
                hint={stats.pending > 0 ? "Offers with admin" : "Nothing waiting"}
                value={stats.pending}
                onClick={
                  stats.pending > 0
                    ? () => navigate("/marketing/offers?tab=pending")
                    : undefined
                }
              />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          <div className="lg:col-span-2">
            <PostComposer draft={draft} />
          </div>

          {/* Sticky so the preview stays in view while the composer grows.
              `top-4` rather than `top-0`: the shell's <main> is the scroll
              container, so a 0 offset parks the preview flush against the
              header band with no breathing room above it. */}
          <div className="space-y-4 lg:sticky lg:top-4">
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
