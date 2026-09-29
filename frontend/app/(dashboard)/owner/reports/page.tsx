"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import {
  BarChart3, TrendingUp, AlertCircle, Wrench, Calendar as CalendarIcon, Download, Filter
} from "lucide-react";
import { format, startOfMonth, endOfDay } from "date-fns";
import { DateRange } from "react-day-picker";
import { Button, buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "cn";
import { useToast } from "@/hooks/use-toast";
import { PaginationControl } from "@/components/ui/pagination-control";

function StatCard({ label, value, sublabel, icon: Icon, iconBg, iconColor, accent }: {
  label: string; value: string; sublabel: string; icon: any; iconBg: string; iconColor: string; accent: string;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6")}>
      <div className={cn("absolute -right-3 -top-3 w-16 h-16 rounded-full opacity-10", iconBg)} />
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4", iconBg)}>
        <Icon className={cn("w-5 h-5", iconColor)} />
      </div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
      <p className={cn("text-xs font-medium mt-1.5", accent)}>{sublabel}</p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const config: Record<string, string> = {
    COMPLETED: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50",
    ON_RENT: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/50",
    CANCELLED: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800/50",
  };
  return (
    <span className={cn("inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border", config[status] || "bg-slate-100 text-slate-600 border-slate-200")}>
      {status}
    </span>
  );
}

export default function ReportsDashboardPage() {
  const { toast } = useToast();
  const [date, setDate] = useState<DateRange | undefined>({ from: startOfMonth(new Date()), to: endOfDay(new Date()) });
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const startDateStr = date?.from ? date.from.toISOString() : "";
  const endDateStr = date?.to ? endOfDay(date.to).toISOString() : "";

  const { data: reportData, isLoading: isLoadingTotals, isError: isTotalsError } = useQuery({
    queryKey: ["owner-reports-financial", startDateStr, endDateStr],
    queryFn: async () => {
      const res = await apiClient.get("/reports/financial", { params: { startDate: startDateStr, endDate: endDateStr } });
      return res.data.data;
    },
    enabled: !!startDateStr && !!endDateStr,
    retry: false,
  });

  const { data: detailedData, isLoading: isLoadingDetailed } = useQuery({
    queryKey: ["owner-reports-detailed", startDateStr, endDateStr, statusFilter],
    queryFn: async () => {
      const params: any = { startDate: startDateStr, endDate: endDateStr };
      if (statusFilter !== "all") params.status = statusFilter;
      const res = await apiClient.get("/reports/detailed", { params });
      return res.data.data;
    },
    enabled: !!startDateStr && !!endDateStr,
    retry: false,
  });

  const handleExportCSV = async () => {
    try {
      const params: any = { startDate: startDateStr, endDate: endDateStr };
      if (statusFilter !== "all") params.status = statusFilter;
      const res = await apiClient.get("/reports/export", { params, responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `report-${format(new Date(), "yyyy-MM-dd")}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast({ title: "Export Successful", description: "Report downloaded." });
    } catch {
      toast({ title: "Export Failed", description: "You may not have access to advanced reporting.", variant: "destructive" });
    }
  };

  const totals = reportData || { totalRevenue: 0, totalExtraKm: 0, totalLate: 0, totalDamage: 0 };
  const isForbiddenError = isTotalsError && !reportData;
  const paged = (detailedData || []).slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Financial Reports</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Revenue and penalty summary for completed rentals.</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Popover>
            <PopoverTrigger
              type="button"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "min-w-[220px] justify-start text-left font-normal bg-white dark:bg-slate-900 rounded-xl h-10",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-slate-400" />
              {date?.from ? (
                date.to ? <>{format(date.from, "MMM d, y")} — {format(date.to, "MMM d, y")}</> : format(date.from, "MMM d, y")
              ) : <span>Pick date range</span>}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} />
            </PopoverContent>
          </Popover>
          <Button onClick={handleExportCSV} className="bg-emerald-600 hover:bg-emerald-700 gap-2 h-10">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>
      </div>

      {isForbiddenError ? (
        <div className="flex flex-col items-center py-20 gap-4 bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-800/50">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-amber-500" />
          </div>
          <div className="text-center max-w-md">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Upgrade Required</h3>
            <p className="text-sm text-slate-500 mt-2">
              Advanced Financial Reports and CSV exports are available on higher-tier plans.
              Please upgrade your subscription to access this feature.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard label="Total Revenue" value={`Rs. ${totals.totalRevenue.toLocaleString()}`} sublabel="Base + all extra fees" icon={TrendingUp} iconBg="bg-emerald-100 dark:bg-emerald-900/30" iconColor="text-emerald-600 dark:text-emerald-400" accent="text-emerald-600 dark:text-emerald-400" />
            <StatCard label="Damage Charges" value={`Rs. ${totals.totalDamage.toLocaleString()}`} sublabel="Recovered damage costs" icon={Wrench} iconBg="bg-red-100 dark:bg-red-900/30" iconColor="text-red-600 dark:text-red-400" accent="text-red-600 dark:text-red-400" />
            <StatCard label="Late Return Fees" value={`Rs. ${totals.totalLate.toLocaleString()}`} sublabel="Penalties from late returns" icon={AlertCircle} iconBg="bg-amber-100 dark:bg-amber-900/30" iconColor="text-amber-600 dark:text-amber-400" accent="text-amber-600 dark:text-amber-400" />
            <StatCard label="Extra KM Charges" value={`Rs. ${totals.totalExtraKm.toLocaleString()}`} sublabel="Revenue from over-limit driving" icon={BarChart3} iconBg="bg-indigo-100 dark:bg-indigo-900/30" iconColor="text-indigo-600 dark:text-indigo-400" accent="text-indigo-600 dark:text-indigo-400" />
          </div>

          {/* Detailed table */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap gap-4 items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Filter className="w-4 h-4 text-indigo-500" />
                Detailed Records
              </h2>
              <Select value={statusFilter} onValueChange={val => { setStatusFilter(val as string); setPage(1); }}>
                <SelectTrigger className="w-[160px] h-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="ON_RENT">On Rent</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 dark:bg-slate-800/40 hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                    {["Rental ID", "Vehicle", "Customer", "Date", "Status", "Total"].map(h => (
                      <TableHead key={h} className={cn("text-xs font-semibold text-slate-500 uppercase tracking-wider", h === "Total" && "text-right")}>{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingDetailed ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <TableCell key={j}><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : paged.length > 0 ? (
                    paged.map((row: any) => (
                      <TableRow key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors border-slate-100 dark:border-slate-800">
                        <TableCell>
                          <span className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-lg">{row.id}</span>
                        </TableCell>
                        <TableCell><span className="text-sm text-slate-700 dark:text-slate-300">{row.vehicleName}</span></TableCell>
                        <TableCell><span className="text-sm font-medium text-slate-900 dark:text-white">{row.customerName}</span></TableCell>
                        <TableCell><span className="text-sm text-slate-500">{row.startDate}</span></TableCell>
                        <TableCell><StatusPill status={row.status} /></TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">Rs. {row.finalTotal?.toLocaleString()}</span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                        No records found for the selected period and filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {(detailedData || []).length > itemsPerPage && (
              <PaginationControl currentPage={page} totalPages={Math.ceil((detailedData || []).length / itemsPerPage)} onPageChange={setPage} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
