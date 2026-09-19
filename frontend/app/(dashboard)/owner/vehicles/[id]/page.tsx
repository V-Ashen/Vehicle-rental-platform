"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { ArrowLeft, Edit2, Car, Calendar, Key, AlertCircle, Settings, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useState, use } from "react";

export default function VehicleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const vehicleId = unwrappedParams.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const { data: responseData, isLoading, isError } = useQuery({
    queryKey: ["owner-vehicle", vehicleId],
    queryFn: async () => {
      const res = await apiClient.get(`/vehicles/${vehicleId}`);
      return res.data.data;
    },
  });

  const statusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      setIsUpdatingStatus(true);
      return apiClient.put(`/vehicles/${vehicleId}`, { status: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-vehicle", vehicleId] });
      queryClient.invalidateQueries({ queryKey: ["owner-vehicles"] });
      toast({
        title: "Status Updated",
        description: "The vehicle status has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.response?.data?.message || "Failed to update status.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsUpdatingStatus(false);
    }
  });

  const vehicle = responseData;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (isError || !vehicle) {
    return (
      <div className="p-12 text-center text-red-500">
        Failed to load vehicle details.
      </div>
    );
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case 'ON_RENT': return "bg-blue-100 text-blue-800 border-blue-200";
      case 'RESERVED': return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case 'MAINTENANCE': return "bg-red-100 text-red-800 border-red-200";
      case 'INACTIVE': return "bg-slate-100 text-slate-800 border-slate-200";
      default: return "";
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/owner/vehicles">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
              {vehicle.make} {vehicle.model}
              <Badge className={getStatusBadgeColor(vehicle.status)}>{vehicle.status}</Badge>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-mono mt-1">
              {vehicle.registrationNumber}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Quick Status Override */}
          <div className="w-40">
            <Select 
              value={vehicle.status} 
              onValueChange={(val) => statusMutation.mutate(val)}
              disabled={isUpdatingStatus}
            >
              <SelectTrigger className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                <SelectValue placeholder="Change Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AVAILABLE">Available</SelectItem>
                <SelectItem value="RESERVED">Reserved</SelectItem>
                <SelectItem value="ON_RENT">On Rent</SelectItem>
                <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Link href={`/owner/vehicles/${vehicle.id}/edit`}>
            <Button variant="outline" className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Image & Specs */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="aspect-video bg-slate-100 dark:bg-slate-800 w-full relative">
              {vehicle.imageUrl ? (
                <img src={vehicle.imageUrl} alt={`${vehicle.make} ${vehicle.model}`} className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Car className="w-16 h-16 text-slate-300" />
                </div>
              )}
            </div>
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4 text-slate-900 dark:text-white">Vehicle Specifications</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Year</span>
                  <span className="font-medium text-slate-900 dark:text-white">{vehicle.year}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Type</span>
                  <span className="font-medium text-slate-900 dark:text-white">{vehicle.vehicleType}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Transmission</span>
                  <span className="font-medium text-slate-900 dark:text-white">{vehicle.transmission || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Fuel</span>
                  <span className="font-medium text-slate-900 dark:text-white">{vehicle.fuelType || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Seats</span>
                  <span className="font-medium text-slate-900 dark:text-white">{vehicle.seats || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Colour</span>
                  <span className="font-medium text-slate-900 dark:text-white">{vehicle.colour || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Odometer</span>
                  <span className="font-medium text-slate-900 dark:text-white">{vehicle.currentOdometer.toLocaleString()} km</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Pricing & Quick Stats */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="w-5 h-5 text-indigo-500" />
                Pricing Rules
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <p className="text-sm font-medium text-slate-500 mb-1">Daily Rate</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">Rs. {vehicle.dailyRate?.toLocaleString()}</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <p className="text-sm font-medium text-slate-500 mb-1">Weekly Rate</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {vehicle.weeklyRate ? `Rs. ${vehicle.weeklyRate.toLocaleString()}` : 'N/A'}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                  <p className="text-sm font-medium text-slate-500 mb-1">Monthly Rate</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {vehicle.monthlyRate ? `Rs. ${vehicle.monthlyRate.toLocaleString()}` : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Standard Deposit</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">Rs. {vehicle.depositAmount?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Included KM (Daily)</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">{vehicle.includedKmPerDay} km</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Extra KM Rate</p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">Rs. {vehicle.extraKmRate}/km</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats (Placeholder for future metrics) */}
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-indigo-500" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Calendar className="w-12 h-12 text-slate-300 mb-3" />
                <p className="text-slate-900 dark:text-white font-medium">No recent rentals</p>
                <p className="text-slate-500 text-sm mt-1">When this vehicle is rented, activity will appear here.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
