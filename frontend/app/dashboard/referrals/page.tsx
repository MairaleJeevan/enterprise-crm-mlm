'use client';

import { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { Copy, QrCode, TrendingUp, Users, DollarSign } from 'lucide-react';

export default function ReferralsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/api/referrals/dashboard');
      setData(res.data);
    } catch {
      toast.error('Failed to load referral metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleCopyLink = () => {
    if (!data) return;
    const link = `https://enterprise-crm-mlm.vercel.app/login?ref=${data.referralCode}`;
    navigator.clipboard.writeText(link);
    toast.success('Referral link copied to clipboard!');
  };

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Referral Dashboard</h1>
        <p className="text-sm text-slate-400">Exclusively share your invite code, expand your downline, and track sponsor conversions</p>
      </div>

      {/* Main Referral Info Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sharing Details Card */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-900 bg-slate-950/20 p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-lg font-bold">Your Unique Invite</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Share this code with your contacts. When they register and purchase a Gold Card, they will join your downline, and you will receive a flat <strong>₹500.00</strong> referral bonus directly.
            </p>

            <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/50 p-3 select-all font-mono text-sm justify-between">
              <span className="text-indigo-400 font-bold tracking-wider">{data?.referralCode}</span>
              <button
                onClick={handleCopyLink}
                className="rounded-lg p-2 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                title="Copy Invite Link"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>

          <button
            onClick={handleCopyLink}
            className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 active:scale-95 transition-all shadow-lg shadow-indigo-600/20"
          >
            Copy My Share Link
          </button>
        </div>

        {/* QR Code Card */}
        <div className="rounded-2xl border border-slate-900 bg-slate-950/20 p-6 flex flex-col items-center justify-center space-y-4">
          <h2 className="text-sm font-bold flex items-center gap-1.5 text-slate-300">
            <QrCode className="h-4 w-4 text-indigo-400" /> Scan QR to Join
          </h2>
          <div className="rounded-2xl bg-white p-3 shadow-xl">
            {data?.qrCode ? (
              <img src={data.qrCode} alt="Referral QR Code" className="h-40 w-40" />
            ) : (
              <div className="h-40 w-40 bg-slate-200 flex items-center justify-center text-slate-400 text-xs">Generating QR...</div>
            )}
          </div>
          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">REF-LINK-ENCODED</span>
        </div>
      </div>

      {/* Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-slate-900 bg-slate-950/30 p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Recruits</span>
            <Users className="h-5 w-5 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-slate-100">{data?.totalReferrals || 0}</p>
          <span className="text-[10px] text-slate-500 block">Total downline registrations linked</span>
        </div>

        <div className="rounded-2xl border border-slate-900 bg-slate-950/30 p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Conversions</span>
            <TrendingUp className="h-5 w-5 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-slate-100">{data?.successfulReferrals || 0}</p>
          <span className="text-[10px] text-slate-500 block">
            {data?.totalReferrals > 0 
              ? `${((data.successfulReferrals / data.totalReferrals) * 100).toFixed(0)}% conversion rate` 
              : '0% conversion rate'}
          </span>
        </div>

        <div className="rounded-2xl border border-slate-900 bg-slate-950/30 p-5 space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Referral Earnings</span>
            <DollarSign className="h-5 w-5 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-slate-100">₹{(data?.referralEarnings || 0).toFixed(2)}</p>
          <span className="text-[10px] text-slate-500 block">Credited sponsor payout balance</span>
        </div>
      </div>

      {/* History Table */}
      <div className="rounded-2xl border border-slate-900 bg-slate-950/20 overflow-hidden">
        <div className="p-5 border-b border-slate-900">
          <h2 className="text-lg font-bold">Referral Signups & Progress</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead>
              <tr className="border-b border-slate-900 bg-slate-950/40 text-slate-500 text-xs uppercase font-mono">
                <th className="py-4 px-6">Name</th>
                <th className="py-4 px-6">Email</th>
                <th className="py-4 px-6">Date Joined</th>
                <th className="py-4 px-6">KYC Status</th>
                <th className="py-4 px-6">Earned Credit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {data?.history?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">No referrers have registered under your code yet.</td>
                </tr>
              ) : (
                data?.history?.map((h: any) => (
                  <tr key={h.id} className="hover:bg-slate-900/10 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-200">
                      {h.referredUser ? `${h.referredUser.firstName} ${h.referredUser.lastName || ''}`.trim() : 'Anonymous User'}
                    </td>
                    <td className="py-4 px-6 font-mono text-xs">{h.referredUser?.email || 'N/A'}</td>
                    <td className="py-4 px-6 text-xs text-slate-500">
                      {new Date(h.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        h.referredUser?.kycStatus === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-400' :
                        h.referredUser?.kycStatus === 'SUBMITTED' ? 'bg-indigo-500/10 text-indigo-400' :
                        h.referredUser?.kycStatus === 'REJECTED' ? 'bg-red-500/10 text-red-400' : 'bg-slate-800/40 text-slate-400'
                      }`}>
                        {h.referredUser?.kycStatus || 'PENDING'}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-200">
                      {h.status === 'PAID' ? `₹${h.commissionAmount.toFixed(2)}` : 'Held (Pending Gold Card)'}
                    </td>
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
