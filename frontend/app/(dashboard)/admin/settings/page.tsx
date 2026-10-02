"use client";

import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, Save, Loader2, Bell, RefreshCw } from "lucide-react";
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
      toast({ title: "Settings Saved", description: "Global system settings have been successfully updated." });
    },
    onError: (error: any) => {
      toast({ title: "Failed to save settings", description: error.response?.data?.message || "An unexpected error occurred.", variant: "destructive" });
    }
  });

  const handleSave = () => {
    updateMutation.mutate({ subscriptionAlertsEnabled: alertsEnabled, rentalAndFleetAlertsEnabled: fleetAlertsEnabled });
  };

  const settingItems = [
    {
      id: 'subscription',
      title: 'Subscription Renewal Email Alerts',
      description: 'Globally enable or disable automated email reminders sent to SaaS tenants. In-app notifications are always delivered.',
      checked: alertsEnabled,
      onChange: setAlertsEnabled,
    },
    {
      id: 'fleet',
      title: 'Rental & Fleet Email Alerts',
      description: 'Globally enable or disable automated emails for overdue rentals, upcoming pickups, and document expirations. In-app notifications are always delivered.',
      checked: fleetAlertsEnabled,
      onChange: setFleetAlertsEnabled,
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-700/60 border border-slate-600/50 flex items-center justify-center">
              <SettingsIcon className="w-5 h-5 text-slate-300" />
            </div>
            Platform Settings
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">Configure platform-wide automated jobs, emails, and global features.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
        </div>
      ) : (
        <div className="max-w-2xl space-y-4">
          {/* Notification Settings Card */}
          <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-800/60 shadow-xl overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800/60">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
                <Bell className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">System Notifications</h2>
                <p className="text-xs text-slate-500">Control automated background communications</p>
              </div>
            </div>

            <div className="divide-y divide-slate-800/60">
              {settingItems.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-6 px-6 py-5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <RefreshCw className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <label className="text-sm font-semibold text-slate-200">{item.title}</label>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
                    <div className={`mt-2 inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${item.checked ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-700/50 text-slate-500 border border-slate-700/50'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${item.checked ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                      {item.checked ? 'Enabled' : 'Disabled'}
                    </div>
                  </div>
                  <Switch
                    checked={item.checked}
                    onCheckedChange={item.onChange}
                    className="shrink-0 mt-0.5"
                  />
                </div>
              ))}
            </div>

            <div className="px-6 py-4 border-t border-slate-800/60 flex justify-end bg-slate-900/30">
              <Button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 rounded-xl"
              >
                {updateMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</>
                ) : (
                  <><Save className="w-4 h-4 mr-2" />Save Changes</>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
