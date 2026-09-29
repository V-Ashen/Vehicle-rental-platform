"use client";

import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { OwnerSidebar } from '@/components/layout/OwnerSidebar';
import { TopNavbar } from '@/components/layout/TopNavbar';

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const { dbUser, tenant, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (!dbUser) {
        router.push('/login');
      } else if (dbUser.userType !== 'OWNER' && dbUser.userType !== 'MANAGER' && dbUser.userType !== 'STAFF') {
        router.push('/login');
      } else if (tenant) {
        if (tenant.profileStatus === 'INCOMPLETE' || tenant.profileStatus === 'REJECTED') {
          if (pathname !== '/owner/onboarding') {
            router.push('/owner/onboarding');
          }
        } else if (tenant.profileStatus === 'PENDING') {
          if (pathname !== '/owner/onboarding') {
            router.push('/owner/onboarding');
          }
        }
      }
    }
  }, [dbUser, tenant, loading, router, pathname]);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (loading || !dbUser || !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 animate-pulse">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l14 9-14 9V3z" />
            </svg>
          </div>
          <div className="w-48 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      </div>
    );
  }

  // Onboarding — no sidebar
  if (pathname === '/owner/onboarding') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col">
        <TopNavbar user={dbUser} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <OwnerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <TopNavbar user={dbUser} onMenuToggle={() => setSidebarOpen(v => !v)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
