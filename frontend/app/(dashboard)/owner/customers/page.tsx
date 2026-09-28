"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CustomerFormModal } from "@/components/owner/customers/CustomerFormModal";
import { Edit2, Plus, Users, Search, Phone, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PaginationControl } from "@/components/ui/pagination-control";

function CustomerAvatar({ name }: { name: string }) {
  const colors = [
    "from-indigo-500 to-violet-600",
    "from-emerald-500 to-teal-600",
    "from-rose-500 to-pink-600",
    "from-amber-500 to-orange-600",
    "from-sky-500 to-blue-600",
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function CustomersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const { data: responseData, isLoading } = useQuery({
    queryKey: ["owner-customers"],
    queryFn: async () => {
      const res = await apiClient.get("/customers");
      return res.data.data;
    },
  });

  const customers = Array.isArray(responseData) ? responseData : (responseData?.data || []);

  const filteredCustomers = customers.filter((c: any) =>
    c.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.nicPassport?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.mobile?.includes(searchQuery) ||
    c.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const paged = filteredCustomers.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const handleCreate = () => { setEditingCustomer(null); setIsModalOpen(true); };
  const handleEdit = (c: any) => { setEditingCustomer(c); setIsModalOpen(true); };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Customers</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {customers.length} registered customer{customers.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
          <Plus className="w-4 h-4" />
          Add Customer
        </Button>
      </div>

      {/* Table card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search name, NIC, mobile, email…"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="pl-9 h-9 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50/80 dark:bg-slate-800/40 hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">NIC / Passport</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Address</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}><div className="h-4 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                        <Users className="w-7 h-7 text-slate-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">No customers found</p>
                        <p className="text-sm text-slate-500 mt-0.5">
                          {searchQuery ? "Try a different search" : "Add your first customer to get started"}
                        </p>
                      </div>
                      {!searchQuery && (
                        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 gap-2" onClick={handleCreate}>
                          <Plus className="w-4 h-4" /> Add Customer
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((customer: any) => (
                  <TableRow key={customer.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors border-slate-100 dark:border-slate-800">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <CustomerAvatar name={customer.fullName || "?"} />
                        <div>
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{customer.fullName}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-300">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {customer.mobile}
                        </div>
                        {customer.email && (
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {customer.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                        {customer.nicPassport}
                      </span>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-slate-600 dark:text-slate-400 max-w-[200px] truncate" title={customer.address}>
                        {customer.address || "—"}
                      </p>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-slate-500" onClick={() => handleEdit(customer)}>
                        <Edit2 className="w-3.5 h-3.5" /> Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {filteredCustomers.length > itemsPerPage && (
          <PaginationControl currentPage={page} totalPages={Math.ceil(filteredCustomers.length / itemsPerPage)} onPageChange={setPage} />
        )}
      </div>

      <CustomerFormModal isOpen={isModalOpen} setIsOpen={setIsModalOpen} initialData={editingCustomer} />
    </div>
  );
}
