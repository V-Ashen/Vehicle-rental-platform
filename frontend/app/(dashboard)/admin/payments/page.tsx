"use client";

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { format } from 'date-fns';
import { History, ChevronLeft, ChevronRight, Loader2, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function AdminPaymentHistory() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cursorStack, setCursorStack] = useState<string[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const fetchPayments = async (cursor?: string) => {
    setLoading(true);
    try {
      const url = cursor ? `/admin/payments?cursor=${cursor}` : '/admin/payments';
      const res = await apiClient.get(url);
      setPayments(res.data.data.payments);
      setNextCursor(res.data.data.pagination.nextCursor);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayments(); }, []);

  const handleNextPage = () => {
    if (nextCursor) {
      setCursorStack([...cursorStack, nextCursor]);
      fetchPayments(nextCursor);
    }
  };

  const handlePrevPage = () => {
    const newStack = [...cursorStack];
    newStack.pop();
    setCursorStack(newStack);
    const prevCursor = newStack.length > 0 ? newStack[newStack.length - 1] : undefined;
    fetchPayments(prevCursor);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS': return <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/20 text-xs">Success</Badge>;
      case 'PENDING': return <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/20 text-xs">Pending</Badge>;
      case 'FAILED': return <Badge className="bg-rose-500/15 text-rose-400 border-rose-500/20 text-xs">Failed</Badge>;
      case 'REFUNDED': return <Badge className="bg-slate-500/15 text-slate-400 border-slate-500/20 text-xs">Refunded</Badge>;
      default: return <Badge className="bg-slate-700/50 text-slate-400 border-slate-600/50 text-xs">{status}</Badge>;
    }
  };

  const getMethodBadge = (method: string) => (
    <span className="text-xs font-medium px-2 py-1 rounded-lg bg-slate-800/80 text-slate-400 border border-slate-700/50">
      {method}
    </span>
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center">
            <History className="w-5 h-5 text-indigo-400" />
          </div>
          Payment History
        </h1>
        <p className="mt-1.5 text-sm text-slate-400">Master ledger of all transactions across the platform.</p>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span className="font-medium text-sm">{error}</span>
        </div>
      )}

      {/* Table */}
      <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-800/60 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-slate-800/60">
                {['Payment ID', 'Business', 'Package', 'Amount', 'Method', 'Status', 'Date'].map(h => (
                  <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mx-auto" />
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <History className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm font-medium">No payments found.</p>
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 text-xs font-mono text-indigo-400 whitespace-nowrap">{payment.id}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-200 whitespace-nowrap">{payment.tenantName}</td>
                    <td className="px-6 py-4 text-sm text-slate-400 whitespace-nowrap">{payment.packageName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-emerald-400 font-bold">LKR {payment.amount?.toLocaleString()}</span>
                      <span className="text-slate-600 text-xs ml-1">{payment.currency}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getMethodBadge(payment.method)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(payment.status)}</td>
                    <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">
                      {payment.createdAt?._seconds
                        ? format(new Date(payment.createdAt._seconds * 1000), 'MMM d, yyyy h:mm a')
                        : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-800/60 flex items-center justify-between">
          <span className="text-sm text-slate-500">Page {cursorStack.length + 1}</span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline" size="sm"
              onClick={handlePrevPage}
              disabled={cursorStack.length === 0 || loading}
              className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>
            <Button
              variant="outline" size="sm"
              onClick={handleNextPage}
              disabled={!nextCursor || loading}
              className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg disabled:opacity-40"
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
