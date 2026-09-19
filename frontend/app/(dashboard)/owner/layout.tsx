"use client";

import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { OwnerSidebar } from '@/components/layout/OwnerSidebar';
import { TopNavbar } from '@/components/layout/TopNavbar';

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const { dbUser, tenant, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!dbUser) {
        router.push('/login');
      } else if (dbUser.userType !== 'OWNER' && dbUser.userType !== 'MANAGER' && dbUser.userType !== 'STAFF') {
        router.push('/login');
      } else if (tenant) {
        // Operational UI Guard
        if (tenant.profileStatus === 'INCOMPLETE' || tenant.profileStatus === 'REJECTED') {
          if (pathname !== '/owner/onboarding') {
            router.push('/owner/onboarding');
          }
        } else if (tenant.profileStatus === 'PENDING') {
           // Allow them to stay on onboarding page to see the pending status
           if (pathname !== '/owner/onboarding') {
            router.push('/owner/onboarding');
           }
        }
      }
    }
  }, [dbUser, tenant, loading, router, pathname]);

  if (loading || !dbUser || !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // If on onboarding, don't show sidebar
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
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      <OwnerSidebar />
      <div className="flex-1 flex flex-col overflow-hidden w-full relative">
        <TopNavbar user={dbUser} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
