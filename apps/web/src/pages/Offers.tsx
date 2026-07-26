import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Pencil, X as CloseIcon, Tag, Trash2, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayout";
import { offersApi, type OfferDTO, API_BASE_URL } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { TabStrip, ConfirmModal } from "@/components/shared";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AdminDataTable, type ColumnDef, type RowAction } from "@/components/admin/AdminDataTable";

const Offers = () => {
  const navigate = useNavigate();
  const { token: authToken } = useAuth();
  const token = authToken ?? undefined;
  const [tab, setTab] = useState<"pending" | "approved" | "cancelled">("pending");
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<OfferDTO | null>(null);
  const [editForm, setEditForm] = useState<Partial<OfferDTO>>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const offersKey = ["offers", "tab", tab] as const;
  const {
    data: items = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<OfferDTO[]>({
    queryKey: offersKey,
    queryFn: async () => {
      try {
        const res = await offersApi.list(tab, token, { mine: true });
        return Array.isArray((res as any).data) ? (res as any).data : [];
      } catch (e: any) {
        toast.error(e?.message || "Failed to load offers");
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
      toast.success("Offer updated");
    } catch (e: any) {
      toast.error(e?.message || "Update failed");
    }
  };

  const onCancelOffer = async (id: string) => {
    try {
      await offersApi.setStatus(id, "cancelled");
      queryClient.setQueryData<OfferDTO[]>(offersKey, (prev) =>
        (prev ?? []).filter((i) => i._id !== id),
      );
    } catch (e: any) {
      toast.error("Failed to cancel");
    }
  };

  const doDeleteOffer = async (id: string) => {
    try {
      await offersApi.remove(id);
      queryClient.setQueryData<OfferDTO[]>(offersKey, (prev) =>
        (prev ?? []).filter((i) => i._id !== id),
      );
    } catch (e: any) {
      toast.error("Failed to delete");
    }
  };

  /* ── Columns ── */
  const columns: ColumnDef<OfferDTO>[] = [
    {
      key: "name",
      header: "Name",
      cell: (o) => (
        <div className="flex items-center gap-3">
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
      ),
    },
    {
      key: "category",
      header: "Category",
      hideBelow: "md",
      cell: (o) => (
        <span className="text-[12.5px] text-gray-500 dark:text-gray-400">{o.category || "—"}</span>
      ),
    },
    {
      key: "regularPrice",
      header: "Price",
      hideBelow: "md",
      cell: (o) => (
        <span className="text-[12.5px] font-semibold text-gray-700 dark:text-gray-300">
          ₹{o.regularPrice ?? "—"}
        </span>
      ),
    },
    {
      key: "location",
      header: "Location",
      hideBelow: "lg",
      cell: (o) => (
        <span className="text-[12.5px] text-gray-500 dark:text-gray-400 truncate">
          {[o.locality, o.city, o.state].filter(Boolean).join(", ") || "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (o) => <StatusBadge status={o.status || "pending"} />,
    },
  ];

  /* ── Row actions ── */
  const rowActions: RowAction<OfferDTO>[] = [
    {
      label: "Edit",
      icon: Pencil,
      onClick: onEdit,
    },
    {
      label: "Cancel",
      icon: XCircle,
      onClick: (o) => onCancelOffer(o._id!),
      // Hidden when the offer is already cancelled
      hidden: () => tab === "cancelled",
    },
    {
      label: "Delete",
      icon: Trash2,
      onClick: (o) => setConfirmDelete(o._id!),
      variant: "danger",
    },
  ];

  return (
    <DashboardLayout title="Offers">
      <div className="p-5 space-y-5">
        {/* Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-[15px] font-bold text-gray-900 dark:text-white tracking-tight">
              Offers
            </h2>
            <TabStrip
              tabs={[
                { key: "pending", label: "Pending" },
                { key: "approved", label: "Approved" },
                { key: "cancelled", label: "Cancelled" },
              ]}
              activeKey={tab}
              onChange={(k) => setTab(k as "pending" | "approved" | "cancelled")}
              className="border-b-0"
            />
          </div>

          {/* Table */}
          <AdminDataTable<OfferDTO>
            columns={columns}
            data={items}
            isLoading={isLoading}
            isError={isError}
            errorMessage="Failed to load offers."
            onRetry={() => refetch()}
            emptyIcon={Tag}
            emptyTitle={`No ${tab} offers`}
            emptyDescription={
              tab === "pending"
                ? "Offers awaiting approval will appear here."
                : tab === "approved"
                  ? "Approved offers will appear here."
                  : "Cancelled offers will appear here."
            }
            rowActions={rowActions}
            getRowId={(row, index) => row._id ?? String(index)}
          />
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
                <Button onClick={onSaveEdit} className="bg-[#0d9488] hover:bg-[#0f766e] text-white">
                  Save Changes
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            doDeleteOffer(confirmDelete);
            setConfirmDelete(null);
          }
        }}
        title="Delete offer?"
        description="This offer will be permanently removed. This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </DashboardLayout>
  );
};

export default Offers;
