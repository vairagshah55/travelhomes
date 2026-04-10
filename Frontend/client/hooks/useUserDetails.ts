import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../contexts/AuthContext";
import { userProfileApi, UserProfileDTO } from "../lib/api";
import { toast } from "sonner";

export const useUserDetails = () => {
  const { user, isAuthenticated } = useAuth();
  const [userDetails, setUserDetails] = useState<UserProfileDTO | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch user details
  const fetchUserDetails = useCallback(async () => {
    if (!isAuthenticated || !user?.email) return;

    setLoading(true);
    try {
      const response = await userProfileApi.get(user.email);
      if (response.success && response.data) {
        setUserDetails(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch user details:", error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.email]);

  useEffect(() => {
    fetchUserDetails();
  }, [fetchUserDetails]);

  // Update user details
  const updateUserDetails = async (data: Partial<UserProfileDTO>) => {
    if (!user?.email) return;

    try {
      const response = await userProfileApi.upsert({
        ...data,
        email: user.email,
      });

      if (response.success && response.data) {
        setUserDetails(response.data);
      }
    } catch (error) {
      console.error("Failed to update user details:", error);
      toast.error("Failed to save user details");
    }
  };

  return {
    userDetails,
    loading,
    fetchUserDetails,
    updateUserDetails,
  };
};
