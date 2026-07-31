import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BTN_NEUTRAL,
  BTN_PRIMARY,
  CmsField,
  CONTROL,
  DIALOG_VARS,
  SELECT_ITEM,
  TEXTAREA,
} from "../ui";
import type { AddJobModalProps } from "../types";

const EXPERIENCE_OPTIONS = ["Fresher", "1 Year", "2 Years", "3 Years", "4 Years", "5+ Years"];
const JOB_TYPES = ["Full Time", "Part Time", "Contract", "Internship"];

const EMPTY = {
  jobTitle: "",
  experienceRequired: "",
  jobType: "Full Time",
  jobDescription: "",
};

export const AddJobModal: React.FC<AddJobModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [formData, setFormData] = useState(EMPTY);

  useEffect(() => {
    if (initialData) {
      setFormData({
        jobTitle: initialData.position,
        experienceRequired: initialData.experience,
        // The API stores the job type in `location`.
        jobType: initialData.location || "Full Time",
        jobDescription: initialData.jd,
      });
    } else {
      setFormData(EMPTY);
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        style={DIALOG_VARS}
        className="max-w-2xl w-[calc(100vw-2rem)] p-0 gap-0 rounded-2xl overflow-hidden max-h-[92vh] flex flex-col"
      >
        <DialogHeader className="px-5 py-4 border-b border-app-border text-left">
          <DialogTitle className="text-[15px] font-bold text-app-fg">
            {initialData ? "Edit position" : "New position"}
          </DialogTitle>
          <DialogDescription className="text-[12.5px] text-app-fg-muted">
            Published positions accept applications on the public careers page.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4">
            <CmsField label="Job title" htmlFor="job-title">
              <input
                id="job-title"
                value={formData.jobTitle}
                onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                placeholder="Operations executive"
                className={CONTROL}
                required
              />
            </CmsField>

            <div className="grid gap-4 sm:grid-cols-2">
              <CmsField label="Experience required" htmlFor="job-experience">
                <Select
                  value={formData.experienceRequired}
                  onValueChange={(v) => setFormData({ ...formData, experienceRequired: v })}
                >
                  <SelectTrigger
                    id="job-experience"
                    className="h-11 rounded-xl border-app-border bg-app-surface-2 text-[13.5px]"
                  >
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent style={DIALOG_VARS}>
                    {EXPERIENCE_OPTIONS.map((exp) => (
                      <SelectItem key={exp} value={exp} className={SELECT_ITEM}>
                        {exp}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CmsField>

              <CmsField label="Job type" htmlFor="job-type">
                <Select
                  value={formData.jobType}
                  onValueChange={(v) => setFormData({ ...formData, jobType: v })}
                >
                  <SelectTrigger
                    id="job-type"
                    className="h-11 rounded-xl border-app-border bg-app-surface-2 text-[13.5px]"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent style={DIALOG_VARS}>
                    {JOB_TYPES.map((type) => (
                      <SelectItem key={type} value={type} className={SELECT_ITEM}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CmsField>
            </div>

            <CmsField label="Job description" htmlFor="job-description">
              <textarea
                id="job-description"
                rows={7}
                value={formData.jobDescription}
                onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
                placeholder="Responsibilities, requirements and what the team works on…"
                className={TEXTAREA}
                required
              />
            </CmsField>
          </div>

          <footer className="flex items-center justify-end gap-2 px-5 py-4 border-t border-app-border bg-app-surface-2">
            <button type="button" onClick={onClose} className={BTN_NEUTRAL}>
              Cancel
            </button>
            <button type="submit" disabled={!formData.experienceRequired} className={BTN_PRIMARY}>
              {initialData ? "Save changes" : "Add position"}
            </button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddJobModal;
