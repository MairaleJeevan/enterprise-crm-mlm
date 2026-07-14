'use client';

import { useState, useEffect } from 'react';
import api from '../../../api';
import toast from 'react-hot-toast';
import { UserCheck, HelpCircle, Network, ArrowRight } from 'lucide-react';

export default function FounderAppointmentPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [nodes, setNodes] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedParent, setSelectedParent] = useState('');
  const [position, setPosition] = useState('LEFT');
  const [fee, setFee] = useState('25900000');
  const [installmentDetails, setInstallmentDetails] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [usersRes, nodesRes] = await Promise.all([
        api.get('/api/users'), // List of all users in system
        api.get('/api/mlm/downline'), // list of all MLM nodes to choose sponsor
      ]);
      
      // Filter out admins from eligible founders
      setUsers(usersRes.data.filter((u: any) => u.role !== 'ADMIN'));
      setNodes(nodesRes.data || []);
    } catch {
      // Fallback if downline endpoint fails due to missing parent
      try {
        const usersRes = await api.get('/api/users');
        setUsers(usersRes.data.filter((u: any) => u.role !== 'ADMIN'));
      } catch {
        toast.error('Failed to load user directories');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAppoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      toast.error('Please select a target user');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/api/admin-config/appoint-founder', {
        userId: selectedUser,
        parentId: selectedParent || undefined,
        position: selectedParent ? position : undefined,
        appointmentFee: parseFloat(fee),
      });

      toast.success('Member successfully appointed as Founder Member! 👑');
      setSelectedUser('');
      setSelectedParent('');
      setInstallmentDetails('');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Founder appointment failed');
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = 'mt-1 block w-full rounded-xl border border-slate-800 bg-slate-900/50 px-3.5 py-2.5 text-slate-200 outline-hidden text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors';
  const labelCls = 'text-xs font-semibold text-slate-400 block';

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
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Appoint Founder Member</h1>
        <p className="text-sm text-slate-400">Directly assign Founder Member privileges, select network placement points, and log installment agreements</p>
      </div>

      <div className="rounded-2xl border border-slate-900 bg-slate-950/20 p-6">
        <form onSubmit={handleAppoint} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* User Selection */}
            <div>
              <label className={labelCls}>Select User to Appoint</label>
              <select
                required
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className={inputCls}
              >
                <option value="">-- Choose User --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName || ''} ({u.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Appointment Fee */}
            <div>
              <label className={labelCls}>Appointment Fee (INR)</label>
              <input
                type="number"
                required
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                className={inputCls}
                placeholder="25900000"
              />
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-900 pt-6">
            <div className="md:col-span-3">
              <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1 uppercase tracking-wider font-mono">
                <Network className="h-4 w-4 text-indigo-400" /> Organizational Placement (Optional)
              </h3>
              <p className="text-[10px] text-slate-500 mt-1">If specified, this connects the new Founder to the selected upline team. Leave empty for root placement.</p>
            </div>

            {/* Select Sponsor Upline */}
            <div className="md:col-span-2">
              <label className={labelCls}>Sponsor Upline Member</label>
              <select
                value={selectedParent}
                onChange={(e) => setSelectedParent(e.target.value)}
                className={inputCls}
              >
                <option value="">Root / Direct</option>
                {nodes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.user?.firstName} {n.user?.lastName || ''} — Rank: {n.rank}
                  </option>
                ))}
              </select>
            </div>

            {/* Binary Position */}
            <div>
              <label className={labelCls}>Leg Position</label>
              <select
                disabled={!selectedParent}
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className={inputCls}
              >
                <option value="LEFT">LEFT Leg</option>
                <option value="RIGHT">RIGHT Leg</option>
              </select>
            </div>
          </div>

          {/* Installment details */}
          <div className="border-t border-slate-900 pt-6">
            <label className={labelCls}>Installment / Payment Details</label>
            <textarea
              value={installmentDetails}
              onChange={(e) => setInstallmentDetails(e.target.value)}
              placeholder="e.g. Initial token payment of ₹50 Lakhs processed. Balance ₹2.09 Crore scheduled in 3 monthly installments."
              className="mt-1 block w-full rounded-xl border border-slate-800 bg-slate-900/50 px-3.5 py-2.5 text-slate-200 outline-hidden text-sm h-24 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white hover:bg-indigo-500 active:scale-95 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
          >
            Appoint Founder Member <ArrowRight className="h-4 w-4" />
          </button>

        </form>
      </div>

      <div className="rounded-2xl border border-slate-900 bg-slate-950/30 p-5 flex items-start gap-3">
        <HelpCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-slate-300">Founders Auto-Exit Mechanics</h4>
          <p className="text-[10px] text-slate-500 leading-relaxed">
            All Founder Members (whether promoted organically or appointed directly) have their earnings capped at ₹2.59 Crore. When their cumulative payout reaches this threshold, they successfully exit the network, receiving a final 2% bonus (₹5.18 Lakhs) and a recognition certificate.
          </p>
        </div>
      </div>

    </div>
  );
}
