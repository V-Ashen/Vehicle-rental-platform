"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Shield, User, Mail } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { PaginationControl } from '@/components/ui/pagination-control';

const ROLES = [
  { value: 'SUPER_ADMIN', label: 'Super Admin', description: 'Full access to all platform features.' },
  { value: 'FINANCE_ADMIN', label: 'Finance Admin', description: 'Manage packages, payments, and billing.' },
  { value: 'SUPPORT_ADMIN', label: 'Support Admin', description: 'Manage rental businesses and users.' },
  { value: 'OPERATIONS_ADMIN', label: 'Operations Admin', description: 'Access reports and high-level analytics.' }
];

export default function AdminUsersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { dbUser } = useAuth();
  
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteData, setInviteData] = useState({ name: '', email: '', saasRole: 'SUPPORT_ADMIN' });
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/users');
      return res.data.data;
    }
  });

  const inviteMutation = useMutation({
    mutationFn: async (data: typeof inviteData) => {
      const res = await apiClient.post('/admin/users', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setIsInviteOpen(false);
      setInviteData({ name: '', email: '', saasRole: 'SUPPORT_ADMIN' });
      toast({
        title: "Staff Invited",
        description: "An invitation has been sent to the new staff member.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to invite staff",
        description: error.response?.data?.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteData.name || !inviteData.email) return;
    inviteMutation.mutate(inviteData);
  };

  const currentRole = dbUser?.saasRole || 'SUPER_ADMIN';

  if (currentRole !== 'SUPER_ADMIN') {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-slate-400 dark:text-slate-500 mb-4" />
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Access Denied</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Only Super Admins can manage SaaS staff.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center">
            <User className="w-6 h-6 mr-2 text-indigo-600 dark:text-indigo-400" />
            SaaS Staff Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage your internal platform administrators and their roles.
          </p>
        </div>
        
        <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={() => setIsInviteOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Invite Staff
        </Button>
        
        <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Invite New SaaS Staff</DialogTitle>
              <DialogDescription>
                Send an invitation to a new internal team member. They will receive an email to set up their password.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleInvite} className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <Input 
                  placeholder="e.g. Jane Doe" 
                  value={inviteData.name} 
                  onChange={e => setInviteData({...inviteData, name: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <Input 
                  type="email"
                  placeholder="jane@yourplatform.com" 
                  value={inviteData.email} 
                  onChange={e => setInviteData({...inviteData, email: e.target.value})}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">SaaS Role</label>
                <Select value={inviteData.saasRole} onValueChange={(val) => setInviteData({...inviteData, saasRole: val || 'SUPPORT_ADMIN'})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLES.map(role => (
                      <SelectItem key={role.value} value={role.value}>
                        <div className="flex flex-col py-1">
                          <span className="font-medium text-slate-900">{role.label}</span>
                          <span className="text-xs text-slate-500">{role.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => setIsInviteOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={inviteMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700">
                  {inviteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
                  Send Invitation
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-slate-200 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-950">
        <CardHeader className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 pb-4">
          <CardTitle className="text-lg text-slate-900 dark:text-white">Internal Team Members</CardTitle>
          <CardDescription className="text-slate-500 dark:text-slate-400">All active SaaS administrators.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>SaaS Role</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-32 text-center text-slate-500 dark:text-slate-400">
                      No staff members found.
                    </TableCell>
                  </TableRow>
                ) : (
                  users?.slice((page - 1) * itemsPerPage, page * itemsPerPage).map((user: any) => (
                    <TableRow key={user.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <TableCell className="pl-6 font-medium text-slate-900 dark:text-white">
                        {user.name}
                      </TableCell>
                      <TableCell className="text-slate-500 dark:text-slate-400">
                        {user.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium border-slate-200 dark:border-slate-700">
                          {ROLES.find(r => r.value === user.saasRole)?.label || 'Super Admin'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={user.status === 'ACTIVE' 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-none' 
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-none'}>
                          {user.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
          
          {users && users.length > 0 && (
            <PaginationControl 
              currentPage={page}
              totalPages={Math.ceil(users.length / itemsPerPage)}
              onPageChange={setPage}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
