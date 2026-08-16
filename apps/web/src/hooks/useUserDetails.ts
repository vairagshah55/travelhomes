import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/AuthContext";
import { userProfileApi, UserProfileDTO } from "../lib/api";
import { profileQueryOptions, setProfileCache } from "./useProfile";
import { toast } from "sonner";

/**
 * useUserDetails — the profile fetch + update pair used by the onboarding flows.
 *
 * The read is delegated to the shared `["profile", email]` entry (see
 * hooks/useProfile.ts). It used to own a private `["userDetails", email]` key,
 * which meant the onboarding flows and AuthContext / Profile / UserProfileEdit
 * each fetched the same endpoint separately.
 */
export const useUserDetails = () => {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const email = user?.email;

  const query = useQuery<UserProfileDTO | null>({
    ...profileQueryOptions(email),
    enabled: !!isAuthenticated && !!email,
  });

  const mutation = useMutation({
    mutationFn: async (data: Partial<UserProfileDTO>) => {
      if (!email) throw new Error("No email available");
      const response = await userProfileApi.upsert({ ...data, email });
      if (!response.success || !response.data) throw new Error("Update failed");
      return response.data;
    },
    onSuccess: (next) => {
      // Seed the shared entry with the response so every consumer — the
      // onboarding flows, AuthContext, Profile — sees the write without a
      // roundtrip.
      if (email) setProfileCache(queryClient, email, next);
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
