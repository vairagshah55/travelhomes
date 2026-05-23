import { useAuth } from "@/contexts/AuthContext";

export function useAuthToken(): string | null {
  return useAuth().token;
}
