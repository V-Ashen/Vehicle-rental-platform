import { cn } from "cn";
import { Check } from "lucide-react";

interface Step {
  id: number;
  label: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn("w-full py-4", className)}>
      <div className="flex items-center justify-between w-full relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[2px] bg-slate-200 dark:bg-slate-800 z-0" />
        
        {steps.map((step, index) => {
          const isCompleted = step.id < currentStep;
          const isCurrent = step.id === currentStep;
          const isUpcoming = step.id > currentStep;

          return (
            <div key={step.id} className="relative z-10 flex flex-col items-center">
              <div 
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 text-sm font-semibold transition-colors duration-200",
                  isCompleted ? "bg-indigo-600 border-indigo-600 text-white" : "",
                  isCurrent ? "bg-white dark:bg-slate-900 border-indigo-600 text-indigo-600" : "",
                  isUpcoming ? "bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-400" : ""
                )}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : step.id}
              </div>
              <div className="mt-2 text-xs font-medium text-center">
                <span className={cn(
                  isCurrent ? "text-indigo-600 dark:text-indigo-400 font-bold" : "text-slate-500",
                  isUpcoming ? "text-slate-400" : ""
                )}>
                  {step.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
