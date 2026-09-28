"use client";

import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useQueryClient } from '@tanstack/react-query';
import { usePathname } from 'next/navigation';
import { LogOut, Menu, Bell, ChevronDown, Check, Info } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

const pathLabels: Record<string, string> = {
  '/owner/dashboard': 'Dashboard',
  '/owner/rentals': 'Rentals',
  '/owner/rentals/new': 'New Rental',
  '/owner/rentals/calendar': 'Calendar',
  '/owner/vehicles': 'Vehicles',
  '/owner/vehicles/new': 'Add Vehicle',
  '/owner/customers': 'Customers',
  '/owner/maintenance': 'Maintenance',
  '/owner/reports': 'Reports',
  '/owner/payments': 'Payments',
  '/owner/users': 'Users & Roles',
  '/owner/billing': 'Billing',
  '/owner/settings': 'Settings',
  '/admin/dashboard': 'Dashboard',
  '/admin/tenants': 'Rental Businesses',
  '/admin/packages': 'Packages',
  '/admin/payment-requests': 'Payment Requests',
  '/admin/payments': 'Payment History',
  '/admin/emails': 'Emails',
  '/admin/settings': 'Settings',
  '/admin/users': 'SaaS Staff',
};

function getPageTitle(pathname: string): string {
  if (pathLabels[pathname]) return pathLabels[pathname];
  // Check prefixes for dynamic routes
  for (const [key, label] of Object.entries(pathLabels)) {
    if (pathname.startsWith(key + '/')) return label;
  }
  return 'Portal';
}

export function TopNavbar({ user, onMenuToggle }: { user: any; onMenuToggle?: () => void }) {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  
  // Notification Query
  const { data: notificationsData } = useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: async () => {
      const res = await apiClient.get('/notifications?isRead=false');
      return res.data.data;
    },
    refetchInterval: 30000, // Check every 30 seconds
  });

  const notifications = notificationsData || [];
  
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.patch(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const handleNotificationClick = (id: string) => {
    markAsReadMutation.mutate(id);
    // Might also route the user depending on the notification type in the future
  };

  const handleLogout = async () => {
    queryClient.clear();
    await signOut(auth);
  };

  const initial = user?.email?.charAt(0).toUpperCase() || 'U';
  const pageTitle = getPageTitle(pathname || '');

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-6 z-30 shrink-0 relative">
      {/* Left: Hamburger (mobile) + Page title */}
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            onClick={onMenuToggle}
            className="md:hidden p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className="text-base font-semibold text-slate-900 dark:text-white leading-tight">
            {pageTitle}
          </h1>
        </div>
      </div>

      {/* Right: Actions + User */}
      <div className="flex items-center gap-2">
        {/* Notification bell */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="relative p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white dark:border-slate-900"></span>
              </span>
            )}
          </button>
          
          {showNotifMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowNotifMenu(false)} />
              <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl z-20 overflow-hidden py-1">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Notifications</p>
                  <span className="text-xs bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-0.5 rounded-full font-medium">
                    {notifications.length} New
                  </span>
                </div>
                
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-slate-500">
                      <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm">No new notifications</p>
                    </div>
                  ) : (
                    notifications.map((n: any) => (
                      <div 
                        key={n.id} 
                        onClick={() => handleNotificationClick(n.id)}
                        className="px-4 py-3 border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                      >
                        <div className="flex gap-3">
                          <div className="mt-0.5 text-indigo-500">
                            <Info className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900 dark:text-white line-clamp-1">{n.subject}</p>
                            <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{n.message}</p>
                            <p className="text-[10px] text-slate-400 mt-1">
                              {n.createdAt?._seconds ? formatDistanceToNow(new Date(n.createdAt._seconds * 1000), { addSuffix: true }) : 'Just now'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(v => !v)}
            className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {initial}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight max-w-[120px] truncate">
                {user?.email}
              </p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide">{user?.userType || user?.saasRole}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />
              <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl z-20 overflow-hidden py-1">
                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{user?.email}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">{user?.userType || user?.saasRole}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
