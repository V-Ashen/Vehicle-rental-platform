"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Plus, Shield, ShieldAlert, ShieldCheck, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AddRoleModal from "./AddRoleModal";
import EditRoleModal from "./EditRoleModal";

export default function RolesTab() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);

  const { data: roles, isLoading } = useQuery({
    queryKey: ["owner-roles"],
    queryFn: async () => {
      const res = await apiClient.get("/owner/roles");
      return res.data.data;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Custom Roles</h2>
          <p className="text-sm text-slate-500">Define permissions sets to assign to your staff.</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Role
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-slate-500">Loading roles...</div>
        ) : roles?.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-500 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            No custom roles defined yet. Create one to get started.
          </div>
        ) : (
          roles?.map((role: any) => (
            <Card key={role.id} className="p-6 flex flex-col hover:border-indigo-200 dark:hover:border-indigo-900 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
                    <Shield className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white text-lg">{role.name}</h3>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="cursor-pointer" onClick={() => setEditingRole(role)}>
                      <Pencil className="w-4 h-4 mr-2" /> Edit Role
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950">
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex-1 space-y-2 mb-6">
                <div className="text-sm font-medium text-slate-500 mb-3">Permissions ({role.permissions?.length || 0})</div>
                <div className="flex flex-wrap gap-2">
                  {role.permissions?.slice(0, 3).map((perm: string) => (
                    <span key={perm} className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300">
                      <ShieldCheck className="w-3 h-3 mr-1 text-emerald-500" />
                      {perm}
                    </span>
                  ))}
                  {(role.permissions?.length || 0) > 3 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-xs text-slate-500">
                      +{role.permissions.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              <div className="text-xs text-slate-400 pt-4 border-t border-slate-100 dark:border-slate-800">
                ID: {role.id}
              </div>
            </Card>
          ))
        )}
      </div>

      <AddRoleModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      
      {editingRole && (
        <EditRoleModal 
          isOpen={!!editingRole} 
          onClose={() => setEditingRole(null)} 
          role={editingRole} 
        />
      )}
    </div>
  );
}
