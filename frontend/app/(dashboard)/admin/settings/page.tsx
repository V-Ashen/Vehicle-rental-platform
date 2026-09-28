"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, Save, Loader2, Bell } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

export default function AdminSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const res = await apiClient.get("/admin/settings");
      return res.data.data;
    }
  });

  const [alertsEnabled, setAlertsEnabled] = React.useState(true);
  const [fleetAlertsEnabled, setFleetAlertsEnabled] = React.useState(true);

  React.useEffect(() => {
    if (settings) {
      setAlertsEnabled(settings.subscriptionAlertsEnabled !== false);
      setFleetAlertsEnabled(settings.rentalAndFleetAlertsEnabled !== false);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (payload: { subscriptionAlertsEnabled: boolean; rentalAndFleetAlertsEnabled: boolean }) => {
      const res = await apiClient.put("/admin/settings", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-settings"] });
      toast({
        title: "Settings Saved",
        description: "Global system settings have been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save settings",
        description: error.response?.data?.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  });

  const handleSave = () => {
    updateMutation.mutate({ 
      subscriptionAlertsEnabled: alertsEnabled, 
      rentalAndFleetAlertsEnabled: fleetAlertsEnabled 
    });
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center">
            <SettingsIcon className="w-6 h-6 mr-2 text-indigo-600" />
            Global Platform Settings
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure platform-wide automated jobs, emails, and global features.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <Card className="border-slate-200 shadow-sm max-w-2xl">
          <CardHeader>
            <CardTitle>System Notifications</CardTitle>
            <CardDescription>
              Control the automated communications dispatched by background cron jobs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-row items-center justify-between rounded-lg border border-slate-200 p-4 bg-slate-50">
              <div className="space-y-0.5">
                <div className="flex items-center">
                  <Bell className="w-4 h-4 mr-2 text-slate-500" />
                  <label className="text-base font-medium">Subscription Renewal Alerts</label>
                </div>
                <p className="text-sm text-slate-500 max-w-[400px] mt-1">
                  Globally enable or disable the automated daily renewal reminders sent to SaaS tenants. Turn this off if you are exceeding your daily Resend API limits.
                </p>
              </div>
              <Switch
                checked={alertsEnabled}
                onCheckedChange={setAlertsEnabled}
              />
            </div>

            <div className="flex flex-row items-center justify-between rounded-lg border border-slate-200 p-4 bg-slate-50">
              <div className="space-y-0.5">
                <div className="flex items-center">
                  <Bell className="w-4 h-4 mr-2 text-slate-500" />
                  <label className="text-base font-medium">Rental & Fleet Operation Alerts</label>
                </div>
                <p className="text-sm text-slate-500 max-w-[400px] mt-1">
                  Globally enable or disable automated alerts for overdue rentals, upcoming pickups, and vehicle document expirations. Turn this off if you need to pause all daily operational emails.
                </p>
              </div>
              <Switch
                checked={fleetAlertsEnabled}
                onCheckedChange={setFleetAlertsEnabled}
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={handleSave} disabled={updateMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700">
                {updateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Changes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
