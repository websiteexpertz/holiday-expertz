"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { AdminPermission } from "@backend/types/admin";
import { ShieldAlert, Loader2 } from "lucide-react";

interface AdminGuardProps {
  children: React.ReactNode;
  permission?: AdminPermission;
  module?: string;
}

export function AdminGuard({ children, permission, module }: AdminGuardProps) {
  const router = useRouter();
  const { admin, isLoading, isMounted, can, canModule } = useAdminAuth();

  useEffect(() => {
    if (isMounted && !isLoading && !admin) {
      router.push("/admin/login");
    }
  }, [admin, isLoading, isMounted, router]);

  if (!isMounted || isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <Loader2 className="w-10 h-10 animate-spin text-teal-400 mb-3" />
        <p className="text-sm font-medium tracking-wide">Authenticating Super Admin Session...</p>
      </div>
    );
  }

  if (!admin) {
    return null;
  }

  if (permission && !can(permission)) {
    return (
      <div className="p-8 max-w-2xl mx-auto my-12 bg-slate-900 border border-red-500/30 rounded-2xl shadow-xl text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
          <ShieldAlert className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Access Restricted</h2>
        <p className="text-slate-400 text-sm mb-4">
          Your administrator account (<span className="text-slate-200 font-mono">{admin.email}</span>) does not possess the required{" "}
          <span className="text-teal-400 font-semibold">{permission}</span> capability for this operation.
        </p>
        <p className="text-xs text-slate-500">Contact the primary Super Admin to update your RBAC permission matrix.</p>
      </div>
    );
  }

  if (module && !canModule(module)) {
    return (
      <div className="p-8 max-w-2xl mx-auto my-12 bg-slate-900 border border-red-500/30 rounded-2xl shadow-xl text-center">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
          <ShieldAlert className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Module Access Restricted</h2>
        <p className="text-slate-400 text-sm mb-4">
          You do not have administrative privileges assigned to manage the <span className="text-teal-400 font-semibold">{module}</span> module.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
