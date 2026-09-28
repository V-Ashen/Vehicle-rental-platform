"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Car, 
  Key, 
  Users, 
  Wrench, 
  FileText, 
  Settings, 
  CreditCard,
  Shield,
  X,
  Wallet,
  ChevronRight,
  CalendarDays,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from 'cn';
import { useAuth } from '@/hooks/useAuth';
import { FeatureGuard } from '@/components/ui/FeatureGuard';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

const navGroups = [
  {
    label: 'Overview',
    links: [
      { name: 'Dashboard', href: '/owner/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Fleet',
    links: [
      { name: 'Rentals', href: '/owner/rentals', icon: Key, requiredPermission: 'rentals.view' },
      { name: 'Calendar', href: '/owner/rentals/calendar', icon: CalendarDays, requiredPermission: 'rentals.view' },
      { name: 'Vehicles', href: '/owner/vehicles', icon: Car, requiredPermission: 'vehicles.view' },
      { name: 'Maintenance', href: '/owner/maintenance', icon: Wrench, requiredPermission: 'vehicles.manage' },
    ],
  },
  {
    label: 'Business',
    links: [
      { name: 'Customers', href: '/owner/customers', icon: Users, requiredPermission: 'customers.view' },
      { name: 'Payments', href: '/owner/payments', icon: Wallet, requiredPermission: 'billing.manage' },
      { name: 'Reports', href: '/owner/reports', icon: FileText, requiredPermission: 'reports.view', featureGuard: 'advancedReporting' },
    ],
  },
  {
    label: 'Admin',
    links: [
      { name: 'Users & Roles', href: '/owner/users', icon: Shield, requiredPermission: 'users.manage' },
      { name: 'Billing', href: '/owner/billing', icon: CreditCard, requiredPermission: 'billing.manage' },
      { name: 'Settings', href: '/owner/settings', icon: Settings, requiredPermission: 'settings.manage' },
    ],
  },
];

interface OwnerSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OwnerSidebar({ isOpen, onClose }: OwnerSidebarProps) {
  const currentPath = usePathname();
  const { dbUser, tenant } = useAuth();

  const hasPermission = (permission: string) => {
    if (!dbUser) return false;
    if (dbUser.userType === 'OWNER') return true;
    return dbUser.permissions?.includes(permission);
  };

  const initial = (tenant?.businessName || 'O').charAt(0).toUpperCase();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        "fixed md:static inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform duration-300",
        "bg-slate-950 border-r border-slate-800/50",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Car className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold text-white tracking-tight block leading-tight">
                {tenant?.businessName || 'Owner Portal'}
              </span>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest">Fleet Manager</span>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden p-1.5 text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6 scrollbar-thin scrollbar-thumb-slate-700">
          {navGroups.map((group) => {
            const visibleLinks = group.links.filter(
              link => !link.requiredPermission || hasPermission(link.requiredPermission)
            );
            if (visibleLinks.length === 0) return null;

            return (
              <div key={group.label}>
                <p className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {visibleLinks.map((link) => {
                    const isActive = currentPath === link.href || 
                      (link.href !== '/owner/dashboard' && currentPath.startsWith(link.href));
                    const Icon = link.icon;
                    
                    const linkEl = (
                      <Link
                        key={link.name}
                        href={link.href}
                        onClick={onClose}
                        className={cn(
                          "flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-150 group text-sm font-medium",
                          isActive
                            ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20"
                            : "text-slate-400 hover:text-white hover:bg-slate-800/60 border border-transparent"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0",
                            isActive
                              ? "bg-indigo-500/20"
                              : "bg-slate-800/50 group-hover:bg-slate-700/50"
                          )}>
                            <Icon className={cn(
                              "w-3.5 h-3.5",
                              isActive ? "text-indigo-400" : "text-slate-400 group-hover:text-slate-200"
                            )} />
                          </div>
                          <span>{link.name}</span>
                        </div>
                        {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-400/60" />}
                      </Link>
                    );

                    if ((link as any).featureGuard) {
                      return (
                        <FeatureGuard key={link.name} feature={(link as any).featureGuard}>
                          {linkEl}
                        </FeatureGuard>
                      );
                    }

                    return linkEl;
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="p-3 border-t border-slate-800/50 shrink-0">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800/50">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{dbUser?.email}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">{dbUser?.userType}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
