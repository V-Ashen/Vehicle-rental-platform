"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { VehicleForm } from "@/components/owner/vehicles/VehicleForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { use } from "react";

export default function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const vehicleId = unwrappedParams.id;
  const { data: responseData, isLoading, isError } = useQuery({
    queryKey: ["owner-vehicle", vehicleId],
    queryFn: async () => {
      const res = await apiClient.get(`/vehicles/${vehicleId}`);
      return res.data.data;
    },
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href={`/owner/vehicles/${vehicleId}`}>
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Edit Vehicle: {vehicle.registrationNumber}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Update details, pricing rules, or photos for this vehicle.
          </p>
        </div>
      </div>

      <VehicleForm initialData={vehicle} />
    </div>
  );
}
