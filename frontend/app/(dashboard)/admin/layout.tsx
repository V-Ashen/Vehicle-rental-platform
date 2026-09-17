"use client";

import { useAuth } from '@/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { TopNavbar } from '@/components/layout/TopNavbar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { dbUser, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!dbUser) {
        router.push('/login');
      } else if (dbUser.userType !== 'SAAS_ADMIN') {
        router.push('/login'); // Or a 403 unauthorized page
      }
    }
  }, [dbUser, loading, router]);

  if (loading || !dbUser || dbUser.userType !== 'SAAS_ADMIN') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900">
      <AdminSidebar currentPath={pathname} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavbar user={dbUser} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
