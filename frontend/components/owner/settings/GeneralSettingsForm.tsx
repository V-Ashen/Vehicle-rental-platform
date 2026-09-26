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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const generalSchema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  emailEnabled: z.boolean().default(true),
  smsEnabled: z.boolean().default(false),
  invoiceNotes: z.string().optional(),
  agreementTerms: z.string().optional(),
});

type GeneralFormValues = z.infer<typeof generalSchema>;

export default function GeneralSettingsForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tenant, isLoading, isError, error } = useQuery({
    queryKey: ["owner-profile"],
    queryFn: async () => {
      const res = await apiClient.get("/owner/profile");
      return res.data.data;
    },
  });

  const form = useForm<GeneralFormValues>({
    resolver: zodResolver(generalSchema),
    values: tenant ? {
      businessName: tenant.businessName || "",
      email: tenant.email || "",
      phone: tenant.phone || "",
      address: tenant.address || "",
      city: tenant.city || "",
      emailEnabled: tenant.emailEnabled !== false, // default true if undefined
      smsEnabled: tenant.smsEnabled === true,
      invoiceNotes: tenant.invoiceNotes || "",
      agreementTerms: tenant.agreementTerms || "",
    } : {
      businessName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      emailEnabled: true,
      smsEnabled: false,
      invoiceNotes: "",
      agreementTerms: "",
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: GeneralFormValues) => {
      // Backend expects mobile instead of phone in the schema, but we mapped it in the controller.
      // We will send 'mobile' to match the backend validation schema.
      const res = await apiClient.put("/owner/profile", {
        businessName: data.businessName,
        mobile: data.phone,
        address: data.address,
        city: data.city,
        emailEnabled: data.emailEnabled,
        smsEnabled: data.smsEnabled,
        invoiceNotes: data.invoiceNotes,
        agreementTerms: data.agreementTerms
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-profile"] });
      toast({
        title: "Settings Saved",
        description: "Your general profile settings have been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to save settings",
        description: error.response?.data?.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: GeneralFormValues) => {
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
        <CardTitle>Company Profile</CardTitle>
        <CardDescription>
          Update your business name, contact information, and address.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-white dark:bg-slate-900" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Email</FormLabel>
                    <FormControl>
                      <Input {...field} disabled className="bg-slate-50 dark:bg-slate-900/50 cursor-not-allowed" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-white dark:bg-slate-900" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-white dark:bg-slate-900" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Street Address</FormLabel>
                    <FormControl>
                      <Input {...field} className="bg-white dark:bg-slate-900" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Notification Preferences</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="emailEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-900/50">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Email Notifications</FormLabel>
                        <CardDescription>
                          Receive system alerts and updates via email.
                        </CardDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="smsEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-900/50">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">SMS Notifications</FormLabel>
                        <CardDescription>
                          Receive critical alerts via SMS (charges apply).
                        </CardDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-4">Document Templates</h3>
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="invoiceNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Invoice Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Thank you for your business! Payment is due within 7 days."
                          className="min-h-[100px] bg-white dark:bg-slate-900"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="agreementTerms"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Standard Rental Agreement Terms</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="1. The renter agrees to return the vehicle in the same condition..."
                          className="min-h-[150px] bg-white dark:bg-slate-900"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button type="submit" disabled={updateMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700">
                {updateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save Profile
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
