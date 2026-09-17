"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { apiClient } from '@/lib/api';

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      const res = await apiClient.post('/auth/login');
      const user = res.data.data.user;
      
      if (user?.userType === 'SAAS_ADMIN') router.push('/admin/dashboard');
      else router.push('/owner/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const token = await result.user.getIdToken();
      
      const res = await apiClient.post('/auth/google', { token });
      const user = res.data.data.user;
      
      if (user?.userType === 'SAAS_ADMIN') router.push('/admin/dashboard');
      else router.push('/owner/dashboard');
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleEmailLogin} className="space-y-6">
      {error && <div className="text-red-500 text-sm font-medium text-center bg-red-50 py-2 rounded">{error}</div>}
      
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
        <input 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          placeholder="you@company.com"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Password</label>
        <input 
          type="password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          placeholder="••••••••"
        />
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 transition-all"
      >
        {loading ? 'Signing in...' : 'Sign in'}
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200 dark:border-slate-700" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-slate-800 text-slate-500">Or continue with</span>
        </div>
      </div>

      <button 
        type="button" 
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full flex justify-center items-center gap-3 py-3 px-4 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm text-sm font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Google
      </button>

      <div className="text-center text-sm text-slate-600 dark:text-slate-400 mt-6">
        Don't have an account?{' '}
        <a href="/register" className="font-semibold text-indigo-600 hover:text-indigo-500 transition-colors">
          Register here
        </a>
      </div>
    </form>
  );
}
