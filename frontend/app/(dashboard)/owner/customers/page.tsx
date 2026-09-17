"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { CustomerFormModal } from "@/components/owner/customers/CustomerFormModal";
import { Edit2, Plus, Users, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function CustomersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: responseData, isLoading } = useQuery({
    queryKey: ["owner-customers"],
    queryFn: async () => {
      const res = await apiClient.get("/customers");
      return res.data.data;
    },
  });

  const customers = responseData?.data || [];

  const filteredCustomers = customers.filter((customer: any) => 
    customer.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.nicPassport.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.mobile.includes(searchQuery)
  );

  const handleCreate = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const handleEdit = (customer: any) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center">
            <Users className="w-8 h-8 mr-3 text-indigo-600" />
            Customers
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Manage your rental customers and their information.
          </p>
        </div>
        <Button onClick={handleCreate} className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search by name, NIC, or mobile..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white dark:bg-slate-900"
            />
          </div>
        </div>
        
        {/* Horizontal scroll wrapper for mobile */}
        <div className="overflow-x-auto">
          <Table className="w-full whitespace-nowrap">
            <TableHeader className="bg-slate-50 dark:bg-slate-800">
              <TableRow>
                <TableHead>Customer Name</TableHead>
                <TableHead>Contact Info</TableHead>
                <TableHead>NIC / Passport</TableHead>
                <TableHead>Address</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
                      <p className="text-slate-500">Loading customers...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-lg font-medium text-slate-900 dark:text-white mb-1">No customers found</p>
                    <p>Get started by adding your first customer.</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer: any) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium text-slate-900 dark:text-white">
                      {customer.fullName}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p className="text-slate-900 dark:text-slate-200">{customer.mobile}</p>
                        {customer.email && <p className="text-slate-500">{customer.email}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400">
                      {customer.nicPassport}
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400 max-w-[200px] truncate">
                      {customer.address}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(customer)}>
                        <Edit2 className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <CustomerFormModal 
        isOpen={isModalOpen} 
        setIsOpen={setIsModalOpen} 
        initialData={editingCustomer} 
      />
    </div>
  );
}
