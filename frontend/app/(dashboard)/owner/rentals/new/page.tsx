"use client";

import { useState } from "react";
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
import { useMutation, useQueryClient } from "@tanstack/react-query";

import Step1Customer from "@/components/owner/rentals/wizard/Step1Customer";
import Step2VehicleDates from "@/components/owner/rentals/wizard/Step2VehicleDates";
import Step3Handover from "@/components/owner/rentals/wizard/Step3Handover";

const rentalWizardSchema = z.object({
  // Step 1
  customerId: z.string().min(1, "Please select a customer"),
  // Step 2
  vehicleId: z.string().min(1, "Please select a vehicle"),
  pickupAt: z.date({ required_error: "Pickup date/time is required" }),
  expectedReturnAt: z.date({ required_error: "Expected return date/time is required" }),
  // Step 3
  odometer: z.coerce.number().min(0, "Odometer must be a valid number"),
  fuelLevel: z.string().min(1, "Please provide the fuel level"),
  conditionStatus: z.enum(['GOOD', 'DAMAGED']),
  photoUrls: z.array(z.string().url()).optional(),
  notes: z.string().optional()
});

export type RentalWizardFormValues = z.infer<typeof rentalWizardSchema>;

const STEPS = [
  { id: 1, label: "Customer" },
  { id: 2, label: "Vehicle & Dates" },
  { id: 3, label: "Handover" },
];

export default function NewRentalWizardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);

  const methods = useForm<RentalWizardFormValues>({
    resolver: zodResolver(rentalWizardSchema),
    defaultValues: {
      customerId: "",
      vehicleId: "",
      fuelLevel: "Full",
      conditionStatus: "GOOD",
      photoUrls: [],
      notes: ""
    },
    mode: "onChange"
  });

  const { handleSubmit, trigger, watch, formState: { isValid } } = methods;

  const nextStep = async () => {
    let fieldsToValidate: any[] = [];
    if (currentStep === 1) fieldsToValidate = ["customerId"];
    if (currentStep === 2) fieldsToValidate = ["vehicleId", "pickupAt", "expectedReturnAt"];
    
    const isStepValid = await trigger(fieldsToValidate);
    
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

  const createRentalMutation = useMutation({
    mutationFn: async (data: RentalWizardFormValues) => {
      // 1. Create Rental Reservation
      const rentalRes = await apiClient.post("/rentals", {
        customerId: data.customerId,
        vehicleId: data.vehicleId,
        pickupAt: data.pickupAt.toISOString(),
        expectedReturnAt: data.expectedReturnAt.toISOString()
      });

      const rentalId = rentalRes.data.data.id;

      // 2. Process physical handover
      await apiClient.post(`/rentals/${rentalId}/handover`, {
        odometer: data.odometer,
        fuelLevel: data.fuelLevel,
        conditionStatus: data.conditionStatus,
        photoUrls: data.photoUrls,
        notes: data.notes
      });

      return rentalId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-rentals"] });
      queryClient.invalidateQueries({ queryKey: ["owner-vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["owner-dashboard"] });
      
      toast({
        title: "Rental Started Successfully!",
        description: "The vehicle has been handed over and is now ON RENT.",
      });
      router.push("/owner/rentals");
    },
    onError: (error: any) => {
      toast({
        title: "Rental Creation Failed",
        description: error.response?.data?.message || "An unexpected error occurred during creation.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: RentalWizardFormValues) => {
    createRentalMutation.mutate(data);
  };

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
            Quick Rental Wizard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Book a vehicle and process the physical handover in one fluid flow.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        <Stepper steps={STEPS} currentStep={currentStep} className="mb-8 max-w-2xl mx-auto" />

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            
            <div className={currentStep === 1 ? "block" : "hidden"}>
              <Step1Customer />
            </div>

            <div className={currentStep === 2 ? "block" : "hidden"}>
              <Step2VehicleDates />
            </div>

            <div className={currentStep === 3 ? "block" : "hidden"}>
              <Step3Handover />
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1 || createRentalMutation.isPending}
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
                  disabled={createRentalMutation.isPending || !isValid}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {createRentalMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Start Rental
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
