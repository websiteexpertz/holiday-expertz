import React, { Suspense } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import OwnerProfile from "@/components/dashboard/OwnerProfile";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Owner Profile | HolidayExpertz Dashboard",
  description: "Manage host profile, business registration details, and security settings.",
};

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
        </div>
      }
    >
      <DashboardLayout>
        <OwnerProfile />
      </DashboardLayout>
    </Suspense>
  );
}
