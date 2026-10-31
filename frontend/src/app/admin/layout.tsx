import React from "react";
import type { Metadata } from "next";
import { AdminAuthProvider } from "@/context/AdminAuthContext";
import { AdminThemeProvider } from "@/context/AdminThemeContext";

export const metadata: Metadata = {
  title: "Super Admin Panel | HolidayExpertz",
  description: "Centralized administration control panel for HolidayExpertz luxury travel portal.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminThemeProvider>
        {children}
      </AdminThemeProvider>
    </AdminAuthProvider>
  );
}
