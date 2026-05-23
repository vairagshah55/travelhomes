import Footer from "@/components/Footer";
import Header from "@/components/Header";
import React, { useState, useEffect } from "react";
import { cmsPagesApi } from "@/lib/api";
import { Loader } from "@/components/ui/Loader";

interface PolicySection {
  heading: string;
  content: string;
}

export default function TermsAndConditions() {
  const [content, setContent] = useState("");
  const [sections, setSections] = useState<PolicySection[]>([]);
  const [title, setTitle] = useState("Terms and Conditions");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cmsPagesApi
      .getPage("terms-and-conditions")
      .then((res) => {
        if (res.data) {
          setTitle(res.data.title);
          setContent(res.data.content);

          if (res.data.sections && Array.isArray(res.data.sections)) {
            setSections(res.data.sections);
          }
        }
      })
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-200 transition-colors">
      
  {/* Header */}
  <Header variant="transparent" className="fixed w-full z-50" />
  {/* Loader OR Content */}
  {loading ? (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader size="xl" />
        <p className="text-gray-600 dark:text-gray-400 animate-pulse font-medium">
          Fetching T&C....
        </p>
      </div>
    </div>
  ) : (
    <div>
  {/* Hero Section */}
  <section className="relative h-[320px] md:h-[360px] mt-10 overflow-hidden">
    <div className="absolute inset-0">
      <img
        className="w-full h-full object-cover"
        src="https://api.builder.io/api/v1/image/assets/TEMP/58bfed58f49dafc4198cf3dc2d050bc688e7aca8?width=2880"
        alt="Hero Background"
      />
      <div className="absolute inset-0 bg-black/30" />
    </div>

    <div className="relative z-10 flex items-center justify-center h-full">
      <h1 className="text-white text-4xl md:text-5xl font-semibold text-center px-4">
        {title}
      </h1>
    </div>
  </section>


    <main className="w-full max-w-7xl mx-auto flex-1 px-4 py-10">
      <div className="w-full">
        {sections.length > 0 ? (
          <ol className="list-decimal list-outside pl-6 space-y-10">
            {sections.map((section, index) => (
              <li
                key={index}
                className="text-2xl font-semibold text-gray-800 dark:text-white marker:text-gray-800 dark:marker:text-white"
              >
                <span className="block mb-4">{section.heading}</span>

                <div
                  className="text-base font-normal prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 [&_a]:text-gray-800 dark:[&_a]:text-gray-200 [&_a]:underline"
                  dangerouslySetInnerHTML={{
                    __html: section.content,
                  }}
                />
              </li>
            ))}
          </ol>
        ) : (
          <div
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        )}
      </div>
    </main></div>
  )}

  {/* Footer */}
  <Footer />
</div>
  );
}