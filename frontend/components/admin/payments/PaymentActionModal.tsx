"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface PaymentActionModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  request: any;
  type: 'VIEW' | 'REJECT';
}

export function PaymentActionModal({ isOpen, setIsOpen, request, type }: PaymentActionModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [reason, setReason] = useState("");

  const rejectMutation = useMutation({
    mutationFn: async () => {
      await apiClient.post(`/admin/payment-requests/${request.id}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payment-requests"] });
      toast({ title: "Rejected", description: "Payment request successfully rejected." });
      setIsOpen(false);
      setReason("");
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.response?.data?.message || err.message, variant: "destructive" });
    }
  });

  if (!request) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{type === 'VIEW' ? 'Payment Slip' : 'Reject Payment'}</DialogTitle>
          <DialogDescription>
            {type === 'VIEW' ? `Reference: ${request.referenceNumber}` : 'Please provide a reason for rejecting this payment.'}
          </DialogDescription>
        </DialogHeader>

        {type === 'VIEW' ? (
          <div className="mt-4 border rounded-xl overflow-hidden bg-slate-50 flex items-center justify-center p-2 min-h-[300px]">
            {request.slipUrl ? (
              <img src={request.slipUrl} alt="Payment Slip" className="max-w-full max-h-[500px] object-contain rounded-lg shadow-sm" />
            ) : (
              <p className="text-slate-500 font-medium">No slip URL provided.</p>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <Textarea 
              placeholder="e.g. Invalid reference number, blur slip image, insufficient amount..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button 
                variant="destructive" 
                onClick={() => rejectMutation.mutate()}
                disabled={!reason.trim() || rejectMutation.isPending}
              >
                {rejectMutation.isPending ? 'Rejecting...' : 'Confirm Reject'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
