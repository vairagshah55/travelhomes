import React, { useState } from "react";
import { Plus, Minus } from "lucide-react";

function FAQItem({ question, answer }: { question: string; answer?: string }) {
  const [openAns, setOpenAns] = useState(false);

  const toggleAnswer = () => setOpenAns((prev) => !prev);

  return (
    <div
      className={`w-full rounded-lg border transition-colors ${
        openAns
          ? "bg-[#e6fafa] dark:bg-black dark:text-white border-[#3bd9da]"
          : "border-[#E4E8F0] hover:border-[#3bd9da]"
      }`}
    >
      <div
        onClick={toggleAnswer}
        className="flex items-start justify-between gap-4 p-4 sm:p-5 md:p-6 cursor-pointer"
      >
        <p className="text-sm md:text-base leading-relaxed flex-1 text-[#0a1c1c] dark:text-white">
          {question}
        </p>

        <div className="flex-shrink-0">
          {openAns ? (
            <Minus className="w-6 h-6 text-[#117479] dark:text-white" />
          ) : (
            <Plus className="w-5 h-5 text-[#0a1c1c] dark:text-white" />
          )}
        </div>
      </div>

      {openAns && answer && (
        <div className="border-t border-[#ccf2f2] p-4 sm:p-5">
          <p className="text-[#1F2A44] dark:text-white text-sm md:text-base leading-relaxed">
            {answer}
          </p>
        </div>
      )}
    </div>
  );
}

export default FAQItem;
