"use client";

import { useEffect, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { RentalWizardFormValues } from "@/app/(dashboard)/owner/rentals/new/page";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, UploadCloud, X, ImageIcon, Loader2 } from "lucide-react";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

export default function Step3Handover() {
  const { control, setValue } = useFormContext<RentalWizardFormValues>();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const vehicleId = useWatch({ control, name: "vehicleId" });
  const photoUrls = useWatch({ control, name: "photoUrls" }) || [];

  const { data: vehicleData } = useQuery({
    queryKey: ["owner-vehicle", vehicleId],
    queryFn: async () => {
      if (!vehicleId) return null;
      const res = await apiClient.get(`/vehicles/${vehicleId}`);
      return res.data.data;
    },
    enabled: !!vehicleId
  });

  useEffect(() => {
    if (vehicleData?.currentOdometer) {
      // Auto-fill odometer if not already filled
      const currentOdo = control._formValues.odometer;
      if (!currentOdo || currentOdo === 0) {
        setValue("odometer", vehicleData.currentOdometer, { shouldValidate: true });
      }
    }
  }, [vehicleData, setValue, control._formValues.odometer]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsUploading(true);
    const files = Array.from(e.target.files);
    
    try {
      const newUrls: string[] = [...photoUrls];
      
      for (const file of files) {
        // 1. Get pre-signed URL from our backend
        const res = await apiClient.post("/upload/generate-signed-url", {
          fileName: file.name,
          contentType: file.type,
          fileCategory: "handover"
        });

        const { signedUrl, publicUrl } = res.data.data;

        // 2. Upload directly to Firebase Storage bucket using PUT
        await axios.put(signedUrl, file, {
          headers: { "Content-Type": file.type }
        });

        newUrls.push(publicUrl);
      }

      setValue("photoUrls", newUrls, { shouldValidate: true });
      
    } catch (error) {
      console.error("Upload failed", error);
      toast({
        title: "Upload Failed",
        description: "Could not upload one or more handover images.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      // Reset input so the same file can be selected again if needed
      e.target.value = '';
    }
  };

  const removePhoto = (index: number) => {
    const newUrls = [...photoUrls];
    newUrls.splice(index, 1);
    setValue("photoUrls", newUrls, { shouldValidate: true });
  };

  return (
    <div className="space-y-8">
      <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white flex items-center">
          <ClipboardCheck className="w-5 h-5 mr-2 text-indigo-600" />
          Physical Handover
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Record the outgoing condition of the vehicle before giving the keys.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={control}
              name="odometer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Outgoing Odometer (km)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g. 45000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={control}
              name="fuelLevel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fuel Level</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select fuel level" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Full">Full</SelectItem>
                      <SelectItem value="3/4">3/4</SelectItem>
                      <SelectItem value="1/2">1/2</SelectItem>
                      <SelectItem value="1/4">1/4</SelectItem>
                      <SelectItem value="Empty">Empty</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={control}
            name="conditionStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Vehicle Condition</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Condition" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="GOOD">Good (No new damages)</SelectItem>
                    <SelectItem value="DAMAGED">Damaged (Pre-existing)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Handover Notes (Optional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Any specific instructions or scratches noted..." 
                    className="resize-none h-24"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-4">
          <FormLabel>Handover Photos</FormLabel>
          <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center justify-center text-center">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 w-12 h-12 rounded-full flex items-center justify-center mb-3">
              <UploadCloud className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">Upload outgoing photos</p>
            <p className="text-xs text-slate-500 mb-4">Capture the odometer, fuel gauge, and exterior.</p>
            
            <div className="relative">
              <Button type="button" variant="outline" disabled={isUploading} className="relative z-10">
                {isUploading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                ) : "Select Images"}
              </Button>
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                onChange={handleFileUpload}
                disabled={isUploading}
              />
            </div>
          </div>

          {photoUrls.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-4">
              {photoUrls.map((url, index) => (
                <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
                  <img src={url} alt={`Handover ${index}`} className="w-full h-full object-cover" />
                  <button 
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
