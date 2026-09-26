import React, { useState } from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import { ReturnWizardFormValues } from "@/app/(dashboard)/owner/rentals/[id]/return/page";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, UploadCloud, X, Loader2, Wrench } from "lucide-react";
import axios from "axios";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function Step2DamageCheck() {
  const { control, register } = useFormContext<ReturnWizardFormValues>();
  const { toast } = useToast();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "damages",
  });

  // State to track upload status for specific field array indices
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setUploadingIndex(index);
    const files = Array.from(e.target.files);
    
    try {
      const currentUrls: string[] = control._formValues.damages[index].photoUrls || [];
      const newUrls: string[] = [...currentUrls];
      
      for (const file of files) {
        const res = await apiClient.post("/owner/upload/generate-signed-url", {
          fileName: file.name,
          contentType: file.type,
          fileCategory: "damage"
        });

        const { signedUrl, publicUrl } = res.data.data;

        await axios.put(signedUrl, file, {
          headers: { "Content-Type": file.type }
        });

        newUrls.push(publicUrl);
      }

      // Update the specific damage item's photoUrls using setValue would trigger re-render of the whole form, 
      // but it's cleaner to just update the array element if we use RHF setValue correctly:
      control._formValues.damages[index].photoUrls = newUrls;
      
      // Force a re-render for just this field to show the new photos
      // A quick hack is to re-append and pop, but `update` is better if we imported it
      // Let's just use an empty trigger to force UI update
      control._subjects.watch.next({ name: `damages.${index}.photoUrls` });
      
    } catch (error) {
      console.error("Upload failed", error);
      toast({
        title: "Upload Failed",
        description: "Could not upload one or more damage images.",
        variant: "destructive"
      });
    } finally {
      setUploadingIndex(null);
      e.target.value = '';
    }
  };

  const removePhoto = (damageIndex: number, photoIndex: number) => {
    const currentUrls: string[] = control._formValues.damages[damageIndex].photoUrls || [];
    currentUrls.splice(photoIndex, 1);
    control._formValues.damages[damageIndex].photoUrls = currentUrls;
    control._subjects.watch.next({ name: `damages.${damageIndex}.photoUrls` });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-medium text-slate-900 dark:text-white flex items-center">
            <Wrench className="w-5 h-5 mr-2 text-indigo-600" />
            Damage Inspection
          </h3>
          <p className="text-sm text-slate-500">
            Record any new damages found during the return inspection. Leave empty if none.
          </p>
        </div>
        <Button 
          type="button" 
          onClick={() => append({ damageArea: "", damageType: "", description: "", estimatedCost: 0, photoUrls: [] })}
          className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Damage
        </Button>
      </div>

      {fields.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50">
          <Wrench className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No Damages Recorded</h4>
          <p className="text-sm text-slate-500">The vehicle is returned in good condition.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {fields.map((field, index) => {
            const currentPhotos = control._formValues.damages[index]?.photoUrls || [];
            return (
              <div key={field.id} className="relative p-6 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950 shadow-sm">
                
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute top-4 right-4 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="w-5 h-5" />
                </Button>

                <h4 className="font-medium text-slate-900 dark:text-white mb-4">Damage Item #{index + 1}</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={control}
                        name={`damages.${index}.damageArea`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Area</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Front Bumper" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name={`damages.${index}.damageType`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Type</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Scratch" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={control}
                      name={`damages.${index}.description`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Details about the damage..." className="resize-none h-20" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={control}
                      name={`damages.${index}.estimatedCost`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estimated Charge (Rs.)</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <FormLabel>Damage Evidence</FormLabel>
                    <div className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center justify-center text-center h-[120px]">
                      <div className="relative w-full h-full flex flex-col items-center justify-center">
                        <Button type="button" variant="outline" disabled={uploadingIndex === index} className="relative z-10 bg-white dark:bg-slate-950">
                          {uploadingIndex === index ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                          ) : (
                            <><UploadCloud className="w-4 h-4 mr-2" /> Add Photos</>
                          )}
                        </Button>
                        <input 
                          type="file" 
                          multiple 
                          accept="image/*" 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                          onChange={(e) => handleFileUpload(e, index)}
                          disabled={uploadingIndex === index}
                        />
                      </div>
                    </div>

                    {currentPhotos.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 mt-4">
                        {currentPhotos.map((url: string, pIndex: number) => (
                          <div key={pIndex} className="relative group aspect-square rounded-md overflow-hidden border border-slate-200 dark:border-slate-800">
                            <img src={url} alt={`Damage ${index} - ${pIndex}`} className="w-full h-full object-cover" />
                            <button 
                              type="button"
                              onClick={() => removePhoto(index, pIndex)}
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
          })}
        </div>
      )}
    </div>
  );
}
