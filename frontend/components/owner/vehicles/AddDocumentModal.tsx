import React, { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button, buttonVariants } from "@/components/ui/button";
import { format } from "date-fns";
import { CalendarIcon, Loader2, UploadCloud } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "cn";
import axios from "axios";

const documentSchema = z.object({
  documentType: z.enum(["INSURANCE", "REVENUE", "EMISSION", "OTHER"]),
  documentNumber: z.string().min(1, "Document number is required"),
  issueDate: z.date({ required_error: "Issue date is required" }),
  expiryDate: z.date({ required_error: "Expiry date is required" }),
  fileUrl: z.string().url("A file must be uploaded"),
});

type DocumentFormValues = z.infer<typeof documentSchema>;

interface AddDocumentModalProps {
  vehicleId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function AddDocumentModal({ vehicleId, isOpen, onClose }: AddDocumentModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      documentType: "INSURANCE",
      documentNumber: "",
      issueDate: new Date(),
      expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // Default to 1 year from now
      fileUrl: "",
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: DocumentFormValues) => {
      const res = await apiClient.post(`/vehicles/${vehicleId}/documents`, {
        ...data,
        issueDate: data.issueDate.toISOString(),
        expiryDate: data.expiryDate.toISOString(),
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-vehicle-documents", vehicleId] });
      toast({
        title: "Document Added",
        description: "The vehicle document has been saved successfully.",
      });
      form.reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add document",
        description: error.response?.data?.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsUploading(true);
    const file = e.target.files[0];
    
    try {
      const res = await apiClient.post("/owner/upload/generate-signed-url", {
        fileName: file.name,
        contentType: file.type,
        fileCategory: "documents"
      });

      const { signedUrl, publicUrl } = res.data.data;

      await axios.put(signedUrl, file, {
        headers: { "Content-Type": file.type }
      });

      form.setValue("fileUrl", publicUrl, { shouldValidate: true });
      
    } catch (error) {
      console.error("Upload failed", error);
      toast({
        title: "Upload Failed",
        description: "Could not upload the document.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const onSubmit = (data: DocumentFormValues) => {
    uploadMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-white dark:bg-slate-950">
        <DialogHeader>
          <DialogTitle>Add Vehicle Document</DialogTitle>
          <DialogDescription>
            Upload insurance, revenue license, or other compliance documents.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            
            <FormField
              control={form.control}
              name="documentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="bg-white dark:bg-slate-900">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="INSURANCE">Insurance Policy</SelectItem>
                      <SelectItem value="REVENUE">Revenue License</SelectItem>
                      <SelectItem value="EMISSION">Emission Test Certificate</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="documentNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document / Policy Number</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. POL-123456" {...field} className="bg-white dark:bg-slate-900" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="issueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Issue Date</FormLabel>
                    <Popover>
                      <PopoverTrigger
                        type="button"
                        className={cn(
                          buttonVariants({ variant: "outline" }),
                          "w-full pl-3 text-left font-normal bg-white dark:bg-slate-900",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
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
                name="expiryDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Expiry Date</FormLabel>
                    <Popover>
                      <PopoverTrigger
                        type="button"
                        className={cn(
                          buttonVariants({ variant: "outline" }),
                          "w-full pl-3 text-left font-normal bg-white dark:bg-slate-900",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
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
            </div>

            <FormField
              control={form.control}
              name="fileUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Upload Document</FormLabel>
                  <div className="mt-2 flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                    {field.value ? (
                      <div className="text-center">
                        <div className="bg-emerald-100 dark:bg-emerald-900/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                          <UploadCloud className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400 mb-4">Document Uploaded Successfully</p>
                        
                        <div className="relative">
                          <Button type="button" variant="outline" size="sm" disabled={isUploading} className="relative z-10 bg-white dark:bg-slate-950">
                            {isUploading ? (
                              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Replacing...</>
                            ) : "Replace File"}
                          </Button>
                          <input 
                            type="file" 
                            accept="image/*,application/pdf" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                            onChange={handleFileUpload}
                            disabled={isUploading}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="bg-indigo-100 dark:bg-indigo-900/30 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                          <UploadCloud className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">Select a file to upload</p>
                        <p className="text-xs text-slate-500 mb-4">PDF, JPG, or PNG files only</p>
                        
                        <div className="relative">
                          <Button type="button" variant="outline" disabled={isUploading} className="relative z-10 bg-white dark:bg-slate-950">
                            {isUploading ? (
                              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                            ) : "Browse Files"}
                          </Button>
                          <input 
                            type="file" 
                            accept="image/*,application/pdf" 
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                            onChange={handleFileUpload}
                            disabled={isUploading}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={uploadMutation.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={uploadMutation.isPending || !form.formState.isValid} className="bg-indigo-600 hover:bg-indigo-700">
                {uploadMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Document
              </Button>
            </div>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
