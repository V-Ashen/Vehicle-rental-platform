"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { 
  BarChart3, 
  TrendingUp, 
  AlertCircle, 
  Wrench,
  Calendar as CalendarIcon,
  Download,
  Filter
} from "lucide-react";
import { format, startOfMonth, endOfDay } from "date-fns";
import { DateRange } from "react-day-picker";
import { Button, buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "cn";
import { useToast } from "@/hooks/use-toast";
import { PaginationControl } from '@/components/ui/pagination-control';

export default function ReportsDashboardPage() {
  const { toast } = useToast();
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfDay(new Date()),
  });

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [vehicleFilter, setVehicleFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const startDateStr = date?.from ? date.from.toISOString() : "";
  const endDateStr = date?.to ? endOfDay(date.to).toISOString() : "";

  // Query for Financial Totals
  const { data: reportData, isLoading: isLoadingTotals, isError: isTotalsError } = useQuery({
    queryKey: ["owner-reports-financial", startDateStr, endDateStr],
    queryFn: async () => {
      if (!startDateStr || !endDateStr) return null;
      const res = await apiClient.get("/reports/financial", {
        params: { startDate: startDateStr, endDate: endDateStr }
      });
      return res.data.data;
    },
    enabled: !!startDateStr && !!endDateStr,
    retry: false
  });

  // Query for Detailed Records
  const { data: detailedData, isLoading: isLoadingDetailed } = useQuery({
    queryKey: ["owner-reports-detailed", startDateStr, endDateStr, statusFilter, branchFilter, vehicleFilter],
    queryFn: async () => {
      const params: any = { startDate: startDateStr, endDate: endDateStr };
      if (statusFilter !== "all") params.status = statusFilter;
      if (branchFilter !== "all") params.branchId = branchFilter;
      if (vehicleFilter !== "all") params.vehicleId = vehicleFilter;

      const res = await apiClient.get("/reports/detailed", { params });
      return res.data.data;
    },
    enabled: !!startDateStr && !!endDateStr,
    retry: false
  });

  const handleExportCSV = async () => {
    try {
      const params: any = { startDate: startDateStr, endDate: endDateStr };
      if (statusFilter !== "all") params.status = statusFilter;
      if (branchFilter !== "all") params.branchId = branchFilter;
      if (vehicleFilter !== "all") params.vehicleId = vehicleFilter;

      const res = await apiClient.get("/reports/export", { 
        params, 
        responseType: 'blob' 
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `financial-report-${format(new Date(), "yyyy-MM-dd")}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast({
        title: "Export Successful",
        description: "Your report has been downloaded as a CSV file.",
      });
    } catch (error: any) {
      toast({
        title: "Export Failed",
        description: "You may not have access to advanced reporting features.",
        variant: "destructive"
      });
    }
  };

  const totals = reportData || {
    totalRevenue: 0,
    totalExtraKm: 0,
    totalLate: 0,
    totalDamage: 0
  };

  const isForbiddenError = isTotalsError && !reportData;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center">
            <BarChart3 className="w-6 h-6 mr-2 text-indigo-600" />
            Financial Reports
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Overview of revenue and penalty charges aggregated from returned vehicles.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger
                type="button"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "w-[280px] justify-start text-left font-normal bg-white dark:bg-slate-900",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd, y")} -{" "}
                      {format(date.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
              </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          <Button onClick={handleExportCSV} variant="default" className="bg-emerald-600 hover:bg-emerald-700">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {isForbiddenError ? (
        <div className="p-12 text-center border-2 border-amber-200 bg-amber-50 dark:bg-amber-900/10 dark:border-amber-900 rounded-xl">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Upgrade Required</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-md mx-auto">
            Advanced Financial Reports and CSV exports are only available on higher-tier packages. Please upgrade your subscription to access this feature.
          </p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingUp className="w-24 h-24 text-emerald-600" />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">
                  Rs. {totals.totalRevenue.toLocaleString()}
                </div>
                <p className="text-xs text-emerald-600 mt-1 font-medium">Includes base + all extra fees</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Wrench className="w-24 h-24 text-red-600" />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Damage Assessments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">
                  Rs. {totals.totalDamage.toLocaleString()}
                </div>
                <p className="text-xs text-red-600 mt-1 font-medium">Recovered damage costs</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <AlertCircle className="w-24 h-24 text-amber-600" />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Late Fees</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">
                  Rs. {totals.totalLate.toLocaleString()}
                </div>
                <p className="text-xs text-amber-600 mt-1 font-medium">Penalties from late returns</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <BarChart3 className="w-24 h-24 text-blue-600" />
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400">Extra KM Charges</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">
                  Rs. {totals.totalExtraKm.toLocaleString()}
                </div>
                <p className="text-xs text-blue-600 mt-1 font-medium">Revenue from over-limit driving</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters & Detailed Table */}
          <div className="mt-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-wrap gap-4 items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center">
                <Filter className="w-5 h-5 mr-2 text-indigo-600" />
                Detailed Report
              </h2>
              <div className="flex flex-wrap gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px] bg-white dark:bg-slate-950">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                {/* We could add dynamic branch/vehicle selectors here, but keeping it simple for now */}
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                  <TableRow>
                    <TableHead>Rental ID</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Start Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingDetailed ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
                      </TableCell>
                    </TableRow>
                  ) : detailedData?.length > 0 ? (
                    detailedData.slice((page - 1) * itemsPerPage, page * itemsPerPage).map((row: any) => (
                      <TableRow key={row.id}>
                        <TableCell className="font-medium text-indigo-600 dark:text-indigo-400">{row.id}</TableCell>
                        <TableCell>{row.vehicleName}</TableCell>
                        <TableCell>{row.customerName}</TableCell>
                        <TableCell>{row.startDate}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            row.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                            row.status === 'ACTIVE' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''
                          }>
                            {row.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold">Rs. {row.finalTotal?.toLocaleString()}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                        No detailed records found for the selected filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              
              {detailedData && detailedData.length > 0 && (
                <PaginationControl 
                  currentPage={page}
                  totalPages={Math.ceil(detailedData.length / itemsPerPage)}
                  onPageChange={setPage}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
