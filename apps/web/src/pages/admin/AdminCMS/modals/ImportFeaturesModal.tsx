import React, { useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  Plus,
  RefreshCw,
  Upload,
  X,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { FeatureIcon } from "@/components/features/featureIcons";
import { BTN_NEUTRAL, BTN_PRIMARY, DIALOG_VARS } from "../ui";
import { buildImportPlan, CSV_COLUMNS, type ImportPlan, type PlannedRow } from "../featuresIo";
import type { Feature } from "../types";

/**
 * CSV import for the Features tab.
 *
 * Three steps, and the middle one is the point: **pick → review → apply**. The
 * file is parsed and planned entirely client-side first, so the admin sees "6
 * new, 2 updated, 1 problem" *before* anything is written. Import that writes
 * on file-select gives no chance to notice that a column was mis-mapped until
 * the list is already wrong — and there's no bulk undo here.
 *
 * Rows are applied one at a time because the API is per-record
 * (`POST/PUT /admin/cms/features`); there is no bulk endpoint. A row that fails
 * is recorded and the run continues, so one bad record can't strand the rest.
 */

export interface ImportFeaturesModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Rows currently in the list — used to decide create vs update. */
  existing: Feature[];
  /**
   * Where the rows land, regardless of what the file's own columns say.
   *
   * `category` is the value actually written and compared against the file's
   * own column; `categoryLabel` is what the admin reads. They differ in
   * "Category selection" mode, where a sub-category's category is the parent
   * property type's **id** — printing that raw id in the header would be
   * meaningless to the person doing the import.
   */
  target: { category: string; type: string; label: string; categoryLabel: string };
  /** Applies one planned row. Resolves on success, rejects to mark it failed. */
  onApplyRow: (row: PlannedRow) => Promise<void>;
  /** Called once after a run so the tab can refetch. */
  onDone: (summary: { created: number; updated: number; failed: number }) => void;
}

type Phase = "pick" | "review" | "running" | "done";

const StatPill = ({
  icon: Icon,
  count,
  label,
  tone,
}: {
  icon: React.ElementType;
  count: number;
  label: string;
  tone: "new" | "update" | "problem";
}) => (
  <div
    className={cn(
      "flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5",
      tone === "new" && "border-app-border bg-app-surface-2",
      tone === "update" && "border-app-border bg-app-surface-2",
      tone === "problem" && count > 0 && "border-red-200 bg-red-50",
      tone === "problem" && count === 0 && "border-app-border bg-app-surface-2",
    )}
  >
    <Icon
      size={16}
      strokeWidth={2.2}
      className={cn(
        tone === "problem" && count > 0 ? "text-red-600" : "text-app-fg-muted",
      )}
    />
    <span className="text-[13px]">
      <span className="font-bold tabular-nums text-app-fg">{count}</span>{" "}
      <span className="text-app-fg-muted">{label}</span>
    </span>
  </div>
);

