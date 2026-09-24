"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { format } from "date-fns";
import { CreditCard, Download, ExternalLink, Calendar, Zap, AlertCircle } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import UpgradeModal from "@/components/owner/billing/UpgradeModal";
import { parseFirestoreDate } from "@/lib/dateUtils";

export default function BillingDashboardPage() {
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
      case "SUCCESS":
      case "APPROVED":
        return <Badge className="bg-emerald-100 text-emerald-800 border-transparent">{status}</Badge>;
      case "TRIAL":
      case "PENDING":
        return <Badge className="bg-amber-100 text-amber-800 border-transparent">{status}</Badge>;
      case "EXPIRED":
      case "FAILED":
      case "REJECTED":
        return <Badge className="bg-red-100 text-red-800 border-transparent">{status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getMethodBadge = (method: string) => {
    if (method === "ONLINE") return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">Online Card</Badge>;
    if (method === "BANK_TRANSFER") return <Badge variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50">Bank Transfer</Badge>;
    return <Badge variant="outline">{method}</Badge>;
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center">
            <CreditCard className="w-6 h-6 mr-2 text-indigo-600" />
            Billing & Subscriptions
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your subscription plan, view limits, and download payment history.
          </p>
        </div>
        <Button onClick={() => setIsUpgradeModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Zap className="w-4 h-4 mr-2" />
          Renew / Upgrade Plan
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          {subscriptionData?.status === "TRIAL" && (
            <div className="absolute top-0 right-0 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
              TRIAL PERIOD
            </div>
          )}
          <CardHeader>
            <CardTitle>Current Plan Overview</CardTitle>
            <CardDescription>Your current package details and platform limits.</CardDescription>
          </CardHeader>
          <CardContent>
            {subLoading ? (
              <div className="animate-pulse flex space-x-4">
                <div className="flex-1 space-y-4 py-1">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-200 rounded"></div>
                    <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                  </div>
                </div>
              </div>
            ) : !subscriptionData ? (
              <div className="text-center py-6">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <p className="text-slate-900 font-medium">No Active Subscription Found</p>
                <p className="text-slate-500 text-sm">Please renew or upgrade your plan to continue using the platform.</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {subscriptionData.package?.name || "Unknown Package"}
                    </h3>
                    <div className="flex items-center mt-1 text-sm text-slate-500">
                      <Calendar className="w-4 h-4 mr-1" />
                      Started on {format(parseFirestoreDate(subscriptionData.trialStartAt || subscriptionData.createdAt), "MMM d, yyyy")}
                    </div>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(subscriptionData.status)}
                    <p className="text-xs text-slate-500 mt-2">
                      {subscriptionData.status === "TRIAL" ? "Trial ends " : "Renews on "}
                      {format(parseFirestoreDate(subscriptionData.trialEndAt || subscriptionData.updatedAt), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Vehicle Limit</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">
                      {subscriptionData.package?.maxVehicles || 0} <span className="text-sm font-normal text-slate-500">max vehicles</span>
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Staff Limit</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">
                      {subscriptionData.package?.maxUsers || 0} <span className="text-sm font-normal text-slate-500">max users</span>
                    </p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Branch Limit</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white">
                      {subscriptionData.package?.maxBranches || 1} <span className="text-sm font-normal text-slate-500">max branches</span>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/30">
          <CardHeader>
            <CardTitle className="text-indigo-900 dark:text-indigo-300">Need more capacity?</CardTitle>
            <CardDescription className="text-indigo-700/70 dark:text-indigo-400/70">
              Upgrade your plan to unlock more vehicles, more staff accounts, and advanced analytics features.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setIsUpgradeModalOpen(true)} className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 dark:shadow-none">
              View Packages
            </Button>
            <div className="mt-4 text-xs text-center text-indigo-700/60 dark:text-indigo-400/60">
              Changes take effect immediately.
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <h3 className="text-lg font-medium text-slate-900 dark:text-white">Payment History</h3>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Amount (Rs.)</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Receipt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentsLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
                  </TableCell>
                </TableRow>
              ) : !payments || payments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                    <p className="font-medium text-slate-900 dark:text-white mb-1">No payment history</p>
                    <p>You haven't made any payments yet.</p>
                  </TableCell>
                </TableRow>
              ) : (
                payments.map((payment: any, index: number) => (
                  <TableRow key={`${payment.id}-${index}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <TableCell className="font-medium text-slate-900 dark:text-white">
                      {format(parseFirestoreDate(payment.date), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-slate-500 text-xs font-mono">
                      {payment.id}
                    </TableCell>
                    <TableCell className="font-medium">
                      {payment.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {getMethodBadge(payment.method)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(payment.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      {payment.slipUrl ? (
                        <a href={payment.slipUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-800">
                            <ExternalLink className="w-4 h-4 mr-1" /> View Slip
                          </Button>
                        </a>
                      ) : payment.status === 'SUCCESS' ? (
                        <Button variant="ghost" size="sm" className="text-slate-500">
                          <Download className="w-4 h-4 mr-1" /> Invoice
                        </Button>
                      ) : (
                        <span className="text-slate-400 text-sm">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <UpgradeModal 
        isOpen={isUpgradeModalOpen} 
        onClose={() => setIsUpgradeModalOpen(false)} 
      />
    </div>
  );
}
