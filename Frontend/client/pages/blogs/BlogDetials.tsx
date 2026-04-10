import Footer from "@/components/Footer";
import Header from "@/components/Header";
import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { API_BASE_URL } from "@/lib/api";
import { FaLinkedin, FaTwitter, FaShareAlt } from "react-icons/fa";
import toast from "react-hot-toast";
import { getImageUrl } from "@/lib/utils";
import { Loader } from "@/components/ui/Loader";

// Types should match server Blog model
type BlogDTO = {
  _id: string;
  title: string;
  slug: string;
  category?: string;
  description?: string;
  content?: string;
  coverImage?: string;
  authorName?: string;
  authorImg?: string;
  authorRole?: string;
  createdAt?: string;
  status?: 'draft'|'published';
};

type ApiItem<T> = { success: boolean; data: T };

export default function BlogDetailsPage() {
  const { slug: slugFromParams } = useParams<{ slug: string }>();
  const location = useLocation();
  const [blog, setBlog] = useState<BlogDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latest, setLatest] = useState<BlogDTO[]>([]);

  useEffect(() => {
    window.scrollTo(0, 0);
    let ignore = false;

    // Determine slug from route params or query string
    const url = new URL(window.location.href);
    const slugFromQuery = url.searchParams.get('slug') || undefined;
    const slug = slugFromParams || slugFromQuery;

    (async () => {
      if (!slug) {
        setError('Missing blog slug');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE_URL}/api/blogs/${encodeURIComponent(slug)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as ApiItem<BlogDTO>;
        if (!ignore) setBlog(data.data);
      } catch (e: any) {
        if (!ignore) setError(e?.message || 'Failed to load blog');
      } finally {
        if (!ignore) setLoading(false);
      }
    })();

    // Also fetch latest articles for the bottom grid
    (async () => {
      try {
        const r = await fetch(`${API_BASE_URL}/api/blogs?status=published&limit=4`);
        if (r.ok) {
          const j = await r.json() as { success: boolean; data: BlogDTO[] };
          if (!ignore) setLatest(j.data || []);
        }
      } catch {}
    })();

    return () => { ignore = true; };
  }, [slugFromParams, location.search]);

  const authorLabel = useMemo(() => {
    if (!blog) return '';
    const date = blog.createdAt ? new Date(blog.createdAt).toLocaleDateString() : '';
    return `${blog.authorName || '—'}${date ? ' • ' + date : ''}`;
  }, [blog]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: blog?.title,
          text: blog?.description,
          url: window.location.href,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleLinkedInShare = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  const handleTwitterShare = () => {
    const text = encodeURIComponent(blog?.title || '');
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };




    useEffect(() => {
    // Simulate dynamic data fetching
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <Loader size="xl" />
          <p className="text-gray-600 dark:text-gray-400 animate-pulse font-medium">
       Fetching blog content...

          </p>
        </div>
      </div>
    );
  }
  return (
    <>
      <div className="min-h-screen flex-col flex gap-0 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-200 transition-colors">
        <Header variant="transparent" className="fixed w-full z-50" />
{loading && (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <Loader size="xl" />
          <p className="text-gray-600 dark:text-gray-400 animate-pulse font-medium">
        Fetching blog content...
          </p>
        </div>
      </div>
    )
  }
        <div className="min-h-screen mt-2 bg-white text-gray-900 font-sans pb-12">
          {/* Top Bar / Breadcrumbs */}
          <div className="px-4 md:px-6 lg:px-10 pt-24">
            <div className="text-sm text-gray-500">
              <Link to="/blogs" className="hover:underline">Blogs</Link>
              {blog?.title ? <span> / {blog.title}</span> : null}
            </div>
          </div>

          {/* Loading / Error */}
          <div className="max-w-4xl mx-auto px-4 md:px-0 mt-4">
            {loading && <div className="text-gray-600">Loading…</div>}
            {error && (
              <div className="text-red-600">{error}</div>
            )}
          </div>

          {!loading && !error && blog && (
            <>
              {/* Author & Title header */}
              <div className="bg-black py-2 px-4 md:px-24 w-full">
                <div className="flex mt-6 md:mt-10 items-center gap-3 text-gray-200 mb-4">
                  {blog.authorImg ? (
                    <img src={getImageUrl(blog.authorImg) || "/user-avatar.svg"} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-700" />
                  )}
                  <div>
                    <p className="text-xs tracking-wide">{authorLabel}</p>
                    {blog.authorRole && (
                      <p className="text-[10px] opacity-60">{blog.authorRole}</p>
                    )}
                  </div>
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-50 mb-3">
                  {blog.title}
                </h1>
              </div>

              {/* Featured Image */}
              {blog.coverImage && (
                <div className="w-full flex justify-center">
                  <img
                    src={getImageUrl(blog.coverImage) || "" }
                    alt={blog.title}
                    className="rounded-xl mt-4 mb-4 shadow-lg w-full max-w-4xl h-64 object-cover object-center"
                  />
                </div>
              )}

              {/* Blog Content */}
              <div className="max-w-4xl mx-auto px-4 md:px-0">
                {/* description */}
                {blog.description && (
                  <p className="text-gray-700 leading-relaxed whitespace-pre-line mb-4">
                    {blog.description}
                  </p>
                )}
                {/* content (rich text as plain for now) */}
                {blog.content && (
                  <div className="prose max-w-none">
                    <p className="text-gray-800 whitespace-pre-line">{blog.content}</p>
                  </div>
                )}

                <div className="my-8 flex flex-wrap gap-4 items-center">
                  <button
                    onClick={handleShare}
                    className="flex items-center gap-2 border border-gray-300 rounded-full py-2.5 px-6 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                  >
                    <FaShareAlt className="text-gray-500" />
                    Share article
                  </button>
                  <button
                    onClick={handleLinkedInShare}
                    className="flex items-center gap-2 border border-[#0077b5] text-[#0077b5] rounded-full py-2.5 px-6 text-sm font-medium hover:bg-[#0077b5] hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0077b5]"
                  >
                    <FaLinkedin className="text-lg" />
                    LinkedIn
                  </button>
                  <button
                    onClick={handleTwitterShare}
                    className="flex items-center gap-2 border border-[#1DA1F2] text-[#1DA1F2] rounded-full py-2.5 px-6 text-sm font-medium hover:bg-[#1DA1F2] hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1DA1F2]"
                  >
                    <FaTwitter className="text-lg" />
                    Twitter
                  </button>
                </div>
              </div>

              {/* Latest Articles */}
              <div className="max-w-5xl mx-auto px-4 mt-12">
                <h3 className="text-xl font-semibold mb-4">Latest Articles</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                  {(latest || []).map((art) => (
                    <Link
                      to={`/blogsDetials?slug=${art.slug}`}
                      key={art._id}
                      className="bg-gray-100 rounded-lg overflow-hidden shadow hover:shadow-lg transition-shadow"
                    >
                      {art.coverImage ? (
                        <img src={art.coverImage} alt={art.title} className="h-32 w-full object-cover" />
                      ) : (
                        <div className="h-32 w-full bg-gray-200" />
                      )}
                      <div className="p-3">
                        <h4 className="text-sm font-medium text-gray-800 line-clamp-2">
                          {art.title}
                        </h4>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
        <Footer />
      </div>
    </>
  );
}