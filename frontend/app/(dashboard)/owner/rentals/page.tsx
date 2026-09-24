"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, CalendarClock } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useMutation } from "@tanstack/react-query";

export default function RentalsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: responseData, isLoading } = useQuery({
    queryKey: ["owner-rentals"],
    queryFn: async () => {
      const res = await apiClient.get("/rentals");
      return res.data.data;
    },
  });

  const rentals = Array.isArray(responseData) ? responseData : (responseData?.data || []);

  const filteredRentals = rentals.filter((rental: any) => 
    rental.rentalNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rental.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    rental.vehicleRegistration?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const cancelRentalMutation = useMutation({
    mutationFn: async (rentalId: string) => {
      await apiClient.post(`/rentals/${rentalId}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-rentals"] });
      queryClient.invalidateQueries({ queryKey: ["owner-vehicles"] });
      toast({
        title: "Rental Cancelled",
        description: "The reservation has been cancelled and the vehicle is now available.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Action Failed",
        description: error.response?.data?.message || "Failed to cancel the rental.",
        variant: "destructive"
      });
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RESERVED':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200">Reserved</Badge>;
      case 'ON_RENT':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 border-blue-200">On Rent</Badge>;
      case 'COMPLETED':
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200">Completed</Badge>;
      case 'CANCELLED':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border-red-200">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center">
            <CalendarClock className="w-8 h-8 mr-3 text-indigo-600" />
            Rentals
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Manage reservations and active rentals.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Link href="/owner/rentals/calendar">
            <Button variant="outline" className="w-full sm:w-auto border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700">
              <CalendarClock className="w-4 h-4 mr-2" />
              View Calendar
            </Button>
          </Link>
          <RequirePermission permission="rentals.create">
            <Link href="/owner/rentals/new">
              <Button className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                New Rental
              </Button>
            </Link>
          </RequirePermission>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search by rental #, customer, or vehicle..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white dark:bg-slate-900"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <Table className="w-full whitespace-nowrap">
            <TableHeader className="bg-slate-50 dark:bg-slate-800">
              <TableRow>
                <TableHead>Rental #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
                      <p className="text-slate-500">Loading rentals...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredRentals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                    <CalendarClock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-lg font-medium text-slate-900 dark:text-white mb-1">No rentals found</p>
                    <p>Get started by creating a new rental reservation.</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRentals.map((rental: any) => (
                  <TableRow 
                    key={rental.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <TableCell className="font-medium text-indigo-600 dark:text-indigo-400">
                      {rental.rentalNumber}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="font-medium text-slate-900 dark:text-white">{rental.customerName}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-slate-600 dark:text-slate-400">
                        {rental.vehicleRegistration}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="text-slate-900 dark:text-white">
                          {rental.pickupAt ? format(new Date(rental.pickupAt), "MMM d, yyyy") : 'N/A'}
                        </p>
                        <p className="text-slate-500 text-xs">
                          to {rental.expectedReturnAt ? format(new Date(rental.expectedReturnAt), "MMM d, yyyy") : 'N/A'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(rental.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="text-sm font-medium text-slate-900 dark:text-white">
                        Rs. {rental.totalCost?.toLocaleString() || 0}
                      </div>
                      <div className="text-xs text-red-500">
                        Bal: Rs. {rental.balanceDue?.toLocaleString() || 0}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {rental.status === 'ON_RENT' ? (
                        <RequirePermission 
                          permission="rentals.process_return"
                          fallback={
                            <Button variant="ghost" size="sm" onClick={() => router.push(`/owner/rentals/${rental.id}`)}>
                              View Details
                            </Button>
                          }
                        >
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                            onClick={() => router.push(`/owner/rentals/${rental.id}/return`)}
                          >
                            Process Return
                          </Button>
                        </RequirePermission>
                      ) : rental.status === 'RESERVED' ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push(`/owner/rentals/${rental.id}`)}
                          >
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            onClick={() => {
                              if (confirm("Are you sure you want to cancel this reservation?")) {
                                cancelRentalMutation.mutate(rental.id);
                              }
                            }}
                            disabled={cancelRentalMutation.isPending}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push(`/owner/rentals/${rental.id}`)}
                        >
                          View Details
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
