"use client";

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CustomerPaymentsLedger() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Pagination State
  const [cursorStack, setCursorStack] = useState<string[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [rentals, setRentals] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    customerId: '',
    rentalId: '',
    amount: '',
    method: 'CASH',
    paymentType: 'RENTAL',
    notes: ''
  });
  const { toast } = useToast();

  const fetchPayments = async (cursor?: string) => {
    setLoading(true);
    try {
      const url = cursor ? `/owner/customer-payments?cursor=${cursor}` : '/owner/customer-payments';
      const res = await apiClient.get(url);
      setPayments(res.data.data.payments);
      setNextCursor(res.data.data.pagination.nextCursor);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [custRes, rentRes] = await Promise.all([
        apiClient.get('/customers'),
        apiClient.get('/rentals')
      ]);
      setCustomers(custRes.data.data.customers || custRes.data.data);
      setRentals(rentRes.data.data.rentals || rentRes.data.data);
    } catch (err) {
      console.error("Failed to load customers/rentals");
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchDependencies();
  }, []);

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

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/owner/customer-payments', {
        ...formData,
        amount: parseFloat(formData.amount)
      });
      toast({ title: 'Success', description: 'Payment recorded successfully' });
      setIsModalOpen(false);
      // Reset
      setFormData({ customerId: '', rentalId: '', amount: '', method: 'CASH', paymentType: 'RENTAL', notes: '' });
      // Refresh list (back to first page)
      setCursorStack([]);
      fetchPayments();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to record payment', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Customer Payments</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">Log and track manual payments received from your customers.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4 mr-2" />
          Record Payment
        </button>
      </div>

      {error && <div className="text-red-500 font-medium p-4 bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-100 dark:border-red-500/20">{error}</div>}

      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-50 dark:bg-slate-800/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Receipt ID</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Customer</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Amount</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Method</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    </div>
                  </td>
                </tr>
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 font-medium">No customer payments recorded yet.</td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-600 dark:text-indigo-400">{payment.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-white">{payment.customerName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-md font-medium text-xs border border-blue-200 dark:border-blue-800">
                        {payment.paymentType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-900 dark:text-white">
                      {payment.amount} {payment.currency}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {payment.method}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
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
        
        {/* Pagination Controls */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <button
            onClick={handlePrevPage}
            disabled={cursorStack.length === 0 || loading}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            Previous
          </button>
          <button
            onClick={handleNextPage}
            disabled={!nextCursor || loading}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            Next
          </button>
        </div>
      </div>

      {/* Record Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-800">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Record Payment</h2>
            </div>
            <form onSubmit={handleSubmitPayment} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Customer *</label>
                <select 
                  required
                  value={formData.customerId}
                  onChange={e => setFormData({...formData, customerId: e.target.value})}
                  className="w-full rounded-lg bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">Select a customer</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.fullName} ({c.nicPassport})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Rental (Optional)</label>
                <select 
                  value={formData.rentalId}
                  onChange={e => setFormData({...formData, rentalId: e.target.value})}
                  className="w-full rounded-lg bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                >
                  <option value="">None</option>
                  {rentals.filter(r => !formData.customerId || r.customerId === formData.customerId).map(r => (
                    <option key={r.id} value={r.id}>{r.id} ({r.status})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Payment Type</label>
                  <select 
                    value={formData.paymentType}
                    onChange={e => setFormData({...formData, paymentType: e.target.value})}
                    className="w-full rounded-lg bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="RENTAL">Rental Invoice</option>
                    <option value="ADVANCE">Advance/Booking</option>
                    <option value="DEPOSIT">Security Deposit</option>
                    <option value="DAMAGE">Damage Charge</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Method</label>
                  <select 
                    value={formData.method}
                    onChange={e => setFormData({...formData, method: e.target.value})}
                    className="w-full rounded-lg bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card Terminal</option>
                    <option value="BANK">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Amount (LKR) *</label>
                <input 
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                  className="w-full rounded-lg bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="e.g. 5000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Notes (Optional)</label>
                <input 
                  type="text"
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  className="w-full rounded-lg bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-700 dark:text-white focus:border-indigo-500 focus:ring-indigo-500"
                  placeholder="Receipt number, check number, etc."
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg hover:bg-indigo-700">
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
