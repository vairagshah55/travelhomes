import React, { useEffect, useMemo, useState } from "react";
import {
  Ban,
  Briefcase,
  CheckCircle2,
  Edit2,
  ExternalLink,
  Inbox,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { cmsService } from "@/services/cms";
import { getImageUrl } from "@/lib/adminUtils";
import ConfirmModal from "@/components/shared/ConfirmModal";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import {
  AdminFilterBar,
  type ActiveFilters,
  type FilterDefinition,
} from "@/components/admin/AdminFilterBar";
import { AdminDataTable, type ColumnDef, type RowAction } from "@/components/admin/AdminDataTable";
import { AddJobModal } from "../modals";
import { BTN_PRIMARY, CmsSegmented, TableFrame } from "../ui";
import type { JobPosition } from "../types";

const STATUS_OPTIONS = [
  "Under Review",
  "Interview Scheduled",
  "Interviewed",
  "Accepted",
  "Rejected",
];

interface Application {
  _id?: string;
  id?: string;
  fullName?: string;
  jobTitle?: string;
  email?: string;
  mobile?: string;
  experience?: string;
  city?: string;
  cvUrl?: string;
  status?: string;
  createdAt?: string;
}

const appId = (a: Application) => String(a._id || a.id || "");

const APPLICATION_FILTERS: FilterDefinition[] = [
  {
    key: "status",
    label: "Status",
    type: "select",
    options: STATUS_OPTIONS.map((s) => ({ value: s, label: s })),
  },
];

const formatDate = (value?: string) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
};

/**
 * Career admin: the open positions on the public careers page plus the inbox of
 * applications against them. Self-contained — the parent renders `<CareerTab />`
 * with no props.
 */
