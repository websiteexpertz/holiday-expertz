import React, { Suspense } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import DashboardOverview from "@/components/dashboard/DashboardOverview";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Owner Dashboard | HolidayExpertz",
  description: "Manage your luxury property listings, bookings, and host analytics.",
};

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
        </div>
      }
    >
      <DashboardLayout>
        <DashboardOverview />
      </DashboardLayout>
    </Suspense>
  );
}
