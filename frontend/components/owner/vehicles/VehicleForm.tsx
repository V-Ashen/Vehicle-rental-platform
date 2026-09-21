"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, Car, DollarSign, Image as ImageIcon } from "lucide-react";
import axios from "axios";

const formSchema = z.object({
  registrationNumber: z.string().min(2, "Registration number is required."),
  make: z.string().min(2, "Make is required."),
  model: z.string().min(1, "Model is required."),
  year: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 1),
  vehicleType: z.string().min(2, "Vehicle type is required."),
  transmission: z.enum(['AUTO', 'MANUAL']).optional(),
  fuelType: z.string().optional(),
  seats: z.coerce.number().int().min(1).optional(),
  colour: z.string().optional(),
  currentOdometer: z.coerce.number().min(0),
  
  dailyRate: z.coerce.number().min(0, "Daily rate is required"),
  weeklyRate: z.coerce.number().min(0).optional(),
  monthlyRate: z.coerce.number().min(0).optional(),
  extraKmRate: z.coerce.number().min(0),
  includedKmPerDay: z.coerce.number().min(0),
  depositAmount: z.coerce.number().min(0),
});

type VehicleFormProps = {
  initialData?: any;
};

export function VehicleForm({ initialData }: VehicleFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("details");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.imageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      registrationNumber: initialData?.registrationNumber || "",
      make: initialData?.make || "",
      model: initialData?.model || "",
      year: initialData?.year || new Date().getFullYear(),
      vehicleType: initialData?.vehicleType || "CAR",
      transmission: initialData?.transmission || "AUTO",
      fuelType: initialData?.fuelType || "PETROL",
      seats: initialData?.seats || 4,
      colour: initialData?.colour || "",
      currentOdometer: initialData?.currentOdometer || 0,
      
      dailyRate: initialData?.dailyRate || 0,
      weeklyRate: initialData?.weeklyRate || 0,
      monthlyRate: initialData?.monthlyRate || 0,
      extraKmRate: initialData?.extraKmRate || 0,
      includedKmPerDay: initialData?.includedKmPerDay || 100,
      depositAmount: initialData?.depositAmount || 0,
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Error", description: "File size must be less than 5MB", variant: "destructive" });
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return null;
    
    try {
      const res = await apiClient.post("/owner/upload/generate-signed-url", {
        fileName: imageFile.name,
        contentType: imageFile.type,
        fileCategory: "vehicles"
      });
      
      const { signedUrl, publicUrl } = res.data.data;

      await axios.put(signedUrl, imageFile, {
        headers: { "Content-Type": imageFile.type }
      });

      return publicUrl;
    } catch (error) {
      console.error("Upload failed", error);
      throw new Error("Failed to upload image.");
    }
  };

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      let imageUrl = initialData?.imageUrl;
      
      if (imageFile) {
        imageUrl = await uploadImage();
      }

      const payload = { ...values, imageUrl };

      if (initialData?.id) {
        return apiClient.put(`/vehicles/${initialData.id}`, payload);
      }
      return apiClient.post("/vehicles", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-vehicles"] });
      if (initialData?.id) {
        queryClient.invalidateQueries({ queryKey: ["owner-vehicle", initialData.id] });
      }
      toast({
        title: "Success",
        description: `Vehicle ${initialData ? 'updated' : 'created'} successfully.`,
      });
      router.push("/owner/vehicles");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save vehicle.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    mutation.mutate(values);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="details" className="data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-600 dark:data-[state=active]:bg-indigo-500/20 dark:data-[state=active]:text-indigo-400">
                  <Car className="w-4 h-4 mr-2" />
                  Vehicle Details
                </TabsTrigger>
                <TabsTrigger value="pricing" className="data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-600 dark:data-[state=active]:bg-emerald-500/20 dark:data-[state=active]:text-emerald-400">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Pricing Rules
                </TabsTrigger>
                <TabsTrigger value="images" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600 dark:data-[state=active]:bg-blue-500/20 dark:data-[state=active]:text-blue-400">
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Images
                </TabsTrigger>
              </TabsList>
              
              {/* DETAILS TAB */}
              <TabsContent value="details" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="registrationNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Registration Number</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. CAB-1234" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="vehicleType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Vehicle Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="CAR">Car</SelectItem>
                            <SelectItem value="SUV">SUV</SelectItem>
                            <SelectItem value="VAN">Van</SelectItem>
                            <SelectItem value="MOTORCYCLE">Motorcycle</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="make"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Make</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Toyota" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Model</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Corolla" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Year</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="2020" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="transmission"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Transmission</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select transmission" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="AUTO">Automatic</SelectItem>
                            <SelectItem value="MANUAL">Manual</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="fuelType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fuel Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select fuel type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="PETROL">Petrol</SelectItem>
                            <SelectItem value="DIESEL">Diesel</SelectItem>
                            <SelectItem value="ELECTRIC">Electric</SelectItem>
                            <SelectItem value="HYBRID">Hybrid</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="seats"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Seats</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="colour"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Colour</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Pearl White" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="currentOdometer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Odometer (km)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="flex justify-end pt-4">
                  <Button type="button" onClick={() => setActiveTab("pricing")} className="bg-indigo-600 hover:bg-indigo-700">
                    Next: Pricing Rules
                  </Button>
                </div>
              </TabsContent>

              {/* PRICING TAB */}
              <TabsContent value="pricing" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField
                    control={form.control}
                    name="dailyRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Daily Rate (Rs.)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="weeklyRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weekly Rate (Rs.)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormDescription>Optional discounted rate</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="monthlyRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Rate (Rs.)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormDescription>Optional discounted rate</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <FormField
                    control={form.control}
                    name="depositAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Standard Deposit Amount (Rs.)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormDescription>Refundable security deposit</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                  <FormField
                    control={form.control}
                    name="includedKmPerDay"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Included KM Per Day</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="extraKmRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Extra KM Rate (Rs.)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("details")}>
                    Back to Details
                  </Button>
                  <Button type="button" onClick={() => setActiveTab("images")} className="bg-indigo-600 hover:bg-indigo-700">
                    Next: Images
                  </Button>
                </div>
              </TabsContent>

              {/* IMAGES TAB */}
              <TabsContent value="images" className="space-y-6">
                <div className="space-y-4">
                  <FormLabel className="text-lg">Primary Vehicle Photo</FormLabel>
                  <p className="text-sm text-slate-500">
                    Upload a clear, high-quality image of the vehicle. This will be the primary photo shown to customers.
                  </p>
                  
                  <div className="mt-4 flex flex-col md:flex-row items-start gap-8">
                    <div className="w-full md:w-96 h-64 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-800/50">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Vehicle preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center p-6">
                          <ImageIcon className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                          <p className="text-slate-500 text-sm">No image uploaded</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 space-y-4">
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                      
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="w-full sm:w-auto"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Choose Image
                      </Button>
                      
                      {imagePreview && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          className="w-full sm:w-auto text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 block"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview(initialData?.imageUrl || null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                        >
                          <X className="w-4 h-4 mr-2 inline" />
                          Remove
                        </Button>
                      )}
                      
                      <div className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                        <ul className="list-disc pl-4 space-y-1">
                          <li>Recommended format: 16:9 ratio</li>
                          <li>Max file size: 5MB</li>
                          <li>Supported formats: JPEG, PNG, WebP</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-8 border-t border-slate-200 dark:border-slate-800 mt-8">
                  <Button type="button" variant="outline" onClick={() => setActiveTab("pricing")}>
                    Back to Pricing
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={mutation.isPending} 
                    className="bg-indigo-600 hover:bg-indigo-700 px-8"
                  >
                    {mutation.isPending ? "Saving..." : (initialData ? "Update Vehicle" : "Create Vehicle")}
                  </Button>
                </div>
              </TabsContent>
              
            </Tabs>
          </form>
        </Form>
      </div>
    </div>
  );
}
