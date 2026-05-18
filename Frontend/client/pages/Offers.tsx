import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Plus,
  CheckCircle,
  AlertCircle,
  Pencil,
  X as CloseIcon,
  Tag,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { offersApi, type OfferDTO, API_BASE_URL } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import UniqueStaysSkeleton from "@/utils/UniqueStaysSkeleton";

const Offers = () => {
  const navigate = useNavigate();
  const { token: authToken } = useAuth();
  const token = authToken ?? undefined;
  const [showAlert, setShowAlert] = useState(false);
  const [alertType, setAlertType] = useState<"success" | "error">("success");
  const [alertMessage, setAlertMessage] = useState("");
  const [tab, setTab] = useState<"pending" | "approved" | "cancelled">("pending");
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<OfferDTO | null>(null);
  const [editForm, setEditForm] = useState<Partial<OfferDTO>>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const notify = (type: "success" | "error", msg: string) => {
    setAlertType(type);
    setAlertMessage(msg);
    setShowAlert(true);
    setTimeout(() => setShowAlert(false), 4000);
  };

  const offersKey = ["offers", "tab", tab] as const;
  const { data: items = [], isLoading: loading } = useQuery<OfferDTO[]>({
    queryKey: offersKey,
    queryFn: async () => {
      try {
        const res = await offersApi.list(tab, token, { mine: true });
        return Array.isArray((res as any).data) ? (res as any).data : [];
      } catch (e: any) {
        notify("error", e?.message || "Failed to load offers");
        throw e;
      }
    },
  });

  const onEdit = (offer: OfferDTO) => {
    setEditing(offer);
    setEditForm({
      name: offer.name,
      category: offer.category,
      description: offer.description,
      regularPrice: offer.regularPrice,
      locality: offer.locality,
      city: offer.city,
      state: offer.state,
      pincode: offer.pincode,
    });
  };

  const onSaveEdit = async () => {
    if (!editing?._id) return;
    try {
      const res = await offersApi.update(editing._id, editForm);
      const updated = res.data;
      queryClient.setQueryData<OfferDTO[]>(offersKey, (prev) =>
        (prev ?? []).map((i) => (i._id === updated._id ? updated : i)),
      );
      setEditing(null);
      notify("success", "Offer updated");
    } catch (e: any) {
      notify("error", e?.message || "Update failed");
    }
  };

  const onCancelOffer = async (id: string) => {
    try {
      await offersApi.setStatus(id, "cancelled");
      queryClient.setQueryData<OfferDTO[]>(offersKey, (prev) =>
        (prev ?? []).filter((i) => i._id !== id),
      );
    } catch (e: any) {
      notify("error", "Failed to cancel");
    }
  };

  const doDeleteOffer = async (id: string) => {
    try {
      await offersApi.remove(id);
      queryClient.setQueryData<OfferDTO[]>(offersKey, (prev) =>
        (prev ?? []).filter((i) => i._id !== id),
      );
    } catch (e: any) {
      notify("error", "Failed to delete");
    }
  };

  return (
    <DashboardLayout title="Offers">
      <div className="p-5 space-y-5">
        {/* Alert */}
        <AnimatePresence>
          {showAlert && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <Alert
                className={cn(
                  "border",
                  alertType === "success"
                    ? "border-green-200 bg-green-50 dark:bg-green-900/20"
                    : "border-red-200 bg-red-50 dark:bg-red-900/20",
                )}
              >
                {alertType === "success" ? (
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                )}
                <AlertDescription
                  className={
                    alertType === "success"
                      ? "text-green-700 dark:text-green-400"
                      : "text-red-700 dark:text-red-400"
                  }
                >
                  {alertMessage}
                </AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-[15px] font-bold text-gray-900 dark:text-white tracking-tight">
              Offers
            </h2>
            <div className="flex items-center gap-2">
              {(["pending", "approved", "cancelled"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "px-4 py-1.5 text-sm font-semibold rounded-full transition-all duration-150",
                    tab === t
                      ? "bg-[#185FA5] text-white shadow-sm shadow-blue-500/25"
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800",
                  )}
                >
                  {t[0].toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <div className="min-w-[640px]">
              {/* Table header */}
              <div className="bg-gray-50 dark:bg-gray-800/50 grid grid-cols-12 gap-3 px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-800">
                <div className="col-span-4">Name</div>
                <div className="col-span-2">Category</div>
                <div className="col-span-2">Price</div>
                <div className="col-span-2">Location</div>
                <div className="col-span-2">Actions</div>
              </div>

              {/* Rows */}
              {loading ? (
                <UniqueStaysSkeleton />
              ) : items.length === 0 ? (
                <div className="py-20 flex flex-col items-center gap-4 text-gray-400">
                  <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center">
                    <Tag size={22} className="text-gray-300 dark:text-gray-600" strokeWidth={1.5} />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                      No {tab} offers
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-600">
                      {tab === "pending"
                        ? "Offers awaiting approval will appear here"
                        : tab === "approved"
                          ? "Approved offers will appear here"
                          : "Cancelled offers will appear here"}
                    </p>
                  </div>
                </div>
              ) : (
                items.map((o, idx) => (
                  <motion.div
                    key={o._id || idx}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04, duration: 0.18 }}
                    className={cn(
                      "grid grid-cols-12 gap-3 px-6 py-4 items-center hover:bg-gray-50/70 dark:hover:bg-white/[0.02] transition-colors",
                      idx !== items.length - 1 && "border-b border-gray-100 dark:border-gray-800/60",
                    )}
                  >
                    <div className="col-span-4 flex items-center gap-3">
                      {o.photos?.coverUrl ? (
                        <img
                          src={
                            /^https?:\/\//i.test(o.photos.coverUrl) || o.photos.coverUrl.startsWith("data:")
                              ? o.photos.coverUrl
                              : `${API_BASE_URL}${o.photos.coverUrl.startsWith("/") ? "" : "/"}${o.photos.coverUrl}`
                          }
                          alt="cover"
                          className="w-10 h-10 rounded-xl object-cover shrink-0"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = "/placeholder.svg";
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 shrink-0" />
                      )}
                      <span className="text-[13px] font-medium text-gray-800 dark:text-gray-200 truncate">
                        {o.name}
                      </span>
                    </div>
                    <div className="col-span-2 text-[12.5px] text-gray-500 dark:text-gray-400">
                      {o.category}
                    </div>
                    <div className="col-span-2 text-[12.5px] font-semibold text-gray-700 dark:text-gray-300">
                      ₹{o.regularPrice ?? "—"}
                    </div>
                    <div className="col-span-2 text-[12.5px] text-gray-500 dark:text-gray-400 truncate">
                      {[o.locality, o.city, o.state].filter(Boolean).join(", ")}
                    </div>
                    <div className="col-span-2 flex items-center gap-2">
                      <button
                        onClick={() => onEdit(o)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300"
                      >
                        <Pencil size={12} /> Edit
                      </button>
                      {tab !== "cancelled" && (
                        <button
                          onClick={() => onCancelOffer(o._id!)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-100 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        onClick={() => setConfirmDelete(o._id!)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Back */}
        <div className="flex justify-end">
          <button
            onClick={() => navigate("/marketing")}
            className="px-4 py-2 text-sm font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-2xl mx-4 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-bold text-gray-900 dark:text-white">Edit Offer</h3>
                <button
                  onClick={() => setEditing(null)}
                  className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <CloseIcon size={15} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  ["Name", "name"],
                  ["Category", "category"],
                  ["Locality", "locality"],
                  ["City", "city"],
                  ["State", "state"],
                  ["Pincode", "pincode"],
                ].map(([label, key]) => (
                  <div key={key}>
                    <Label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">
                      {label}
                    </Label>
                    <Input
                      value={(editForm as any)[key] || ""}
                      onChange={(e) => setEditForm((f) => ({ ...f, [key]: e.target.value }))}
                      className="h-9 text-sm"
                    />
                  </div>
                ))}
                <div className="md:col-span-2">
                  <Label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">
                    Description
                  </Label>
                  <Input
                    value={(editForm.description as any) || ""}
                    onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                    className="h-9 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">
                    Price (₹)
                  </Label>
                  <Input
                    type="number"
                    value={String(editForm.regularPrice ?? "")}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, regularPrice: Number(e.target.value) }))
                    }
                    className="h-9 text-sm"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <Button variant="outline" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={onSaveEdit}
                  className="bg-[#185FA5] hover:bg-[#042C53] text-white"
                >
                  Save Changes
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Delete */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/15 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Delete offer?</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    This offer will be permanently removed. This cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 justify-end pt-1">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    doDeleteOffer(confirmDelete);
                    setConfirmDelete(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default Offers;
