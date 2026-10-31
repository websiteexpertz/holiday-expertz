"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { PropertyOwner } from "@backend/types/auth";
import { getOwnerSessionApi, updateOwnerProfileApi } from "@/lib/propertyClient";

interface AuthContextType {
  owner: PropertyOwner | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (owner: PropertyOwner) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<PropertyOwner>) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [owner, setOwner] = useState<PropertyOwner | null>(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("holiday_owner");
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          localStorage.removeItem("holiday_owner");
        }
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const syncSession = useCallback((ownerData: PropertyOwner | null) => {
    setOwner(ownerData);
    if (typeof window !== "undefined") {
      if (ownerData) {
        localStorage.setItem("holiday_owner", JSON.stringify(ownerData));
        localStorage.setItem("holiday_owner_id", ownerData.id);
        document.cookie = `owner_id=${ownerData.id}; path=/; max-age=2592000; SameSite=Lax`;
      } else {
        localStorage.removeItem("holiday_owner");
        localStorage.removeItem("holiday_owner_id");
        document.cookie = "owner_id=; path=/; max-age=0";
      }
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const storedId = typeof window !== "undefined" ? localStorage.getItem("holiday_owner_id") : null;
      if (!storedId) {
        setIsLoading(false);
        return;
      }
      const res = await getOwnerSessionApi();
      if (res.success && res.owner) {
        syncSession(res.owner);
      }
    } catch (err) {
      console.warn("Failed to refresh session from server:", err);
    } finally {
      setIsLoading(false);
    }
  }, [syncSession]);

  useEffect(() => {
    const storedId = typeof window !== "undefined" ? localStorage.getItem("holiday_owner_id") : null;
    if (!storedId) {
      const timer = setTimeout(() => setIsLoading(false), 0);
      return () => clearTimeout(timer);
    }

    let isMounted = true;
    getOwnerSessionApi().then((res) => {
      if (!isMounted) return;
      if (res.success && res.owner) {
        syncSession(res.owner);
      }
      setIsLoading(false);
    }).catch(() => {
      if (isMounted) setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [syncSession]);

  const login = (newOwner: PropertyOwner) => {
    syncSession(newOwner);
  };

  const logout = () => {
    syncSession(null);
  };

  const updateProfile = async (updates: Partial<PropertyOwner>) => {
    try {
      const res = await updateOwnerProfileApi(updates);
      if (res.success && res.owner) {
        syncSession(res.owner);
        return { success: true, message: res.message || "Profile updated!" };
      }
      return { success: false, message: res.message || "Failed to update profile." };
    } catch {
      return { success: false, message: "Network error occurred." };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        owner,
        isLoading,
        isAuthenticated: !!owner,
        login,
        logout,
        refreshProfile,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
