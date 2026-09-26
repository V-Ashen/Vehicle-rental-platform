"use client";

import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldPlus } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const AVAILABLE_PERMISSIONS = [
  { id: "rentals.view", label: "View Rentals" },
  { id: "rentals.create", label: "Create Rentals" },
  { id: "rentals.manage", label: "Manage Rentals (Handover/Return)" },
  { id: "vehicles.view", label: "View Vehicles" },
  { id: "vehicles.manage", label: "Manage Vehicles" },
  { id: "customers.view", label: "View Customers" },
  { id: "customers.manage", label: "Manage Customers" },
  { id: "reports.view", label: "View Financial Reports" },
  { id: "settings.manage", label: "Manage Settings" },
  { id: "billing.manage", label: "Manage Billing" },
  { id: "users.manage", label: "Manage Users & Roles" },
];

const roleSchema = z.object({
  name: z.string().min(2, "Role name is required"),
  permissions: z.array(z.string()).min(1, "Select at least one permission"),
});

type RoleFormValues = z.infer<typeof roleSchema>;

interface AddRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddRoleModal({ isOpen, onClose }: AddRoleModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: "",
      permissions: [],
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: RoleFormValues) => {
      const res = await apiClient.post("/owner/roles", data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-roles"] });
      toast({
        title: "Role Created",
        description: "The new custom role has been successfully created.",
      });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.response?.data?.message || "Could not create the role.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RoleFormValues) => {
    createMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-white dark:bg-slate-950 p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <ShieldPlus className="w-5 h-5 mr-2 text-indigo-600" />
            Create Custom Role
          </DialogTitle>
          <DialogDescription>
            Define a name and assign permissions to this role.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Sales Associate" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="permissions"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Permissions</FormLabel>
                  </div>
                  <div className="space-y-3 h-[250px] overflow-y-auto pr-2">
                    {AVAILABLE_PERMISSIONS.map((perm) => (
                      <FormField
                        key={perm.id}
                        control={form.control}
                        name="permissions"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={perm.id}
                              className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-3 border-slate-200 dark:border-slate-800"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(perm.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, perm.id])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== perm.id
                                          )
                                        )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer flex-1 leading-tight">
                                {perm.label}
                                <div className="text-xs text-slate-400 mt-1">{perm.id}</div>
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={onClose} disabled={createMutation.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700">
                {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Role
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
