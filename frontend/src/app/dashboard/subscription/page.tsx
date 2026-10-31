import React, { Suspense } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import SubscriptionView from "@/components/dashboard/SubscriptionView";
import { Loader2 } from "lucide-react";

export const metadata = {
  title: "Subscription & Host Tier | HolidayExpertz Dashboard",
  description: "Review your partner benefits, commission rates, and host tiers.",
};

export default function SubscriptionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
        </div>
      }
    >
      <DashboardLayout>
        <SubscriptionView />
      </DashboardLayout>
    </Suspense>
  );
}
