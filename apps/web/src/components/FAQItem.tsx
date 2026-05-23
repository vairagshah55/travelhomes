import React, { useState } from "react";
import { Plus, Minus } from "lucide-react";

function FAQItem({ question, answer }: { question: string; answer?: string }) {
  const [openAns, setOpenAns] = useState(false);

  const toggleAnswer = () => setOpenAns((prev) => !prev);

  return (
    <div
      className={`w-full rounded-lg border transition-colors ${
        openAns
          ? "bg-gray-50 dark:bg-black dark:text-white border-gray-200"
          : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div
        onClick={toggleAnswer}
        className="flex items-start justify-between gap-4 p-4 sm:p-5 md:p-6 cursor-pointer"
      >
        <p
          className={`text-sm md:text-base leading-relaxed flex-1 ${
            openAns
              ? "text-gray-800 dark:text-white"
              : "text-gray-900 dark:text-white"
          }`}
        >
          {question}
        </p>

        <div className="flex-shrink-0">
          {openAns ? (
            <Minus className="w-6 h-6 text-gray-900 dark:text-white" />
          ) : (
            <Plus className="w-5 h-5 text-gray-900 dark:text-white" />
          )}
        </div>
      </div>

      {openAns && answer && (
        <div className="border-t border-gray-200 p-4 sm:p-5">
          <p className="text-gray-600 dark:text-white text-sm md:text-base leading-relaxed">
            {answer}
          </p>
        </div>
      )}
    </div>
  );
}

export default FAQItem;