'use client';

import { useState, useEffect } from 'react';
import api from '../../../api';
import toast from 'react-hot-toast';
import { Settings, RefreshCw, Calendar, FileText, ShieldAlert } from 'lucide-react';

export default function JoiningFeeConfigPage() {
  const [config, setConfig] = useState<any>(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [configRes, logsRes] = await Promise.all([
        api.get('/api/admin-config/joining-fee'),
        api.get('/api/admin-config/joining-fee/logs'),
      ]);
      setConfig(configRes.data);
      setAmount(configRes.data?.amount?.toString() || '3500');
      setLogs(logsRes.data);
    } catch {
      toast.error('Failed to load joining fee configurations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      await api.post('/api/admin-config/joining-fee', {
        amount: parseFloat(amount),
        reason,
      });
      toast.success('Joining fee configuration updated successfully!');
      setReason('');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update joining fee');
      setLoading(false);
    }
  };

  if (loading && !config) {
    return (
      <div className="flex h-64 items-center justify-center">
        <svg className="h-8 w-8 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Gold Card Joining Fee Config</h1>
        <p className="text-sm text-slate-400">Configure the default onboarding registration fee and review historical change audit logs</p>
      </div>

      {/* Configuration Form Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Settings inputs */}
        <div className="md:col-span-2 rounded-2xl border border-slate-900 bg-slate-950/20 p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5">
            <Settings className="h-4 w-4 text-indigo-400" /> Active Configuration
          </h2>

          <form onSubmit={handleUpdateFee} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-400 block">Joining Fee Amount (INR)</label>
              <input
                type="number" required min="1" step="1"
                value={amount} onChange={(e) => setAmount(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-900/50 px-3.5 py-2.5 text-slate-200 outline-hidden text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="3500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 block">Reason for Update</label>
              <input
                type="text" required
                value={reason} onChange={(e) => setReason(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-900/50 px-3.5 py-2.5 text-slate-200 outline-hidden text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                placeholder="e.g. Festive discount, or standard rate adjustment"
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 active:scale-95 transition-all shadow-lg shadow-indigo-600/20"
            >
              Update Configured Fee
            </button>
          </form>
        </div>

        {/* Current status display */}
        <div className="rounded-2xl border border-slate-900 bg-slate-950/30 p-6 flex flex-col justify-between items-center text-center">
          <div className="space-y-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Currently Active</span>
            <p className="text-3xl font-black text-slate-200">₹{config?.amount?.toLocaleString() || '3,500'}</p>
            <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
              Live & Charging
            </span>
          </div>

          <div className="border-t border-slate-900 pt-4 w-full text-xs text-slate-500 space-y-1 font-mono">
            <p>Currency: {config?.currency || 'INR'}</p>
            <p>Effective: {config?.effectiveFrom ? new Date(config.effectiveFrom).toLocaleDateString() : 'N/A'}</p>
          </div>
        </div>

      </div>

      {/* History table */}
      <div className="rounded-2xl border border-slate-900 bg-slate-950/20 overflow-hidden">
        <div className="p-5 border-b border-slate-900 flex items-center justify-between">
          <h2 className="text-sm font-bold flex items-center gap-1.5 text-slate-300">
            <FileText className="h-4 w-4 text-indigo-400" /> Revision History Log
          </h2>
          <span className="text-[10px] text-slate-500 font-mono">Audit Ready</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead>
              <tr className="border-b border-slate-900 bg-slate-950/40 text-slate-500 text-xs uppercase font-mono">
                <th className="py-4 px-6">Date Changed</th>
                <th className="py-4 px-6">Previous Fee</th>
                <th className="py-4 px-6">New Fee</th>
                <th className="py-4 px-6">Adjusted By</th>
                <th className="py-4 px-6">Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">No revisions logged. Active value is running on seed default.</td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/10 transition-colors text-xs">
                    <td className="py-4 px-6 font-mono text-slate-500">
                      {new Date(log.changedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </td>
                    <td className="py-4 px-6 font-bold">
                      {log.previousAmount ? `₹${log.previousAmount.toLocaleString()}` : 'N/A'}
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-200">
                      ₹{log.newAmount.toLocaleString()}
                    </td>
                    <td className="py-4 px-6 font-mono">{log.changedBy?.slice(-8) || 'System'}</td>
                    <td className="py-4 px-6 italic text-slate-400">{log.reason || 'N/A'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
