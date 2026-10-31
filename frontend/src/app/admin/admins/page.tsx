"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminClient } from "@/lib/adminClient";
import { AdminUser, PermissionModuleGroup } from "@backend/types/admin";
import { Shield, Plus, Edit2, Trash2, CheckCircle2, Lock, Mail, User, Loader2 } from "lucide-react";

export default function AdminStaffPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [groups, setGroups] = useState<PermissionModuleGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<AdminUser | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"super_admin" | "custom_admin">("custom_admin");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const res = await adminClient.admins.getAll();
    if (res.success && res.data) {
      setAdmins(res.data.admins || []);
      setGroups(res.data.permissionGroups || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenCreate = () => {
    setEditingAdmin(null);
    setFullName("");
    setEmail("");
    setPassword("");
    setRole("custom_admin");
    setSelectedPermissions([]);
    setModalError("");
    setModalOpen(true);
  };

  const handleOpenEdit = (admin: AdminUser) => {
    setEditingAdmin(admin);
    setFullName(admin.fullName);
    setEmail(admin.email);
    setPassword("");
    setRole(admin.role);
    setSelectedPermissions(admin.permissions || []);
    setModalError("");
    setModalOpen(true);
  };

  const handleTogglePermission = (permKey: string) => {
    if (selectedPermissions.includes(permKey)) {
      setSelectedPermissions(selectedPermissions.filter((p) => p !== permKey));
    } else {
      setSelectedPermissions([...selectedPermissions, permKey]);
    }
  };

  const handleSelectAllForModule = (moduleKey: string) => {
    const group = groups.find((g) => g.id === moduleKey);
    if (!group) return;

    const modulePermKeys = group.permissions.map((a) => a.key) as string[];
    const allSelected = modulePermKeys.every((k) => selectedPermissions.includes(k));

    if (allSelected) {
      setSelectedPermissions(selectedPermissions.filter((p) => !modulePermKeys.includes(p)));
    } else {
      const merged = Array.from(new Set([...selectedPermissions, ...modulePermKeys]));
      setSelectedPermissions(merged);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) {
      setModalError("Name and email are required");
      return;
    }

    if (!editingAdmin && !password) {
      setModalError("Password is required for new accounts");
      return;
    }

    setIsSaving(true);
    setModalError("");

    let res;
    if (editingAdmin) {
      res = await adminClient.admins.update(editingAdmin.id, {
        fullName,
        role,
        permissions: role === "super_admin" ? [] : selectedPermissions,
      });
    } else {
      res = await adminClient.admins.create({
        fullName,
        email,
        password,
        role,
        permissions: role === "super_admin" ? [] : selectedPermissions,
      });
    }

    setIsSaving(false);

    if (res.success) {
      setModalOpen(false);
      await loadData();
    } else {
      setModalError(res.message || "Failed to save admin user");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete admin account for "${name}"?`)) return;
    const res = await adminClient.admins.delete(id);
    if (res.success) {
      await loadData();
    } else {
      alert(res.message || "Failed to delete admin");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 text-xs font-semibold mb-2">
              <Shield className="w-3.5 h-3.5" />
              <span>RBAC Governance</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Admin Staff & Permissions</h1>
            <p className="text-xs text-slate-400 mt-1">
              Configure system operators and assign custom role-based permission matrices across all 18 modules.
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-teal-500/20 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Admin Staff</span>
          </button>
        </div>

        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-teal-400 mb-2" />
            <p className="text-xs">Loading administrators...</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {admins.map((admin) => (
              <div
                key={admin.id}
                className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850/50 transition-all shadow-lg group flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-5"
              >
                {/* Left: Staff Avatar Badge */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-slate-950 font-extrabold text-lg flex items-center justify-center uppercase shadow-md shadow-teal-500/10 shrink-0">
                  {admin.fullName.charAt(0)}
                </div>

                {/* Center: Details & Capabilities */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h3 className="font-bold text-white text-base sm:text-lg group-hover:text-teal-300 transition-colors">
                      {admin.fullName}
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        admin.role === "super_admin"
                          ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                          : "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                      }`}
                    >
                      {admin.role.replace("_", " ")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                    <span className="text-slate-300 font-mono text-[11px]">{admin.email}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-500 text-[11px]">
                      {admin.lastLoginAt ? `Last active ${new Date(admin.lastLoginAt).toLocaleDateString()}` : "Never logged in"}
                    </span>
                  </div>

                  <div className="pt-1">
                    {admin.role === "super_admin" ? (
                      <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Unconditional Master Access (All 18 Modules)</span>
                      </span>
                    ) : (
                      <div className="text-xs text-slate-400">
                        <span className="font-bold text-white">{(admin.permissions || []).length}</span> granular capabilities assigned across system modules
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="shrink-0 flex items-center md:flex-col lg:flex-row justify-end gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800/80">
                  <button
                    onClick={() => handleOpenEdit(admin)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs transition-colors"
                    title="Edit Permissions"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-teal-400" />
                    <span>Manage Roles</span>
                  </button>
                  {admin.role !== "super_admin" && (
                    <button
                      onClick={() => handleDelete(admin.id, admin.fullName)}
                      className="p-2 text-slate-400 hover:text-red-400 rounded-xl hover:bg-slate-800 transition-colors"
                      title="Delete Admin Account"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create / Edit Modal with Permission Matrix */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative custom-scrollbar">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingAdmin ? `Edit Admin: ${editingAdmin.fullName}` : "Create New Admin Staff"}
                  </h3>
                  <p className="text-[11px] text-slate-400">Assign role and granular module capabilities</p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                >
                  ✕
                </button>
              </div>

              {modalError && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
                  {modalError}
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Rahul Sharma"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      disabled={!!editingAdmin}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. rahul@holidayexpertz.com"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-teal-500 disabled:opacity-50"
                    />
                  </div>
                </div>

                {!editingAdmin && (
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Password *</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 8 characters..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Admin Role Tier</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole("custom_admin")}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        role === "custom_admin"
                          ? "bg-purple-500/20 border-purple-500/50 text-white"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      <span className="font-bold block">Custom Admin</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        Assigned specific module actions below
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole("super_admin")}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        role === "super_admin"
                          ? "bg-teal-500/20 border-teal-500/50 text-white"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      <span className="font-bold block">Super Admin</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        Full unconditional access to all 18 modules
                      </span>
                    </button>
                  </div>
                </div>

                {/* Granular Permission Matrix (Only if Custom Admin) */}
                {role === "custom_admin" && (
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div>
                        <h4 className="font-bold text-white text-xs uppercase tracking-wider">
                          Granular Permission Matrix
                        </h4>
                        <p className="text-[11px] text-slate-500">
                          Select the specific actions this admin is authorized to perform.
                        </p>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono text-[10px]">
                        {selectedPermissions.length} selected
                      </span>
                    </div>

                    <div className="space-y-3">
                      {groups.map((group) => {
                        const modulePermKeys = group.permissions.map((a) => a.key);
                        const isAllSelected = modulePermKeys.every((k) => selectedPermissions.includes(k));

                        return (
                          <div
                            key={group.id}
                            className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white capitalize text-xs">
                                {group.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleSelectAllForModule(group.id)}
                                className="text-[10px] text-teal-400 hover:underline font-semibold"
                              >
                                {isAllSelected ? "Deselect All" : "Select All"}
                              </button>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-1">
                              {group.permissions.map((action) => {
                                const isChecked = selectedPermissions.includes(action.key);
                                return (
                                  <label
                                    key={action.key}
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] cursor-pointer transition-all ${
                                      isChecked
                                        ? "bg-teal-500/20 text-teal-300 border-teal-500/40 font-semibold"
                                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      className="hidden"
                                      checked={isChecked}
                                      onChange={() => handleTogglePermission(action.key)}
                                    />
                                    <span>{action.label}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md"
                  >
                    {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>Save Administrator</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
