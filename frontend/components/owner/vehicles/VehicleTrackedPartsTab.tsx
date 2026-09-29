"use client";

import React, { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Plus, Settings, AlertTriangle, CheckCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function VehicleTrackedPartsTab({ vehicleId }: { vehicleId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [newPart, setNewPart] = useState({ partName: "", replacedAtOdometer: 0, lifespanKm: 0 });

  const { data: vehicle, isLoading } = useQuery({
    queryKey: ["owner-vehicle", vehicleId],
    queryFn: async () => {
      const res = await apiClient.get(`/vehicles/${vehicleId}`);
      return res.data.data;
    },
  });

  const trackedParts = vehicle?.trackedParts || [];
  const currentOdometer = vehicle?.currentOdometer || 0;

  const updatePartsMutation = useMutation({
    mutationFn: async (updatedParts: any[]) => {
      return apiClient.put(`/vehicles/${vehicleId}`, { trackedParts: updatedParts });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-vehicle", vehicleId] });
      toast({ title: "Success", description: "Tracked parts updated successfully." });
      setIsAdding(false);
      setNewPart({ partName: "", replacedAtOdometer: 0, lifespanKm: 0 });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to update parts.", variant: "destructive" });
    }
  });

  const handleAddPart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPart.partName || newPart.lifespanKm <= 0) return;
    
    const newPartsList = [...trackedParts, { ...newPart, alertTriggered: false }];
    updatePartsMutation.mutate(newPartsList);
  };

  const handleDeletePart = (index: number) => {
    const newPartsList = trackedParts.filter((_: any, i: number) => i !== index);
    updatePartsMutation.mutate(newPartsList);
  };

  const handleResetPart = (index: number) => {
    // Treat as "replaced today"
    const newPartsList = [...trackedParts];
    newPartsList[index] = {
      ...newPartsList[index],
      replacedAtOdometer: currentOdometer,
      alertTriggered: false
    };
    updatePartsMutation.mutate(newPartsList);
  };

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Mileage-Based Maintenance Tracking</h2>
          <p className="text-sm text-slate-500">Track parts like Tires or Brake Pads based on vehicle odometer.</p>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
            <Plus className="w-4 h-4" /> Add Part to Track
          </Button>
        )}
      </div>

      {isAdding && (
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-base font-semibold">Track a New Part</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <form onSubmit={handleAddPart} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Part Name</label>
                <Input 
                  required 
                  value={newPart.partName} 
                  onChange={e => setNewPart({...newPart, partName: e.target.value})} 
                  placeholder="e.g., Front Tires" 
                  className="bg-white dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Replaced At (Odometer)</label>
                <Input 
                  type="number" 
                  required 
                  min="0"
                  value={newPart.replacedAtOdometer} 
                  onChange={e => setNewPart({...newPart, replacedAtOdometer: Number(e.target.value)})} 
                  className="bg-white dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">Lifespan (KM)</label>
                <Input 
                  type="number" 
                  required 
                  min="1"
                  value={newPart.lifespanKm} 
                  onChange={e => setNewPart({...newPart, lifespanKm: Number(e.target.value)})} 
                  className="bg-white dark:bg-slate-950"
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAdding(false)} className="flex-1">Cancel</Button>
                <Button type="submit" disabled={updatePartsMutation.isPending} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">Save</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trackedParts.length === 0 && !isAdding ? (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center text-slate-500">
            <Settings className="w-8 h-8 mb-3 text-slate-300" />
            <p>No parts are currently being tracked.</p>
          </div>
        ) : (
          trackedParts.map((part: any, index: number) => {
            const dueAt = part.replacedAtOdometer + part.lifespanKm;
            const remaining = dueAt - currentOdometer;
            const isDue = remaining <= 0;
            const isWarning = remaining > 0 && remaining <= 2000; // Warning within 2000 km
            
            const progress = Math.min(100, Math.max(0, ((currentOdometer - part.replacedAtOdometer) / part.lifespanKm) * 100));

            return (
              <Card key={index} className="border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
                {part.alertTriggered && (
                  <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                    ALERT SENT
                  </div>
                )}
                <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                        {part.partName}
                        {isDue ? <AlertTriangle className="w-4 h-4 text-red-500" /> : isWarning ? <AlertTriangle className="w-4 h-4 text-amber-500" /> : <CheckCircle className="w-4 h-4 text-emerald-500" />}
                      </CardTitle>
                      <CardDescription className="text-xs mt-1">Replaced at {part.replacedAtOdometer.toLocaleString()} km</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1.5">
                      <span className="text-slate-500">Lifespan Progress</span>
                      <span className={isDue ? "text-red-600 font-bold" : isWarning ? "text-amber-600 font-bold" : "text-emerald-600 font-bold"}>
                        {isDue ? "OVERDUE" : `${remaining.toLocaleString()} km left`}
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${isDue ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <Button variant="outline" size="sm" onClick={() => handleResetPart(index)} className="text-xs h-8">
                      Mark as Replaced
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeletePart(index)} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 h-8 px-2">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
