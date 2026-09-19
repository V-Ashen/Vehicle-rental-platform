"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { RentalWizardFormValues } from "@/app/(dashboard)/owner/rentals/new/page";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, Car, AlertCircle, Clock, Banknote } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "cn";
import { format, differenceInHours, addDays } from "date-fns";
import { Input } from "@/components/ui/input";

export default function Step2VehicleDates() {
  const { control, setValue } = useFormContext<RentalWizardFormValues>();

  const { data: responseData, isLoading, isError } = useQuery({
    queryKey: ["owner-vehicles", "AVAILABLE"],
    queryFn: async () => {
      // Pass status=AVAILABLE filter
      const res = await apiClient.get("/vehicles?status=AVAILABLE");
      return res.data.data;
    },
  });

  const vehicles = Array.isArray(responseData) ? responseData : (responseData?.data || []);

  // Watch fields for live math
  const vehicleId = useWatch({ control, name: "vehicleId" });
  const pickupAt = useWatch({ control, name: "pickupAt" });
  const expectedReturnAt = useWatch({ control, name: "expectedReturnAt" });

  const selectedVehicle = vehicles.find((v: any) => v.id === vehicleId);

  // Live Math Calculation
  let rentalDays = 0;
  let totalCost = 0;

  if (pickupAt && expectedReturnAt && selectedVehicle) {
    const hours = differenceInHours(expectedReturnAt, pickupAt);
    if (hours > 0) {
      rentalDays = Math.ceil(hours / 24);
      totalCost = rentalDays * (selectedVehicle.dailyRate || 0);
    }
  }

  // Helper to handle date changes while preserving time
  const handleDateSelect = (newDate: Date | undefined, fieldName: 'pickupAt' | 'expectedReturnAt', currentValue: Date | undefined) => {
    if (!newDate) return;
    
    // If there is an existing value, preserve its hours and minutes
    if (currentValue) {
      newDate.setHours(currentValue.getHours(), currentValue.getMinutes());
    } else {
      // Default to noon if no time was previously set
      newDate.setHours(12, 0);
    }
    setValue(fieldName, newDate, { shouldValidate: true });
  };

  // Helper to handle time changes
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'pickupAt' | 'expectedReturnAt', currentValue: Date | undefined) => {
    if (!currentValue) return; // Ignore if no date selected yet
    
    const [hours, minutes] = e.target.value.split(':');
    const newDate = new Date(currentValue);
    newDate.setHours(parseInt(hours, 10), parseInt(minutes, 10));
    setValue(fieldName, newDate, { shouldValidate: true });
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center">
          <CalendarIcon className="w-5 h-5 mr-2 text-indigo-600" />
          Dates & Vehicle
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Select rental dates and assign an available vehicle.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Date Selection */}
        <div className="space-y-6">
          {/* Pickup Date & Time */}
          <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <h3 className="font-medium text-slate-900 dark:text-white flex items-center">
              <CalendarIcon className="w-4 h-4 mr-2 text-slate-500" /> Pickup
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={control}
                name="pickupAt"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal h-10",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => handleDateSelect(date, "pickupAt", field.value)}
                          initialFocus
                          disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="pickupAt"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                          type="time" 
                          className="pl-9 h-10"
                          value={field.value ? format(field.value, "HH:mm") : ""}
                          onChange={(e) => handleTimeChange(e, "pickupAt", field.value)}
                          disabled={!field.value}
                        />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Return Date & Time */}
          <div className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-800">
            <h3 className="font-medium text-slate-900 dark:text-white flex items-center">
              <CalendarIcon className="w-4 h-4 mr-2 text-slate-500" /> Return
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={control}
                name="expectedReturnAt"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal h-10",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => handleDateSelect(date, "expectedReturnAt", field.value)}
                          initialFocus
                          disabled={(date) => pickupAt ? date < pickupAt : date < new Date()}
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="expectedReturnAt"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                          type="time" 
                          className="pl-9 h-10"
                          value={field.value ? format(field.value, "HH:mm") : ""}
                          onChange={(e) => handleTimeChange(e, "expectedReturnAt", field.value)}
                          disabled={!field.value}
                        />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>

        {/* Vehicle Selection & Live Math */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : isError ? (
            <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              Failed to load available vehicles.
            </div>
          ) : vehicles.length === 0 ? (
            <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 mr-2" />
              No available vehicles right now.
            </div>
          ) : (
            <FormField
              control={control}
              name="vehicleId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vehicle</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-900 h-12">
                        <SelectValue placeholder="Select a vehicle..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {vehicles.map((vehicle: any) => (
                        <SelectItem key={vehicle.id} value={vehicle.id}>
                          {vehicle.make} {vehicle.model} ({vehicle.registrationNumber})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* Live Math Panel */}
          {selectedVehicle && (
            <div className="bg-indigo-50 dark:bg-indigo-900/20 p-5 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
              <h3 className="text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-3 flex items-center uppercase tracking-wider">
                <Banknote className="w-4 h-4 mr-2" />
                Live Summary
              </h3>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Daily Rate</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    Rs. {selectedVehicle.dailyRate?.toLocaleString()}/day
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Duration</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {rentalDays > 0 ? `${rentalDays} Day${rentalDays > 1 ? 's' : ''}` : '-'}
                  </span>
                </div>

                <div className="flex justify-between text-sm pt-2 border-t border-indigo-200 dark:border-indigo-800">
                  <span className="font-semibold text-indigo-900 dark:text-indigo-300">Base Total</span>
                  <span className="font-bold text-lg text-indigo-700 dark:text-indigo-400">
                    Rs. {totalCost.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
