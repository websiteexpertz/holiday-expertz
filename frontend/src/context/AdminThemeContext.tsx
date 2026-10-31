"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export type AdminThemeMode = "dark" | "light" | "system";

interface AdminThemeContextType {
  theme: AdminThemeMode;
  resolvedTheme: "dark" | "light";
  setTheme: (mode: AdminThemeMode) => void;
  toggleTheme: () => void;
}

const AdminThemeContext = createContext<AdminThemeContextType | undefined>(undefined);

const STORAGE_KEY = "holidayexpertz_admin_theme_mode";

export function AdminThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<AdminThemeMode>("dark");
  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as AdminThemeMode | null;
      if (stored && ["dark", "light", "system"].includes(stored)) {
        setThemeState(stored);
      } else {
        setThemeState("dark");
      }
    } catch {
      setThemeState("dark");
    }
    setMounted(true);
  }, []);

  // Update resolved theme whenever theme or system preference changes
  useEffect(() => {
    if (!mounted) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      let resolved: "dark" | "light";
      if (theme === "system") {
        resolved = mediaQuery.matches ? "dark" : "light";
      } else {
        resolved = theme;
      }
      setResolvedTheme(resolved);

      // Set attribute on document element for global CSS targeting
      document.documentElement.setAttribute("data-admin-theme", resolved);

      // Sync <meta name="color-scheme">
      let meta = document.querySelector('meta[name="color-scheme"]') as HTMLMetaElement | null;
      if (!meta) {
        meta = document.createElement("meta");
        meta.name = "color-scheme";
        document.head.appendChild(meta);
      }
      meta.content = theme === "system" ? "light dark" : resolved;
    };

    applyTheme();

    const handleSystemChange = () => {
      if (theme === "system") {
        applyTheme();
      }
    };

    mediaQuery.addEventListener("change", handleSystemChange);
    return () => mediaQuery.removeEventListener("change", handleSystemChange);
  }, [theme, mounted]);

  const setTheme = useCallback((newTheme: AdminThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch (e) {
      console.warn("Unable to save admin theme to localStorage", e);
    }
  }, []);

  const toggleTheme = useCallback(() => {
    const nextTheme: AdminThemeMode = resolvedTheme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  }, [resolvedTheme, setTheme]);

  return (
    <AdminThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </AdminThemeContext.Provider>
  );
}

export function useAdminTheme() {
  const context = useContext(AdminThemeContext);
  if (!context) {
    throw new Error("useAdminTheme must be used within an AdminThemeProvider");
  }
  return context;
}

