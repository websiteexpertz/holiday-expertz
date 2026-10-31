"use client";

import React, { useState } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { AdminGuard } from "./AdminGuard";
import { useAdminTheme } from "@/context/AdminThemeContext";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { resolvedTheme } = useAdminTheme();

  return (
    <AdminGuard>
      <div
        data-admin-theme={resolvedTheme}
        className={`admin-layout-root min-h-screen flex flex-col antialiased selection:bg-teal-500 selection:text-white transition-colors duration-200 ${
          resolvedTheme === "light"
            ? "bg-slate-100 text-slate-900"
            : "bg-slate-950 text-slate-100"
        }`}
      >
        {/* Left Sticky Sidebar */}
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content Area */}
        <div className="lg:pl-72 flex flex-col flex-1 min-h-screen">
          <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}
