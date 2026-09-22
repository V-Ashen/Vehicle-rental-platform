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
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import { cn } from 'cn';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export function OwnerSidebar() {
  const currentPath = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { dbUser } = useAuth();

  // Helper to check permissions
  const hasPermission = (permission: string) => {
    if (!dbUser) return false;
    if (dbUser.userType === 'OWNER') return true;
    return dbUser.permissions?.includes(permission);
  };

  const allLinks = [
    { name: 'Dashboard', href: '/owner/dashboard', icon: LayoutDashboard }, // Dashboard usually visible to all
    { name: 'Rentals', href: '/owner/rentals', icon: Key, requiredPermission: 'rentals.view' },
    { name: 'Vehicles', href: '/owner/vehicles', icon: Car, requiredPermission: 'vehicles.view' },
    { name: 'Customers', href: '/owner/customers', icon: Users, requiredPermission: 'customers.view' },
    { name: 'Maintenance', href: '/owner/maintenance', icon: Wrench, requiredPermission: 'vehicles.manage' },
    { name: 'Reports', href: '/owner/reports', icon: FileText, requiredPermission: 'reports.view' },
    { name: 'Users & Roles', href: '/owner/users', icon: Shield, requiredPermission: 'users.manage' },
    { name: 'Settings', href: '/owner/settings', icon: Settings, requiredPermission: 'settings.manage' },
    { name: 'Billing', href: '/owner/billing', icon: CreditCard, requiredPermission: 'billing.manage' },
  ];

  const links = allLinks.filter(link => !link.requiredPermission || hasPermission(link.requiredPermission));

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button variant="outline" size="icon" onClick={() => setIsOpen(!isOpen)} className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm">
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar Overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Content */}
      <aside className={cn(
        "fixed md:static inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 flex-shrink-0 flex flex-col border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 transform",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <Car className="h-6 w-6 text-indigo-600 mr-2" />
          <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Owner Portal</span>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          {links.map((link) => {
            const isActive = currentPath.startsWith(link.href);
            const Icon = link.icon;
            return (
              <Link 
                key={link.name} 
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center px-3 py-3 rounded-lg transition-colors group text-sm font-medium",
                  isActive 
                    ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" 
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <Icon className={cn(
                  "w-5 h-5 mr-3 flex-shrink-0",
                  isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 group-hover:text-slate-500 dark:group-hover:text-slate-300"
                )} />
                {link.name}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
