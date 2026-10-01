"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Eye, FileCheck, FileX } from "lucide-react";
import { PaymentActionModal } from "@/components/admin/payments/PaymentActionModal";
import { PaginationControl } from '@/components/ui/pagination-control';

export default function PaymentRequestsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [modalType, setModalType] = useState<'VIEW' | 'REJECT'>('VIEW');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const { data: requests, isLoading } = useQuery({
    queryKey: ["admin-payment-requests"],
    queryFn: async () => {
      const res = await apiClient.get("/admin/payment-requests");
      return res.data.data.paymentRequests;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post(`/admin/payment-requests/${id}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payment-requests"] });
      toast({ title: "Approved", description: "Payment request successfully approved." });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED': return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 text-xs">Approved</Badge>;
      case 'PENDING': return <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/20 text-xs">Pending</Badge>;
      case 'REJECTED': return <Badge className="bg-rose-500/15 text-rose-400 border-rose-500/20 text-xs">Rejected</Badge>;
      default: return <Badge className="bg-slate-700/50 text-slate-400 border-slate-600/50 text-xs">{status}</Badge>;
    }
  };

  const handleAction = (request: any, type: 'VIEW' | 'REJECT') => {
    setSelectedRequest(request);
    setModalType(type);
    setIsModalOpen(true);
  };

  const pendingCount = requests?.filter((r: any) => r.status === 'PENDING').length || 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/20 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-rose-400" />
            </div>
            Payment Requests
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">Review and approve manual bank transfers for tenant subscriptions.</p>
        </div>
        {pendingCount > 0 && (
          <div className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            {pendingCount} pending review
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-800/60 shadow-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800/60 hover:bg-transparent">
              <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-widest pl-6 py-4">Tenant</TableHead>
              <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-widest py-4">Amount</TableHead>
              <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-widest py-4">Reference</TableHead>
              <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-widest py-4">Date</TableHead>
              <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-widest py-4">Status</TableHead>
              <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-widest py-4 text-right pr-6">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i} className="border-slate-800/40 hover:bg-slate-800/20">
                  {[...Array(6)].map((_, j) => (
                    <TableCell key={j} className="py-4">
                      <div className="h-4 bg-slate-800 rounded animate-pulse" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : requests?.length === 0 ? (
              <TableRow className="border-slate-800/40 hover:bg-transparent">
                <TableCell colSpan={6} className="text-center py-16">
                  <CreditCard className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium text-sm">No payment requests found.</p>
                </TableCell>
              </TableRow>
            ) : (
              requests?.slice((page - 1) * itemsPerPage, page * itemsPerPage).map((req: any) => (
                <TableRow key={req.id} className="border-slate-800/40 hover:bg-slate-800/30 transition-colors">
                  <TableCell className="pl-6 py-4">
                    <p className="text-sm font-mono text-slate-400">{req.tenantId?.substring(0, 16)}...</p>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="font-bold text-emerald-400 text-base">
                      LKR {req.amount?.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="text-slate-400 text-sm font-mono">{req.referenceNumber || '-'}</span>
                  </TableCell>
                  <TableCell className="py-4">
                    <span className="text-slate-500 text-xs">
                      {req.submittedAt ? new Date(req.submittedAt).toLocaleDateString() : '-'}
                    </span>
                  </TableCell>
                  <TableCell className="py-4">{getStatusBadge(req.status)}</TableCell>
                  <TableCell className="py-4 text-right pr-6">
                    <div className="flex justify-end items-center gap-2">
                      <Button
                        variant="outline" size="sm"
                        onClick={() => handleAction(req, 'VIEW')}
                        className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg h-8 text-xs"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1.5" />
                        Slip
                      </Button>
                      {req.status === 'PENDING' && (
                        <>
                          <Button
                            variant="outline" size="sm"
                            className="border-emerald-500/30 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg h-8 text-xs"
                            onClick={() => approveMutation.mutate(req.id)}
                            disabled={approveMutation.isPending}
                          >
                            <FileCheck className="w-3.5 h-3.5 mr-1.5" />
                            Approve
                          </Button>
                          <Button
                            variant="outline" size="sm"
                            className="border-rose-500/30 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg h-8 text-xs"
                            onClick={() => handleAction(req, 'REJECT')}
                          >
                            <FileX className="w-3.5 h-3.5 mr-1.5" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {requests && requests.length > itemsPerPage && (
          <div className="border-t border-slate-800/60">
            <PaginationControl
              currentPage={page}
              totalPages={Math.ceil(requests.length / itemsPerPage)}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      <PaymentActionModal
        isOpen={isModalOpen}
        setIsOpen={setIsModalOpen}
        request={selectedRequest}
        type={modalType}
      />
    </div>
  );
}
