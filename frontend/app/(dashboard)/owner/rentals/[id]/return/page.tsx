"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Stepper } from "@/components/ui/stepper";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import Step1ReturnDetails from "@/components/owner/rentals/return-wizard/Step1ReturnDetails";
import Step2DamageCheck from "@/components/owner/rentals/return-wizard/Step2DamageCheck";
import Step3Settlement from "@/components/owner/rentals/return-wizard/Step3Settlement";

const returnWizardSchema = z.object({
  // Step 1
  actualReturnAt: z.date({ required_error: "Return date/time is required" }),
  endOdometer: z.coerce.number().min(0, "Odometer must be a positive number"),
  endFuelLevel: z.string().min(1, "Please provide the fuel level"),
  requiresMaintenance: z.boolean(),
  // Step 2
  damages: z.array(z.object({
    damageArea: z.string().min(1, "Area is required"),
    damageType: z.string().min(1, "Type is required"),
    description: z.string().min(1, "Description is required"),
    estimatedCost: z.coerce.number().min(0),
    photoUrls: z.array(z.string().url()).optional()
  })).optional(),
  // Step 3 (Additional Fees)
  otherCharges: z.coerce.number().min(0).optional().default(0),
  // Tenant Settings (Hardcoded for now as instructed)
  gracePeriodMinutes: z.number().default(60),
  hourlyLateCharge: z.number().default(1000)
});

export type ReturnWizardFormValues = z.infer<typeof returnWizardSchema>;

const STEPS = [
  { id: 1, label: "Return Info" },
  { id: 2, label: "Damages" },
  { id: 3, label: "Settlement" },
];

export default function ReturnRentalWizardPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  
  // React 19 unwrapping params
  const { id: rentalId } = React.use(params);

  const { data: rentalData, isLoading, isError } = useQuery({
    queryKey: ["owner-rental", rentalId],
    queryFn: async () => {
      const res = await apiClient.get(`/rentals/${rentalId}`);
      return res.data.data;
    },
  });

  const methods = useForm<ReturnWizardFormValues>({
    resolver: zodResolver(returnWizardSchema),
    defaultValues: {
      actualReturnAt: new Date(),
      endOdometer: 0,
      endFuelLevel: "Full",
      requiresMaintenance: false,
      damages: [],
      otherCharges: 0,
      gracePeriodMinutes: 60,
      hourlyLateCharge: 1000
    },
    mode: "onChange"
  });

  const { handleSubmit, trigger, setValue, watch, formState: { isValid } } = methods;

  // Initialize endOdometer from pickupHandover when data loads
  useEffect(() => {
    if (rentalData?.startOdometer && methods.getValues("endOdometer") === 0) {
      setValue("endOdometer", rentalData.startOdometer, { shouldValidate: true });
    }
  }, [rentalData, setValue, methods]);

  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    if (currentStep === 1) fieldsToValidate = ["actualReturnAt", "endOdometer", "endFuelLevel"];
    if (currentStep === 2) fieldsToValidate = ["damages"];
    
    const isStepValid = await trigger(fieldsToValidate);
    
    // Additional custom validation for step 1
    if (currentStep === 1 && rentalData?.startOdometer) {
      const endOdo = methods.getValues("endOdometer");
      if (endOdo < rentalData.startOdometer) {
        toast({
          title: "Invalid Odometer",
          description: `End odometer (${endOdo}) cannot be less than start odometer (${rentalData.startOdometer}).`,
          variant: "destructive"
        });
        return;
      }
    }

    if (isStepValid) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    } else {
      toast({
        title: "Validation Error",
        description: "Please complete all required fields correctly before proceeding.",
        variant: "destructive"
      });
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const processReturnMutation = useMutation({
    mutationFn: async (data: ReturnWizardFormValues) => {
      const res = await apiClient.post(`/rentals/${rentalId}/return`, {
        actualReturnAt: data.actualReturnAt.toISOString(),
        endOdometer: data.endOdometer,
        endFuelLevel: data.endFuelLevel,
        damages: data.damages,
        otherCharges: data.otherCharges,
        requiresMaintenance: data.requiresMaintenance,
        gracePeriodMinutes: data.gracePeriodMinutes,
        hourlyLateCharge: data.hourlyLateCharge
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-rentals"] });
      queryClient.invalidateQueries({ queryKey: ["owner-rental", rentalId] });
      queryClient.invalidateQueries({ queryKey: ["owner-vehicles"] });
      
      toast({
        title: "Return Processed!",
        description: "The vehicle return and final settlement have been successfully recorded.",
      });
      router.push("/owner/rentals");
    },
    onError: (error: any) => {
      toast({
        title: "Return Failed",
        description: error.response?.data?.message || "An unexpected error occurred processing the return.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: ReturnWizardFormValues) => {
    processReturnMutation.mutate(data);
  };

  if (isLoading) {
    return <div className="p-12 text-center text-slate-500">Loading rental data...</div>;
  }

  if (isError || !rentalData) {
    return <div className="p-12 text-center text-red-500">Failed to load rental details.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center gap-4">
        <Link href="/owner/rentals">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Process Return: {rentalData.rentalNumber}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {rentalData.vehicleRegistration} • Rented by {rentalData.customerName}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        <Stepper steps={STEPS} currentStep={currentStep} className="mb-8 max-w-2xl mx-auto" />

        <FormProvider {...methods}>
          <form 
            onSubmit={handleSubmit(onSubmit)} 
            className="space-y-8"
            onKeyDown={(e) => {
              // Prevent Enter key from auto-submitting the form, unless it's on a textarea or button
              if (e.key === 'Enter' && e.target instanceof HTMLElement && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'BUTTON') {
                e.preventDefault();
              }
            }}
          >
            
            <div className={currentStep === 1 ? "block" : "hidden"}>
              <Step1ReturnDetails rentalData={rentalData} />
            </div>

            <div className={currentStep === 2 ? "block" : "hidden"}>
              <Step2DamageCheck />
            </div>

            <div className={currentStep === 3 ? "block" : "hidden"}>
              <Step3Settlement rentalData={rentalData} />
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1 || processReturnMutation.isPending}
              >
                Previous
              </Button>

              {currentStep < 3 ? (
                <Button 
                  type="button" 
                  onClick={nextStep} 
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  disabled={processReturnMutation.isPending || !isValid}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {processReturnMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Finalize Return
                    </>
                  )}
                </Button>
              )}
            </div>

          </form>
        </FormProvider>
      </div>
    </div>
  );
}
