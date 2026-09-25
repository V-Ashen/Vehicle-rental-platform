"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Plus, User, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import AddStaffModal from "./AddStaffModal";

export default function StaffTab() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: staff, isLoading } = useQuery({
    queryKey: ["owner-staff"],
    queryFn: async () => {
      const res = await apiClient.get("/owner/staff");
      return res.data.data;
    }
  });

  const { data: roles } = useQuery({
    queryKey: ["owner-roles"],
    queryFn: async () => {
      const res = await apiClient.get("/owner/roles");
      return res.data.data;
    }
  });

  const getRoleName = (roleId: string) => {
    return roles?.find((r: any) => r.id === roleId)?.name || "Unknown Role";
  };

  const deleteMutation = useMutation({
    mutationFn: async (staffId: string) => {
      const res = await apiClient.delete(`/owner/staff/${staffId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-staff"] });
      toast({
        title: "Access Revoked",
        description: "The staff member has been successfully removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Action Failed",
        description: error.response?.data?.message || "Could not revoke staff access.",
        variant: "destructive",
      });
    },
  });

  const handleRevoke = (staffId: string) => {
    toast({
      title: "Revoke Access",
      description: "Are you sure you want to completely revoke access for this staff member? This cannot be undone.",
      action: {
        label: "Revoke",
        onClick: () => deleteMutation.mutate(staffId)
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Staff Users</h2>
          <p className="text-sm text-slate-500">Invite and manage users who have access to your portal.</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Invite Staff
        </Button>
      </div>

      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-950">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Added On</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                  Loading staff...
                </TableCell>
              </TableRow>
            ) : staff?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-500">
                    <User className="h-8 w-8 mb-2 opacity-20" />
                    <p>No staff users found.</p>
                    <Button variant="link" onClick={() => setIsAddModalOpen(true)} className="text-indigo-600">
                      Invite your first staff member
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              staff?.map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold">
                        {user.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">{user.fullName}</div>
                        <div className="text-xs text-slate-500">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-slate-50 dark:bg-slate-900">
                      {getRoleName(user.roleId)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={user.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-slate-100 text-slate-800 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400'}>
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-500 text-sm">
                    {format(new Date(user.createdAt._seconds ? user.createdAt._seconds * 1000 : user.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem className="cursor-pointer">
                          <Pencil className="w-4 h-4 mr-2" /> Edit User
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
                          onClick={() => handleRevoke(user.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Revoke Access
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AddStaffModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
}
