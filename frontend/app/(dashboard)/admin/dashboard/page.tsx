"use client";

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const res = await apiClient.get('/admin/dashboard/metrics');
        setMetrics(res.data.data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch metrics');
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="flex space-x-4 animate-pulse">
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-slate-200 dark:bg-slate-700 h-32 w-full rounded-xl"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 font-medium p-4 bg-red-50 rounded-xl border border-red-100">{error}</div>;
  }

  const statCards = [
    { title: 'Total Businesses', value: metrics?.totalBusinesses || 0, color: 'bg-blue-50 text-blue-700 border-blue-200' },
    { title: 'Active Subscriptions', value: metrics?.totalActiveSubscriptions || 0, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { title: 'Trial Businesses', value: metrics?.trialBusinesses || 0, color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { title: 'Suspended Accounts', value: metrics?.suspendedBusinesses || 0, color: 'bg-red-50 text-red-700 border-red-200' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Platform Overview</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">High-level metrics for your SaaS platform.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className={`p-6 rounded-2xl border shadow-sm ${stat.color} transition-all hover:shadow-md`}>
            <h3 className="text-sm font-semibold uppercase tracking-wider opacity-80">{stat.title}</h3>
            <p className="mt-4 text-4xl font-extrabold tracking-tight">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Activity</h2>
        <div className="mt-6 flex items-center justify-center h-48 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
          <p className="text-slate-500 font-medium">Activity feed coming in next phase.</p>
        </div>
      </div>
    </div>
  );
}
