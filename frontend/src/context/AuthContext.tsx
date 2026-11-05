"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { PropertyOwner } from "@backend/types/auth";
import { CustomerUserRecord } from "@backend/types/admin";
import { getOwnerSessionApi, updateOwnerProfileApi } from "@/lib/propertyClient";
import { updateTravellerProfileApi } from "@/lib/authClient";

interface AuthContextType {
  owner: PropertyOwner | null;
  traveller: CustomerUserRecord | null;
  userRole: "owner" | "traveller" | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (owner: PropertyOwner) => void;
  loginTraveller: (traveller: CustomerUserRecord) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<PropertyOwner>) => Promise<{ success: boolean; message: string }>;
  updateTraveller: (updates: Partial<CustomerUserRecord>) => Promise<{ success: boolean; message: string }>;
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

  const [traveller, setTraveller] = useState<CustomerUserRecord | null>(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("holiday_traveller");
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          localStorage.removeItem("holiday_traveller");
        }
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  const syncOwnerSession = useCallback((ownerData: PropertyOwner | null) => {
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

  const syncTravellerSession = useCallback((travellerData: CustomerUserRecord | null) => {
    setTraveller(travellerData);
    if (typeof window !== "undefined") {
      if (travellerData) {
        localStorage.setItem("holiday_traveller", JSON.stringify(travellerData));
        localStorage.setItem("holiday_traveller_id", travellerData.id);
      } else {
        localStorage.removeItem("holiday_traveller");
        localStorage.removeItem("holiday_traveller_id");
      }
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const storedId = typeof window !== "undefined" ? localStorage.getItem("holiday_owner_id") : null;
      if (storedId) {
        const res = await getOwnerSessionApi();
        if (res.success && res.owner) {
          syncOwnerSession(res.owner);
        }
      }
    } catch (err) {
      console.warn("Failed to refresh session from server:", err);
    } finally {
      setIsLoading(false);
    }
  }, [syncOwnerSession]);

  useEffect(() => {
    const storedOwnerId = typeof window !== "undefined" ? localStorage.getItem("holiday_owner_id") : null;
    const storedTraveller = typeof window !== "undefined" ? localStorage.getItem("holiday_traveller") : null;

    if (!storedOwnerId && !storedTraveller) {
      const timer = setTimeout(() => setIsLoading(false), 0);
      return () => clearTimeout(timer);
    }

    let isMounted = true;
    if (storedOwnerId) {
      getOwnerSessionApi().then((res) => {
        if (!isMounted) return;
        if (res.success && res.owner) {
          syncOwnerSession(res.owner);
        }
        setIsLoading(false);
      }).catch(() => {
        if (isMounted) setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [syncOwnerSession]);

  const login = (newOwner: PropertyOwner) => {
    // If logging in as owner, clear traveller
    syncTravellerSession(null);
    syncOwnerSession(newOwner);
  };

  const loginTraveller = (newTraveller: CustomerUserRecord) => {
    // If logging in as traveller, clear owner
    syncOwnerSession(null);
    syncTravellerSession(newTraveller);
  };

  const logout = () => {
    syncOwnerSession(null);
    syncTravellerSession(null);
  };

  const updateProfile = async (updates: Partial<PropertyOwner>) => {
    try {
      const res = await updateOwnerProfileApi(updates);
      if (res.success && res.owner) {
        syncOwnerSession(res.owner);
        return { success: true, message: res.message || "Profile updated!" };
      }
      return { success: false, message: res.message || "Failed to update profile." };
    } catch {
      return { success: false, message: "Network error occurred." };
    }
  };

  const updateTraveller = async (updates: Partial<CustomerUserRecord>) => {
    if (!traveller) return { success: false, message: "Not logged in as traveller" };
    try {
      const res = await updateTravellerProfileApi(traveller.id, updates);
      if (res.success && res.traveller) {
        syncTravellerSession(res.traveller);
        return { success: true, message: res.message || "Profile updated successfully!" };
      }
      return { success: false, message: res.message || "Failed to update profile." };
    } catch {
      return { success: false, message: "Network error occurred." };
    }
  };

  const userRole = owner ? "owner" : traveller ? "traveller" : null;

  return (
    <AuthContext.Provider
      value={{
        owner,
        traveller,
        userRole,
        isLoading,
        isAuthenticated: !!owner || !!traveller,
        login,
        loginTraveller,
        logout,
        refreshProfile,
        updateProfile,
        updateTraveller,
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
