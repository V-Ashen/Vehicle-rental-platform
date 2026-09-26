"use client";

import { useState } from "react";
import { useFormContext } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { RentalWizardFormValues } from "@/app/(dashboard)/owner/rentals/new/page";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, AlertCircle, Plus, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function Step1Customer() {
  const { control, setValue } = useFormContext<RentalWizardFormValues>();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCust, setNewCust] = useState({ fullName: "", mobile: "", nicPassport: "", email: "", drivingLicence: "", address: "" });

  const { data: responseData, isLoading, isError } = useQuery({
    queryKey: ["owner-customers"],
    queryFn: async () => {
      const res = await apiClient.get("/customers");
      return res.data.data;
    },
  });

  const customers = Array.isArray(responseData) ? responseData : (responseData?.data || []);

  const createCustomerMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiClient.post("/customers", data);
      return res.data.data;
    },
    onSuccess: (newCustomer) => {
      queryClient.invalidateQueries({ queryKey: ["owner-customers"] });
      setValue("customerId", newCustomer.id);
      toast({ title: "Success", description: "Customer created successfully" });
      setIsDialogOpen(false);
      setNewCust({ fullName: "", mobile: "", nicPassport: "", email: "", drivingLicence: "", address: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create customer",
        variant: "destructive",
      });
    }
  });

  const handleCreateCustomer = () => {
    if (!newCust.fullName || !newCust.mobile || !newCust.email) {
      toast({ title: "Validation Error", description: "Name, Mobile, and Email are required", variant: "destructive" });
      return;
    }
    createCustomerMutation.mutate(newCust);
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center">
            <Users className="w-5 h-5 mr-2 text-indigo-600" />
            Select Customer
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Choose the customer who is renting the vehicle.
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline" className="bg-white dark:bg-slate-900">
              <Plus className="w-4 h-4 mr-2" />
              New Customer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Quick Customer</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <FormLabel>Full Name</FormLabel>
                <Input 
                  value={newCust.fullName}
                  onChange={(e) => setNewCust({ ...newCust, fullName: e.target.value })}
                  placeholder="e.g. John Doe"
                />
              </div>
              <div className="space-y-2">
                <FormLabel>Mobile Number</FormLabel>
                <Input 
                  value={newCust.mobile}
                  onChange={(e) => setNewCust({ ...newCust, mobile: e.target.value })}
                  placeholder="e.g. 0771234567"
                />
              </div>
              <div className="space-y-2">
                <FormLabel>Email Address</FormLabel>
                <Input 
                  value={newCust.email}
                  onChange={(e) => setNewCust({ ...newCust, email: e.target.value })}
                  placeholder="e.g. john@example.com"
                  type="email"
                />
              </div>
              <div className="space-y-2">
                <FormLabel>NIC / Passport</FormLabel>
                <Input 
                  value={newCust.nicPassport}
                  onChange={(e) => setNewCust({ ...newCust, nicPassport: e.target.value })}
                  placeholder="e.g. 199012345678"
                />
              </div>
              <div className="space-y-2">
                <FormLabel>Driving Licence</FormLabel>
                <Input 
                  value={newCust.drivingLicence}
                  onChange={(e) => setNewCust({ ...newCust, drivingLicence: e.target.value })}
                  placeholder="e.g. B1234567"
                />
              </div>
              <div className="space-y-2">
                <FormLabel>Address</FormLabel>
                <Input 
                  value={newCust.address}
                  onChange={(e) => setNewCust({ ...newCust, address: e.target.value })}
                  placeholder="e.g. 123 Main St, City"
                />
              </div>
              <Button 
                type="button" 
                className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700" 
                onClick={handleCreateCustomer}
                disabled={createCustomerMutation.isPending}
              >
                {createCustomerMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Save & Select Customer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
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
          No customers found. Please click "New Customer" to add one.
        </div>
      ) : (
        <div className="max-w-md">
          <FormField
            control={control}
            name="customerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Customer</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || ""}>
                  <FormControl>
                    <SelectTrigger className="w-full bg-slate-50 dark:bg-slate-900 h-12">
                      <SelectValue placeholder="Select a customer..." />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {customers.map((customer: any) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.fullName} {customer.nicPassport ? `(${customer.nicPassport})` : ''}
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
