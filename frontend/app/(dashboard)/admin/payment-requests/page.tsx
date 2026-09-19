"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { useToast } from "@/hooks/use-toast";
import { Eye, FileCheck, FileX } from "lucide-react";
import { PaymentActionModal } from "@/components/admin/payments/PaymentActionModal";

export default function PaymentRequestsPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [modalType, setModalType] = useState<'VIEW' | 'REJECT'>('VIEW');
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      case 'APPROVED': return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Approved</Badge>;
      case 'PENDING': return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Pending</Badge>;
      case 'REJECTED': return <Badge className="bg-red-100 text-red-800 border-red-200">Rejected</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleAction = (request: any, type: 'VIEW' | 'REJECT') => {
    setSelectedRequest(request);
    setModalType(type);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Payment Requests
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Review and approve manual bank transfers for tenant subscriptions.
        </p>
      </div>

      <div className="rounded-xl border bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-slate-800">
            <TableRow>
              <TableHead>Tenant ID</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Reference</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="animate-pulse flex flex-col items-center gap-2">
                    <div className="h-4 w-32 bg-slate-200 rounded"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : requests?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                  No payment requests found.
                </TableCell>
              </TableRow>
            ) : (
              requests?.map((req: any) => (
                <TableRow key={req.id}>
                  <TableCell className="font-medium text-slate-900 dark:text-white">
                    {req.tenantId}
                  </TableCell>
                  <TableCell className="font-semibold text-slate-700">
                    ${req.amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-slate-500">
                    {req.referenceNumber}
                  </TableCell>
                  <TableCell>{getStatusBadge(req.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleAction(req, 'VIEW')}>
                        <Eye className="w-4 h-4 mr-2" />
                        Slip
                      </Button>
                      {req.status === 'PENDING' && (
                        <>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
                            onClick={() => approveMutation.mutate(req.id)}
                            disabled={approveMutation.isPending}
                          >
                            <FileCheck className="w-4 h-4 mr-2" />
                            Approve
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-700 hover:text-red-800 hover:bg-red-50"
                            onClick={() => handleAction(req, 'REJECT')}
                          >
                            <FileX className="w-4 h-4 mr-2" />
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
