import React, { useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

interface InclusionExclusionStepProps {
  priceIncludes: string[];
  priceExcludes: string[];
  expectations: string[];
  onAddListItem: (key: "priceIncludes" | "priceExcludes" | "expectations", value: string) => void;
  onRemoveListItem: (key: "priceIncludes" | "priceExcludes" | "expectations", index: number) => void;
}

const InclusionExclusionStep: React.FC<InclusionExclusionStepProps> = ({
  priceIncludes,
  priceExcludes,
  expectations,
  onAddListItem,
  onRemoveListItem,
}) => {
  const priceIncludeRef = useRef<HTMLInputElement>(null);
  const priceExcludeRef = useRef<HTMLInputElement>(null);
  const expectationRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col items-center gap-8 w-full ">
      <h1 className="text-3xl font-bold text-black dark:text-white text-center">
        Inclusion & Exclusion
      </h1>

      <div className="max-w-4xl mx-auto w-full space-y-8">
        {/* Price Includes */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pl-1">
            <Label className="text-base text-[#334054]">
              Above price includes
            </Label>
          </div>

          <div className="space-y-2 pl-1">
            {priceIncludes.map((item, index) => (
              <div
                key={index}
                className="text-base font-semibold text-[#3A3A3A] flex justify-between items-center"
              >
                <span>{item}</span>
                <button
                  type="button"
                  onClick={() => onRemoveListItem("priceIncludes", index)}
                  className="text-red-500 font-bold px-2"
                >
                  x
                </button>
              </div>
            ))}
          </div>

          <Input
            ref={priceIncludeRef}
            placeholder="Text here.."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onAddListItem("priceIncludes", priceIncludeRef.current?.value || "");
                if (priceIncludeRef.current) priceIncludeRef.current.value = "";
              }
            }}
          />

          <button
            type="button"
            onClick={() => {
              const value = priceIncludeRef.current?.value.trim() || "";
              if (!value) return;
              onAddListItem("priceIncludes", value);
              if (priceIncludeRef.current) {
                priceIncludeRef.current.value = "";
              }
            }}
            className="flex items-center gap-2 text-sm font-medium text-[#344054] hover:text-black transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add More
          </button>
        </div>

        {/* Price Excludes */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pl-1">
            <Label className="text-base text-[#334054]">
              Above price excludes
            </Label>
          </div>

          <div className="space-y-2">
            {priceExcludes.map((item, index) => (
              <div
                key={index}
                className="text-base font-semibold text-[#3A3A3A] flex justify-between items-center"
              >
                <span>{item}</span>
                <button
                  type="button"
                  onClick={() => onRemoveListItem("priceExcludes", index)}
                  className="text-red-500 font-bold px-2"
                >
                  x
                </button>
              </div>
            ))}
          </div>

          <Input
            ref={priceExcludeRef}
            placeholder="Text here.."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onAddListItem("priceExcludes", priceExcludeRef.current?.value || "");
                if (priceExcludeRef.current) priceExcludeRef.current.value = "";
              }
            }}
          />

          <button
            type="button"
            onClick={() => {
              onAddListItem("priceExcludes", priceExcludeRef.current?.value || "");
              if (priceExcludeRef.current) priceExcludeRef.current.value = "";
            }}
            className="flex items-center gap-2 text-sm font-medium text-[#344054] hover:text-black transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add More
          </button>
        </div>

        {/* Expectations */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 pl-1">
            <Label className="text-base text-[#334054]">
              What expected from enjoyer
            </Label>
          </div>

          <div className="space-y-2">
            {expectations.map((item, index) => (
              <div
                key={index}
                className="text-base font-semibold text-[#3A3A3A] flex justify-between items-center"
              >
                <span>{item}</span>
                <button
                  type="button"
                  onClick={() => onRemoveListItem("expectations", index)}
                  className="text-red-500 font-bold px-2"
                >
                  x
                </button>
              </div>
            ))}
          </div>

          <Input
            ref={expectationRef}
            placeholder="Text here.."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onAddListItem("expectations", expectationRef.current?.value || "");
                if (expectationRef.current) expectationRef.current.value = "";
              }
            }}
          />

          <button
            type="button"
            onClick={() => {
              onAddListItem("expectations", expectationRef.current?.value || "");
              if (expectationRef.current) expectationRef.current.value = "";
            }}
            className="flex items-center gap-2 text-sm font-medium text-[#344054] hover:text-black transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add More
          </button>
        </div>
      </div>
    </div>
  );
};

export default InclusionExclusionStep;