export function CareerTab() {
  const [subTab, setSubTab] = useState<"positions" | "applications">("positions");

  const [jobs, setJobs] = useState<JobPosition[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [jobsError, setJobsError] = useState(false);
  const [jobSearch, setJobSearch] = useState("");
  const [busyJobId, setBusyJobId] = useState<string | null>(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [editing, setEditing] = useState<JobPosition | null>(null);
  const [pendingJobDelete, setPendingJobDelete] = useState<JobPosition | null>(null);

  const [applications, setApplications] = useState<Application[]>([]);
  const [loadingApps, setLoadingApps] = useState(true);
  const [appsError, setAppsError] = useState(false);
  const [appSearch, setAppSearch] = useState("");
  const [appFilters, setAppFilters] = useState<ActiveFilters>({});
  const [busyAppId, setBusyAppId] = useState<string | null>(null);
  const [pendingAppDelete, setPendingAppDelete] = useState<Application | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadJobs = async () => {
    setLoadingJobs(true);
    setJobsError(false);
    try {
      const res = await cmsService.getJobs();
      setJobs(res.data);
    } catch (e) {
      console.error(e);
      setJobsError(true);
    } finally {
      setLoadingJobs(false);
    }
  };

  const loadApplications = async () => {
    setLoadingApps(true);
    setAppsError(false);
    try {
      const res = await cmsService.getJobApplications();
      setApplications(res.data);
    } catch (e) {
      console.warn("Failed to load job applications", e);
      setAppsError(true);
    } finally {
      setLoadingApps(false);
    }
  };

  useEffect(() => {
    loadJobs();
    loadApplications();
  }, []);

  /* ── Positions ─────────────────────────────────────────────────────────── */

  const visibleJobs = useMemo(() => {
    const q = jobSearch.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter((j) =>
      [j.position, j.experience, j.location, j.jd].some((v) => (v || "").toLowerCase().includes(q)),
    );
  }, [jobs, jobSearch]);

  const toggleJobStatus = async (job: JobPosition) => {
    setBusyJobId(job.id);
    try {
      const updated = await cmsService.toggleJobStatus(job.id);
      setJobs((prev) => prev.map((j) => (j.id === job.id ? updated : j)));
      toast.success(job.isActive === false ? "Position published" : "Position hidden");
    } catch (e) {
      console.error(e);
      toast.error("Failed to change status");
    } finally {
      setBusyJobId(null);
    }
  };

  const confirmJobDelete = async () => {
    if (!pendingJobDelete) return;
    const id = pendingJobDelete.id;
    setDeleting(true);
    try {
      await cmsService.deleteJob(id);
      setJobs((prev) => prev.filter((j) => j.id !== id));
      toast.success("Position deleted");
      setPendingJobDelete(null);
    } catch {
      toast.error("Failed to delete position");
    } finally {
      setDeleting(false);
    }
  };

  const handleSaveJob = async (jobData: any) => {
    try {
      if (editing) {
        const updated = await cmsService.updateJob(editing.id, jobData);
        setJobs((prev) => prev.map((j) => (j.id === editing.id ? updated : j)));
        toast.success("Position updated");
      } else {
        const created = await cmsService.createJob(jobData);
        setJobs((prev) => [...prev, created]);
        toast.success("Position added");
      }
      setEditing(null);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to save position");
    }
  };

  const openCreateJob = () => {
    setEditing(null);
    setShowJobModal(true);
  };

  const jobColumns: ColumnDef<JobPosition>[] = [
    {
      key: "position",
      header: "Position",
      cell: (j) => <span className="font-semibold text-app-fg">{j.position}</span>,
    },
    {
      key: "experience",
      header: "Experience",
      className: "w-36",
      cell: (j) => <span className="text-app-fg-muted">{j.experience || "—"}</span>,
    },
    {
      key: "location",
      header: "Type",
      className: "w-32",
      hideBelow: "md",
      cell: (j) => <span className="text-app-fg-muted">{j.location || "—"}</span>,
    },
    {
      key: "jd",
      header: "Description",
      hideBelow: "lg",
      cell: (j) => (
        <p className="max-w-[360px] text-app-fg-muted line-clamp-2 leading-relaxed">
          {j.jd || "—"}
        </p>
      ),
    },
    {
      key: "status",
      header: "Status",
      className: "w-28",
      cell: (j) => <StatusBadge status={j.isActive !== false ? "active" : "inactive"} />,
    },
  ];

  const jobActions: RowAction<JobPosition>[] = [
    {
      label: "Edit",
      icon: Edit2,
      onClick: (j) => {
        setEditing(j);
        setShowJobModal(true);
      },
    },
    {
      label: "Publish",
      icon: CheckCircle2,
      hidden: (j) => j.isActive !== false,
      onClick: toggleJobStatus,
    },
    {
      label: "Hide",
      icon: Ban,
      hidden: (j) => j.isActive === false,
      onClick: toggleJobStatus,
    },
    { label: "Delete", icon: Trash2, variant: "danger", onClick: (j) => setPendingJobDelete(j) },
  ];

  /* ── Applications ──────────────────────────────────────────────────────── */

  const visibleApplications = useMemo(() => {
    const q = appSearch.trim().toLowerCase();
    const status = appFilters.status as string | undefined;
    return applications.filter((a) => {
      if (status && (a.status || "Under Review") !== status) return false;
      if (!q) return true;
      return [a.fullName, a.jobTitle, a.email, a.mobile, a.city].some((v) =>
        (v || "").toLowerCase().includes(q),
      );
    });
  }, [applications, appSearch, appFilters]);

  const updateAppStatus = async (app: Application, status: string) => {
    const id = appId(app);
    setBusyAppId(id);
    try {
      const updated = await cmsService.updateJobApplicationStatus(id, status);
      const updatedApp = updated.data || updated;
      setApplications((prev) => prev.map((a) => (appId(a) === id ? updatedApp : a)));
      toast.success(`Application marked “${status}”`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to update status");
    } finally {
      setBusyAppId(null);
    }
  };

  const confirmAppDelete = async () => {
    if (!pendingAppDelete) return;
    const id = appId(pendingAppDelete);
    setDeleting(true);
    try {
      await cmsService.deleteJobApplication(id);
      setApplications((prev) => prev.filter((a) => appId(a) !== id));
      toast.success("Application deleted");
      setPendingAppDelete(null);
    } catch {
      toast.error("Failed to delete application");
    } finally {
      setDeleting(false);
    }
  };

  const applicationColumns: ColumnDef<Application>[] = [
    {
      key: "createdAt",
      header: "Received",
      className: "w-28",
      cell: (a) => (
        <span className="text-app-fg-muted tabular-nums">{formatDate(a.createdAt)}</span>
      ),
    },
    {
      key: "fullName",
      header: "Applicant",
      cell: (a) => (
        <div className="min-w-0">
          <p className="font-semibold text-app-fg truncate">{a.fullName || "—"}</p>
          <p className="text-[12px] text-app-fg-muted truncate">{a.jobTitle || "—"}</p>
        </div>
      ),
    },
    {
      key: "email",
      header: "Contact",
      hideBelow: "md",
      cell: (a) => (
        <div className="min-w-0">
          <p className="text-app-fg-muted truncate">{a.email || "—"}</p>
          {a.mobile && <p className="text-[12px] text-app-fg-subtle">{a.mobile}</p>}
        </div>
      ),
    },
    {
      key: "experience",
      header: "Exp",
      className: "w-24",
      hideBelow: "lg",
      cell: (a) => <span className="text-app-fg-muted">{a.experience || "—"}</span>,
    },
    {
      key: "city",
      header: "City",
      className: "w-28",
      hideBelow: "lg",
      cell: (a) => <span className="text-app-fg-muted">{a.city || "—"}</span>,
    },
    {
      key: "cvUrl",
      header: "Resume",
      className: "w-24",
      cell: (a) =>
        a.cvUrl ? (
          <a
            href={getImageUrl(a.cvUrl)}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-app-accent hover:underline"
          >
            <ExternalLink size={13} /> Open
          </a>
        ) : (
          <span className="text-app-fg-subtle">—</span>
        ),
    },
    {
      key: "status",
      header: "Status",
      className: "w-36",
      cell: (a) => <StatusBadge status={a.status || "Under Review"} />,
    },
  ];

  const applicationActions: RowAction<Application>[] = [
    ...STATUS_OPTIONS.map<RowAction<Application>>((status) => ({
      label: status,
      icon: CheckCircle2,
      hidden: (a) => (a.status || "Under Review") === status,
      onClick: (a) => updateAppStatus(a, status),
    })),
    { label: "Delete", icon: Trash2, variant: "danger", onClick: (a) => setPendingAppDelete(a) },
  ];

  const subTabs = [
    { value: "positions" as const, label: "Open positions", icon: Briefcase, count: jobs.length },
    {
      value: "applications" as const,
      label: "Applications",
      icon: Inbox,
      count: applications.length,
    },
  ];

  return (
    <div className="space-y-4">
      <CmsSegmented
        items={subTabs}
        value={subTab}
        onChange={setSubTab}
        layoutId="cmsCareerSubTabPill"
        ariaLabel="Career section"
      />

      {subTab === "positions" ? (
        <>
          <AdminToolbar
            searchValue={jobSearch}
            onSearchChange={setJobSearch}
            searchPlaceholder="Search positions…"
            primaryAction={
              <button onClick={openCreateJob} className={BTN_PRIMARY}>
                <Plus size={15} strokeWidth={2.4} />
                Add position
              </button>
            }
          />

          <TableFrame>
            <AdminDataTable<JobPosition>
              columns={jobColumns}
              data={visibleJobs}
              isLoading={loadingJobs}
              isError={jobsError}
              errorMessage="Could not load the positions list."
              onRetry={loadJobs}
              hasActiveQuery={!!jobSearch.trim()}
              emptyIcon={Briefcase}
              emptyTitle="No open positions"
              emptyDescription="Add a role and it appears on the careers page straight away."
              emptyAction={{ label: "Add position", onClick: openCreateJob }}
              noResultsDescription="No position matches your search."
              noResultsAction={{ label: "Clear search", onClick: () => setJobSearch("") }}
              rowActions={jobActions}
              rowBusy={(j) => busyJobId === j.id}
            />
          </TableFrame>
        </>
      ) : (
        <>
          <AdminToolbar
            searchValue={appSearch}
            onSearchChange={setAppSearch}
            searchPlaceholder="Search applicants…"
          />

          <AdminFilterBar
            filters={APPLICATION_FILTERS}
            activeFilters={appFilters}
            onApply={setAppFilters}
            onClear={() => setAppFilters({})}
          />

          <TableFrame>
            <AdminDataTable<Application>
              columns={applicationColumns}
              data={visibleApplications}
              isLoading={loadingApps}
              isError={appsError}
              errorMessage="Could not load applications."
              onRetry={loadApplications}
              hasActiveQuery={!!appSearch.trim() || Object.keys(appFilters).length > 0}
              emptyIcon={Inbox}
              emptyTitle="No applications yet"
              emptyDescription="Applications submitted from the careers page land here."
              noResultsDescription="No application matches the current search or filters."
              noResultsAction={{
                label: "Clear filters",
                onClick: () => {
                  setAppSearch("");
                  setAppFilters({});
                },
              }}
              rowActions={applicationActions}
              rowBusy={(a) => busyAppId === appId(a)}
              getRowId={appId}
            />
          </TableFrame>
        </>
      )}

      <AddJobModal
        isOpen={showJobModal}
        onClose={() => {
          setShowJobModal(false);
          setEditing(null);
        }}
        onSubmit={handleSaveJob}
        initialData={editing}
      />

      <ConfirmModal
        open={!!pendingJobDelete}
        onClose={() => setPendingJobDelete(null)}
        onConfirm={confirmJobDelete}
        isLoading={deleting}
        title="Delete position"
        description={
          pendingJobDelete
            ? `Delete “${pendingJobDelete.position}”? Applications already received are kept.`
            : ""
        }
        confirmLabel="Delete"
        variant="danger"
      />

      <ConfirmModal
        open={!!pendingAppDelete}
        onClose={() => setPendingAppDelete(null)}
        onConfirm={confirmAppDelete}
        isLoading={deleting}
        title="Delete application"
        description={
          pendingAppDelete
            ? `Delete the application from ${pendingAppDelete.fullName || "this applicant"}? This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  );
}

export default CareerTab;
