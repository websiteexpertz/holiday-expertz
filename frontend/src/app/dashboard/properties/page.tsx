import React, { Suspense } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PropertyList from "@/components/dashboard/PropertyList";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "My Properties | HolidayExpertz Dashboard",
  description: "View, filter, manage, preview, and track your property listings.",
};

export default function PropertiesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
        </div>
      }
    >
      <DashboardLayout>
        <PropertyList />
      </DashboardLayout>
    </Suspense>
  );
}
