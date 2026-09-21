import React, { useState } from "react";
import { useFormContext } from "react-hook-form";
import { ReturnWizardFormValues } from "@/app/(dashboard)/owner/rentals/[id]/return/page";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "cn";
import { Checkbox } from "@/components/ui/checkbox";

interface Step1ReturnDetailsProps {
  rentalData: any;
}

const FUEL_LEVELS = ["Full", "3/4", "1/2", "1/4", "Empty"];

export default function Step1ReturnDetails({ rentalData }: Step1ReturnDetailsProps) {
  const { control, watch } = useFormContext<ReturnWizardFormValues>();
  const [timeStr, setTimeStr] = useState(format(new Date(), "HH:mm"));

  const startOdo = rentalData?.startOdometer || 0;
  const currentEndOdo = watch("endOdometer");

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-slate-900 dark:text-white">Return Details</h3>
        <p className="text-sm text-slate-500">Record the date, time, and basic vehicle status at the moment of return.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Actual Return Date */}
        <FormField
          control={control}
          name="actualReturnAt"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Return Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal bg-white dark:bg-slate-950",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={(date) => {
                      if (date) {
                        const newDate = new Date(date);
                        const [hours, minutes] = timeStr.split(":");
                        newDate.setHours(parseInt(hours, 10));
                        newDate.setMinutes(parseInt(minutes, 10));
                        field.onChange(newDate);
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Actual Return Time */}
        <FormItem className="flex flex-col">
          <FormLabel>Return Time</FormLabel>
          <FormControl>
            <Input
              type="time"
              value={timeStr}
              onChange={(e) => {
                setTimeStr(e.target.value);
                const currentVal = control._formValues.actualReturnAt as Date;
                if (currentVal && e.target.value) {
                  const newDate = new Date(currentVal);
                  const [hours, minutes] = e.target.value.split(":");
                  newDate.setHours(parseInt(hours, 10));
                  newDate.setMinutes(parseInt(minutes, 10));
                  // Using internal methods here because we aren't registering the time field itself
                  // Instead we patch the actualReturnAt value
                  control._formValues.actualReturnAt = newDate; 
                }
              }}
              className="bg-white dark:bg-slate-950"
            />
          </FormControl>
        </FormItem>

        {/* End Odometer */}
        <FormField
          control={control}
          name="endOdometer"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Closing Odometer</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input 
                    type="number" 
                    placeholder="e.g. 52000" 
                    {...field} 
                    className={cn(
                      "bg-white dark:bg-slate-950 pr-12",
                      currentEndOdo < startOdo && "border-red-500 focus-visible:ring-red-500"
                    )}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                    km
                  </span>
                </div>
              </FormControl>
              <FormDescription>
                Pickup Odometer was: <span className="font-semibold text-slate-700 dark:text-slate-300">{startOdo} km</span>
              </FormDescription>
              {currentEndOdo < startOdo && (
                <p className="text-sm font-medium text-red-500 flex items-center mt-1">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Must be greater than {startOdo}
                </p>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* End Fuel Level */}
        <FormField
          control={control}
          name="endFuelLevel"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Return Fuel Level</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-white dark:bg-slate-950">
                    <SelectValue placeholder="Select fuel level" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {FUEL_LEVELS.map(level => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Pickup Fuel was: <span className="font-semibold text-slate-700 dark:text-slate-300">{rentalData?.pickupHandover?.fuelLevel || 'Unknown'}</span>
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
        <FormField
          control={control}
          name="requiresMaintenance"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-900/50">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Requires Maintenance?
                </FormLabel>
                <FormDescription>
                  Check this if the vehicle needs to be sent for servicing/repair. It will be marked as MAINTENANCE instead of AVAILABLE.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}
