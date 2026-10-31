import React, { Suspense } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PropertyForm from "@/components/dashboard/PropertyForm";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "List Your Property | HolidayExpertz Dashboard",
  description: "Onboard and submit a new luxury stay for verification on HolidayExpertz.",
};

export default function NewPropertyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
        </div>
      }
    >
      <DashboardLayout>
        <PropertyForm />
      </DashboardLayout>
    </Suspense>
  );
}
