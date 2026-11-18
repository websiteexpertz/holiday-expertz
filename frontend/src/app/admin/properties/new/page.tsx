"use client";

import React, { Suspense } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import PropertyWizard from "@/components/properties/PropertyWizard";
import { Loader2 } from "lucide-react";

export default function AdminNewPropertyPage() {
  return (
    <Suspense
      fallback={
        <AdminLayout>
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-teal-400 mb-3" />
            <p className="text-sm font-semibold text-slate-300">Loading Add Property Form...</p>
          </div>
        </AdminLayout>
      }
    >
      <AdminLayout>
        <PropertyWizard role="admin" />
      </AdminLayout>
    </Suspense>
  );
}
