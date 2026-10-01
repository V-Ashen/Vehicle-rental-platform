"use client";

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Shield, Users, Mail } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { PaginationControl } from '@/components/ui/pagination-control';

const ROLES = [
  { value: 'SUPER_ADMIN', label: 'Super Admin', description: 'Full access to all platform features.', color: 'text-rose-400' },
  { value: 'FINANCE_ADMIN', label: 'Finance Admin', description: 'Manage packages, payments, and billing.', color: 'text-emerald-400' },
  { value: 'SUPPORT_ADMIN', label: 'Support Admin', description: 'Manage rental businesses and users.', color: 'text-blue-400' },
  { value: 'OPERATIONS_ADMIN', label: 'Operations Admin', description: 'Access reports and high-level analytics.', color: 'text-purple-400' }
];

const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
  FINANCE_ADMIN: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  SUPPORT_ADMIN: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  OPERATIONS_ADMIN: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
};

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
      toast({ title: "Staff Invited", description: "An invitation has been sent to the new staff member." });
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
          <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-slate-600" />
          </div>
          <h2 className="text-xl font-bold text-white">Access Denied</h2>
          <p className="text-slate-500 text-sm mt-2">Only Super Admins can manage SaaS staff.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-rose-400" />
            </div>
            SaaS Staff
          </h1>
          <p className="mt-1.5 text-sm text-slate-400">Manage internal platform administrators and their roles.</p>
        </div>
        <Button
          onClick={() => setIsInviteOpen(true)}
          className="bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20 rounded-xl shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Invite Staff
        </Button>
      </div>

      {/* Table */}
      <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-800/60 shadow-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800/60 hover:bg-transparent">
              <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-widest pl-6 py-4">Name</TableHead>
              <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-widest py-4">Email</TableHead>
              <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-widest py-4">SaaS Role</TableHead>
              <TableHead className="text-slate-500 font-semibold text-xs uppercase tracking-widest py-4">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow className="border-slate-800/40">
                <TableCell colSpan={4} className="text-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-rose-400 mx-auto" />
                </TableCell>
              </TableRow>
            ) : users?.length === 0 ? (
              <TableRow className="border-slate-800/40 hover:bg-transparent">
                <TableCell colSpan={4} className="text-center py-16">
                  <Users className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 text-sm font-medium">No staff members found.</p>
                </TableCell>
              </TableRow>
            ) : (
              users?.slice((page - 1) * itemsPerPage, page * itemsPerPage).map((user: any) => (
                <TableRow key={user.id} className="border-slate-800/40 hover:bg-slate-800/30 transition-colors">
                  <TableCell className="pl-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {(user.name || user.fullName || 'U').charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-slate-100">{user.name || user.fullName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-4 text-slate-400 text-sm">{user.email}</TableCell>
                  <TableCell className="py-4">
                    <Badge className={`text-xs ${roleColors[user.saasRole] || 'bg-slate-700/50 text-slate-400 border-slate-600/50'}`}>
                      {ROLES.find(r => r.value === user.saasRole)?.label || 'Super Admin'}
                    </Badge>
                  </TableCell>
                  <TableCell className="py-4">
                    <Badge className={user.status === 'ACTIVE'
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20 text-xs'
                      : 'bg-amber-500/15 text-amber-400 border-amber-500/20 text-xs'
                    }>
                      {user.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {users && users.length > itemsPerPage && (
          <div className="border-t border-slate-800/60">
            <PaginationControl
              currentPage={page}
              totalPages={Math.ceil(users.length / itemsPerPage)}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      {/* Invite Dialog */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent className="sm:max-w-[440px] bg-slate-900 border-slate-800 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Invite New SaaS Staff</DialogTitle>
            <DialogDescription className="text-slate-400">
              Send an invitation to a new internal team member. They will receive an email to set up their password.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleInvite} className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Full Name</label>
              <Input
                placeholder="e.g. Jane Doe"
                value={inviteData.name}
                onChange={e => setInviteData({...inviteData, name: e.target.value})}
                className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-600 rounded-xl"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Email Address</label>
              <Input
                type="email"
                placeholder="jane@yourplatform.com"
                value={inviteData.email}
                onChange={e => setInviteData({...inviteData, email: e.target.value})}
                className="bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-600 rounded-xl"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">SaaS Role</label>
              <Select value={inviteData.saasRole} onValueChange={(val) => setInviteData({...inviteData, saasRole: val || 'SUPPORT_ADMIN'})}>
                <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100 rounded-xl">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  {ROLES.map(role => (
                    <SelectItem key={role.value} value={role.value} className="text-slate-200 focus:bg-slate-800">
                      <div className="flex flex-col py-1">
                        <span className={`font-medium ${role.color}`}>{role.label}</span>
                        <span className="text-xs text-slate-500">{role.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsInviteOpen(false)} className="border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl">
                Cancel
              </Button>
              <Button type="submit" disabled={inviteMutation.isPending} className="bg-rose-600 hover:bg-rose-500 text-white rounded-xl">
                {inviteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
                Send Invitation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