export const ImportFeaturesModal: React.FC<ImportFeaturesModalProps> = ({
  isOpen,
  onClose,
  existing,
  target,
  onApplyRow,
  onDone,
}) => {
  const [phase, setPhase] = useState<Phase>("pick");
  const [fileName, setFileName] = useState("");
  const [plan, setPlan] = useState<ImportPlan | null>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState({ created: 0, updated: 0, failed: 0 });
  const [failures, setFailures] = useState<{ name: string; reason: string }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setPhase("pick");
    setFileName("");
    setPlan(null);
    setDragging(false);
    setProgress({ done: 0, total: 0 });
    setResult({ created: 0, updated: 0, failed: 0 });
    setFailures([]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const close = () => {
    // A run in flight shouldn't be abandoned halfway.
    if (phase === "running") return;
    reset();
    onClose();
  };

  const readFile = async (file: File) => {
    setFileName(file.name);
    const text = await file.text();
    setPlan(buildImportPlan(text, existing, target));
    setPhase("review");
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void readFile(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) void readFile(file);
  };

  const apply = async () => {
    if (!plan) return;
    const queue = [...plan.creates, ...plan.updates];
    setPhase("running");
    setProgress({ done: 0, total: queue.length });

    let created = 0;
    let updated = 0;
    const failed: { name: string; reason: string }[] = [];

    for (const row of queue) {
      try {
        await onApplyRow(row);
        if (row.action === "create") created++;
        else updated++;
      } catch (e: any) {
        failed.push({
          name: row.name,
          reason: e?.response?.data?.message || e?.message || "Could not be saved",
        });
      }
      setProgress((p) => ({ ...p, done: p.done + 1 }));
    }

    const summary = { created, updated, failed: failed.length };
    setResult(summary);
    setFailures(failed);
    setPhase("done");
    onDone(summary);
  };

  const applyCount = plan ? plan.creates.length + plan.updates.length : 0;
  const warned = plan?.rows.filter((r) => r.action !== "error" && r.warnings.length) ?? [];

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && close()}>
      <DialogContent
        style={DIALOG_VARS}
        className="max-w-2xl w-[calc(100vw-2rem)] p-0 gap-0 rounded-2xl overflow-hidden max-h-[92vh] flex flex-col"
      >
        <DialogHeader className="px-5 py-4 border-b border-app-border text-left">
          <DialogTitle className="text-[15px] font-bold text-app-fg">
            Import {target.label}
          </DialogTitle>
          <DialogDescription className="text-[12.5px] text-app-fg-muted">
            Rows are added to{" "}
            <span className="font-semibold text-app-fg">{target.categoryLabel}</span> →{" "}
            <span className="font-semibold text-app-fg">{target.label}</span>. Nothing is deleted.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
          {/* ── 1. Pick ──────────────────────────────────────────────── */}
          {phase === "pick" && (
            <>
              <input
                ref={inputRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={onPick}
              />
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                className={cn(
                  "w-full rounded-xl border border-dashed px-4 py-10 text-center transition-colors",
                  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-app-accent/20",
                  dragging
                    ? "border-app-accent bg-app-accent-soft"
                    : "border-app-border bg-app-surface-2 hover:border-app-accent hover:bg-app-accent-soft",
                )}
              >
                <span className="flex flex-col items-center gap-3">
                  <Upload size={24} className="text-app-accent" />
                  <span className="text-[13px] font-semibold text-app-fg">
                    Choose a CSV file, or drop one here
                  </span>
                </span>
              </button>

              <div className="mt-4 rounded-xl border border-app-border bg-app-surface-2 px-4 py-3">
                <p className="text-[12.5px] font-semibold text-app-fg">Expected columns</p>
                <p className="mt-1.5 font-mono text-[11.5px] leading-relaxed text-app-fg-muted">
                  {CSV_COLUMNS.join(", ")}
                  <span className="text-app-accent">, iconData</span>
                </p>
                <p className="mt-2.5 text-[12px] leading-relaxed text-app-fg-muted">
                  Only <span className="font-semibold text-app-fg">name</span> is required, and the
                  order doesn't matter. Rows are matched to existing entries by{" "}
                  <span className="font-semibold text-app-fg">id</span>, then by name — so exporting,
                  editing and re-importing updates in place instead of duplicating. Export the
                  current list to get a file in the right shape.
                </p>
                <p className="mt-2 text-[12px] leading-relaxed text-app-fg-muted">
                  Blank cells are left alone rather than clearing what's already saved, and no row is
                  ever deleted by an import.
                </p>
                <p className="mt-2 text-[12px] leading-relaxed text-app-fg-muted">
                  <span className="font-semibold text-app-fg">Icons:</span>{" "}
                  <span className="font-mono text-[11.5px]">icon</span> is a path, which only
                  resolves in the environment it came from. Use{" "}
                  <span className="font-semibold text-app-fg">Export CSV with icons</span> to embed
                  the images in an <span className="font-mono text-[11.5px]">iconData</span> column —
                  those get uploaded here and re-pathed on import.
                </p>
              </div>
            </>
          )}

          {/* ── 2. Review (dry run) ──────────────────────────────────── */}
          {phase === "review" && plan && (
            <>
              <div className="flex items-center gap-2.5 text-[13px] text-app-fg-muted">
                <FileSpreadsheet size={15} className="shrink-0" />
                <span className="truncate font-medium text-app-fg">{fileName}</span>
              </div>

              {plan.fatal ? (
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-600" />
                  <p className="text-[13px] leading-relaxed text-red-800">{plan.fatal}</p>
                </div>
              ) : (
                <>
                  <div className="mt-4 grid grid-cols-3 gap-2.5">
                    <StatPill icon={Plus} count={plan.creates.length} label="to add" tone="new" />
                    <StatPill
                      icon={RefreshCw}
                      count={plan.updates.length}
                      label="to update"
                      tone="update"
                    />
                    <StatPill
                      icon={AlertTriangle}
                      count={plan.errors.length}
                      label="skipped"
                      tone="problem"
                    />
                  </div>

                  {applyCount === 0 && (
                    <p className="mt-4 rounded-xl border border-app-border bg-app-surface-2 px-4 py-3 text-[13px] text-app-fg-muted">
                      Nothing in this file can be imported.
                    </p>
                  )}

                  {plan.errors.length > 0 && (
                    <section className="mt-5">
                      <h3 className="text-[12px] font-bold uppercase tracking-wide text-app-fg-muted">
                        Skipped rows
                      </h3>
                      <ul className="mt-2 space-y-1.5">
                        {plan.errors.slice(0, 8).map((r) => (
                          <li
                            key={r.line}
                            className="flex gap-2.5 rounded-lg bg-red-50 px-3 py-2 text-[12.5px]"
                          >
                            <span className="shrink-0 font-mono text-red-700">L{r.line}</span>
                            <span className="min-w-0 text-red-800">
                              {r.name && <span className="font-semibold">{r.name}: </span>}
                              {r.errors.join("; ")}
                            </span>
                          </li>
                        ))}
                        {plan.errors.length > 8 && (
                          <li className="px-3 text-[12px] text-app-fg-muted">
                            …and {plan.errors.length - 8} more
                          </li>
                        )}
                      </ul>
                    </section>
                  )}

                  {warned.length > 0 && (
                    <section className="mt-5">
                      <h3 className="text-[12px] font-bold uppercase tracking-wide text-app-fg-muted">
                        Worth checking
                      </h3>
                      <ul className="mt-2 space-y-1.5">
                        {warned.slice(0, 5).map((r) => (
                          <li
                            key={r.line}
                            className="flex gap-2.5 rounded-lg bg-amber-50 px-3 py-2 text-[12.5px]"
                          >
                            <span className="shrink-0 font-mono text-amber-700">L{r.line}</span>
                            <span className="min-w-0 text-amber-900">
                              <span className="font-semibold">{r.name}: </span>
                              {r.warnings.join("; ")}
                            </span>
                          </li>
                        ))}
                        {warned.length > 5 && (
                          <li className="px-3 text-[12px] text-app-fg-muted">
                            …and {warned.length - 5} more
                          </li>
                        )}
                      </ul>
                    </section>
                  )}

                  {applyCount > 0 && (
                    <section className="mt-5">
                      <h3 className="text-[12px] font-bold uppercase tracking-wide text-app-fg-muted">
                        Preview
                      </h3>
                      <ul className="mt-2 divide-y divide-app-border rounded-xl border border-app-border">
                        {[...plan.creates, ...plan.updates].slice(0, 10).map((r) => (
                          <li
                            key={`${r.action}-${r.line}`}
                            className="flex items-center gap-3 px-3.5 py-2.5"
                          >
                            <span
                              className={cn(
                                "shrink-0 rounded-md px-1.5 py-0.5 text-[10.5px] font-bold uppercase tracking-wide",
                                r.action === "create"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-app-surface-3 text-app-fg-muted",
                              )}
                            >
                              {r.action === "create" ? "New" : "Update"}
                            </span>
                            {/* Preview the icon each row will end up with, so a
                                mis-mapped iconData column is obvious before
                                applying — and so the inferred-from-name case
                                (which is most rows) is visible too. */}
                            {r.iconData ? (
                              <img
                                src={r.iconData}
                                alt=""
                                className="h-6 w-6 shrink-0 rounded object-contain"
                              />
                            ) : (
                              <span className="grid h-6 w-6 shrink-0 place-items-center text-app-fg-muted">
                                <FeatureIcon icon={r.icon} name={r.name} size={15} />
                              </span>
                            )}
                            <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-app-fg">
                              {r.name}
                            </span>
                            <span className="shrink-0 text-[11.5px] text-app-fg-muted">
                              {r.status}
                            </span>
                          </li>
                        ))}
                        {applyCount > 10 && (
                          <li className="px-3.5 py-2.5 text-[12px] text-app-fg-muted">
                            …and {applyCount - 10} more
                          </li>
                        )}
                      </ul>
                    </section>
                  )}
                </>
              )}
            </>
          )}

          {/* ── 3. Running ───────────────────────────────────────────── */}
          {phase === "running" && (
            <div className="py-10 text-center">
              <Loader2 size={26} className="mx-auto animate-spin text-app-accent" />
              <p className="mt-4 text-[13.5px] font-semibold text-app-fg">
                Importing {progress.done} of {progress.total}…
              </p>
              <div className="mx-auto mt-4 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-app-surface-3">
                <div
                  className="h-full rounded-full bg-app-accent transition-[width] duration-200"
                  /* Dynamic width — the one thing CONVENTIONS.md keeps inline. */
                  style={{
                    width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className="mt-4 text-[12px] text-app-fg-muted">
                Leave this open until it finishes.
              </p>
            </div>
          )}

          {/* ── 4. Done ──────────────────────────────────────────────── */}
          {phase === "done" && (
            <div className="py-6 text-center">
              {result.failed === 0 ? (
                <CheckCircle2 size={30} className="mx-auto text-emerald-600" />
              ) : (
                <AlertTriangle size={30} className="mx-auto text-amber-500" />
              )}
              <p className="mt-4 text-[15px] font-bold text-app-fg">
                {result.failed === 0 ? "Import finished" : "Import finished with problems"}
              </p>
              <p className="mt-1.5 text-[13px] text-app-fg-muted">
                {result.created} added · {result.updated} updated
                {result.failed > 0 && ` · ${result.failed} failed`}
              </p>

              {failures.length > 0 && (
                <ul className="mt-5 space-y-1.5 text-left">
                  {failures.slice(0, 8).map((f, i) => (
                    <li key={i} className="rounded-lg bg-red-50 px-3 py-2 text-[12.5px] text-red-800">
                      <span className="font-semibold">{f.name}: </span>
                      {f.reason}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <footer className="flex items-center justify-end gap-2 border-t border-app-border bg-app-surface-2 px-5 py-4">
          {phase === "review" && !plan?.fatal && applyCount > 0 && (
            <button type="button" onClick={reset} className={BTN_NEUTRAL}>
              <X size={14} strokeWidth={2.4} />
              Choose another file
            </button>
          )}
          {phase !== "running" && (
            <button type="button" onClick={close} className={BTN_NEUTRAL}>
              {phase === "done" ? "Close" : "Cancel"}
            </button>
          )}
          {phase === "review" && !plan?.fatal && applyCount > 0 && (
            <button type="button" onClick={apply} className={BTN_PRIMARY}>
              Import {applyCount} {applyCount === 1 ? "row" : "rows"}
            </button>
          )}
          {phase === "review" && plan?.fatal && (
            <button type="button" onClick={reset} className={BTN_PRIMARY}>
              Choose another file
            </button>
          )}
        </footer>
      </DialogContent>
    </Dialog>
  );
};

export default ImportFeaturesModal;
