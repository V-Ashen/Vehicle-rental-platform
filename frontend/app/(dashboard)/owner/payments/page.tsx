"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { format } from "date-fns";
import { Plus, Wallet, X, CreditCard, Banknote, Building2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { cn } from "cn";

const METHOD_ICONS: Record<string, any> = {
  CASH: Banknote,
  CARD: CreditCard,
  BANK: Building2,
};

function PaymentTypePill({ type }: { type: string }) {
  const config: Record<string, { label: string; cls: string }> = {
    RENTAL:   { label: "Rental Invoice", cls: "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/50" },
    ADVANCE:  { label: "Advance",        cls: "bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 border-violet-200 dark:border-violet-800/50" },
    DEPOSIT:  { label: "Deposit",        cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50" },
    DAMAGE:   { label: "Damage",         cls: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800/50" },
  };
  const c = config[type] ?? { label: type, cls: "bg-slate-100 text-slate-600 border-slate-200" };
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border", c.cls)}>
      {c.label}
    </span>
  );
}

function MethodBadge({ method }: { method: string }) {
  const Icon = METHOD_ICONS[method] || Banknote;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
      <Icon className="w-3.5 h-3.5" />
      {method === "BANK" ? "Bank Transfer" : method === "CARD" ? "Card" : "Cash"}
    </span>
  );
}

const selectClass = "w-full rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 dark:text-white text-sm px-3 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors";
const inputClass = "w-full rounded-xl bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 dark:text-white text-sm px-3 py-2.5 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-colors";

export default function CustomerPaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cursorStack, setCursorStack] = useState<string[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [rentals, setRentals] = useState<any[]>([]);
  const [formData, setFormData] = useState({ customerId: "", rentalId: "", amount: "", method: "CASH", paymentType: "RENTAL", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const fetchPayments = async (cursor?: string) => {
    setLoading(true);
    try {
      const url = cursor ? `/owner/customer-payments?cursor=${cursor}` : "/owner/customer-payments";
      const res = await apiClient.get(url);
      setPayments(res.data.data.payments || []);
      setNextCursor(res.data.data.pagination?.nextCursor ?? null);
    } catch (err: any) {
      setError(err.message || "Failed to fetch payments");
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [custRes, rentRes] = await Promise.all([apiClient.get("/customers"), apiClient.get("/rentals")]);
      setCustomers(custRes.data.data.customers || custRes.data.data || []);
      setRentals(rentRes.data.data.rentals || rentRes.data.data || []);
    } catch {}
  };

  useEffect(() => { fetchPayments(); fetchDependencies(); }, []);

  const handleNext = () => { if (nextCursor) { setCursorStack([...cursorStack, nextCursor]); fetchPayments(nextCursor); } };
  const handlePrev = () => { const ns = [...cursorStack]; ns.pop(); setCursorStack(ns); fetchPayments(ns.length > 0 ? ns[ns.length - 1] : undefined); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post("/owner/customer-payments", { ...formData, amount: parseFloat(formData.amount) });
      toast({ title: "Payment Recorded", description: "The payment has been saved successfully." });
      setIsModalOpen(false);
      setFormData({ customerId: "", rentalId: "", amount: "", method: "CASH", paymentType: "RENTAL", notes: "" });
      setCursorStack([]);
      fetchPayments();
    } catch (err: any) {
      toast({ title: "Error", description: err.response?.data?.message || "Failed to record payment", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const totalThisPage = payments.reduce((s, p) => s + (p.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Customer Payments</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Log and track payments received from customers.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4" /> Record Payment
        </Button>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-2xl text-sm text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Table card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                {["Receipt ID", "Customer", "Type", "Method", "Amount", "Date"].map(h => (
                  <th key={h} className="px-6 py-3.5 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-6 py-4"><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <Wallet className="w-7 h-7 text-slate-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">No payments recorded</p>
                        <p className="text-sm text-slate-500 mt-0.5">Start by recording a payment from a customer.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                payments.map((p) => {
                  const MethodIcon = METHOD_ICONS[p.method] || Banknote;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-lg">
                          {p.id?.slice(-8) || p.id}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{p.customerName}</span>
                      </td>
                      <td className="px-6 py-4"><PaymentTypePill type={p.paymentType} /></td>
                      <td className="px-6 py-4"><MethodBadge method={p.method} /></td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          Rs. {(p.amount || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-500">
                          {p.createdAt?._seconds ? format(new Date(p.createdAt._seconds * 1000), "MMM d, yyyy") : "N/A"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {payments.length > 0 && `Rs. ${totalThisPage.toLocaleString()} on this page`}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrev} disabled={cursorStack.length === 0 || loading} className="h-8">Previous</Button>
            <Button variant="outline" size="sm" onClick={handleNext} disabled={!nextCursor || loading} className="h-8">Next</Button>
          </div>
        </div>
      </div>

      {/* Record Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Record Payment</h2>
                <p className="text-xs text-slate-500 mt-0.5">Log a manual payment from a customer</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Customer *</label>
                <select required value={formData.customerId} onChange={e => setFormData({ ...formData, customerId: e.target.value })} className={selectClass}>
                  <option value="">Select customer…</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.fullName} — {c.nicPassport}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Rental (optional)</label>
                <select value={formData.rentalId} onChange={e => setFormData({ ...formData, rentalId: e.target.value })} className={selectClass}>
                  <option value="">None</option>
                  {(formData.customerId ? rentals.filter(r => r.customerId === formData.customerId) : rentals).map(r => (
                    <option key={r.id} value={r.id}>{r.id} — {r.status}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Type</label>
                  <select value={formData.paymentType} onChange={e => setFormData({ ...formData, paymentType: e.target.value })} className={selectClass}>
                    <option value="RENTAL">Rental Invoice</option>
                    <option value="ADVANCE">Advance / Booking</option>
                    <option value="DEPOSIT">Security Deposit</option>
                    <option value="DAMAGE">Damage Charge</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Method</label>
                  <select value={formData.method} onChange={e => setFormData({ ...formData, method: e.target.value })} className={selectClass}>
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card Terminal</option>
                    <option value="BANK">Bank Transfer</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Amount (LKR) *</label>
                <input type="number" required min="0" step="0.01" value={formData.amount} onChange={e => setFormData({ ...formData, amount: e.target.value })} placeholder="e.g. 5000" className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Notes (optional)</label>
                <input type="text" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Receipt number, reference, etc." className={inputClass} />
              </div>
              <div className="pt-2 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800 mt-6">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 gap-2" disabled={submitting}>
                  {submitting ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}
                  Record Payment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
