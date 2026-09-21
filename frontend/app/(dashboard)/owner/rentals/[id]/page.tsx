"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Receipt, CalendarClock, Car, User, Settings, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default function RentalDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: rentalId } = React.use(params);

  const { data: rental, isLoading, isError } = useQuery({
    queryKey: ["owner-rental", rentalId],
    queryFn: async () => {
      const res = await apiClient.get(`/rentals/${rentalId}`);
      return res.data.data;
    },
  });

  if (isLoading) {
    return <div className="p-12 text-center text-slate-500">Loading rental details...</div>;
  }

  if (isError || !rental) {
    return <div className="p-12 text-center text-red-500">Failed to load rental details.</div>;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RESERVED': return <Badge className="bg-yellow-100 text-yellow-800">Reserved</Badge>;
      case 'ON_RENT': return <Badge className="bg-blue-100 text-blue-800">On Rent</Badge>;
      case 'COMPLETED': return <Badge className="bg-emerald-100 text-emerald-800">Completed</Badge>;
      case 'CANCELLED': return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/owner/rentals">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {rental.rentalNumber}
              </h1>
              {getStatusBadge(rental.status)}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Created on {format(new Date(rental.createdAt), "MMM d, yyyy h:mm a")}
            </p>
          </div>
        </div>
        
        {rental.status === 'ON_RENT' && (
          <Link href={`/owner/rentals/${rental.id}/return`}>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Process Return
            </Button>
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Reservation Details */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center">
              <CalendarClock className="w-5 h-5 mr-2 text-indigo-600" />
              Reservation Timeline
            </h2>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Pickup Date</p>
                <p className="text-base font-semibold text-slate-900 dark:text-white">
                  {rental.pickupAt ? format(new Date(rental.pickupAt), "MMM d, yyyy h:mm a") : 'N/A'}
                </p>
                {rental.pickupHandover && (
                  <p className="text-sm text-slate-500 mt-2 flex items-center">
                    <Settings className="w-4 h-4 mr-1" />
                    Odometer: {rental.pickupHandover.odometer} km
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Expected Return</p>
                <p className="text-base font-semibold text-slate-900 dark:text-white">
                  {rental.expectedReturnAt ? format(new Date(rental.expectedReturnAt), "MMM d, yyyy h:mm a") : 'N/A'}
                </p>
                <p className="text-sm text-slate-500 mt-2 flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {rental.rentalDays} Days Booked
                </p>
              </div>
            </div>
            
            {rental.actualReturnAt && (
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                <p className="text-sm font-medium text-slate-500 mb-1">Actual Return</p>
                <p className="text-base font-semibold text-slate-900 dark:text-white">
                  {format(new Date(rental.actualReturnAt), "MMM d, yyyy h:mm a")}
                </p>
              </div>
            )}
          </div>

          {/* Entities */}
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-indigo-600" />
                Customer
              </h2>
              <p className="text-base font-medium text-slate-900 dark:text-white">
                {rental.customerName}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
                <Car className="w-5 h-5 mr-2 text-indigo-600" />
                Vehicle
              </h2>
              <p className="text-base font-medium text-slate-900 dark:text-white">
                {rental.vehicleMakeModel}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {rental.vehicleRegistration}
              </p>
            </div>
          </div>

        </div>

        {/* Right Column: Financials */}
        <div className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6 flex items-center">
              <Receipt className="w-5 h-5 mr-2 text-slate-400" />
              Financial Summary
            </h2>
            
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                <span>Base Rental ({rental.rentalDays} days)</span>
                <span className="font-medium text-slate-900 dark:text-white">Rs. {(rental.baseRentalAmount || 0).toLocaleString()}</span>
              </div>
              
              {rental.extraKmCharge > 0 && (
                <div className="flex justify-between items-center text-orange-600 dark:text-orange-400">
                  <span>Extra KM Charge</span>
                  <span className="font-medium">Rs. {rental.extraKmCharge.toLocaleString()}</span>
                </div>
              )}
              
              {rental.lateCharge > 0 && (
                <div className="flex justify-between items-center text-red-600 dark:text-red-400">
                  <span>Late Return Fee</span>
                  <span className="font-medium">Rs. {rental.lateCharge.toLocaleString()}</span>
                </div>
              )}

              {rental.damageCharges > 0 && (
                <div className="flex justify-between items-center text-red-600 dark:text-red-400">
                  <span>Damage Assessments</span>
                  <span className="font-medium">Rs. {rental.damageCharges.toLocaleString()}</span>
                </div>
              )}

              {rental.otherCharges > 0 && (
                <div className="flex justify-between items-center text-blue-600 dark:text-blue-400">
                  <span>Other Charges</span>
                  <span className="font-medium">Rs. {rental.otherCharges.toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 dark:border-slate-800 mt-6 pt-6">
              <div className="flex justify-between items-center text-lg font-bold text-slate-900 dark:text-white">
                <span>Total Amount</span>
                <span>Rs. {(rental.totalAmount || 0).toLocaleString()}</span>
              </div>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}
