'use client';

import { useState, useEffect } from 'react';
import api from '../../../api';
import toast from 'react-hot-toast';
import { FileText, ShieldCheck, User, Calendar, DollarSign, Activity } from 'lucide-react';

export default function PolicyAssignPage() {
  const [verifiedUsers, setVerifiedUsers] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [policyType, setPolicyType] = useState('Life');
  const [coverage, setCoverage] = useState('1000000');
  const [premium, setPremium] = useState('5000');
  const [frequency, setFrequency] = useState('Monthly');
  const [nomineeName, setNomineeName] = useState('');
  const [nomineeRel, setNomineeRel] = useState('');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [activePolicies, setActivePolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      const [usersRes, policiesRes] = await Promise.all([
        api.get('/api/users'),
        api.get('/api/policy/all'),
      ]);

      // Only allow verified advisors who don't have policies yet, or verified advisors
      const verified = usersRes.data.filter(
        (u: any) => u.kycStatus === 'VERIFIED' && u.role === 'MLM_DISTRIBUTOR'
      );
      setVerifiedUsers(verified);
      setActivePolicies(policiesRes.data);
    } catch {
      toast.error('Failed to load verified advisor registries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      toast.error('Please select a target advisor');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/api/policy/assign', {
        userId: selectedUser,
        policyType,
        coverageAmount: parseFloat(coverage),
        premiumAmount: parseFloat(premium),
        premiumFrequency: frequency,
        startDate,
        endDate,
        policyNomineeName: nomineeName,
        policyNomineeRelationship: nomineeRel,
        policyHolderDob: dob || undefined,
        policyHolderAddress: address || undefined,
      });

      toast.success('Insurance policy underwritten and assigned successfully! 📜');
      setSelectedUser('');
      setNomineeName('');
      setNomineeRel('');
      setDob('');
      setAddress('');
      setStartDate('');
      setEndDate('');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to assign policy');
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
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Assign Advisor Policies</h1>
        <p className="text-sm text-slate-400">Issue custom insurance policy documents for verified advisors to display on their portals</p>
      </div>

      {/* Main Grid: Assign Form & Active Registry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Underwriting assignment form */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-900 bg-slate-950/20 p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-1.5 border-b border-slate-900 pb-3">
            <FileText className="h-4 w-4 text-indigo-400" /> New Policy Assignment
          </h2>

          <form onSubmit={handleAssign} className="space-y-4">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Select Verified Advisor</label>
                <select
                  required
                  value={selectedUser}
                  onChange={(e) => setSelectedUser(e.target.value)}
                  className={inputCls}
                >
                  <option value="">-- Choose Advisor --</option>
                  {verifiedUsers.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.firstName} {u.lastName || ''} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Policy Type</label>
                <select
                  value={policyType}
                  onChange={(e) => setPolicyType(e.target.value)}
                  className={inputCls}
                >
                  <option value="Life">Life Insurance</option>
                  <option value="Health">Health Insurance</option>
                  <option value="Term">Term Insurance</option>
                  <option value="Endowment">Endowment Plan</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>Coverage Sum (INR)</label>
                <input
                  type="number" required
                  value={coverage} onChange={(e) => setCoverage(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Premium Cost (INR)</label>
                <input
                  type="number" required
                  value={premium} onChange={(e) => setPremium(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Payment Schedule</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className={inputCls}
                >
                  <option value="Monthly">Monthly Cycle</option>
                  <option value="Quarterly">Quarterly Cycle</option>
                  <option value="Yearly">Yearly Cycle</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-900 pt-4">
              <div>
                <label className={labelCls}>Nominee Full Name</label>
                <input
                  type="text" required
                  value={nomineeName} onChange={(e) => setNomineeName(e.target.value)}
                  className={inputCls} placeholder="Mary Doe"
                />
              </div>
              <div>
                <label className={labelCls}>Relationship to Nominee</label>
                <input
                  type="text" required
                  value={nomineeRel} onChange={(e) => setNomineeRel(e.target.value)}
                  className={inputCls} placeholder="Spouse"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Policy Start Date</label>
                <input
                  type="date" required
                  value={startDate} onChange={(e) => setStartDate(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Policy End Date</label>
                <input
                  type="date" required
                  value={endDate} onChange={(e) => setEndDate(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3.5 text-sm font-semibold text-white hover:bg-indigo-500 active:scale-95 transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
            >
              Assign Policy Documentation
            </button>

          </form>
        </div>

        {/* Active policies counter summary */}
        <div className="rounded-2xl border border-slate-900 bg-slate-950/30 p-6 flex flex-col justify-between items-center text-center">
          <div className="space-y-4">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Assigned Policies</span>
            <p className="text-4xl font-black text-slate-200">{activePolicies.length}</p>
            <span className="text-[10px] text-slate-500 block">Total issued underwritten portfolios</span>
          </div>

          <div className="border-t border-slate-900 pt-6 w-full text-xs text-slate-400 space-y-3 font-mono text-left">
            <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Underwriting SLA</h4>
            <p>✔ Auto-verification checks</p>
            <p>✔ Welcome call schedules</p>
            <p>✔ Nominee allocations</p>
          </div>
        </div>

      </div>

      {/* Active policies list */}
      <div className="rounded-2xl border border-slate-900 bg-slate-950/20 overflow-hidden">
        <div className="p-5 border-b border-slate-900">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">Assigned Policies Registry</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead>
              <tr className="border-b border-slate-900 bg-slate-950/40 text-slate-500 text-xs uppercase font-mono">
                <th className="py-4 px-6">Policy Number</th>
                <th className="py-4 px-6">Advisor Name</th>
                <th className="py-4 px-6">Plan Type</th>
                <th className="py-4 px-6">Coverage sum</th>
                <th className="py-4 px-6">Premium Cost</th>
                <th className="py-4 px-6 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {activePolicies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">No active policies issued yet.</td>
                </tr>
              ) : (
                activePolicies.map((policy) => (
                  <tr key={policy.id} className="hover:bg-slate-900/10 transition-colors text-xs">
                    <td className="py-4 px-6 font-mono font-bold text-slate-200">{policy.policyNumber}</td>
                    <td className="py-4 px-6 font-semibold">
                      {policy.user ? `${policy.user.firstName} ${policy.user.lastName || ''}`.trim() : 'N/A'}
                    </td>
                    <td className="py-4 px-6">{policy.policyType} Plan</td>
                    <td className="py-4 px-6 font-bold text-slate-300">₹{policy.coverageAmount.toLocaleString()}</td>
                    <td className="py-4 px-6 text-indigo-400 font-bold">₹{policy.premiumAmount.toLocaleString()} / {policy.premiumFrequency}</td>
                    <td className="py-4 px-6 text-center">
                      <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        policy.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {policy.status}
                      </span>
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
