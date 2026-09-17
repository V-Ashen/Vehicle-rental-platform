"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, ShieldAlert, Ban } from "lucide-react";

interface TenantActionModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  tenant: any;
}

export function TenantActionModal({ isOpen, setIsOpen, tenant }: TenantActionModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateProfileMutation = useMutation({
    mutationFn: async (status: string) => {
      await apiClient.patch(`/admin/tenants/${tenant.id}/profile`, { profileStatus: status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tenants"] });
      toast({ title: "Profile Updated", description: "Tenant profile status has been updated." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  const updateAccountMutation = useMutation({
    mutationFn: async (status: string) => {
      await apiClient.patch(`/admin/tenants/${tenant.id}/account`, { accountStatus: status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-tenants"] });
      toast({ title: "Account Updated", description: "Tenant account status has been updated." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  if (!tenant) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Tenant Details</DialogTitle>
          <DialogDescription>Review and manage the rental owner's account.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Business Name</p>
              <p className="font-semibold text-slate-900 dark:text-white">{tenant.businessName}</p>
            </div>
            <div>
              <p className="text-slate-500">BR Number</p>
              <p className="font-semibold text-slate-900 dark:text-white">{tenant.brNumber || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-slate-500">Email</p>
              <p className="font-semibold text-slate-900 dark:text-white">{tenant.email}</p>
            </div>
            <div>
              <p className="text-slate-500">Phone</p>
              <p className="font-semibold text-slate-900 dark:text-white">{tenant.phone || 'N/A'}</p>
            </div>
            <div className="col-span-2">
              <p className="text-slate-500">Address</p>
              <p className="font-semibold text-slate-900 dark:text-white">{tenant.address || 'N/A'}, {tenant.city}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 border-t pt-4">
          <h4 className="text-sm font-semibold">Profile Actions</h4>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200"
              onClick={() => updateProfileMutation.mutate('VERIFIED')}
              disabled={tenant.profileStatus === 'VERIFIED' || updateProfileMutation.isPending}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Verify Profile
            </Button>
            <Button 
              variant="outline"
              className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200"
              onClick={() => updateProfileMutation.mutate('REJECTED')}
              disabled={tenant.profileStatus === 'REJECTED' || updateProfileMutation.isPending}
            >
              <ShieldAlert className="w-4 h-4 mr-2" />
              Reject Profile
            </Button>
          </div>

          <h4 className="text-sm font-semibold pt-2 border-t">Account Actions</h4>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
              onClick={() => updateAccountMutation.mutate('SUSPENDED')}
              disabled={tenant.accountStatus === 'SUSPENDED' || updateAccountMutation.isPending}
            >
              <Ban className="w-4 h-4 mr-2" />
              Suspend Account
            </Button>
            <Button 
              variant="outline" 
              className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200"
              onClick={() => updateAccountMutation.mutate('ACTIVE')}
              disabled={tenant.accountStatus === 'ACTIVE' || updateAccountMutation.isPending}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Re-activate Account
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
