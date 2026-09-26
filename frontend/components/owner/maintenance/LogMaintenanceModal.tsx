import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "cn";

const maintenanceSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle is required"),
  maintenanceType: z.enum(["SERVICE", "REPAIR", "INSPECTION"]),
  description: z.string().min(1, "Description is required"),
  serviceDate: z.date({ required_error: "Service date is required" }),
  odometer: z.coerce.number().min(0, "Odometer must be positive"),
  cost: z.coerce.number().min(0, "Cost must be positive"),
  markVehicleAvailable: z.boolean().default(false),
});

type MaintenanceFormValues = z.infer<typeof maintenanceSchema>;

interface LogMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LogMaintenanceModal({ isOpen, onClose }: LogMaintenanceModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: vehicles } = useQuery({
    queryKey: ["owner-vehicles"],
    queryFn: async () => {
      const res = await apiClient.get("/vehicles");
      return res.data.data;
    },
  });

  const form = useForm<MaintenanceFormValues>({
    resolver: zodResolver(maintenanceSchema),
    defaultValues: {
      vehicleId: "",
      maintenanceType: "SERVICE",
      description: "",
      serviceDate: new Date(),
      odometer: 0,
      cost: 0,
      markVehicleAvailable: false,
    },
  });

  const logMutation = useMutation({
    mutationFn: async (data: MaintenanceFormValues) => {
      const res = await apiClient.post("/maintenance", {
        ...data,
        serviceDate: data.serviceDate.toISOString(),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-maintenance"] });
      queryClient.invalidateQueries({ queryKey: ["owner-vehicles"] });
      toast({
        title: "Maintenance Logged",
        description: "The maintenance record has been saved successfully.",
      });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to log maintenance",
        description: error.response?.data?.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MaintenanceFormValues) => {
    logMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-white dark:bg-slate-950">
        <DialogHeader>
          <DialogTitle>Log Maintenance</DialogTitle>
          <DialogDescription>
            Record a new service, repair, or inspection for a vehicle.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="vehicleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vehicle</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white dark:bg-slate-900">
                          <SelectValue placeholder="Select vehicle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vehicles?.map((v: any) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.registrationNumber} ({v.make} {v.model})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maintenanceType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maintenance Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white dark:bg-slate-900">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="SERVICE">Service</SelectItem>
                        <SelectItem value="REPAIR">Repair</SelectItem>
                        <SelectItem value="INSPECTION">Inspection</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="serviceDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Service Date</FormLabel>
                    <Popover>
                      <PopoverTrigger
                        type="button"
                        className={cn(
                          buttonVariants({ variant: "outline" }),
                          "w-full pl-3 text-left font-normal bg-white dark:bg-slate-900",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="odometer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Odometer (km)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} className="bg-white dark:bg-slate-900" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Cost (Rs.)</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} className="bg-white dark:bg-slate-900" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description / Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="What was done during this maintenance?" 
                      className="resize-none bg-white dark:bg-slate-900" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <FormField
                control={form.control}
                name="markVehicleAvailable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-900/50">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Mark Vehicle as Available</FormLabel>
                      <FormDescription>
                        Check this if the vehicle is ready to be rented again. It will change the vehicle status from MAINTENANCE to AVAILABLE.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={logMutation.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={logMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700">
                {logMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Record
              </Button>
            </div>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
