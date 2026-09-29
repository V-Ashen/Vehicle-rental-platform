"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { format } from "date-fns";
import {
  Car,
  Key,
  Wrench,
  AlertTriangle,
  CalendarCheck,
  CalendarX,
  TrendingUp,
  TrendingDown,
  Users,
  Banknote,
  Activity,
  CircleCheckBig,
  Clock,
  ArrowRight,
  BookOpen,
} from "lucide-react";

function MetricCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  subValue,
  subLabel,
  trend,
  href,
}: {
  label: string;
  value: string | number;
  icon: any;
  iconBg: string;
  iconColor: string;
  subValue?: string | number;
  subLabel?: string;
  trend?: { value: number | null; label: string };
  href?: string;
}) {
  const card = (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:shadow-md transition-all duration-200 group relative overflow-hidden">
      {/* Decorative bg circle */}
      <div className={`absolute -right-4 -top-4 w-20 h-20 rounded-full opacity-10 ${iconBg}`} />
      
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${iconBg}`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
            trend.value === null ? "bg-slate-100 text-slate-500 dark:bg-slate-800" :
            trend.value >= 0
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
              : "bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400"
          }`}>
            {trend.value !== null ? (
              trend.value >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />
            ) : null}
            {trend.value !== null ? `${trend.value > 0 ? "+" : ""}${trend.value}%` : trend.label}
          </div>
        )}
      </div>

      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1 font-medium">{label}</p>
        <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
        {subValue !== undefined && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {subValue} {subLabel}
          </p>
        )}
      </div>

      {href && (
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center text-xs text-indigo-600 dark:text-indigo-400 font-medium group-hover:gap-2 gap-1 transition-all">
          View details <ArrowRight className="w-3 h-3" />
        </div>
      )}
    </div>
  );

  if (href) return <Link href={href}>{card}</Link>;
  return card;
}

