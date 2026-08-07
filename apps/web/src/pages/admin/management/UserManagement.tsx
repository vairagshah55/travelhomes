import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Eye, Edit, Trash2, Users2, SearchX } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AdminLayout from "@/components/admin/AdminLayout";
import { TabStrip } from "@/components/shared/TabStrip";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import {
  AdminFilterBar,
  type ActiveFilters,
  type FilterDefinition,
} from "@/components/admin/AdminFilterBar";
import { AdminDataTable, type ColumnDef, type RowAction } from "@/components/admin/AdminDataTable";
import { MotionReveal } from "@/components/admin/MotionReveal";
import { formatDate } from "@/utils/formateTime";
import { useUsers, type User } from "@/hooks/admin/useUsers";
import { useFeatureAccess } from "@/hooks/admin/useFeatureAccess";
import { ADMIN_FEATURES } from "@/lib/adminPermissions";
import { userSchema, type UserFormValues, USER_STATUS_OPTIONS } from "./userSchema";

const TABS = [
  { key: "all-users", label: "All Users" },
  { key: "active-users", label: "Active Users" },
  { key: "inactive-users", label: "InActive Users" },
  { key: "banned-users", label: "Banned Users" },
  { key: "unverified-email", label: "Unverified Email" },
  { key: "unverified-mobile", label: "Unverified Mobile" },
  { key: "subscribers", label: "Subscribers" },
];

const SORT_OPTIONS = [
  { value: "name", label: "Name" },
  { value: "userSince", label: "Date" },
  { value: "location", label: "Location" },
];

const ITEMS_PER_PAGE = 10;

