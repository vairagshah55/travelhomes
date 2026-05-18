import React, { useState } from "react";

function ArticleCard({ image, title }: { image: string; title: string }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="group cursor-pointer rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
      <div className="h-44 overflow-hidden bg-gray-100 dark:bg-gray-800">
        {!imgError ? (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/20">
            <span className="text-3xl">📰</span>
          </div>
        )}
      </div>

      <div className="bg-white text-black px-4 py-3 dark:bg-black dark:text-white">
        <h3 className="font-normal text-sm group-hover:text-gray-500 transition-colors duration-300 line-clamp-2">
          {title}
        </h3>
      </div>
    </div>
  );
}

export default ArticleCard;
