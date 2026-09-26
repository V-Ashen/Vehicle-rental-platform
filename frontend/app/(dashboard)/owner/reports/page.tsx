"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { 
  BarChart3, 
  TrendingUp, 
  AlertCircle, 
  Wrench,
  Calendar as CalendarIcon
} from "lucide-react";
import { format, startOfMonth, endOfDay } from "date-fns";
import { DateRange } from "react-day-picker";
import { Button, buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "cn";

export default function ReportsDashboardPage() {
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfDay(new Date()),
  });

  const startDateStr = date?.from ? date.from.toISOString() : "";
  const endDateStr = date?.to ? endOfDay(date.to).toISOString() : "";

  const { data: reportData, isLoading, isError } = useQuery({
    queryKey: ["owner-reports-financial", startDateStr, endDateStr],
    queryFn: async () => {
      if (!startDateStr || !endDateStr) return null;
      const res = await apiClient.get("/reports/financial", {
        params: { startDate: startDateStr, endDate: endDateStr }
      });
      return res.data.data;
    },
    enabled: !!startDateStr && !!endDateStr
  });

  const totals = reportData || {
    totalRevenue: 0,
    totalExtraKm: 0,
    totalLate: 0,
    totalDamage: 0
  };

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
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-24">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : isError ? (
        <div className="p-12 text-center text-red-500 bg-red-50 dark:bg-red-900/10 rounded-xl">
          Failed to load financial data. Please try again.
        </div>
      ) : (
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
      )}
      
      {!isLoading && !isError && totals.totalRevenue === 0 && (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-900/50">
          <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No Data Available</h4>
          <p className="text-sm text-slate-500">There are no completed rentals in the selected date range.</p>
        </div>
      )}
    </div>
  );
}
