import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/clerk-react";
import type { AdminUser } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";

interface AdminContextType {
  adminUser: AdminUser | null;
  isLoading: boolean;
  isClerkSignedIn: boolean;
  hasAdminAccess: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, signOut } = useAuth();
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAdminUser = useCallback(async () => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      setAdminUser(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/me", {
        credentials: "include",
      });

      if (response.ok) {
        const admin = await response.json();
        setAdminUser(admin);
      } else if (response.status === 401 || response.status === 403) {
        setAdminUser(null);
      } else {
        console.error("Unexpected admin session response", response.status);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      setAdminUser(null);
      setIsLoading(false);
      queryClient.clear();
      return;
    }

    fetchAdminUser();
  }, [isLoaded, isSignedIn, fetchAdminUser]);

  const refresh = useCallback(async () => {
    await fetchAdminUser();
  }, [fetchAdminUser]);

  const logout = useCallback(async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      setAdminUser(null);
      queryClient.clear();
    }
  }, [signOut]);

  const value: AdminContextType = {
    adminUser,
    isLoading,
    isClerkSignedIn: Boolean(isSignedIn),
    hasAdminAccess: Boolean(adminUser),
    refresh,
    logout,
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
}