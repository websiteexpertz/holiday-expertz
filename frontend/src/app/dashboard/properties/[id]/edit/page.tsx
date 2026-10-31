"use client";

import React, { Suspense } from "react";
import { useParams } from "next/navigation";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import PropertyForm from "@/components/dashboard/PropertyForm";
import { Loader2 } from "lucide-react";

function EditPropertyContent() {
  const params = useParams();
  const id =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
      ? params.id[0]
      : "";

  return (
    <DashboardLayout>
      <PropertyForm propertyId={id} />
    </DashboardLayout>
  );
}

export default function EditPropertyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-teal-400" />
        </div>
      }
    >
      <EditPropertyContent />
    </Suspense>
  );
}
