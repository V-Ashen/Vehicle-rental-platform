"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Car, Image as ImageIcon, Wrench, Key, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { PaginationControl } from "@/components/ui/pagination-control";
import { cn } from "cn";

function VehicleStatusPill({ status }: { status: string }) {
  const config: Record<string, { label: string; cls: string; dot: string }> = {
    AVAILABLE:   { label: "Available",   cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50", dot: "bg-emerald-500" },
    ON_RENT:     { label: "On Rent",     cls: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/50",   dot: "bg-indigo-500" },
    RESERVED:    { label: "Reserved",    cls: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800/50",         dot: "bg-amber-400" },
    MAINTENANCE: { label: "Maintenance", cls: "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-800/50",   dot: "bg-orange-500" },
    INACTIVE:    { label: "Inactive",    cls: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700",              dot: "bg-slate-400" },
  };
  const c = config[status] ?? { label: status, cls: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" };
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border", c.cls)}>
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", c.dot)} />
      {c.label}
    </span>
  );
}

export default function VehiclesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 12;

  const { data: responseData, isLoading } = useQuery({
    queryKey: ["owner-vehicles"],
    queryFn: async () => {
      const res = await apiClient.get("/vehicles");
      return res.data.data;
    },
  });

  const vehicles = Array.isArray(responseData) ? responseData : (responseData?.data || []);

  const filteredVehicles = vehicles.filter((v: any) =>
    v.make?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.registrationNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paged = filteredVehicles.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const available = vehicles.filter((v: any) => v.status === "AVAILABLE").length;
  const onRent = vehicles.filter((v: any) => v.status === "ON_RENT").length;
  const maintenance = vehicles.filter((v: any) => v.status === "MAINTENANCE").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Vehicle Fleet</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {vehicles.length} vehicles · {available} available · {onRent} on rent · {maintenance} in maintenance
          </p>
        </div>
        <RequirePermission permission="vehicles.create">
          <Link href="/owner/vehicles/new">
            <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4" />
              Add Vehicle
            </Button>
          </Link>
        </RequirePermission>
      </div>

      {/* Summary pills */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Available", count: available, icon: CheckCircle, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
          { label: "On Rent", count: onRent, icon: Key, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-900/20" },
          { label: "Maintenance", count: maintenance, icon: Wrench, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/20" },
        ].map(({ label, count, icon: Icon, color, bg }) => (
          <div key={label} className={cn("flex items-center gap-3 p-4 rounded-2xl border border-slate-200 dark:border-slate-800", bg)}>
            <Icon className={cn("w-5 h-5 shrink-0", color)} />
            <div>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{count}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search make, model, registration…"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="pl-9 h-9 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 dark:bg-slate-800/40 hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider w-20">Photo</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Registration</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vehicle</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Daily Rate</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">KM / Day</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <Car className="w-7 h-7 text-slate-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">No vehicles found</p>
                        <p className="text-sm text-slate-500 mt-0.5">
                          {searchQuery ? "Try a different search" : "Add your first vehicle to the fleet"}
                        </p>
                      </div>
                      {!searchQuery && (
                        <Link href="/owner/vehicles/new">
                          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                            <Plus className="w-4 h-4" /> Add Vehicle
                          </Button>
                        </Link>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((vehicle: any) => (
                  <TableRow
                    key={vehicle.id}
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors border-slate-100 dark:border-slate-800"
                    onClick={() => router.push(`/owner/vehicles/${vehicle.id}`)}
                  >
                    <TableCell>
                      {vehicle.imageUrl ? (
                        <img src={vehicle.imageUrl} alt={vehicle.model} className="w-16 h-11 rounded-xl object-cover bg-slate-100" />
                      ) : (
                        <div className="w-16 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-slate-400" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm font-semibold text-slate-900 dark:text-white">{vehicle.registrationNumber}</span>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{vehicle.make} {vehicle.model}</p>
                      <p className="text-xs text-slate-500">{vehicle.year} · {vehicle.vehicleType}</p>
                    </TableCell>
                    <TableCell><VehicleStatusPill status={vehicle.status} /></TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">Rs. {vehicle.dailyRate?.toLocaleString()}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600 dark:text-slate-400">{vehicle.includedKmPerDay ?? "—"} km</span>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="h-8 text-slate-500 dark:text-slate-400" onClick={() => router.push(`/owner/vehicles/${vehicle.id}`)}>
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {filteredVehicles.length > itemsPerPage && (
          <PaginationControl currentPage={page} totalPages={Math.ceil(filteredVehicles.length / itemsPerPage)} onPageChange={setPage} />
        )}
      </div>
    </div>
  );
}
