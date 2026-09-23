"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Check, ArrowRight, CreditCard, Building, UploadCloud } from "lucide-react";
import { cn } from "cn";
import axios from "axios";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"ONLINE" | "BANK_TRANSFER" | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [slipUrl, setSlipUrl] = useState<string | null>(null);

  const { data: packages, isLoading } = useQuery({
    queryKey: ["owner-packages"],
    queryFn: async () => {
      const res = await apiClient.get("/owner/billing/packages");
      return res.data.data;
    },
    enabled: isOpen,
  });

  const onlinePaymentMutation = useMutation({
    mutationFn: async (packageId: string) => {
      const res = await apiClient.post("/payments/checkout", { packageId });
      return res.data.data;
    },
    onSuccess: (data) => {
      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    },
    onError: (error: any) => {
      toast({
        title: "Checkout Failed",
        description: error.response?.data?.message || "Could not initialize checkout.",
        variant: "destructive",
      });
    }
  });

  const bankTransferMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.post("/payments/bank-transfer", { 
        packageId: selectedPackage,
        slipUrl
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-payments"] });
      toast({
        title: "Request Submitted",
        description: "Your bank transfer slip has been sent for administrative approval.",
      });
      handleClose();
    },
    onError: (error: any) => {
      toast({
        title: "Submission Failed",
        description: error.response?.data?.message || "Could not submit bank transfer.",
        variant: "destructive",
      });
    }
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsUploading(true);
    const file = e.target.files[0];
    
    try {
      const res = await apiClient.post("/owner/upload/generate-signed-url", {
        fileName: file.name,
        contentType: file.type,
        fileCategory: "slips"
      });

      const { signedUrl, publicUrl } = res.data.data;

      await axios.put(signedUrl, file, {
        headers: { "Content-Type": file.type }
      });

      setSlipUrl(publicUrl);
    } catch (error) {
      console.error("Upload failed", error);
      toast({
        title: "Upload Failed",
        description: "Could not upload the payment slip.",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleContinueToPayment = () => {
    if (selectedPackage) {
      setStep(2);
    }
  };

  const handleFinalSubmit = () => {
    if (!selectedPackage) return;

    if (paymentMethod === "ONLINE") {
      onlinePaymentMutation.mutate(selectedPackage);
    } else if (paymentMethod === "BANK_TRANSFER" && slipUrl) {
      bankTransferMutation.mutate();
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelectedPackage(null);
    setPaymentMethod(null);
    setSlipUrl(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-4xl bg-white dark:bg-slate-950 p-0 overflow-hidden sm:max-w-4xl">
        
        <div className="flex shrink-0 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          <div className={cn("flex-1 text-center py-4 text-sm font-medium border-b-2", step === 1 ? "border-indigo-600 text-indigo-700 dark:text-indigo-400" : "border-transparent text-slate-500")}>
            1. Select Plan
          </div>
          <div className={cn("flex-1 text-center py-4 text-sm font-medium border-b-2", step === 2 ? "border-indigo-600 text-indigo-700 dark:text-indigo-400" : "border-transparent text-slate-500")}>
            2. Payment Method
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[75vh]">
          {step === 1 && (
            <div className="space-y-6">
              <DialogHeader>
                <DialogTitle>Choose your subscription plan</DialogTitle>
                <DialogDescription>
                  Upgrade to unlock more vehicles and advanced features.
                </DialogDescription>
              </DialogHeader>

              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {packages?.map((pkg: any) => (
                    <div 
                      key={pkg.id}
                      onClick={() => setSelectedPackage(pkg.id)}
                      className={cn(
                        "relative rounded-xl border-2 p-5 cursor-pointer transition-all",
                        selectedPackage === pkg.id 
                          ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20 shadow-md shadow-indigo-100 dark:shadow-none" 
                          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                      )}
                    >
                      {selectedPackage === pkg.id && (
                        <div className="absolute top-3 right-3 bg-indigo-600 text-white rounded-full p-0.5">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                      <h4 className="font-bold text-slate-900 dark:text-white text-lg">{pkg.name}</h4>
                      <div className="mt-2 flex items-baseline text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
                        Rs. {pkg.monthlyPrice.toLocaleString()}
                        <span className="ml-1 text-sm font-medium text-slate-500">/mo</span>
                      </div>
                      
                      <ul className="mt-6 space-y-3 text-sm text-slate-600 dark:text-slate-400">
                        <li className="flex items-center"><Check className="w-4 h-4 text-emerald-500 mr-2 shrink-0" /> Up to {pkg.maxVehicles} Vehicles</li>
                        <li className="flex items-center"><Check className="w-4 h-4 text-emerald-500 mr-2 shrink-0" /> {pkg.maxUsers} Staff Accounts</li>
                        {Object.entries(pkg.features || {}).map(([key, val]) => (
                          <li key={key} className="flex items-center">
                            <Check className="w-4 h-4 text-emerald-500 mr-2 shrink-0" /> 
                            {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button 
                  onClick={handleContinueToPayment} 
                  disabled={!selectedPackage}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Continue to Payment <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <DialogHeader>
                <DialogTitle>Payment Details</DialogTitle>
                <DialogDescription>
                  Select how you would like to pay for your subscription.
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  onClick={() => setPaymentMethod("ONLINE")}
                  className={cn(
                    "flex flex-col items-center justify-center p-6 rounded-xl border-2 cursor-pointer transition-all text-center",
                    paymentMethod === "ONLINE"
                      ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                  )}
                >
                  <CreditCard className={cn("w-10 h-10 mb-3", paymentMethod === "ONLINE" ? "text-indigo-600" : "text-slate-400")} />
                  <h4 className="font-semibold text-slate-900 dark:text-white">Pay Online</h4>
                  <p className="text-xs text-slate-500 mt-1">Instant activation via Credit/Debit card.</p>
                </div>

                <div 
                  onClick={() => setPaymentMethod("BANK_TRANSFER")}
                  className={cn(
                    "flex flex-col items-center justify-center p-6 rounded-xl border-2 cursor-pointer transition-all text-center",
                    paymentMethod === "BANK_TRANSFER"
                      ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/20"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                  )}
                >
                  <Building className={cn("w-10 h-10 mb-3", paymentMethod === "BANK_TRANSFER" ? "text-indigo-600" : "text-slate-400")} />
                  <h4 className="font-semibold text-slate-900 dark:text-white">Bank Transfer</h4>
                  <p className="text-xs text-slate-500 mt-1">Upload deposit slip. Requires admin approval.</p>
                </div>
              </div>

              {paymentMethod === "BANK_TRANSFER" && (
                <div className="mt-6 p-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                  <h4 className="font-medium text-slate-900 dark:text-white mb-2">Upload Transfer Slip</h4>
                  <p className="text-sm text-slate-500 mb-4">
                    Please transfer the funds to our bank account (Acct: 123456789, Bank of Ceylon) and upload the receipt here.
                  </p>
                  
                  {slipUrl ? (
                    <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 p-3 rounded-lg">
                      <div className="flex items-center text-emerald-700 dark:text-emerald-400 font-medium text-sm">
                        <Check className="w-4 h-4 mr-2" /> Receipt uploaded successfully
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setSlipUrl(null)} className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100">
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="relative inline-block">
                        <Button type="button" variant="outline" disabled={isUploading} className="relative z-10 bg-white dark:bg-slate-950">
                          {isUploading ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                          ) : (
                            <><UploadCloud className="w-4 h-4 mr-2" /> Browse Files</>
                          )}
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
              )}

              <div className="flex justify-between pt-4 mt-6 border-t border-slate-100 dark:border-slate-800">
                <Button variant="outline" onClick={() => setStep(1)} disabled={onlinePaymentMutation.isPending || bankTransferMutation.isPending}>
                  Back
                </Button>
                
                <Button 
                  onClick={handleFinalSubmit}
                  disabled={
                    !paymentMethod || 
                    (paymentMethod === "BANK_TRANSFER" && !slipUrl) ||
                    onlinePaymentMutation.isPending ||
                    bankTransferMutation.isPending
                  }
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  {(onlinePaymentMutation.isPending || bankTransferMutation.isPending) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {paymentMethod === "ONLINE" ? "Proceed to Checkout" : "Submit Receipt"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
