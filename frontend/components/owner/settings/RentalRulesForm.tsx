"use client";

import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const rentalRulesSchema = z.object({
  gracePeriodMinutes: z.coerce.number().min(0, "Grace period cannot be negative"),
  hourlyLateCharge: z.coerce.number().min(0, "Hourly late charge cannot be negative"),
  defaultIncludedKmPerDay: z.coerce.number().min(0, "Included KM cannot be negative"),
});

type RentalRulesFormValues = z.infer<typeof rentalRulesSchema>;

export default function RentalRulesForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tenant, isLoading, isError, error } = useQuery({
    queryKey: ["owner-profile"],
    queryFn: async () => {
      const res = await apiClient.get("/owner/profile");
      return res.data.data;
    },
  });

  const form = useForm<RentalRulesFormValues>({
    resolver: zodResolver(rentalRulesSchema),
    values: tenant ? {
      gracePeriodMinutes: tenant.gracePeriodMinutes ?? 60,
      hourlyLateCharge: tenant.hourlyLateCharge ?? 1000,
      defaultIncludedKmPerDay: tenant.defaultIncludedKmPerDay ?? 100,
    } : {
      gracePeriodMinutes: 60,
      hourlyLateCharge: 1000,
      defaultIncludedKmPerDay: 100,
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: RentalRulesFormValues) => {
      const res = await apiClient.put("/owner/profile", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-profile"] });
      toast({
        title: "Rules Saved",
        description: "Your rental rules have been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save rules",
        description: error.response?.data?.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RentalRulesFormValues) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex justify-center p-12 text-red-500">
        Failed to load profile: {(error as any)?.message}
      </div>
    );
  }

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
      <CardHeader>
        <CardTitle>Rental Rules</CardTitle>
        <CardDescription>
          Configure the default global rules applied to your vehicle rentals.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="gracePeriodMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grace Period (Minutes)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} className="bg-white dark:bg-slate-900" />
                    </FormControl>
                    <FormDescription>
                      Minutes allowed after the expected return time before late fees start accumulating.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="hourlyLateCharge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hourly Late Charge (Rs.)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} className="bg-white dark:bg-slate-900" />
                    </FormControl>
                    <FormDescription>
                      The fee applied for every hour a vehicle is returned late (after grace period).
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="defaultIncludedKmPerDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Included KM / Day</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} className="bg-white dark:bg-slate-900" />
                    </FormControl>
                    <FormDescription>
                      Default limit for new vehicles. This can be overridden per vehicle.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button type="submit" disabled={updateMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700">
                {updateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Rules
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
