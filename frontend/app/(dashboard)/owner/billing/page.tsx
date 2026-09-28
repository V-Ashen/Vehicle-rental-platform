"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { format } from "date-fns";
import { CreditCard, Download, ExternalLink, Calendar, Zap, AlertCircle, CheckCircle2, Car, Users, Building2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import UpgradeModal from "@/components/owner/billing/UpgradeModal";
import { parseFirestoreDate } from "@/lib/dateUtils";
import { PaginationControl } from "@/components/ui/pagination-control";
import { cn } from "cn";

function StatusPill({ status }: { status: string }) {
  const config: Record<string, string> = {
    ACTIVE:   "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50",
    SUCCESS:  "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50",
    APPROVED: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50",
    TRIAL:    "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800/50",
    PENDING:  "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800/50",
    EXPIRED:  "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800/50",
    FAILED:   "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800/50",
    REJECTED: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800/50",
  };
  return (
    <span className={cn("inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border", config[status] || "bg-slate-100 text-slate-600 border-slate-200")}>
      {status}
    </span>
  );
}

function LimitCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800">
      <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center mb-3", color)}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

export default function BillingDashboardPage() {
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const { data: subscriptionData, isLoading: subLoading } = useQuery({
    queryKey: ["owner-subscription"],
    queryFn: async () => {
      const res = await apiClient.get("/owner/billing/subscription");
      return res.data.data;
    },
  });

  const { data: payments, isLoading: paymentsLoading } = useQuery({
    queryKey: ["owner-payments"],
    queryFn: async () => {
      const res = await apiClient.get("/owner/billing/payments");
      return res.data.data;
    },
  });

  const paged = (payments || []).slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Billing & Subscription</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Manage your plan, limits, and payment history.</p>
        </div>
        <Button onClick={() => setIsUpgradeModalOpen(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
          <Zap className="w-4 h-4" /> Renew / Upgrade
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current plan card */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 relative overflow-hidden">
          {subscriptionData?.status === "TRIAL" && (
            <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-bl-xl">
              TRIAL PERIOD
            </div>
          )}
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Current Plan</h2>
          <p className="text-sm text-slate-500 mb-6">Your active subscription package details.</p>

          {subLoading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-xl w-1/2" />
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-xl w-1/3" />
              <div className="grid grid-cols-3 gap-4 mt-6">
                {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-200 dark:bg-slate-800 rounded-2xl" />)}
              </div>
            </div>
          ) : !subscriptionData ? (
            <div className="flex flex-col items-center py-8 text-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">No active subscription</p>
                <p className="text-sm text-slate-500 mt-0.5">Renew or upgrade to continue using the platform.</p>
              </div>
              <Button onClick={() => setIsUpgradeModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 gap-2">
                <Zap className="w-4 h-4" /> View Plans
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                    {subscriptionData.package?.name || "Unknown Package"}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1.5 text-sm text-slate-500">
                    <Calendar className="w-4 h-4" />
                    Started {format(parseFirestoreDate(subscriptionData.trialStartAt || subscriptionData.createdAt), "MMM d, yyyy")}
                  </div>
                </div>
                <div className="text-right">
                  <StatusPill status={subscriptionData.status} />
                  <p className="text-xs text-slate-500 mt-1.5">
                    {subscriptionData.status === "TRIAL" ? "Trial ends " : "Renews on "}
                    {format(parseFirestoreDate(subscriptionData.trialEndAt || subscriptionData.updatedAt), "MMM d, yyyy")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <LimitCard icon={Car} label="Vehicles" value={`${subscriptionData.package?.maxVehicles || 0} max`} color="bg-indigo-500" />
                <LimitCard icon={Users} label="Staff" value={`${subscriptionData.package?.maxUsers || 0} max`} color="bg-violet-500" />
                <LimitCard icon={Building2} label="Branches" value={`${subscriptionData.package?.maxBranches || 1} max`} color="bg-emerald-500" />
              </div>

              {subscriptionData.package?.features?.length > 0 && (
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Included Features</p>
                  <div className="flex flex-wrap gap-2">
                    {subscriptionData.package.features.map((f: string, i: number) => (
                      <span key={i} className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                        <CheckCircle2 className="w-3 h-3" /> {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Upgrade CTA */}
        <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-6 text-white shadow-lg shadow-indigo-500/20 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-lg font-bold mb-2">Need more capacity?</h3>
            <p className="text-sm text-indigo-200">
              Upgrade your plan to unlock more vehicles, staff accounts, and advanced analytics.
            </p>
          </div>
          <div className="mt-6 space-y-3">
            <Button onClick={() => setIsUpgradeModalOpen(true)} className="w-full bg-white text-indigo-700 hover:bg-indigo-50 font-semibold">
              View All Plans
            </Button>
            <p className="text-xs text-center text-indigo-300">Changes take effect immediately.</p>
          </div>
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Payment History</h2>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 dark:bg-slate-800/40 hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                {["Date", "Reference", "Amount (Rs.)", "Method", "Status", "Receipt"].map(h => (
                  <TableHead key={h} className={cn("text-xs font-semibold text-slate-500 uppercase tracking-wider", h === "Receipt" && "text-right")}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentsLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <CreditCard className="w-8 h-8 text-slate-300" />
                      <p className="text-sm font-medium text-slate-900 dark:text-white">No payment history</p>
                      <p className="text-sm text-slate-500">Your SaaS payments will appear here.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((payment: any, index: number) => (
                  <TableRow key={`${payment.id}-${index}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors border-slate-100 dark:border-slate-800">
                    <TableCell>
                      <span className="text-sm font-medium text-slate-900 dark:text-white">
                        {format(parseFirestoreDate(payment.date), "MMM d, yyyy")}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">{payment.id}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">Rs. {payment.amount?.toLocaleString()}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        {payment.method === "ONLINE" ? "Online Card" : payment.method === "BANK_TRANSFER" ? "Bank Transfer" : payment.method}
                      </span>
                    </TableCell>
                    <TableCell><StatusPill status={payment.status} /></TableCell>
                    <TableCell className="text-right">
                      {payment.slipUrl ? (
                        <a href={payment.slipUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 h-8 gap-1">
                            <ExternalLink className="w-3.5 h-3.5" /> View
                          </Button>
                        </a>
                      ) : payment.status === "SUCCESS" ? (
                        <Button variant="ghost" size="sm" className="text-slate-500 h-8 gap-1">
                          <Download className="w-3.5 h-3.5" /> Invoice
                        </Button>
                      ) : (
                        <span className="text-slate-400 text-sm">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {(payments || []).length > itemsPerPage && (
          <PaginationControl currentPage={page} totalPages={Math.ceil((payments || []).length / itemsPerPage)} onPageChange={setPage} />
        )}
      </div>

      <UpgradeModal isOpen={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} />
    </div>
  );
}
