"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Eye, ShieldAlert, CheckCircle } from "lucide-react";
import { TenantActionModal } from "@/components/admin/tenants/TenantActionModal";

export default function TenantsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: tenants, isLoading } = useQuery({
    queryKey: ["admin-tenants"],
    queryFn: async () => {
      const res = await apiClient.get("/admin/tenants");
      return res.data.data.tenants;
    },
  });

  const getProfileBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED': return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200">Verified</Badge>;
      case 'PENDING': return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200">Pending</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getAccountBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-200">Active</Badge>;
      case 'SUSPENDED': return <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-red-200">Suspended</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const openDetails = (tenant: any) => {
    setSelectedTenant(tenant);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Rental Owners
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Manage tenant accounts, verify business profiles, and monitor status.
        </p>
      </div>

      <div className="rounded-xl border bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-slate-800">
            <TableRow>
              <TableHead>Business Info</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Profile Status</TableHead>
              <TableHead>Account Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="animate-pulse flex flex-col items-center gap-2">
                    <div className="h-4 w-32 bg-slate-200 rounded"></div>
                    <div className="h-4 w-48 bg-slate-200 rounded"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : tenants?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                  No tenants registered yet.
                </TableCell>
              </TableRow>
            ) : (
              tenants?.map((tenant: any) => (
                <TableRow key={tenant.id}>
                  <TableCell className="font-medium">
                    <p className="text-slate-900 dark:text-white">{tenant.businessName}</p>
                    <p className="text-sm text-slate-500">{tenant.id}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{tenant.email}</p>
                    <p className="text-sm text-slate-500">{tenant.phone || 'N/A'}</p>
                  </TableCell>
                  <TableCell>{getProfileBadge(tenant.profileStatus)}</TableCell>
                  <TableCell>{getAccountBadge(tenant.accountStatus)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => openDetails(tenant)}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <TenantActionModal 
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        tenant={selectedTenant}
      />
    </div>
  );
}