const UserManagement = () => {
  // The route only checks *view* on manage_users; a role can hold view without
  // create/edit/delete, so the write affordances are gated separately.
  const access = useFeatureAccess(ADMIN_FEATURES.users);
  const [activeTab, setActiveTab] = useState("all-users");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("userSince");
  const [filters, setFilters] = useState<ActiveFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [detailsUser, setDetailsUser] = useState<User | null>(null);
  const [formState, setFormState] = useState<{ mode: "add" | "edit"; user?: User } | null>(null);
  const [confirm, setConfirm] = useState<{
    title: string;
    description: string;
    confirmLabel: string;
    onConfirm: () => void;
  } | null>(null);

  const isSubscribers = activeTab === "subscribers";
  const { query, createUser, updateUser, deleteUser } = useUsers(activeTab);
  const users = query.data ?? [];

  useEffect(() => {
    setCurrentPage(1);
    setSelectedIds([]);
  }, [activeTab, searchTerm, sortBy, filters]);

  const locationOptions = useMemo(() => {
    const set = new Set(users.map((u) => u.location).filter((l) => l && l !== "-"));
    return Array.from(set).map((loc) => ({ value: loc, label: loc }));
  }, [users]);

  const filterDefs: FilterDefinition[] = [
    { key: "status", label: "Status", type: "select", options: USER_STATUS_OPTIONS },
    { key: "location", label: "Location", type: "select", options: locationOptions },
    { key: "joined", label: "Joined", type: "date-range" },
  ];

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    let list = users;

    if (filters.status) list = list.filter((u) => u.status === filters.status);
    if (filters.location) list = list.filter((u) => u.location === filters.location);
    if (Array.isArray(filters.joined)) {
      const [from, to] = filters.joined;
      list = list.filter((u) => {
        const d = new Date(u.userSince);
        if (isNaN(d.getTime())) return false;
        if (from) {
          const f = new Date(from);
          f.setHours(0, 0, 0, 0);
          if (d < f) return false;
        }
        if (to) {
          const t = new Date(to);
          t.setHours(23, 59, 59, 999);
          if (d > t) return false;
        }
        return true;
      });
    }

    if (term) {
      list = list.filter((u) =>
        [u.name, u.email, u.phone, u.location, u.userId]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(term)),
      );
    }

    const key = sortBy as keyof User;
    return [...list].sort((a, b) => {
      if (key === "userSince") {
        return new Date(b.userSince).getTime() - new Date(a.userSince).getTime();
      }
      const av = String(a[key] ?? "").toLowerCase();
      const bv = String(b[key] ?? "").toLowerCase();
      return av < bv ? -1 : av > bv ? 1 : 0;
    });
  }, [users, searchTerm, sortBy, filters]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );
  const hasActiveQuery = !!searchTerm.trim() || Object.keys(filters).length > 0;

  const askDelete = (user: User) =>
    setConfirm({
      title: "Delete user?",
      description: `"${user.name}" will be permanently removed. This action cannot be undone.`,
      confirmLabel: "Delete",
      onConfirm: () => {
        deleteUser.mutate(user._id);
        setConfirm(null);
      },
    });

  const askBulkDelete = () =>
    setConfirm({
      title: `Delete ${selectedIds.length} user${selectedIds.length > 1 ? "s" : ""}?`,
      description: "The selected users will be permanently removed. This action cannot be undone.",
      confirmLabel: "Delete all",
      onConfirm: async () => {
        setConfirm(null);
        await Promise.allSettled(selectedIds.map((id) => deleteUser.mutateAsync(id)));
        setSelectedIds([]);
      },
    });

  const subscriberColumns: ColumnDef<User>[] = [
    {
      key: "email",
      header: "Email",
      cell: (u) => (
        <span className="font-medium text-tpl-dark-4 dark:text-tpl-dark-6">{u.email}</span>
      ),
    },
    {
      key: "userSince",
      header: "Subscribed",
      align: "right",
      cell: (u) => <span className="text-tpl-dark-5">{formatDate(u.userSince)}</span>,
    },
  ];

  const userColumns: ColumnDef<User>[] = [
    {
      key: "userId",
      header: "User ID",
      cell: (u) => <span className="font-semibold text-tpl-dark dark:text-white">{u.userId}</span>,
    },
    {
      key: "photo",
      header: "Photo",
      hideBelow: "md",
      cell: (u) => (
        <Avatar className="w-10 h-10">
          <AvatarImage src={u.photo} />
          <AvatarFallback>{u.name?.charAt(0)}</AvatarFallback>
        </Avatar>
      ),
    },
    {
      key: "name",
      header: "Name",
      cell: (u) => <span className="text-tpl-dark-4 dark:text-tpl-dark-6">{u.name}</span>,
    },
    {
      key: "userSince",
      header: "User Since",
      hideBelow: "lg",
      cell: (u) => (
        <span className="text-tpl-dark-4 dark:text-tpl-dark-6">{formatDate(u.userSince)}</span>
      ),
    },
    {
      key: "bookedServices",
      header: "Bookings",
      hideBelow: "lg",
      align: "center",
      cell: (u) => (
        <span className="text-tpl-dark-4 dark:text-tpl-dark-6">{u.bookedServices || "0"}</span>
      ),
    },
    {
      key: "location",
      header: "Location",
      hideBelow: "md",
      cell: (u) => <span className="text-tpl-dark-4 dark:text-tpl-dark-6">{u.location}</span>,
    },
    { key: "status", header: "Status", cell: (u) => <StatusBadge status={u.status} /> },
  ];

  const rowActions: RowAction<User>[] = [
    { label: "View", icon: Eye, onClick: (u) => setDetailsUser(u) },
    ...(access.canEdit
      ? [
          {
            label: "Edit",
            icon: Edit,
            onClick: (u: User) => setFormState({ mode: "edit", user: u }),
          },
        ]
      : []),
    ...(access.canDelete
      ? [{ label: "Delete", icon: Trash2, onClick: askDelete, variant: "danger" as const }]
      : []),
  ];

  return (
    <AdminLayout title="User Management">
      <MotionReveal delay={0}>
        <div className="bg-app-surface rounded-[18px] border border-app-border shadow-[0_1px_2px_rgba(16,24,40,0.04),0_10px_28px_-14px_rgba(16,24,40,0.16)] dark:shadow-[0_1px_2px_rgba(0,0,0,0.35),0_12px_32px_-16px_rgba(0,0,0,0.55)] overflow-hidden">
          <div className="p-5 space-y-5">
            <TabStrip tabs={TABS} activeKey={activeTab} onChange={setActiveTab} />

            <AdminToolbar
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              searchPlaceholder="Search users…"
              sortOptions={isSubscribers ? undefined : SORT_OPTIONS}
              sortValue={sortBy}
              onSortChange={isSubscribers ? undefined : setSortBy}
              selectedCount={selectedIds.length}
              bulkActions={
                access.canDelete
                  ? [{ label: "Delete", icon: Trash2, variant: "danger", onClick: askBulkDelete }]
                  : []
              }
              onClearSelection={() => setSelectedIds([])}
              primaryAction={
                isSubscribers || !access.canCreate ? undefined : (
                  <Button
                    onClick={() => setFormState({ mode: "add" })}
                    className="h-10 rounded-full bg-tpl-primary hover:bg-tpl-primary/90 text-white gap-2"
                  >
                    <Plus size={16} /> Add User
                  </Button>
                )
              }
            />

            {!isSubscribers && (
              <AdminFilterBar
                filters={filterDefs}
                activeFilters={filters}
                onApply={setFilters}
                onClear={() => setFilters({})}
              />
            )}

            <div className="border border-tpl-stroke dark:border-white/10 rounded-xl overflow-hidden">
              <AdminDataTable<User>
                columns={isSubscribers ? subscriberColumns : userColumns}
                data={paginated}
                isLoading={query.isLoading}
                isError={query.isError}
                errorMessage="Failed to load users."
                onRetry={() => query.refetch()}
                hasActiveQuery={hasActiveQuery}
                emptyIcon={hasActiveQuery ? SearchX : Users2}
                emptyTitle={isSubscribers ? "No subscribers yet" : "No users yet"}
                emptyDescription={
                  isSubscribers
                    ? "Newsletter subscribers will appear here."
                    : "Users appear here once they register."
                }
                noResultsTitle={searchTerm ? `No results for "${searchTerm}"` : "No matching users"}
                noResultsDescription="Try different keywords or remove filters."
                noResultsAction={{
                  label: "Clear filters",
                  onClick: () => {
                    setSearchTerm("");
                    setFilters({});
                  },
                }}
                selectable={!isSubscribers && access.canDelete}
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                rowActions={isSubscribers ? undefined : rowActions}
                pagination={{
                  currentPage,
                  totalPages,
                  totalItems: filtered.length,
                  onPageChange: setCurrentPage,
                }}
              />
            </div>
          </div>
        </div>
      </MotionReveal>

      <UserDetailsDialog user={detailsUser} onClose={() => setDetailsUser(null)} />

      <UserFormDialog
        state={formState}
        isSaving={createUser.isPending || updateUser.isPending}
        onClose={() => setFormState(null)}
        onSubmit={(values) => {
          if (formState?.mode === "edit" && formState.user) {
            updateUser.mutate(
              { id: formState.user._id, payload: values },
              { onSuccess: () => setFormState(null) },
            );
          } else {
            createUser.mutate(
              { ...values, bookedServices: "0" },
              { onSuccess: () => setFormState(null) },
            );
          }
        }}
      />

      <ConfirmModal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={() => confirm?.onConfirm()}
        title={confirm?.title ?? ""}
        description={confirm?.description}
        confirmLabel={confirm?.confirmLabel}
        variant="danger"
        isLoading={deleteUser.isPending}
      />
    </AdminLayout>
  );
};

