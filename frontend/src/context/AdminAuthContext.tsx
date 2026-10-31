"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useSyncExternalStore } from "react";
import { AdminPermission, AdminUser } from "@backend/types/admin";
import { adminClient } from "@/lib/adminClient";

interface AdminAuthContextType {
  admin: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isMounted: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshAdmin: () => Promise<void>;
  can: (permission: AdminPermission) => boolean;
  canModule: (moduleName: string) => boolean;
}

const emptySubscribe = () => () => {};
function useIsHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const isHydrated = useIsHydrated();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshAdmin = useCallback(async () => {
    try {
      const res = await adminClient.auth.me();
      if (res.success && res.data?.admin) {
        setAdmin(res.data.admin);
      } else {
        setAdmin(null);
      }
    } catch {
      setAdmin(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isHydrated) {
      refreshAdmin();
    }
  }, [isHydrated, refreshAdmin]);

  const login = useCallback(
    async (email: string, pass: string): Promise<{ success: boolean; message?: string }> => {
      setIsLoading(true);
      try {
        const res = await adminClient.auth.login({ email, pass });
        if (res.success && res.data?.admin) {
          setAdmin(res.data.admin);
          setIsLoading(false);
          return { success: true };
        } else {
          setIsLoading(false);
          return { success: false, message: res.message || "Invalid email or password" };
        }
      } catch (err: any) {
        setIsLoading(false);
        return { success: false, message: err.message || "Login request failed" };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await adminClient.auth.logout();
    } finally {
      setAdmin(null);
      if (typeof window !== "undefined") {
        window.location.href = "/admin/login";
      }
    }
  }, []);

  const can = useCallback(
    (permission: AdminPermission): boolean => {
      if (!admin) return false;
      if (admin.role === "super_admin") return true;
      return Array.isArray(admin.permissions) && admin.permissions.includes(permission);
    },
    [admin]
  );

  const canModule = useCallback(
    (moduleName: string): boolean => {
      if (!admin) return false;
      if (admin.role === "super_admin") return true;
      if (!Array.isArray(admin.permissions)) return false;
      return admin.permissions.some((p) => p.startsWith(`${moduleName}.`));
    },
    [admin]
  );

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        isLoading,
        isAuthenticated: !!admin,
        isMounted: isHydrated,
        login,
        logout,
        refreshAdmin,
        can,
        canModule,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}
