'use client';

import { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { FileText, ShieldAlert, Award, Calendar, DollarSign, Activity } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

export default function MyPolicyPage() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPolicies = async () => {
    try {
      const res = await api.get('/api/policy/my');
      setPolicies(res.data);
    } catch {
      toast.error('Failed to load assigned policy details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <svg className="h-8 w-8 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (policies.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-900 bg-slate-950/20 p-8 text-center max-w-2xl mx-auto space-y-4 my-10">
        <ShieldAlert className="h-12 w-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold">No Policy Assigned Yet</h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          Once your KYC documents have been reviewed and approved by the back office, we schedule a welcome call. Following the call, our underwriting team assigns your base insurance policy.
        </p>
        <div className="rounded-xl bg-slate-900/50 p-4 inline-block text-xs font-mono text-slate-400">
          Status: Awaiting Welcome Onboarding
        </div>
      </div>
    );
  }

  // Use the primary/latest assigned policy for the chart display
  const primaryPolicy = policies[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Assigned Policies</h1>
        <p className="text-sm text-slate-400">Monitor active coverage parameters, premium schedules, and benefit growth indices</p>
      </div>

      {/* Main Grid: Policy Card & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Policy Document Badge Card */}
        <div className="lg:col-span-1 rounded-2xl border border-slate-900 bg-gradient-to-b from-slate-950/30 to-indigo-950/5 p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Policy Number</span>
                <p className="font-mono font-bold text-slate-200">{primaryPolicy.policyNumber}</p>
              </div>
            </div>

            <div className="border-t border-slate-900 pt-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Plan Type</span>
                <span className="font-semibold text-slate-300">{primaryPolicy.policyType} Plan</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Coverage sum</span>
                <span className="font-bold text-emerald-400">₹{primaryPolicy.coverageAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Premium Cost</span>
                <span className="font-bold text-indigo-400">₹{primaryPolicy.premiumAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Frequency</span>
                <span className="font-semibold text-slate-300">{primaryPolicy.premiumFrequency}</span>
              </div>
            </div>

            <div className="border-t border-slate-900 pt-4 space-y-2 text-xs">
              <h3 className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">Beneficiary / Nominee</h3>
              <div className="flex justify-between">
                <span className="text-slate-500">Nominee Name</span>
                <span className="font-semibold text-slate-300">{primaryPolicy.policyNomineeName || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Relationship</span>
                <span className="font-semibold text-slate-300">{primaryPolicy.policyNomineeRelationship || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-900 pt-4">
            <span className={`w-full block text-center rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider ${
              primaryPolicy.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-400'
            }`}>
              {primaryPolicy.status}
            </span>
          </div>
        </div>

        {/* Coverage Chart Card */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-900 bg-slate-950/20 p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2"><Activity className="h-5 w-5 text-indigo-400" /> Premium Growth & Coverage Cap</h2>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">Real-time stats</span>
          </div>

          {/* Recharts Chart Container */}
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={primaryPolicy.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPremium" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCoverage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
                <XAxis dataKey="month" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }} 
                  labelStyle={{ color: '#94a3b8', fontSize: '12px', fontWeight: 'bold' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'semibold' }} />
                <Area name="Premium Cumulative (₹)" type="monotone" dataKey="premiumPaid" stroke="#6366f1" fillOpacity={1} fill="url(#colorPremium)" strokeWidth={2} />
                <Area name="Coverage Volume (₹)" type="monotone" dataKey="coverageGrowth" stroke="#10b981" fillOpacity={1} fill="url(#colorCoverage)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Date Timelines Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-slate-900 bg-slate-950/30 p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Policy Term Start</span>
            <span className="font-semibold text-slate-200 text-sm">
              {new Date(primaryPolicy.startDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-900 bg-slate-950/30 p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Policy Term End</span>
            <span className="font-semibold text-slate-200 text-sm">
              {new Date(primaryPolicy.endDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-900 bg-slate-950/30 p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Total Covered Assets</span>
            <span className="font-semibold text-slate-200 text-sm">₹{primaryPolicy.coverageAmount.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
