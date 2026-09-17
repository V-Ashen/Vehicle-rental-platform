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
import { PackageFormModal } from "@/components/admin/packages/PackageFormModal";
import { Edit2, Plus } from "lucide-react";

export default function PackagesPage() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<any>(null);

  // Fetch Packages
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Subscription Packages
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Manage your SaaS pricing tiers and features.
          </p>
        </div>
        <Button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Create Package
        </Button>
      </div>

      <div className="rounded-xl border bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-slate-800">
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Pricing</TableHead>
              <TableHead>Limits</TableHead>
              <TableHead>Status</TableHead>
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
            ) : packages?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                  No packages found. Create one to get started.
                </TableCell>
              </TableRow>
            ) : (
              packages?.map((pkg: any) => (
                <TableRow key={pkg.id}>
                  <TableCell className="font-medium">
                    <p className="text-slate-900 dark:text-white">{pkg.name}</p>
                    <p className="text-sm text-slate-500 truncate max-w-[200px]">{pkg.description}</p>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <span className="font-semibold text-indigo-600">${pkg.monthlyPrice}</span> /mo
                      <br />
                      <span className="text-slate-500">${pkg.yearlyPrice} /yr</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-slate-600">
                      Vehicles: {pkg.maxVehicles === -1 ? 'Unlimited' : pkg.maxVehicles} <br />
                      Users: {pkg.maxUsers === -1 ? 'Unlimited' : pkg.maxUsers}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={pkg.status === 'ACTIVE' ? 'default' : 'secondary'} className={
                      pkg.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200' : ''
                    }>
                      {pkg.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(pkg)}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PackageFormModal 
        isOpen={isModalOpen} 
        setIsOpen={setIsModalOpen} 
        initialData={editingPackage} 
      />
    </div>
  );
}
