"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import {
  Dialog,
  DialogContent,
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
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  fullName: z.string().min(2, "Full name is required."),
  nicPassport: z.string().min(5, "NIC or Passport is required."),
  mobile: z.string().min(10, "Mobile number is required."),
  email: z.string().email("Invalid email address.").optional().or(z.literal("")),
  address: z.string().min(5, "Address is required."),
});

type CustomerFormModalProps = {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  initialData?: any;
};

export function CustomerFormModal({ isOpen, setIsOpen, initialData }: CustomerFormModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fullName: "",
      nicPassport: "",
      mobile: "",
      email: "",
      address: "",
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        fullName: initialData.fullName || "",
        nicPassport: initialData.nicPassport || "",
        mobile: initialData.mobile || "",
        email: initialData.email || "",
        address: initialData.address || "",
      });
    } else {
      form.reset({
        fullName: "",
        nicPassport: "",
        mobile: "",
        email: "",
        address: "",
      });
    }
  }, [initialData, form, isOpen]);

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      if (initialData?.id) {
        return apiClient.put(`/customers/${initialData.id}`, values);
      }
      return apiClient.post("/customers", values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-customers"] });
      toast({
        title: "Success",
        description: `Customer ${initialData ? 'updated' : 'created'} successfully.`,
      });
      setIsOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save customer.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
            {initialData ? 'Edit Customer' : 'Create Customer'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="nicPassport"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>NIC / Passport</FormLabel>
                  <FormControl>
                    <Input placeholder="National ID or Passport" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 234 567 890" {...field} />
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
                    <FormLabel>Email (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="john@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="pt-4 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending} className="bg-indigo-600 hover:bg-indigo-700">
                {mutation.isPending ? "Saving..." : "Save Customer"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
