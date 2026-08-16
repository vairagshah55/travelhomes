import React, { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  Users2,
  UserCheck,
  UserMinus,
  UserX,
  SearchX,
} from "lucide-react";
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
import UserDetailsPopup from "@/components/admin/UserDetailsPopup";
import { TabStrip } from "@/components/shared/TabStrip";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConfirmModal } from "@/components/shared/ConfirmModal";
import { AdminToolbar } from "@/components/admin/AdminToolbar";
import {
  AdminFilterBar,
  type FilterDefinition,
} from "@/components/admin/AdminFilterBar";
import { AdminDataTable, type ColumnDef, type RowAction } from "@/components/admin/AdminDataTable";
import { MotionReveal } from "@/components/admin/MotionReveal";
import { formatDate } from "@/utils/formateTime";
import { useUsers, type User } from "@/hooks/admin/useUsers";
import { useFeatureAccess } from "@/hooks/admin/useFeatureAccess";
import { ADMIN_FEATURES } from "@/lib/adminPermissions";
import { userSchema, type UserFormValues, USER_STATUS_OPTIONS } from "./userSchema";
import { BTN_PRIMARY, CARD_FLUSH, STAT_GRID } from "@/components/admin/adminUI";
import { AdminStatCard } from "@/components/admin/AdminStatCard";
import { useTableUrlState, type UrlFilterDef } from "@/components/admin/useTableUrlState";

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

/* Query params this page owns. Declared at module scope: useTableUrlState needs
   key/type before `filterDefs` exists, since those options are derived from the
   loaded users. */
const URL_FILTERS: UrlFilterDef[] = [
  { key: "status", type: "select" },
  { key: "location", type: "select" },
  { key: "joined", type: "date-range" },
];

/* Metric row shown on the "All Users" tab. Counts are derived from the list
   already in hand — no extra request, and they stay in step with the table. */
const STAT_DEFS = [
  { key: "total", title: "Total Users", icon: Users2, color: "#2563eb" },
  { key: "active", title: "Active", icon: UserCheck, color: "#12b76a" },
  { key: "inactive", title: "Inactive", icon: UserMinus, color: "#f59e0b" },
  { key: "banned", title: "Banned", icon: UserX, color: "#f04438" },
] as const;

const UserManagement = () => {
  // The route only checks *view* on manage_users; a role can hold view without
  // create/edit/delete, so the write affordances are gated separately.
  const access = useFeatureAccess(ADMIN_FEATURES.users);

  /* View state lives in the URL — tab, search, sort, page, filters and the open
     record — so a refresh or a pasted link lands on the same screen. Selection
     stays in React state: it is a transient act, not a place. */
  const {
    tab: activeTab,
    setTab: setActiveTab,
    q: searchTerm,
    setQ: setSearchTerm,
    sort: sortBy,
    setSort: setSortBy,
    page,
    setPage,
    filters,
    setFilters,
    selectedId,
    setSelectedId,
    hasActiveQuery,
    clearQuery,
  } = useTableUrlState({
    filters: URL_FILTERS,
    defaultTab: "all-users",
    defaultSort: "userSince",
  });

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
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

  // Page resets are handled by the URL hook; what still has to be dropped is a
  // selection made against a list that no longer exists.
  useEffect(() => {
    setSelectedIds([]);
  }, [activeTab, searchTerm, sortBy, filters]);

  const locationOptions = useMemo(() => {
    const set = new Set(users.map((u) => u.location).filter((l) => l && l !== "-"));
    return Array.from(set).map((loc) => ({ value: loc, label: loc }));
  }, [users]);

  const counts = useMemo(
    () => ({
      total: users.length,
      active: users.filter((u) => u.status === "active").length,
      inactive: users.filter((u) => u.status === "inactive").length,
      banned: users.filter((u) => u.status === "banned").length,
    }),
    [users],
  );

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  // A `?page=` carried over from a longer list can outrun a narrower one.
  const currentPage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  /* The drawer walks the full filtered set rather than the current page. The id
     is what persists (in `?id=`); the index is derived from it, so a record
     that drops out of the list closes the drawer instead of going stale. */
  const detailsIndex = selectedId ? filtered.findIndex((u) => u._id === selectedId) : -1;
  const detailsUser = detailsIndex >= 0 ? filtered[detailsIndex] : null;

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
    { label: "View", icon: Eye, onClick: (u) => setSelectedId(u._id) },
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

  const canAdd = !isSubscribers && access.canCreate;

  return (
    <AdminLayout
      title="User Management"
      subtitle="Everyone registered on TravelHomes — review accounts, verification state and booking activity."
      tabs={<TabStrip variant="flush" tabs={TABS} activeKey={activeTab} onChange={setActiveTab} />}
      headerActions={
        canAdd ? (
          <button onClick={() => setFormState({ mode: "add" })} className={BTN_PRIMARY}>
            <Plus size={16} /> Add User
          </button>
        ) : undefined
      }
    >
      {/* The stat row is rendered only on "All Users". On a pre-filtered tab
          the same four counts would be read as totals when they only describe
          that slice — "Active: 0" on the Banned tab is worse than no card. */}
      {activeTab === "all-users" && (
        <div className={`${STAT_GRID} mb-5 md:mb-6`}>
          {STAT_DEFS.map((stat, i) => (
            <AdminStatCard
              key={stat.title}
              title={stat.title}
              value={String(counts[stat.key])}
              icon={stat.icon}
              iconColor={stat.color}
              delay={i * 0.05}
            />
          ))}
        </div>
      )}

      <MotionReveal delay={0}>
        <div className={CARD_FLUSH}>
          <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 border-b border-app-border">
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
              filterSlot={
                isSubscribers ? undefined : (
                  <AdminFilterBar
                    filters={filterDefs}
                    activeFilters={filters}
                    onApply={setFilters}
                    onClear={() => setFilters({})}
                  />
                )
              }
            />
          </div>

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
            noResultsAction={{ label: "Clear filters", onClick: clearQuery }}
            selectable={!isSubscribers && access.canDelete}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            rowActions={isSubscribers ? undefined : rowActions}
            /* Subscriber rows are an email and a date — there is no record
               behind them to open. */
            onRowClick={isSubscribers ? undefined : (u) => setSelectedId(u._id)}
            pagination={{
              currentPage,
              totalPages,
              pageSize: ITEMS_PER_PAGE,
              totalItems: filtered.length,
              onPageChange: setPage,
            }}
          />
        </div>
      </MotionReveal>

      {detailsUser && (
        <UserDetailsPopup
          isOpen
          onClose={() => setSelectedId(null)}
          user={detailsUser}
          position={{ index: detailsIndex + 1, total: filtered.length }}
          onPrev={
            detailsIndex > 0 ? () => setSelectedId(filtered[detailsIndex - 1]._id) : undefined
          }
          onNext={
            detailsIndex < filtered.length - 1
              ? () => setSelectedId(filtered[detailsIndex + 1]._id)
              : undefined
          }
        />
      )}

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

/* The page-local read-only dialog that used to live here was deleted: it was a
   second, slightly different rendering of a user record. `UserDetailsPopup`
   (now a drawer) is the one, and it is also what the analytics report opens. */

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
            <Button type="submit" disabled={isSaving} className={BTN_PRIMARY}>
              {isSaving ? "Saving…" : state?.mode === "edit" ? "Update User" : "Add User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default UserManagement;
