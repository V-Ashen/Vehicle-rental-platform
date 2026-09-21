"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Search, Wrench, CalendarClock, Plus } from "lucide-react";
import { format } from "date-fns";
import { parseFirestoreDate } from "@/lib/dateUtils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import LogMaintenanceModal from "@/components/owner/maintenance/LogMaintenanceModal";

export default function MaintenancePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: records, isLoading } = useQuery({
    queryKey: ["owner-maintenance"],
    queryFn: async () => {
      const res = await apiClient.get("/maintenance");
      return res.data.data;
    },
  });

  const { data: vehicles } = useQuery({
    queryKey: ["owner-vehicles"],
    queryFn: async () => {
      const res = await apiClient.get("/vehicles");
      return res.data.data;
    },
  });

  const filteredRecords = records?.filter((record: any) =>
    record.vehicleRegistration?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.vehicleMakeModel?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.maintenanceType?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'SERVICE': return <Badge className="bg-blue-100 text-blue-800">Service</Badge>;
      case 'REPAIR': return <Badge className="bg-red-100 text-red-800">Repair</Badge>;
      case 'INSPECTION': return <Badge className="bg-purple-100 text-purple-800">Inspection</Badge>;
      default: return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center">
            <Wrench className="w-6 h-6 mr-2 text-indigo-600" />
            Maintenance Log
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track repairs, servicing, and inspections for your fleet.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />
          Log Maintenance
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search by registration, model, or type..."
              className="pl-9 bg-white dark:bg-slate-950"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Service Date</TableHead>
                <TableHead>Odometer (km)</TableHead>
                <TableHead>Cost (Rs.)</TableHead>
                <TableHead>Description</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
                      <p className="text-slate-500">Loading maintenance records...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                    <CalendarClock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-lg font-medium text-slate-900 dark:text-white mb-1">No records found</p>
                    <p>There are no maintenance logs matching your search.</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((record: any) => (
                  <TableRow 
                    key={record.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <TableCell>
                      <div className="text-sm">
                        <p className="font-medium text-slate-900 dark:text-white">
                          {record.vehicleRegistration || vehicles?.find((v: any) => v.id === record.vehicleId)?.registrationNumber || 'Unknown'}
                        </p>
                        <p className="text-slate-500 text-xs">
                          {record.vehicleMakeModel || (() => {
                            const v = vehicles?.find((v: any) => v.id === record.vehicleId);
                            return v ? `${v.make} ${v.model}` : 'Unknown';
                          })()}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getTypeBadge(record.maintenanceType)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-slate-900 dark:text-white">
                        {format(parseFirestoreDate(record.serviceDate), "MMM d, yyyy")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        {record.odometer.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-slate-900 dark:text-white">
                        Rs. {record.cost.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-slate-600 dark:text-slate-400 max-w-[200px] truncate" title={record.description}>
                        {record.description}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <LogMaintenanceModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}
