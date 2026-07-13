'use client';

import { useState, useEffect } from 'react';
import api from '../../api';
import toast from 'react-hot-toast';
import { Plus, User, Phone, Mail, Award, X } from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [franchises, setFranchises] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [franchiseId, setFranchiseId] = useState('');
  const [isGoldMember, setIsGoldMember] = useState(false);

  const fetchData = async () => {
    try {
      const [custRes, franRes] = await Promise.all([
        api.get('/api/customers'),
        api.get('/api/franchises'),
      ]);
      setCustomers(custRes.data);
      setFranchises(franRes.data);
    } catch {
      toast.error('Failed to retrieve customer accounts');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/api/customers', {
        firstName,
        lastName: lastName || undefined,
        email: email || undefined,
        phone,
        address: address || undefined,
        city: city || undefined,
        state: state || undefined,
        pincode: pincode || undefined,
        franchiseId: franchiseId || undefined,
        isGoldMember,
        goldCardId: isGoldMember ? `GOLD-MAN-${Math.floor(1000 + Math.random() * 9000)}` : undefined,
      });

      toast.success('Customer registered successfully!');
      setShowModal(false);
      fetchData();
      // Clear forms
      setFirstName('');
      setLastName('');
      setEmail('');
      setPhone('');
      setAddress('');
      setCity('');
      setState('');
      setPincode('');
      setFranchiseId('');
      setIsGoldMember(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to register customer');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleGold = async (id: string, currentStatus: boolean) => {
    try {
      const newStatus = !currentStatus;
      const goldCardId = newStatus ? `GOLD-MAN-${Math.floor(1000 + Math.random() * 9000)}` : null;
      await api.patch(`/api/customers/${id}`, {
        isGoldMember: newStatus,
        goldCardId,
      });
      toast.success(newStatus ? 'Upgraded customer to Gold Member!' : 'Removed Gold Membership');
      fetchData();
    } catch {
      toast.error('Failed to change customer membership status');
    }
  };

  const inputCls = 'mt-1 w-full rounded-lg border border-slate-800 bg-slate-900/50 px-3 py-2.5 text-slate-200 outline-hidden text-base sm:text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors';
  const labelCls = 'text-xs font-semibold text-slate-400';

  return (
    <div className="space-y-6">
      {/* Header — stacks on mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Customer Accounts</h1>
          <p className="text-sm text-slate-400">Manage buyer registrations and Gold Membership settings</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-indigo-500 w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" /> Add Customer
        </button>
      </div>

      {/* ── Desktop Table (hidden on mobile) ──────────────────────────────── */}
      <div className="hidden sm:block rounded-xl border border-slate-900 bg-slate-950/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400">
            <thead>
              <tr className="border-b border-slate-900 bg-slate-950/40 text-slate-500 text-xs uppercase">
                <th className="py-4 px-6">Customer Name</th>
                <th className="py-4 px-6">Contacts</th>
                <th className="py-4 px-6">Location</th>
                <th className="py-4 px-6">Membership Level</th>
                <th className="py-4 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">No customers registered yet.</td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-900/10">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-200">{c.firstName} {c.lastName || ''}</div>
                      <div className="text-xs text-slate-500 font-mono">ID: {c.id}</div>
                    </td>
                    <td className="py-4 px-6 space-y-0.5">
                      <div className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-slate-500" /><span>{c.phone}</span></div>
                      {c.email && <div className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-slate-500" /><span>{c.email}</span></div>}
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-slate-300">{c.city || 'N/A'}, {c.state || 'N/A'}</div>
                      <span className="text-[10px] text-slate-500 block">Franchise: {c.franchise?.name || 'Central'}</span>
                    </td>
                    <td className="py-4 px-6">
                      {c.isGoldMember ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-2.5 py-0.5 text-xs font-bold text-yellow-500">
                            <Award className="h-3 w-3" /> Gold Card
                          </span>
                          <div className="text-[10px] text-slate-500 font-mono">ID: {c.goldCardId}</div>
                        </div>
                      ) : (
                        <span className="rounded-full bg-slate-800/60 px-2.5 py-0.5 text-xs font-medium text-slate-400">
                          Standard
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex justify-center">
                        <button
                          onClick={() => handleToggleGold(c.id, c.isGoldMember)}
                          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                            c.isGoldMember
                              ? 'border border-slate-800 text-slate-400 hover:bg-slate-900'
                              : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 hover:bg-yellow-500/20'
                          }`}
                        >
                          {c.isGoldMember ? 'Revoke Gold' : 'Upgrade Gold'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Mobile Card Layout (visible only on mobile) ───────────────────── */}
      <div className="sm:hidden space-y-3">
        {customers.length === 0 ? (
          <div className="rounded-xl border border-slate-900 bg-slate-950/20 p-6 text-center text-slate-500 text-sm">
            No customers registered yet.
          </div>
        ) : (
          customers.map((c) => (
            <div key={c.id} className="rounded-xl border border-slate-900 bg-slate-950/30 p-4 space-y-3">
              {/* Name + Membership Badge */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-slate-200">{c.firstName} {c.lastName || ''}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {c.id.slice(-8)}</p>
                </div>
                {c.isGoldMember ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] font-bold text-yellow-500 shrink-0">
                    <Award className="h-3 w-3" /> Gold
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-800/60 px-2 py-0.5 text-[10px] font-medium text-slate-400 shrink-0">
                    Standard
                  </span>
                )}
              </div>

              {/* Contact Info */}
              <div className="space-y-1 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                  <span>{c.phone}</span>
                </div>
                {c.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{c.email}</span>
                  </div>
                )}
                <div className="text-[10px] text-slate-500">
                  {c.city || 'N/A'}, {c.state || 'N/A'} · {c.franchise?.name || 'Central'}
                </div>
              </div>

              {/* Action */}
              <button
                onClick={() => handleToggleGold(c.id, c.isGoldMember)}
                className={`w-full rounded-lg py-2 text-xs font-semibold transition-all ${
                  c.isGoldMember
                    ? 'border border-slate-800 text-slate-400 hover:bg-slate-900'
                    : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 hover:bg-yellow-500/20'
                }`}
              >
                {c.isGoldMember ? 'Revoke Gold Membership' : 'Upgrade to Gold'}
              </button>
            </div>
          ))
        )}
      </div>

      {/* ── Add Customer Modal ─────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl border border-slate-800 bg-slate-950 p-5 sm:p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2"><User className="h-5 w-5 text-indigo-400" /> Register Customer</h2>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1.5 hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name — stacks on mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>First Name *</label>
                  <input type="text" required value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} placeholder="Rahul" />
                </div>
                <div>
                  <label className={labelCls}>Last Name</label>
                  <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} placeholder="Kumar" />
                </div>
              </div>

              {/* Phone + Email — stacks on mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Mobile Phone *</label>
                  <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder="9876543210" />
                </div>
                <div>
                  <label className={labelCls}>Email Address</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="rahul@email.com" />
                </div>
              </div>

              <div>
                <label className={labelCls}>Street Address</label>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)} className={inputCls} placeholder="123 Main St" />
              </div>

              {/* City / State / Pincode — stacks on mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>City</label>
                  <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className={inputCls} placeholder="Mumbai" />
                </div>
                <div>
                  <label className={labelCls}>State</label>
                  <input type="text" value={state} onChange={(e) => setState(e.target.value)} className={inputCls} placeholder="Maharashtra" />
                </div>
                <div>
                  <label className={labelCls}>Pincode</label>
                  <input type="text" value={pincode} onChange={(e) => setPincode(e.target.value)} className={inputCls} placeholder="400001" />
                </div>
              </div>

              {/* Branch + Gold toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <div>
                  <label className={labelCls}>Primary Branch</label>
                  <select value={franchiseId} onChange={(e) => setFranchiseId(e.target.value)} className={inputCls}>
                    <option value="">Select Branch</option>
                    {franchises.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2 py-2">
                  <input
                    type="checkbox" id="isGold" checked={isGoldMember} onChange={(e) => setIsGoldMember(e.target.checked)}
                    className="h-4 w-4 rounded-sm border-slate-800 bg-slate-900 text-indigo-600 focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="isGold" className="text-xs font-semibold text-slate-300 cursor-pointer flex items-center gap-1">
                    Activate Gold Card
                  </label>
                </div>
              </div>

              {/* Buttons — full-width on mobile */}
              <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-4">
                <button
                  type="button" onClick={() => setShowModal(false)}
                  className="rounded-lg border border-slate-800 px-4 py-2.5 text-sm font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-900 w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={loading}
                  className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 w-full sm:w-auto"
                >
                  {loading ? 'Saving...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
