'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../../api';
import { DollarSign, TrendingUp, Clock, XCircle, Search, Star, FileText } from 'lucide-react';

export default function AdminPaymentDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchData = async (q?: string) => {
    setLoading(true);
    try {
      const [statsRes, paymentsRes] = await Promise.all([
        api.get('/api/payments/stats'),
        api.get('/api/payments', { params: q ? { search: q } : {} }),
      ]);
      setStats(statsRes.data);
      setPayments(paymentsRes.data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(search);
  };

  const statusColor: Record<string, string> = {
    CAPTURED: 'bg-emerald-500/10 text-emerald-400',
    PENDING: 'bg-amber-500/10 text-amber-400',
    FAILED: 'bg-red-500/10 text-red-400',
    REFUNDED: 'bg-purple-500/10 text-purple-400',
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center">
            <Star className="h-5 w-5 text-white" />
          </div>
          Gold Card Payments
        </h1>
        <p className="text-sm text-slate-400 mt-1">Monitor all Gold Membership Card transactions</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Revenue', value: `₹${(stats.totalRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: "Today's Collection", value: `₹${(stats.todayRevenue || 0).toLocaleString('en-IN')}`, icon: TrendingUp, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
            { label: 'Pending', value: stats.pendingPayments, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
            { label: 'Failed', value: stats.failedPayments, icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
          ].map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="rounded-xl border border-slate-800 bg-slate-950/50 p-5 flex items-center gap-4">
                <div className={`h-10 w-10 rounded-lg ${stat.bg} flex items-center justify-center ${stat.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium">{stat.label}</p>
                  <p className="text-xl font-bold text-slate-100 mt-0.5">{stat.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, phone, card number, payment ID..."
            className="w-full rounded-lg border border-slate-700 bg-slate-900 pl-9 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>
        <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors">
          Search
        </button>
        {search && (
          <button type="button" onClick={() => { setSearch(''); fetchData(); }} className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors">
            Clear
          </button>
        )}
      </form>

      {/* Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/50">
                {['Customer', 'Card Number', 'Amount', 'Advisor', 'Payment ID', 'Status', 'Date', 'Actions'].map((h) => (
                  <th key={h} className="text-left text-slate-500 uppercase tracking-wider px-4 py-3 font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-800/50">
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-slate-800 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-slate-500 py-12">No payments found</td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.id} className="border-b border-slate-800/50 hover:bg-slate-900/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-slate-200 font-medium">{p.customer?.firstName} {p.customer?.lastName || ''}</p>
                      <p className="text-slate-500 text-[10px]">{p.customer?.phone}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-amber-400">{p.goldCard?.cardNumber || '—'}</td>
                    <td className="px-4 py-3 font-bold text-slate-200">₹{(p.amount || 0).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-slate-300">{p.advisor?.firstName} {p.advisor?.lastName || ''}</td>
                    <td className="px-4 py-3 font-mono text-slate-500 text-[10px] max-w-[100px] truncate">{p.razorpayPaymentId || p.razorpayOrderId}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusColor[p.status] || 'bg-slate-700 text-slate-300'}`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{new Date(p.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => router.push(`/dashboard/gold-card/invoice/${p.id}`)}
                          className="rounded bg-slate-800 p-1.5 hover:bg-slate-700 transition-colors text-slate-400 hover:text-slate-200"
                          title="View Invoice"
                        >
                          <FileText className="h-3 w-3" />
                        </button>
                        {p.goldCard && (
                          <button
                            onClick={() => router.push(`/dashboard/gold-card/card/${p.id}`)}
                            className="rounded bg-amber-500/10 p-1.5 hover:bg-amber-500/20 transition-colors text-amber-400"
                            title="View Card"
                          >
                            <Star className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary */}
      <p className="text-xs text-slate-600 text-center">{payments.length} payment{payments.length !== 1 ? 's' : ''} displayed</p>
    </div>
  );
}
