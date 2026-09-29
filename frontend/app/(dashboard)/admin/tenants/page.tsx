"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Building2, Eye, Search, AlertTriangle } from "lucide-react";
import { TenantActionModal } from "@/components/admin/tenants/TenantActionModal";
import { PaginationControl } from '@/components/ui/pagination-control';
import { Input } from "@/components/ui/input";

export default function TenantsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedTenant, setSelectedTenant] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const itemsPerPage = 10;

  const { data: tenants, isLoading } = useQuery({
    queryKey: ["admin-tenants"],
    queryFn: async () => {
      const res = await apiClient.get("/admin/tenants");
      return res.data.data.tenants;
    },
  });

  const filtered = tenants?.filter((t: any) =>
    !search || t.businessName?.toLowerCase().includes(search.toLowerCase()) || t.email?.toLowerCase().includes(search.toLowerCase())
  );

  const getProfileBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED': return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 text-xs">Verified</Badge>;
      case 'PENDING': return <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/20 text-xs">Pending</Badge>;
      case 'INCOMPLETE': return <Badge className="bg-slate-500/15 text-slate-400 border-slate-500/20 text-xs">Incomplete</Badge>;
      default: return <Badge className="bg-slate-700/50 text-slate-400 border-slate-600/50 text-xs">{status}</Badge>;
    }
  };

  const getAccountBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE': return <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/20 text-xs">Active</Badge>;
      case 'SUSPENDED': return <Badge className="bg-rose-500/15 text-rose-400 border-rose-500/20 text-xs">Suspended</Badge>;
      default: return <Badge className="bg-slate-700/50 text-slate-400 border-slate-600/50 text-xs">{status}</Badge>;
    }
  };

  const openDetails = (tenant: any) => {
    setSelectedTenant(tenant);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-400" />
            </div>
            Rental Businesses
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">Manage tenant accounts, verify business profiles, and monitor status.</p>
        </div>
        <div className="relative shrink-0 w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Search by name or email..."
            className="pl-9 bg-slate-800/60 border-slate-700/50 text-slate-200 placeholder:text-slate-600 focus:border-rose-500/50 rounded-xl h-10"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-800/60 shadow-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800/60 hover:bg-transparent">
              <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-widest pl-6 py-4">Business Info</TableHead>
              <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-widest py-4">Contact</TableHead>
              <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-widest py-4">Profile Status</TableHead>
              <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-widest py-4">Account Status</TableHead>
              <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-widest py-4 text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i} className="border-slate-800/40 hover:bg-slate-800/20">
                  {[...Array(5)].map((_, j) => (
                    <TableCell key={j} className="py-4">
                      <div className="h-4 bg-slate-800 rounded animate-pulse" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered?.length === 0 ? (
              <TableRow className="border-slate-800/40 hover:bg-transparent">
                <TableCell colSpan={5} className="text-center py-16">
                  <Building2 className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium text-sm">No tenants found.</p>
                </TableCell>
              </TableRow>
            ) : (
              filtered?.slice((page - 1) * itemsPerPage, page * itemsPerPage).map((tenant: any) => (
                <TableRow key={tenant.id} className="border-slate-800/40 hover:bg-slate-800/30 transition-colors">
                  <TableCell className="pl-6 py-4">
                    <p className="font-semibold text-slate-100">{tenant.businessName}</p>
                    <p className="text-xs text-slate-600 font-mono mt-0.5">{tenant.id}</p>
                  </TableCell>
                  <TableCell className="py-4">
                    <p className="text-sm text-slate-300">{tenant.email}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{tenant.phone || 'N/A'}</p>
                  </TableCell>
                  <TableCell className="py-4">{getProfileBadge(tenant.profileStatus)}</TableCell>
                  <TableCell className="py-4">{getAccountBadge(tenant.accountStatus)}</TableCell>
                  <TableCell className="py-4 text-right pr-6">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openDetails(tenant)}
                      className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg h-8 text-xs"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5" />
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {filtered && filtered.length > itemsPerPage && (
          <div className="border-t border-slate-800/60">
            <PaginationControl
              currentPage={page}
              totalPages={Math.ceil(filtered.length / itemsPerPage)}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      <TenantActionModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        tenant={selectedTenant}
      />
    </div>
  );
}
