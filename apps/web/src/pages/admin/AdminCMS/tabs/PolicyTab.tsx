import React, { useState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cmsService } from "@/services/cms";
import RichTextEditor from "@/components/admin/RichTextEditor";

type PolicyTabId = "T&C" | "Privacy Policy" | "Vendor Policy";

const TAB_TO_KEY: Record<PolicyTabId, string> = {
  "T&C": "terms-and-conditions",
  "Privacy Policy": "privacy-policy",
  "Vendor Policy": "vendor-policy",
};

/**
 * Policy editor — T&C / Privacy / Vendor policies, each with a name + ordered
 * sections (heading + rich-text content). Self-contained: loads from API on
 * tab change, saves on button click. No state lives in the parent.
 */
export function PolicyTab() {
  const [activeTab, setActiveTab] = useState<PolicyTabId>("Privacy Policy");
  const [policyName, setPolicyName] = useState("");
  const [policySections, setPolicySections] = useState<{ heading: string; content: string }[]>([]);

  useEffect(() => {
    const fetchPage = async () => {
      const key = TAB_TO_KEY[activeTab];
      try {
        const data = await cmsService.getPage(key);
        if (data) {
          setPolicyName(data.title || "");
          setPolicySections(data.sections || []);
        } else {
          setPolicyName("");
          setPolicySections([]);
        }
      } catch (e) {
        console.error("Failed to fetch page", e);
      }
    };
    fetchPage();
  }, [activeTab]);

  const handleAddSection = () => {
    setPolicySections([...policySections, { heading: "", content: "" }]);
  };

  const handleRemoveSection = (index: number) => {
    const newSections = [...policySections];
    newSections.splice(index, 1);
    setPolicySections(newSections);
  };

  const handleSectionChange = (index: number, field: "heading" | "content", value: string) => {
    const newSections = [...policySections];
    newSections[index][field] = value;
    setPolicySections(newSections);
  };

  const handleSave = async () => {
    try {
      const key = TAB_TO_KEY[activeTab];
      if (key) {
        await cmsService.updatePage(key, {
          title: policyName,
          sections: policySections,
        });
        toast.success("Policy saved successfully");
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to save policy");
    }
  };

  const fullTitle =
    activeTab === "T&C"
      ? "Terms & Conditions"
      : activeTab === "Privacy Policy"
        ? "Privacy Policy"
        : "Vendor Policy";

  return (
    <div className="space-y-4 flex-1">
      <div className="border border-dashboard-stroke rounded-xl bg-white p-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center max-sm:gap-0 gap-2">
            <div className="flex items-center gap-0.5 px-0.5 py-0.5 border border-gray-200 rounded-full bg-white shadow-sm">
              {(["T&C", "Privacy Policy", "Vendor Policy"] as PolicyTabId[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`px-6 py-3 rounded-full max-sm:text-xs max-xs:px-2 max-sm:py-1 text-sm font-semibold transition-all ${
                    activeTab === t
                      ? "bg-dashboard-primary text-black"
                      : "text-dashboard-primary hover:bg-gray-50"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 bg-dashboard-primary text-black rounded-full font-geist text-sm font-medium tracking-tight hover:bg-dashboard-primary/90 transition-colors"
          >
            Save Policy
          </button>
        </div>

        <div
          className="h-px bg-dashboard-stroke mb-3"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to right, #EAECF0 0, #EAECF0 2px, transparent 2px, transparent 4px)",
          }}
        />

        <div className="flex-1 flex flex-col space-y-4">
          <div className="space-y-3">
            <label className="text-dashboard-title font-plus-jakarta text-sm pl-1">
              {fullTitle} Name
            </label>
            <input
              type="text"
              placeholder={fullTitle}
              value={policyName}
              onChange={(e) => setPolicyName(e.target.value)}
              className="w-full px-3 py-4 border border-dashboard-stroke rounded-lg text-sm text-gray-500 placeholder:text-gray-400 focus:outline-none focus:border-dashboard-primary"
            />
          </div>

          <div className="flex-1 flex flex-col space-y-3">
            <label className="text-dashboard-title font-plus-jakarta text-sm font-medium pl-1">
              {fullTitle} Sections
            </label>

            {policySections.map((section, index) => (
              <div
                key={index}
                className="border border-dashboard-stroke rounded-lg bg-dashboard-bg p-4 space-y-3"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">Section {index + 1}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveSection(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="pl-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Section Heading"
                      value={section.heading}
                      onChange={(e) => handleSectionChange(index, "heading", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-dashboard-primary"
                    />
                  </div>
                  <div className="flex gap-3">
                    <RichTextEditor
                      value={section.content}
                      onChange={(val) => handleSectionChange(index, "content", val)}
                      className="w-full bg-white border-gray-300"
                      placeholder="Section Content..."
                      style={{ minHeight: "200px" }}
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={handleAddSection}
              className="mt-2 px-4 py-2 border border-dashed border-dashboard-primary text-dashboard-primary rounded-lg hover:bg-dashboard-primary/5 transition-colors text-sm"
            >
              + Add Section
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PolicyTab;
