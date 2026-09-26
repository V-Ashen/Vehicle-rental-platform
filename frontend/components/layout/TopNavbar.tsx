"use client";

import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useQueryClient } from '@tanstack/react-query';

export function TopNavbar({ user }: { user: any }) {
  const queryClient = useQueryClient();
  
  const handleLogout = async () => {
    queryClient.clear();
    await signOut(auth);
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 z-10 shadow-sm">
      <div className="flex items-center md:hidden">
        <span className="text-xl font-bold text-slate-900 dark:text-white">Admin</span>
      </div>
      
      <div className="hidden md:flex items-center">
        {/* Breadcrumb or Page Title can go here */}
      </div>

      <div className="flex items-center space-x-4">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">{user?.email}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{user?.userType}</p>
        </div>
        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200 shadow-inner">
          {user?.email?.charAt(0).toUpperCase() || 'A'}
        </div>
        <button 
          onClick={handleLogout}
          className="ml-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          title="Sign out"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </header>
  );
}
