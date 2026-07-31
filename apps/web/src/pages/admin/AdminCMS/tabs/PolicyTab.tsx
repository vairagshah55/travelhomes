import React, { useEffect, useState } from "react";
import { Loader2, Plus, ScrollText, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cmsService } from "@/services/cms";
import RichTextEditor from "@/components/admin/RichTextEditor";
import ConfirmModal from "@/components/shared/ConfirmModal";
import { EmptyState } from "@/components/shared/EmptyState";
import { BTN_PRIMARY, BTN_SOFT, CmsField, CmsSegmented, CONTROL } from "../ui";

type PolicyTabId = "terms-and-conditions" | "privacy-policy" | "vendor-policy";

const POLICIES: { value: PolicyTabId; label: string; title: string }[] = [
  { value: "terms-and-conditions", label: "Terms & conditions", title: "Terms & Conditions" },
  { value: "privacy-policy", label: "Privacy policy", title: "Privacy Policy" },
  { value: "vendor-policy", label: "Vendor policy", title: "Vendor Policy" },
];

interface PolicySection {
  heading: string;
  content: string;
}

/**
 * Policy editor — T&C / Privacy / Vendor policies, each a page title plus
 * ordered sections (heading + rich text). Self-contained: loads on policy
 * change, saves on demand.
 */
export function PolicyTab() {
  const [activePolicy, setActivePolicy] = useState<PolicyTabId>("privacy-policy");
  const [policyName, setPolicyName] = useState("");
  const [sections, setSections] = useState<PolicySection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<number | null>(null);

  const current = POLICIES.find((p) => p.value === activePolicy) ?? POLICIES[0];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const data = await cmsService.getPage(activePolicy);
        if (cancelled) return;
        setPolicyName(data?.title || "");
        setSections(data?.sections || []);
      } catch (e) {
        console.error("Failed to fetch policy page", e);
        if (!cancelled) toast.error("Could not load this policy");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activePolicy]);

  const addSection = () => setSections((prev) => [...prev, { heading: "", content: "" }]);

  const removeSection = (index: number) =>
    setSections((prev) => prev.filter((_, i) => i !== index));

  const updateSection = (index: number, field: keyof PolicySection, value: string) =>
    setSections((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: value } : s)));

  const handleSave = async () => {
    setSaving(true);
    try {
      await cmsService.updatePage(activePolicy, { title: policyName, sections });
      toast.success(`${current.title} saved`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to save policy");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <CmsSegmented
        items={POLICIES}
        value={activePolicy}
        onChange={setActivePolicy}
        layoutId="cmsPolicyPill"
        ariaLabel="Policy"
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[12.5px] text-app-fg-muted">
          Sections render in this order on the public {current.label.toLowerCase()} page.
        </p>
        <button onClick={handleSave} disabled={saving || loading} className={BTN_PRIMARY}>
          {saving ? (
            <>
              <Loader2 size={15} className="animate-spin" /> Saving…
            </>
          ) : (
            "Save policy"
          )}
        </button>
      </div>

      <div>
        {loading ? (
          <div className="space-y-3">
            <div className="h-11 rounded-xl bg-app-surface-2 animate-pulse" />
            <div className="h-40 rounded-xl bg-app-surface-2 animate-pulse" />
          </div>
        ) : (
          <div className="space-y-5">
            <CmsField label="Page title" htmlFor="policy-title" className="max-w-xl">
              <input
                id="policy-title"
                value={policyName}
                onChange={(e) => setPolicyName(e.target.value)}
                placeholder={current.title}
                className={CONTROL}
              />
            </CmsField>

            {sections.length === 0 ? (
              <div className="rounded-xl border border-dashed border-app-border">
                <EmptyState
                  icon={ScrollText}
                  title="No sections yet"
                  description="Add a section for each heading in this policy."
                  actionLabel="Add section"
                  onAction={addSection}
                />
              </div>
            ) : (
              <div className="space-y-3">
                {sections.map((section, index) => (
                  <section
                    key={index}
                    className="rounded-xl border border-app-border overflow-hidden"
                  >
                    <header className="flex items-center justify-between gap-3 px-3.5 py-2.5 border-b border-app-border bg-app-surface-2">
                      <p className="text-[12.5px] font-bold text-app-fg">Section {index + 1}</p>
                      <button
                        type="button"
                        onClick={() => setPendingRemove(index)}
                        aria-label={`Remove section ${index + 1}`}
                        className="p-1.5 rounded-md text-app-fg-muted transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
                      >
                        <Trash2 size={15} />
                      </button>
                    </header>
                    <div className="p-3.5 space-y-3">
                      <CmsField label="Heading" htmlFor={`policy-heading-${index}`}>
                        <input
                          id={`policy-heading-${index}`}
                          value={section.heading}
                          onChange={(e) => updateSection(index, "heading", e.target.value)}
                          placeholder="e.g. Cancellations and refunds"
                          className={CONTROL}
                        />
                      </CmsField>
                      <CmsField label="Content">
                        <RichTextEditor
                          value={section.content}
                          onChange={(val) => updateSection(index, "content", val)}
                          placeholder="Write this section…"
                          className="w-full"
                          style={{ minHeight: "200px" }}
                        />
                      </CmsField>
                    </div>
                  </section>
                ))}

                <button type="button" onClick={addSection} className={BTN_SOFT}>
                  <Plus size={14} strokeWidth={2.4} /> Add section
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmModal
        open={pendingRemove !== null}
        onClose={() => setPendingRemove(null)}
        onConfirm={() => {
          if (pendingRemove !== null) removeSection(pendingRemove);
          setPendingRemove(null);
        }}
        title="Remove section"
        description="The section is removed from the editor — save the policy to apply it to the live page."
        confirmLabel="Remove"
        variant="warning"
      />
    </div>
  );
}

export default PolicyTab;
