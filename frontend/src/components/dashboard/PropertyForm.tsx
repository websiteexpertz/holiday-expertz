"use client";

import React, { Suspense } from "react";
import PropertyWizard from "@/components/properties/PropertyWizard";
import { Loader2 } from "lucide-react";

interface PropertyFormProps {
  propertyId?: string;
}

export default function PropertyForm({ propertyId }: PropertyFormProps) {
  return (
    <Suspense
      fallback={
        <div className="p-12 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-teal-400 mb-3" />
          <p className="text-sm font-semibold text-slate-300">Loading Property Form...</p>
        </div>
      }
    >
      <PropertyWizard role="owner" propertyId={propertyId} />
    </Suspense>
  );
}
