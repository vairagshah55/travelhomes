import React, { useEffect, useState } from "react";
import { Edit2, Trash2, MoreHorizontal, Upload } from "lucide-react";
import { toast } from "sonner";
import { cmsService } from "@/services/cms";
import { getImageUrl } from "@/lib/adminUtils";
import { AddJobModal } from "../modals";
import type { JobPosition } from "../types";

const STATUS_OPTIONS = [
  "Under Review",
  "Interview Scheduled",
  "Interviewed",
  "Accepted",
  "Rejected",
];

/**
 * Career admin: two sub-tabs (Positions list + Applications list). Owns all
 * job + application state, modals, and click-outside menu handling.
 * Self-contained — parent renders `<CareerTab />` with no props.
 */
export function CareerTab() {
  const [subTab, setSubTab] = useState<"Positions" | "Applications">("Positions");
  const [jobs, setJobs] = useState<JobPosition[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [openJobMenu, setOpenJobMenu] = useState<string | null>(null);
  const [openAppMenu, setOpenAppMenu] = useState<string | null>(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [editing, setEditing] = useState<JobPosition | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await cmsService.getJobs();
        setJobs(res.data);
      } catch (e) {
        console.error(e);
      }
    })();
    (async () => {
      try {
        const res = await cmsService.getJobApplications();
        setApplications(res.data);
      } catch (e) {
        console.warn("Failed to load job applications", e);
      }
    })();
  }, []);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest(".action-menu-container")) {
        setOpenJobMenu(null);
        setOpenAppMenu(null);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const toggleJobStatus = async (id: string) => {
    try {
      const updated = await cmsService.toggleJobStatus(id);
      setJobs((prev) => prev.map((j) => (j.id === id ? updated : j)));
      setOpenJobMenu(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteJob = async (id: string) => {
    if (!confirm("Delete this position?")) return;
    try {
      await cmsService.deleteJob(id);
      setJobs((prev) => prev.filter((j) => j.id !== id));
      setOpenJobMenu(null);
    } catch {
      toast.error("Failed to delete position.");
    }
  };

  const handleSaveJob = async (jobData: any) => {
    try {
      if (editing) {
        const updated = await cmsService.updateJob(editing.id, jobData);
        setJobs((prev) => prev.map((j) => (j.id === editing.id ? updated : j)));
        toast.success("Job updated successfully");
      } else {
        const created = await cmsService.createJob(jobData);
        setJobs((prev) => [...prev, created]);
        toast.success("Job added successfully");
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to save job");
    }
  };

  const updateAppStatus = async (id: string, status: string) => {
    try {
      const updated = await cmsService.updateJobApplicationStatus(id, status);
      const updatedApp = updated.data || updated;
      setApplications((prev) =>
        prev.map((app) => (app._id === id || app.id === id ? updatedApp : app)),
      );
      setOpenAppMenu(null);
      toast.success(`Application status updated to ${status}`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to update status");
    }
  };

  const handleDeleteApplication = async (id: string) => {
    if (!confirm("Delete this application?")) return;
    try {
      await cmsService.deleteJobApplication(id);
      setApplications((prev) => prev.filter((app) => (app._id || app.id) !== id));
      setOpenAppMenu(null);
      toast.success("Application deleted successfully");
    } catch {
      toast.error("Failed to delete application");
    }
  };

  const renderApplications = () => (
    <div className="space-y-4">
      <div className="border border-dashboard-stroke rounded-xl bg-white p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-dashboard-title font-plus-jakarta text-sm font-bold">
            Job Applications
          </h3>
        </div>

        <div
          className="h-px bg-dashboard-stroke mb-3"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to right, #EAECF0 0, #EAECF0 2px, transparent 2px, transparent 4px)",
          }}
        />

        <div className="border border-dashboard-stroke rounded-xl overflow-x-auto">
          <div className="bg-gray-50 border-b border-gray-200 grid grid-cols-12 px-4 gap-3 py-3 min-w-[1200px]">
            <div className="text-dashboard-title font-plus-jakarta text-sm font-bold">Date</div>
            <div className="col-span-2 text-dashboard-title font-plus-jakarta text-sm font-bold">
              Name
            </div>
            <div className="col-span-2 text-dashboard-title font-plus-jakarta text-sm font-bold">
              Job Title
            </div>
            <div className="col-span-2 text-dashboard-title font-plus-jakarta text-sm font-bold">
              Contact
            </div>
            <div className="col-span-1 text-dashboard-title font-plus-jakarta text-sm font-bold">
              Exp
            </div>
            <div className="col-span-1 text-dashboard-title font-plus-jakarta text-sm font-bold">
              Location
            </div>
            <div className="col-span-1 text-dashboard-title font-plus-jakarta text-sm font-bold">
              Resume
            </div>
            <div className="col-span-1 text-dashboard-title font-plus-jakarta text-sm font-bold">
              Status
            </div>
            <div className="col-span-1 text-dashboard-title font-plus-jakarta text-sm font-bold">
              Action
            </div>
          </div>

          {applications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No applications found.</div>
          ) : (
            applications.map((app, index) => {
              const id = app._id || app.id;
              return (
                <div
                  key={id || index}
                  className={`grid grid-cols-12 gap-3 px-4 py-3.5 min-w-[1200px] ${
                    index !== applications.length - 1 ? "border-b border-gray-100" : ""
                  }`}
                >
                  <div className="col-span-1 text-sm text-gray-600">
                    {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : "-"}
                  </div>
                  <div className="col-span-2 text-sm font-medium text-gray-900">{app.fullName}</div>
                  <div className="col-span-2 text-sm text-gray-700">{app.jobTitle}</div>
                  <div className="col-span-2 text-sm text-gray-600 flex flex-col">
                    <span>{app.email}</span>
                    <span className="text-xs text-gray-500">{app.mobile}</span>
                  </div>
                  <div className="col-span-1 text-sm text-gray-600">{app.experience}</div>
                  <div className="col-span-1 text-sm text-gray-600">{app.city}</div>
                  <div className="col-span-1">
                    {app.cvUrl ? (
                      <a
                        href={getImageUrl(app.cvUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                      >
                        <Upload size={14} /> View
                      </a>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </div>
                  <div className="col-span-1">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        app.status === "Accepted"
                          ? "bg-green-100 text-green-700"
                          : app.status === "Rejected"
                            ? "bg-red-100 text-red-700"
                            : app.status === "Interview Scheduled"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {app.status || "Pending"}
                    </span>
                  </div>
                  <div className="col-span-1 relative action-menu-container flex justify-center">
                    <button
                      onClick={() => setOpenAppMenu(openAppMenu === id ? null : id)}
                      className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <MoreHorizontal size={20} className="text-dashboard-body" />
                    </button>

                    {openAppMenu === id && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-dashboard-stroke rounded-lg shadow-lg z-50 py-1">
                        {STATUS_OPTIONS.map((status) => (
                          <button
                            key={status}
                            onClick={() => updateAppStatus(id, status)}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-dashboard-primary/10 block text-gray-700"
                          >
                            {status}
                          </button>
                        ))}
                        <div className="h-px bg-gray-100 my-1" />
                        <button
                          onClick={() => handleDeleteApplication(id)}
                          className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                        >
                          <Trash2 size={16} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4 bg-white p-2 rounded-xl w-fit border border-dashboard-stroke">
        <button
          onClick={() => setSubTab("Positions")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            subTab === "Positions"
              ? "bg-dashboard-primary text-black"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Open Positions
        </button>
        <button
          onClick={() => setSubTab("Applications")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            subTab === "Applications"
              ? "bg-dashboard-primary text-black"
              : "text-gray-600 hover:bg-gray-100"
          }`}
        >
          Applications
        </button>
      </div>

      {subTab === "Applications" ? (
        renderApplications()
      ) : (
        <div className="border border-dashboard-stroke rounded-xl bg-white p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-dashboard-title font-plus-jakarta text-sm font-bold">
              Career Positions
            </h3>
            <button
              onClick={() => {
                setEditing(null);
                setShowJobModal(true);
              }}
              className="px-5 py-2.5 bg-dashboard-primary text-black rounded-full font-geist text-sm font-medium tracking-tight hover:bg-dashboard-primary/90 transition-colors"
            >
              Add New Position
            </button>
          </div>

          <div
            className="h-px bg-dashboard-stroke mb-3"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to right, #EAECF0 0, #EAECF0 2px, transparent 2px, transparent 4px)",
            }}
          />

          <div className="border border-dashboard-stroke rounded-xl overflow-scroll">
            <div className="bg-gray-50 border-b border-gray-200 grid grid-cols-12 gap-3 px-4 py-3">
              <div className="col-span-3 text-dashboard-title font-plus-jakarta text-sm font-bold">
                Position
              </div>
              <div className="col-span-2 text-dashboard-title font-plus-jakarta text-sm font-bold">
                Experience Required
              </div>
              <div className="col-span-2 text-dashboard-title font-plus-jakarta text-sm font-bold">
                Location
              </div>
              <div className="col-span-2 text-dashboard-title font-plus-jakarta text-sm font-bold">
                JD
              </div>
              <div className="col-span-1 text-dashboard-title font-plus-jakarta text-sm font-bold">
                Status
              </div>
              <div className="col-span-2 text-dashboard-title font-plus-jakarta text-sm font-bold">
                Action
              </div>
            </div>

            {jobs.map((job, index) => (
              <div
                key={job.id}
                className={`grid grid-cols-12 gap-3 px-4 py-3.5 ${
                  index !== jobs.length - 1 ? "border-b border-gray-100" : ""
                }`}
              >
                <div className="col-span-3">
                  <div className="text-dashboard-heading font-plus-jakarta text-sm font-bold">
                    {job.position}
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="text-dashboard-body font-poppins text-sm">{job.experience}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-dashboard-body font-poppins text-sm">{job.location}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-dashboard-heading font-plus-jakarta text-sm truncate">
                    {job.jd}
                  </div>
                </div>
                <div className="col-span-1">
                  <span
                    className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                      job.isActive !== false
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {job.isActive !== false ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="col-span-2 flex items-center justify-center gap-3 relative action-menu-container">
                  <button
                    onClick={() => toggleJobStatus(job.id)}
                    className={`w-9 h-5 rounded-full transition-colors relative ${
                      job.isActive ? "bg-dashboard-blue-600" : "bg-gray-300"
                    }`}
                    title={job.isActive ? "Deactivate" : "Activate"}
                  >
                    <div
                      className={`w-4 h-4 bg-white rounded-full shadow transition-transform absolute top-0.5 ${
                        job.isActive ? "translate-x-4" : "translate-x-0.5"
                      }`}
                    />
                  </button>

                  <button
                    onClick={() => setOpenJobMenu(openJobMenu === job.id ? null : job.id)}
                    className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <MoreHorizontal size={20} className="text-dashboard-body" />
                  </button>

                  {openJobMenu === job.id && (
                    <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-dashboard-stroke rounded-lg shadow-lg z-50 py-1">
                      <button
                        onClick={() => {
                          setEditing(job);
                          setShowJobModal(true);
                          setOpenJobMenu(null);
                        }}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-dashboard-primary/10 flex items-center gap-2"
                      >
                        <Edit2 size={16} /> Edit
                      </button>
                      <button
                        onClick={() => handleDeleteJob(job.id)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <AddJobModal
        isOpen={showJobModal}
        onClose={() => setShowJobModal(false)}
        onSubmit={handleSaveJob}
        initialData={editing}
      />
    </div>
  );
}

export default CareerTab;
