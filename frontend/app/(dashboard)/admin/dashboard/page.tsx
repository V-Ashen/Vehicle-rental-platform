"use client";

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, CreditCard, TrendingUp, AlertTriangle,
  Clock, Activity, ChevronRight, BarChart3
} from 'lucide-react';

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
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-64 bg-slate-800 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-slate-800/60 h-36 rounded-2xl border border-slate-700/50" />
          ))}
        </div>
        <div className="bg-slate-800/60 h-96 rounded-2xl border border-slate-700/50" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-5 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400">
        <AlertTriangle className="w-5 h-5 shrink-0" />
        <span className="font-medium">{error}</span>
      </div>
    );
  }

  const statCards = [
    { 
      title: 'Total Businesses', 
      value: metrics?.totalBusinesses || 0, 
      icon: Building2,
      gradient: 'from-blue-600 to-blue-400',
      glow: 'shadow-blue-500/20',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      text: 'text-blue-400'
    },
    { 
      title: 'Active Subscriptions', 
      value: metrics?.totalActiveSubscriptions || 0, 
      icon: TrendingUp,
      gradient: 'from-emerald-600 to-emerald-400',
      glow: 'shadow-emerald-500/20',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      text: 'text-emerald-400'
    },
    { 
      title: 'Trial Businesses', 
      value: metrics?.trialBusinesses || 0, 
      icon: BarChart3,
      gradient: 'from-amber-600 to-amber-400',
      glow: 'shadow-amber-500/20',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-400'
    },
    { 
      title: 'Suspended Accounts', 
      value: metrics?.suspendedBusinesses || 0, 
      icon: AlertTriangle,
      gradient: 'from-rose-600 to-rose-400',
      glow: 'shadow-rose-500/20',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      text: 'text-rose-400'
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Platform Overview</h1>
        <p className="mt-1 text-slate-400 text-sm">High-level metrics for your SaaS platform.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className={`relative overflow-hidden rounded-2xl border ${stat.border} ${stat.bg} backdrop-blur-sm p-6 shadow-lg ${stat.glow} transition-all hover:scale-[1.02] hover:shadow-xl`}>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{stat.title}</p>
                <div className={`w-9 h-9 rounded-xl ${stat.bg} border ${stat.border} flex items-center justify-center`}>
                  <Icon className={`w-4.5 h-4.5 ${stat.text}`} />
                </div>
              </div>
              <p className={`text-4xl font-extrabold tracking-tight ${stat.text}`}>{stat.value}</p>
              {/* Decorative gradient orb */}
              <div className={`absolute -bottom-4 -right-4 w-24 h-24 rounded-full bg-gradient-to-br ${stat.gradient} opacity-10 blur-xl`} />
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-800/60 shadow-xl overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-800/60">
          <div className="w-8 h-8 rounded-lg bg-rose-500/15 border border-rose-500/20 flex items-center justify-center">
            <Activity className="w-4 h-4 text-rose-400" />
          </div>
          <h2 className="text-base font-semibold text-white">Recent Activity</h2>
        </div>
        
        {metrics?.activity && metrics.activity.length > 0 ? (
          <div className="divide-y divide-slate-800/60">
            {metrics.activity.map((item: any) => (
              <div key={`${item.type}-${item.id}`} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-800/30 transition-colors group">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${item.type === 'TENANT' ? 'bg-blue-500/15 border border-blue-500/20' : 'bg-purple-500/15 border border-purple-500/20'}`}>
                  {item.type === 'TENANT' ? (
                    <Building2 className="w-4 h-4 text-blue-400" />
                  ) : (
                    <CreditCard className="w-4 h-4 text-purple-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-200 truncate">{item.title}</p>
                  <p className="text-xs text-slate-500 truncate">{item.description}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <Badge className={
                    item.status === 'ACTIVE' || item.status === 'APPROVED' 
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20 text-xs' :
                    item.status === 'SUSPENDED' || item.status === 'REJECTED' 
                      ? 'bg-rose-500/15 text-rose-400 border-rose-500/20 text-xs' :
                      'bg-slate-700/50 text-slate-400 border-slate-600/50 text-xs'
                  }>
                    {item.status}
                  </Badge>
                  <span className="flex items-center text-xs text-slate-600">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-52 text-center">
            <Activity className="w-10 h-10 text-slate-700 mb-3" />
            <p className="text-slate-500 font-medium text-sm">No recent activity found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
