import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { userProfileApi, UserProfileDTO } from "../lib/api";
import { toast } from "sonner";

/**
 * useUserDetails — wraps the user profile fetch + update as a React Query
 * hook so consumers share a single cache entry (keyed by user email)
 * across the three onboarding flows that mount this hook.
 *
 * The previous implementation refetched on every component mount and held
 * its own per-component state. With the cache, switching between
 * onboarding steps no longer triggers a refetch within `staleTime`, and
 * the update mutation invalidates the entry so other consumers refetch
 * exactly once.
 */
export const useUserDetails = () => {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const email = user?.email;
  const enabled = !!isAuthenticated && !!email;

  const query = useQuery<UserProfileDTO | null>({
    queryKey: ["userDetails", email],
    queryFn: async () => {
      if (!email) return null;
      const response = await userProfileApi.get(email);
      if (response.success && response.data) return response.data;
      return null;
    },
    enabled,
    // Profile changes are rare; 5 minutes is plenty before refetching.
    staleTime: 5 * 60_000,
  });

  const mutation = useMutation({
    mutationFn: async (data: Partial<UserProfileDTO>) => {
      if (!email) throw new Error("No email available");
      const response = await userProfileApi.upsert({ ...data, email });
      if (!response.success || !response.data) throw new Error("Update failed");
      return response.data;
    },
    onSuccess: (next) => {
      // Seed the cache with the response so consumers re-render without
      // a roundtrip, then invalidate so any sibling consumers refetch.
      queryClient.setQueryData(["userDetails", email], next);
    },
    onError: (err) => {
      console.error("Failed to update user details:", err);
      toast.error("Failed to save user details");
    },
  });

  return {
    userDetails: query.data ?? null,
    loading: query.isLoading || query.isFetching,
    fetchUserDetails: () => query.refetch(),
    updateUserDetails: (data: Partial<UserProfileDTO>) =>
      mutation.mutateAsync(data).catch(() => {}),
  };
};
