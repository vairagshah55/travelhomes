import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Link } from "react-router-dom";
import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { getImageUrl } from "@/lib/utils";
import { Loader } from "@/components/ui/Loader";

// Blog DTO from server
type BlogDTO = {
  _id: string;
  title: string;
  slug: string;
  category?: string;
  description?: string;
  coverImage?: string;
  authorName?: string;
  authorImg?: string;
  authorRole?: string;
  createdAt?: string;
};

export default function Blog() {
  const [articles, setArticles] = useState<Array<{
    id: string | number;
    category?: string;
    blogDetail?: string;
    title: string;
    description?: string;
    author?: string;
    authorImg?: string;
    authorrole?: string;
    date?: string;
    image?: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE_URL}/api/blogs?status=published&limit=10`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json() as { success: boolean; data: BlogDTO[] };
        const mapped = (data.data || []).map((b) => ({
          id: b._id,
          category: b.category,
          blogDetail: `/blogsDetials?slug=${b.slug}`,
          title: b.title,
          description: b.description,
          author: b.authorName,
          authorImg: b.authorImg,
          authorrole: b.authorRole,
          date: b.createdAt ? new Date(b.createdAt).toLocaleDateString() : undefined,
          image: b.coverImage,
        }));
        setArticles(mapped);
      } catch (e: any) {
        setError(e.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);


    useEffect(() => {
    // Simulate dynamic data fetching
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);


  return (
    <>
      <div className="min-h-screen flex-col flex gap-0 bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-200 transition-colors">
        <Header variant="transparent" className="fixed w-full z-50" />
    {loading && (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <Loader size="xl" />
          <p className="text-gray-600 dark:text-gray-400 animate-pulse font-medium">
            Fetching the latest articles...
          </p>
        </div>
      </div>
    )
  }    <section className="relative h-[380px]  md:h-[280px] max-md:mt-20 md:mt-10 overflow-visible z-10">
          {/* Background Image */}
          <div className="absolute inset-0">
            <img
              className="w-full h-full  max-md:h-[390px]  object-cover"
              src="https://api.builder.io/api/v1/image/assets/TEMP/58bfed58f49dafc4198cf3dc2d050bc688e7aca8?width=2880"
              alt="Hero Background"
            />
            <div className="absolute inset-0 bg-black/20 max-md:h-[390px]" />
          </div>

          {/* Content */}
          <div className="w-full relative z-10 h-full flex flex-col">
            {/* Hero Content */}
            <div className="w-full  flex flex-col  px-4 md:px-20 justify-start">
              <header className="mb-12 max-w-4xl  mt-16">
                <h2 className="text-white">- THE NEWS</h2>
                <h1 className="text-4xl text-white font-bold mb-2">The Blog</h1>
                <p className="text-gray-300 text-lg">
                  A source of inspiration and information where
                  <br /> innovative ideas and digital trends meet.
                </p>
              </header>
            </div>
          </div>
        </section>

        <div className="dark:bg-gray-900 dark:text-white bg-white text-black min-h-screen p-8 md:p-16 font-sans">
          <main className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-semibold tracking-wide">All News</h2>
              <button className="dark:bg-white dark:text-black font-medium bg-gray-300 rounded-lg py-2 px-4 text-black text-sm">
                {loading ? 'Loading…' : `${articles.length} Articles`}
              </button>
            </div>

            {error && (
              <div className="text-red-600 mb-6">{error}</div>
            )}

          {/* First big featured article */}
{articles.length > 0 && (
  <article className="w-full flex max-md:flex-col mb-10 bg-white dark:bg-black dark:text-white dark:border-slate-300 border rounded-lg overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.1)] mx-auto">
    <Link to={articles[0].blogDetail!} className="flex max-md:flex-col w-full">
      
      {/* Image */}
      <img
        src={getImageUrl(articles[0].image) || '/blog1.jpg'}
        alt={articles[0].title}
        className="w-full h-64 m-4 object-cover rounded-xl"
      />

      {/* Content */}
      <div className="p-6 w-full">
        <div className="flex lg:justify-between lg:items-start w-full">
          <p className="text-sm text-indigo-400 bg-indigo-100 inline-block px-3 py-1 rounded-[8px] font-semibold mb-2">
            {articles[0].category}
          </p>
          <time className="text-sm">{articles[0].date}</time>
        </div>

        <h3 className="text-2xl font-bold mb-3 dark:text-white hover:text-indigo-400 cursor-pointer">
          {articles[0].title}
        </h3>

    <p className="text-black mb-6 dark:text-white line-clamp-2">
  {articles[0].description}
</p>

        {/* Footer */}
        <footer className="flex items-center gap-3 text-black text-sm">
          <img
          //  src="/blog1.jpg"
             src={getImageUrl(articles[0].image) || '/blog1.jpg'}
            className="h-12 w-12 rounded-full object-cover"
          />
          <div>
            <p className="text-lg font-semibold dark:text-white">
              {articles[0].author}
            </p>
            <p className="text-xs text-gray-400 dark:text-white">
              {articles[0].authorrole}
            </p>
          </div>
        </footer>
      </div>
    </Link>
  </article>
)}


            {/* Grid for next articles */}
            <div className="grid grid-cols-1 md:grid-cols-3 h-full gap-6 ">
              {articles.slice(1).map((article) => (
                <Link to={article.blogDetail!} key={article.id} className="block">
                  <article
                    className="dark:bg-gray-800 dark:text-white h-[450px] border dark:border-slate-300 bg-white text-black rounded-lg overflow-hidden shadow-[0_4px_30px_rgba(0,0,0,0.1)] flex flex-col hover:shadow-lg transition-shadow"
                  >
                    <img
                      src={article.image}
                      alt={article.title}
                      className="h-[250px] object-cover m-4 rounded-lg "
                    />
                    <div className="px-4 flex flex-col flex-grow dark:text-white">
                      <div className="flex justify-between">
                        <p className="text-xs text-indigo-400 bg-indigo-200 px-3 py-1 rounded-lg inline-block font-semibold mb-1">
                          {article.category}
                        </p>
                        <time className="text-xs">{article.date}</time>
                      </div>
                      <h4 className="text-lg font-semibold mb-2 hover:text-indigo-400 cursor-pointer">
                        {article.title}
                      </h4>
                    <p className="text-black dark:text-white flex-grow line-clamp-2">
  {article.description}
</p>
                      <footer className="flex items-center justify-start gap-2  text-black text-xs">
                        <img
                          // src={article.authorImg}
                          src="/blog1.jpg"
                          className="w-12 h-12 rounded-full object-cover mb-3"
                        />
                        <p className="text-sm font-semibold dark:text-white">
                          {article.author}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-white">
                          {article.authorrole}
                        </p>
                      </footer>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </main>
        </div>
        <Footer />
      </div>
    </>
  );
}
