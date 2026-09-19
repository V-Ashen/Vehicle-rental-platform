"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Plus, Search, Car, Image as ImageIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function VehiclesPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: responseData, isLoading } = useQuery({
    queryKey: ["owner-vehicles"],
    queryFn: async () => {
      const res = await apiClient.get("/vehicles");
      return res.data.data;
    },
  });

  const vehicles = Array.isArray(responseData) ? responseData : (responseData?.data || []);

  const filteredVehicles = vehicles.filter((vehicle: any) => 
    vehicle.make.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vehicle.model.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vehicle.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200">Available</Badge>;
      case 'ON_RENT':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">On Rent</Badge>;
      case 'RESERVED':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">Reserved</Badge>;
      case 'MAINTENANCE':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">Maintenance</Badge>;
      case 'INACTIVE':
        return <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-100 border-slate-200">Inactive</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center">
            <Car className="w-8 h-8 mr-3 text-indigo-600" />
            Vehicle Fleet
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Manage your vehicles, pricing rules, and statuses.
          </p>
        </div>
        <Link href="/owner/vehicles/new">
          <Button className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Add Vehicle
          </Button>
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search by make, model, or registration..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white dark:bg-slate-900"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <Table className="w-full whitespace-nowrap">
            <TableHeader className="bg-slate-50 dark:bg-slate-800">
              <TableRow>
                <TableHead className="w-20">Photo</TableHead>
                <TableHead>Registration</TableHead>
                <TableHead>Vehicle Info</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Daily Rate</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
                      <p className="text-slate-500">Loading fleet...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredVehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                    <Car className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-lg font-medium text-slate-900 dark:text-white mb-1">No vehicles found</p>
                    <p>Get started by adding your first vehicle to the fleet.</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredVehicles.map((vehicle: any) => (
                  <TableRow 
                    key={vehicle.id} 
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    onClick={() => router.push(`/owner/vehicles/${vehicle.id}`)}
                  >
                    <TableCell>
                      {vehicle.imageUrl ? (
                        <div className="w-16 h-12 rounded-md overflow-hidden bg-slate-100 flex items-center justify-center">
                          <img src={vehicle.imageUrl} alt={vehicle.model} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-16 h-12 rounded-md bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                          <ImageIcon className="w-5 h-5 text-slate-400" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900 dark:text-white">
                      {vehicle.registrationNumber}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="font-semibold text-slate-900 dark:text-white">{vehicle.make} {vehicle.model}</p>
                        <p className="text-slate-500">{vehicle.year} • {vehicle.vehicleType}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(vehicle.status)}
                    </TableCell>
                    <TableCell className="font-medium text-slate-900 dark:text-white">
                      Rs. {vehicle.dailyRate?.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/owner/vehicles/${vehicle.id}`);
                        }}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
