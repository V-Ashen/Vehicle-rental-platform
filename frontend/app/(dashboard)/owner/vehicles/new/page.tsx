import { VehicleForm } from "@/components/owner/vehicles/VehicleForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NewVehiclePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/owner/vehicles">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Add New Vehicle
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Enter the details, pricing rules, and photos for your new vehicle.
          </p>
        </div>
      </div>

      <VehicleForm />
    </div>
  );
}
