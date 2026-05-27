import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, userService } from "@/services/api";
import { adminKeys } from "./queryKeys";

export interface User {
  _id: string;
  userId: string;
  photo: string;
  name: string;
  userSince: string;
  bookedServices: string;
  location: string;
  email: string;
  phone: string;
  status: string;
}

/**
 * Users list + create/update/delete, routed through the shared axios service
 * (auth via interceptor) and React Query — replacing the page's raw fetch +
 * inline `Authorization` headers and the shadcn `useToast`.
 *
 * The "subscribers" tab reads the public /subscribers endpoint and is reshaped
 * into the User row shape the table expects.
 */
export function useUsers(tab: string) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: adminKeys.users() });

  const query = useQuery<User[]>({
    queryKey: adminKeys.users({ tab }),
    queryFn: async () => {
      if (tab === "subscribers") {
        const res = await api.get("/subscribers");
        const list = res.data?.data ?? [];
        return list.map((sub: any) => ({
          _id: sub._id,
          userId: "SUB",
          photo: `https://api.dicebear.com/7.x/avataaars/svg?seed=${sub.email}`,
          name: "Subscriber",
          email: sub.email,
          phone: "-",
          location: "-",
          bookedServices: "0",
          userSince: sub.createdAt || sub.subscribedAt || new Date().toISOString(),
          status: sub.status,
        })) as User[];
      }
      const status = tab === "all-users" ? undefined : tab;
      const res = await userService.getUsers(status);
      return (res?.data ?? []) as User[];
    },
  });

  const createUser = useMutation({
    mutationFn: (payload: Record<string, unknown>) => userService.createUser(payload),
    onSuccess: () => {
      toast.success("User added successfully.");
      invalidate();
    },
    onError: (err: any) => toast.error(err?.message || err?.error || "Failed to add user."),
  });

  const updateUser = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      userService.updateUser(id, payload),
    onSuccess: () => {
      toast.success("User updated successfully.");
      invalidate();
    },
    onError: (err: any) => toast.error(err?.message || err?.error || "Failed to update user."),
  });

  const deleteUser = useMutation({
    mutationFn: (id: string) => userService.deleteUser(id),
    onSuccess: () => {
      toast.success("User deleted successfully.");
      invalidate();
    },
    onError: (err: any) => toast.error(err?.message || err?.error || "Failed to delete user."),
  });

  return { query, createUser, updateUser, deleteUser };
}

export default useUsers;
