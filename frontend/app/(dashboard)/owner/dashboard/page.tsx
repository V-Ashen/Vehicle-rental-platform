"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Car, Key, Wrench, AlertTriangle, CalendarCheck, CalendarX } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function OwnerDashboard() {
  const { tenant } = useAuth();

  const { data: metrics, isLoading } = useQuery({
    queryKey: ["owner-dashboard-metrics"],
    queryFn: async () => {
      const res = await apiClient.get("/owner/dashboard");
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="animate-pulse h-8 w-64 bg-slate-200 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse h-32 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Welcome back, {tenant?.businessName || 'Owner'}
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Here is what's happening with your rental business today.
        </p>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">Vehicle Fleet Status</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Vehicles</CardTitle>
              <Car className="h-4 w-4 text-slate-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{metrics?.vehicles?.total || 0}</div>
            </CardContent>
          </Card>
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Available</CardTitle>
              <div className="h-4 w-4 rounded-full bg-emerald-100 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{metrics?.vehicles?.available || 0}</div>
            </CardContent>
          </Card>
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">On Rent</CardTitle>
              <Key className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-600">{metrics?.vehicles?.onRent || 0}</div>
            </CardContent>
          </Card>
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">In Maintenance</CardTitle>
              <Wrench className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{metrics?.vehicles?.inMaintenance || 0}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200">Today's Operations</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Pickups Today</CardTitle>
              <CalendarCheck className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{metrics?.operations?.pickupsToday || 0}</div>
            </CardContent>
          </Card>
          <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Returns Today</CardTitle>
              <CalendarX className="h-4 w-4 text-slate-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{metrics?.operations?.returnsToday || 0}</div>
            </CardContent>
          </Card>
          <Card className="border-red-200 dark:border-red-900 shadow-sm bg-red-50 dark:bg-red-950/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-red-700 dark:text-red-400">Overdue Rentals</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{metrics?.operations?.overdueRentals || 0}</div>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}
