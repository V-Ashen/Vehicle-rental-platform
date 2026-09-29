"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, Wrench, Plus } from "lucide-react";
import { format } from "date-fns";
import { parseFirestoreDate } from "@/lib/dateUtils";
import { Button } from "@/components/ui/button";
import LogMaintenanceModal from "@/components/owner/maintenance/LogMaintenanceModal";
import { PaginationControl } from "@/components/ui/pagination-control";
import { cn } from "cn";

function TypeBadge({ type }: { type: string }) {
  const config: Record<string, { label: string; cls: string }> = {
    SERVICE:    { label: "Service",    cls: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800/50" },
    REPAIR:     { label: "Repair",     cls: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800/50" },
    INSPECTION: { label: "Inspection", cls: "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border-violet-200 dark:border-violet-800/50" },
  };
  const c = config[type] ?? { label: type, cls: "bg-slate-100 text-slate-600 border-slate-200" };
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border", c.cls)}>
      {c.label}
    </span>
  );
}

export default function MaintenancePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const { data: records, isLoading } = useQuery({
    queryKey: ["owner-maintenance"],
    queryFn: async () => {
      const res = await apiClient.get("/maintenance");
      return res.data.data;
    },
  });

  const { data: vehiclesData } = useQuery({
    queryKey: ["owner-vehicles"],
    queryFn: async () => {
      const res = await apiClient.get("/vehicles");
      return res.data.data;
    },
  });

  const vehicles = Array.isArray(vehiclesData) ? vehiclesData : (vehiclesData?.data || []);

  const filteredRecords = (records || []).filter((r: any) =>
    r.vehicleRegistration?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.vehicleMakeModel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.maintenanceType?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paged = filteredRecords.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const totalCost = (records || []).reduce((sum: number, r: any) => sum + (r.cost || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Maintenance Log</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {(records || []).length} records · Rs. {totalCost.toLocaleString()} total cost
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4" />
          Log Maintenance
        </Button>
      </div>

      {/* Table card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search vehicle, type…"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              className="pl-9 h-9 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 dark:bg-slate-800/40 hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vehicle</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Service Date</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Odometer</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Cost</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <Wrench className="w-7 h-7 text-slate-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">No records found</p>
                        <p className="text-sm text-slate-500 mt-0.5">
                          {searchTerm ? "Try a different search" : "Log your first maintenance record"}
                        </p>
                      </div>
                      {!searchTerm && (
                        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 gap-2" onClick={() => setIsModalOpen(true)}>
                          <Plus className="w-4 h-4" /> Log Maintenance
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((record: any) => {
                  const v = vehicles.find((veh: any) => veh.id === record.vehicleId);
                  const reg = record.vehicleRegistration || v?.registrationNumber || "Unknown";
                  const model = record.vehicleMakeModel || (v ? `${v.make} ${v.model}` : "Unknown");

                  return (
                    <TableRow key={record.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors border-slate-100 dark:border-slate-800">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center shrink-0">
                            <Wrench className="w-4 h-4 text-orange-500" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-white font-mono">{reg}</p>
                            <p className="text-xs text-slate-500">{model}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><TypeBadge type={record.maintenanceType} /></TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-900 dark:text-white">
                          {format(parseFirestoreDate(record.serviceDate), "MMM d, yyyy")}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-slate-600 dark:text-slate-400 font-mono">
                          {record.odometer?.toLocaleString()} km
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                          Rs. {record.cost?.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-[220px] truncate" title={record.description}>
                          {record.description || "—"}
                        </p>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {filteredRecords.length > itemsPerPage && (
          <PaginationControl currentPage={page} totalPages={Math.ceil(filteredRecords.length / itemsPerPage)} onPageChange={setPage} />
        )}
      </div>

      <LogMaintenanceModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
