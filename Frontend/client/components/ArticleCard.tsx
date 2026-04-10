import React from "react";

function ArticleCard({ image, title }: { image: string; title: string }) {
  return (
    <div className="group cursor-pointer rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
      <div className="h-44 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      <div className="bg-white text-black px-4 py-3 dark:bg-black dark:text-white">
        <h3 className="font-normal text-sm group-hover:text-gray-500 transition-colors duration-300">
          {title}
        </h3>
      </div>
    </div>
  );
}

export default ArticleCard;
