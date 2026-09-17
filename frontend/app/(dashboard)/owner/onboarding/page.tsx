"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
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
import { useToast } from "@/hooks/use-toast";
import { Upload, X, CheckCircle2 } from "lucide-react";
import axios from "axios";

const formSchema = z.object({
  businessName: z.string().min(2, "Business name must be at least 2 characters."),
  ownerNic: z.string().min(10, "NIC must be at least 10 characters."),
  mobile: z.string().min(10, "Mobile number must be at least 10 characters."),
  address: z.string().min(5, "Address must be at least 5 characters."),
  city: z.string().min(2, "City must be at least 2 characters."),
  brNumber: z.string().optional(),
});

export default function OnboardingPage() {
  const { tenant, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessName: "",
      ownerNic: "",
      mobile: "",
      address: "",
      city: "",
      brNumber: "",
    },
  });

  useEffect(() => {
    if (tenant) {
      form.reset({
        businessName: tenant.businessName || "",
        ownerNic: tenant.ownerNic || "",
        mobile: tenant.mobile || tenant.phone || "",
        address: tenant.address || "",
        city: tenant.city || "",
        brNumber: tenant.brNumber || "",
      });
      if (tenant.logoUrl) {
        setLogoPreview(tenant.logoUrl);
      }
    }
  }, [tenant, form]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Error", description: "File size must be less than 5MB", variant: "destructive" });
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) return null;
    
    try {
      // 1. Get Signed URL from Backend
      const res = await apiClient.post("/owner/upload/generate-signed-url", {
        fileName: logoFile.name,
        contentType: logoFile.type,
        fileCategory: "business"
      });
      
      const { signedUrl, publicUrl } = res.data.data;

      // 2. Upload directly to GCP Storage
      await axios.put(signedUrl, logoFile, {
        headers: {
          "Content-Type": logoFile.type
        }
      });

      return publicUrl;
    } catch (error) {
      console.error("Upload failed", error);
      throw new Error("Failed to upload logo.");
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      let logoUrl = tenant?.logoUrl;
      
      if (logoFile) {
        logoUrl = await uploadLogo();
      }

      const payload = {
        ...values,
        logoUrl
      };

      await apiClient.post("/owner/profile/submit", payload);
      
      toast({
        title: "Profile Submitted",
        description: "Your business profile has been submitted for review.",
      });

      // Force a hard reload to update the auth context with the new PENDING status
      window.location.href = "/owner/dashboard";
      
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.response?.data?.message || error.message || "An error occurred.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (tenant?.profileStatus === 'PENDING') {
    return (
      <div className="max-w-2xl mx-auto mt-12 p-8 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 text-center">
        <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Profile Under Review</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Your business profile has been successfully submitted and is currently being reviewed by our administrators. 
          You will receive an email once your account is fully activated.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-8">
        <div className="mb-8 border-b border-slate-200 dark:border-slate-800 pb-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Complete Your Business Profile</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Please provide your business details to activate your rental operations.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            {/* Logo Upload Section */}
            <div className="space-y-3">
              <FormLabel>Business Logo (Optional)</FormLabel>
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-800">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo preview" className="w-full h-full object-cover" />
                  ) : (
                    <Upload className="w-8 h-8 text-slate-400" />
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <div className="flex gap-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Choose Image
                    </Button>
                    {logoPreview && (
                      <Button 
                        type="button" 
                        variant="ghost" 
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                        onClick={() => {
                          setLogoFile(null);
                          setLogoPreview(tenant?.logoUrl || null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    )}
                  </div>
                  <FormDescription className="mt-2">
                    Recommended size: 256x256px. Max 5MB.
                  </FormDescription>
                </div>
              </div>
            </div>

            <FormField
              control={form.control}
              name="businessName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Acme Rentals" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="ownerNic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner NIC / Passport</FormLabel>
                    <FormControl>
                      <Input placeholder="National ID number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="mobile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mobile Number</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 234 567 8900" {...field} />
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
                  <FormLabel>Business Address</FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St, Suite 100" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Colombo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="brNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Registration Number (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. PV000000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700">
                {isSubmitting ? "Submitting..." : "Submit Profile"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