function FleetBar({ vehicles }: { vehicles: any }) {
  if (!vehicles || vehicles.total === 0) return null;
  const available = Math.round((vehicles.available / vehicles.total) * 100);
  const onRent = Math.round((vehicles.onRent / vehicles.total) * 100);
  const reserved = Math.round((vehicles.reserved / vehicles.total) * 100);
  const maintenance = Math.round((vehicles.inMaintenance / vehicles.total) * 100);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Fleet Overview</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {vehicles.utilizationRate}% utilization rate
          </p>
        </div>
        <Link href="/owner/vehicles">
          <span className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center gap-1">
            Manage fleet <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>
      </div>

      {/* Progress bar */}
      <div className="flex h-4 rounded-full overflow-hidden gap-0.5 mb-4">
        {available > 0 && (
          <div className="bg-emerald-500 dark:bg-emerald-600 rounded-l-full" style={{ width: `${available}%` }} title={`Available: ${vehicles.available}`} />
        )}
        {onRent > 0 && (
          <div className="bg-indigo-500" style={{ width: `${onRent}%` }} title={`On Rent: ${vehicles.onRent}`} />
        )}
        {reserved > 0 && (
          <div className="bg-yellow-400" style={{ width: `${reserved}%` }} title={`Reserved: ${vehicles.reserved}`} />
        )}
        {maintenance > 0 && (
          <div className="bg-orange-400 rounded-r-full" style={{ width: `${maintenance}%` }} title={`Maintenance: ${vehicles.inMaintenance}`} />
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Available", count: vehicles.available, color: "bg-emerald-500" },
          { label: "On Rent", count: vehicles.onRent, color: "bg-indigo-500" },
          { label: "Reserved", count: vehicles.reserved, color: "bg-yellow-400" },
          { label: "Maintenance", count: vehicles.inMaintenance, color: "bg-orange-400" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${item.color} shrink-0`} />
            <div>
              <p className="text-xl font-bold text-slate-900 dark:text-white">{item.count}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{item.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ON_RENT: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300",
    RESERVED: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300",
    COMPLETED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
    CANCELLED: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300",
  };
  const labels: Record<string, string> = {
    ON_RENT: "On Rent",
    RESERVED: "Reserved",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[status] || "bg-slate-100 text-slate-600"}`}>
      {labels[status] || status}
    </span>
  );
}

export default function OwnerDashboard() {
  const { tenant } = useAuth();

  const { data: metrics, isLoading } = useQuery({
    queryKey: ["owner-dashboard-metrics"],
    queryFn: async () => {
      const res = await apiClient.get("/owner/dashboard");
      return res.data.data;
    },
    refetchInterval: 60000, // refresh every minute
  });

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-10 w-72 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          ))}
        </div>
        <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl lg:col-span-2" />
          <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  const v = metrics?.vehicles;
  const ops = metrics?.operations;
  const rev = metrics?.revenue;
  const totals = metrics?.totals;
  const recent = metrics?.recentRentals || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {greeting()}, {tenant?.businessName || "Owner"} 👋
          </h1>
          <p className="mt-1.5 text-slate-500 dark:text-slate-400">
            {format(new Date(), "EEEE, MMMM d, yyyy")} · Here's what's happening with your fleet.
          </p>
        </div>
        <Link href="/owner/rentals/new">
          <button className="hidden sm:flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-sm">
            <BookOpen className="w-4 h-4" />
            New Rental
          </button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          label="Monthly Revenue"
          value={`Rs. ${(rev?.thisMonth || 0).toLocaleString()}`}
          icon={Banknote}
          iconBg="bg-emerald-100 dark:bg-emerald-900/30"
          iconColor="text-emerald-600 dark:text-emerald-400"
          trend={{
            value: rev?.growthPercent ?? null,
            label: "vs last month",
          }}
          subValue={`Rs. ${(rev?.lastMonth || 0).toLocaleString()}`}
          subLabel="last month"
          href="/owner/payments"
        />
        <MetricCard
          label="Active Rentals"
          value={ops?.activeRentals || 0}
          icon={Key}
          iconBg="bg-indigo-100 dark:bg-indigo-900/30"
          iconColor="text-indigo-600 dark:text-indigo-400"
          subValue={totals?.completedRentals || 0}
          subLabel="completed total"
          href="/owner/rentals"
        />
        <MetricCard
          label="Total Customers"
          value={totals?.customers || 0}
          icon={Users}
          iconBg="bg-violet-100 dark:bg-violet-900/30"
          iconColor="text-violet-600 dark:text-violet-400"
          href="/owner/customers"
        />
        <MetricCard
          label="Overdue Rentals"
          value={ops?.overdueRentals || 0}
          icon={AlertTriangle}
          iconBg={ops?.overdueRentals > 0 ? "bg-red-100 dark:bg-red-900/30" : "bg-slate-100 dark:bg-slate-800"}
          iconColor={ops?.overdueRentals > 0 ? "text-red-600 dark:text-red-400" : "text-slate-400"}
          href="/owner/rentals"
        />
      </div>

      {/* Fleet Overview Bar */}
      <FleetBar vehicles={v} />

      {/* Today's operations + Recent Rentals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Rentals */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" />
              Recent Activity
            </h2>
            <Link href="/owner/rentals">
              <span className="text-sm text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-600">
              <Car className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No rentals yet. Create your first one!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recent.map((r: any) => (
                <Link href={`/owner/rentals/${r.id}`} key={r.id}>
                  <div className="flex items-center justify-between p-3.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 group">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                        <Car className="w-4 h-4 text-indigo-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">{r.customerName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{r.vehicleName}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <StatusBadge status={r.status} />
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Rs. {(r.totalAmount || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Today's Ops */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-indigo-500" />
              Today's Ops
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/40">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-lg">
                    <CalendarCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Pickups</p>
                    <p className="text-xs text-slate-500">Due today</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{ops?.pickupsToday || 0}</p>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <CalendarX className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Returns</p>
                    <p className="text-xs text-slate-500">Expected today</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-700 dark:text-slate-300">{ops?.returnsToday || 0}</p>
              </div>

              {ops?.overdueRentals > 0 && (
                <div className="flex items-center justify-between p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/40">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/40 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-red-700 dark:text-red-300">Overdue</p>
                      <p className="text-xs text-red-500">Needs attention</p>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-red-700 dark:text-red-300">{ops?.overdueRentals || 0}</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick stats */}
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center gap-2 mb-4 opacity-80">
              <CircleCheckBig className="w-4 h-4" />
              <p className="text-sm font-medium">All Time Revenue</p>
            </div>
            <p className="text-3xl font-bold mb-1">Rs. {(rev?.total || 0).toLocaleString()}</p>
            <p className="text-sm opacity-70">from {totals?.completedRentals || 0} completed rentals</p>
          </div>
        </div>
      </div>
    </div>
  );
}
