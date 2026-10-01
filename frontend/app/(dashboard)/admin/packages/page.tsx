"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { PackageFormModal } from "@/components/admin/packages/PackageFormModal";
import { Edit2, Package, Plus, Zap, Users, GitBranch } from "lucide-react";
import { PaginationControl } from '@/components/ui/pagination-control';

export default function PackagesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const { data: packages, isLoading } = useQuery({
    queryKey: ["admin-packages"],
    queryFn: async () => {
      const res = await apiClient.get("/admin/packages");
      return res.data.data.data;
    },
  });

  const handleCreate = () => {
    setEditingPackage(null);
    setIsModalOpen(true);
  };

  const handleEdit = (pkg: any) => {
    setEditingPackage(pkg);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/20 flex items-center justify-center">
              <Package className="w-5 h-5 text-purple-400" />
            </div>
            Subscription Packages
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">Manage your SaaS pricing tiers and features.</p>
        </div>
        <Button
          onClick={handleCreate}
          className="bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 rounded-xl"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Package
        </Button>
      </div>

      {/* Table */}
      <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-800/60 shadow-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800/60 hover:bg-transparent">
              <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-widest pl-6 py-4">Package</TableHead>
              <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-widest py-4">Pricing</TableHead>
              <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-widest py-4">Limits</TableHead>
              <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-widest py-4">Status</TableHead>
              <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-widest py-4 text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <TableRow key={i} className="border-slate-800/40 hover:bg-slate-800/20">
                  {[...Array(5)].map((_, j) => (
                    <TableCell key={j} className="py-4">
                      <div className="h-4 bg-slate-800 rounded animate-pulse" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : packages?.length === 0 ? (
              <TableRow className="border-slate-800/40 hover:bg-transparent">
                <TableCell colSpan={5} className="text-center py-16">
                  <Package className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium text-sm">No packages yet. Create one to get started.</p>
                </TableCell>
              </TableRow>
            ) : (
              packages?.slice((page - 1) * itemsPerPage, page * itemsPerPage).map((pkg: any) => (
                <TableRow key={pkg.id} className="border-slate-800/40 hover:bg-slate-800/30 transition-colors">
                  <TableCell className="pl-6 py-4">
                    <p className="font-semibold text-slate-100">{pkg.name}</p>
                    <p className="text-xs text-slate-500 truncate max-w-[200px] mt-0.5">{pkg.description}</p>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold text-indigo-400">LKR {pkg.monthlyPrice?.toLocaleString()}</span>
                      <span className="text-slate-600 text-xs">/mo</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">LKR {pkg.yearlyPrice?.toLocaleString()}/yr</p>
                  </TableCell>
                  <TableCell className="py-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Zap className="w-3 h-3 text-amber-400" />
                        <span>{pkg.maxVehicles === -1 ? 'Unlimited' : pkg.maxVehicles} vehicles</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Users className="w-3 h-3 text-blue-400" />
                        <span>{pkg.maxUsers === -1 ? 'Unlimited' : pkg.maxUsers} users</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <GitBranch className="w-3 h-3 text-emerald-400" />
                        <span>{pkg.maxBranches === -1 ? 'Unlimited' : (pkg.maxBranches || 1)} branches</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge className={pkg.status === 'ACTIVE'
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20 text-xs'
                      : 'bg-slate-700/50 text-slate-400 border-slate-600/50 text-xs'
                    }>
                      {pkg.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4 text-right pr-6">
                    <Button
                      variant="outline" size="sm"
                      onClick={() => handleEdit(pkg)}
                      className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg h-8 text-xs"
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {packages && packages.length > itemsPerPage && (
          <div className="border-t border-slate-800/60">
            <PaginationControl
              currentPage={page}
              totalPages={Math.ceil(packages.length / itemsPerPage)}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      <PackageFormModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        initialData={editingPackage}
      />
    </div>
  );
}
