"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  Building2,
  Package,
  CreditCard,
  History,
  Mail,
  Settings,
  Users,
  ChevronRight,
  ShieldCheck,
  X,
} from 'lucide-react';
import { cn } from 'cn';

const navGroups = [
  {
    label: 'Overview',
    links: [
      { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard, roles: ['SUPER_ADMIN', 'FINANCE_ADMIN', 'SUPPORT_ADMIN', 'OPERATIONS_ADMIN'] },
    ],
  },
  {
    label: 'Tenants',
    links: [
      { name: 'Rental Businesses', href: '/admin/tenants', icon: Building2, roles: ['SUPER_ADMIN', 'SUPPORT_ADMIN'] },
    ],
  },
  {
    label: 'Monetization',
    links: [
      { name: 'Packages', href: '/admin/packages', icon: Package, roles: ['SUPER_ADMIN', 'FINANCE_ADMIN'] },
      { name: 'Payment Requests', href: '/admin/payment-requests', icon: CreditCard, roles: ['SUPER_ADMIN', 'FINANCE_ADMIN'] },
      { name: 'Payment History', href: '/admin/payments', icon: History, roles: ['SUPER_ADMIN', 'FINANCE_ADMIN'] },
    ],
  },
  {
    label: 'System',
    links: [
      { name: 'Emails', href: '/admin/emails', icon: Mail, roles: ['SUPER_ADMIN'] },
      { name: 'Settings', href: '/admin/settings', icon: Settings, roles: ['SUPER_ADMIN'] },
      { name: 'SaaS Staff', href: '/admin/users', icon: Users, roles: ['SUPER_ADMIN'] },
    ],
  },
];

interface AdminSidebarProps {
  currentPath: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({ currentPath, isOpen = true, onClose }: AdminSidebarProps) {
  const { dbUser } = useAuth();
  const currentRole = dbUser?.saasRole || 'SUPER_ADMIN';

  return (
    <>
      {isOpen && onClose && (
        <div className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />
      )}

      <aside className={cn(
        "fixed md:static inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform duration-300",
        "bg-slate-950 border-r border-slate-800/50",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-lg shadow-rose-500/30">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold text-white tracking-tight block leading-tight">SaaS Admin</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest">Control Panel</span>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose} className="md:hidden p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {navGroups.map((group) => {
            const visibleLinks = group.links.filter(link => link.roles.includes(currentRole));
            if (visibleLinks.length === 0) return null;

            return (
              <div key={group.label}>
                <p className="px-3 mb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                  {group.label}
                </p>
                <div className="space-y-0.5">
                  {visibleLinks.map((link) => {
                    const isActive = currentPath === link.href || currentPath.startsWith(link.href + '/');
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.name}
                        href={link.href}
                        onClick={onClose}
                        className={cn(
                          "flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-150 group text-sm font-medium border",
                          isActive
                            ? "bg-rose-500/15 text-rose-400 border-rose-500/20"
                            : "text-slate-400 hover:text-white hover:bg-slate-800/60 border-transparent"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-7 h-7 rounded-lg flex items-center justify-center transition-colors shrink-0",
                            isActive ? "bg-rose-500/20" : "bg-slate-800/50 group-hover:bg-slate-700/50"
                          )}>
                            <Icon className={cn(
                              "w-3.5 h-3.5",
                              isActive ? "text-rose-400" : "text-slate-400 group-hover:text-slate-200"
                            )} />
                          </div>
                          <span>{link.name}</span>
                        </div>
                        {isActive && <ChevronRight className="w-3.5 h-3.5 text-rose-400/60" />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* System status footer */}
        <div className="p-3 border-t border-slate-800/50 shrink-0">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800/50">
            <div className="relative shrink-0">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <div className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-50" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white">All systems operational</p>
              <p className="text-[10px] text-slate-500">{currentRole.replace('_', ' ')}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
