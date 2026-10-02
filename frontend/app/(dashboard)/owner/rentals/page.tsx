"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Plus, Search, CalendarClock, Calendar, ChevronRight, ArrowUpRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { RequirePermission } from "@/components/auth/RequirePermission";
import { useToast } from "@/hooks/use-toast";
import { PaginationControl } from "@/components/ui/pagination-control";
import { cn } from "cn";

function StatusPill({ status }: { status: string }) {
  const config: Record<string, { label: string; cls: string }> = {
    RESERVED:  { label: "Reserved",  cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/50" },
    ON_RENT:   { label: "On Rent",   cls: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/50" },
    COMPLETED: { label: "Completed", cls: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50" },
    CANCELLED: { label: "Cancelled", cls: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800/50" },
  };
  const c = config[status] ?? { label: status, cls: "bg-slate-100 text-slate-600 border-slate-200" };
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border", c.cls)}>
      {c.label}
    </span>
  );
}

export default function RentalsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const { data: responseData, isLoading } = useQuery({
    queryKey: ["owner-rentals"],
    queryFn: async () => {
      const res = await apiClient.get("/rentals");
      return res.data.data;
    },
  });

  const rentals = Array.isArray(responseData) ? responseData : (responseData?.data || []);

  const filteredRentals = rentals.filter((r: any) =>
    r.rentalNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.vehicleRegistration?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => apiClient.post(`/rentals/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-rentals"] });
      queryClient.invalidateQueries({ queryKey: ["owner-vehicles"] });
      toast({ title: "Rental Cancelled", description: "The vehicle is now available." });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.response?.data?.message || "Error", variant: "destructive" }),
  });

  const paged = filteredRentals.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  // Summary counts
  const onRentCount = rentals.filter((r: any) => r.status === "ON_RENT").length;
  const reservedCount = rentals.filter((r: any) => r.status === "RESERVED").length;
  const overdueCount = rentals.filter((r: any) => {
    if (r.status !== "ON_RENT") return false;
    const exp = r.expectedReturnAt ? new Date(r.expectedReturnAt) : null;
    return exp && exp < new Date();
  }).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Rentals</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {rentals.length} total · {onRentCount} on rent · {reservedCount} reserved
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Link href="/owner/rentals/calendar">
            <Button variant="outline" className="gap-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <Calendar className="w-4 h-4" />
              Calendar
            </Button>
          </Link>
          <RequirePermission permission="rentals.create">
            <Link href="/owner/rentals/new">
              <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4" />
                New Rental
              </Button>
            </Link>
          </RequirePermission>
        </div>
      </div>


      {/* Table card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Search bar */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search rental, customer, vehicle…"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="pl-9 h-9 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 transition-colors"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 dark:bg-slate-800/40 hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rental #</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Customer</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vehicle</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pickup → Return</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Amount</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <CalendarClock className="w-7 h-7 text-slate-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">No rentals found</p>
                        <p className="text-sm text-slate-500 mt-0.5">
                          {searchQuery ? "Try a different search" : "Create your first rental to get started"}
                        </p>
                      </div>
                      {!searchQuery && (
                        <Link href="/owner/rentals/new">
                          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                            <Plus className="w-4 h-4" /> New Rental
                          </Button>
                        </Link>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((rental: any) => (
                  <TableRow
                    key={rental.id}
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors border-slate-100 dark:border-slate-800"
                    onClick={() => router.push(`/owner/rentals/${rental.id}`)}
                  >
                    <TableCell>
                      <span className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-lg">
                        {rental.rentalNumber}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {(rental.customerName || "?").charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-slate-900 dark:text-white">{rental.customerName || "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-600 dark:text-slate-300">{rental.vehicleRegistration || "—"}</span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="text-slate-900 dark:text-white font-medium">
                          {rental.pickupAt ? format(new Date(rental.pickupAt), "MMM d, yyyy") : "—"}
                        </p>
                        <p className="text-xs text-slate-500">
                          → {rental.expectedReturnAt ? format(new Date(rental.expectedReturnAt), "MMM d, yyyy") : "—"}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusPill status={rental.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        Rs. {(rental.totalAmount || 0).toLocaleString()}
                      </p>
                      {(rental.balanceDue ?? 0) > 0 && (
                        <p className="text-xs text-red-500">Bal: Rs. {rental.balanceDue.toLocaleString()}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      {rental.status === "ON_RENT" ? (
                        <Button
                          size="sm"
                          className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800/50 shadow-none gap-1"
                          onClick={() => router.push(`/owner/rentals/${rental.id}/return`)}
                        >
                          Return <ArrowUpRight className="w-3 h-3" />
                        </Button>
                      ) : rental.status === "RESERVED" ? (
                        <div className="flex justify-end gap-1.5">
                          <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-400 h-8 px-2" onClick={() => router.push(`/owner/rentals/${rental.id}`)}>View</Button>
                          <Button
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 border border-red-200 dark:border-red-800/50 bg-transparent shadow-none h-8 px-2 text-xs"
                            disabled={cancelMutation.isPending}
                            onClick={() => toast({
                              title: "Confirm Cancellation",
                              description: "Cancel this reservation?",
                              action: { label: "Cancel Rental", onClick: () => cancelMutation.mutate(rental.id) }
                            })}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="sm" className="text-slate-500 h-8 px-2" onClick={() => router.push(`/owner/rentals/${rental.id}`)}>View</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {filteredRentals.length > itemsPerPage && (
          <PaginationControl currentPage={page} totalPages={Math.ceil(filteredRentals.length / itemsPerPage)} onPageChange={setPage} />
        )}
      </div>
    </div>
  );
}
