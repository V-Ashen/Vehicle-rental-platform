"use client";

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

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
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Recent Activity</h2>
        
        {metrics?.activity && metrics.activity.length > 0 ? (
          <div className="space-y-4">
            {metrics.activity.map((item: any) => (
              <div key={`${item.type}-${item.id}`} className="flex items-start p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                <div className={`p-2 rounded-full mr-4 ${item.type === 'TENANT' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>
                  {item.type === 'TENANT' ? (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1v1H9V7zm5 0h1v1h-1V7zm-5 4h1v1H9v-1zm5 0h1v1h-1v-1zm-5 4h1v1H9v-1zm5 0h1v1h-1v-1z" /></svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                    {item.title}
                  </p>
                  <p className="text-sm text-slate-500 truncate">
                    {item.description}
                  </p>
                </div>
                <div className="flex flex-col items-end space-y-2 ml-4">
                  <Badge variant="outline" className={
                    item.status === 'ACTIVE' || item.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    item.status === 'SUSPENDED' || item.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                    'bg-slate-100 text-slate-700'
                  }>
                    {item.status}
                  </Badge>
                  <span className="flex items-center text-xs text-slate-400">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 flex items-center justify-center h-48 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
            <p className="text-slate-500 font-medium">No recent activity found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