/* ── Read-only details dialog ───────────────────────────────────────────── */
function UserDetailsDialog({ user, onClose }: { user: User | null; onClose: () => void }) {
  const rows: Array<[string, React.ReactNode]> = user
    ? [
        ["User ID", user.userId],
        ["Name", user.name],
        ["User Since", formatDate(user.userSince)],
        ["Booked Services", user.bookedServices || "0"],
        ["Location", user.location],
        ["Status", <StatusBadge key="s" status={user.status} />],
        ["Email", user.email],
        ["Phone", user.phone],
      ]
    : [];

  return (
    <Dialog open={!!user} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>User Details</DialogTitle>
        </DialogHeader>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
          {rows.map(([label, value]) => (
            <div key={label} className="space-y-1 min-w-0">
              <dt className="text-[12px] font-semibold text-tpl-dark-5 dark:text-tpl-dark-6">
                {label}
              </dt>
              <dd className="text-[14px] text-tpl-dark dark:text-white truncate">{value}</dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  );
}

/* ── Add/Edit form dialog — shadcn Dialog + react-hook-form + zod ────────── */
function UserFormDialog({
  state,
  onClose,
  onSubmit,
  isSaving,
}: {
  state: { mode: "add" | "edit"; user?: User } | null;
  onClose: () => void;
  onSubmit: (values: UserFormValues) => void;
  isSaving: boolean;
}) {
  const open = !!state;
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      location: "",
      userSince: String(new Date().getFullYear()),
      status: "active",
    },
  });

  useEffect(() => {
    if (!state) return;
    if (state.mode === "edit" && state.user) {
      reset({
        name: state.user.name,
        email: state.user.email,
        phone: state.user.phone,
        location: state.user.location,
        userSince: state.user.userSince,
        status: state.user.status,
      });
    } else {
      reset({
        name: "",
        email: "",
        phone: "",
        location: "",
        userSince: String(new Date().getFullYear()),
        status: "active",
      });
    }
  }, [state, reset]);

  const field = "text-[12px] font-semibold text-tpl-dark-5 dark:text-tpl-dark-6";
  const err = "text-[12px] text-tpl-red mt-1";
  const status = watch("status");

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{state?.mode === "edit" ? "Edit User" : "Add New User"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={field}>Name *</label>
              <Input {...register("name")} placeholder="Full name" disabled={isSaving} />
              {errors.name && <p className={err}>{errors.name.message}</p>}
            </div>
            <div>
              <label className={field}>Email *</label>
              <Input
                type="email"
                {...register("email")}
                placeholder="name@example.com"
                disabled={isSaving}
              />
              {errors.email && <p className={err}>{errors.email.message}</p>}
            </div>
            <div>
              <label className={field}>Phone</label>
              <Input {...register("phone")} placeholder="Phone number" disabled={isSaving} />
            </div>
            <div>
              <label className={field}>Location *</label>
              <Input {...register("location")} placeholder="City" disabled={isSaving} />
              {errors.location && <p className={err}>{errors.location.message}</p>}
            </div>
            <div>
              <label className={field}>User Since</label>
              <Input {...register("userSince")} placeholder="Year" disabled={isSaving} />
            </div>
            <div>
              <label className={field}>Status</label>
              <Select value={status} onValueChange={(v) => setValue("status", v)}>
                <SelectTrigger disabled={isSaving}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {USER_STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.status && <p className={err}>{errors.status.message}</p>}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSaving}
              className="bg-tpl-primary hover:bg-tpl-primary/90 text-white"
            >
              {isSaving ? "Saving…" : state?.mode === "edit" ? "Update User" : "Add User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default UserManagement;
