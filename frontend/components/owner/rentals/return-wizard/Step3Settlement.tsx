import React from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { ReturnWizardFormValues } from "@/app/(dashboard)/owner/rentals/[id]/return/page";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Calculator, Receipt, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface Step3SettlementProps {
  rentalData: any;
}

export default function Step3Settlement({ rentalData }: Step3SettlementProps) {
  const { control } = useFormContext<ReturnWizardFormValues>();

  const formValues = useWatch({ control });

  // LIVE MATH REPLICATION (Mirrors Backend)
  const startOdometer = rentalData.pickupHandover?.odometer || 0;
  const endOdometer = formValues.endOdometer || 0;
  const usedKm = Math.max(0, endOdometer - startOdometer);
  const includedKm = rentalData.includedKmSnapshot || 0;
  
  // A. Extra KM
  const extraKm = Math.max(0, usedKm - includedKm);
  const extraKmRate = rentalData.extraKmRateSnapshot || 0;
  const extraKmCharge = extraKm * extraKmRate;

  // B. Late Fees
  const actualReturnAt = formValues.actualReturnAt as Date;
  const expectedReturnAt = new Date(rentalData.expectedReturnAt);
  const gracePeriodMinutes = formValues.gracePeriodMinutes || 60;
  const hourlyLateCharge = formValues.hourlyLateCharge || 1000;

  let lateMinutes = 0;
  let billableLateMinutes = 0;
  let lateCharge = 0;
  let lateHours = 0;

  if (actualReturnAt && expectedReturnAt) {
    const diffMs = actualReturnAt.getTime() - expectedReturnAt.getTime();
    lateMinutes = diffMs > 0 ? diffMs / 60000 : 0;
    billableLateMinutes = Math.max(0, lateMinutes - gracePeriodMinutes);
    if (billableLateMinutes > 0) {
      lateHours = Math.ceil(billableLateMinutes / 60);
      lateCharge = lateHours * hourlyLateCharge;
    }
  }

  // C. Damages
  const damages = formValues.damages || [];
  const damageTotal = damages.reduce((sum, d) => sum + (Number(d.estimatedCost) || 0), 0);

  // D. Other Charges
  const extraOtherCharges = Number(formValues.otherCharges || 0);

  // Base
  const baseRentalAmount = rentalData.baseRentalAmount || 0;

  // FINAL TOTAL
  const finalTotal = baseRentalAmount + extraKmCharge + lateCharge + damageTotal + extraOtherCharges;
  const balanceDue = finalTotal - (rentalData.totalAmount - rentalData.balanceDue); // Assumes previously paid = total - balance

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-slate-900 dark:text-white flex items-center">
          <Calculator className="w-5 h-5 mr-2 text-indigo-600" />
          Final Settlement Preview
        </h3>
        <p className="text-sm text-slate-500">
          Review the mathematically calculated final charges based on the return data.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* INVOICE PREVIEW */}
        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4 mb-4">
            <div className="flex items-center text-slate-900 dark:text-white font-semibold">
              <Receipt className="w-5 h-5 mr-2 text-slate-400" />
              Invoice Breakdown
            </div>
            <div className="text-sm text-slate-500 text-right">
              <div>{rentalData.rentalNumber}</div>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-1 text-slate-600 dark:text-slate-400">
              <span>Base Rental ({rentalData.rentalDays} days)</span>
              <span className="font-medium text-slate-900 dark:text-white">Rs. {baseRentalAmount.toLocaleString()}</span>
            </div>
            
            {extraKmCharge > 0 && (
              <div className="flex justify-between items-center py-1 text-orange-600 dark:text-orange-400">
                <span>Extra KM Charge ({extraKm} km @ Rs.{extraKmRate}/km)</span>
                <span className="font-medium">Rs. {extraKmCharge.toLocaleString()}</span>
              </div>
            )}
            
            {lateCharge > 0 && (
              <div className="flex justify-between items-center py-1 text-red-600 dark:text-red-400">
                <span>Late Return Fee ({lateHours} hours billable)</span>
                <span className="font-medium">Rs. {lateCharge.toLocaleString()}</span>
              </div>
            )}

            {damageTotal > 0 && (
              <div className="flex justify-between items-center py-1 text-red-600 dark:text-red-400">
                <span>Damage Assessments ({damages.length} items)</span>
                <span className="font-medium">Rs. {damageTotal.toLocaleString()}</span>
              </div>
            )}

            {extraOtherCharges > 0 && (
              <div className="flex justify-between items-center py-1 text-blue-600 dark:text-blue-400">
                <span>Other Ad-hoc Charges</span>
                <span className="font-medium">Rs. {extraOtherCharges.toLocaleString()}</span>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 mt-4 pt-4">
            <div className="flex justify-between items-center text-lg font-bold text-slate-900 dark:text-white">
              <span>Final Total</span>
              <span>Rs. {finalTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* EXTRA INPUTS & WARNINGS */}
        <div className="space-y-6">
          <FormField
            control={control}
            name="otherCharges"
            render={({ field }) => (
              <FormItem className="bg-white dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <FormLabel className="text-base">Other Charges (Rs.)</FormLabel>
                <div className="text-sm text-slate-500 mb-3">
                  Add any other custom fees such as extreme cleaning, missing accessories, or fuel penalties.
                </div>
                <FormControl>
                  <Input type="number" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {billableLateMinutes > 0 && (
            <div className="flex items-start p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 mt-0.5 mr-3 shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-amber-800 dark:text-amber-400">Late Return Detected</h4>
                <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                  Vehicle is {Math.floor(lateMinutes)} minutes late. (Grace period: {gracePeriodMinutes} mins).
                  Charging Rs. {hourlyLateCharge.toLocaleString()} per hour for {lateHours} billable hours.
                </p>
              </div>
            </div>
          )}

          {extraKm > 0 && (
            <div className="flex items-start p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl">
              <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 mt-0.5 mr-3 shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-amber-800 dark:text-amber-400">Extra Kilometers</h4>
                <p className="text-xs text-amber-700 dark:text-amber-500 mt-1">
                  Customer drove {usedKm} km, which exceeds the {includedKm} km limit by {extraKm} km.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
