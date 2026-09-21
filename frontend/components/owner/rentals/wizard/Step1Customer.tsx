"use client";

import { useFormContext } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { RentalWizardFormValues } from "@/app/(dashboard)/owner/rentals/new/page";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, AlertCircle } from "lucide-react";

export default function Step1Customer() {
  const { control } = useFormContext<RentalWizardFormValues>();

  const { data: responseData, isLoading, isError } = useQuery({
    queryKey: ["owner-customers"],
    queryFn: async () => {
      const res = await apiClient.get("/customers");
      return res.data.data;
    },
  });

  const customers = Array.isArray(responseData) ? responseData : (responseData?.data || []);

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center">
          <Users className="w-5 h-5 mr-2 text-indigo-600" />
          Select Customer
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Choose the customer who is renting the vehicle.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : isError ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          Failed to load customers. Please try again.
        </div>
      ) : customers.length === 0 ? (
        <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          No customers found. Please add a customer first before creating a rental.
        </div>
      ) : (
        <div className="max-w-md">
          <FormField
            control={control}
            name="customerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-900 h-12">
                      <SelectValue placeholder="Select a customer..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {customers.map((customer: any) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.fullName} ({customer.nicPassport})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      )}
    </div>
  );
}
